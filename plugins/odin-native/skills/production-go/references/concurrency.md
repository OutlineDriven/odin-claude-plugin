# Concurrency Patterns in Go

Go makes concurrency cheap to start and hard to get right. The signal is in lifecycle, not syntax: every goroutine needs a reachable exit on *every* caller path (early return, error, cancellation). A goroutine blocked forever on a channel/lock the program can no longer reach is a leak: the runtime counts it as alive, so it's never collected. Modern stdlib has absorbed most hand-rolled patterns (`WaitGroup.Go` [1.25], `OnceValue` [1.21], typed atomics [1.19], `testing/synctest` [1.25], a `goroutineleak` profile [1.26]); reach for `golang.org/x/sync` only when stdlib runs out.

> Source horizon: verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 row was checked against the final notes. Version tags `[1.N]` mark the release a claim applies to. Deepened from multi-source research.

## TL;DR: the modern deltas (read first)

- `sync.WaitGroup.Go(f)` [1.25] replaces `Add(1)`/`defer Done()`. Its doc says **`f` must not panic**: if `f` panics, the internal `Done` is *skipped*, deliberately racing `Wait` against the runtime's fatal-exit so the program can't proceed on corrupt state. No recovery for you. `go vet`'s **`waitgroup` analyzer [1.25]** flags `wg.Add(1)` *inside* a spawned goroutine.
- The loop-variable capture bug is gone [1.22]: `for`/`range` variables are per-iteration when the module's `go.mod` says `go 1.22+`. Emitting `v := v` / `i := i` in such a module is dead code (`go fix` modernizers strip it). It fixes *capture*, not races on shared state, and `&v` is now a distinct address per iteration.
- `time.After`/timer-in-`select` no longer leaks [1.23]: unreferenced timers/tickers are GC-eligible and timer channels became unbuffered. The "always reuse a `Timer` to avoid leaks" advice is stale for `go 1.23+` modules; the `asynctimerchan` GODEBUG escape hatch is **removed in 1.27**. Code reading `len(t.C)`/`cap(t.C)` is broken; use a non-blocking receive.
- `goroutineleak` pprof profile [1.26 experimental → 1.27 GA] proves leaks via GC reachability (a goroutine blocked on a primitive unreachable from any runnable goroutine), zero overhead unless queried. Misses leaks reachable via a global or a runnable goroutine's locals.
- `sync.Map` was reimplemented on a concurrent hash-trie [1.24]: no more read-promotion warm-up, and disjoint-key workloads got much faster. Use-case guidance is unchanged: only write-once/read-many or disjoint key sets; otherwise `map`+`RWMutex`.
- `errgroup` derived ctx is cancelled when `Wait` returns (even with a nil error), not just on first error; using that ctx after `Wait` is a silent bug.

