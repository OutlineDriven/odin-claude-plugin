# Debugging and Diagnostics

Pick the right lens: **pprof** = *where* time/memory went (statistical, always-on); the **execution tracer** = *why a goroutine wasn't running* (temporal: scheduling, blocking, GC timing); **`dlv`** = step one process or read a core post-mortem; **`-race`** = test shared-memory-unsafety. The last two years didn't change *how* to debug Go: they changed which tools are production-viable and which defaults moved underneath you.

> Verified against Go **1.26.4** (stable) + **1.27 RC1** (GA ~Aug 2026), `dlv` **v1.27.0**. Version tags `[1.N]` mark the release a claim applies to.

## TL;DR: the modern deltas (read first)

- Execution tracing is now production-viable. Frame-pointer unwinding [1.21] cut tracer overhead from ~10-20% CPU to **~1-2%**; the streaming format + rewritten parser [1.22] stop `go tool trace` from loading the whole trace into RAM. "Tracing is too expensive for prod" is **stale**.
- `trace.FlightRecorder` is in `runtime/trace` [1.25]: an in-memory ring buffer you snapshot *on anomaly* (was `golang.org/x/exp/trace`; models still cite x/exp). Highest-leverage upgrade for tail-latency debugging.
- `goroutineleak` profile: GC-reachability leak detection. Experimental `GOEXPERIMENT=goroutineleakprofile` [1.26]; **GA + flag-free [1.27]** at `/debug/pprof/goroutineleak`. No false positives; misses leaks whose primitive stays globally reachable.
- `GOMAXPROCS` is cgroup-aware [1.25] → `go.uber.org/automaxprocs` is **largely redundant** on Linux. **`GOMEMLIMIT` is NOT cgroup-aware**: still needs `automemlimit` or templating.
- `-race` does not halt by default: it prints and *continues*. Set `GORACE="halt_on_error=1"` in CI. It's a *data*-race detector: logical/ordering races stay silent and `recover()` can't catch one.
- `debug.Stack()` / `debug.PrintStack()` are current-goroutine only. All goroutines = `runtime.Stack(buf, true)` or `pprof.Lookup("goroutine").WriteTo(w, 2)`.
- `dlv dap` ≠ `dlv … --headless` (single-use, DAP-only, no `--accept-multiclient`/`--continue`); JSON-RPC API v1 removed in `dlv` 1.24.0, only `--api-version=2`.

