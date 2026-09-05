# Advanced Patterns

Generics-era Go: constraints you'd actually design, the iterator ecosystem (`iter.Seq`/`Pull`), compile-time guards, and the patterns the language *resists* (Result/Option). The throughline: **reach for these only when a concrete type or interface won't do.** Most "advanced" generic code is overengineering: the bar is "two or more types with identical logic," not "this could be generic."

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. Baseline assumed: Go 1.22.

## TL;DR: the deltas that matter (read first)

- Generic methods land in [1.27]: `func (s *Set[T]) Map[U any](...) ...` is finally legal. Before 1.27 a method **cannot** add its own type parameters (only the receiver's), which is why functional helpers like `Map`/`Filter` are package-level *functions*, not methods. Even in 1.27, **interface methods still cannot be generic** and **a generic method cannot satisfy an interface method**.
- `golang.org/x/exp/constraints.Ordered` is redundant since [1.21]: its own doc says so; it's now a type alias for `cmp.Ordered`. Use builtin `cmp.Ordered`. Keep `x/exp/constraints` only for `Signed`/`Unsigned`/`Integer`/`Float`/`Complex` (no stdlib equivalent).
- Iterators (`iter.Seq`/`Seq2`) are a real ecosystem now [1.23]: `slices`/`maps` produce and consume them; `iter.Pull` bridges push→pull. But a hand-written `for` loop is still clearer for one-off traversal; iterators pay off for *composition* and *unbounded/lazy* sequences.
- `samber/lo` (functional helpers) is mostly unnecessary: stdlib `slices`/`maps`/`cmp`/`iter` cover the common 80%. Reach for `lo` only for `GroupBy`/`Partition`/`Chunk`-style ops with no stdlib equal, and never let it replace a plain loop.
- Result[T]/Option[T] are anti-idiomatic in Go. `(T, error)` and the comma-ok idiom *are* the language's sum types. A `Result` monad fights `errors.Is`/`As`, defers error handling, and reads foreign. Don't introduce them.
- `var _ I = (*T)(nil)` is the compile-time interface assertion every exported type implementing an interface should carry: it turns a missing method into a *compile* error at the definition, not a confusing one at a distant call site.
- Function type inference is generalized in [1.27] (works in all assignment/conversion contexts), removing many explicit `[T]` annotations that 1.21 still required.

## Table of Contents
1. [Advanced Generics: constraint design](#generics)
2. [Type inference limits & generic methods](#inference)
3. [Self-referential generics](#self-referential)
4. [When generics hurt vs help](#generics-tradeoffs)
5. [The iterator ecosystem (iter.Seq / Pull)](#iterators)
6. [Functional composition: Map/Filter/Reduce](#functional-patterns)
7. [Functional helpers: samber/lo vs stdlib](#lo-vs-stdlib)
8. [Result / Option and why Go resists them](#result-option)
9. [Phantom & typed-key patterns](#phantom)
10. [Compile-time interface assertions](#interface-assertions)
11. [Code generation as a pattern](#codegen)
12. [State machines](#state-machines)
13. [Streaming & LLM/SSE relay](#streaming)
14. [Scheduling and background jobs](#scheduling)
15. [AI/LLM SDK integration](#ai-llm)
16. [Web scraping](#scraping)
17. [Inter-service communication](#isc)
18. [Memory management internals](#memory-internals)
19. [File I/O & streaming composition](#file-io)
20. [Library landscape & status](#libraries)
21. [Version map 1.21→1.27](#versions)
22. [What models get wrong](#stale)

---

## Advanced Generics: constraint design [1.18+] {#generics}

A constraint is an interface used as a **type set**, not a method set. Design it around *what operations the body needs*, nothing more.

```go
// cmp.Ordered [1.21] — the canonical type-set constraint. Prefer over hand-rolled "Ordered".
func Max[T cmp.Ordered](a, b T) T { if a > b { return a }; return b }

// Method-set constraint — the body calls a method, so generics buy nothing a plain
// interface wouldn't. Use the interface unless you also need to RETURN T or hold []T typed.
type Stringer interface{ String() string }
func Join[T Stringer](xs []T, sep string) string { /* ... */ return "" }
```

**`~` (underlying-type) is the high-leverage operator.** `~int64` admits `type UserID int64`; bare `int64` rejects it. Omitting `~` is the #1 constraint bug: it silently excludes every named type.

```go
type Numeric interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
        ~float32 | ~float64
}
type Celsius float64           // satisfies ~float64
func Sum[T Numeric](xs []T) T { var s T; for _, x := range xs { s += x }; return s }
```

`comparable` vs `cmp.Ordered`: `comparable` [1.18] permits `==`/`!=` and map keys (no ordering); `cmp.Ordered` adds `< <= > >=` but **excludes** the comparable-but-unordered types (structs, arrays, interfaces). A `comparable` type parameter satisfies map-key and `==` needs; reach for `cmp.Ordered` only when you actually compare magnitude. Note: `comparable` admits interface types whose dynamic value may panic on `==` [1.20 loosened the rules]; guard untrusted comparisons.

Constraint packages: what to import:

| Need | Use | Notes |
|---|---|---|
| `<`/ordering | **`cmp.Ordered`** [1.21] (builtin) | `x/exp/constraints.Ordered` is now just an alias: redundant |
| `==` only / map key | **`comparable`** (builtin) | Predeclared; no import |
| Signed/Unsigned/Integer/Float/Complex sets | `golang.org/x/exp/constraints` | **No stdlib equivalent**: legitimate dependency |
| First-nonzero / coalesce | **`cmp.Or(vals...)`** [1.22] | Replaces `if x == "" { x = def }` chains |

Design rules models miss: keep the type set minimal (don't union types the body never touches); a union of method-set elements is rarely meaningful (`A | B` where both have methods can't be called; the intersection of methods is what's callable, and unions give you `{}`); prefer **one** type parameter over many: `[K comparable, V any]` is fine, `[A, B, C, D any]` signals you want a struct, not a function.

---

## Type inference limits & generic methods {#inference}

Inference improved materially in **[1.21]** (it now reasons through untyped constants, reversed type-arg order, and method values) and is **generalized in [1.27]** to fire in *every* context where a generic function is assigned to or converted to a matching function type. Still, two hard limits shape real code:

1. Return-only type parameters can't be inferred. Nothing in the arguments mentions them, so you must annotate:

```go
func Zero[T any]() T { var z T; return z }
x := Zero[int]()        // REQUIRED — `Zero()` won't compile; T is unconstrained by args

// Same trap with parse/decode helpers:
v, err := Decode[Config](data)   // must spell out [Config]
```

2. Generic methods: forbidden before [1.27], partly allowed after.

```go
// PRE-1.27: ILLEGAL — a method may not introduce its own type parameter.
// func (s Set[T]) Map[U any](f func(T) U) Set[U] { ... }   // compile error

// PRE-1.27 workaround — a package-level FUNCTION (this is why lo.Map etc. are functions):
func MapSet[T, U comparable](s Set[T], f func(T) U) Set[U] { /* ... */ return Set[U]{} }

// [1.27]: LEGAL — methods may declare their own type parameters:
func (s Set[T]) Map[U comparable](f func(T) U) Set[U] { /* ... */ return Set[U]{} }
```

The 1.27 caveat that bites: interface methods **still** can't be generic, and **a generic method does not satisfy a (non-generic) interface method**, so you can't define `Map[U]` on a type and have it count toward a `Mapper` interface. Generic methods widen a *concrete* type's namespace; they do not enable generic polymorphism through interfaces.

---

## Self-referential generics (F-bounded polymorphism) {#self-referential}

A type parameter constrained by an interface mentioning the parameter itself, for "compares/clones/merges with its own kind":

```go
type Ordered[T any] interface{ CompareTo(T) int }

type Tree[T Ordered[T]] struct {        // T must be comparable WITH T
    value       T
    left, right *Tree[T]
}

func (t *Tree[T]) Insert(v T) *Tree[T] {
    if t == nil { return &Tree[T]{value: v} }
    if v.CompareTo(t.value) < 0 {
        t.left = t.left.Insert(v)
    } else {
        t.right = t.right.Insert(v)
    }
    return t
}

type Version struct{ Major, Minor int }
func (v Version) CompareTo(o Version) int { return cmp.Or(v.Major-o.Major, v.Minor-o.Minor) }
// Tree[Version] now type-checks; Tree[int] does not (int has no CompareTo).
```

**Use sparingly.** F-bounded constraints are the most over-applied generic pattern. For ordering, `cmp.Ordered` + a `func(a, b T) int` comparator (the `slices.SortFunc` style) is simpler and composes with the stdlib. Reserve self-reference for genuine recursive contracts (a `Clone() T`, a `Merge(T) T`).

---

## When generics hurt vs help {#generics-tradeoffs}

| Helps | Hurts |
|---|---|
| Container/collection types (`Set[T]`, `Cache[K,V]`, `Queue[T]`), same logic, many element types | One concrete type ever used → just write the concrete code |
| Type-safe data-structure ops keeping `T` through return values | The body only calls methods → a plain `interface` is simpler and decouples better |
| `slices`/`maps`/`cmp` style stdlib utilities | "Future-proofing" with no second type in sight (YAGNI) |
| Eliminating `any` + type-assertion boilerplate | Heavily-constrained unions that obscure intent; readers can't tell what's callable |

```go
// HURTS — single type, no shared abstraction. Generics add cognitive load for nothing.
func ParseConfig[T AppConfig](b []byte) (T, error) { /* ... */ }
// HELPS — just the concrete type:
func ParseConfig(b []byte) (AppConfig, error) { /* ... */ }

// HURTS — body only needs the interface; generics couple callers to a concrete T:
func Process[T Handler](xs []T) { for _, x := range xs { x.Handle() } }
// HELPS — accept the interface; callers pass any mix of implementations:
func Process(xs []Handler) { for _, x := range xs { x.Handle() } }
```

Cost reality: Go compiles generics via **GC shape stenciling + dictionaries**: types sharing a "GC shape" (e.g. all pointers) share one instantiation and pass a runtime dictionary, so generic calls can be *slower* than a monomorphized concrete function and may inhibit inlining. Generics are for **type safety and deduplication**, not speed. If you need raw speed on one type, the concrete function wins. The rule of three: don't generalize until the *third* concrete copy.

---

## The iterator ecosystem (iter.Seq / Pull) [1.23] {#iterators}

```go
type Seq[V any]     func(yield func(V) bool)        // single value per element
type Seq2[K, V any] func(yield func(K, V) bool)     // pair (index/key, value)
```

An iterator is a function that calls `yield` per element; `yield` returning **false** means stop. **`yield` panics if called after it returns false**. Never call it again once it's said stop. `for x := range seq` drives the push iterator and a `break` makes `yield` return false.

```go
func (n *Node[V]) All() iter.Seq[V] {              // conventional method name: All
    return func(yield func(V) bool) {
        for cur := n; cur != nil; cur = cur.Next {
            if !yield(cur.Val) { return }          // honor early stop — or you leak/over-run
        }
    }
}
```

**Single-use iterators** (streams that can't rewind) must say so in the doc (e.g. `strings.Lines` is documented single-use; calling again won't restart).

### Stdlib producers/consumers

| Package | Produce (→ iterator) | Consume (iterator →) |
|---|---|---|
| `slices` | `All`, `Values`, `Backward`, `Chunk` | `Collect`, `AppendSeq`, `Sorted`, `SortedFunc`, `SortedStableFunc` |
| `maps` | `All`, `Keys`, `Values` | `Collect`, `Insert` |
| `strings` [1.24] | `Lines`, `SplitSeq`, `FieldsSeq` | none |

```go
sortedKeys := slices.Sorted(maps.Keys(m))          // idiomatic: sorted map keys, no temp slice
for line := range strings.Lines(content) { /* ... */ }   // [1.24] lazy lines
```

### Push ↔ pull: `iter.Pull` / `Pull2`

`Pull` converts a push iterator into a manually-driven pull pair `(next, stop)` for **interleaving** two sequences, or a state machine that needs "give me one more." Two contracts: **you must call `stop`** if you don't drain (use `defer`), and **`next`/`stop` are not goroutine-safe** (one driver only).

```go
func Zip[A, B any](sa iter.Seq[A], sb iter.Seq[B]) iter.Seq2[A, B] {
    return func(yield func(A, B) bool) {
        na, stopa := iter.Pull(sa)
        nb, stopb := iter.Pull(sb)
        defer stopa()
        defer stopb()
        for {
            a, oka := na()
            b, okb := nb()
            if !oka || !okb { return }             // stop at the shorter sequence
            if !yield(a, b) { return }
        }
    }
}
```

`Pull` spawns a goroutine under the hood to suspend the push iterator (cheap, but it's why you must `stop`): skipping it leaks that goroutine until GC (and [1.27]'s `goroutineleak` profile will flag it).

### Stateful generators

A closure over local state yields an unbounded sequence lazily; pair with `Take` to bound it:

```go
func Naturals() iter.Seq[int] {
    return func(yield func(int) bool) {
        for n := 1; ; n++ { if !yield(n) { return } } // infinite; consumer breaks
    }
}
first10 := slices.Collect(Take(Naturals(), 10))
```

---

## Functional composition: Map / Filter / Reduce [1.23] {#functional-patterns}

Iterator pipelines are **lazy**: nothing runs until a consumer (`Collect`/`Reduce`/`range`) pulls, and no intermediate slice is allocated. These are package-level **functions** (methods couldn't be generic before [1.27]):

```go
func Map[In, Out any](seq iter.Seq[In], f func(In) Out) iter.Seq[Out] {
    return func(yield func(Out) bool) {
        for v := range seq { if !yield(f(v)) { return } }
    }
}
func Filter[V any](seq iter.Seq[V], keep func(V) bool) iter.Seq[V] {
    return func(yield func(V) bool) {
        for v := range seq { if keep(v) && !yield(v) { return } }
    }
}
func Reduce[T, U any](seq iter.Seq[T], init U, f func(U, T) U) U {
    acc := init
    for v := range seq { acc = f(acc, v) }
    return acc
}
func Take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
    return func(yield func(V) bool) {
        i := 0
        for v := range seq {
            if i >= n || !yield(v) { return }
            i++
        }
    }
}
```

```go
// Lazy pipeline — one pass, zero intermediate slices, allocation only at Collect:
result := slices.Collect(Map(Filter(slices.Values(users), isActive), toDTO))
total := Reduce(Map(Filter(slices.Values(nums), even), square), 0, add) // = sum of squares of evens
```

When NOT to: a single `for` loop with an `if` is clearer than `Reduce(Filter(...))` for one-shot work, and a hot loop over a small known slice doesn't need lazy machinery. Pipelines win when stages **compose** or the source is **large/unbounded**. Errors don't thread through these signatures; for fallible transforms, keep an explicit loop that can `return err`.

---

## Functional helpers: samber/lo vs stdlib {#lo-vs-stdlib}

`samber/lo` (Lodash-style generics, actively maintained) predates the stdlib generic helpers and overlaps them heavily. The decision rule: **stdlib first; `lo` only for ops with no stdlib equal.**

| Operation | Stdlib (prefer) | `lo` |
|---|---|---|
| map / filter over a slice | `for` loop, or `iter` pipeline above | `lo.Map`, `lo.Filter` |
| contains / index | `slices.Contains`, `slices.Index` | `lo.Contains` |
| sort, dedup adjacent | `slices.SortFunc`, `slices.Compact` | none |
| dedup all | `slices.Sorted(maps.Keys(set))` / set | `lo.Uniq` |
| keys/values | `maps.Keys`/`maps.Values` (→ `iter.Seq`) | `lo.Keys`/`lo.Values` (→ slice) |
| first non-zero | `cmp.Or` [1.22] | `lo.CoalesceOrEmpty` |
| **GroupBy / Partition / Chunk(map)** | **none** (`slices.Chunk` is slice-only) | `lo.GroupBy`, `lo.Partition`, *legitimate* |

```go
// Idiomatic 80% — no third-party dep:
adults := slices.Collect(Filter(slices.Values(users), func(u User) bool { return u.Age >= 18 }))
host := cmp.Or(cfg.Host, os.Getenv("HOST"), "localhost")   // [1.22]

// Reach for lo only where stdlib has no equivalent:
byDept := lo.GroupBy(employees, func(e Employee) string { return e.Dept })
```

Avoid: `lo.Must(v, err)` (panics on error, turns a recoverable error into a crash; only acceptable in `init`/tests, exactly like `regexp.MustCompile`), and `lo.Ternary(cond, a, b)` (evaluates **both** branches, no short-circuit; a normal `if` is clearer and safe). Pulling in `lo` for `Map`/`Filter` you could write in three lines is a dependency you'll regret on upgrade.

---

## Result / Option and why Go resists them {#result-option}

Rust-style `Result[T,E]` / `Option[T]` are routinely proposed and routinely wrong in Go. **`(T, error)` is Go's `Result`; the comma-ok idiom is Go's `Option`.** They are *more* expressive here because they integrate with the entire ecosystem.

```go
// ANTI-IDIOMATIC — fights the language:
type Result[T any] struct { val T; err error }
func (r Result[T]) Map(f func(T) T) Result[T] { if r.err != nil { return r }; return Ok(f(r.val)) }
r := Fetch(id).Map(transform).Map(validate)      // error handling DEFERRED, opaque, un-greppable

// IDIOMATIC — explicit, composable with errors.Is/As, slog, %w:
v, err := Fetch(id)
if err != nil { return fmt.Errorf("fetch %s: %w", id, err) }
v = transform(v)
if err := validate(v); err != nil { return err }
```

Why Go resists them:
- **`errors.Is`/`As`/`AsType` operate on `error` values**, not a `Result.err` buried in a struct; wrapping a `Result` re-implements the error tree, badly.
- **Deferred handling hides the failure point.** Go's value is that every `if err != nil` marks exactly where a thing can fail; a monad smears that across a chain.
- **No `?` operator**: without it, monadic chains are verbose *and* foreign. The proposal for built-in error-chaining syntax was rejected repeatedly.
- Optionality is already encoded: comma-ok (`v, ok := m[k]`), `*T == nil`, the zero value, or `(T, error)`. A generic `Option[T]` adds a wrapper without adding information.

`samber/mo` provides `Option[T]`/`Result[T]`/`Either` if you're porting a functional codebase, but in *new* Go it signals you're writing another language in Go's syntax. The one defensible niche: a typed **optional field** where zero-vs-absent must differ and you don't want a pointer; even then, `sql.Null[T]` [1.22] or `*T` is more idiomatic than a custom `Option`.

---

## Phantom & typed-key patterns {#phantom}

Phantom types (a type parameter that appears only in the type, never in a field) encode state/units in the type system for compile-time safety at zero runtime cost:

```go
type Unvalidated struct{}
type Validated struct{}

type Request[State any] struct { raw string }            // State is "phantom": no field uses it

func Parse(s string) Request[Unvalidated]                { return Request[Unvalidated]{raw: s} }
func (r Request[Unvalidated]) Validate() (Request[Validated], error) { /* ... */ return Request[Validated]{r.raw}, nil }
func Execute(r Request[Validated])                       { /* only a Validated Request compiles here */ }
// Execute(Parse("x")) // COMPILE ERROR — can't skip Validate(). State machine enforced by the type checker.
```

**Typed context keys**: the canonical fix for `context.WithValue` collisions. Use an **unexported zero-size struct type** as the key so no other package can produce or read it:

```go
type ctxKey struct{}                                     // unexported, unique to this package
var userKey ctxKey

func WithUser(ctx context.Context, u *User) context.Context { return context.WithValue(ctx, userKey, u) }
func UserFrom(ctx context.Context) (*User, bool) { u, ok := ctx.Value(userKey).(*User); return u, ok }
// WRONG: context.WithValue(ctx, "user", u) — string keys collide across packages; go vet flags it.
```

A generic typed-key helper removes the per-lookup assertion while keeping collision safety:

```go
type Key[T any] struct{ name string }
func (k Key[T]) From(ctx context.Context) (T, bool) { v, ok := ctx.Value(k).(T); return v, ok }
```

---

## Compile-time interface assertions {#interface-assertions}

`var _ I = (*T)(nil)` forces the compiler to verify `*T` implements `I` **at the type's definition**, so a missing/mis-typed method is a compile error *here*, not a baffling one where someone tries to use `*T` as an `I`:

```go
type Handler struct{}
func (h *Handler) ServeHTTP(http.ResponseWriter, *http.Request) {}

var _ http.Handler = (*Handler)(nil)   // ← compile-time proof; costs nothing at runtime
```

Conventions: use `(*T)(nil)` (a typed nil, no allocation) for pointer-receiver methods; `T{}` (or `*new(T)`) when value receivers suffice. Place it next to the type. The blank identifier means it's a pure check, not a usable variable. This is the single highest-value "advanced" idiom for library authors: it makes interface conformance a *contract checked at build time*. (For unexported sentinel-interface guards, see design-patterns.md#go-specific.)

---

## Code generation as a pattern {#codegen}

When generics can't express it (specialization per concrete type, methods generics won't allow pre-1.27, enum stringers, mocks), generate code. `go generate` runs directives; the output is committed, reviewable Go.

```go
//go:generate stringer -type=State
//go:generate mockgen -source=repo.go -destination=mock_repo.go -package=repo
```

| Tool | Generates | When |
|---|---|---|
| `stringer` (`golang.org/x/tools/cmd/stringer`) | `String()` for `iota` enums | Every typed-`iota` enum (see state machines below) |
| `go:embed` [1.16] | compile-time file embedding (not codegen, same niche) | Bundle templates/assets |
| `mockgen` / `moq` | interface mocks | Test doubles for interfaces |
| `sqlc` | type-safe DB code from SQL | See database.md |
| `protoc-gen-go` | structs/stubs from `.proto` | See encoding-and-serialization.md#protobuf |

Rules: mark output `// Code generated by X; DO NOT EDIT.` (tooling & reviewers honor it); commit generated files (don't generate at `go build` time); `go generate` is **never** run by `go build`/`go test`; it's a manual/CI step. Prefer generics for type-parametric *logic*; prefer codegen for *per-type methods and boilerplate* generics structurally can't produce. In [1.27], generic methods shrink (not eliminate) the codegen surface.

---

## State machines {#state-machines}

Type-safe states via `iota` + a defined type; pair with `stringer` so logs read names not integers. Forbid string-typed states (typos compile, no exhaustiveness).

```go
type State int
const ( StatePending State = iota; StateRunning; StatePaused; StateCompleted; StateFailed )
//go:generate stringer -type=State

type Event int
const ( EventStart Event = iota; EventPause; EventResume; EventComplete; EventFail )

type Machine struct {
    mu          sync.Mutex
    current     State
    transitions map[State]map[Event]State
    onEnter     map[State]func(context.Context)
}

func (m *Machine) Fire(ctx context.Context, e Event) error {
    m.mu.Lock(); defer m.mu.Unlock()
    next, ok := m.transitions[m.current][e]
    if !ok { return fmt.Errorf("invalid event %v in state %v", e, m.current) }
    m.current = next
    if fn := m.onEnter[next]; fn != nil { fn(ctx) }
    return nil
}
```

For durable/crash-recoverable workflows, persist `current` and rehydrate on restart; at scale use a workflow engine (Temporal) rather than hand-rolling; see scheduling below. The **State design pattern** (behavior-per-state via interface) is in design-patterns.md#behavioral; this table-driven form suits a fixed, auditable transition set.

---

## Streaming & LLM/SSE relay {#streaming}

Relay a streaming upstream (e.g. an LLM) to a client over SSE: flush per chunk, propagate the client's `ctx` so a disconnect cancels the upstream call:

```go
func relayStream(w http.ResponseWriter, r *http.Request) {
    rc := http.NewResponseController(w)              // [1.20] — preferred over the http.Flusher assertion
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")

    ctx := r.Context()                               // client disconnect → ctx canceled → upstream stops
    stream, err := llm.CreateStream(ctx, req)
    if err != nil { http.Error(w, err.Error(), http.StatusBadGateway); return }
    defer stream.Close()

    for {
        chunk, err := stream.Recv()
        if errors.Is(err, io.EOF) { fmt.Fprint(w, "data: [DONE]\n\n"); rc.Flush(); return }
        if err != nil { slog.ErrorContext(ctx, "stream", slog.Any("err", err)); return }
        b, _ := json.Marshal(chunk)
        fmt.Fprintf(w, "data: %s\n\n", b)
        if err := rc.Flush(); err != nil { return }  // client gone
    }
}
```

`http.NewResponseController` [1.20] also exposes `SetWriteDeadline`, better than the bare `w.(http.Flusher)` assertion. For process-output streaming, use `exec.CommandContext` + a `bufio.Scanner` and `select` on `ctx.Done()` to kill the child on cancel (platform-and-build.md#windows for cross-platform process control). Full SSE/WebSocket detail: http-and-apis.md#sse.

---

## Scheduling and background jobs {#scheduling}

In-process recurring work: a `time.NewTicker` driving a `select` on `ctx.Done()` and `t.C` (run the job once before the loop to fire immediately). Cron expressions: `robfig/cron/v3` (`cron.WithSeconds()` for 6-field specs). For **durable, distributed** queues don't hand-roll; pick by backing store: `riverqueue/river` (Postgres, transactional enqueue), `hibiken/asynq` (Redis, retries + dashboard), Temporal (`temporal.io`) for long-running orchestrated workflows/sagas. Don't store retry/scheduling state in process memory if it must survive a restart.

---

## AI/LLM SDK integration {#ai-llm}

```go
client := anthropic.NewClient() // github.com/anthropics/anthropic-sdk-go — reads ANTHROPIC_API_KEY
msg, err := client.Messages.New(ctx, anthropic.MessageNewParams{ /* Model, MaxTokens, Messages */ })
stream := client.Messages.NewStreaming(ctx, params)
for stream.Next() { _ = stream.Current() /* delta events */ }
if err := stream.Err(); err != nil { /* ... */ }   // check Err() after the loop
```

OpenAI (`github.com/openai/openai-go`) uses the same options-struct shape (`client.Chat.Completions.New`). Verify model constants against the imported SDK version; they churn [verify]. For consensus/fan-out across providers, wrap each behind a small interface and run with `errgroup` (concurrency.md#errgroup), and **don't share a slice index across goroutines**; write `results[i]` capturing `i` per range iteration ([1.22] loop-var semantics make the range index safe). Agent/MCP patterns: mcp-and-agents.md.

---

## Web scraping {#scraping}

`gocolly/colly/v2` for static HTML (`colly.NewCollector` → `OnHTML` callbacks; `LimitRule` for rate/parallelism); `chromedp/chromedp` or `go-rod/rod` (simpler API) for JS-rendered pages via CDP. Always set a timeout `ctx`, a real `User-Agent`, and respect `robots.txt`/rate limits.

---

## Inter-service communication {#isc}

`nats-io/nats.go` is the lightweight Go-native option: `nc.Publish`/`nc.Subscribe` for pub/sub, `nc.Request(subj, data, timeout)` for request-reply. An in-process event bus decouples producers/consumers within one binary, but spawning a goroutine per handler drops back-pressure and ordering, so use a real broker for anything durable (event-driven.md). Typed RPC over gRPC/protobuf: encoding-and-serialization.md#protobuf.

---

## Memory management internals {#memory-internals}

See internals.md for the GMP scheduler, GC (tri-color, phases), and the memory model; performance.md for escape analysis (`go build -gcflags=-m`), `GOMEMLIMIT`, pooling, and allocation reduction. [1.27] adds size-specialized malloc (small allocs up to ~30% cheaper) and a GA `goroutineleak` profile, relevant to the `iter.Pull`/goroutine-spawning patterns above.

---

## File I/O & streaming composition {#file-io}

> Full reference: file-io.md (file ops, `os.Root` [1.24], path handling, fs.FS).

Go's I/O is composable like Unix pipes: stack readers/writers, stream without buffering the whole payload:

```go
f, _ := os.Create("data.gz"); defer f.Close()
gz := gzip.NewWriter(bufio.NewWriter(f))             // buffer → gzip → file
defer gz.Close()
io.Copy(gz, src)                                     // streams; constant memory
```

Key composers: `io.TeeReader` (tap), `io.LimitReader` (cap), `io.MultiReader` (concat), `io.Pipe` (in-process stream). Always `Flush` a `bufio.Writer` (a deferred `Close` on the outermost wrapper that flushes works). Line/chunk scanning and large-line buffer tuning: file-io.md#streaming.

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| stdlib `cmp`/`slices`/`maps`/`iter` | **Default** [1.21-1.23] | Almost all generic utility needs |
| `golang.org/x/exp/constraints` | Maintained; `Ordered` redundant | Only `Signed`/`Unsigned`/`Integer`/`Float`/`Complex` |
| `samber/lo` | Active, popular | `GroupBy`/`Partition` and friends w/ no stdlib equal, not as a loop replacement |
| `samber/mo` | Active | Only when porting a functional codebase; anti-idiomatic in new Go |
| `stringer` (`x/tools`) | **Default** | `String()` for `iota` enums |
| `mockgen` / `matryer/moq` | Active | Interface mocks (codegen) |
| `robfig/cron/v3` | Active | Cron expressions in-process |
| `riverqueue/river` / `hibiken/asynq` | Active | Durable job queues (Postgres / Redis) |
| `gocolly/colly/v2`, `chromedp`, `go-rod/rod` | Active | Scraping (static / JS-rendered) |

---

## Version map 1.21→1.27 {#versions}

| Ver | Advanced-patterns-relevant |
|---|---|
| **1.21** | `cmp.Ordered`/`Compare`/`Less`; `slices`/`maps` (non-iterator); generic type inference improvements; `min`/`max`/`clear` builtins |
| **1.22** | `cmp.Or`; loop-var per-iteration semantics (kills goroutine-capture bug); range-over-int; `math/rand/v2`; `sql.Null[T]` |
| **1.23** | **`iter.Seq`/`Seq2`/`Pull`/`Pull2`**; range-over-func; `slices`/`maps` iterator producers/consumers; `unique` package |
| **1.24** | Generic type aliases; `strings.Lines`/`SplitSeq`/`FieldsSeq`; `os.Root`; `testing/synctest` (experiment) |
| **1.25** | `sync.WaitGroup.Go`; `testing/synctest` GA; `T.Attr`; flight recorder |
| **1.26** | `errors.AsType[E]`; `fmt.Errorf` alloc-parity; `slog.NewMultiHandler`; `go fix` modernizers; `goroutineleak` profile (experiment) |
| **1.27 (RC)** | **Generic methods** (methods may declare type params; interfaces still can't, and generic methods don't satisfy interface methods); **function type inference generalized**; `encoding/json/v2` GA; `asynctimerchan` GODEBUG removed (timer channels always synchronous); `go fix` `slicesbackward`/`atomictypes`/etc.; `waitgroup`→`waitgroupgo`. Draft until GA (~Aug 2026). |

---

## What models get wrong {#stale}

1. Writing a generic method with its own type parameter and expecting it to compile **before [1.27]**: illegal; use a package-level function (this is why `lo.Map` is a function).
2. Assuming **[1.27]** generic methods can satisfy an interface or that interface methods can be generic: both are explicitly forbidden.
3. Importing `golang.org/x/exp/constraints` for `Ordered`: **redundant since [1.21]**; it's an alias for `cmp.Ordered`. (Still needed for `Signed`/`Unsigned`/etc.)
4. Omitting `~` in constraints (`int` not `~int`): silently excludes every named type like `type ID int`.
5. Reaching for generics with one concrete type, or when the body only calls an interface's methods: adds cost (GC-shape dictionaries can be *slower*, may block inlining) for no type safety gained.
6. Introducing `Result[T]`/`Option[T]` monads: anti-idiomatic; `(T, error)` and comma-ok are Go's versions and integrate with `errors.Is`/`As`/`%w`.
7. Pulling in `samber/lo` for `Map`/`Filter` that a `for` loop or `slices`/`iter` covers; using `lo.Must` (panics) or `lo.Ternary` (evaluates both branches) in real code.
8. Calling `yield` again after it returned `false`: **panics** [1.23]; always `return` on `!yield(...)`.
9. Forgetting `iter.Pull`'s `stop()` (leaks the suspending goroutine) or calling `next`/`stop` from multiple goroutines (unsafe).
10. Returning `[]T` for large/unbounded sequences instead of `iter.Seq[T]` (forces full materialization).
11. Using `string` context keys (collisions; `go vet` flags) instead of an unexported `struct{}` key type.
12. Skipping `var _ I = (*T)(nil)` on exported types: turns a conformance bug into a confusing error at a distant call site.
13. String-typed state-machine states (typos compile; no `stringer` names in logs): use `iota` + defined type.
14. Running `go generate` expecting `go build`/`go test` to invoke it; it never does; it's a separate step, and output must be committed.
15. Sharing a loop index/slice position across goroutines in fan-out (the LLM-orchestration trap): capture per-iteration (safe on the range index since [1.22]).
16. F-bounded `[T Ordered[T]]` where a `func(a, b T) int` comparator (`slices.SortFunc` style) is simpler.

---

## See Also {#see-also}
- [design-patterns.md](design-patterns.md): GoF patterns, State pattern, sentinel-interface guards (this file is the generics-era complement)
- [concurrency.md](concurrency.md): goroutine lifecycle, errgroup, worker pools, fan-out/fan-in
- [modern-go.md](modern-go.md): iteration, type system (generic aliases), version matrix
- [errors-and-resilience.md](errors-and-resilience.md): `errors.AsType`, why `(T, error)` beats `Result`
- [mcp-and-agents.md](mcp-and-agents.md): MCP servers, agent frameworks
- [performance.md](performance.md) / [internals.md](internals.md): generic instantiation cost, escape analysis, GC

## Sources {#sources}
- pkg.go.dev/{iter, cmp, slices, maps, golang.org/x/exp/constraints} @ go1.26.4 (signatures, `Ordered` redundancy note, `Or` added 1.22, yield-after-false panic, single-use iterators, `Pull` goroutine semantics)
- go.dev/doc/go1.27 (RC): generic methods + interface restriction, function type inference generalized, `encoding/json/v2` GA, `asynctimerchan` removed, `go fix` modernizers, `goroutineleak` GA
- go.dev/blog/range-functions; go.dev/blog/intro-generics, go.dev/blog/when-generics (constraint design, GC-shape stenciling)
- go.dev/doc/go1.{21,22,23,24,25,26} release notes (version map)
- Repos: samber/lo, samber/mo, robfig/cron, riverqueue/river, hibiken/asynq, gocolly/colly, chromedp, go-rod/rod; anthropics/anthropic-sdk-go, openai/openai-go [model constants verify against imported version]
