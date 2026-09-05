# Go Internals

You don't need the scheduler's source to write good Go, until requests drop under load, GC CPU spikes, a hot path allocates where you swore it wouldn't, or you reach for `unsafe`. This file is the mental models, the exact version deltas, and the handful of internals facts that actually change how you write code. The rest is trivia.

> Verified against Go **1.26.x** (stable, released 10 Feb 2026) + **1.27 RC** draft notes, 2026-06. Baseline **1.22**. Version tags `[1.N]` mark the release a claim applies to. `[verify]` flags a claim not pinned to a primary go.dev source. Deepened from multi-source research, corroborated against go.dev release notes + the GC/runtime guides.

## TL;DR: the modern deltas (read first)

- Green Tea GC is the default collector [1.26]: span-based, memory-locality-aware *marking* (10-40% GC-overhead reduction; ~modal 10%). It's still **non-moving, non-generational, concurrent tri-color mark-sweep**. Green Tea changes *how marking is scheduled* (per-span, not per-object), not the fundamentals. There is **no compaction and no generational GC**, and won't be. Opt out `GOEXPERIMENT=nogreenteagc` (removal slated for 1.27).
- GOMAXPROCS is container/cgroup-aware by default [1.25]: reads the cgroup CPU *limit* (not requests) on Linux and re-checks live. `go.uber.org/automaxprocs` is now redundant. The single most-missed change.
- Goroutine initial stack is 2 KB, not 8 KB (2 KB since 1.4; 8 KB was 1.2-1.3). Stacks are **contiguous and copied**, not segmented; any "segmented stack" claim is a decade stale.
- Typed atomics [1.19] (`atomic.Int64`, `atomic.Pointer[T]`) auto-align and kill the "first struct field must be 64-bit-aligned" footgun. Go atomics are **sequentially consistent only**: no acquire/release/relaxed.
- `reflect.SliceHeader`/`StringHeader` are deprecated [1.20] and GC-racy as literals; use `unsafe.Slice`/`unsafe.String`/`*Data`.
- `//go:linkname` was locked down [1.23] (`-checklinkname=1`): pull-style linknames to unmarked runtime/stdlib symbols no longer link.
- Swiss Tables `map` [1.24]; size-specialized malloc [1.27] (<80 B, not 512 B, a common misattribution to 1.26).

