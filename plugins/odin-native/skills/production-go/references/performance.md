# Performance Profiling and Optimization

Profile before you optimize. Most Go performance problems are **allocation rate** (GC pressure) or **contention** (scheduler stalls), rarely the algorithm. Measure with `pprof`/`trace`, change one thing, A/B with `benchstat`. The toolchain already does constant folding, DCE, bounds-check elimination, inlining, devirtualization, escape analysis, and `memclr`, so don't hand-roll those.

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Tags `[1.N]` mark the release a claim lands in; `[exp 1.N]` = experimental behind a `GOEXPERIMENT`. Triangulated from multi-source research; resolved to go.dev/pkg.go.dev where reports diverged.

## TL;DR: the modern deltas (read first)

- `for b.Loop()` [1.24] replaces `for i := 0; i < b.N`: setup runs *once per `-count`*, params/results stay alive (no manual `sink`), timer is automatic. **Trap:** 1.24/1.25 `b.Loop` *suppressed inlining* of the body (phantom allocs); **[1.26] fixed it**; re-measure any `allocs/op` from 1.24/1.25.
- Green Tea GC is the default [1.26] (span-granular, locality-aware marking): 10-40% less GC overhead on GC-heavy programs, +~10% on AVX-512 amd64. Opt-out `GOEXPERIMENT=nogreenteagc` is **removed in 1.27**. It *reduces*, not eliminates, GC cost; allocation reduction still compounds.
- `runtime.AddCleanup` [1.24] supersedes `runtime.SetFinalizer`: multiple cleanups/object, interior pointers, no cycle leaks, no resurrection, no extra-GC-cycle delay.
- Zero-copy str↔[]byte = `unsafe.String`/`unsafe.Slice` [1.20], never `reflect.StringHeader`/`SliceHeader` (deprecated, GC-invisible, broken under modern stack allocation).
- `defer` is ~1 ns since open-coded defers [1.14]: "avoid defer in hot paths" is stale (exception: defers in a tight loop or >8 per frame fall back to the heap path).
- The compiler stack-allocates slice backing stores in far more cases [1.25][1.26] (incl. `append` growth and some *escaping* slices moved to heap only at return). "Variable-sized backing store always heaps" is stale; verify with `-gcflags=-m`.
- `benchstat` changed: columns are `sec/op`/`B/op`/`allocs/op` + `vs base` with `~` for non-significant (Mann-Whitney U). The library `golang.org/x/perf/benchstat` is deprecated; use `golang.org/x/perf/cmd/benchstat`.