## Table of Contents
1. [Goroutine Lifecycle & Leak Prevention](#goroutine-lifecycle)
2. [Context Propagation & Cancellation](#context)
3. [Channel Patterns](#channel-patterns)
4. [sync Primitives](#sync-primitives)
5. [errgroup and Structured Concurrency](#errgroup)
6. [Bounded Concurrency & Worker Pools](#worker-pools)
7. [Fan-Out/Fan-In](#fan-out-fan-in)
8. [Pipeline Pattern](#pipelines)
9. [Rate Limiting and Backpressure](#rate-limiting)
10. [singleflight: request coalescing](#singleflight)
11. [Memory model & data-race classes](#race-classes)
12. [Deterministic testing: testing/synctest](#synctest)
13. [Library landscape & status](#libraries)
14. [Version map 1.19→1.27](#versions)
15. [What models get wrong](#common-bugs)
16. [Production Checklist](#production-checklist)

---

## Goroutine Lifecycle & Leak Prevention {#goroutine-lifecycle}

Go has **no parent/child goroutine hierarchy**: returning from the spawning function does nothing to the goroutine; the owner must hand it an explicit exit signal (ctx cancellation or channel close). The #1 leak (the canonical example in the Go 1.26 `goroutineleak` docs) is *send-on-unbuffered + early return*: fan out N workers, take the first result, return; the other N−1 block forever sending into a channel no one reads.

```go
// WRONG — leaks N-1 goroutines on early return; unbuffered send has no receiver after return.
func first(tasks []func() string) string {
    ch := make(chan string) // unbuffered
    for _, t := range tasks {
        go func() { ch <- t() }() // blocks forever once first() returns
    }
    return <-ch
}

// RIGHT — buffer sized to #sends so every send completes and is GC'd, OR guard with ctx.Done().
func first(ctx context.Context, tasks []func() string) string {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()
    ch := make(chan string, len(tasks)) // sends never block → no leak
    for _, t := range tasks {
        go func() {
            select {
            case ch <- t():
            case <-ctx.Done(): // orphaned workers still exit cleanly
            }
        }()
    }
    return <-ch
}
```

Closing rule: only the *sender* closes, exactly once. Receiver-closes → `panic: send on closed channel` for any in-flight sender; with multiple senders, close a separate `done` channel (or use `sync.Once`). Closing is **not required for GC**: drop the reference and an idle channel is collected; you close only to broadcast "no more values" to rangers.

Detection, three layers:
- Runtime [1.26 exp / 1.27 GA]: `goroutineleak` pprof profile. `GOEXPERIMENT=goroutineleakprofile` + `/debug/pprof/goroutineleak` on 1.26; GA in `runtime/pprof` on 1.27. GC-reachability based → zero false positives, but blind to leaks where the blocking primitive is still reachable from a global or a runnable goroutine.
- Tests: `go.uber.org/goleak` (`goleak.VerifyTestMain(m)`, or `defer goleak.VerifyNone(t)` per test). `VerifyNone` is **incompatible with `t.Parallel`** (can't attribute goroutines to one test); use `VerifyTestMain` there. See [testing-advanced.md](testing-advanced.md#goroutine-leaks).
- Lifecycle hygiene: `runtime.AddCleanup` [1.24] supersedes `runtime.SetFinalizer` (no resurrection/ordering pitfalls; cleanups run concurrently since 1.25). `GODEBUG=checkfinalizers=1` [1.25] flags finalizer/cleanup mistakes.

### Panic Recovery
A panic in a goroutine crashes the **whole process** unless *that goroutine* recovers: `recover()` only works in a function deferred directly by the panicking goroutine, and `net/http`'s handler recover does **not** cover goroutines you spawn from a handler. See [errors-and-resilience.md](errors-and-resilience.md#panic-recovery) for the full rule.

```go
// Recover INSIDE the goroutine; capture the stack.
go func() {
    defer func() {
        if r := recover(); r != nil {
            slog.Error("worker panic", "panic", r, "stack", string(debug.Stack()))
        }
    }()
    work()
}()
```

`sourcegraph/conc` (`conc.WaitGroup`) recovers panics and re-panics them on `Wait`; `errgroup` does the same (see [#errgroup](#errgroup)). Plain `sync.WaitGroup.Go` does **not**; wrap the body yourself if `f` can panic.

---

## Context Propagation & Cancellation {#context}

`ctx` is the **first parameter**, never stored in a struct (except a short-lived request struct). Cancellation is **cooperative**: `WithCancel`/`WithTimeout` only close `ctx.Done()`; long operations must poll it. **Always `defer cancel()`** even on success (it frees the timer/child); `go vet`'s `lostcancel` catches the common misses.

Version map models routinely blur:

| API | Version |
|---|---|
| `WithCancelCause`, `Cause` | **[1.20]** |
| `AfterFunc`, `WithoutCancel`, `WithDeadlineCause`, `WithTimeoutCause` | **[1.21]** |

**`WithoutCancel` [1.21]: detached work that keeps values.** Background tasks that outlive the request (metrics, audit, email) should inherit neither the request ctx (cancelled when the handler returns) nor a bare `context.Background()` (drops trace IDs / logger / values). `WithoutCancel` clones values while severing cancellation+deadline (`Done()==nil`, `Err()==nil`); re-bound it with a fresh timeout or it can hang forever.

```go
// WRONG — request ctx dies when the handler returns; Background() loses trace/span context.
go flushMetrics(r.Context())

// RIGHT — keep values, drop the request's cancellation, impose an independent bound.
func handler(w http.ResponseWriter, r *http.Request) {
    bg := context.WithoutCancel(r.Context())
    go func() {
        bg, cancel := context.WithTimeout(bg, 10*time.Second)
        defer cancel()
        flushMetrics(bg)
    }()
    w.WriteHeader(http.StatusAccepted)
}
```

**`WithCancelCause` / `Cause` [1.20].** `cancel(err)` records a specific reason; `ctx.Err()` stays the coarse `context.Canceled`, while `context.Cause(ctx)` returns the wrapped error (walks to whichever parent cancelled first). `cancel(nil)` ⇒ cause is `context.Canceled`.

**Trap: `WithTimeoutCause`/`WithDeadlineCause` only deliver the custom cause when the timeout *fires*.** On the normal/early-cancel path your `defer cancel()` sets cause = `context.Canceled`, discarding the message. For one cause across *all* exit paths, wire it yourself with `WithCancelCause` + `time.AfterFunc`:

```go
ctx, cancel := context.WithCancelCause(parent)
defer cancel(errors.New("done"))
t := time.AfterFunc(d, func() { cancel(fmt.Errorf("timeout after %s", d)) })
defer t.Stop() // first-cancel-wins handles the rest
```

**`AfterFunc` [1.21]: cleanup tied to a ctx.** `f` runs in *its own goroutine* when ctx is Done (immediately if already Done). The returned `stop()` only breaks the association; it **does not wait** for `f` to finish; `stop()` returns true only if it cancelled `f` before it started. Pairs perfectly with `synctest` ([#synctest](#synctest)).

**Rules:** `context.Background()` only at the process root (`main`, tests); `context.TODO()` marks an undecided context; don't impose a *longer* downstream timeout than the request budget; broader timeouts high, narrower low (a 30s handler containing a 5s DB call). HTTP client timeouts: [http-and-apis.md](http-and-apis.md#http-client). Boundary-level timeout/deadline detail: [errors-and-resilience.md](errors-and-resilience.md#timeouts).

---

## Channel Patterns {#channel-patterns}

### Channel Sizing: intent, not a throughput dial
| Cap | Meaning |
|---|---|
| **0** (unbuffered) | Synchronization/handoff: send completes only when a receiver takes it. Natural backpressure. Default for signaling and guaranteed delivery. |
| **1** | Decouple exactly one send from receive. The right size for a **result channel a receiver may abandon** (timeout/early return) so the producer never blocks. |
| **N** | Bounded queue: `N` = a *correctness bound* on outstanding items (smooth bursts, cap in-flight work). |

A buffer **never fixes a logic race**: it delays/hides blocking and can mask a missing receiver until production load. The pipeline guidance is blunt: choosing `1` "to fix a blocked send" is fragile unless you can prove one unread value is the forever-maximum.

**Nil-channel axiom:** send/receive on a `nil` channel blocks **forever**: used *intentionally* in `select` to disable a case (set a channel var to `nil` to take it out of consideration). **Closed-channel axioms:** receive from a closed channel returns the zero value immediately with `ok==false`; send on closed → panic; close of closed → panic; close of nil → panic.

### Or-Done: bail when the consumer stops
The inner `select` is the load-bearing part: without it the goroutine leaks if `out` stops being read.

```go
func orDone[T any](ctx context.Context, in <-chan T) <-chan T {
    out := make(chan T)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                return
            case v, ok := <-in:
                if !ok {
                    return
                }
                select {
                case out <- v:
                case <-ctx.Done(): // REQUIRED — else leak when out isn't read
                    return
                }
            }
        }
    }()
    return out
}
```

### Tee: duplicate one stream to two (blocking-safe)
```go
func tee[T any](ctx context.Context, in <-chan T) (<-chan T, <-chan T) {
    o1, o2 := make(chan T), make(chan T)
    go func() {
        defer close(o1)
        defer close(o2)
        for v := range orDone(ctx, in) {
            a, b := o1, o2 // local copies; nil each as it completes
            for range 2 {  // ensure BOTH receive before advancing — no dropped/duplicated value
                select {
                case <-ctx.Done():
                    return
                case a <- v:
                    a = nil
                case b <- v:
                    b = nil
                }
            }
        }
    }()
    return o1, o2
}
```

### Direction-restricted channels
`chan<- T` (send-only) and `<-chan T` (receive-only) in signatures let the compiler catch wrong-direction usage at compile time; Go converts a bidirectional channel implicitly. Annotate exported function params.

### `select` traps
- **No `default`** ⇒ `select` blocks until a case is ready. A bare `default` makes it non-blocking (busy-spins if looped without a backoff/timer).
- Among multiple ready cases the choice is **uniform-random**: don't rely on case order for priority. For strict priority, nest selects.
- `select{}` (empty) blocks the goroutine forever, occasionally used to park `main`.

---

## sync Primitives {#sync-primitives}

- Mutex / RWMutex: comment what each lock protects; never copy after first use (`go vet copylocks` catches it). `RWMutex` only wins when reads *vastly* dominate and the critical section is non-trivial; under write contention it can be slower than a plain `Mutex` (writer starvation + bookkeeping). `Mutex` contention improved in [1.24].
- `sync.Once`: zero-value ready. For init that returns a value/error, prefer `OnceValue`/`OnceValues` (below) over the manual `Once`+vars dance.
- `sync.OnceFunc`/`OnceValue`/`OnceValues` [1.21]: generic wrappers that run `f` exactly once and memoize the result. **Panic semantics:** if `f` panics, the panic is *cached and re-panicked on every subsequent call* (the function is considered "done"), the opposite contract from `WaitGroup.Go`. `go fix` modernizers [1.26] rewrite the hand-rolled form to these.

```go
// RIGHT — memoize value+error once, concurrency-safe; replaces sync.Once + package vars.
var loadConfig = sync.OnceValues(func() (*Config, error) {
    return parse(os.Getenv("CONFIG"))
})
// callers: cfg, err := loadConfig()
```

- `sync.WaitGroup.Go(f)` [1.25]: exactly `Add(1); go func(){ defer Done(); f() }()`, but `f` **must not panic**: on panic it skips `Done`, intentionally deadlocking `Wait` so the process can't continue on corrupt state. pkg.go.dev now says "callers should prefer `WaitGroup.Go`" on `Add`/`Done`. It adds no limiting or error handling; for those see [#errgroup](#errgroup).
- `sync.Pool`: recycle hot-path objects to cut GC pressure; objects may vanish between GC cycles, so never assume an item survives. See [performance.md](performance.md#sync-pool).
- `sync.Map`: see [#race-classes](#race-classes) and the decision below: *not* a default concurrent map.
- Atomics [1.19]: use typed `atomic.Int64`/`Bool`/`Pointer[T]`, **not** `atomic.AddInt64(&x, 1)` on a raw field. The typed forms are auto-aligned (the old 64-bit-alignment-on-32-bit panic is gone), carry a `noCopy` guard, and `Pointer[T]` is type-safe vs `unsafe.Pointer` CAS. Bitwise `And`/`Or` funcs+methods added [1.23]. Atomics are for **single-word** state (flags, counters, pointer publication); a multi-field invariant needs a mutex.

```go
type State struct {
    n   atomic.Int64       // auto 64-bit aligned even on 32-bit GOARCH
    cur atomic.Pointer[Config] // type-safe publication, no unsafe.Pointer
}
```

---

## errgroup and Structured Concurrency {#errgroup}

`errgroup` is the production standard for *concurrent work with first-error + cancellation*. Internally it's just `sync.WaitGroup` + `sync.Once` + a buffered `sem chan token` (~120 LOC): `SetLimit(n)` literally allocates `make(chan token, n)`. It is **not faster** than a hand-rolled semaphore; it buys error/cancel *semantics*.

```go
func processAll(ctx context.Context, items []Item) error {
    g, ctx := errgroup.WithContext(ctx) // shadow ctx with the derived one
    g.SetLimit(10)                       // bound concurrency; Go() blocks at the limit
    for _, item := range items {
        g.Go(func() error {
            return processItem(ctx, item) // [1.22] item captured per-iteration
        })
    }
    return g.Wait() // first non-nil error; derived ctx cancelled on error OR on Wait return
}
```

**Key behaviors:**
- `Wait` returns the **first** non-nil error and blocks until all goroutines finish.
- `WithContext` cancels the derived ctx on first error **or when `Wait` returns**: using that ctx after `Wait` (e.g. for cleanup) is a stale-ctx bug.
- `SetLimit(n)`: `n<0` = unlimited, `0` = blocks all; **panics if changed while goroutines are active**. `TryGo(f) bool` starts only if below the limit (use instead of `Go` when you don't want to block).
- Zero `Group` is valid (no limit, no cancel). `SetLimit` is **per-group**: for a limit shared across call-sites use one `x/sync/semaphore`.
- **`Wait` propagates child panics** rather than crashing the process or swallowing them: a panic in a `Go`/`TryGo` body is re-raised from `Wait` (and `runtime.Goexit` in a child triggers `Goexit` in `Wait`). Recover at the `Wait` site if you want it as an error. `[verify]` the exact `x/sync` tag that introduced panic propagation: confirmed present in current `x/sync`, introducing version not pinned.

**Footgun: a worker returning `ctx.Err()` cancels its own siblings.** A worker that should *not* abort the group on cancellation must swallow `context.Canceled`:

```go
// WRONG: returning context.Canceled triggers group cancellation of peers.
g.Go(func() error { return longRunner(ctx) })

// RIGHT: don't let benign cancellation abort the group.
g.Go(func() error {
    if err := longRunner(ctx); err != nil && !errors.Is(err, context.Canceled) {
        return err
    }
    return nil
})
```

You **cannot `select` on `g.Wait()`**: for long-lived daemons or select-based coordination, raw channels + `WaitGroup` are clearer (errgroup saves no lines there). errgroup's panic re-raise is also why it's safer than bare `WaitGroup.Go` for work that might panic.

### Collecting results
Each goroutine writing a **unique slice index** needs no mutex (disjoint memory):
```go
results := make([]Response, len(urls))
for i, url := range urls {
    g.Go(func() error {
        r, err := fetch(ctx, url)
        if err != nil {
            return fmt.Errorf("fetching %s: %w", url, err)
        }
        results[i] = r // safe: unique index per goroutine
        return nil
    })
}
```

---

## Bounded Concurrency & Worker Pools {#worker-pools}

**Stdlib-first ladder**: escalate only as needs grow:
1. **Buffered-channel semaphore + `WaitGroup`**: counting + bounding, zero deps, easiest to audit. Acquire **before** `go`.
2. **`errgroup` + `SetLimit`**: when you also need first-error-wins + cancellation.
3. **`x/sync/semaphore.Weighted`**: only for *weighted* permits or ctx-aware `Acquire(ctx, n)` before launching.

```go
// RIGHT — acquire the slot BEFORE spawning, so goroutine count is bounded too.
func fanOut(items []Item, limit int) {
    sem := make(chan struct{}, limit)
    var wg sync.WaitGroup
    for _, it := range items {
        sem <- struct{}{}    // blocks at the limit → backpressure on spawning
        wg.Go(func() {       // [1.25]
            defer func() { <-sem }()
            work(it)
        })
    }
    wg.Wait()
}

// WRONG — acquiring INSIDE the goroutine spawns all N immediately (unbounded goroutine memory);
// it throttles work but not creation, defeating the bound.
for _, it := range items {
    wg.Go(func() { sem <- struct{}{}; defer func() { <-sem }(); work(it) })
}
```

Fixed worker pool (queue-shaped, long-lived workers, best for continuous/streaming work, where a static goroutine count minimizes stack churn):

```go
func pool[J, R any](ctx context.Context, n int, jobs <-chan J, do func(context.Context, J) R) <-chan R {
    results := make(chan R)
    var wg sync.WaitGroup
    for range n { // [1.22] range-over-int
        wg.Go(func() {
            for j := range jobs { // exits when jobs is closed
                select {
                case results <- do(ctx, j):
                case <-ctx.Done():
                    return
                }
            }
        })
    }
    go func() { wg.Wait(); close(results) }() // exactly one closer
    return results
}
```

Pool sizing: CPU-bound ⇒ `n ≈ runtime.GOMAXPROCS(0)`; I/O-bound ⇒ higher (tune to the downstream concurrency limit). **[1.25] `GOMAXPROCS` is now cgroup-aware** on Linux and updates at runtime as limits change, so hardcoding `runtime.NumCPU()` over-provisions in containers; read `GOMAXPROCS(0)` or let it adapt (`runtime.SetDefaultGOMAXPROCS()` re-enables the default after an override; disable via `GODEBUG=containermaxprocs=0`). This largely supersedes `go.uber.org/automaxprocs` for `go 1.25+`. See [cloud-native.md](cloud-native.md#containers).

**Don't fan out trivial work.** Channel send/recv + scheduler context-switch overhead exceeds the win for cheap, CPU-bound units; fan-out only pays when units are I/O-bound or take more than ~1 ms of CPU. Otherwise a sequential loop is faster.

---

## Fan-Out/Fan-In {#fan-out-fan-in}

Fan-in (merge) = one closer after all producers, every send guarded by cancellation:

```go
func merge[T any](ctx context.Context, cs ...<-chan T) <-chan T {
    out := make(chan T)
    var wg sync.WaitGroup
    for _, c := range cs {
        wg.Go(func() { // [1.25]
            for v := range c {
                select {
                case out <- v:
                case <-ctx.Done():
                    return
                }
            }
        })
    }
    go func() { wg.Wait(); close(out) }() // exactly one closer, after all producers
    return out
}

// Fan-out: distribute, then merge the per-worker output channels.
func fanOut[T, R any](ctx context.Context, in <-chan T, workers int, fn func(T) R) <-chan R {
    chans := make([]<-chan R, workers)
    for i := range workers {
        out := make(chan R)
        chans[i] = out
        go func() {
            defer close(out)
            for item := range orDone(ctx, in) {
                select {
                case out <- fn(item):
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    return merge(ctx, chans...)
}
```

The omitted-`ctx.Done()`-arm version (`out <- v` with no select) is the classic fan-in leak when the consumer stops early.

---

## Pipeline Pattern {#pipelines}

Each stage closes **its own** outbound channel on *every* return path (including cancellation), and selects on `ctx.Done()` for every send. Unbuffered (or small) channels *are* the backpressure mechanism: a slow downstream stage throttles upstream and bounds memory; large buffers "to go faster" remove backpressure and invite unbounded growth.

```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out) // MUST close on the ctx.Done() path too, or downstream rangers block forever
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

// Compose; cancel the whole pipeline by cancelling ctx.
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
for v := range square(ctx, generate(ctx, 1, 2, 3, 4)) {
    fmt.Println(v)
}
```

The common bug is putting `close(out)` *after* the `for` so the `case <-ctx.Done(): return` path skips it, leaving downstream `range out` blocked forever. `defer close(out)` is the fix.

---

## Rate Limiting and Backpressure {#rate-limiting}

`golang.org/x/time/rate` is a token bucket of size `b` (burst) refilled at `r` tokens/sec, computed from timestamps (no internal goroutine). Zero-value `Limiter` rejects everything. Always `NewLimiter`. Concurrency-safe.

```go
lim := rate.NewLimiter(rate.Limit(5), 10)                    // 5/s, burst 10
lim2 := rate.NewLimiter(rate.Every(200*time.Millisecond), 1) // 1 per 200ms, no burst
```

| Method | When no token | Use |
|---|---|---|
| `Allow()` | returns `false` (non-blocking) | **shed/drop** → HTTP 429 (inbound middleware) |
| `Wait(ctx)` | **blocks** until token / ctx done | **throttle** outbound clients/workers (backpressure) |
| `Reserve()` | returns `Reservation` w/ `Delay()`/`OK()`/`Cancel()` | schedule with an explicit delay |

```go
// WRONG — Wait() inside the spawned goroutine spawns thousands of blocked goroutines first.
for _, req := range reqs {
    go func() { limiter.Wait(ctx); send(req) }()
}

// RIGHT — Wait() in the spawner loop applies real backpressure on creation.
for _, req := range reqs {
    if err := limiter.Wait(ctx); err != nil {
        break
    }
    go send(req)
}
```

**Policy matters:** use `Allow()` for server *intake* (reject overflow immediately; `Wait` would hold connections open and exhaust FDs); use `Wait(ctx)` for *outbound* control to a third-party API. Per-key limiters need eviction; an unbounded `map[string]*rate.Limiter` is a memory-leak/DoS vector; pair entries with a `lastSeen` and a cleanup goroutine. **Semaphore** (`x/sync/semaphore.Weighted`) bounds *concurrency*; rate limiter bounds *throughput*: different axes. For evenly-spaced output use `go.uber.org/ratelimit` (leaky bucket); for multi-node limits move to Redis (e.g. GCRA).

---

## singleflight: request coalescing {#singleflight}

`golang.org/x/sync/singleflight` collapses concurrent calls with the same key into one execution; the rest wait and share the result. It is **not a cache**: it only dedups *in-flight* calls; pair it with a cache for stampede protection. Zero-value `Group` usable; **not generic** (returns `any`).

```go
v, err, shared := g.Do(key, func() (any, error) { return loadFromDB(key) })
row := v.(*Row) // type assertion required
```

Caveats models miss:
- Shared failure: if the leader returns an error *or panics*, that same error/panic is delivered to **all** waiters: one transient blip fails every deduped caller. (singleflight traps a leader panic and re-issues it via `go panic(e)` so the crash carries the original stack; the process still terminates.)
- No timeout / head-of-line blocking: `Do` has no ctx awareness; a hung leader blocks all followers. Use `DoChan` + `select` for a per-caller timeout (but the leader keeps running; its channel is **never closed**):
```go
select {
case r := <-g.DoChan(key, fn):
    use(r.Val, r.Err)
case <-ctx.Done():
    // fn keeps running; this caller just stops waiting
}
```
- Shared returned pointer: all coalesced callers get the *same* pointer; mutating it (`user.LastSeen = now`) is a data race across every deduped request. Deep-copy before mutating (check the `shared` flag to copy only when needed).
- Bounded staleness: `go func(){ time.Sleep(d); g.Forget(key) }()` inside `fn` caps how long requests collapse onto one in-flight call.

Sharded-map vs `sync.Map` decision and the LRU/cache layer live in [data-structures-and-caching.md](data-structures-and-caching.md#singleflight).

---

## Memory model & data-race classes {#race-classes}

The Go memory model defines visibility via **happens-before** edges; atomic operations are **sequentially consistent**. "It looks ordered" means nothing without a real synchronization edge (channel op, mutex, atomic, `WaitGroup`). Recurring classes:

1. **Loop-var capture** (pre-1.22): fixed [1.22] for module `go 1.22+`.
2. **Concurrent map access**: `fatal error: concurrent map read and map write`. This is an **always-on runtime check, independent of `-race`, and not recoverable**. Fix with `sync.RWMutex`, `sync.Map`, or sharding.
3. **Unsynchronized shared struct fields / flags**: typed atomic or mutex.
4. **Check-then-act / TOCTOU**: `if _, ok := m[k]; !ok { m[k]=v }`, lazy `if x==nil { x=… }`. Use `LoadOrStore`, `OnceValue`, or hold one lock across the whole op.
5. **Send/close on closed channel; double close**: panic. Only the sender closes, once.
6. **`WaitGroup.Add` after the goroutine started / concurrent with `Wait`**: `go vet waitgroup` [1.25] catches the common form; `WaitGroup.Go` makes it unrepresentable.

**`sync.Map` vs `map`+`RWMutex`.** [1.24] reimplemented `sync.Map` over a concurrent hash-trie (lock-free reads via atomic pointer traversal, per-node mutex on writes, lazy growth), *removing the old read-promotion warm-up* and sharply improving disjoint-key and adversarial alloc/delete workloads. The use-case guidance is unchanged (verbatim from the docs): use `sync.Map` **only** when (1) a key is written once and read many (grow-only caches) or (2) goroutines operate on **disjoint key sets**. For everything else (mixed read/write on shared keys, or you need `len()`/consistent iteration), a plain `map`+`RWMutex` is faster, type-safe, and clearer (`sync.Map.Range` is **not** a snapshot). `Clear` exists [1.23]. For a typed high-contention map, `github.com/puzpuzpuz/xsync` `MapOf[K,V]` often beats stdlib.

**`-race` detector:** dynamic happens-before: **no false positives** (a reported race is real), **many false negatives** (only sees executed paths and the interleavings that actually occurred). ~5-10× CPU/memory; run in CI (`go test -race ./...`), canary in prod, not default. It detects **neither deadlocks nor leaks** (separate: the runtime all-asleep deadlock detector; `goleak`/`goroutineleak` profile). `synctest`'s `Wait` is a synchronization edge the detector understands; combine `-race` with synctest. Full workflow: [debugging-and-diagnostics.md](debugging-and-diagnostics.md#race-detector).

---

## Deterministic testing: testing/synctest {#synctest}

Stable [1.25]; experimental [1.24] (`GOEXPERIMENT=synctest`, only `Run`). `Run` was **deprecated [1.25] and removed [1.26]**: the package is just `Test` + `Wait`.

```go
func Test(t *testing.T, f func(*testing.T)) // runs f in an isolated "bubble"
func Wait()                                  // NO args — blocks until every OTHER bubble goroutine is durably blocked
```

```go
// Test a 1-minute timeout in microseconds, deterministically — no changes to the code under test.
func TestTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        start := time.Now() // fake clock starts 2000-01-01 00:00 UTC
        ctx, cancel := context.WithTimeout(t.Context(), time.Minute)
        defer cancel()
        <-ctx.Done()
        if time.Since(start) != time.Minute { // exactly 1m on the fake clock
            t.Fatalf("got %v", time.Since(start))
        }
    })
}
```

**Semantics that matter:**
- **Fake clock per bubble**, advancing only when *every* bubble goroutine is **durably blocked**, then jumping straight to the next scheduled timer: hours of waiting run in microseconds.
- **Durably blocked** = unblockable only by another goroutine *in the same bubble*: bubbled-channel send/recv, a `select` whose every case is bubbled, `time.Sleep`, `WaitGroup.Wait` (with `Add` in-bubble), `Cond.Wait`. **Mutex ops are NOT durably blocking**, and **network/OS I/O is NOT**; wrapping a real HTTP server deadlocks the bubble; use `net.Pipe`/in-memory mocks.
- Channels/timers/tickers created in the bubble are "bubbled"; **operating on a bubbled channel from outside the bubble panics**.
- Contexts in a bubble must derive from `t.Context()` so their deadline timer attaches to the fake clock.

```go
// WRONG — Wait takes no arg; Run was removed in 1.26.
synctest.Wait(t)        // compile error
synctest.Run(func(){})  // removed [1.26]
```

Use for timeouts/retries/backoff, `context.AfterFunc`, tickers, cache expiry: anything time- or scheduling-dependent that's otherwise flaky/slow. See [testing-advanced.md](testing-advanced.md#synctest-patterns).

---

## Library landscape & status {#libraries}

| Library / API | Status [2026] | Use when |
|---|---|---|
| stdlib `sync`/`sync/atomic`/`context`/channels | **Default** | Almost always |
| `sync.WaitGroup.Go` [1.25] | **Default** for fire-and-wait | Replaces manual `Add`/`Done` (f must not panic) |
| `sync.OnceValue`/`OnceValues`/`OnceFunc` [1.21] | **Default** for lazy init | Replaces `sync.Once`+vars (panic is replayed) |
| typed atomics [1.19] | **Default** | Replaces `atomic.AddInt64(&field,…)`, `unsafe.Pointer` CAS |
| `golang.org/x/sync/errgroup` | Active, standard | First-error + cancel siblings + optional `SetLimit` |
| buffered-channel semaphore (stdlib) | **Default** for plain bounding | Cap in-flight work, no error/cancel policy |
| `golang.org/x/sync/semaphore` | Active | **Weighted** permits or ctx-aware acquire-before-launch |
| `golang.org/x/sync/singleflight` | Active | Dedup concurrent cache misses (not a cache) |
| `golang.org/x/time/rate` | Active | Single-node token-bucket rate limiting |
| `sync.Map` (HashTrieMap [1.24]) | Specialized | Grow-only or disjoint-key only; else `map`+`RWMutex` |
| `github.com/puzpuzpuz/xsync` `MapOf` | Active | Typed, very-high-contention concurrent map |
| `testing/synctest` [1.25] | **Default** for time-dep tests | Deterministic timeouts/tickers/cancellation |
| `go.uber.org/goleak` | Active | Test-time leak gate (`VerifyTestMain` if `t.Parallel`) |
| `goroutineleak` pprof profile [1.26 exp/1.27 GA] | New, runtime-native | Production/test leak hunt |
| `go.uber.org/ratelimit` | Active | Evenly-spaced (leaky-bucket) output, no bursts |
| `sourcegraph/conc` | Active | Panic-safe `WaitGroup`/pools if you prefer its ergonomics |

`golang.org/x/sync`, `golang.org/x/time` are official subrepos versioned **separately** from the toolchain (not under the Go 1 compatibility lock): `go get` them. `[verify]` exact latest semantic tags of `x/sync`/`x/time`/`goleak` at use time; APIs above are current.

---

## Version map 1.19→1.27 {#versions}

| Ver | Concurrency-relevant change |
|---|---|
| **1.19** | **Typed atomics** (`atomic.Int64`/`Bool`/`Pointer[T]`): auto-aligned, kill the 32-bit alignment footgun |
| **1.20** | `context.WithCancelCause`, `context.Cause` |
| **1.21** | `sync.OnceFunc`/`OnceValue`/`OnceValues`; `context.AfterFunc`/`WithoutCancel`/`WithDeadlineCause`/`WithTimeoutCause`; `loopvar` as `GOEXPERIMENT` |
| **1.22** | **Per-iteration loop variables** (default for `go 1.22+`): kills goroutine loop-var capture; range-over-int |
| **1.23** | **Timers/tickers GC'd without `Stop`**, timer channels unbuffered → `time.After`-in-`select` no longer leaks; atomic `And`/`Or`; `sync.Map.Clear`; range-over-func |
| **1.24** | **`sync.Map` reimplemented on HashTrieMap**; `Mutex` contention improved; `runtime.AddCleanup` (supersedes `SetFinalizer`); `testing/synctest` **experimental** |
| **1.25** | **`testing/synctest` stable** (`Test`+`Wait`; `Run` deprecated); **`sync.WaitGroup.Go`** (f must not panic); **container-aware `GOMAXPROCS`** + `SetDefaultGOMAXPROCS`; `go vet` `waitgroup` analyzer; `runtime/trace` FlightRecorder |
| **1.26** | **`goroutineleak` pprof profile: experimental** (`GOEXPERIMENT=goroutineleakprofile`); `synctest.Run` **removed**; `go fix` modernizers (auto-migrate to `WaitGroup.Go`/`OnceValue`); Green Tea GC default |
| **1.27** | **`goroutineleak` profile GA** (`/debug/pprof/goroutineleak`); **`asynctimerchan` GODEBUG removed**: timer channels always synchronous; generic methods. GA 2026-08-19; row from 2026-06 RC notes, confirmed against the final release notes. |

---

## What models get wrong {#common-bugs}

1. **Leak on early return**: N goroutines `ch <- x` on an *unbuffered* channel, then return before draining all N. Fix: buffer to N, `errgroup.WithContext`, or guard sends with `ctx.Done()`.
2. **Send on unbuffered channel with no receiver** (`go func(){ ch <- v }()` the caller may abandon): needs buffer-of-1 or a `select` with `ctx.Done()`.
3. **Missing `ctx.Done()` arm** in a blocking send/recv inside a long-lived goroutine → permanent block when the peer is gone.
4. **Over-reaching for `errgroup`** when there's no error/cancel need: a `WaitGroup.Go` + buffered-channel semaphore is clearer and dependency-free; errgroup is `WaitGroup`+`Once`+sem, not faster.
5. **Acquiring the semaphore *inside* the goroutine** → spawns all N at once (unbounded goroutine memory); acquire **before** `go`.
6. **errgroup worker returning `ctx.Err()`** on cancellation, cancelling its own siblings: return `nil` on `context.Canceled` for non-aborting workers.
7. **Reusing the errgroup-derived ctx after `Wait`**: it's cancelled when `Wait` returns (even on nil error).
8. **Still emitting `v := v`/`i := i`** for modules on `go 1.22+`: dead code since [1.22]; fixes capture only, not shared-state races.
9. **`atomic.AddInt64(&field,…)`** on a raw struct field (32-bit alignment risk) instead of `atomic.Int64`; `unsafe.Pointer` CAS where `atomic.Pointer[T]` is type-safe [1.19].
10. **Hand-rolled `sync.Once` value caches** instead of `OnceValue`/`OnceValues` [1.21], and not knowing the **panic is cached and replayed** every call.
11. **`time.After` "leaks in a loop" cargo cult**: true ≤1.22, **fixed [1.23]**; the `asynctimerchan` escape hatch is **removed [1.27]**. Also polling `len(t.C)`/`cap(t.C)` (stale; channels unbuffered since 1.23).
12. **`WithTimeoutCause`/`WithDeadlineCause` cause assumption**: the custom cause is only observed when the timeout *fires*; normal/early-cancel paths see `context.Canceled`. Wire `WithCancelCause` + `time.AfterFunc` for a single cause on all paths.
13. **Wrong context version tags**: conflating `WithCancelCause` [1.20] with `AfterFunc`/`WithoutCancel` [1.21].
14. **`WithoutCancel` as a magic clone**: it drops cancellation+deadline and keeps parent values reachable; re-bound with a fresh `WithTimeout`.
15. **Assuming `context.AfterFunc`'s `stop()` waits**: it does not; `f` runs in its own goroutine.
16. **`synctest` API drift**: `synctest.Run` (removed [1.26]) or `synctest.Wait(t)` (takes no args); assuming mutex blocking advances the fake clock (it doesn't); operating on a bubbled channel from outside (panics).
17. **Reflexive `sync.Map`** for general mixed read/write: `map`+`RWMutex` (or `xsync.MapOf`) is better and type-safe; not knowing the [1.24] HashTrieMap rewrite removed read-promotion. `Range` is not a snapshot.
18. **Treating `singleflight` as a cache**: it only dedups in-flight calls; leader error/panic propagates to **all** waiters; `Do` has no timeout (need `DoChan`+`select`, and even then the leader keeps running); mutating the shared returned pointer is a race.
19. **Hardcoding pool size to `runtime.NumCPU()`**: since [1.25] default `GOMAXPROCS` is cgroup-aware/dynamic; read `GOMAXPROCS(0)`.
20. **Closing a channel from the receiver / with multiple senders**: only the sender closes, once; otherwise use a `done` channel or `sync.Once`.
21. **Treating buffer size as a throughput knob**: large buffers destroy backpressure and invite unbounded memory; a buffer never fixes a logic race.
22. **`WaitGroup.Add` inside the goroutine**: caught by `go vet waitgroup` [1.25]; `WaitGroup.Go` eliminates the class. And forgetting `WaitGroup.Go`'s `f` **must not panic** (no recovery) vs `OnceValue`'s replay-on-every-call: opposite contracts.
23. **Assuming `-race` proves correctness**: it only flags races on executed paths/observed interleavings; finds neither deadlocks nor leaks.

---

## Production Checklist {#production-checklist}

- [ ] Every goroutine has a reachable shutdown path (ctx cancellation or channel close) on *all* caller paths
- [ ] `errgroup` for concurrent work needing error propagation; `WaitGroup.Go` + semaphore for bounded fire-and-wait
- [ ] Bounded concurrency on all fan-out (`errgroup.SetLimit`, `semaphore.Weighted`, or a buffered-channel semaphore acquired *before* `go`)
- [ ] `ctx` threaded through every goroutine; every blocking channel op in a long-lived goroutine has a `ctx.Done()` arm
- [ ] Background work that outlives a request uses `WithoutCancel` + a fresh timeout, not `Background()`
- [ ] `go test -race ./...` in CI; `goleak.VerifyTestMain(m)` (or `VerifyNone`); `synctest` for time-dependent tests
- [ ] Pool size from `runtime.GOMAXPROCS(0)` (cgroup-aware [1.25]), not `NumCPU()`
- [ ] Channel direction annotations (`chan<-`, `<-chan`) on exported params; only the sender closes
- [ ] No shared mutable state without a mutex / typed atomic; per-key limiter maps have eviction
- [ ] Graceful shutdown waits for in-flight goroutines under a bounded timeout

---

## See Also {#see-also}

- [errors-and-resilience.md](errors-and-resilience.md#panic-recovery): panic recovery rules, `errgroup` re-panic, timeouts/`Cause`
- [performance.md](performance.md): goroutine profiling, `sync.Pool`, scheduler overhead
- [data-structures-and-caching.md](data-structures-and-caching.md#concurrent-maps): sharded map vs `sync.Map`, LRU, singleflight cache layer
- [testing-advanced.md](testing-advanced.md#goroutine-leaks): `goleak` setup, `synctest` patterns
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md#race-detector): race detector workflow, deadlock/goroutine dumps
- [internals.md](internals.md): GMP scheduler, goroutine stacks, memory model
- [cloud-native.md](cloud-native.md#containers): container-aware `GOMAXPROCS`

## Sources {#sources}

- go.dev/doc/go1.19-go1.27 release notes; go.dev/blog/go1.26; go.dev/ref/mem; go.dev/doc/articles/race_detector
- pkg.go.dev/{sync, sync/atomic, context, testing/synctest, runtime/pprof}; pkg.go.dev/golang.org/x/sync/{errgroup,semaphore,singleflight}; pkg.go.dev/golang.org/x/time/rate
- go.dev/blog/{pipelines, synctest, loopvar-preview}; go.dev/blog/context
- Accepted proposals/CLs: `WaitGroup.Go` (#63796); `sync.Map`→HashTrieMap (#70683, CL 608335); synctest (#67434, #73567); loopvar (#60078); errgroup `SetLimit`/`TryGo` (CL 405174); `goroutineleak` profile (1.26/1.27 notes)
- go.uber.org/goleak; github.com/puzpuzpuz/xsync; sourcegraph/conc
