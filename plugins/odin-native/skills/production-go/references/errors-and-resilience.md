# Errors and Resilience Patterns

Go's `(value, error)` convention is a design philosophy: wrap with `%w` to expose, `%v` to hide; pick sentinel/typed/opaque deliberately; put retry/circuit-breaker/timeout resilience at **boundaries**, not deep in the stack. Handle each error **once**.

> Source horizon: verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 row was checked against the final notes. Version tags `[1.N]` mark the release a claim applies to. Deepened from multi-source research.

## TL;DR: the modern deltas (read first)

- **`errors.AsType[E](err) (E, bool)` [1.26]** is the preferred typed-error extractor, generic, reflection-free, ~zero-alloc, scoped to the `if`, and a wrong type is a *compile* error (not the runtime panic `errors.As` can throw). `errors.As` is **not deprecated**; the docs just say "for most uses, prefer `AsType`." Keep `As` for pre-1.26 support or a dynamically-chosen `target any`.
- **`fmt.Errorf("static")` now allocates the same as `errors.New` [1.26]**. The old "use `errors.New` for plain strings" rule is **stale**. Use whichever reads better.
- **`errors.Unwrap` returns `nil` for `errors.Join` / multi-`%w`** [1.20]. It only calls `Unwrap() error`, never `Unwrap() []error`. The #1 multi-error trap.
- **`errors.Join` does not flatten**. Calling it in a loop builds an O(N²) nested tree. Accumulate `[]error`, `Join` once.
- **`recover()` only catches a panic in the *same goroutine*, in a *directly-deferred* function.** A panic in a goroutine you spawned crashes the whole process unless *it* recovers.
- **`%w` is an API commitment** (you promise to keep surfacing that error); `%v` keeps it opaque. Don't reflexively `%w` everything.

