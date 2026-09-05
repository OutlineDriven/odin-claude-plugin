# API Design (Go Libraries & Services)

API design is the discipline of choosing your **exported surface** so it stays small, stays compatible, and reads well at the call site. The Go 1 backward-compatibility promise is the model to copy for your own packages: once published, **you cannot break callers**. Every exported name is a liability you maintain forever: design for the *zero value*, accept interfaces sparingly, return concrete types, and add (never change) when you evolve.

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. No research corpus; claims are checked against go.dev primary sources; `[verify]` marks anything I could not confirm.

## TL;DR: the judgment calls (read first)

- The Go 1 promise is your contract too. Adding an exported field/method is *usually* safe; removing/renaming/retyping one is *always* breaking. Unkeyed struct literals break on field addition, which is why the stdlib uses *keyed* literals and why config structs are safe to grow.
- `context.Context` is the first parameter, named `ctx`, never a struct field: storing it outlives the request and defeats cancellation (narrow exception: short-lived request structs).
- "Accept interfaces, return concrete types" is a default, not a law. Define the interface *in the consumer*, keep it tiny. Returning an interface from a constructor is the classic over-abstraction that makes the type un-extendable.
- Design so the zero value is useful. `sync.Mutex`, `bytes.Buffer`, `time.Time` all work at `var x T`; prefer that to forcing a `New`.
- Functional options vs config struct is a real fork. Options = open-ended/optional/future-proof (*libraries*); struct = simpler/greppable (*internal*). Don't cargo-cult options onto a two-field constructor.
- `%w` exposes an error as part of your API; document what callers may match: a sentinel/typed error a caller can `errors.Is`/`AsType` is a commitment ([errors-and-resilience.md](errors-and-resilience.md#wrapping-strategy)).
- Iterator-returning APIs use `iter.Seq`/`Seq2` [1.23]: name the method `All`, document single-use iterators explicitly.
- `/v2` in the module path is how Go does a major version: SemVer major ≥ 2 *must* change the import path; there is no in-place breaking release.

## Table of Contents
1. [The Go 1 compatibility discipline for your libraries](#compat-discipline)
2. [Designing for the useful zero value](#zero-value)
3. [Accept interfaces, return concrete types, and its limits](#accept-return)
4. [context.Context as the first parameter](#context-param)
5. [Error contracts: what callers may match](#error-contracts)
6. [Functional options vs config structs](#options-vs-config)
7. [Minimal exported surface](#minimal-surface)
8. [Evolving without breaking: fields, methods, Deprecated](#backward-compat)
9. [SemVer and /v2 module paths](#versioning)
10. [Iterator-returning APIs (iter.Seq)](#iterators)
11. [Generic API ergonomics & inference](#generics)
12. [Variadics and option-like signatures](#variadics)
13. [Godoc-driven design & examples as tests](#godoc)
14. [REST surface conventions](#rest-naming)
15. [Error-response design (problem+json)](#error-responses)
16. [Request validation as contract](#validation)
17. [Pagination: cursor vs offset](#pagination)
18. [Rate-limit response design](#rate-limiting)
19. [Bulk-operation API patterns](#bulk-operations)
20. [OpenAPI: spec-first vs code-first & codegen](#openapi-codegen)
21. [Version map 1.18→1.27](#versions)
22. [What models get wrong](#stale)

---

## The Go 1 compatibility discipline for your libraries {#compat-discipline}

Go's own promise ("programs written to the Go 1 spec continue to compile and run, unchanged") is the standard to hold your packages to. Two stdlib mechanics show *how* the team keeps it, and both are tools you should adopt:

- Keyed struct literals survive field additions. The Go 1 doc is explicit: adding a field to an exported struct breaks code that used an *unkeyed* literal (`pkg.T{3, "x"}`) but not a *keyed* one (`pkg.T{A: 3}`). Therefore: in your own code use keyed literals for any struct from another package, and design config structs knowing callers must key them.
- GODEBUG + the `go` line gate behavioral changes [1.21]. When the stdlib must change a runtime default, it keys the old-vs-new behavior off the `go` line in `go.mod`. You get the same lever for free, but the lesson for *your* API is: a behavior change is a breaking change even when the *signature* is identical.

```go
// WRONG — unkeyed literal of a foreign struct: breaks the moment the author adds a field.
cfg := pkg.Config{8080, "0.0.0.0", true}

// RIGHT — keyed; immune to additive growth, and self-documenting.
cfg := pkg.Config{Port: 8080, Host: "0.0.0.0", TLS: true}
```

What this buys the API designer: a struct of options grows safely *forever* as long as new fields are optional with a sensible zero value, because every well-behaved caller keys their literal. That single fact underwrites the whole "config struct" pattern below.

---

## Designing for the useful zero value {#zero-value}

The best Go APIs make `var x T` immediately usable: no constructor, no init flag, no nil-pointer trap. `sync.Mutex`, `bytes.Buffer`, `strings.Builder`, `time.Time`, and `sync.WaitGroup` all work at their zero value. This is an *ergonomic* win: it removes a `New`, removes an error return, and makes embedding trivial.

```go
// RIGHT — zero value is ready; no constructor needed.
type Counter struct {
    mu sync.Mutex      // zero-usable
    n  map[string]int  // lazily made on first write keeps the zero value valid
}

func (c *Counter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    if c.n == nil {
        c.n = make(map[string]int)
    }
    c.n[key]++
}
```

**When a constructor *is* warranted:** invariants the zero value can't express (an open DB handle, a validated address, a `>0` capacity). Then return a concrete type and document that the zero value is invalid. Don't expose a half-built struct whose validity depends on a flag the caller must remember to set.

---

## Accept interfaces, return concrete types, and its limits {#accept-return}

The proverb encodes two separate decisions. **Accept interfaces** so callers can pass any implementation and so tests can fake dependencies. **Return concrete types** so you can add methods/fields later without breaking anyone, and so callers see the real capabilities (godoc, autocompletion) instead of a lowest-common-denominator interface.

```go
// RIGHT — accept the narrowest interface you actually use; return the concrete result.
func Copy(dst io.Writer, src io.Reader) (int64, error)   // not *os.File, not *bytes.Buffer
func Open(name string) (*os.File, error)                 // concrete: callers get *all* of *os.File
```

Define the interface where it's consumed, not where it's implemented. Go interfaces are structural, so the consumer declares the one or two methods it needs and any producer satisfies it without an import. A `Store` interface with one method belongs in the package that *calls* it, not a 12-method "repository interface" shipped beside the implementation.

```go
package billing // consumer-side, minimal — the DB package never imports this.
type accountStore interface{ Account(ctx context.Context, id string) (Account, error) }
func Charge(ctx context.Context, s accountStore, id string, cents int64) error { /* ... */ }
```

The limits (where the proverb misleads):
- Don't return an interface from a constructor. `func New() Doer` locks the concrete type away; you can never add a method callers can reach, and you've forced an allocation behind an interface for no reason. Return `*Client`; let callers narrow to an interface *they* define.
- Exception: a small, stable, deliberately-polymorphic contract (`error`, `io.Reader`, `http.Handler`, `driver.Conn`) is *meant* to be returned as an interface. The test is whether the interface is the product (a plugin point) or an accident of "I might want to mock this."
- Don't accept an interface you don't call through. Taking `io.ReadWriteCloser` when you only `Read` over-constrains every caller; take `io.Reader`.

---

## context.Context as the first parameter {#context-param}

`context.Context` is **always the first parameter, named `ctx`**, on any function that does I/O, blocks, or spans an RPC. It carries cancellation, deadlines, and request-scoped values down the call tree.

```go
func (s *Service) Fetch(ctx context.Context, id string) (*Record, error)   // RIGHT
```

**Never store a `Context` in a struct.** A context models a single operation's lifetime; a struct outlives the operation. Stashing it means later calls share a stale, possibly-cancelled context (or worse, one whose deadline already fired). The stdlib `context` docs say this outright. The one tolerated exception is a short-lived *request* struct that exists only for that request, and even then, prefer threading `ctx` as a parameter.

```go
// WRONG — context captured in the struct; every method silently uses a frozen lifetime.
type Client struct{ ctx context.Context }
func (c *Client) Do() error { return call(c.ctx) }

// RIGHT — context flows per call.
type Client struct{ http *http.Client }
func (c *Client) Do(ctx context.Context) error { return call(ctx, c.http) }
```

**Design rules:** make `ctx` non-optional (no `nil`; pass `context.Background()`); never use a context value to pass *required* arguments (values are for request-scoped extras like a trace ID, behind an unexported key type); a library that needs cancellation should *take* `ctx`, not invent its own `Cancel()` method. Full cancellation/deadline mechanics: [errors-and-resilience.md](errors-and-resilience.md#timeouts).

---

## Error contracts: what callers may match {#error-contracts}

Your errors are part of your API the moment a caller branches on them. The design question is **what you let callers match, and what you promise to keep matchable.** Three contracts (Cheney's taxonomy):

| Contract | Caller matches with | You promise | Use when |
|---|---|---|---|
| **Sentinel** `var ErrX = errors.New(...)` | `errors.Is(err, pkg.ErrX)` | this value stays returned for this condition | a tiny, stable set of conditions (`io.EOF`, `sql.ErrNoRows`) |
| **Typed** `type XError struct{...}` | `errors.AsType[*pkg.XError](err)` [1.26] | the type + its exported fields stay stable | callers need structured data (which field, retry-after, code) |
| **Opaque** (return; expose a *behavior*) | `errors.AsType[interface{ Timeout() bool }](err)` | nothing about the concrete type | default at boundaries: add context without committing to a type |

```go
// Get returns the user. It returns [ErrNotFound] if no user has the given id.
func (s *Store) Get(ctx context.Context, id string) (User, error) { ... } // the doc comment IS the contract
```

**Judgment:**
- **`%w` is a commitment.** `fmt.Errorf("get %s: %w", id, sql.ErrNoRows)` promises callers `errors.Is(err, sql.ErrNoRows)` keeps working, even across a driver swap. Wrap to *expose*; use `%v` (or a domain sentinel) to *hide* internals at a boundary. Mechanics: [errors-and-resilience.md](errors-and-resilience.md#wrapping-strategy).
- **Document exactly which sentinels/types are matchable**. Anything undocumented is implementation detail callers must not depend on, leaving you free to change it.
- **Sentinels create import coupling** (callers import your package); a *behavior interface* is satisfied structurally with no import, often the more evolvable cross-package contract. Never make callers match `err.Error()` substrings.

---

## Functional options vs config structs {#options-vs-config}

Both configure a constructor; they trade simplicity against extensibility. Pick deliberately: the choice is itself an API decision because it's hard to reverse.

Functional options: open-ended, every option optional, additive forever, great for a *public library* with many knobs:

```go
type Server struct {
    addr    string
    timeout time.Duration
    logger  *slog.Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option { return func(s *Server) { s.timeout = d } }
func WithLogger(l *slog.Logger) Option   { return func(s *Server) { s.logger = l } }

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{addr: addr, timeout: 30 * time.Second, logger: slog.Default()} // defaults
    for _, opt := range opts {
        opt(s)
    }
    return s
}
// Call site reads as intent; adding WithTLS later breaks nobody.
srv := NewServer(":8080", WithTimeout(5*time.Second))
```

Config struct: simpler, greppable, zero indirection; ideal for *internal* code or when most fields are set together. Safe to grow *because callers use keyed literals* (see [compat discipline](#compat-discipline)):

```go
type Config struct {
    Addr    string
    Timeout time.Duration // zero → caller didn't set it; apply default in New
    Logger  *slog.Logger
}

func New(cfg Config) *Server {
    if cfg.Timeout == 0 {
        cfg.Timeout = 30 * time.Second
    }
    return &Server{ /* ... */ }
}
```

**Decision:** public library with many optional knobs that will grow → **options**; internal package, fields set together, you value grep-ability → **config struct**. Don't put options on a constructor with no optional params (ceremony); don't use a config struct when ordered required+optional validation calls for options. A hybrid (required positional, optional via `...Option`) is fine, but never an `Options` struct *plus* `...Option`; pick one source of truth.

---

## Minimal exported surface {#minimal-surface}

Every exported identifier is a forever-commitment. The smaller the surface, the more you can change internally without a major version. Concrete moves:

- Unexport by default; export on demand. It's trivial to export later (additive, non-breaking); un-exporting is breaking. Start lowercase.
- Put non-API helpers in `internal/`. Code under `internal/` is importable only within your module, so it's never part of your contract: use it freely for shared implementation. (Package design: [project-patterns.md](project-patterns.md#package-design).)
- Don't export a type just to return it if callers only need the interface they define, but *do* return concrete types you expect callers to use directly (see [accept/return](#accept-return)).
- Hide fields behind methods only when there's an invariant. A plain data struct with exported fields is more idiomatic than reflexive getters/setters; Go has no `Get`/`Set` convention. Add accessors when you must validate or compute.
- One obvious way in. Multiple constructors that differ subtly (`New`, `NewWithX`, `NewWithXY`) signal you want options. Collapse them.

```go
// WRONG — Java-style accessors with no invariant to protect.
type Point struct{ x, y int }
func (p Point) GetX() int { return p.x }
func (p *Point) SetX(x int) { p.x = x }

// RIGHT — exported fields; the zero value is a valid origin.
type Point struct{ X, Y int }
```

---

## Evolving without breaking: fields, methods, Deprecated {#backward-compat}

The Go 1 doc enumerates exactly what stays compatible. Apply it to your packages:

**Safe (additive):**
- Add an exported function, method, type, const, or variable.
- Add a field to an exported struct: *callers using keyed literals are unaffected* (unkeyed break; that's their bug per the doc).
- Add a method to a concrete (non-interface) type, *unless* the type is meant to be embedded, where the new method can collide with another embedded type's method (the doc flags this rare case explicitly).
- Widen what you accept (e.g., relax a validation): usually safe; tightening is not.

**Breaking (needs `/v2`):**
- Remove/rename any exported identifier; change a function signature or a field's type.
- **Add a method to an *interface* you export**: every external implementer instantly fails to satisfy it. This is why public interfaces should be *small and frozen*.
- Change documented behavior or a documented error contract.

**Deprecation (the `// Deprecated:` convention):** keep the symbol working, mark it so tooling (gopls, staticcheck `SA1019`) warns. The paragraph must start exactly with `Deprecated:`.

```go
// ParseLegacy parses the v1 wire format.
//
// Deprecated: use [Parse], which handles both formats. ParseLegacy will be
// removed in the next major version.
func ParseLegacy(b []byte) (*Msg, error) { ... }
```

**`//go:fix inline` [1.26]** lets you ship a *mechanical migration*: annotate a deprecated function whose body is a thin wrapper, and `go fix` rewrites call sites for downstream users automatically, the cleanest deprecation path when the replacement is a drop-in.

```go
//go:fix inline
func Sum(a, b int) int { return Add(a, b) } // go fix rewrites Sum(x,y) → Add(x,y)
```

---

## SemVer and /v2 module paths {#versioning}

Go modules tie SemVer to the import path. For **v0/v1**, the module path is plain (`example.com/foo`). For **major version ≥ 2**, the major number is part of the path: `example.com/foo/v2`. There is no in-place breaking release: a breaking change *is* a new import path, so v1 and v2 can coexist in one build.

```go
// go.mod for a v2 module
module example.com/foo/v2

go 1.25
```
```go
import "example.com/foo/v2" // callers opt in explicitly; v1 imports keep working untouched
```

**Rules that bite:** `v0.x` makes *no* compatibility promise (the one window to break freely); `v1` starts the Go 1-style promise. Tag releases `vMAJOR.MINOR.PATCH`. A pre-release `v2.0.0` still needs the `/v2` path. `replace`/`retract` directives live in `go.mod` for pulling bad versions. **The `go` directive is a forward-compat floor [1.21]:** `go 1.25.0` means the module *cannot* build on 1.24: set it to your true minimum, not reflexively to the latest. (Toolchain/build detail: [platform-and-build.md](platform-and-build.md).)

---

## Iterator-returning APIs (iter.Seq) {#iterators}

Since [1.23], a function/method that yields a sequence returns an `iter.Seq[V]` or `iter.Seq2[K, V]`: a push iterator consumable by `range`. This is the idiomatic shape for "give me each X" APIs, replacing ad-hoc callback or channel designs.

```go
type Seq[V any]      func(yield func(V) bool)
type Seq2[K, V any]  func(yield func(K, V) bool)
```

**Conventions from the `iter` package docs (follow them: they're how callers expect your API to read):**
- Name the all-elements method **`All`**; name an alternate order **`Backward`**, **`Preorder`**, etc.; a filtered/configured one takes args (`Scan(min, max K) iter.Seq2[K,V]`).
- **Document single-use iterators explicitly**. If the sequence can't be replayed (a network/stream source), the doc comment must say "It returns a single-use iterator." Default iterators are restartable.
- Functions that *accept or return* sequences should use the standard `iter.Seq`/`Seq2` types so they compose with `range`, `slices.Sorted`, `maps.Keys`, etc.

```go
// All returns an iterator over the set's elements in unspecified order.
func (s *Set[V]) All() iter.Seq[V] {
    return func(yield func(V) bool) {
        for v := range s.m {
            if !yield(v) { // honor early break — caller may stop mid-range
                return
            }
        }
    }
}

for v := range set.All() { use(v) }
```

**Judgment:** return a `Seq` when laziness/early-exit/large-or-infinite data matters; return a plain `[]T` when the set is small and callers want to index, re-iterate, or store it: don't make every accessor an iterator. For pull-style consumption, `iter.Pull` converts a `Seq` to a `next`/`stop` pair (caller must `defer stop()`). More: [advanced-patterns.md](advanced-patterns.md#iterators).

---

## Generic API ergonomics & inference {#generics}

Generics [1.18] earn their place when an API is genuinely type-parametric (containers, `slices`/`maps`-style helpers, a typed result wrapper). The ergonomic test is **inference**: a good generic signature lets callers omit type arguments.

```go
// RIGHT — type inferred from the argument; reads like a normal call.
func Map[T, U any](s []T, f func(T) U) []U
nums := Map(words, func(w string) int { return len(w) }) // no [string,int] needed

// Constraint via an interface in `constraints`-style form or the built-in `comparable`.
func Index[T comparable](s []T, v T) int
```

Design rules:
- Don't add a type parameter you can't infer: if callers must always write `F[SomeType](...)`, the generic is friction; consider an interface or a concrete API instead.
- Constrain to the smallest set of methods/operations the body uses; over-broad constraints (`any` when you need ordering) push failures to odd places.
- Return type parameters are inferred from arguments, not results: `func New[T any]() *Box[T]` forces `New[int]()`. Prefer taking a value (`New(0)`) or accept the explicit instantiation only when it reads clearly.
- A method cannot add its own type parameter before [1.27]: parametric behavior lives on the *type*. **[1.27 RC] adds generic methods**, which will enable type-parametric assertion/visitor methods; treat as draft until GA (~Aug 2026). [verify exact 1.27 generic-method scope at GA]
- Generics don't replace interfaces. Use an interface for *runtime* polymorphism (heterogeneous values, plugins); use generics to *avoid `any` + assertions* in homogeneous code. (Patterns: [design-patterns.md](design-patterns.md#go-specific).)

---

## Variadics and option-like signatures {#variadics}

Variadics (`args ...T`) fit "zero or more of the same thing" (`fmt.Println`, `append`, functional options). They become a smell when faking optional/heterogeneous params:

```go
func Connect(addr string, timeout ...time.Duration) // WRONG — is two timeouts an error? silently ignored?
func Connect(addr string, opts ...Option)           // RIGHT — optionality made explicit
```

**Contract gotchas:** `f(s...)` shares `s`'s backing array, so a variadic that retains or mutates `args` can surprise callers: document it. An empty call yields a `nil` slice inside; handle it. Don't append to `args` and return it as if fresh.

---

## Godoc-driven design & examples as tests {#godoc}

In Go, the doc *is* `godoc` rendered from your comments, so designing the API and documenting it are the same act. If a doc comment is hard to write, the API is probably wrong.

- **Every exported symbol gets a doc comment starting with its name** (`// Parse parses ...`). The package gets a `// Package foo ...` comment. Reference other symbols with `[Name]` for links [1.19 doc-comment links].
- **Document the contract, not the implementation:** preconditions, what's returned on each error, goroutine-safety, whether a returned slice/map is owned by the caller or must not be mutated, and which errors are matchable (see [error contracts](#error-contracts)).
- **Examples are tests.** A function `ExampleParse` in `_test.go` with an `// Output:` comment is *compiled and run* by `go test` and rendered in godoc. This keeps examples correct forever and is the best pressure-test of call-site ergonomics: if the example is awkward, redesign.

```go
func ExampleParse() {
    msg, _ := foo.Parse([]byte("hello"))
    fmt.Println(msg.Kind)
    // Output: greeting
}
```

`Example`, `ExampleT`, `ExampleT_method`, and `Example_suffix` map to specific symbols in the rendered docs. An example *without* an `// Output:` comment still compiles (catches API breakage) but isn't run. Testing detail: [testing.md](testing.md).

---

## REST surface conventions {#rest-naming}

For HTTP services the public surface is the URL/verb/payload shape: the same compatibility rules apply (additive is safe; removing a field or changing a status is breaking). Follow the [Google API Design Guide](https://cloud.google.com/apis/design): plural-noun collections (`/users`), kebab-case multi-word paths, at most one nesting level (`/users/{id}/posts`; deeper → promote to top-level with query filters), non-CRUD actions as a sub-path verb (`POST /orders/{id}/cancel`). Use real status codes (never `200` + an error body) and [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) `application/problem+json` for errors. Version only on breaking changes; signal lifecycle with `Deprecation` [RFC 9745] and `Sunset` [RFC 8594] headers. The compatibility judgment is identical to libraries: **adding a field/endpoint is safe, removing/retyping needs a new `/v2`**, and the service analogue of "don't add a method to a published interface" is "don't change a documented response shape." Handler/pagination/validation/codegen mechanics: [http-and-apis.md](http-and-apis.md).

---

## Error-response design (problem+json) {#error-responses}

Your error *body* is API surface: clients branch on it, so it carries the same compatibility weight as a success shape. Use **[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) `application/problem+json`** as the envelope and a **stable, machine-readable `code`** as the field clients actually switch on. The HTTP status is the coarse class; `code` is the contract.

```go
// RIGHT — problem+json: status is the class, `code` is the stable branch key.
type Problem struct {
    Type     string `json:"type"`              // URI identifying the problem class (or "about:blank")
    Title    string `json:"title"`             // short, human, stable per type
    Status   int    `json:"status"`            // mirrors the HTTP status
    Detail   string `json:"detail,omitempty"`  // this occurrence; safe to vary
    Instance string `json:"instance,omitempty"`// URI/ID for this occurrence (e.g. trace ID)
    Code     string `json:"code"`              // YOUR stable enum: "user_not_found" — never renumber
}
```

**Judgment:**
- **`code` is a frozen enum, like a sentinel error.** Clients write `switch p.Code`; renaming `user_not_found` is a breaking change. The localizable `title`/`detail` are free to change; the `code` is not.
- **Never leak internals.** No stack traces, SQL, driver text, or wrapped `err.Error()` in `detail`; that leaks schema and aids attackers. Map internal errors to a code at the boundary and `slog` the real error *once* server-side with the `instance`/trace ID (see [errors-and-resilience.md](errors-and-resilience.md#wrapping-strategy)). The internal sentinel/typed error ([error contracts](#error-contracts)) is what you switch on to *choose* the code; it never reaches the wire verbatim.
- **One envelope for the whole service.** Don't return bare strings on some routes and problem+json on others; a client should parse failures one way.

Set `Content-Type: application/problem+json`. Status-code selection mechanics (422 vs 400, 409, 413): [http-and-apis.md](http-and-apis.md#validation).

---

## Request validation as contract {#validation}

Validation is part of the published contract: **what you reject, and the shape of the rejection, are promises**. Validate **at the boundary** (right after decode, before the service call) and return **actionable per-field errors** so a client can fix the request without guessing.

```go
// RIGHT — per-field, machine-readable; one code per failure mode.
type FieldError struct {
    Field   string `json:"field"`   // "email", "items[2].qty" — JSON path the client sent
    Code    string `json:"code"`    // "required", "too_long" — stable enum, not prose
    Message string `json:"message"` // human hint; may change freely
}
// Embed []FieldError in the problem+json body ([#error-responses]) under "errors".
```

**Judgment:**
- **Return all field errors, not first-fail**. `errors.Join` [1.20] collects them so the client fixes the form in one round trip.
- **`field` mirrors the client's payload path** (the JSON pointer they sent), not your Go struct field name. That's what lets a UI attach the error to the right input.
- **Loosening validation is safe; tightening is breaking.** Adding a new required field or a stricter rule rejects previously-valid requests; treat it like a signature change ([backward-compat](#backward-compat)).
- Keep **cross-field and business rules in code** (a `Validate()` method); push only mechanical per-field constraints to tags. For `go-playground/validator` tag mechanics and the 400-vs-422 split, see [http-and-apis.md](http-and-apis.md#validation).

---

## Pagination: cursor vs offset {#pagination}

Pick the pagination model deliberately: it's hard to change once clients depend on it. The fork is **cursor (opaque token)** vs **offset/limit**.

| | Cursor (opaque token) | Offset / limit |
|---|---|---|
| **Use when** | large/changing datasets, infinite scroll, public APIs | small/stable data, jump-to-page UIs, admin tools |
| **Correctness under writes** | stable: no skipped/duplicated rows as data shifts | drifts: inserts/deletes shift the window |
| **Cost at depth** | constant (seek `WHERE id > ?`) | grows: `OFFSET n` scans+discards n rows |
| **Can jump to page N** | no | yes |

```go
// RIGHT — opaque cursor: base64 of the sort key(s); clients MUST treat it as a blob.
type Page[T any] struct {
    Items      []T    `json:"items"`
    NextCursor string `json:"next_cursor,omitempty"` // empty = last page
}
// Decode → seek; never expose raw offsets/IDs inside the token.
```

Judgment:
- Order by a stable, unique key (e.g. `(created_at, id)`); a non-unique sort column makes cursors skip or repeat rows at boundaries.
- The cursor is opaque: encode the keyset and *only* document "pass `next_cursor` back." That lets you change the pagination internals later without breaking clients (offsets-in-URLs become permanent contract).
- Enforce a server-side page-size cap. Treat `limit` as a request, clamp to a max (e.g. ≤100), apply a default when absent: never let a client ask for everything. SQL/handler wiring: [http-and-apis.md](http-and-apis.md).

---

## Rate-limit response design {#rate-limiting}

This is about the *protocol you expose* when throttling, not the limiter algorithm. On a throttle, return **`429 Too Many Requests`** and tell the client when to come back; on the path to the limit, advertise the quota so well-behaved clients self-pace.

```go
func writeRateLimited(w http.ResponseWriter, retryAfter time.Duration) {
    w.Header().Set("Retry-After", strconv.Itoa(int(retryAfter.Seconds()))) // RFC 9110 — seconds or HTTP-date
    // Draft RateLimit fields (see note): advertise remaining quota + the policy.
    w.Header().Set("RateLimit", `limit=100, remaining=0, reset=30`)
    w.Header().Set("RateLimit-Policy", `100;w=60`) // 100 requests per 60s window
    writeProblem(w, http.StatusTooManyRequests, "rate_limited")
}
```

**Judgment:**
- **`Retry-After` is the one you must send on 429**. It's standardized (RFC 9110) and clients/SDKs honor it for backoff.
- **`RateLimit` / `RateLimit-Policy` are an IETF *draft*, not an RFC** (`draft-ietf-httpapi-ratelimit-headers`, rev 10, currently expired/not-yet-approved as of 2026-06) `[verify]`: field syntax may still change. Send them as a courtesy so clients can self-throttle, but treat `Retry-After` + the 429 status as the load-bearing contract. (Older deployments used `X-RateLimit-*`; the unprefixed draft names are the current direction.)
- **Scope the policy per key/quota** (per API key, user, or tenant, not raw IP for authed APIs) and document the unit, window, and what counts. The limiter *algorithm* (token bucket via `golang.org/x/time/rate`, distributed counters) lives in [errors-and-resilience.md](errors-and-resilience.md#retry) / [http-and-apis.md](http-and-apis.md); this section is only the response shape.

---

## Bulk-operation API patterns {#bulk-operations}

A bulk endpoint (`POST /things:batchCreate`) trades round-trips for a harder contract: **one HTTP request, many independent outcomes**. The defining decision is **partial success**: report per-item status instead of failing the whole batch on one bad row.

```go
// RIGHT — per-item result; HTTP 200 even when some items failed.
type BulkResult[T any] struct {
    Results []ItemResult[T] `json:"results"` // same order/length as the request
}
type ItemResult[T any] struct {
    Index  int      `json:"index"`            // position in the submitted batch
    Status int      `json:"status"`           // per-item: 201 created, 409 conflict, 422 invalid
    Item   *T       `json:"item,omitempty"`   // present on success
    Error  *Problem `json:"error,omitempty"`  // problem+json per failed item ([#error-responses])
}
```

**Judgment:**
- **Partial success is the default**. A single invalid item shouldn't 4xx the whole call (return 200/207 with per-item status). Choose all-or-nothing *only* when the batch is a true atomic transaction, and document which it is.
- **Idempotency keys make bulk retries safe.** Accept a client-supplied `Idempotency-Key` (header, or per item) and dedupe, so a retried batch after a network blip doesn't double-create. Persist the key→result mapping.
- **Cap request size**. Both item count and total bytes (`http.MaxBytesReader`, see [http-and-apis.md](http-and-apis.md#server-hardening)). Unbounded bulk is a memory/DoS vector; reject oversized batches with 413 and a documented max.

---

## OpenAPI: spec-first vs code-first & codegen {#openapi-codegen}

The real decision is **direction**, and you must pick one as the single source of truth:

- Spec-first: the OpenAPI doc is authoritative; you *generate* Go server interfaces/types from it. Best when the contract is negotiated across teams/clients or you publish SDKs. Tool: **`oapi-codegen`**: current module path **`github.com/oapi-codegen/oapi-codegen/v2`** (verified on pkg.go.dev; the older `deepmap/oapi-codegen` path is its predecessor); emits `net/http`/chi/echo server stubs plus typed models.
- Code-first: Go handlers are authoritative; you *generate* the spec from annotations (`swaggo/swag`) or hand-maintain it. Simpler for a single team but the spec can silently drift.

```go
// Spec-first: pin the generator via the go.mod `tool` directive [1.24], not a tools.go shim.
//go:generate go tool oapi-codegen -config cfg.yaml openapi.yaml
// Implement the generated ServerInterface; the compiler now enforces the contract.
```

Judgment:
- Either direction is fine; drift is the failure. Whichever you pick, **enforce sync in CI**: regenerate and `git diff --exit-code` (spec-first), or lint code against the spec / run contract tests (code-first). A spec that doesn't match the running server is worse than no spec.
- Generate types, own the logic. Let codegen produce request/response structs and the routing interface; keep validation and business rules in your code (see [#validation]).
- Pin the generator version in `go.mod` (`go tool`, [1.24]) so every dev and CI run emits identical code. ConnectRPC/gRPC users get the `.proto` as the contract instead: different toolchain, same "spec is the source of truth" discipline. Codegen mechanics and the `swaggo` vs `oapi-codegen` split: [http-and-apis.md](http-and-apis.md#api-versioning).

---

## Version map 1.18→1.27 {#versions}

| Ver | API-design-relevant |
|---|---|
| **1.18** | Generics (type params, `any`, `comparable`): type-parametric APIs, inference |
| **1.19** | Doc-comment links (`[Name]`), lists, headings: godoc-driven design |
| **1.20** | `errors.Join`, multi-`%w`: multi-error contracts |
| **1.21** | `log/slog`; **GODEBUG + `go`-line compat machinery**; `go` directive is a strict floor; `min`/`max`/`clear` builtins |
| **1.22** | `range`-over-int; `net/http.ServeMux` method+wildcard patterns (`GET /users/{id}`) |
| **1.23** | **`iter.Seq`/`Seq2`**, range-over-func; `iter.Pull`; `maps`/`slices` iterator helpers |
| **1.24** | Generic type aliases; `os.Root`; tool dependencies in `go.mod` (`go tool`) |
| **1.25** | `sync.WaitGroup.Go`; `testing/synctest` GA |
| **1.26** | **`errors.AsType[E]`**; `fmt.Errorf("x")` alloc-parity with `errors.New`; **`go fix` modernizers + `//go:fix inline`** API-migration directives; `new(expr)` enhanced builtin; `reflect.Type.Fields/Methods` return iterators; `slog.NewMultiHandler`; `NotifyContext` cancels with a cause |
| **1.27 (RC)** | **Generic methods** (enables type-parametric methods); self-referential generic constraints; `asynctimerchan`/`gotypesalias` GODEBUGs removed. Draft until GA (~Aug 2026). [verify encoding/json/v2 stabilization status, not listed in the 1.26 release notes] |

---

## What models get wrong {#stale}

1. Putting `context.Context` in a struct field instead of passing it first: defeats cancellation, freezes a lifetime.
2. Returning an **interface** from a constructor (`func New() Doer`): you can never add a reachable method; return the concrete type.
3. Shipping a 12-method "repository interface" beside the implementation instead of small interfaces *in the consumer*.
4. Adding a method to a **published interface** and assuming it's additive: it breaks every external implementer.
5. Forgetting a breaking change requires a **`/v2` module path**; trying to ship a breaking release at the same path.
6. Cargo-culting functional options onto a no-optional constructor, and conversely, a config struct where ordered optional validation calls for options.
7. Needing a constructor for a type whose **zero value** could have been made useful (`var x T`).
8. Over-constraining a generic (`io.ReadWriteCloser` when you only `Read`; `any` when you need ordering) or a type parameter that **can't be inferred**.
9. Variadic-as-fake-optional (`timeout ...time.Duration`) instead of options/config.
10. Wrapping `%w` reflexively (leaks internals into your error contract) or masking an error callers needed, and not documenting which errors are matchable; branching on `err.Error()` substrings.
11. Naming a sequence accessor anything but `All`/`Backward`/… or not documenting a **single-use iterator** [1.23].
12. Unkeyed struct literals for foreign types: break on additive field growth; use keyed literals.
13. Reflexive Java-style getters/setters with no invariant; missing or implementation-focused doc comments; skipping **examples as tests**.
14. `// DEPRECATED`/`// deprecated` instead of the exact `// Deprecated:` paragraph form tooling recognizes.

---

## See Also {#see-also}
- [http-and-apis.md](http-and-apis.md): HTTP handlers, pagination, RFC 9457, rate limiting, OpenAPI codegen, validation mechanics
- [errors-and-resilience.md](errors-and-resilience.md): sentinel/typed/opaque errors, `%w` contracts, `errors.AsType`
- [style-synthesis.md](style-synthesis.md#interfaces): naming, small consumer-defined interfaces, error style
- [project-patterns.md](project-patterns.md#package-design): package cohesion, `internal/`, layout
- [design-patterns.md](design-patterns.md#go-specific): functional options, generics vs interfaces
- [advanced-patterns.md](advanced-patterns.md#iterators): iterator composition, `iter.Pull`

## Sources {#sources}
- go.dev/doc/go1compat (keyed literals, added methods/fields, struct caveats); go.dev/blog/compat + go.dev/doc/godebug (GODEBUG + `go`-line compat machinery [1.21])
- pkg.go.dev/iter (`Seq`/`Seq2`, `All`/`Backward` naming, single-use iterators, `Pull`); pkg.go.dev/context (no context in structs); pkg.go.dev/errors (`AsType` [1.26])
- go.dev/doc/go1.26 (`errors.AsType`, `fmt.Errorf` alloc-parity, `go fix` modernizers + `//go:fix inline`, `new(expr)`, reflect iterators); go.dev/doc/go1.27 (generic methods, self-referential constraints, RC)
- go.dev/ref/mod (`/v2` module paths, SemVer, `go` directive floor); go.dev/doc/comment (doc-comment syntax, `[Name]` links); go.dev/blog/examples (examples as tests)
- go.dev/wiki/CodeReviewComments (accept interfaces/return concrete, doc comments); cloud.google.com/apis/design; RFC 9457/9745/8594