## Table of Contents
1. [Scheduler (GMP Model)](#scheduler)
2. [Garbage Collector](#gc)
3. [Memory Model](#memory-model)
4. [Stack Management](#stacks)
5. [Memory Allocator](#allocator)
6. [Maps (Swiss Tables)](#maps)
7. [Compiler Pipeline: escape analysis, inlining, SSA, PGO](#compiler)
8. [Memory Layout & False Sharing](#layout)
9. [unsafe Package](#unsafe)
10. [Reflection](#reflection)
11. [Compiler Directives](#directives)
12. [Which internals knowledge changes how you write Go](#what-matters)
13. [Version map 1.20→1.27](#versions)
14. [What models get wrong](#stale)
15. [Anti-Patterns](#anti-patterns)
16. [See Also](#see-also)
17. [Sources](#sources)

---

## Scheduler (GMP Model) {#scheduler}

**G** (goroutine, 2 KB initial stack), **M** (OS thread), **P** (logical processor; count = `GOMAXPROCS`). An M must hold a P to run Go code. Each P owns a **local run queue** (256-entry ring) plus a single **`runnext`** slot for the most-recently-readied goroutine: a freshly `go`-spawned G goes to `runnext`, displacing the prior occupant to the local queue tail (latency optimization). One **global run queue** (lock-protected) backstops them.

`findrunnable` order: `runnext`/local queue → global queue (polled ~every 61 schedule ticks, to avoid starving it) → netpoll → **work-stealing** ~half of a random P's local queue. A bounded number of **spinning Ms** actively hunt for work to cut wake-up latency.

sysmon is a dedicated P-less OS thread (20µs-10ms cadence). It: (a) **retakes Ps** stuck in syscalls via `handoffp()`; the blocked M keeps its G, the P goes to another M so other Gs keep running; (b) **preempts** Gs running >10ms (`forcePreemptNS`); (c) background-`netpoll`s; (d) forces a GC if none ran in 2 minutes; (e) **re-evaluates GOMAXPROCS [1.25]**.

Async preemption [1.14]: sysmon sends **SIGURG** to a thread running a long G; the handler redirects to `asyncPreempt`, saving registers at an async-safe point (where stack maps are valid). This is why **tight CPU loops with no function calls can now be preempted**; the pre-1.14 "such loops starve the scheduler" claim is stale.

Netpoller: epoll (Linux) / kqueue (BSD/macOS) / IOCP (Windows). A goroutine blocked on network I/O parks off-M (registered via a `pollDesc`); **zero OS threads are tied up per blocked goroutine**. A *syscall*-blocked goroutine, by contrast, still pins an M for the duration regardless of GOMAXPROCS; that is why unbounded blocking-I/O goroutines exhaust threads.

[1.26] runtime simplification: the dedicated "syscall" P-state was removed; the runtime now checks the goroutine's status to detect syscall/cgo. Part of the work behind: *"The baseline runtime overhead of cgo calls has been reduced by ~30%."* New scheduler metrics landed too: `/sched/goroutines:goroutines` (counts by state), `/sched/threads:threads`, `/sched/goroutines-created:goroutines`.

### GOMAXPROCS: container-aware [1.25] (the high-signal change)

```go
// On 1.25+ in a container, DON'T do this — the runtime already reads the cgroup limit:
import _ "go.uber.org/automaxprocs" // now redundant; stale advice if recommended as mandatory
```

- 1.5 → 1.24: `GOMAXPROCS` defaulted to `runtime.NumCPU()` (logical CPUs, capped by affinity mask).
- **[1.25]** On Linux, the runtime reads the cgroup CPU **bandwidth limit** (`cpu.cfs_quota_us`/`cpu.cfs_period_us` v1, `cpu.max` v2) and defaults to the lower of that and the core count. It **periodically re-checks and adjusts live** (up to ~once/sec).
- Keys off the CPU **limit (quota)**, **not** CPU requests/shares (verbatim: *"The Go runtime does not consider the 'CPU requests' option."*). A pod with only a request and no limit sees unchanged behavior; **set explicit CPU limits in k8s** to benefit.
- Minimum auto value 2 on multi-CPU hosts; fractional quotas round up (1.5 → 2) `[verify — from secondary tour, not the 1.25 notes]`.
- Disable: `GODEBUG=containermaxprocs=0` (ignore cgroup) / `updatemaxprocs=0` (no live update). Applies only if go.mod language ≥ 1.25. `runtime.SetDefaultGOMAXPROCS()` [1.25] re-applies the auto default after a manual override.

GC and runtime tuning details (GOGC/GOMEMLIMIT in practice, pprof, runtime costs): see [performance.md](performance.md#gc-tuning).

---

## Garbage Collector {#gc}

Concurrent **tri-color mark-sweep**, **non-moving, non-generational**. Two brief STW pauses per cycle (sub-100µs each `[verify — exact constant evolves]`) bracket the concurrent mark phase; marking and sweeping run alongside your code. Optimizes latency over throughput. Non-moving means heap pointers stay valid, which is exactly why `unsafe.Pointer`/cgo interop is sound.

### Green Tea GC [1.26 default]

A redesigned **parallel marking** algorithm that is *memory-aware*. The classic tri-color graph flood queues **individual objects**, causing random pointer-chasing. Per the design (issue #73581): *"on average 85% of the garbage collector's time is spent in the core loop of this graph flood... and >35% of CPU cycles in the scan loop are spent solely stalled on memory accesses."* Green Tea instead queues **spans** (8 KiB pages of one size class): a span is enqueued when its first object is marked, accumulates more marked objects while it waits, and when a worker dequeues it, multiple physically co-located objects scan together (sequential access, better cache locality, better many-core scaling).

- Scope: small objects (≤512 B `[verify — from issue #73581, not the release notes]`). Larger objects still use the object-centric path.
- Metadata: inline mark/scan bits at the span's end (objects-to-scan = marked minus scanned); spans queue FIFO with per-worker local queues + work-stealing, mirroring the goroutine scheduler. A span may be revisited multiple times per mark phase.
- SIMD [1.26, amd64]: on Intel Ice Lake / AMD Zen 4 and newer, uses AVX-512 to scan a page's metadata in vector registers; the release notes expect *"an additional 10% GC CPU reduction"* on those CPUs.
- Numbers: *"between 10% and 40% reduction... A 10% reduction... is roughly the modal improvement."* Experimental in 1.25 (`GOEXPERIMENT=greenteagc`), default in 1.26, opt-out `GOEXPERIMENT=nogreenteagc` *expected* removed in 1.27 (the 1.27 draft does **not yet** confirm that removal `[verify]`).
- Not universal: workloads with poor heap locality, low fan-out, or single/dual-core may see neutral results. If you regress, set the opt-out **and file an issue**; it's going away.

### Fundamentals that stay true (and models get wrong)

- Hybrid write barrier [1.8]: a Yuasa-style deletion barrier (shade the overwritten referent) + a Dijkstra-style insertion barrier (shade the new referent). This **eliminated STW stack re-scanning**. Barriers are active **only during the mark phase**; they are not free, which is why allocation-during-mark has cost.
- GC pacing / `GOGC` (default 100): target heap ≈ live heap + (live heap + GC roots) × GOGC/100. Since **[1.18]** the formula includes the **root set** (stacks + globals), not just live heap. `GOGC=off` disables pacing.
- `GOMEMLIMIT` [1.19]: a **soft** limit over the Go heap + runtime-managed memory (excludes binary mappings, C/cgo memory). GC picks the lower of the GOGC trigger and the limit-derived trigger; pairs with `GOGC=off` for "GC only near the limit." A 50% GC-CPU cap (excluding idle) mitigates death spirals. The pre-1.19 GOGC-only + virtual-memory "ballast" hack is **obsolete**.
- Mutator assist: an allocating goroutine that outruns background GC must do proportional mark work, preventing heap overshoot.

```go
// WRONG (pre-1.19 era): allocate a giant idle slice to inflate the live heap and slow GC.
var ballast = make([]byte, 10<<30) // obsolete hack — wastes RSS, fragile

// RIGHT [1.19]: bound real memory with a soft limit; the GC paces itself.
import "runtime/debug"
func init() { debug.SetMemoryLimit(900 << 20) } // or GOMEMLIMIT=900MiB
```

`AddCleanup` [1.24] supersedes `SetFinalizer` (multiple cleanups, interior pointers, no cycle leaks); the `weak` package [1.24] gives weak pointers. Diagnose finalizer/cleanup bugs with `GODEBUG=checkfinalizers=1` [1.25].

---

## Memory Model {#memory-model}

Formally **revised in 2022** to align with C/C++/Java/Rust/Swift and finally specify atomics (spec: `go.dev/ref/mem`). Top-level advice, verbatim: *"If you must read the rest of this document to understand the behavior of your program, you are being too clever. Don't be clever."* Use channels, `sync`, or `sync/atomic`.

The spec uses **"synchronizes-before"** (a partial order) feeding happens-before.

| Operation | Guarantee |
|---|---|
| Goroutine creation | `go f()` synchronizes-before `f` starts |
| Channel send | send synchronizes-before the corresponding receive completes |
| Channel close | close synchronizes-before a receive that returns zero-due-to-close |
| Unbuffered channel | a **receive** synchronizes-before the **send** completes (the reversed edge that surprises people) |
| `sync.Mutex` | the *k*-th `Unlock` synchronizes-before the *k+1*-th `Lock` returns |
| `sync.Once` | `f()` synchronizes-before any `Do(f)` returns |
| `sync/atomic` | if B observes A's effect, A synchronizes-before B; **all atomics behave as one sequentially-consistent order** |

**Atomics are SC-only.** Go has no acquire/release/relaxed orderings, equivalent to C++ SC atomics / Java `volatile`. `atomic.Pointer[T]` was the stdlib's first public generic type.

**Data races are undefined.** A non-atomic write concurrent with another access to the same location is a race; race-free programs are DRF-SC. Unlike Java/JS (defined, bounded), a Go race on ordinary memory is effectively **undefined**: the race detector may crash you, or a multi-word value (interface, slice header, `string`) may **tear**. **There is no benign data race.** Detect with `-race` in CI (`go build -race` / `go test -race`); it uses happens-before analysis and catches races on *exercised* paths.

```go
// WRONG: data race; no synchronizes-before edge — 'ready' may never publish, or 'data' reads 0/torn.
var ready bool
var data  int
func setup() { data = 42; ready = true }
func use()   { for !ready {}; _ = data }

// RIGHT [1.19]: typed atomic gives the edge (and auto-aligns on 32-bit).
var ready atomic.Bool
var data  int
func setup() { data = 42; ready.Store(true) }   // data write synchronizes-before Store
func use()   { for !ready.Load() {}; _ = data } // Load observes Store ⇒ sees 42
```

```go
// WRONG: double-checked locking with a racy read of 'inst'.
var inst *T; var mu sync.Mutex
func get() *T { if inst == nil { mu.Lock(); if inst == nil { inst = &T{} }; mu.Unlock() }; return inst }

// RIGHT: sync.Once (or sync.OnceValue [1.21]) — no cleverness.
var once sync.Once; var inst *T
func get() *T { once.Do(func() { inst = &T{} }); return inst }
```

---

## Stack Management {#stacks}

- Initial size 2 KB (`_StackMin = 2048`) since **[1.4]**; the often-cited 8 KB is the **1.2-1.3** value and is stale.
- Growth: function prologues compare SP against the goroutine's `stackguard`; on overflow, `morestack` → `newstack` allocates a stack **double** the size, copies the old one, and **adjusts every pointer** (precise stack maps make this safe). Stacks are **contiguous and copied**. Max stack 1 GB on 64-bit (250 MB on 32-bit); exceeding it is a fatal "stack overflow."
- Shrink: piggybacks on GC scans; a goroutine using ≤¼ of its stack gets it halved.
- Adaptive sizing [1.19]: initial stacks are sized from the historic average stack usage, cutting early grow/copy churn on long-running servers (at ≤2× waste on below-average goroutines).
- Segmented stacks are gone (removed 1.3-1.4 over the "hot-split" problem). `//go:nosplit` and `morestack` are historical names from that era. **Implication:** stack addresses move on growth; **never** stash a raw pointer to a stack variable via `unsafe` and assume it stays valid across a call that can grow the stack.

---

## Memory Allocator {#allocator}

tcmalloc-derived but diverged. Runtime **page = 8 KiB** (independent of HW page size).

```
Per-P mcache  →  Per-span-class mcentral  →  Global mheap → OS (mmap arenas)
  (lock-free)        (per-class lock)          (global lock)   (64 MiB on 64-bit Linux)
```

- mcache (per-P): lock-free fast path; holds one `mspan` per span class.
- mcentral (per span class): fine-grained lock, refills mcaches; tracks swept/unswept × partial/full sets.
- mheap: single global lock; allocates page runs, obtains arenas from the OS.

| Category | Size | Strategy |
|---|---|---|
| **Tiny** | <16 B, **noscan** (pointer-free) | sub-allocated from a 16-B block in mcache (`tiny`/`tinyoffset`); many packed per slot, nearly free |
| **Small** | 16 B - 32 KB | ~70 size classes (8 B…32 KB); ×2 = 136 **span classes** via the scan/noscan split `[verify — "~70" is a source-comment figure]` |
| **Large** | >32 KB | straight from mheap as contiguous pages |

**scan vs noscan** is the high-signal distinction: pointer-free objects (`spanClass = 2*sizeclass + noscan`) are **never traced** by the GC. This is why `[]byte` is dramatically cheaper to collect than `[]*T`, and why pointer-free struct designs reduce GC cost.

**Stack vs heap is decided at compile time by escape analysis (§7), not by size or `new` vs `&`**; `new(T)` can stay on the stack; `&T{}` can too. **[1.24]** added "more efficient memory allocation of small objects" + a new runtime-internal mutex (`GOEXPERIMENT=nospinbitmutex`), part of a 2-3% average CPU win. **[1.27]** the compiler emits **size-specialized allocation routines**: *"reducing the cost of some small (<80 byte) memory allocations by up to 30%... expected ~1% in real allocation-heavy programs... binary size increase ~60 KB"*; opt-out `GOEXPERIMENT=nosizespecializedmalloc` (removed ~1.28). (Several blogs misattribute this to 1.26 and quote 512 B, both wrong.)

---

## Maps (Swiss Tables) {#maps}

[1.24] the builtin `map` was reimplemented on Swiss Tables (Abseil's open-addressing design with SIMD-friendly control bytes), part of the release's 2-3% CPU reduction. Opt out (temporarily) with `GOEXPERIMENT=noswissmap`. What changed and what didn't:

- No API or semantic change: same iteration-randomization, same "no concurrent read+write," same "map values are not addressable." Just faster lookups/inserts and better growth behavior on large maps.
- Still not goroutine-safe. Concurrent read+write is a fatal `concurrent map read and map write`, not a data race the detector merely flags. Use a `sync.RWMutex`, a sharded map, or `sync.Map` (whose impl was *also* reworked [1.24] onto a hash-trie, much lower modify contention).
- Preallocate when you know the size: `make(map[K]V, n)` sizes the table once and avoids incremental growth/rehash.

```go
m := make(map[string]int, 1024) // RIGHT: one sizing; no rehash churn
// WRONG: shared map written from goroutines without synchronization → fatal runtime throw, not a recoverable error.
```

Concurrent-map decision (sharded vs `sync.Map` vs RWMutex): see [data-structures-and-caching.md](data-structures-and-caching.md#concurrent-maps).

---

## Compiler Pipeline: escape analysis, inlining, SSA, PGO {#compiler}

```
Source → Parse (AST) → Type Check → IR → SSA Generation → SSA Optimization passes → Machine Code → Link
```

The **SSA backend** (`cmd/compile/internal/ssa`) lowers a machine-independent IR through ~40 ordered passes: deadcode, CSE, nilcheck/bounds-check elimination, then arch-specific lowering and register allocation. Payoff: don't hand-optimize what SSA already does (redundant bounds checks, constant folding, register allocation). What you *can* influence is **escape analysis**, **inlining**, and **PGO**.

### Escape analysis

A static data-flow analysis: a variable whose address may outlive its frame is heap-allocated; otherwise it stays on the stack (cheaper, no GC pressure, better locality). Read decisions with `-gcflags=-m` (one `-m`; `-m=2` for the reasoning; add `-l` to disable inlining for a cleaner read); it prints `escapes to heap` / `does not escape` / `moved to heap`.

Common escape triggers: returning a pointer to a local; storing a pointer into a heap object/slice/map/channel; capturing a variable by reference in a closure that escapes; passing a pointer-bearing value to `interface{}` that escapes (`fmt.Println(x)` forces `x` to escape through `...any`); a `make`/slice whose size isn't provably bounded; an object too large for the stack.

Model misconceptions to forbid in your reasoning:

```go
// WRONG belief: "passing &x always escapes." Reality:
func sum(p *int) int { return *p }   // p does not leak
func f() { x := 41; _ = sum(&x) }    // -m: "x does not escape" → stack

// WRONG belief: "new()/&T{} always heaps." Reality: escape analysis decides; both can be stack.
// WRONG belief: "returning a small struct by value escapes." Reality: returned by value → stack/registers.
```

[1.25]/[1.26]: the compiler now stack-allocates **slice backing stores in more situations** (verbatim 1.26: *"...allocate the backing store for slices on the stack in more situations, which improves performance."*). Bisect a suspected regression with the `bisect` tool's `-compile=variablemake`, or disable via `-gcflags=all=-d=variablemakehash=n`. This also *amplifies* the damage from incorrect `unsafe.Pointer` use (issue #73199): a stack-allocated backing array that you aliased via `unsafe` can now move out from under you.

### Inlining

Bottom-up; the leaf budget is **cost 80** (`maxInlineBudget`, the "80-node" hairy limit). The **mid-stack inliner** (non-leaf functions) has existed since [1.9]. Inlining matters because it **unlocks downstream escape-analysis wins**: an inlined callee's locals may then stay on the caller's stack. `-gcflags=-m` also prints `can inline f` / `inlining call to f` / `cannot inline f: ...`; `go tool compile -S file.go` dumps the assembly.

### PGO: Profile-Guided Optimization [1.21]

Drop a `default.pgo` (a CPU profile) next to `main` and the build picks it up automatically.

- Hot-call inlining: raises the budget for hot sites (hot budget ~2000; hotness threshold ~2% of execution time) so hot leaves inline past the cost-80 limit.
- Devirtualization: turns a hot interface call into a concrete static call (then inlinable). Recent escape-analysis work (issue #72036) lets devirtualized paths *also* avoid the heap allocation that the interface call would have forced.
- Adopt PGO **before** hand-tuning hot paths; it's free and re-tunes with each profile. Tuning workflow: [performance.md](performance.md#pgo).

---

## Memory Layout & False Sharing {#layout}

The compiler **does not reorder struct fields**; layout follows source order, with padding inserted to satisfy each field's alignment. Field order is your lever.

```go
// WRONG: 24 bytes — bool/bool force padding around the 8-byte int64 (8+pad, then 1+1+6 pad... → 24).
type Bad  struct { a bool; x int64; b bool }
// RIGHT: 16 bytes — group by descending size; the two bools pack into the tail.
type Good struct { x int64; a bool; b bool }
```

Inspect with `unsafe.Sizeof` / `unsafe.Alignof` / `unsafe.Offsetof`, or the `fieldalignment` analyzer (`go vet -vettool=...`). Don't reorder reflexively; readability usually wins; do it for high-cardinality structs (millions of instances) where bytes × count matters.

**False sharing:** two goroutines hammering different variables that land on the **same 64-byte cache line** serialize through cache coherency. The fix is padding (or `sync/atomic` per-P counters). Don't pad speculatively; measure first (`perf c2c`, or a sharp drop in scaling past N cores).

```go
// Per-shard counter padded to its own cache line to avoid false sharing under contention.
type counter struct {
    n   atomic.Int64
    _   [56]byte // pad to 64B (8 for the int64 + 56)
}
```

`int`/`uintptr`/pointer are word-sized (8 B on 64-bit). `atomic.Int64` auto-aligns to 8 B even on 32-bit, eliminating the classic "first field must be 64-bit-aligned" rule that haunted raw `atomic.AddInt64(&x, …)`.

---

## unsafe Package {#unsafe}

`unsafe.Pointer` bridges arbitrary pointer types and `uintptr`. The GC tracks `unsafe.Pointer` as a pointer; it does **not** track `uintptr`. Misuse → memory corruption, crashes, or silent data loss.

### The 6 valid `unsafe.Pointer` patterns

These are the **only** safe uses (per `pkg.go.dev/unsafe`: *"Code not using these patterns is likely to be invalid today or to become invalid in the future."*).

| # | Pattern | Use |
|---|---|---|
| 1 | `*T1` → `unsafe.Pointer` → `*T2` | reinterpret when layouts/alignment match |
| 2 | `unsafe.Pointer` → `uintptr` (not back) | printing, syscall args |
| 3 | `unsafe.Pointer` → `uintptr` → arithmetic → `unsafe.Pointer`, **one expression** | pointer arithmetic; prefer `unsafe.Add` |
| 4 | `syscall.Syscall` with the `uintptr` produced **in the call's arg list** | syscall ABI |
| 5 | `reflect.Value.Pointer`/`UnsafeAddr` → `unsafe.Pointer`, **same expression** | reflect interop |
| 6 | `reflect.SliceHeader`/`StringHeader` `Data` ↔ `unsafe.Pointer`, only over a **live** slice/string | legacy; **deprecated [1.20]** |

**Cardinal rule:** a `uintptr` must **never be stored in a variable across statements** and converted back; the GC won't keep the referent alive, and the value isn't a tracked pointer. This is the #1 `unsafe` bug models reproduce. `[1.25]/[1.26]` slice-on-stack optimizations make it bite harder.

### Helpers: prefer these

```go
unsafe.Add(ptr, off)     // [1.17] pointer arithmetic (replaces pattern 3 for simple cases)
unsafe.Slice(ptr, n)     // [1.17] slice from ptr+len
unsafe.String(ptr, n)    // [1.20] string from *byte+len
unsafe.SliceData(s)      // [1.20]
unsafe.StringData(s)     // [1.20]
```

```go
// RIGHT [1.20] zero-copy conversions — results MUST NOT be mutated.
func StringToBytes(s string) []byte { // do not mutate result
    if s == "" { return nil }
    return unsafe.Slice(unsafe.StringData(s), len(s))
}
func BytesToString(b []byte) string { // do not mutate b while string lives
    if len(b) == 0 { return "" }
    return unsafe.String(unsafe.SliceData(b), len(b))
}

// WRONG (deprecated, GC-racy): a header literal's Data uintptr is untracked → backing array
// can be collected mid-conversion (an information-leak vulnerability class). NEVER construct one.
func bad(s string) []byte {
    sh := (*reflect.StringHeader)(unsafe.Pointer(&s))
    return *(*[]byte)(unsafe.Pointer(&reflect.SliceHeader{Data: sh.Data, Len: sh.Len, Cap: sh.Len}))
}
```

**When justified:** zero-copy `string`↔`[]byte` on hot paths, cgo buffer interop, struct-field access in serialization libs, lock-free structures with `atomic.Pointer[T]`. **Benchmark first**: the safe version is often as fast (and the compiler optimizes more than you expect). Run `go vet`; consider `go-safer` to catch header-literal misuse.

---

## Reflection {#reflection}

Inspects types/values at runtime. Powerful but ~100× a direct call, and it discards compile-time safety.

The 3 laws: (1) interface value → reflection object (`reflect.TypeOf`/`ValueOf`); (2) reflection object → interface value (`.Interface()`); (3) to modify, the value must be **settable** (came through a pointer).

```go
type User struct{ Name string `json:"name" db:"user_name"` }
t := reflect.TypeOf(User{})
f, _ := t.FieldByName("Name")
fmt.Println(f.Tag.Get("json"), f.Tag.Get("db")) // name user_name
```

Reflect iterators [1.26]: `Type.Fields/Methods/Ins/Outs` and `Value.Fields/Methods` return `iter.Seq` for range-over-func:

```go
for f := range reflect.TypeFor[User]().Fields() { // [1.22] TypeFor + [1.26] Fields()
    fmt.Println(f.Name, f.Tag.Get("json"))
}
```

`reflect.TypeAssert[T]` [1.25] converts a `Value` to a typed Go value without the allocation of `.Interface()`+assert. **Decision:** use **generics [1.18]** for type-parameterized logic; reach for reflection only for genuine runtime type inspection (custom marshaling, ORM field mapping, DI).

---

## Compiler Directives {#directives}

**Public / application-safe:**

- `//go:build`: the **only** supported build-tag syntax since [1.17]; `// +build` is deprecated (gofmt auto-adds the `//go:build` form). Emitting `// +build` is a staleness tell.
- `//go:embed` [1.16]: embed files (needs `import _ "embed"` for the `string`/`[]byte` forms).
- `//go:generate`: `go generate` hook (no compile effect).
- `//go:noinline`: safe; disables inlining for the next func (benchmarks only).
- `//go:fix inline` [1.26]: drives `go fix`'s source-level inliner for your own API migrations.

**Runtime/library-only, unsafe in app code:**

- `//go:noescape`: assembly-implemented func doesn't leak pointer args (wrong → memory corruption).
- `//go:nosplit`: omit the stack-overflow check; must fit the ~768-byte redzone (a misnomer from the segmented-stack era).
- `//go:uintptrescapes`: `uintptr` args may be pointers converted in the call's arg list; keep alive for the call.
- `//go:nowritebarrier(rec)`, `//go:yeswritebarrierrec`, `//go:systemstack`, `//go:norace`, `//go:notinheap`: runtime internals.

### `//go:linkname` hardening: the key [1.23] change

The linker now **rejects** `//go:linkname` references to runtime/stdlib internal symbols **not themselves annotated** with `//go:linkname` on their definition (`-checklinkname=1`, default since the 1.23 release; assembly references likewise restricted). The intent is the **handshake** form (both sides agree). The Go team added compatibility annotations for widely-used existing pulls, but **new** internals (e.g. `coro`, the weak pointers added in 1.23) **can never be linknamed**. Escape hatch (discouraged): `-ldflags=-checklinkname=0`. This broke `goccy/go-json`, `bytedance/sonic`, Vitess. Freely linknaming arbitrary runtime internals is now wrong.

```go
//go:linkname runtime_nanotime runtime.nanotime // breaks on upgrade unless runtime marks it; prefer a public API
func runtime_nanotime() int64
```

---

## Which internals knowledge changes how you write Go {#what-matters}

The 20% that pays rent (everything else is trivia until a profiler says otherwise):

1. **scan/noscan** → prefer pointer-free layouts (`[]byte`, indices, value types) in hot, large, or long-lived data; they're free for the GC to skip. (§5)
2. **Escape analysis is compile-time, not `new` vs `&`** → don't "pass pointers to avoid copies" reflexively; that can *force* a heap escape. Confirm with `-gcflags=-m` before restructuring. (§7)
3. **GOMEMLIMIT, not ballast** → bound memory in containers with a soft limit; set explicit k8s CPU limits so GOMAXPROCS is right. (§2, §1)
4. **Set GOMAXPROCS via the runtime [1.25]** → drop `automaxprocs`; rely on cgroup-awareness. (§1)
5. **Typed atomics + SC semantics** → `atomic.Int64`/`Pointer[T]`; never assume acquire/release; never a "benign" race. (§3)
6. **Adopt PGO before hand-tuning** → it inlines + devirtualizes hot paths for free. (§7)
7. **`unsafe` round-trips in one expression; benchmark before adopting** → and never store a `uintptr` across statements. (§9)
8. **Preallocate maps/slices** with a known size → one sizing, no rehash/regrow churn. (§5, §6)
9. **Field order for high-cardinality structs**; pad only measured false-sharing hot spots. (§8)
10. **`sync.Pool` for high-churn temporaries** → it integrates with the per-P allocator fast path; reuse beats allocate under GC pressure. (§5, performance.md)

---

## Version map 1.20→1.27 {#versions}

| Ver | Internals-relevant |
|---|---|
| **1.20** | `unsafe.String`/`StringData`/`SliceData`; `reflect.SliceHeader`/`StringHeader` **deprecated**; PGO preview |
| **1.21** | **PGO GA** (inlining + devirtualization); `sync.OnceValue`/`OnceFunc`; `panic(nil)`→`*runtime.PanicNilError` |
| **1.22** | Per-iteration loop variables; `math/rand/v2`; `reflect.TypeFor` |
| **1.23** | **`//go:linkname` lockdown** (`-checklinkname=1`); timers/tickers GC'd unreferenced + timer channels synchronous; `weak`/iterator groundwork |
| **1.24** | **Swiss Tables `map`** (`noswissmap`); reworked `sync.Map` (hash-trie); spinbit runtime mutex; more efficient small-object alloc; `weak` pkg; `runtime.AddCleanup`; generic type aliases; `tool` directives |
| **1.25** | **Container-aware GOMAXPROCS** (`containermaxprocs`/`updatemaxprocs`; `SetDefaultGOMAXPROCS`); **Green Tea experimental** (`GOEXPERIMENT=greenteagc`); slice-on-stack in more cases; trace **FlightRecorder**; `testing/synctest` GA; `reflect.TypeAssert`; `checkfinalizers` |
| **1.26** | **Green Tea GC default** (`nogreenteagc`; AVX-512 scan); cgo overhead −~30%; **heap base randomization** (`norandomizedheapbase64`); `goroutineleak` profile (experiment); reflect iterators; `new(expr)`; self-referential generic constraints; slice-on-stack widened; new `/sched/*` metrics |
| **1.27 (RC)** | **Size-specialized malloc** (<80 B, `nosizespecializedmalloc`, removed ~1.28); **generic methods**; **goroutine leak profile GA**; `asynctimerchan` GODEBUG removed (timer channels always synchronous); `encoding/json/v2` GA (error text differs); portable `simd` (experiment); tracebacks include pprof goroutine labels. Draft until GA (~Aug 2026); `nogreenteagc` removal not yet confirmed in the draft. |

---

## What models get wrong {#stale}

| # | Stale/wrong belief | Current reality |
|---|---|---|
| 1 | GC is plain object-by-object tri-color mark-sweep | **Green Tea span-based marking is default [1.26]** |
| 2 | Go has/should add a generational or compacting GC | **No**: non-moving, non-generational; compaction not planned |
| 3 | Goroutine initial stack is 8 KB (or 4 KB) | **2 KB since [1.4]** (8 KB was 1.2-1.3) |
| 4 | Go uses segmented stacks | Removed 1.3-1.4; **contiguous, copied** |
| 5 | GOMAXPROCS = host CPUs; use Uber automaxprocs in containers | **Cgroup-aware by default [1.25]**; automaxprocs redundant |
| 6 | Tight CPU loops can't be preempted / starve the scheduler | **Async SIGURG preemption since [1.14]** |
| 7 | Tune GC only with GOGC; use a memory "ballast" | **GOMEMLIMIT soft limit [1.19]** is the tool |
| 8 | `reflect.SliceHeader`/`StringHeader` for zero-copy | **Deprecated [1.20]**; use `unsafe.String`/`Slice`/`*Data`; literals are GC-racy |
| 9 | Use `// +build` tags | **`//go:build` since [1.17]** |
| 10 | `//go:linkname` can reach any runtime internal | **Locked down [1.23]**; handshake/whitelisted only |
| 11 | Raw `atomic.AddInt64(&x,…)` + worry about field alignment | **Typed atomics [1.19]** auto-align |
| 12 | Go atomics have acquire/release/relaxed orderings | **Sequentially consistent only** (2022 model) |
| 13 | "Benign" data races are fine | Undefined on non-atomic memory; DRF-SC only for race-free |
| 14 | Passing a pointer / `new` always heap-allocates | Escape analysis decides; often stack |
| 15 | PGO doesn't exist / is preview | **GA since [1.21]** |
| 16 | Size-specialized / 512-byte malloc is in 1.26 | It's **[1.27]**, threshold **<80 B** |
| 17 | Hybrid write barrier / STW stack rescan still happens | Hybrid barrier **[1.8]** removed STW rescanning |
| 18 | Go's `map` is the old bucket-chain impl | **Swiss Tables since [1.24]** (same semantics, faster) |
| 19 | The compiler reorders struct fields for you | It does **not**: source order + alignment padding; order is your lever |

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Why wrong | Do instead |
|---|---|---|
| Store `uintptr`, convert back to `unsafe.Pointer` later | GC won't keep referent alive; address may move | Single-expression round-trip or `unsafe.Add` |
| `unsafe` without benchmarking | Often no faster than safe | Benchmark; trust the compiler |
| `//go:linkname` to private runtime APIs | Breaks on upgrade [1.23] | Use a public API; file an issue |
| Constructing `reflect.SliceHeader`/`StringHeader` literals | GC-racy, deprecated | `unsafe.String`/`Slice` + `*Data` |
| Ignoring `-race` in CI | Races are undefined behavior | `go test -race` in CI |
| Tuning `GOGC` without profiling | Latency/memory regressions | Profile (`GODEBUG=gctrace=1`); set `GOMEMLIMIT` |
| `automaxprocs` blank import on 1.25+ | Runtime already does it | Set k8s CPU limits; rely on the default |
| Reflection where generics suffice | ~100× slower, no type safety | Generics [1.18] |
| Assuming stack addresses are stable | Stacks copy on growth | Never `unsafe`-alias a stack variable across calls |
| Unbounded goroutines for blocking I/O | Each syscall-blocked G pins an M | Worker pools / bounded concurrency |
| Memory "ballast" slice | Wastes RSS, fragile | `debug.SetMemoryLimit`/`GOMEMLIMIT` [1.19] |
| Concurrent map read+write without sync | Fatal `concurrent map ...` throw | RWMutex / sharded map / `sync.Map` |

---

## See Also {#see-also}

- [performance.md](performance.md): GOGC/GOMEMLIMIT/Green Tea tuning, PGO workflow, pprof, escape-analysis-in-practice, runtime cost table
- [concurrency.md](concurrency.md): goroutine lifecycle, channels, sync primitives, leak avoidance
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md): GODEBUG, gctrace, `go tool trace`, race detector
- [modern-go.md](modern-go.md): version matrix for language/library features

## Sources {#sources}

- Release notes: go.dev/doc/go1.{14,17,18,19,20,21,22,23,24,25,26,27} (Green Tea default + cgo + heap-randomization + reflect iterators + slice-on-stack [1.26]; container GOMAXPROCS + Green Tea experiment + FlightRecorder [1.25]; Swiss Tables + small-object alloc + spinbit + weak + AddCleanup [1.24]; linkname lockdown [1.23]; size-specialized malloc + generic methods + goroutineleak GA + json/v2 [1.27 draft])
- go.dev/ref/mem (2022 memory model); pkg.go.dev/sync/atomic; research.swtch.com/gomm
- go.dev/doc/gc-guide; go.dev/blog "The Green Tea Garbage Collector" (29 Oct 2025); GitHub issue #73581 (Green Tea design); proposal #17503 (hybrid write barrier)
- pkg.go.dev/unsafe (the 6 patterns); pkg.go.dev/cmd/compile (directives, `-gcflags=-m`); cmd/compile/internal/ssa
- runtime source: `runtime/HACKING.md`, `malloc.go`, `mgcmark_greenteagc.go`; abseil.io/about/design/swisstables