## Table of Contents
1. [Error Hierarchy Design](#error-hierarchy)
2. [Typed extraction: errors.AsType vs As](#astype)
3. [Error Wrapping Strategy](#wrapping-strategy)
4. [Multi-Error Handling](#multi-error)
5. [errors.Is / As traversal semantics](#is-as)
6. [Retry with Backoff](#retry)
7. [Circuit Breaker](#circuit-breaker)
8. [Timeouts and Deadlines](#timeouts)
9. [Graceful Degradation](#graceful-degradation)
10. [Panic Recovery in Production](#panic-recovery)
11. [Structured errors with slog](#slog-errors)
12. [Library landscape & status](#libraries)
13. [Version map 1.20→1.27](#versions)
14. [What models get wrong](#stale)

---

## Error Hierarchy Design {#error-hierarchy}

Three strategies (Dave Cheney's taxonomy, still canonical). Choose by *what the caller needs*:

| Strategy | Form | Caller checks with | Use when |
|---|---|---|---|
| **Sentinel** | `var ErrNotFound = errors.New("not found")` | `errors.Is(err, ErrNotFound)` | A small, stable set of conditions callers branch on (`io.EOF`, `sql.ErrNoRows`) |
| **Typed** | `type ValidationError struct{ Field string }` | `errors.AsType[*ValidationError](err)` [1.26] | Callers need **structured fields** (which field, status code, retry-after) |
| **Opaque** | return the error; assert on a *behavior interface* | `errors.AsType[interface{ Temporary() bool }](err)` | Default at cross-package boundaries: add context without committing to a type |

```go
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
)

type ValidationError struct{ Field, Message string }
func (e *ValidationError) Error() string { return fmt.Sprintf("%s: %s", e.Field, e.Message) }

// Domain error: operation + category + cause; Is() delegates to the Kind sentinel.
type DomainError struct{ Op string; Kind, Err error }
func (e *DomainError) Error() string  { return fmt.Sprintf("%s: %s: %v", e.Op, e.Kind, e.Err) }
func (e *DomainError) Unwrap() error  { return e.Err }
func (e *DomainError) Is(t error) bool { return errors.Is(e.Kind, t) }
```

**Expert points models miss:** never branch on `err.Error()` string contents (it's for humans). Sentinels create *source coupling* (callers must import your package); prefer behavior interfaces, which Go satisfies structurally (no import). A sentinel must be **comparable** or `errors.Is` panics. Make a sentinel a stable condition, not a fresh `errors.New` per call.

---

## Typed extraction: errors.AsType vs As {#astype}

```go
func AsType[E error](err error) (E, bool)   // [1.26]  generic, reflection-free
func As(err error, target any) bool          // [1.13]  reflection; panics on bad target
```

Both walk the same tree (the error, then a pre-order DFS of children via `Unwrap() error`/`Unwrap() []error`), and both honor a node's custom `As(any) bool`. `AsType` adds compile-time type safety and ~10× speed with zero alloc on the fast path.

```go
// CORRECT [1.26]
if pe, ok := errors.AsType[*fs.PathError](err); ok {
    log.Printf("failed at: %s", pe.Path)
}

// STALE — verbose throwaway pointer; and As PANICS at runtime if target isn't a
// non-nil pointer to an error/interface type (a value target is a runtime panic,
// not a compile error).
var pe *fs.PathError
if errors.As(err, &pe) { /* ... */ }

// WRONG — bare type assertion misses a wrapped *fs.PathError entirely:
if pe, ok := err.(*fs.PathError); ok { /* ... */ }
```

**The `else if` shadowing footgun** (AI-generated code is especially prone; open vet proposal to flag it):

```go
// WRONG: the inner `err` shadows the outer one; the else-if matches a typed nil.
if err, ok := errors.AsType[*FooErr](err); ok { ... } else if err, ok := errors.AsType[*BarErr](err); ok { ... }
// RIGHT: distinct names.
if fe, ok := errors.AsType[*FooErr](err); ok { ... } else if be, ok := errors.AsType[*BarErr](err); ok { ... }
```

`go fix`'s modernizer [1.26] auto-rewrites the `var x; errors.As(err,&x)` shape to `AsType` when `x` isn't used outside the `if`. Use `errors.Is` (not `AsType`) for value/sentinel identity; `AsType` is for extracting a typed value to read its fields.

---

## Error Wrapping Strategy {#wrapping-strategy}

`%w` records the operand as retrievable by `Is`/`As`/`AsType`; `%v`/`%s` flattens to text and **severs the chain**.

```go
return fmt.Errorf("load config %s: %w", name, err) // chain preserved — callers can Is/As
return fmt.Errorf("query failed: %v", err)         // opaque — cause hidden from callers
```

**`%w` is an API contract.** Wrapping `sql.ErrNoRows` means you've promised callers `errors.Is(err, sql.ErrNoRows)` keeps working, even if you swap DB drivers. Wrap to **expose**; use `%v` (or map to a domain sentinel) to **hide** implementation details at boundaries, which also prevents leaking internal paths/queries into responses.

```go
// Translate at the boundary instead of leaking the driver error:
if errors.Is(err, sql.ErrNoRows) { return ErrUserNotFound }
return fmt.Errorf("internal repository error: %v", err) // masked
```

When NOT to wrap: no-info layers (`return fmt.Errorf("%w", err)` → just `return err`); sentinel terminators a caller compares by `==` at a contract boundary (e.g. a `Read` that must return exactly `io.EOF`); stack-trace-bearing errors (capture once at the leaf, don't re-wrap each layer); hot loops where the error is immediately discarded.

Message style: lowercase, no trailing punctuation, describe the operation (`"reading config"` not `"failed to read config"`), include IDs/keys/filenames, don't repeat context already in the wrapped error. `%w` only accepts an `error`; `fmt.Errorf("%w", "str")` is a bug. **`fmt.Errorf("static")` vs `errors.New` is now purely stylistic [1.26]** (alloc parity).

---

## Multi-Error Handling {#multi-error}

`errors.Join(errs ...error) error` [1.20] is **nil-safe** (drops nils, returns nil if all nil); the result implements `Unwrap() []error`. `fmt.Errorf` with **multiple `%w`** [1.20] produces a different tree-typed error. Both make `Is`/`As`/`AsType` traverse a tree.

```go
// CORRECT — accumulate, Join once (flat, O(N) traversal):
var errs []error
for _, it := range items {
    if err := it.Validate(); err != nil {
        errs = append(errs, fmt.Errorf("item %s: %w", it.ID, err))
    }
}
return errors.Join(errs...) // nil if empty/all-nil

// WRONG — Join in a loop builds a deeply nested tree → O(N²) Is/As traversal:
var e error
for _, it := range items { if err := it.Do(); err != nil { e = errors.Join(e, err) } }
```

**The trap:** `errors.Join` does **not flatten**, and `errors.Unwrap` returns **nil** for it (it only calls `Unwrap() error`). To enumerate children, type-assert:

```go
if multi, ok := err.(interface{ Unwrap() []error }); ok {
    for _, e := range multi.Unwrap() { /* ... */ }
}
```

Stdlib `errors.Join` supersedes `go.uber.org/multierr` and `hashicorp/go-multierror` for new code (reach for those only for custom formatting/`Append` ergonomics).

---

## errors.Is / As traversal semantics {#is-as}

Both inspect a **tree**: the error, then each child (`Unwrap() error` or `Unwrap() []error`), **pre-order, depth-first**. `Is` is true if *any* node matches; `As`/`AsType` returns the **first** match in that order (so `Join` argument order is observable behavior). A node matches `Is` if it `==` the target (target must be comparable, else **panic**) or has `Is(error) bool` returning true; matches `As`/`AsType` if assignable, or has `As(any) bool`. Override `Is`/`As` to check **only the receiver**; recursing duplicates the stdlib walk.

---

## Retry with Backoff {#retry}

Production retry = **exponential backoff + full jitter + context cancellation + error classification**. Stdlib-first (zero deps):

```go
func retry(ctx context.Context, maxAttempts int, op func(context.Context) error) error {
    const base, cap = 100 * time.Millisecond, 10 * time.Second
    var last error
    for attempt := range maxAttempts {          // [1.22] range-over-int
        last = op(ctx)
        if last == nil { return nil }
        if !retryable(last) { return last }     // 4xx/validation/ctx.Canceled → stop
        if attempt == maxAttempts-1 { break }

        backoff := base                          // build iteratively — DON'T `base * (1<<attempt)` (int64 overflow)
        for i := 0; i < attempt && backoff < cap; i++ { backoff *= 2 }
        backoff = min(backoff, cap)
        delay := time.Duration(rand.Int64N(int64(backoff))) // [1.22] math/rand/v2 — FULL jitter [0,backoff)

        t := time.NewTimer(delay)
        select {
        case <-ctx.Done(): t.Stop(); return ctx.Err() // honor cancellation/deadline
        case <-t.C:
        }
    }
    return fmt.Errorf("after %d attempts: %w", maxAttempts, last)
}
```

Traps: `time.Sleep(d)` ignores `ctx` (can't cancel mid-backoff); `base * (1<<attempt)` overflows `int64` at large `attempt` → negative/huge delay; **no jitter** synchronizes clients into retry storms (full jitter is the default per AWS's analysis). **Timer-leak currency:** before [1.23] `select { case <-time.After(d): case <-ctx.Done(): }` in a loop leaked a timer per iteration; **[1.23] unreferenced timers/tickers are GC-eligible and channels are synchronous**, so the old "always use `NewTimer` to avoid leaks" advice is stale for `go 1.23+` modules (`Stop` still good hygiene). `staticcheck SA1015` is obsolete on 1.23+.

Libraries: `cenkalti/backoff` (current major exposes context-first `Retry`, `Permanent`, `RetryAfter`, sentinel give-up errors; APIs differ across v4/v5/v6, so match the project's import path) and `avast/retry-go` (declarative `RetryIf`). Prefer the stdlib loop unless you need their ergonomics.

---

## Circuit Breaker {#circuit-breaker}

Retries handle *transient* faults; breakers handle *systemic* ones (a dead dependency; retrying just burns the connection pool). State machine: **Closed → Open** (trip on threshold; fail fast) **→ Half-Open** (probe; success closes, failure re-opens).

```go
import "github.com/sony/gobreaker/v2"  // v2 = generics; v1 returned interface{}

cb := gobreaker.NewCircuitBreaker[[]byte](gobreaker.Settings{
    Name:        "inventory",
    MaxRequests: 3,                 // probes allowed in half-open
    Timeout:     10 * time.Second,  // open → half-open after this
    ReadyToTrip: func(c gobreaker.Counts) bool { return c.ConsecutiveFailures > 5 },
    IsExcluded:  func(err error) bool {          // don't trip on caller cancellation
        return errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded)
    },
})
body, err := cb.Execute(func() ([]byte, error) { return fetch(ctx) })
if errors.Is(err, gobreaker.ErrOpenState) { /* fail fast → degrade (below) */ }
```

**Expert points:** exclude caller cancellations/deadlines from failure counting (`IsExcluded`) or benign aborts trip the breaker; treat `ErrOpenState` as a **degradation trigger**, not a user-facing error. For composing retry + breaker + timeout + fallback + hedging in one place, `failsafe-go` is the comprehensive option (composition order is outer→inner). `afex/hystrix-go` is unmaintained, so avoid it.

---

## Timeouts and Deadlines {#timeouts}

Propagate the caller's `ctx`; derive child deadlines from it; never store a `ctx` in a struct (except short-lived request structs). **Cancellation is cooperative**: `WithTimeout` just closes `ctx.Done()`; long operations must poll it.

```go
ctx, cancel := context.WithTimeoutCause(parent, 2*time.Second, ErrUpstreamSlow) // [1.21]
defer cancel()                                  // ALWAYS — even on success; frees the timer
if err := call(ctx); err != nil {
    // ctx.Err() is coarse (Canceled/DeadlineExceeded); context.Cause(ctx) is the SPECIFIC reason.
    if errors.Is(err, context.DeadlineExceeded) { return fmt.Errorf("call: %w", context.Cause(ctx)) }
    return err
}
```

**Cause-carrying APIs:** `WithCancelCause`+`Cause` [1.20]; `WithDeadlineCause`/`WithTimeoutCause`/`WithoutCancel`/`AfterFunc` [1.21]; `signal.NotifyContext` cancels with a **signal-named cause** [1.26]. **Traps:** checking `ctx.Err()` and missing `context.Cause(ctx)`; `err == context.DeadlineExceeded` instead of `errors.Is` (it's usually wrapped); forgetting `defer cancel()` (leaks the timer even on success; `go vet`'s `lostcancel` catches common cases); imposing a fresh longer timeout downstream that outlives the request budget. Set broader timeouts high, narrower low (a 30s handler contains a 5s DB call). HTTP client timeouts: see [http-and-apis.md](http-and-apis.md#http-client).

---

## Graceful Degradation {#graceful-degradation}

On a *transient/availability* failure (open breaker, timeout, 5xx) serve a degraded-but-valid result; never degrade on correctness failures (auth, validation, 4xx). Always **log at Warn** and emit a **metric** so silent fallback doesn't mask an outage.

```go
data, err := primary(ctx)
if err != nil {
    if errors.Is(err, gobreaker.ErrOpenState) || isTransient(err) {
        if cached, ok := cache.Get(key); ok {
            slog.WarnContext(ctx, "serving stale cache", slog.Any("err", err))
            return cached, nil // degrade, don't fail
        }
    }
    return nil, err
}
```

---

## Panic Recovery in Production {#panic-recovery}

The hard rule: `recover()` returns non-nil only inside a function **deferred directly** by the **same goroutine** that's panicking. An unrecovered panic in *any* goroutine crashes the **whole process**.

```go
// WRONG — the recover protects process()'s stack only; the goroutine panic kills everything.
func process() {
    defer func() { _ = recover() }()
    go func() { panic("boom") }() // crashes the program
}

// CORRECT — recover inside the goroutine, capture the stack.
go func() {
    defer func() {
        if r := recover(); r != nil {
            slog.Error("worker panic", slog.Any("panic", r), slog.String("stack", string(debug.Stack())))
        }
    }()
    work()
}()
```

Boundaries & specifics: recover at trust boundaries only (request handler top, worker-goroutine top, plugin call sites). `net/http` already recovers a handler panic (aborts that request, logs a stack), but **not** goroutines you spawn from a handler; `panic(http.ErrAbortHandler)` aborts a response without the stack log. `panic(nil)` yields a `*runtime.PanicNilError` since [1.21] (so `recover()` is never a misleading nil on a real panic; old boolean-flag workarounds are obsolete). **`sync.WaitGroup.Go(f)` [1.25]** removes `Add`/`Done` boilerplate but its doc says **`f` must not panic** (no recovery for you); `go vet` [1.25] flags `wg.Add(1)` inside a freshly-spawned goroutine. `golang.org/x/sync/errgroup` recovers panics in `Go`/`TryGo` and **re-raises them from `Wait`** (as a panic value, not a returned error), so a recover at the `Wait` site is needed if you want an error; `Wait` returns only the **first** error. (Verify the exact `x/sync` tag for re-panic behavior.) Panic for programmer bugs / impossible states; return `error` for runtime conditions (network, file, input, permission).

---

## Structured errors with slog {#slog-errors}

`slog` [1.21] is a logging API, not an error-construction library. Keep branching semantics in error *values*; put machine-readable context in attrs.

```go
slog.ErrorContext(ctx, "checkout failed", slog.Any("err", err), slog.String("order_id", id))
// WRONG: pre-stringifying drops LogValuer + structured/wrapped data:
slog.Error("checkout failed", "err", err.Error())
```

**Redaction = allow-list via `LogValuer` on the type** (O(1), no reflection), not a global `ReplaceAttr` deny-list (O(N) string-matching every line):

```go
type AuthError struct{ UserID, Token string; Err error }
func (e *AuthError) Error() string { return e.Err.Error() }
func (e *AuthError) LogValue() slog.Value {     // Token deliberately omitted
    return slog.GroupValue(slog.String("user_id", e.UserID))
}
```

There is **no `slog.Err` helper** (the proposal was rejected); convention is `slog.Any("err", err)`. `slog.NewMultiHandler` [1.26] fans out to several handlers. `Logger` discards `Handler.Handle` errors; wrap the handler if sink failure matters. Stdlib slog has no built-in stack capture (use an error lib that carries frames, logged via `slog.Any`). Full observability detail: [observability.md](observability.md).

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| stdlib `errors`/`fmt`/`context`/`slog` | **Default** | Almost always |
| `pkg/errors` | **Archived/dead** (pre-1.13) | Never in new code |
| `cockroachdb/errors` | Maintained, heavyweight | Distributed systems: cross-process error encoding, stack traces, redactable "safe details", Sentry |
| `samber/oops` | Maintained, structured builder | slog/APM-centric apps wanting `.With/.Tags/.Code` context + `LogValuer` |
| `errors.Join` (stdlib) | **Default** [1.20] | Supersedes `uber/multierr`, `hashicorp/go-multierror` |
| `cenkalti/backoff` | Active | Retry w/ backoff+jitter, `Permanent`/`RetryAfter` (match major version) |
| `sony/gobreaker/v2` | Active, standard | A single count-based breaker (v2 = generics) |
| `failsafe-go` | Active, comprehensive | Composing retry+breaker+timeout+fallback+hedging |
| `afex/hystrix-go` | Unmaintained | Avoid |

---

## Version map 1.20→1.27 {#versions}

| Ver | Errors/resilience-relevant |
|---|---|
| **1.20** | `errors.Join`; multi-`%w`; `Unwrap() []error` tree traversal (but `errors.Unwrap` returns nil for it); `context.WithCancelCause`/`Cause` |
| **1.21** | `log/slog`; `context.WithDeadlineCause`/`WithTimeoutCause`/`WithoutCancel`/`AfterFunc`; `panic(nil)`→`*runtime.PanicNilError`; `errors.ErrUnsupported` |
| **1.22** | `go vet` checks slog key/value args; range-over-int; `math/rand/v2` |
| **1.23** | Timers/tickers GC'd unreferenced; timer channels synchronous → old `time.After`-leak advice stale |
| **1.24** | `testing/synctest` (experiment): deterministic time for retry/timeout tests |
| **1.25** | `sync.WaitGroup.Go` (f must not panic); `go vet` flags `wg.Add` in new goroutine; `slog.GroupAttrs`; flight recorder |
| **1.26** | **`errors.AsType[E]`**; `fmt.Errorf` alloc-parity with `errors.New`; `slog.NewMultiHandler`; `NotifyContext` cancels with a cause; `go fix` modernizers (auto-migrate `As`→`AsType`); experimental goroutine-leak profile |
| **1.27** | Generic methods (enables generic error-assertion methods); `asynctimerchan` GODEBUG removed (timer channels always synchronous); `encoding/json/v2` GA (error text differs). GA 2026-08-19; row from 2026-06 RC notes, confirmed against the final release notes. |

---

## What models get wrong {#stale}

1. Emitting `var x; errors.As(err,&x)` instead of `errors.AsType[T](err)` [1.26] (faster, safer, turns a runtime panic into a compile error).
2. Claiming `fmt.Errorf("plain")` is slower than `errors.New`: **stale [1.26]** (alloc parity).
3. Expecting `errors.Unwrap` to traverse `errors.Join`/multi-`%w`: it returns **nil**; type-assert `interface{ Unwrap() []error }`.
4. Assuming `errors.Join` flattens: it nests; loop-Join is O(N²). Accumulate `[]error`, Join once.
5. `recover()` in the wrong goroutine / not directly deferred: does nothing; spawned goroutines aren't covered by `net/http`'s recover.
6. `time.Sleep` in retry loops (ignores ctx); `time.After`-in-select leak on ≤1.22 (GC'd 1.23+).
7. Integer overflow `base*(1<<attempt)`; **no jitter** → retry storms.
8. Checking `ctx.Err()` and missing `context.Cause(ctx)` [1.20+] (incl. the signal name from `NotifyContext` [1.26]); `err == context.DeadlineExceeded` instead of `errors.Is`.
9. Forgetting `defer cancel()` after `WithTimeout`/`WithCancel`: leaks the timer even on success.
10. Over-wrapping with `%w` (leaks internals as API) vs masking with `%v` at boundaries.
11. `AsType` `else if` variable shadowing → operates on a typed nil.
12. Reaching for `pkg/errors` (archived) in new code.
13. Pre-stringifying for slog (`err.Error()`): drops `LogValuer`/structured data; inventing `slog.Err` (doesn't exist).
14. Log-and-return at every layer: violates "handle once"; add context + return deep, log once at the boundary.
15. `sync.WaitGroup.Go` with a function that can panic [1.25]: it isn't recovered for you.
16. Branching on `err.Error()` substrings instead of `Is`/`AsType`/behavior interfaces.

---

## See Also {#see-also}
- [concurrency.md](concurrency.md): goroutine lifecycle, errgroup, `WaitGroup.Go`
- [distributed-systems.md](distributed-systems.md): breakers/retries at service boundaries, idempotency
- [observability.md](observability.md): error-rate metrics, slog with trace correlation
- [modern-go.md](modern-go.md#errors): `errors.AsType` in the version matrix

## Sources {#sources}
- go.dev/doc/go1.20-go1.27 release notes; pkg.go.dev/{errors,fmt,context,log/slog,sync,golang.org/x/sync/errgroup}
- go.dev/blog/go1.13-errors; dave.cheney.net/2016/04/27 (handle errors once)
- Accepted proposals: AsType (#51945), Join/multi-`%w` (#53435), errgroup panics (#53757); rejected `slog.Err` (#63547)
- go.dev/wiki/Go123Timer; AWS "Exponential Backoff And Jitter"; sony/gobreaker, cenkalti/backoff, failsafe-go, cockroachdb/errors, samber/oops repos