## Table of Contents
1. [`dlv` Debugger](#dlv) · 2. [Panic Stack Traces](#stack-traces) · 3. [GOTRACEBACK & Core Dumps](#gotraceback-cores) · 4. [Race Detector](#race-detector) · 5. [go tool trace & Flight Recorder](#go-tool-trace) · 6. [pprof for Diagnosis](#pprof) · 7. [GODEBUG Diagnostics](#godebug) · 8. [runtime/debug & runtime/metrics](#runtime-debug) · 9. [Leaks & Deadlocks](#leaks) · 10. [Symptom → Diagnosis → Fix](#symptom-guide) · 11. [Capturing in Production](#prod-capture) · 12. [Library status](#libraries) · 13. [Version map](#versions) · 14. [Anti-Patterns](#anti-patterns) · 15. [What models get wrong](#stale)

---

## `dlv` Debugger {#dlv}

`dlv` drives the OS tracing interface and Go's DWARF info (**DWARF v5 default [1.25]**); GDB lacks goroutine/runtime awareness. **`dlv` must be built with a Go toolchain ≥ the target binary's** (it rejects DWARFv5 executables unless built with Go ≥1.25). Commands: `dlv debug`/`test`/`exec`/`attach`/`core`/`trace`/`dap`/`connect`/`replay`.

```bash
# Debug optimized binaries → "<optimized out>" + erratic stepping.
# RIGHT: all= prefix de-optimizes deps too (module-era form).
go build -gcflags='all=-N -l' -o ./svc ./cmd/svc && dlv exec ./svc
# WRONG: bare -N -l only de-optimizes the main package.
```

- Tests use `dlv test`, not `dlv debug` (bootstraps the harness; flags after `--`): `dlv test ./internal/cache -- -test.run '^TestFoo$' -test.v`.
- Headless/remote is unauthenticated RCE: bind localhost + tunnel: `dlv exec --headless --listen=127.0.0.1:4040 --api-version=2 --accept-multiclient ./svc`, then `ssh -NL 4040:localhost:4040 host && dlv connect 127.0.0.1:4040`. `--accept-multiclient` keeps the server alive after disconnect; `--only-same-user` (default true) is a security default.
- `dlv dap` is different: always headless, DAP-only, single-use, **no** `--accept-multiclient`/`--continue`: it expects a DAP client (VS Code's `dlv-dap`, the default) to send config. For reusable servers / DAP *remote attach*, use `dlv [cmd] --headless`. `"debugAdapter":"legacy"` is stale.

```text
(dlv) break handler.go:88 if req.ID == want    # postfix conditional [Delve 1.23+]
(dlv) condition 1 -hitcount > 5                  # operators: > >= < <= == != %
(dlv) condition 1 -per-g-hitcount == 3           # PER-GOROUTINE count — essential for fan-out
(dlv) watch -w <expr>                            # hardware watchpoint (also -r/-rw); disabled on Windows
(dlv) goroutines -group userloc                  # collapse N goroutines by wait location
(dlv) dump core.out                              # write an ELF core even on non-ELF platforms
```

A global `-hitcount` in a concurrent loop trips when *any* goroutines reach N; `-per-g-hitcount` scopes it to one. **Function injection (`call f()`) is experimental**: it permanently deadlocks the debugger if the call takes an already-held mutex. **Path-mapping failures** ("can't open source") are build-env issues (containers, `-trimpath` (`dlv` warns), symlinks, Bazel); fix with `config substitute-path` / `substitutePath`, not by blaming `dlv`.

---

## Panic Stack Traces {#stack-traces}

```
goroutine 42 [chan receive, 6 minutes]:
main.worker(0xc000014080)
	/app/worker.go:42 +0x1a8
created by main.run in goroutine 1
	/app/main.go:15 +0x85
```

Header = ID + **wait state** + **blocked-duration** (`[N minutes]` >~1min = strong leak/deadlock signal); args are hex-encoded (elided if optimized away); `+0x1a8` is the PC offset; `created by … in goroutine 1` is the **creation site + parent**: localize leaks here.

Wait states (`chan*`/`select`/sync = app-level blocked; GC/finalizer/`debug call` = runtime mechanics): `running`/`runnable` (many runnable = scheduler latency), `syscall`, `IO wait` (netpoller), `chan receive`/`chan send` (**#1 leak signature**), `chan receive (nil chan)` (permanent), `select`, `semacquire` (often mutex/WG internals), `sync.Mutex.Lock`/`sync.RWMutex.RLock`/`sync.WaitGroup.Wait`, and `… (leaked)` tagged by the leak profile [1.26].

`PanicNilError` [1.21]: `panic(nil)` now yields `*runtime.PanicNilError`, so `recover()` is never a misleading nil; old flag workarounds are obsolete (`GODEBUG=panicnil=1` reverts).

```go
// RIGHT — dump ALL goroutine stacks (essential for deadlock/leak hunts):
pprof.Lookup("goroutine").WriteTo(os.Stderr, 2)  // 2 = every goroutine, full frames
buf := make([]byte, 1<<20)
os.Stderr.Write(buf[:runtime.Stack(buf, true)])  // true = ALL goroutines

// WRONG — current goroutine only; the near-universal model mistake:
debug.PrintStack()                               // == runtime.Stack(buf, false)
```
`debug=1` aggregates identical stacks + counts + `[N min]`; `debug=2` lists each goroutine; `debug=0` is protobuf for `go tool pprof`. **`GODEBUG=tracebackancestors=N`** adds creation-ancestry. **`tracebacklabels` [1.26]** adds pprof labels to headers: **default-on for `go 1.27` modules [1.27]** (`tracebacklabels=0` disables): a correlation win *and* a data-exposure footgun if labels carry tenant/request IDs.

---

## GOTRACEBACK and Core Dumps {#gotraceback-cores}

`GOTRACEBACK` (env, or `debug.SetTraceback` which can **raise but not lower** the env level): `none`/`0`, **`single`** (*default, no number*: current goroutine; all if runtime-internal), `all`/`1` (all user G), `system`/`2` (+runtime), `crash` (like `system` then OS-crash. Unix **SIGABRT** → core if `ulimit -c` allows), `wer` (Windows [1.23], opt-in WER upload). The default is **`single`, not `all`**: the top GOTRACEBACK myth. setuid binaries force `none`. **`darwin/amd64` exception:** `crash` does **not** raise SIGABRT (would yield a >128 GB linear core); `dlv core` has no end-to-end macOS support: cores are a Linux / Windows-minidump workflow.

```bash
ulimit -c unlimited; GOTRACEBACK=crash ./app   # → SIGABRT → core (Linux)
dlv core ./app /path/to/core                    # MUST be the exact binary that crashed
```
Inside: `bt`, `goroutines`, `goroutine <n> stack`, `locals`, `print`. `dlv core` supports Linux `amd64`/`arm64`, Windows `amd64` minidumps, and `dlv dump` cores. **`viewcore` (`x/debug`) is dead** (broken > Go ~1.11): use `dlv core` or `cloudwego/goref` (heap-reference analysis). Cores and heap dumps are **highly sensitive** (full process memory).

---

## Race Detector {#race-detector}

`go test/build/run -race` instruments memory accesses via ThreadSanitizer (needs cgo); expect **~5-10× memory, ~2-20× time**. CI's job, **never** routine production. Three load-bearing limits:
1. Detects only races that **actually execute**: no false positives, false negatives on unexercised paths.
2. Data races ≠ logical races: a correctly-mutex'd value updated in the wrong *order* stays silent.
3. Doesn't halt by default: prints + continues (`halt_on_error=1` → exit 66); bypasses the panic machinery so **`recover()` is inert**.

```
WARNING: DATA RACE
Write at 0x… by goroutine 7:    main.(*Counter).Inc()   /app/counter.go:11
Previous read at 0x… by goroutine 6:  main.(*Counter).Value() /app/counter.go:15
Goroutine 7 (running) created at:     main.main() /app/main.go:20
```
Top two stack groups = the **conflicting accesses**; "created at" = how those goroutines arose (usually the fix site). Don't read it as a crash backtrace. **`GORACE`** (space/comma kv): `halt_on_error=1` (**CI**), `history_size=[0..7]` (raise on "failed to restore the stack"), `log_path`, `strip_path_prefix`, `exitcode`. Idiom: `GORACE="halt_on_error=1" go test -race ./...`: then also run a `-race` binary under realistic load for paths units miss. Platforms recently added: `linux/riscv64` [1.26], `linux/loong64` [1.25]. **Fixes:** mutex/RWMutex (shared state), `sync.Map` (high-read maps), `atomic.Int64`/`Pointer[T]` (counters/flags), channel (share-by-communicating), `sync.Once` (init).

---

## go tool trace & Flight Recorder {#go-tool-trace}

The tracer captures (per event, ns + stack) goroutine create/block/unblock, syscalls, GC phases, processor start/stop, heap changes, and **user annotations**. It is **not** for CPU/memory hotspots (use pprof): it shines at *when goroutines aren't running*, scheduling, blocking, and poor parallelism.

```bash
go test -trace=trace.out ./...                                   # from tests
curl localhost:6060/debug/pprof/trace?seconds=5 > trace.out      # live
go tool trace trace.out                                          # web UI
go tool trace -pprof=sched trace.out | go tool pprof -           # sched-latency as pprof (net|sync|syscall|sched)
```
**Annotate request flow** so the tool computes task-latency distributions:
```go
ctx, task := trace.NewTask(ctx, "http.request"); defer task.End()  // spans goroutines
trace.WithRegion(ctx, "db", func() { query(ctx) })                 // same-goroutine span
```

Flight Recorder: `runtime/trace.FlightRecorder` [1.25](was `x/exp/trace`):
```go
fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
    MinAge: 5 * time.Second, MaxBytes: 64 << 20,   // defaults 10s / 10 MiB
})
fr.Start(); defer fr.Stop()
if latencySpikeDetected { f, _ := os.Create("incident.trace"); defer f.Close(); fr.WriteTo(f) }
```
`WriteTo` snapshots the live ring concurrently: **you do NOT `Stop()` first** (common error). Only **one** recorder *or* `trace.Start` at a time; one concurrent `WriteTo`. Std `WriteTo` returns `(int64, error)` (x/exp returned `(int, error)`, used `SetSize`/`SetPeriod`). **[1.23]** trace flushed on crash; tool tolerates broken traces. **[1.27]** `go tool trace -http=:PORT` binds **localhost** unless you pass `0.0.0.0:PORT`. For mixed on/off-CPU (I/O) time the CPU profile misses, `felixge/fgprof`.

---

## pprof for Diagnosis {#pprof}

| Profile | Endpoint | Diagnoses |
|---|---|---|
| CPU | `/debug/pprof/profile?seconds=30` | Hot paths; **`mallocgc`/`scanobject` high = alloc pressure forcing mark assists**; `cgocall` high = CGO serialization. |
| heap | `/debug/pprof/heap` | Memory growth; `-sample_index=inuse_space` for what's pinned now. |
| goroutine | `/debug/pprof/goroutine?debug=2` | Stalls/leaks: blocked counts + creation sites. |
| goroutineleak | `/debug/pprof/goroutineleak` | **[1.27]** unreachable-blocked goroutines (§Leaks). |
| mutex / block | `/debug/pprof/{mutex,block}` | Who *holds* contended locks / where goroutines *block*. |

Enable contention: `runtime.SetMutexProfileFraction(rate)`, `runtime.SetBlockProfileRate(nsRate)`: coarse in prod (`100`); `1` = max detail. **Web UI defaults to flame graph since [1.26]** (graph at `/ui/graph`). **`net/http/pprof` is GET-only since [1.22]**. Stack depth 32→128 frames [1.23]. Attach context with **`pprof.Do(ctx, pprof.Labels("k","v"), fn)`**: labels propagate to CPU/mutex/block and filter via `tagfocus=`.

---

## GODEBUG Diagnostics {#godebug}

**Two distinct families: models conflate them.** **(a) Diagnostic runtime knobs** (formats "subject to change": prefer `runtime/metrics` for dashboards): `gctrace=1` (per-cycle GC line), `schedtrace=X`(+`scheddetail=1`), `inittrace=1` (slow `init()`s), `scavtrace=1` (RSS/scavenger), `asyncpreemptoff=1` (**hypothesis-testing only**, never a fix), `tracefpunwindoff=1`, `allocfreetrace=1` (huge overhead), `decoratemappings=1` [1.25] (`[anon: Go: heap]` in `/proc/self/maps`). `madvdontneed=1` is **inert** (Linux default since [1.16]). Combine comma-separated: `GODEBUG=gctrace=1,schedtrace=5000 ./app`.

```
gc 318 @36.750s 0%: 0.022+0.27+0.040 ms clock, 0.13+0.60/0.43/0.031+0.24 ms cpu, 4->4->0 MB, 5 MB goal, 0 MB stacks, 0 MB globals, 8 P
```
`0%` = cumulative time in GC (**high = GC-bound**); `clock` = **STW sweep-term + concurrent mark + STW mark-term** (the two STW phases bound P99); `cpu` middle = **assist/background/idle** (high *assist* = aggressive allocation); `4->4->0` = heap start→end→**live** (**live near `GOMEMLIMIT` ⇒ death spiral**). `schedtrace`: `runqueue=N` is the **global** queue, `[37]` per-P locals: persistently high `runqueue` with `idleprocs>0` = distribution failure (often CFS throttling).

(b) Compatibility GODEBUG [1.21+](proposal #56986): a *different* mechanism: `key=value` toggles a behavior change, default from toolchain → **go.mod `go` line** → `//go:debug` → the **`godebug` directive in go.mod [1.23+]**. `/godebug/non-default-behavior/<name>:events` counts firings. Examples: `panicnil` [1.21], `asynctimerchan` [1.23] (**removed [1.27]**), `tracebacklabels` [1.26]. Don't confuse `gctrace=1` (diagnostic) with these (compat).

---

## runtime/debug & runtime/metrics {#runtime-debug}

- `SetMemoryLimit(int64) int64` **[1.19]**. GOMEMLIMIT; **soft**, targets **`Sys − HeapReleased`** so it **excludes** cgo/mmap/off-heap; respected even with `GOGC=off`; `-1` queries. It is **not** "make GC aggressive" (that's `SetGCPercent`).
- **`SetCrashOutput(f *os.File, opts CrashOptions) error` [1.23]**: tee fatal output (incl. goroutine panics + runtime `throw`s) to an extra fd; `CrashOptions{}` is **required** (models drop it). Enables a fork+exec crash-monitor child.
- `SetPanicOnFault(bool)`, `SetMaxStack` (default 1 GB), `SetMaxThreads` (default 10 000: exceeding crashes).
- `ReadBuildInfo()` / `go version -m <bin>` (`-json` [1.25]): module versions + VCS stamps (**`+dirty` [1.24]**) + `DefaultGODEBUG`.
- `WriteHeapDump(fd)` **stops the world**; fd must **not** be a same-process pipe/socket.

```go
debug.SetMemoryLimit(2 << 30)   // RIGHT: real soft budget.  WRONG: debug.SetGCPercent(10) is only GC pacing.
```

**`runtime/metrics` is the stable machine-readable surface**: use it over parsing `gctrace` text: `/sched/goroutines:goroutines`, `/sched/goroutines/runnable:goroutines`, `/sched/gomaxprocs:threads`, `/gc/gomemlimit:bytes`, `/memory/classes/{total,heap/released}:bytes`.

---

## Leaks & Deadlocks {#leaks}

A leak = a goroutine blocked **forever** on a primitive that'll never be signaled. The classic: send on an unbuffered channel after an early return removed the receiver.

```go
ch := make(chan result)                            // WRONG: early return strands producers.
for _, w := range ws { go func() { ch <- process(w) }() }
for range ws { if r := <-ch; r.err != nil { return r.err } }   // leftovers block on ch forever
// RIGHT: ch := make(chan result, len(ws))  — or context cancellation / errgroup.
```

**`goroutineleak` profile** [1.26 exp → **1.27 GA**]: uses the **GC reachability graph**: if a blocked goroutine's primitive is unreachable from any runnable goroutine, it provably can't wake; the profile tags it `(leaked)`. **No false positives**, but **false negatives** when the primitive stays reachable via a global/runnable-local. Complements (doesn't replace) `go.uber.org/goleak` and dump analysis. Fetch: `curl localhost:6060/debug/pprof/goroutineleak | go tool pprof /dev/stdin`.

Deadlocks: `fatal error: all goroutines are asleep - deadlock!` fires **only when *every* goroutine blocks**: a goroutine in a syscall/netpoller (e.g. an idle HTTP server) **suppresses it** despite a real partial deadlock. Diagnose via `goroutine?debug=2`: cluster `[N min]` + sync/chan waits; `tracebackancestors` adds the spawn tree. **`goleak`** in tests (`defer goleak.VerifyNone(t)` / `goleak.VerifyTestMain(m)`, `IgnoreTopFunction` for framework G) but **confused by `t.Parallel()`**: use `VerifyTestMain` there. **`testing/synctest` [1.24 exp → 1.25 GA]** = deterministic fake-time concurrency tests (kills `time.Sleep` flakiness) but is *scheduling* only, **not** a `-race` replacement.

---

## Symptom → Diagnosis → Fix {#symptom-guide}

| Symptom | Diagnosis | Fix |
|---|---|---|
| `all goroutines asleep - deadlock!` | Full deadlock (rare: only if *every* G blocks). | Consistent lock order; every channel needs sender+receiver. |
| Process up, idle | **Partial deadlock**: `goroutine?debug=2`, cluster `[N min]`+sync/chan; `dlv goroutines -group userloc`. | Break the cycle; `select` + `ctx.Done()`. |
| Goroutine count climbs | Leak: diff goroutine profiles idle-vs-load; `goroutineleak` [1.27]; if empty, primitive is globally reachable. | Context cancellation; buffer channels; `defer ticker.Stop()`. |
| Heap grows unbounded | `heap -sample_index=inuse_space`; global maps/closures. | Drop refs; `weak.Pointer[T]` [1.24]; bounded caches. |
| OOM near `GOMEMLIMIT` | `gctrace=1` (live heap pinned?) + `scavtrace`; **GC CPU >50% = death spiral**. | Raise limit / fix leak: **don't** lower `GOGC`. Set `GOMEMLIMIT ≈ 90-95%` of cgroup limit. |
| High CPU, low throughput | CPU profile first; `mallocgc`/`scanobject` → alloc pressure; else algorithmic. | Reduce allocations; optimize hot path. |
| Lock contention | `mutex`+`block` profiles; escalate to trace for ordering. | Shrink critical sections; shard; atomic/lock-free. |
| P99 spikes (avg fine) | `FlightRecorder` snapshot on SLO breach → trace sched-latency/STW; in containers check [1.25] cgroup `GOMAXPROCS`. | Cut STW (allocation); fix scheduler queueing/throttling. |
| Random panics, `-race` clean | `unsafe`/CGO memory rules; logical (non-data) race. | Pin CGO memory; fix pointer math. |
| Slow tests | Missing `t.Parallel()` / `time.Sleep` timing. | `t.Parallel()`; `testing/synctest` [1.25]. |

---

## Capturing in Production {#prod-capture}

`/debug/pprof/goroutine?debug=2` leaks stacks/secrets and is a DoS vector: never expose pprof publicly:
```go
import _ "net/http/pprof"
go func() { http.ListenAndServe("127.0.0.1:6060", nil) }()   // internal-only + auth/IP allowlist
```
Continuous profiling (CPU/heap, <2-3%): Grafana Pyroscope, Parca, Cloud Profiler, Datadog: all pprof-compatible; labels make them filterable. **Tracing** is best flight-recorder-on-anomaly, not always-on. Signal-triggered dump:
```go
sig := make(chan os.Signal, 1); signal.Notify(sig, syscall.SIGUSR1)
go func() { for range sig { pprof.Lookup("goroutine").WriteTo(os.Stdout, 2) } }()
// kill -QUIT <pid> prints all stacks then exits (subject to GOTRACEBACK).
```
Overhead: CPU/heap low (prod-safe); goroutine dump low to moderate; trace ~1-2% [1.21+] (short windows / flight recorder); block/mutex rate-tunable; **`-race` 2-20× CPU, never prod**.

---

## Library status {#libraries}

| Tool / lib | Status [2026] | Note |
|---|---|---|
| **`dlv`** | **v1.27.0**, active | Build with Go ≥ target; DWARFv5 [1.25]; `--api-version` only `2` (v1 removed 1.24.0). |
| `runtime/trace` + FlightRecorder | **Stdlib** [1.25] | Supersedes `x/exp/trace` for rolling capture. |
| `goroutineleak` profile | **GA [1.27]** (exp 1.26) | GC-reachability; complements `goleak`. |
| `runtime/metrics` | **Stdlib, stable** | Prefer over parsing `gctrace` text. |
| `go.uber.org/goleak` | Active | Test-time; breaks with `t.Parallel()`. |
| `KimMachineGun/automemlimit` | Active | Sets `GOMEMLIMIT` from cgroups: **still needed**. |
| `go.uber.org/automaxprocs` | Maintenance | **Largely redundant on [1.25]+**. |
| `cloudwego/goref` | Active | Heap-reference core/live analysis on `dlv`. |
| `felixge/fgprof` | Active | Wall-clock (on+off-CPU) profile. |
| `grafana/pyroscope-go` / Parca | Active | Continuous profiling, pprof-compatible. |
| **`viewcore`** (`x/debug`) | **Dead** | Broken > Go ~1.11: use `dlv core`/`goref`. |
| **gdb** (+`runtime-gdb.py`) | Limited | No goroutine awareness; `dlv` preferred. |

---

## Version map {#versions}

| Ver | Debugging/diagnostics-relevant |
|---|---|
| **1.19** | `SetMemoryLimit`/`GOMEMLIMIT` (soft, `Sys−HeapReleased`). |
| **1.21** | **Tracer ~10-20%→1-2%** (frame-pointer unwind); `panic(nil)`→`PanicNilError`; GODEBUG compat mechanism. |
| **1.22** | **Streaming trace format + rewritten parser**; per-iteration loop vars (kills classic capture bug); `net/http/pprof` GET-only; `gctrace` stacks/globals fields. |
| **1.23** | `SetCrashOutput(f, CrashOptions)`; trace flushed on crash; timer channels synchronous; stack depth 32→128; `godebug` directive in go.mod. |
| **1.24** | `testing/synctest` (exp); `weak.Pointer[T]`; `+dirty` VCS suffix. |
| **1.25** | **`trace.FlightRecorder`**; **cgroup-aware `GOMAXPROCS`** (`containermaxprocs`/`SetDefaultGOMAXPROCS`); **DWARF v5**; `synctest` GA; `decoratemappings`; race `linux/loong64`. |
| **1.26** | `goroutineleak` (exp); `tracebacklabels` knob; pprof flame-graph default; race `linux/riscv64`. |
| **1.27 (RC)** | **`goroutineleak` GA**; traceback labels **default-on** (`go 1.27` modules); `asynctimerchan` **removed**; `go tool trace -http` localhost-default; generic methods. Draft until ~Aug 2026. |

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Problem | Better |
|---|---|---|
| `fmt.Println` debugging | No breakpoints/inspection | `dlv`, or structured `slog` |
| `-race` only locally | Timing-dependent; local misses | `GORACE="halt_on_error=1" go test -race` in CI + `-race` binary under load |
| `debug.Stack()` for "all" | Current-goroutine only | `runtime.Stack(buf, true)` / `pprof.Lookup("goroutine").WriteTo(w,2)` |
| `recover()` for a race | Halts at C runtime: inert | Fix the race |
| Always-on `trace.Start` in prod | Disk/RAM exhaustion | `FlightRecorder`-on-anomaly [1.25] |
| `go tool trace` as first CPU tool | Trace ≠ hotspots | pprof CPU first |
| `automaxprocs` on [1.25]+ | Runtime already cgroup-CPU-aware | Drop it; for memory use `automemlimit` |
| `GOMEMLIMIT` ≈ live heap | GC death spiral | ~90-95% of cgroup limit |
| Public `dlv` / pprof listener | Unauthenticated RCE / leak / DoS | Localhost + tunnel / auth + allowlist |
| `viewcore` for cores | Broken > Go ~1.11 | `dlv core` / `goref` |
| `GOTRACEBACK=none` in prod | Loses crash stacks | `all`/`crash` (+ `ulimit -c`, `SetCrashOutput`) |

---

## What models get wrong {#stale}

1. GOTRACEBACK default is `single`, not `all` (`0=none`,`1=all`,`2=system`; `single` has no number).
2. "Tracing is too expensive for prod": stale; ~1-2% since [1.21].
3. Citing `x/exp/trace` for FlightRecorder: it's `runtime/trace` [1.25]; you don't `Stop()` before `WriteTo`.
4. `debug.Stack()`/`PrintStack()` dump all goroutines: current-goroutine only.
5. `-race` aborts on first race: prints + continues (`halt_on_error=1`); misses logical/unexercised races; `recover()` can't catch it.
6. `dlv dap` == `dlv --headless`: `dap` is single-use, DAP-only; `--api-version=1` is dead.
7. `dlv debug` for tests (use `dlv test`); forgetting `-gcflags='all=-N -l'` → "<optimized out>".
8. `automaxprocs` required in containers: redundant on [1.25]+; **but `GOMEMLIMIT` is NOT cgroup-aware** (use `automemlimit`).
9. `GOMEMLIMIT` replaces `GOGC`: they work together; targets `Sys−HeapReleased` (excludes cgo); too-low → death spiral.
10. Unaware of the `goroutineleak` profile [1.26→1.27] and its reachability limits.
11. `viewcore` is current: dead; `dlv core`/`goref`.
12. `madvdontneed=1` fixes RSS: inert; Linux default since [1.16].
13. "`all goroutines asleep` always catches deadlocks": only if *every* G blocks; netpoller/syscall G suppress it.
14. Green Tea GC [1.26 default] cuts pause times: its 10-40% win is GC **CPU**, not STW. The "500 µs STW" SLO is a 2018 figure; no newer official target. `[verify]` any "pause dropped X%" claim.
15. Parsing `gctrace`/`scavtrace` text in tooling: formats are "subject to change"; use `runtime/metrics`.
16. `SetCrashOutput(f)` missing the required `CrashOptions{}` arg [1.23]; **POSTing to pprof** (GET-only [1.22]); **`"debugAdapter":"legacy"`** (default is `dlv-dap`); ignoring **traceback-label exposure** [1.27].

---

## See Also {#see-also}

- [performance.md](performance.md): pprof for *optimization*, allocation, GC tuning, PGO
- [concurrency.md](concurrency.md): goroutine lifecycle, leak prevention, `errgroup`
- [errors-and-resilience.md](errors-and-resilience.md#panic-recovery): panic/recover, `PanicNilError`
- [observability.md](observability.md#runtime-diagnostics): flight recorder, runtime/metrics, trace correlation
- [testing.md](testing.md): `-race` in CI, `testing/synctest`, leak tests
- [cloud-native.md](cloud-native.md#containers): cgroup-aware `GOMAXPROCS`/`GOMEMLIMIT`

## Sources {#sources}

- go.dev/doc/go1.19-go1.27 release notes; pkg.go.dev/{runtime,runtime/trace,runtime/pprof,runtime/debug,runtime/metrics,net/http/pprof,testing/synctest}
- go.dev/doc/diagnostics; go.dev/doc/articles/race_detector; go.dev/doc/gc-guide
- go.dev/blog: flight-recorder; execution-traces-2024; synctest
- `dlv`: `github.com/go-delve/delve` CLI/usage/api docs, FAQ, CHANGELOG (v1.27.0 2026-06-19; API v1 removed 1.24.0)
- Proposals/issues: GODEBUG compat #56986; `goroutineleak` profile; `AsType` else-if vet #78889; GOMEMLIMIT death spiral #58106; cgroup-mem awareness #75164
- cloudwego/goref, KimMachineGun/automemlimit, go.uber.org/goleak, felixge/fgprof, grafana/pyroscope-go
