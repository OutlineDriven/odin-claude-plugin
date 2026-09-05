# Design Patterns in Go

Half the GoF catalog dissolves into a language feature in Go: singleton → `sync.OnceValue`, strategy/command/template-method → first-class funcs, iterator → `iter.Seq`, observer → channels or `slog.Handler`, flyweight → `unique`. The Go-idiomatic question is never "which pattern is more OO" but "does a func, closure, interface, embedding, or generic already do this?" If a pattern adds a layer but not a *semantic boundary*, it's the anti-pattern.

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. The `go` directive in `go.mod` gates which features compile (a mandatory minimum since 1.21). Tag generated code with the floor it needs. Deepened from multi-source research.

## TL;DR: the modern deltas (read first)

- Iterators are the #1 stale area. Custom iteration is `iter.Seq[V]`/`iter.Seq2[K,V]` + range-over-func [1.23], not hand-rolled `Next()/Value()` interfaces or channel generators. Models still emit the old forms; `slices`/`maps` now produce and consume `iter.Seq`.
- Singletons → the `sync.Once` family [1.21]: `OnceValue[T]`/`OnceValues[T1,T2]`/`OnceFunc`. They **cache the panic** (re-panic on every call); raw `sync.Once.Do` does not. Prefer DI over any singleton.
- The loop-variable capture bug is fixed [1.22]: `x := x` inside a `range` loop is dead code in `go 1.22+` modules; emitting it (or guarding against the bug) is a stale-output tell.
- Embedding has no virtual dispatch. An embedded type's method calling a sibling method dispatches to the *embedded* type, never the embedder's override: Template-Method-via-embedding silently misbehaves.
- Generics aren't automatically faster: GCShape monomorphization + dictionaries make a type-param value behave much like an interface value at runtime. Use generics for *structure* (containers/algorithms), interfaces for *behavior*.
- **`new(expr)`** [1.26] retires the `func Int(v int) *int` helper genre for optional pointer fields.