## Table of Contents
1. [Runtime Cost Reference](#runtime-costs)
2. [Profiling Workflow](#profiling-workflow)
3. [CPU Profiling](#cpu-profiling)
4. [Execution Tracer & Flight Recorder](#tracing)
5. [Profile-Guided Optimization (PGO)](#pgo)
6. [Memory Profiling and Escape Analysis](#memory)
7. [Allocation Reduction Patterns](#allocation-reduction)
8. [sync.Pool for Hot-Path Objects](#sync-pool)
9. [String and Slice Optimization](#string-slice)
10. [Inlining](#inlining)
11. [Memory Layout & False Sharing](#memory-layout)
12. [GC Tuning](#gc-tuning)
13. [Benchmarking Methodology](#benchmarking)
14. [SIMD](#simd)
15. [Caching Strategies](#caching)
16. [Library landscape & status](#libraries)
17. [Version map 1.20→1.27](#versions)
18. [Anti-Patterns / What models get wrong](#anti-patterns)

---

## Runtime Cost Reference {#runtime-costs}

Order-of-magnitude estimates on modern amd64/arm64, **not guarantees**. There is no authoritative portable ns/op table (varies by microarch, OS, patch level, PGO/GC state, workload); benchmark on target. Treat as relative.

| Operation | Rough cost | Notes |
|---|---|---|
| Direct call | ~1-2 ns | plus stack-growth check |
| Interface / indirect call | ~2-5 ns | blocks inlining; PGO can devirtualize hot ones |
| `defer` (common case) | **~1 ns** | open-coded `[1.14]`; **was ~50 ns pre-1.14**. Loop/>8 defers fall back to heap path |
| Small heap allocation | ~20-100 ns | + amortized GC scan/sweep; `[1.27]` size-specialized malloc cuts <80 B allocs ~30% |
| Map access (hit) | ~10-30 ns | Swiss Tables `[1.24]` improved this |
| Slice `append` (no grow) | ~1-3 ns | grow = alloc + copy |
| Channel send/recv (uncontended) | ~50-120 ns | buffered slightly cheaper; contended far higher |
| `sync.Mutex` lock+unlock (uncontended) | ~10-25 ns | CAS fast path inlined; slow path outlined `lockSlow`; new internal mutex `[1.24]` |
| Atomic load/store/CAS | ~1-10 ns | CAS under contention much higher |
| Goroutine create / context switch | ~1-2 µs / ~100-200 ns | ~2 KiB initial stack; switch far cheaper than an OS thread |
| cgo call | ~40 ns | `[1.26]` cut baseline ~30% (streamlined thread-state mgmt) |
| L1 hit / main memory | ~1 ns / ~100 ns | the gap is why false sharing and poor locality dominate |

---

## Profiling Workflow {#profiling-workflow}

Measure → identify the limiting resource → use the matching profiler → fix one bottleneck class → re-benchmark. The GC guide says start with **heap profiles** when GC cost matters, and that `alloc_space` (allocation *rate*) is usually the most useful view for cutting GC cost, not `inuse_space` (live memory).

Two front-ends, one backend: `runtime/pprof` (manual/batch) and `net/http/pprof` (`import _ "net/http/pprof"` registers on `http.DefaultServeMux`). **All `/debug/pprof/` paths require GET `[1.22]`.**

| Profile | Samples | Enable | Endpoint |
|---|---|---|---|
| CPU | on-CPU time, ~100 Hz | `pprof.StartCPUProfile`/`Stop` | `/debug/pprof/profile?seconds=30` |
| Heap (`inuse`/`alloc`) | live + cumulative allocs, every `MemProfileRate` (512 KiB) | `pprof.WriteHeapProfile` | `/heap` (`?gc=1`), `/allocs` |
| Block | time blocked on chan/select/timer/sync | `SetBlockProfileRate(n)` (off by default) | `/block` |
| Mutex | contention on `Mutex`/`RWMutex` | `SetMutexProfileFraction(n)` (off by default) | `/mutex` |
| Goroutine | live goroutine stacks | none | `/goroutine` |
| `goroutineleak` `[exp 1.26 / GA 1.27]` | goroutines on an unreachable primitive | `GOEXPERIMENT=goroutineleakprofile` (1.26) | `/goroutineleak` |

`/allocs` and `/heap` are the **same profile**, different default sample type. Block/mutex are **useless unless sampling is enabled in-process first**; skipping it is the #1 mistake. `SetBlockProfileRate(1)`/`SetMutexProfileFraction(1)` cost 5-20% CPU under load; sample instead:

```go
// WRONG — every event; catastrophic under concurrency
runtime.SetBlockProfileRate(1); runtime.SetMutexProfileFraction(1)
// RIGHT — ~1 event per 10000 ns blocked; ~1/100 contention events
runtime.SetBlockProfileRate(10000); runtime.SetMutexProfileFraction(100)
```

Enable globally only at conservative rates, or via an admin endpoint during an incident. **Interpretation trap:** mutex-profile stacks point to the **end of the critical section** that caused contention, not the waiter; since `[1.25]` runtime-internal lock contention matches this too.

Reading: `go tool pprof -http=:8080 cpu.pprof` (**flame graph is the default view `[1.26]`**; graph under `View → Graph`). REPL: `top20 -cum`, `list <fn>`, `peek <fn>`, `disasm`. `flat` = self, `cum` = self + callees (hot leaves by flat, hot paths by cum). **Differential:** `go tool pprof -diff_base=old.pprof new.pprof`. `[1.23]` profile stack depth went 32→128 frames (better deep attribution).

---

## CPU Profiling {#cpu-profiling}

```go
import "runtime/pprof"

func main() {
    f, _ := os.Create("cpu.prof"); defer f.Close()
    if err := pprof.StartCPUProfile(f); err != nil { log.Fatal(err) }
    defer pprof.StopCPUProfile()
    // ... workload
}
// In benchmarks the framework wires it: go test -bench=. -cpuprofile=cpu.prof
```

**Stale-model note:** flame graphs do **not** need `uber/go-torch` (deprecated); `go tool pprof -http` renders them natively and they're the default view in 1.26.

---

## Execution Tracer & Flight Recorder {#tracing}

`runtime/trace` records goroutine create/block/unblock, scheduler latency, syscalls, GC, heap-size changes, P start/stop with ns timestamps + stacks. It reveals what CPU sampling cannot: a channel bottleneck shows as the *absence* of execution. Use **CPU profile** for where time goes; **trace** for why goroutines aren't running. Annotate with a **task** (spans goroutines via `context.Context`, one request) and a **region** (same-goroutine interval, one stage):

```go
trace.Start(f); defer trace.Stop()             // or: go test -trace=trace.out; go tool trace trace.out
ctx, task := trace.NewTask(ctx, "http_request"); defer task.End()
trace.WithRegion(ctx, "db", func() { queryDB(ctx) })
```

**Overhead is stale folklore.** Pre-1.21 tracing cost ~10-20% CPU; `[1.21]` cut traceback cost ~10× (≈1-2%), and `[1.22]` made the format splittable, enabling continuous tracing/flight recording. `[1.23]` flushes trace data on uncaught panics.

### Flight Recorder `[1.25]`

A sliding in-memory ring buffer over the trace: snapshot only the window *before* a rare event (timeout, latency spike) instead of spooling continuously. Lives in **`runtime/trace`** (the `golang.org/x/exp/trace` prototype is outdated).

```go
fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
    MinAge:   10 * time.Second, // retain ≈ this long; set ~2× your debug window
    MaxBytes: 10 << 20,         // memory cap — TAKES PRECEDENCE over MinAge
})
if err := fr.Start(); err != nil { log.Fatal(err) }
defer fr.Stop()
if dur > 500*time.Millisecond { f, _ := os.Create("incident.trace"); fr.WriteTo(f); f.Close() }
```

API: `Start() error`, `WriteTo(io.Writer) (int64, error)`, `Stop()`, `Enabled() bool`; defaults `MinAge` 10 s, `MaxBytes` 10 MiB. **Only one** recorder per process; one `WriteTo` at a time (`Stop` blocks until in-flight writes finish); may coexist with a `trace.Start` consumer.

### Goroutine-leak profile `[exp 1.26 → GA 1.27]`

Piggybacks on the GC reachability graph: flags a goroutine blocked on a channel/`Mutex`/`Cond` whose primitive is **unreachable from any runnable goroutine or global root** (topologically impossible to unblock): **zero false positives**, zero overhead unless in use. Cannot detect leaks via primitives still reachable through globals/live locals. Makes leaks *runtime-profiled data*, superseding `go.uber.org/goleak` for production detection.

---

## Profile-Guided Optimization (PGO) {#pgo}

PGO feeds a representative **CPU pprof profile** back to the compiler, which then inlines hot functions more aggressively and **devirtualizes hot interface calls**. Whole-program: all packages incl. dependencies are recompiled. Preview `[1.20]`, **GA `[1.21]`** with `-pgo=auto` default. Realistic gain **2-14%**, zero code change, the cheapest big win.

```bash
curl -o cpu.pprof "http://service:6060/debug/pprof/profile?seconds=30"
mv cpu.pprof ./cmd/server/default.pgo   # MAIN package dir; commit to VCS — auto-detected [1.21+]
go build ./cmd/server                   # explicit: -pgo=./path.pprof or -pgo=off
go version -m ./server | grep pgo       # verify applied
go tool pprof -proto a.pprof b.pprof > default.pgo   # merge profiles for robustness
```

**Truths & pitfalls:** microbenchmarks are *bad* PGO profiles (sliver of program → tiny gains); use real traffic; the go command **errors** if `default.pgo` is in a non-main package; profiles are **portable across GOOS/GOARCH**; **source-stable** (last week's profile matches today's build by in-function line offsets; PGO-on-PGO doesn't flap, so no two-stage canary); a stale profile optimizes cold paths but won't *slow* hot ones. **Build overhead is no longer a reason to skip it `[1.23]`**: from 100%+ on large builds down to single-digit %. Field data: Datadog ~5.4% (1.21), >10% on some 1.22 services; Uber runs it fleet-wide. "PGO only affects layout, not inlining" is wrong; it raises the inlining budget for hot call sites (see [Inlining](#inlining)).

---

## Memory Profiling and Escape Analysis {#memory}

The compiler decides stack (pointer bump, auto-freed) vs heap (GC-traced). Read the decisions as **evidence, not folklore** (heuristics change per release):

```bash
go build -gcflags='-m' ./...            # "moved to heap" / "escapes to heap" / "does not escape" / "leaking param"
go build -gcflags='-m=2' ./...          # + reasons + inlining (also -m -m); scope: -gcflags='pkg/path=-m'
```

### Common escape causes & minimal fix

| Cause | Why | Fix |
|---|---|---|
| Returning `&local` | pointer outlives the frame | often fine; a *value* return may stack-allocate at the caller |
| Concrete value → `interface` | non-pointer/large payloads are **boxed** on the heap | keep hot paths concrete; avoid `any` in inner loops |
| `...interface{}` variadics (`fmt.Sprintf`, `log.Printf`) | every arg is boxed | precompute strings; `strconv.AppendInt`/`Builder` |
| Closure captured + used after return / stored | closure + capture escape together | pass values as args; don't capture in loop-spawned goroutines |
| Slice/map/buffer stored beyond the function | reachable after return | pool or pre-size; pass a caller-owned buffer in |
| Method via interface of unknown impl | compiler must assume escape | concrete types enable devirtualization + non-escape |
| `reflect`/`unsafe` defeating analysis | analysis gives up | isolate off the hot path |

Interface boxing: assigning a non-pointer value to `any` allocates a 2-word `(type, data)` pair and heap-copies the value, **except** integers 0-255 (interned `staticuint64s`, no alloc) and pointers (the interface already holds one). Structs/floats/large ints allocate. Boxing also blocks inlining + devirtualization. Fix with generics (monomorphized) or a pointer:

```go
type Payload struct{ ID int64; Data [256]byte }
func process(v any)            { /* ... */ }   // WRONG — heap-copies Payload per call
func process[T any](v T)       { /* ... */ }   // RIGHT — no boxing
func processPtr(v *Payload)    { /* ... */ }   // RIGHT — skips the deep copy
```

More stack allocation `[1.25][1.26]`: the compiler now keeps far more off-heap. `[1.25]` some small variable-sized `make([]T, 0, n)` get a speculative stack buffer; `[1.26]` `append` can start from one, and some *escaping* slices are built on-stack then moved to the heap only at the return boundary. So `var s []T` + append-growth → `make([]T, 0, 10)` can drop allocs to **zero**, not just one. Bisect a suspected bad stack-alloc with `-gcflags=all=-d=variablemakehash=n` (disables the `variablemake` optimization `[1.25+]`).

> **[verify]** Single-source (weak SO citation): static *array* stack allocation is capped at `MaxStackVarSize` ≈ 128 KB `[1.24]` (64 KB with `smallframes`); larger static arrays unconditionally heap. Plausible and orthogonal to the slice-stack work above, but uncorroborated; verify the number before relying on it.

---

## Allocation Reduction Patterns {#allocation-reduction}

```go
users := make([]User, 0, len(ids))          // pre-alloc: fewer reallocs AND better stack-alloc odds [1.25/1.26]
index := make(map[string]*User, len(users)) // also avoids incremental rehashing
buf.Reset()                                  // reuse buffers across iterations; clear(m)/clear(s) [1.21] zero in place
key := strconv.Itoa(id)                      // avoid fmt.Sprintf in hot paths (reflection + boxing)
```

Small structs by value beat pointer indirection (no heap, better locality). `io.ReadAll` is efficient `[1.26]` (~2× faster, ~50% less alloc); prefer it over hand-rolled buffers. **Analyzer-encoded wins models overlook** (staticcheck/gopls): `range s` not `range []rune(s)` (the conversion allocates); `w.Write(b)` not `io.WriteString(w, string(b))` (the conversion copies); `m[string(b)]` keeps a compiler copy-avoidance optimization; **don't** hoist `k := string(b)`; `fmt.Appendf(dst, ...)` not `[]byte(fmt.Sprintf(...))`; `WriteString(x); WriteString(y)` not `WriteString(x+y)`.

---

## sync.Pool for Hot-Path Objects {#sync-pool}

Per-P sharded free list with a **victim cache** `[1.13]`: a pooled object survives at most **one** GC, then is dropped, *not* a persistent cache, and *not* worth it for cheap/infrequent allocations. The docs say it's for "temporary objects silently shared among concurrent independent clients," explicitly **not** a per-object free list inside a short-lived object.

```go
// New returns a POINTER — a non-pointer in an interface forces an extra heap alloc (staticcheck SA6002)
var bufferPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}

func handle(data []byte) []byte {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset()                 // MUST reset — Get returns a prior user's state
    defer bufferPool.Put(buf)
    return buf.Bytes()          // ... use buf
}
```

**Traps:** forgetting `Reset()` leaks the previous request's data (a *correctness* bug); pooling values not pointers → extra alloc per `Put` (SA6002); no size guard on variable buffers → a giant buffer recycled forever; guard `if buf.Cap() <= maxKeep { bufferPool.Put(buf) }`; pooling objects that escape into long-lived structures → use-after-recycle; pooling tiny (<~64 B) objects → cross-P bookkeeping costs more than an alloc. `Get`/`Put` is ~3 ns on the per-P fast path, ~20 ns on a steal; always benchmark; for rare allocations ROI is negative.

---

## String and Slice Optimization {#string-slice}

```go
// strings.Builder = write→string (cheapest); bytes.Buffer = read+write. s += x in a loop is O(n²).
var b strings.Builder
b.Grow(estimate)                        // single preallocation
for _, s := range parts { b.WriteString(s) }
result := b.String()                    // no copy — Builder hands out its backing bytes
// Do NOT copy a strings.Builder after first write — go vet copylocks flags it.

// Substring/subslice leak: slicing keeps the WHOLE backing array alive
small := strings.Clone(big[:10])        // [1.20] independent copy → big can be GC'd
keep := make([]int, 3); copy(keep, src[:3])  // independent copy releases the big slice
```

**Zero-copy `string`↔`[]byte` (`unsafe.String`/`unsafe.Slice` `[1.20]`):**

```go
s := unsafe.String(unsafe.SliceData(b), len(b)) // []byte→string, no copy; b MUST NOT be mutated after
b := unsafe.Slice(unsafe.StringData(s), len(s)) // string→[]byte, no copy; result is READ-ONLY (write = UB)
```

Helpers `[1.20]`: `unsafe.String`/`StringData`/`Slice`/`SliceData` **replace** `reflect.StringHeader`/`SliceHeader`, which are deprecated and dangerous (fields aren't GC-visible; break under stack-allocation/`variablemake`). The backing memory must outlive the alias; never write through a string-derived slice. **Models still emit the `*reflect.StringHeader` cast; that's the deprecated idiom.**

---

## Inlining {#inlining}

The compiler inlines if cost ≤ 80 (`inlineMaxBudget`, a heuristic; each AST node ≈ 1, but `append`/`make` cost more) and there's no disqualifier. Inspect with `go build -gcflags='-m=2'` (`can inline f` / `inlining call to f` / `cannot inline g: ... cost N exceeds budget 80`).

- **Mid-stack inlining since `[1.9]`:** non-leaf functions inline. The "fast path inlines, slow path outlined" idiom (`sync.Mutex.Lock` → `lockSlow`) gives a ~14% Lock win.
- **PGO `[1.21+]` raises the budget for hot call sites** to `inlineHotMaxBudget = 2000`; a too-costly function can inline on a hot path.
- **The disqualifier set has shrunk.** `recover`/`select`/`go`/some `defer`/labeled `break`/`for` loops historically blocked it; the loop restriction has progressively relaxed. **Don't assert "loops/`defer` block inlining"**; verify with `-gcflags=-m`. `//go:noinline` forces off; `go fix` `[1.26]` supports `//go:fix inline`.

---

## Memory Layout & False Sharing {#memory-layout}

Each field aligns to its size; the struct aligns to its widest field; padding fills gaps. Order fields **largest → smallest** to minimize padding; smaller structs = less memory *and* less GC scanning.

```go
type S struct { a bool; b int64; c bool } // WRONG: 24 B (two 7-byte holes)
type S struct { b int64; a bool; c bool } // RIGHT: 16 B
```

Inspect with `unsafe.Sizeof`/`Alignof`/`Offsetof`. Lint with `fieldalignment` (`golang.org/x/tools/.../fieldalignment`, runnable `-fix`); **off by default in `go vet`** (its docs say findings rarely matter). Alignments: slice 24 B, string/interface 16 B, int64/float64/pointer/map/chan/func 8 B, int32/rune 4 B, int16 2 B, bool/byte 1 B.

**False sharing:** two variables written by different cores in one 64-byte cache line make the line ping-pong across the coherence protocol. **The most-compact field order can *cause* this** by colocating independently-updated fields. Pad hot, independently-written fields to a full line:

```go
type Metrics struct { a, b atomic.Int64 }              // WRONG — one line; severe ping-pong
type Metrics struct { a atomic.Int64; _ [56]byte; b atomic.Int64 } // RIGHT — 8 + 56 = separate lines
```

Cache line is 64 B mainstream; pad to **128 B only if a profile shows residual false sharing** (some Apple silicon / aggressive prefetch behaves as 128 B, not single-source). `golang.org/x/sys/cpu.CacheLinePad` is the public helper. **Compact by default; de-compact only after contention profiling.**

---

## GC Tuning {#gc-tuning}

GOGC is the CPU↔memory knob. Target heap: `target = live + (live + roots) * GOGC/100`. **Roots (stacks + globals) are included since `[1.18]`** (previously only live heap). Default 100 (GC when heap ~doubles). **Doubling GOGC ≈ doubles heap overhead and ≈ halves GC CPU**, and vice versa. `GOGC=off` / `debug.SetGCPercent(-1)` disables pacing.

GOMEMLIMIT: soft memory limit `[1.19]` (`debug.SetMemoryLimit` or env, IEC suffixes). Covers the heap + all runtime-managed memory; **excludes** the binary mapping, cgo/non-Go, OS-held memory. Soft: the runtime may exceed it rather than die.
- Container: set ~5-10% below the cgroup hard limit so it GCs/returns before the OOM killer. Reads the cgroup *limit*, not requests.
- Max-throughput: `GOGC=off GOMEMLIMIT=<N>`; grow to the limit, GC only there.
- Death-spiral risk: near the limit the GC fires ever more often; built-in mitigation caps it at **~50% CPU** (it breaches the limit instead of spiraling). Watch `GCCPUFraction`; if a low limit causes constant GC, fix the limit or shrink the heap; don't keep tuning GOGC.
- The **heap-ballast** hack is obsolete; `GOMEMLIMIT` replaces it. Don't emit ballast code.

Green Tea GC `[exp 1.25 → default 1.26]` is locality-aware: instead of chasing pointers depth-first (erratic → ~35% of mark time in cache misses), it scans small objects at **8 KiB span granularity** (FIFO page worklist + SIMD metadata). Default `[1.26]`, no flag; **10-40% less GC overhead** on GC-heavy programs, **+~10%** from vector scanning on newer amd64. Opt-out `GOEXPERIMENT=nogreenteagc` **removed in 1.27**. Doesn't change GOGC/GOMEMLIMIT semantics; allocation/pointer-density reduction stays a *multiplicative* win.

Observability: `GODEBUG=gctrace=1` (one line/GC: wall/CPU, heap goal, `GCCPUFraction`); `checkfinalizers=1` `[1.25]` diagnoses finalizer mistakes. Prefer `runtime/metrics` over `ReadMemStats`; `[1.26]` adds `/sched/...` metrics. **Container-aware `GOMAXPROCS` `[1.25]`** honors the cgroup CPU limit, obsoleting `uber-go/automaxprocs` for most uses (`GODEBUG=containermaxprocs=0` to disable).

Finalizers/cleanups/weak: `runtime.AddCleanup(ptr, fn, arg)` `[1.24]` supersedes `SetFinalizer` (multiple cleanups, interior pointers, no cycle leaks/resurrection/delayed free; runs in parallel `[1.25]`); it **panics** if `arg` is the exact pointer being cleaned.

```go
runtime.SetFinalizer(res, func(r *Resource) { syscall.Close(r.fd) }) // WRONG [pre-1.24] — resurrection/cycle risk
runtime.AddCleanup(res, func(fd int) { syscall.Close(fd) }, res.fd)  // RIGHT [1.24] — object & arg decoupled
```

`weak` package `[1.24]` (`weak.Pointer[T]`) + `maphash.Comparable` `[1.24]` for caches/canonicalization maps that shouldn't pin memory; models reach for finalizer hacks instead.

---

## Benchmarking Methodology {#benchmarking}

```go
// CORRECT [1.24+] — setup once per -count; params/results kept alive; timer automatic; no sink needed
func BenchmarkEncode(b *testing.B) {
    data := makeInput(); b.ReportAllocs()
    for b.Loop() { result = Encode(data) }
}
// OLD / error-prone — setup re-run during b.N calibration; result may be DCE'd
func BenchmarkEncode(b *testing.B) {
    data := makeInput(); b.ResetTimer()
    for i := 0; i < b.N; i++ { Encode(data) }   // discarded → compiler may delete the call
}
```

Why `b.Loop` wins: body runs **once per `-count`** (heavy setup isn't repeated across calibration); it keeps params/results/assigned vars alive (compiler can't DCE; the old package-level `sink` is gone); timer is built in. **Critical `[1.26]`:** 1.24/1.25 `b.Loop` *suppressed inlining* of the body → phantom allocations, benchmarks looking slower than real code; `[1.26]` fixed it; **re-measure `allocs/op` from 1.24/1.25**. `b.Loop` does **not** remove timer control when an iteration needs re-setup: `b.StopTimer(); fillRandom(x); b.StartTimer()`.

```bash
go test -bench=. -benchmem -count=10 > old.txt   # ≥10 runs; ...change...; > new.txt
benchstat old.txt new.txt
```

Modern output: columns `sec/op`/`B/op`/`allocs/op`, each `median ± variation`, + a `vs base` column (`% (p=… n=…)`). `~` = **no statistically significant difference** (default α=0.05, **Mann-Whitney U**, `-delta-test=utest|ttest|none`); geomean always shown; no outlier rejection (the old IQR rejection assumed normality). **Models emit the old format** (`name old time/op new time/op delta`, `-geomean`) and the deprecated library `golang.org/x/perf/benchstat`/`rsc.io/benchstat`; current is `go install golang.org/x/perf/cmd/benchstat@latest`. **`testing.AllocsPerRun` panics `[1.25]` if parallel tests are running** (result meaningless then). Don't optimize to pass a microbenchmark; optimize for the real workload a *profile* identified.

---

## SIMD {#simd}

`[exp 1.26]` `simd/archsimd` exposes **amd64** 128/256/512-bit vector types/ops without assembly or cgo, behind `GOEXPERIMENT=simd`. The API is **architecture-specific, non-portable, not covered by the Go 1 promise** and changes release-to-release (1.27 revises amd64, adds arm64 Neon / Wasm SIMD). A **portable, vector-size-agnostic `simd` package** appears experimentally in the `[1.27]` notes (two-level design). **Do not** present it as production-ready/portable/stable or invent type/function names; read the live package docs. (Green Tea's internal GC scanning already uses SIMD `[1.26]`, separate from this package.) SIMD vectors must stay local stack values; taking their address forces a heap escape that negates the win.

---

## Caching Strategies {#caching}

```go
import "github.com/dgraph-io/ristretto/v2"   // default pick: concurrent, TinyLFU admission
cache, _ := ristretto.NewCache(&ristretto.Config[string, []byte]{
    NumCounters: 1e7, MaxCost: 1 << 30, BufferItems: 64,
})
cache.Set("key", value, int64(len(value))) // cost = size; Set is async
cache.Wait()                                // before a read-after-write
val, found := cache.Get("key")
```

| Library | Best for | Key feature |
|---|---|---|
| **ristretto/v2** | General, high throughput | TinyLFU admission, concurrent, generic |
| `golang/groupcache` | Distributed, immutable data | Consistent hashing, request dedup |
| `sync.Map` | Read-mostly / disjoint-key churn | Zero deps; hash-trie reimpl `[1.24]` widened its sweet spot |
| `map` + `sync.RWMutex` | Write-heavy / contended keys / range-with-mutation | Full control, no deps |

**`sync.Map` vs `map`+`RWMutex`:** `sync.Map` for read-mostly/append-mostly with many goroutines and disjoint keys; plain `map` behind a mutex for write-heavy/contended keys. The `[1.24]` rewrite widened where `sync.Map` wins, but it still boxes keys/values into `any` (alloc). **Cache the serialized bytes, not the Go struct**; avoids re-serialization per hit. Strategy/Redis detail: [data-structures-and-caching.md](data-structures-and-caching.md#caching-strategies).

---

## Library landscape & status {#libraries}

| Use | Current (preferred) | Superseded / deprecated | Since |
|---|---|---|---|
| Benchmark loop | `for b.Loop()` | `for i := 0; i < b.N` (still works) | `[1.24]` |
| Benchmark stats | `golang.org/x/perf/cmd/benchstat` (`sec/op`) | `golang.org/x/perf/benchstat` (lib), `rsc.io/benchstat` | ~2022 |
| Flame graphs | `go tool pprof -http` (native, default) | `uber/go-torch` | `[1.26]` default |
| Continuous low-overhead trace | `runtime/trace.FlightRecorder` | `golang.org/x/exp/trace` (prototype) | `[1.25]` |
| Goroutine-leak detection | `goroutineleak` profile | `go.uber.org/goleak` (fine for tests) | `[1.26→1.27]` |
| `GOMAXPROCS` in containers | stdlib (cgroup-aware) | `uber-go/automaxprocs` | `[1.25]` |
| Zero-copy str/bytes | `unsafe.String`/`Slice`/`StringData`/`SliceData` | `reflect.StringHeader`/`SliceHeader` | `[1.20]` |
| Object finalization | `runtime.AddCleanup` | `runtime.SetFinalizer` | `[1.24]` |
| Memory ceiling | `GOMEMLIMIT` / `debug.SetMemoryLimit` | heap-ballast hack | `[1.19]` |
| GC/runtime metrics | `runtime/metrics` | `runtime.ReadMemStats` (heavier) | `[1.16]` |
| Struct-layout lint | `fieldalignment` (opt-in, `-fix`) | none (not in default vet) | none |
| SIMD | `simd/archsimd` (exp, amd64) + portable `simd` (exp) | hand-written asm / codegen | `[1.26]`/`[1.27]` |
| In-memory cache | `dgraph-io/ristretto/v2` | none | none |

External continuous profilers (Datadog, Google Cloud Profiler, Pyroscope/Grafana) consume the same pprof format, the standard way to source representative PGO profiles from production.

---

## Version map 1.20→1.27 {#versions}

| Ver | Performance-relevant |
|---|---|
| **1.18** | GC target formula includes roots (stacks+globals) |
| **1.19** | `GOMEMLIMIT` / `debug.SetMemoryLimit` (soft, ~50% GC-CPU cap) |
| **1.20** | PGO preview; `unsafe.String`/`Slice`/`StringData`/`SliceData`; `strings.Clone` |
| **1.21** | **PGO GA** (`-pgo=auto`, 2-14%); trace overhead −~10×; `clear()` |
| **1.22** | trace format splittable; `/debug/pprof/` requires GET; PGO devirtualization |
| **1.23** | PGO build overhead → single-digit %; hot-block alignment; profile depth 32→128; trace flush on panic |
| **1.24** | `b.Loop`; `runtime.AddCleanup`; `weak` pkg; `maphash.Comparable`; Swiss-Tables `map`; hash-trie `sync.Map`; new internal mutex; cgo `#cgo noescape`/`nocallback` |
| **1.25** | Green Tea (exp); Flight Recorder; container-aware `GOMAXPROCS`; `testing/synctest` GA; more slice-stack alloc; `AllocsPerRun` panics under parallel; `checkfinalizers=1`; `reflect.TypeAssert` |
| **1.26** | **Green Tea default** (10-40% less GC); `b.Loop` stops suppressing inlining; cgo −30%; pprof flame default; `goroutineleak` (exp); `simd/archsimd` (exp); `errors.AsType`; `io.ReadAll`/`fmt.Errorf` lower-alloc; `/sched/...` metrics |
| **1.27 (RC)** | Green Tea opt-out removed; `goroutineleak` GA; size-specialized malloc <80 B (~30%/~1%); portable `simd` (exp) + `archsimd` arm64/Wasm; `encoding/json/v2` GA; `asynctimerchan` GODEBUG removed. Draft until GA (~Aug 2026). |

---

## Anti-Patterns / What models get wrong {#anti-patterns}

1. **`for i := 0; i < b.N` + `ResetTimer` + manual `sink`**: use `for b.Loop()` `[1.24]`; re-measure `allocs/op` from 1.24/1.25 (inlining fix `[1.26]`).
2. **Old benchstat format/lib** (`time/op`/`delta`, `rsc.io/benchstat`); current is `golang.org/x/perf/cmd/benchstat`, `sec/op`/`vs base`, `~` = not significant.
3. **`SetBlockProfileRate(1)`/`SetMutexProfileFraction(1)` in prod**: 5-20% CPU; sample at `10000`/`100`. Reading `/block`/`/mutex` without enabling sampling = empty profile.
4. **"`defer` is slow in hot paths"**: open-coded `[1.14]`, ~1 ns (exception: loop/>8 defers).
5. **`reflect.StringHeader`/`SliceHeader` for zero-copy**: deprecated, GC-invisible; use `unsafe.String`/`Slice` `[1.20]`.
6. **`runtime.SetFinalizer`**: superseded by `runtime.AddCleanup` `[1.24]`.
7. **Heap-ballast trick**: obsolete; use `GOMEMLIMIT` `[1.19]`.
8. **"Variable-sized slice backing always heaps"**: stale `[1.25][1.26]`; verify `-gcflags=-m`.
9. **Boxing a scalar in `any` to "avoid allocation"**: only ints 0-255 and pointers are free; the rest heap-copy.
10. **`sync.Pool` of values, no `Reset`, no size guard**: extra alloc (SA6002), stale-data leak, memory bloat; Pool is cleared across GC.
11. **"Most-compact struct order is always best"**: it can *cause* false sharing; compact by default, de-compact after contention profiling.
12. **"PGO isn't worth the build hit"**: single-digit % since `[1.23]`; profile with real traffic; commit `default.pgo`.
13. **"Green Tea is just an experiment"**: default `[1.26]`; opt-out removed in 1.27. Allocation reduction still compounds.
14. **"Loops/`defer` block inlining"**: over-generalized; check `-gcflags=-m`.
15. **"Tracing is too expensive for prod"**: ~1-2% since `[1.21]`; Flight Recorder `[1.25]` lives in `runtime/trace`, not `x/exp/trace`.
16. **`go-torch` for flame graphs**: deprecated; `go tool pprof -http` is native (default `[1.26]`). **`uber-go/automaxprocs`**: stdlib is cgroup-aware `[1.25]`.
17. **"No built-in goroutine-leak profile"**: `goroutineleak` exp `[1.26]`, GA `[1.27]`.
18. **`simd/archsimd` as stable/portable**: experimental, amd64-only, unstable `[1.26]`.
19. **`s += x` in a loop** (O(n²)) / **`fmt.Sprintf` in hot paths** (reflection + boxing); use `strings.Builder`/`strconv`/`fmt.Appendf`.
20. **A fixed ns/op cheat sheet**: no authoritative portable table exists; costs above are relative.

---

## See Also {#see-also}

- [observability.md](observability.md): continuous profiling, runtime metrics, slog
- [internals.md](internals.md): GC internals, memory allocator, scheduler, compiler
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md): pprof/trace workflows, stack traces
- [concurrency.md](concurrency.md): goroutine lifecycle, sync primitives, contention
- [data-structures-and-caching.md](data-structures-and-caching.md#caching-strategies): cache strategies, weak refs, sharded maps
- [modern-go.md](modern-go.md#runtime): Green Tea, version matrix
- [testing.md](testing.md#benchmarks): benchmark mechanics, `b.ReportAllocs`

## Sources {#sources}

- go.dev/doc/go1.20-go1.27 release notes; tip.golang.org/doc/go1.27
- go.dev/doc/gc-guide; go.dev/doc/pgo; go.dev/doc/diagnostics
- go.dev/blog/{pprof, greenteagc, flight-recorder, execution-traces-2024, pgo, testing-b-loop}
- pkg.go.dev/{runtime, runtime/pprof, net/http/pprof, runtime/trace, runtime/debug, runtime/metrics, sync, unsafe, golang.org/x/perf/cmd/benchstat, simd/archsimd}
- golang/proposal 48409 (soft memory limit), 55022 (PGO), 60773 (tracer overhaul), 19348 (mid-stack inlining), 73787 (SIMD); go.dev/issue 73581 (Green Tea), 74609 (goroutineleak)
- staticcheck SA6002 (pool pointers); gopls `fieldalignment` analyzer docs; Dave Cheney "High Performance Go Workshop"; dgryski/go-perfbook