## Table of Contents
1. [Philosophy](#philosophy)
2. [Creational Patterns](#creational)
3. [Functional options vs config struct](#options-vs-config)
4. [Structural Patterns](#structural)
5. [Behavioral Patterns](#behavioral)
6. [Iterators: range-over-func](#iterators)
7. [Generics as a pattern tool](#generics)
8. [Go-Specific Patterns](#go-specific)
9. [Decision Tree](#decision-tree)
10. [Library landscape & status](#libraries)
11. [Version map 1.18→1.27](#versions)
12. [Anti-Patterns](#anti-patterns)
13. [What models get wrong](#stale)
14. [See Also](#see-also)
15. [Sources](#sources)

---

## Philosophy {#philosophy}

- Composition over inheritance. Embedding is has-a, not is-a, and there is **no virtual dispatch** (see [Template Method](#behavioral)).
- Accept interfaces, return structs. Define the interface in the **consumer** package (implicit satisfaction, no `implements`); return concrete `*T` from constructors so the API can grow methods without a breaking interface change.
- Small interfaces. `io.Reader` (1 method) is the gold standard; compose with embedding (`io.ReadWriter`). >5 methods → split. The `-er` naming convention.
- Functions are first-class. Most GoF behavioral patterns collapse to higher-order functions.
- Pattern overhead limit. If a pattern needs >30 lines of scaffolding, you're overengineering.

> Code examples omit imports for brevity. All compile against the standard library unless noted.

---

## Creational Patterns {#creational}

### Factory: a function, not a hierarchy

`func New...() *T` returning a **concrete** type is the idiom (e.g. `database/sql` driver registration). Deep `AbstractFactory`/`FactoryMethod` class trees are an anti-pattern; abstract factory is justified only for families of related objects that must be used together (multi-backend plugin systems).

```go
func NewServer(addr string, handler http.Handler) *Server {
    return &Server{addr: addr, handler: handler, logger: slog.Default()}
}
```

### Singleton: `sync.OnceValue` [1.21], not a Java class

Avoid singletons by default. A singleton is a global with extra steps: it hides dependencies and breaks test isolation. The idiomatic default is **dependency injection**. Reserve `OnceValue` for genuinely process-wide expensive resources (a DB pool, config loaded once).

```go
// MODERN [1.21] — concurrency-safe, type-safe, no mutex/value boilerplate.
var Config = sync.OnceValue(func() *Cfg { return loadCfg() })          // call: Config()

var DB = sync.OnceValues(func() (*sql.DB, error) { return sql.Open("pgx", dsn) })

// WRONG — Java-style GetInstance() + global, or an init()-based singleton:
// it couples boot order, defeats lazy init, and is untestable.
var once sync.Once; var inst *Cfg
func GetInstance() *Cfg { once.Do(func() { inst = loadCfg() }); return inst }
```

The panic-caching trap (verbatim from `pkg.go.dev/sync`): for `OnceFunc`/`OnceValue`/`OnceValues`, "If f panics, the returned function will panic with the same value on every call", and the value/error is cached **permanently**; to retry you must construct a fresh `OnceValues`. Contrast raw `sync.Once.Do`: "If f panics, Do considers it to have returned; future calls of Do return without calling f"; it neither re-panics nor retries. Choose the semantics you actually want.

### Builder: usually unnecessary

Prefer a config struct literal or [functional options](#options-vs-config). A builder (method chain → `Build() (T, error)`) is justified **only** for genuinely staged construction where many fields must be validated *together*: a query builder, not optional config.

```go
func Select(table string) *QueryBuilder { return &QueryBuilder{table: table} }
func (q *QueryBuilder) Where(c string, args ...any) *QueryBuilder {
    q.wheres = append(q.wheres, c); q.args = append(q.args, args...); return q
}
func (q *QueryBuilder) Build() (string, []any, error) {
    if q.table == "" { return "", nil, errors.New("table required") }
    sql := "SELECT * FROM " + q.table
    if len(q.wheres) > 0 { sql += " WHERE " + strings.Join(q.wheres, " AND ") }
    return sql, q.args, nil
}
```

### Object Pool: `sync.Pool` for GC-pressure relief only

Recycle **ephemeral** objects on hot paths (the canonical case: `*bytes.Buffer` in a handler). The GC may drain the pool at any time (objects survive at most ~one GC cycle via the victim cache), so never assume persistence. **Always `Reset()` before reuse** or you leak data between requests. Pooling small structs often costs more than it saves: benchmark with `-benchmem`. For connections use a real pool (`*sql.DB`), never `sync.Pool`. Full rules: [performance.md](performance.md#sync-pool).

### Optional pointer fields: `new(expr)` [1.26]

For "pointer means optional" fields (JSON/protobuf-shaped APIs, option structs), `new(expr)` is the new baseline and retires home-grown `Int`/`String`/`Bool`/`Ptr` helpers (`go fix`'s `newexpr` modernizer rewrites them).

```go
type Request struct{ Name string; Limit *int `json:"limit,omitempty"` }
req := Request{Name: "jobs", Limit: new(100)}   // [1.26] — was: Limit: Int(100)
```

### Prototype: rarely idiomatic

Use explicit copy constructors or `slices.Clone`/`maps.Clone` [1.21]; mind shallow vs deep copy.

---

## Functional options vs config struct {#options-vs-config}

The high-signal creational decision. Both are valid: pick by *how the configuration is used*, not by OO instinct.

| | Functional options | Config struct |
|---|---|---|
| **Best when** | Many *optional* knobs; terse default call site matters; API must grow additively; an option encapsulates logic/validation | Config is **data** callers inspect, diff, clone, marshal; few fields; hot path |
| **Discoverability** | Lower: options scattered as `WithXxx` funcs | Higher: all fields listed on `pkg.go.dev` |
| **Cost** | A closure alloc per option; interface-form options aren't inlinable | Zero per-call overhead |

```go
// FUNCTIONAL OPTIONS [Rob Pike 2014] — error-returning variant for validation.
type Option func(*Server) error
func WithTimeout(d time.Duration) Option {
    return func(s *Server) error {
        if d <= 0 { return errors.New("timeout must be > 0") }
        s.timeout = d; return nil
    }
}
func NewServer(addr string, opts ...Option) (*Server, error) {
    s := &Server{addr: addr, timeout: 5 * time.Second, logger: slog.Default()} // defaults
    for _, opt := range opts {
        if err := opt(s); err != nil { return nil, err }
    }
    return s, nil
}

// CONFIG STRUCT — when configuration is data to inspect/reuse/marshal.
type ClientConfig struct{ BaseURL string; Timeout time.Duration; Retries int }
func NewClient(cfg ClientConfig) (*Client, error) {
    if cfg.Timeout == 0 { cfg.Timeout = 5 * time.Second }  // defaults on a copy
    return &Client{cfg: cfg}, nil
}

// WRONG — positional booleans + magic zeroes; can't evolve without breaking callers.
func NewServer(addr string, timeout time.Duration, verbose, json bool) *Server
```

**Variants experts reach for:** *interface options* (`type Option interface{ apply(*cfg) }`) to share one option across several APIs and group them in godoc (the gRPC/etcd style); *generic options* `type Option[T any] func(*T)` [1.18] to share option machinery across config types. **Don't mix options and a config struct** in one constructor unless there's a strong reason: hybrids are harder to reason about than either alone. **Anti-pattern:** handing the constructor a `*Config` that the caller also retains (shared mutable state), or requiring `nil` for the default case.

---

## Structural Patterns {#structural}

### Adapter / Decorator: funcs + embedding

Two idiomatic levels; the `io.Reader`/`io.Writer` chain (`gzip.NewWriter(bufio.NewWriter(f))`) and `http.Handler` middleware validate both. Elaborate `Component`/`ConcreteDecorator` UML hierarchies are the stale form.

```go
// FUNCTION-WRAPPING — single-method contracts (the dominant form; HTTP middleware).
type Middleware func(http.Handler) http.Handler
func Chain(h http.Handler, mw ...Middleware) http.Handler {
    for i := len(mw) - 1; i >= 0; i-- { h = mw[i](h) }  // mw[0] is outermost
    return h
}

// STRUCT-EMBEDDING — multi-method interfaces: embed it, override some, delegate the rest.
type LoggingStore struct{ Store }                       // unoverridden methods promoted
func (s LoggingStore) Get(ctx context.Context, k string) (string, error) {
    slog.InfoContext(ctx, "get", "key", k)
    return s.Store.Get(ctx, k)
}
```

The adapter form converts one interface to another via a struct: Go's implicit interfaces make it natural (`SlogAdapter{logger}` implementing a third-party `Log(level int, msg string)`).

### Proxy: same interface, wrapping impl

Controls access through the identical interface (lazy load, access control, caching). A caching proxy must implement **all** interface methods and keep the cache coherent on writes.

```go
type CachingStore struct{ next Store; mu sync.RWMutex; cache map[string]entry; ttl time.Duration }
type entry struct{ v string; exp time.Time }
func (s *CachingStore) Get(ctx context.Context, key string) (string, error) {
    s.mu.RLock()
    if e, ok := s.cache[key]; ok && time.Now().Before(e.exp) { s.mu.RUnlock(); return e.v, nil }
    s.mu.RUnlock()
    v, err := s.next.Get(ctx, key)
    if err != nil { return "", err }
    s.mu.Lock(); s.cache[key] = entry{v, time.Now().Add(s.ttl)}; s.mu.Unlock()
    return v, nil
}
```

**Reverse-proxy note:** `httputil.ReverseProxy.Director` is **deprecated [1.26]**: a malicious client can strip `Director`-added headers by marking them hop-by-hop. Use `Rewrite` (added 1.20), which sees both inbound and outbound requests:

```go
proxy := &httputil.ReverseProxy{Rewrite: func(r *httputil.ProxyRequest) {
    r.SetURL(target); r.Out.Host = r.In.Host  // only if you explicitly want this
}}
```

### Facade: a service struct

A struct whose methods coordinate subsystems behind a simpler API. Most Go "service" types are facades; no GoF ceremony needed.

```go
type OrderService struct{ orders OrderRepository; payments PaymentGateway; notify Notifier }
func (s *OrderService) Place(ctx context.Context, o Order) error {
    if err := s.payments.Charge(ctx, o.Total); err != nil { return fmt.Errorf("payment: %w", err) }
    if err := s.orders.Save(ctx, o); err != nil { return fmt.Errorf("save: %w", err) }
    s.notify.Send(ctx, o.UserID, "Order placed"); return nil
}
```

### Composite: a slice of an interface

Tree structures with a uniform interface: a recursive struct holding `[]Component`. No special machinery.

```go
type Component interface{ Render() string }
type Leaf struct{ text string }
func (l *Leaf) Render() string { return l.text }
type Container struct{ children []Component }
func (c *Container) Render() string {
    var b strings.Builder
    for _, ch := range c.children { b.WriteString(ch.Render()) }
    return b.String()
}
```

### Flyweight / intern / cache: `unique` [1.23], `weak` [1.24]

For deduplicating **comparable immutable** values, `unique.Make[T comparable](v T) Handle[T]` is the canonical interning facility: handle equality reduces to a near-pointer comparison, far cheaper than comparing the values.

```go
h1, h2 := unique.Make("tenant-a"), unique.Make("tenant-a")
if h1 == h2 { /* canonicalized to the same logical value */ }
```

Beyond comparable interning, `weak.Pointer` + `runtime.AddCleanup` [1.24] build caches/canonicalization maps without leaking. `weak.Make[T](ptr *T) Pointer[T]`; `(p Pointer[T]) Value() *T` returns the original pointer or `nil` once reclaimed (the package documents its use-cases verbatim as "implementing caches, canonicalization maps (like the unique package), and for tying together the lifetimes of separate values"). `runtime.AddCleanup` **replaces `runtime.SetFinalizer`** (multiple cleanups per object, no reference-cycle leak; panics if `arg == ptr`).

```go
type Cache struct{ mu sync.Mutex; data map[string]weak.Pointer[[]byte] }
func (c *Cache) Get(key string) ([]byte, bool) {
    c.mu.Lock(); defer c.mu.Unlock()
    if wp, ok := c.data[key]; ok {
        if v := wp.Value(); v != nil { return *v, true }
        delete(c.data, key)                 // reclaimed → drop stale entry
    }
    return nil, false
}
```

> The correct API is `weak.Make`/`.Value`; some blog snippets show `weak.New`/`.Get`, which do not exist. Stale forms: `runtime.SetFinalizer`, or an unbounded `map` cache that leaks.

### Bridge: rarely needed

Composition with two interfaces (`struct{ A InterfaceA; B InterfaceB }`) achieves the same decoupling without the pattern overhead.

---

## Behavioral Patterns {#behavioral}

### Strategy: a func type, not a one-method interface

Default to a function type; use an interface only when the strategy carries **multiple coordinated methods or state**. `slices.SortFunc(s, cmp)` is the canonical example.

```go
// RIGHT — lightweight, composable.
type RetryPolicy func(attempt int, err error) (backoff time.Duration, retry bool)
func Do(ctx context.Context, fn func(context.Context) error, p RetryPolicy) error {
    for attempt := 0; ; attempt++ {
        err := fn(ctx)
        if err == nil { return nil }
        backoff, ok := p(attempt, err)
        if !ok { return err }
        t := time.NewTimer(backoff)
        select {
        case <-ctx.Done(): t.Stop(); return context.Cause(ctx)
        case <-t.C:
        }
    }
}
// OVER-DESIGNED — a Strategy interface + ConcreteStrategyA/B structs when a func suffices.
// type RetryStrategy interface{ Next(attempt int, err error) (time.Duration, bool) }
```

### Command: a closure or `func() error`

No `Command` interface needed unless you need **undo or serialization** (then `Do()/Undo()` is justified: editor history, task queues, macro recording).

```go
type Command interface{ Execute() error; Undo() error }
type History struct{ done []Command }
func (h *History) Run(c Command) error {
    if err := c.Execute(); err != nil { return err }
    h.done = append(h.done, c); return nil
}
func (h *History) Undo() error {
    if len(h.done) == 0 { return errors.New("nothing to undo") }
    c := h.done[len(h.done)-1]; h.done = h.done[:len(h.done)-1]; return c.Undo()
}
```

### Template Method: function fields, NOT embedding

Go has **no virtual dispatch through embedding**: an embedded base method that calls another method dispatches to the *embedded* type, not the embedder's override. Code that embeds a base struct and overrides a "hook" expecting polymorphism produces a **silent bug**. Inject the varying step as a function field or an interface.

```go
// RIGHT — vary the step via a function field.
type Importer struct{ Parse func([]byte) (Record, error) }   // overridable step
func (im Importer) Run(data []byte) (Record, error) { return im.Parse(data) }
```

### Observer: channels, or `slog.Handler` for logging fan-out

Cross-goroutine pub/sub maps directly to a channel (non-blocking `select`+`default` to drop slow subscribers); in-process notification is a synchronous `[]func(E)` guarded by an `RWMutex`. For structured-logging/event fan-out, `log/slog` [1.21] is the stdlib observer (`Handler`: `Enabled`/`Handle`/`WithAttrs`/`WithGroup`). **`slog.NewMultiHandler` [1.26]** fans one record to multiple handlers (OR semantics for `Enabled`, aggregating sink errors with `errors.Join`): the stdlib answer for "console + JSON/file", retiring hand-rolled tee handlers. Reach for `samber/slog-multi` only for routing/failover/pipelines.

```go
logger := slog.New(slog.NewMultiHandler(            // [1.26]
    slog.NewTextHandler(os.Stderr, nil),
    slog.NewJSONHandler(file, nil),
))
```

### State: iota+switch, or interface-per-state

Default to `iota` + a `switch` transition guard; reserve interface-per-state for genuinely complex per-state behavior (full machines with persistence: [advanced-patterns.md](advanced-patterns.md#state-machines)).

```go
type OrderStatus int
const ( StatusPending OrderStatus = iota; StatusPaid; StatusShipped )
func (s OrderStatus) CanTransitionTo(next OrderStatus) bool {
    switch s {
    case StatusPending: return next == StatusPaid
    case StatusPaid:    return next == StatusShipped
    default:            return false
    }
}
```

### Chain of Responsibility: middleware, or `errors.Join`

The HTTP middleware chain is canonical ([http-and-apis.md](http-and-apis.md)). For non-HTTP validation, compose funcs; for aggregating independent failures, `errors.Join` [1.20] returns one error implementing `Unwrap() []error` (note: `errors.Unwrap` returns **nil** for it: type-assert `Unwrap() []error` or use `errors.Is`/`As`).

```go
type Validator func(string) error
func Chain(vs ...Validator) Validator {
    return func(v string) error {
        for _, val := range vs { if err := val(v); err != nil { return err } }
        return nil
    }
}
```

### Visitor / Mediator: type switch / channels

**Not idiomatic as the GoF double-dispatch form.** Use a type switch (justified only for stable, closed type sets) instead of Visitor; a coordinator goroutine + channels instead of Mediator.

```go
func Eval(n Node) int {
    switch n := n.(type) {
    case *NumNode: return n.Value
    case *AddNode: return Eval(n.Left) + Eval(n.Right)
    default:       panic(fmt.Sprintf("unknown: %T", n))
    }
}
```

---

## Iterators: range-over-func {#iterators}

**The highest-signal stale area.** Since [1.23] a custom iterator is an `iter.Seq[V]` (`func(yield func(V) bool)`) ranged over directly, not a `Next()/Value()` interface and not a channel generator. The all-elements method is conventionally named `All`. `slices`/`maps` now bridge to/from these (`slices.Collect`, `slices.Sorted`, `maps.Keys`, `maps.Collect`).

```go
func (s *Set[V]) All() iter.Seq[V] {
    return func(yield func(V) bool) {
        for v := range s.m {
            if !yield(v) { return }          // MUST honor early-stop, or panic
        }
    }
}
// consume: for v := range s.All() { ... }

keys := slices.Sorted(maps.Keys(m))          // [1.23] — replaces make+append+sort.Strings
```

Signatures: `iter.Seq[V] = func(yield func(V) bool)`, `iter.Seq2[K,V] = func(yield func(K,V) bool)`. Error handling: either `iter.Seq2[T, error]` (consumer does `for v, err := range`) or a terminal `Err()` getter (the `bufio.Scanner` precedent). `iter.Pull`/`Pull2` convert push→pull (starts a coroutine: **`defer stop()`**).

```go
// WRONG — channel generator: leaks the goroutine if the consumer breaks early, and is slower.
func gen() <-chan T { ch := make(chan T); go func(){ defer close(ch); /* ... */ }(); return ch }
```

**Pitfall experts know:** omitting `if !yield(v) { return }` panics at runtime with the exact message *"range function continued iteration after function for loop body returned false"* (per the go.dev blog *Range Over Function Types*). This is **not caught by the compiler or `go vet`**: the burden is on the author. Never `recover` inside the iterator body to swallow a stop. Use iterators for **traversal**; keep channels for **concurrency** (ownership transfer, backpressure).

---

## Generics as a pattern tool {#generics}

Generics [1.18] replaced `interface{}` for **type-safe containers and algorithms** independent of element type (`Set[T]`, `Stack[T]`, `slices.Index`). The governing heuristic (from the Go team's *When To Use Generics*): **generics describe structure; interfaces describe behavior**. If you only call methods on a value, use an interface.

```go
type Set[T comparable] struct{ m map[T]struct{} }
func (s *Set[T]) Add(v T) { s.m[v] = struct{}{} }
func (s *Set[T]) Contains(v T) bool { _, ok := s.m[v]; return ok }

// WRONG — parameterizing a function that only calls interface methods: no speed gain, harder to read.
// func Copy[T io.Reader](r T) ...   →   just  func Copy(r io.Reader) ...
```

**Where generics hurt readability / don't pay off:** wrapping an interface in a type parameter (above); micro-optimizing: Go compiles generics by GCShape monomorphization + dictionaries, so a type-param value often behaves like an interface value at runtime, i.e. generics are **not automatically faster** (benchmark before claiming a win). **Constraints:** `comparable` for map keys/equality; `cmp.Ordered` [1.21] for `<`/`>`; an interface with a **type set** (`~int | ~int64`) to permit operators on the underlying types; method-set constraints for behavior. **Type-set relaxation [1.25]:** "core types" were removed from the spec: operations on a type-param operand (e.g. slicing something constrained by `~[]byte | ~string`) are now validated by type-set checks; no behavior change, but more operations are allowed. Generic type aliases [1.24] (`type Set[T comparable] = map[T]struct{}`) ease refactors across packages. **Generic methods are [1.27 RC]**, not 1.26, and interface methods still may not declare type parameters, and generic methods can't satisfy interface methods; in 1.26 a generic helper stays a package-level function or a method on a generic receiver.

---

## Go-Specific Patterns {#go-specific}

### Accept Interfaces, Return Structs

Accept the narrowest interface you need; return the concrete type. Define the interface in the **consumer** package: early interface abstraction freezes the API around guessed use cases and makes worse mocks.

```go
// consumer package owns the interface it needs:
type Fetcher interface{ Fetch(context.Context, string) ([]byte, error) }
// producer returns a concrete *Client (can grow methods without breaking anyone):
func NewClient(h *http.Client) *Client { return &Client{http: h} }
```

**Exception:** return `error` (an interface): Go's universal contract. Heuristic, not dogma: don't split an interface for a single implementation. Mocking detail: [testing.md](testing.md).

### Embedding as Composition

Promote methods one level deep; for override, use explicit fields + delegation (embedding has no virtual dispatch).

```go
type CountingWriter struct{ io.Writer; BytesWritten int64 }
func (w *CountingWriter) Write(p []byte) (int, error) {
    n, err := w.Writer.Write(p); w.BytesWritten += int64(n); return n, err
}
// BAD — deep chains simulating inheritance: Animal → Dog → GoldenRetriever.
```

### Zero-Value Usability

Design types whose zero value works: no constructor required (`sync.Mutex`, `bytes.Buffer`). If a nil map would panic, lazy-init on first write.

```go
type Counter struct{ mu sync.Mutex; n int64 }
func (c *Counter) Inc() { c.mu.Lock(); c.n++; c.mu.Unlock() }   // no NewCounter() needed
```

### Sentinel Behavior: unexported interface guard

Prevent external implementations by requiring an unexported method (AST nodes, closed token sets). Don't overuse: most interfaces should stay open.

```go
type Token interface{ isToken(); String() string }
type stringToken struct{ val string }
func (stringToken) isToken() {}
func (s stringToken) String() string { return s.val }
```

### Cross-references

Functional options & DI: [project-patterns.md](project-patterns.md). Error-as-value (`errors.Join`, `errors.AsType[E]` [1.26]): [errors-and-resilience.md](errors-and-resilience.md). Channel pipelines / fan-out / worker pools: [concurrency.md](concurrency.md). `sync.WaitGroup.Go` [1.25] (prefer over `Add`/`Done` for new code; `f` must not panic; use `errgroup` if you need error/cancellation): [concurrency.md](concurrency.md#errgroup).

---

## Decision Tree {#decision-tree}

| I need to... | Pattern | Go implementation |
|---|---|---|
| Configure with many *optional* knobs | **Functional Options** | `NewX(opts ...Option)`: [options vs config](#options-vs-config) |
| Treat config as inspectable/reusable data | **Config struct** | `NewX(cfg Config)` with defaults on a copy |
| Validate many required fields together | **Builder** | Method chain → `Build() (T, error)` |
| Ensure one-time initialization | **Singleton** | `sync.OnceValue` [1.21]: prefer DI; caches panics |
| Reuse expensive temp objects on hot paths | **Object Pool** | `sync.Pool`: `Reset()`, benchmark first |
| Optional pointer field | **`new(expr)`** [1.26] | `Limit: new(100)` |
| Swap one behavior at runtime | **Strategy** | `func` type; interface only if stateful/multi-method |
| Add behavior to existing type | **Decorator** | `func(H) H`, or embed-and-override |
| Adapt an incompatible interface | **Adapter** | Struct implementing the target interface |
| Simplify a complex subsystem | **Facade** | Service struct coordinating sub-components |
| Decouple components | **Accept Interfaces** | Interface defined at the consumer, inject via ctor |
| Notify multiple listeners | **Observer** | Channels (cross-goroutine), callbacks, or `slog` handlers |
| Fan one log record to many sinks | **Composite (logging)** | `slog.NewMultiHandler` [1.26] |
| Model state transitions | **State** | `iota`+switch, or interface-per-state |
| Build middleware / validation chains | **Chain of Resp.** | `func(H) H`: [http-and-apis.md](http-and-apis.md) |
| Queue / undo operations | **Command** | `Execute()`+`Undo()`, else `func() error` |
| Iterate a custom collection | **Iterator** | `iter.Seq[V]` [1.23]: honor `yield` |
| Type-safe container/algorithm | **Generics** | `[T any]` / `[T comparable]` [1.18] |
| Dedup comparable immutable values | **Flyweight** | `unique.Make` [1.23] |
| Cache with GC-aware lifetime | **Flyweight/cache** | `weak.Pointer` + `runtime.AddCleanup` [1.24] |
| Control access / cache | **Proxy** | Same interface, wrapping impl |
| Tree with uniform ops | **Composite** | Shared interface, `[]Child` field |

---

## Library landscape & status {#libraries}

| Old / third-party | Status [2026] | Modern replacement |
|---|---|---|
| Hand-rolled `Next()/Value()` iterators | Superseded | `iter.Seq`/`Seq2` [1.23] |
| Channel generators for iteration | Discouraged (leak/slow) | range-over-func [1.23] |
| `runtime.SetFinalizer` | Footgun; replaced in stdlib | `runtime.AddCleanup` [1.24] |
| `init()`-based / bare-global singletons | Discouraged | `sync.OnceValue` [1.21] or DI |
| Custom intern map (comparable values) | Superseded | `unique` [1.23] |
| Hand-rolled tee `slog.Handler` | Superseded for basic fanout | `slog.NewMultiHandler` [1.26] |
| `httputil.ReverseProxy.Director` | **Deprecated [1.26]** (hop-by-hop unsafe) | `ReverseProxy.Rewrite` (since 1.20) |
| `golang.org/x/exp/slices`, `/maps` | Graduated | stdlib `slices`/`maps` [1.21] |
| `golang.org/x/exp/constraints` | Partly graduated | `cmp.Ordered` [1.21]; keep x/exp for `Signed`/`Integer` |
| logrus | Maintenance mode | `log/slog` [1.21] |
| zap / zerolog | Valid for max throughput | `log/slog` for most services |
| `hashicorp/go-multierror`, `uber/multierr` | Largely superseded | `errors.Join` [1.20] |
| `tools.go` blank-import trick | Pre-1.24 fallback | `go get -tool` + `tool` directives [1.24] |
| `grpc.Dial`/`DialContext`, `WithBlock`/`WithInsecure` | Deprecated/discouraged in grpc-go | `grpc.NewClient` + `WithTransportCredentials` |
| `google.golang.org/grpc` | Active (`NewClient` era) | none |
| `go.uber.org/fx` / `google/wire` | Active / "feature complete" | App-boundary DI (fx) / compile-time wiring (wire) |
| `samber/slog-multi` | Active; complements stdlib | Routing/failover/pipelines beyond `MultiHandler` |

> Library status drifts; treat versions as approximate and verify import paths against the project. We never forbid a library, only flag deprecated *APIs*.

---

## Version map 1.18→1.27 {#versions}

| Ver | Pattern-relevant |
|---|---|
| **1.18** | Generics (`any`, `comparable`): type-safe containers replace `interface{}`; generic options |
| **1.20** | `errors.Join`, multi-`%w`, `Unwrap() []error` (chain-of-responsibility aggregation); `ReverseProxy.Rewrite` added |
| **1.21** | `sync.OnceFunc/OnceValue/OnceValues` (canonical singleton; caches panics); `slices`/`maps`/`cmp`/`min`/`max`/`clear`; `log/slog` (observer); `slices.Clone`/`maps.Clone` |
| **1.22** | Per-iteration loop variable (kills capture bug; `x := x` now dead code); range-over-int |
| **1.23** | `iter.Seq`/`Seq2` + range-over-func (canonical iterator); `slices`/`maps` iterator bridges; `unique` (interning/flyweight) |
| **1.24** | `weak.Pointer` + `runtime.AddCleanup` (cache/flyweight; replaces `SetFinalizer`); generic type aliases; Swiss-table maps; `tool` directives in `go.mod` |
| **1.25** | `sync.WaitGroup.Go` (f must not panic); `go vet` flags misplaced `WaitGroup.Add`; "core types" removed from spec (type-set-validated operations) |
| **1.26** | `new(expr)`; `slog.NewMultiHandler`; `errors.AsType[E]`; `httputil.ReverseProxy.Director` **deprecated**; `go fix` modernizers (`newexpr`, `forvar`, `AsType`); self-referential generic types |
| **1.27 (RC)** | Generic methods (interface methods still can't be generic; generic methods can't satisfy interface methods); `encoding/json/v2` (stricter); stdlib `uuid`. GA ~Aug 2026; treat all [1.27] tags as provisional. |

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Problem | Fix |
|---|---|---|
| **God interface** (>5 methods) | Forces needless implementations | Split: `Reader`, `Writer`, `Closer` |
| **Interface with one impl** | Premature abstraction | Concrete type until a 2nd impl/mock exists |
| **Return interface from ctor** | Hides concrete type; breaks evolution & assertions | `func New() *T`: return concrete |
| **Implementor-side interface** | Freezes API around guessed uses | Define the interface in the consumer |
| **Inheritance via embedding** | No virtual dispatch: silent bug | Function field / interface for the varying step |
| **Deep embedding chains** | Confusing method resolution | Explicit field + forwarding |
| **`interface{}`/`any` container** | No type safety | Generics [1.18] |
| **Java-style getters/setters** | `GetName()`/`SetName()` noise | Exported field `u.Name` |
| **Error-free constructor doing I/O** | `New() (*T, error)` vs `New() *T` confusion | `*T` only when it can't fail |
| **`init()` for globals** | Hidden order, untestable, no DI | Explicit init in `main()`, inject |
| **Channel generator for traversal** | Goroutine leak on early break | `iter.Seq` [1.23] |
| **`runtime.SetFinalizer`** | Cycle leaks, single finalizer | `runtime.AddCleanup` [1.24] |
| **`x := x` in a `go 1.22+` `range` loop** | Dead code; stale-output tell | Delete it |
| **Naked goroutines** | No lifecycle | `errgroup` or `WaitGroup.Go` + ctx |
| **`context.Context` in a struct** | Violates the context contract | First param: `func (s *Svc) Do(ctx, ...)` |
| **Panic for control flow** | Breaks caller expectations | Return `error`; panic only for programmer bugs |

---

## What models get wrong {#stale}

1. Hand-rolled `Next()/Value()` iterators or channel generators instead of `iter.Seq`/`Seq2` [1.23], and forgetting `if !yield(v) { return }`, which panics ("range function continued iteration...") and is **not** caught by the compiler or `go vet`.
2. Emitting pre-1.22 loop-variable-capture bugs, **or** superstitiously adding `x := x` in `go 1.22+` modules (dead code; `loopclosure`/`go vet` no longer flag it; `go fix`'s `forvar` removes it).
3. Java-style singletons (`GetInstance()`+mutex, or `init()` globals) instead of `sync.OnceValue`/`OnceValues` [1.21], and not knowing these **cache panics/errors permanently** (raw `sync.Once.Do` does not re-panic).
4. Over-using `interface{}`/`any` where generics [1.18] give type safety, and the inverse: parameterizing a function that only calls interface methods (no win, less readable).
5. Returning interfaces from constructors / defining implementor-side interfaces instead of "accept interfaces, return structs" with consumer-side interfaces.
6. Inheritance-mimicking embedding: expecting an embedded base method to dispatch to the embedder's override: silent Template-Method bug (no virtual dispatch).
7. `runtime.SetFinalizer` instead of `runtime.AddCleanup` [1.24]; unbounded `map` caches instead of `weak.Pointer` [1.24] / `unique` [1.23]; using the nonexistent `weak.New`/`.Get` (it's `weak.Make`/`.Value`).
8. Mutable functional-options bugs (sharing a `*Config`); over-applying options in hot paths where a config struct is faster; mixing options + config struct without cause.
9. Reaching for logrus/zap reflexively instead of `log/slog` [1.21]; hand-rolling a tee handler instead of `slog.NewMultiHandler` [1.26]; ignoring `LogValuer` for lazy/sensitive fields.
10. `sync.Pool` misuse: pooling connections/long-lived/tiny objects; forgetting `Reset()` (cross-request data leak); assuming pooled objects persist.
11. Deep GoF class hierarchies (AbstractFactory, full Decorator/Visitor UML) where a func, closure, embedding, or type switch is idiomatic.
12. Optional-pointer helpers (`func Int(v int) *int`) despite `new(expr)` [1.26].
13. `httputil.ReverseProxy.Director` in new proxies: deprecated [1.26]; use `Rewrite`.
14. Claiming generics are faster than interfaces (GCShape + dictionaries, benchmark first); emitting generic methods while claiming 1.26 compat (they're [1.27 RC]).
15. Using `golang.org/x/exp/slices|maps` when the stdlib versions [1.21] exist; `tools.go` blank imports instead of `go.mod` `tool` directives [1.24].

---

## See Also {#see-also}

- [project-patterns.md](project-patterns.md): functional options, DI, package design
- [http-and-apis.md](http-and-apis.md): middleware / chain-of-responsibility, reverse proxy
- [concurrency.md](concurrency.md): channel pipelines, fan-out/fan-in, errgroup, `WaitGroup.Go`
- [advanced-patterns.md](advanced-patterns.md): `iter.Seq` composition, state machines, generics
- [errors-and-resilience.md](errors-and-resilience.md): error hierarchy, wrapping, `errors.Join`, circuit breaker
- [performance.md](performance.md): `sync.Pool` deep dive, allocation profiling
- [modern-go.md](modern-go.md): Go 1.21-1.26 feature reference, deprecated→modern map
- [testing.md](testing.md): table-driven tests, interface mocking
- [observability.md](observability.md): slog handlers, logging/metrics/tracing decorators

---

## Sources {#sources}

- go.dev/doc/go1.18-go1.27 release notes; pkg.go.dev/{sync,iter,unique,weak,runtime,log/slog,slices,maps,cmp,net/http/httputil}
- go.dev/blog: *Range Over Function Types* (Ian Lance Taylor, 2024); *When To Use Generics*; *Using go fix to modernize Go code*; *Goodbye core types* (Griesemer, 2025)
- go.dev/wiki/CodeReviewComments (consumer-side interfaces, return concrete types); [Effective Go](https://go.dev/doc/effective_go); [Go Proverbs](https://go-proverbs.github.io/)
- Rob Pike / Dave Cheney (2014): functional options origin
- Verified [1.24/1.26] API surface against pkg.go.dev: `weak.Make`/`.Value`, `unique.Make`/`.Value`, `sync.OnceValue`/`OnceValues` panic-caching, `slog.NewMultiHandler`, `httputil.ReverseProxy.Director` deprecation, `new(expr)`
