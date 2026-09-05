# Go Style & Idiom Synthesis

Idiomatic Go is no longer a timeless checklist: since 1.22 it is **version-sensitive**, and "idiomatic" now means *current stdlib surface + toolchain-assisted modernization* (`gofmt` → `go vet` → `go fix` modernizers → `golangci-lint`). Mechanical style is enforced by tools; spend reasoning only on the judgment calls (when to wrap, interface-or-concrete, whether an interface should exist, named returns).

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Style sources fetched 2026-06-26. Version tags `[1.N]` mark the release a claim applies to. Synthesized from multi-source research + primary docs.

## TL;DR: the modern deltas (read first)

- Source precedence: `gofmt` (mechanical law) > spec / release notes (version truth) > `pkg.go.dev` (current APIs) > **Google Style Guide** (most actively maintained; prefer on conflict) > Effective Go / Code Review Comments (philosophy, *dated* on APIs) > Uber (operational heuristics).
- The Google guide is three tiers (verified at source): **Style Guide** (normative **+ canonical**, enduring rules) > **Style Decisions** (normative, *not* canonical, changes with language features) > **Best Practices** (neither, patterns, not law).
- Code Review Comments is frozen/legacy ("a supplement to Effective Go… not a comprehensive style guide"); `staticcheck` + `go vet` + the Google guide are its living equivalents.
- The #1 source of stale model output is pre-1.22 idiom: `interface{}` not `any`, loop-var copies (`x := x`), hand-rolled `Contains`/`min`/`max`, `sort.Slice` over `slices.Sort`, `for i:=0;i<n;i++`, `tools.go`, third-party loggers over `slog`, capitalized error strings. `go fix` [1.26] auto-rewrites most via the **modernize** analyzers.
- Tooling consolidated: `golint` is archived (→ `revive` + `staticcheck`); `golangci-lint v2` split formatters from linters and changed the schema; `gofumpt` is the de-facto stricter formatter (policy choice, not baseline).

## Table of Contents
1. [Naming](#naming)
2. [Error Style](#error-style)
3. [Declarations & zero values](#declarations)
4. [Interfaces & receivers](#interfaces)
5. [Function Design](#function-design)
6. [Imports and Packages](#imports-packages)
7. [Doc comments](#doc-comments)
8. [Formatting & tooling](#formatting)
9. [Version-driven idiom shifts](#idiom-shifts)
10. [Where the guides disagree](#disagreements)
11. [Linter / tooling status](#tooling-status)
12. [Version map 1.18→1.27](#versions)
13. [What models get wrong](#stale)
14. [Agent addendum](#agent-addendum)

---

## Naming {#naming}

MixedCaps / mixedCaps **always**, never `snake_case`, `SCREAMING_SNAKE_CASE`, or `kMaxBuffer` C-style. Underscore characters survive only in test names (`TestFoo_InvalidInput`, `Benchmark…`) and some generated/cgo identifiers; *filenames are not identifiers* and may use them.

| Rule | Detail an expert might still miss |
|---|---|
| **Initialisms keep one case throughout** | `URL`/`url` never `Url`; `ID`/`id` never `Id`; `ServeHTTP` not `ServeHttp`. Adjacent initialisms are each internally consistent but needn't match: `XMLAPI`, `xmlHTTPRequest`. `ID` follows this **whenever it means identifier**. Generated (protobuf) code is exempt. |
| **Name length ∝ scope** | `i`, `r`, `w` in tiny scopes; descriptive in large ones (long names in short scopes are also a smell). |
| **Name by role, not type** | `users` not `userSlice`; `count` not `numUsers`. Constants too: `MaxRetries`, not `Twelve`. |
| **No `Get` prefix on getters** | field `owner` → `Owner()` / `SetOwner()`. Exception: domain genuinely uses GET (HTTP). Use `Fetch`/`Compute` to *signal cost* for expensive/remote reads. |
| **Avoid stutter** | `widget.New()` not `widget.NewWidget()`; `yamlconfig.Parse` not `yamlconfig.ParseYAMLConfig`: the package name is already context. |
| **Receivers: 1-2 chars, consistent across all methods** | never `this`/`self`/`me`; omit the name entirely if unused. |
| **Single-method interface → `-er`** | `Reader`, `Writer`, `Stringer`. |

```go
// RIGHT
func (c *Client) ID() string  { return c.id }
func ServeHTTP(w http.ResponseWriter, r *http.Request) {}
userID, rawURL := getID(), parseURL()

// WRONG
func (self *Client) GetId() string { return self.id }  // self; Get; Id
func ServeHttp(...)                                     // Http
userId, rawUrl := getId(), parseUrl()
```

**Package names:** short, lowercase, singular, no underscore characters. **Ban `util`/`common`/`helpers`/`misc`/`base`/`model`/`types`**: vague names attract unrelated code; name by what the package *provides* (`auth`, `httputil`). `vendor`/`testdata`/`internal` are reserved; `internal/` privacy is compiler-enforced. Note: Google **retired** its old advice to use ultra-short proto names (`pb`/`xpb`): new code prefers descriptive names.

---

## Error Style {#error-style}

For error *patterns* (wrapping mechanics, hierarchies, retry, `errors.AsType`), see [errors-and-resilience.md](errors-and-resilience.md). This section is style only.

```go
// RIGHT — lowercase, no trailing punctuation, names the operation + key
return fmt.Errorf("reading config %s: %w", name, err)

// WRONG
return fmt.Errorf("Failed to read config: %v", err) // capitalized; "failed to"; severs chain
return errors.New("Config error.")                  // capitalized; trailing period
```

| Rule | Source consensus |
|---|---|
| Error strings **lowercase, no trailing punctuation** | Unanimous; `staticcheck ST1005` enforces. (Exception: leading proper noun/acronym/exported name.) |
| Prefix with origin | `"image: unknown format"` (`E`, `C`) |
| Exported funcs return the **`error` interface**, never a concrete `*MyError` | typed-nil-in-interface trap: a non-nil interface wrapping a nil pointer is `!= nil` |
| Don't discard with `_` unless documented why safe | `G`, `C`; `errcheck` flags it |
| Handle each error **once**: don't log *and* return | `G`, `U` |
| Avoid the `"failed to"` prefix | stacks badly across wraps → `"failed to: failed to: …"` (`U`) |
| Libraries never panic for ordinary failures; return errors. `MustXyz` only at package init / tests | All |

`%w` vs `%v` is a genuine guide split (see [#disagreements](#disagreements)): Google treats **`%v` as the default** and `%w` as a *deliberate* API commitment (the wrapped error becomes surface callers may `Is`/`As`); Uber leans `%w`. Both agree: don't double-wrap context already in the inner error, and translate at system boundaries so you don't leak dependency types.

Indent the error flow (the #1 Code Review Comments item): keep the happy path at base indentation.

```go
// RIGHT
if err != nil {
    return fmt.Errorf("load config: %w", err)
}
proceed() // happy path un-nested

// WRONG — normal code buried in else
if err != nil { return err } else { proceed() }
```

In-band errors: return `(value, bool)` or `(value, error)`, never magic sentinels like `""`/`-1`.

---

## Declarations & zero values {#declarations}

```go
i := 42              // non-zero scalar → :=
var coords Point     // zero value → var
var buf bytes.Buffer // zero value is usable — no init needed
var t []string       // nil slice (NOT []string{})
p := &T{Name: "bar"} // pointer → &T{}, never new(T)
```

| Topic | Rule |
|---|---|
| **Zero value is usable** | `bytes.Buffer`, `sync.Mutex`, `sync.WaitGroup`, `time.Time`, `atomic.Int64`, a nil `[]T`/`map` for reads: all work at zero value. Design your own types so the zero value is meaningful; it removes constructors. |
| **Nil vs empty slice** | prefer `var t []string`; check `len(s) == 0`, **never `s == nil`**. Use `[]T{}` only when the wire format must encode `[]` not `null` (JSON). |
| **Copy slices/maps at boundaries** | returning or storing a caller's slice/map exposes mutable internal state (`U`). Clone on the way in/out when ownership matters. |
| **Struct literals: always field names** | `T{Name: "x", Port: 8080}`. Positional `T{"x", 8080}` breaks silently on field reorder/insert; `go vet`'s `composites` flags it for imported structs. |
| **Zero-value struct** | `var s T` over `s := T{}` (Uber strict, Google flexible; **recommend `var`**). |
| **Maps** | `make(map[K]V, hint)` for programmatic build; literal for fixed data. Must init before write (nil map panics on write, reads fine). |
| **Enums** | start at `iota + 1` unless zero is a meaningful default: distinguishes "unset" from the first real value. Add a `_ = x[0]` stringer guard or generate. |
| **Struct tags on every marshaled field** | `json:"name"`: prevents case-mismatch bugs and silent breakage on field rename. |

---

## Interfaces & receivers {#interfaces}

**Accept interfaces, return concrete types**, and define the interface on the **consumer** side, not the implementor's. This is the single most-misunderstood rule; models overproduce implementor-side "interfaces for mocking," which Google explicitly warns against.

```go
// RIGHT — producer returns concrete; consumer declares the minimal interface it needs
package store
func NewStore(db *sql.DB) *Store { return &Store{db: db} } // concrete

package handler
type ItemReader interface { // narrow, consumer-owned
    Read(ctx context.Context, id string) (*Item, error)
}

// WRONG — implementor exports a broad interface and narrows its own return
func NewStore(db *sql.DB) StoreAPI { return &store{db: db} }
```

| Rule | Source |
|---|---|
| Keep interfaces small (1-2 methods); compose by embedding | `E`, `G` |
| Don't define an interface before a consumer needs it | `G` |
| Don't wrap generated RPC/gRPC interfaces just to mock | `G` (Best Practices) |
| Never use a pointer to an interface | `U`, `E` |
| Compile-time conformance check **when it's part of the contract** | `var _ http.Handler = (*Handler)(nil)` (`U`) |
| Don't embed types in *public* structs | leaks `Lock`/`Unlock` etc. into your API; `embeddedstructfieldcheck` (`forbid-mutex`) flags it (`U`, `G`) |

**Receiver type**: the synthesized decision:

| Pointer receiver | Value receiver |
|---|---|
| Mutates the receiver | Small, plainly-immutable types (`time.Time`) |
| Type contains a `sync.Mutex` / uncopyable field | Map, func, channel types (already reference-like) |
| Large struct (avoid copy) | Slice headers you don't reslice |
| **When in doubt → pointer** | Built-in-backed types |

**All methods on a type use the same receiver kind**: mixing breaks interface satisfaction subtly. Pointer-receiver methods aren't in the method set of a *non-addressable* value (e.g. a map element `m[k].Mutate()` won't compile). Never copy a `sync.Mutex` by value: a `func (c Cache) Put()` on a mutex-bearing struct copies the lock and silently fails to synchronize.

---

## Function Design {#function-design}

- `context.Context` is always the first parameter, named `ctx`. Never store it in a struct (`containedctx`/`fatcontext` linters) or pass it inside an options struct. A function taking `ctx` should usually return `error`.
- Named returns: use when 2+ returns share a type (documents which is which in godoc) or for `defer`-based mutation of the return. Avoid **naked** returns in non-trivial bodies: they hurt readability and cause bugs. `nonamedreturns`/`nakedret` enforce.
- Ordering: exported symbols first, then constructor (`New…`), then methods grouped by receiver, unexported helpers last (`U`).

Options struct vs functional options (guide split, see [#disagreements](#disagreements)):

```go
// Options struct — preferred for ≤5 stable fields, config-file-driven, or perf-critical
type Options struct{ Timeout time.Duration; MaxRetry int }
func New(addr string, opts Options) *Client { /* ... */ }

// Functional options — preferred for public, extensible APIs with ≥3 optional args
type Option func(*Server)
func WithTimeout(d time.Duration) Option { return func(s *Server){ s.timeout = d } }
func NewServer(addr string, opts ...Option) *Server {
    s := &Server{addr: addr, timeout: 30 * time.Second} // defaults baked in
    for _, o := range opts { o(s) }
    return s
}
```

go-mastery recommends: options struct for ≤5 stable fields; functional options when the set grows or for a public extensible API (gRPC/oauth2 style). Functional options cost ~3ns/call and ~2× the code and don't inline through interfaces: use a config struct in tight constructor loops. **Never mix both styles** on one constructor.

---

## Imports and Packages {#imports-packages}

```go
import (
    "context"                        // 1. stdlib
    "fmt"

    "github.com/lib/pq"              // 2. third-party

    "myproject/internal/auth"        // 3. project-local
    _ "myproject/driver/pgx"         // blank/side-effect: only in main or tests
)
```

| Rule | Source |
|---|---|
| Rename imports only for **collisions**, not convenience | `G`, `C` |
| `import .` (dot import): never, outside test-internal cases | `G` |
| Rename generated proto packages to `…pb` | `G` |
| Avoid mutable package-level globals; inject dependencies | `U`, `G` |
| Use `internal/` for non-public packages (compiler-enforced) | `E` |

**Group-count conflict:** Uber uses 2 groups, Google up to 4. **go-mastery recommends 3** (stdlib / third-party / project-local). Don't hand-maintain this: `goimports` or `gci` does it mechanically; in golangci-lint v2 these run as **formatters** (`golangci-lint fmt`), not linters.

---

## Doc comments {#doc-comments}

Doc comments are **full sentences that begin with the name of the symbol**: this is load-bearing because `go doc`/`pkg.go.dev` render them and tooling checks the first word.

```go
// Store persists items keyed by ID. The zero value is not usable; call NewStore.
type Store struct { /* ... */ }

// Fetch returns the item for id, or [ErrNotFound] if absent.
// It is safe for concurrent use.
func (s *Store) Fetch(ctx context.Context, id string) (*Item, error)

// Deprecated: use [Store.Fetch] instead. Get will be removed in v2.
func (s *Store) Get(id string) *Item
```

- Start with the exact symbol name (`// Fetch returns…`, not `// This method returns…`). `revive`'s `exported` rule and `staticcheck ST1020-22` check this.
- **Deprecation is a machine-readable convention:** a paragraph beginning `Deprecated:`; gopls strikes through the symbol and `staticcheck SA1019` flags callers. Nothing else triggers it.
- Link symbols with `[Name]` / `[pkg.Name]` doc-link syntax [1.19] instead of bare text.
- Package doc: one comment on the `package` clause (or a dedicated `doc.go`); start `// Package foo …`.
- Comment **why**, not **what**. Over-commenting obvious code is noise that drifts from the implementation.

---

## Formatting & tooling {#formatting}

`gofmt` is **non-negotiable law**: Effective Go's rule is "rearrange your code to agree with `gofmt`, not the reverse." It owns indentation, alignment, and spacing; never fight it.

- **`gofumpt`** (mvdan.cc/gofumpt) is a strict *superset* of `gofmt` (no blank lines at block start/end, grouped `var`/`const` simplification, single-line short composite literals). "`gofmt` after `gofumpt` produces no changes." It's a **policy choice**, not baseline idiom: adopt it repo-wide or not at all.
- **No hard line-length limit** in any canonical source: break on *semantic* groupings, never split an `if` condition or a URL. Extract complex booleans into named vars instead. `golines`/`lll` (commonly 120) are opt-in.
- Early returns over deep nesting; don't shadow built-ins (`len`, `cap`, `new`, `error`, `min`, `max`).
- `strconv` over `fmt` for scalar↔string conversions (faster, fewer allocs).

---

## Version-driven idiom shifts {#idiom-shifts}

The highest-value staleness deltas. Each applies only when `go.mod` declares the listed version or later.

`any` over `interface{}` [1.18]: predeclared alias; always prefer. `modernize/any` rewrites.

Loop-var per-iteration scoping [1.22]: the `x := x` copy and "capture the loop var" advice are **obsolete** for `go 1.22+` modules; both `range` and 3-clause loop vars are now per-iteration.

```go
// WRONG (stale, redundant in 1.22+)          // RIGHT (1.22+)
for _, v := range items {                       for _, v := range items {
    v := v                                          go func() { process(v) }()
    go func() { process(v) }()                  }
}
```
`copyloopvar` + `modernize/forvar` flag the dead copy. Caveat: only safe to remove when the module is `go 1.22+`.

Range-over-int [1.22] + iterators [1.23]:

```go
for i := range n { ... }                              // [1.22] replaces for i:=0;i<n;i++
keys := slices.Sorted(maps.Keys(m))                   // [1.23] replaces make+loop+sort.Strings
for k, v := range myColl.All() { ... }                // [1.23] iter.Seq2 method
```
`iter.Seq[V]`/`iter.Seq2[K,V]` are `func(yield func(...) bool)`; name iterator methods `All`/`Values`/`Keys`/`Backward`; use `iter.Pull` + `defer stop()` for pull-style. `maps.Keys`/`Values`/`All` return *iterators*, collected via `slices.Collect`/`slices.Sorted`.

`min`/`max`/`clear` builtins [1.21] replace hand-rolled helpers and `math.Min/Max` (which force `float64`) for ordered types:

```go
x := max(a, b)   // not: if a > b { x = a } else { x = b }
clear(m)         // not: for k := range m { delete(m, k) }
```

`slices`/`maps`/`cmp` [1.21] replace "lodash" utilities and `sort.Slice`:

```go
slices.Sort(s)              // not sort.Slice(s, func(i,j int) bool {...})
slices.Contains(s, x)       // not a manual loop
slices.Index/Equal/Clone/Concat/Delete; maps.Clone/Copy/Keys; cmp.Compare/cmp.Or
```

Typed atomics [1.19] over primitive funcs: `var n atomic.Int64; n.Add(1)` over `atomic.AddInt64(&n, 1)`; `modernize/atomictypes` nudges toward wrappers. **This supersedes Uber's old `go.uber.org/atomic` recommendation** for new code (the stdlib gained the wrappers it was created for).

`net.JoinHostPort` over `fmt.Sprintf("%s:%d", ...)` [1.25]: the `Sprintf` form breaks for IPv6 (`::1`); `go vet`'s `hostport` analyzer [1.25] exists specifically to catch it.

`tool` directive [1.24] replaces the `tools.go` blank-import hack:

```bash
go get -tool golang.org/x/tools/cmd/goimports   # [1.24] adds a tool directive to go.mod
go tool goimports ./...
```
Emitting a `//go:build tools` file in a 1.24+ module is a clean staleness signal. Caveat: tool deps land in the main `go.mod` (version-conflict risk; some teams use a separate tools module).

Testing [1.24/1.25]: `t.Context()`/`b.Context()` over `context.Background()` in tests [1.24] (Google explicitly prefers it); `testing.B.Loop()` over `for i:=0;i<b.N;i++` [1.24] (setup once, excluded from timing, defeats dead-code elimination); `testing/synctest` (`synctest.Test(t, fn)` + `synctest.Wait()`) [1.25 GA] over `time.Sleep`-and-poll for concurrency tests (virtual clock, durable-block detection). `t.Chdir` [1.24] is per-test cwd (incompatible with `t.Parallel`).

`sync.WaitGroup.Go(f)` [1.25]: the `sync` docs now present it as the typical pattern over manual `Add`/`Done`; **but `f` must not panic** (no recovery). Use `errgroup.Group` when you need error propagation, cancellation, or bounded concurrency. Do **not** downgrade error-returning goroutines to `WaitGroup.Go`. `go vet`'s `waitgroup` analyzer [1.25] catches the race-prone `wg.Add(1)` *inside* the spawned goroutine.

Generics maturity [1.18+]: idiomatic for *type parametricity* (containers/algorithms over `comparable`/`cmp.Ordered`, type-safe helpers, avoiding `interface{}`+reflection); **over-engineering** for generic "service"/"repository" abstractions where a plain interface or concrete type works (Google: "be wary of premature use"). "Accept interfaces" still wins for *behavioral* polymorphism; reach for generics when the same logic spans many types.

---

## Where the guides disagree {#disagreements}

The high-value section: these are judgment calls tools can't settle.

| Topic | Google | Uber | go-mastery stance |
|---|---|---|---|
| **Named returns** | permitted when they aid godoc/disambiguate | discourages; "naked returns lead to bugs" | names for documentation/`defer`-mutation; **never naked** in non-trivial bodies |
| **Error wrap verb** | **`%v` default**, `%w` deliberately (it's API surface) | leans `%w` | library authors → `%v` default; app authors → `%w`; both: don't double-wrap |
| **Assertion libraries** | avoid in tests (Code Review Comments) | endorses `testify` (`assert`/`require`) | small projects → stdlib + tiny generic helpers; large teams on testify → keep it but run `testifylint` |
| **Struct field alignment** | not mandated | not mandated | order for **readability, not bytes**; `fieldalignment` is opt-in micro-opt, false-positives on embedded structs |
| **Functional options vs config struct** | both fine | options for ≥3 optional args | options for public/extensible; struct for perf-critical/config-driven |
| **Mutex: embed vs field** | No guidance | embed only in *unexported* structs | named `mu` field, never embed in public structs |
| **Unexported globals** | no prefix | `_`-prefix (`_defaultPort`) | `_`-prefix: visually separates package state from locals |
| **Import groups** | up to 4 | 2 | 3 (stdlib / third-party / local) |
| **Pre-allocation** | No guidance | "prefer specifying capacity" | pre-allocate when length is known/bounded; else nil slice + append; `prealloc` is noisy/advisory |

**Critical correctness footgun in the testify split:** `require.*` must only be called from the **main test goroutine**: calling it from a spawned goroutine panics (it calls `runtime.Goexit` via `FailNow`, which doesn't unwind other goroutines). Use `assert.*` inside goroutines.

---

## Linter / tooling status {#tooling-status}

| Tool | State [2026] | Use for | Notes |
|---|---|---|---|
| `gofmt` | bundled, **law** | canonical formatting | never overridden |
| `gofumpt` | active, v0.8.x | stricter format | superset of `gofmt`; policy choice |
| `goimports` / `gci` | active | import grouping + add/remove | run as *formatters* in golangci-lint v2 |
| `go vet` | bundled | suspicious constructs | bundles `printf`, `nilness`, `loopclosure`, `composites`, `shadow` (opt-in), `fieldalignment` (opt-in), `stdversion` [1.23], `waitgroup`+`hostport` [1.25] |
| `go fix` | **rewritten [1.26]** | safe modernization | hosts the `modernize` analyzers; review the diff (comments/perf can shift) |
| `gopls` | active, v0.22.x | LSP, modernize hints, vuln prompts | same modernize suite as code actions |
| `staticcheck` | active (2026.x / v0.8.x) | ~150 SA bug + ST style checks | absorbed `gosimple`+`stylecheck` in golangci-lint v2 |
| `golangci-lint` | active, **v2.x** | CI lint orchestration | v2 (2025-03-23) split formatters from linters; `version: "2"`, `linters.default: standard\|all\|none\|fast` |
| `revive` | active, v1.15.x | configurable golint-style rules | drop-in `golint` replacement, ~6× faster |
| `errorlint` | active | 1.13 wrap mistakes (`==` on wrapped, `%v` where `%w` meant) | |
| `sloglint` | active | slog key/value misuse | |
| `golint` | **archived** | n/a | → `revive` + `staticcheck`; do not recommend |
| `maligned`/`scopelint`/`structcheck`/`deadcode`/`varcheck`/`interfacer` | **removed** | n/a | folded into vet/staticcheck/unused |

golangci-lint v2 default ("standard") set (verified): `errcheck`, `govet`, `ineffassign`, `staticcheck`, `unused`. Recommended adds: `revive`, `errorlint`, `sloglint`, `copyloopvar`, `nonamedreturns`, `bodyclose`, `modernize` (added v2.6.0). v2 has **no exclusions by default**: opt into presets (`comments`, `std-error-handling`, `common-false-positives`). `golangci-lint migrate` converts v1 configs.

`modernize` analyzers (canonical: `golang.org/x/tools/.../passes/modernize`; power `go fix` + gopls + golangci-lint). "Fixes may be safely applied en masse without changing behavior." Key ones (analyzer → rewrite, target version):

| Analyzer | Rewrites | Since |
|---|---|---|
| `any` | `interface{}` → `any` | 1.18 |
| `minmax` | if/else assign → `min`/`max` (skips float/NaN) | 1.21 |
| `slicescontains` | existence loop → `slices.Contains`/`ContainsFunc` | 1.21 |
| `slicessort` | `sort.Slice(s, less)` → `slices.Sort(s)` | 1.21 |
| `mapsloop` | copy/build loop → `maps.Copy`/`Clone`/`Collect` | 1.23 |
| `rangeint` | `for i:=0;i<n;i++` → `for i := range n` | 1.22 |
| `forvar` | removes redundant `x := x` | 1.22 |
| `stringscut` / `stringscutprefix` | `Index`+slice → `strings.Cut`; `HasPrefix`+`TrimPrefix` → `CutPrefix` | 1.18 / 1.20 |
| `stringsseq` | `range strings.Split` → `SplitSeq`/`FieldsSeq` | 1.24 |
| `testingcontext` | manual ctx in tests → `t.Context()` | 1.24 |
| `waitgroupgo` | `wg.Add(1);go func(){defer wg.Done()…}` → `wg.Go(...)` | 1.25 |
| `atomictypes` | primitive `atomic.AddInt64` → typed `atomic.Int64` | 1.19 |
| `errorsastype` | `var e *T; errors.As(err,&e)` → `errors.AsType[*T]` | 1.26 |
| `bloop` | `for i<b.N` → `for b.Loop()` | 1.24 |
| `newexpr` | `newInt(x)` helper → `new(x)` | 1.26 |

`bloop`, `appendclipped`, `slicesdelete`, `fmtappendf` are **off by default in `go fix`** (nilness/zeroing/nanosecond-perf differences; see golang/go#74967) but active in gopls/golangci-lint. Don't conflate the `waitgroupgo` *modernizer* with the `waitgroup` *vet analyzer* (the latter catches the `Add`-in-goroutine bug, doesn't rewrite).

---

## Version map 1.18→1.27 {#versions}

| Ver | Style/idiom-relevant |
|---|---|
| **1.18** | generics; `any` alias; `strings.Cut` |
| **1.19** | typed `sync/atomic` wrappers (`Int64`/`Bool`/`Pointer[T]`); doc links `[Name]` |
| **1.20** | `errors.Join`; multi-`%w`; `strings.CutPrefix`/`CutSuffix` |
| **1.21** | `min`/`max`/`clear` builtins; `slices`/`maps`/`cmp`; `log/slog`; `slices.SortFunc` |
| **1.22** | **loop vars per-iteration** (kills `x := x`); range-over-int; `math/rand/v2`; enhanced `ServeMux` routing |
| **1.23** | range-over-func + `iter`; `maps.Keys`/`slices.Sorted` iterators; timers GC'd unreferenced; `go vet stdversion` |
| **1.24** | `tool` directive (kills `tools.go`); `t.Context()`/`b.Context()`; `b.Loop()`; `t.Chdir`; `testing/synctest` (experiment); `omitzero` JSON tag; generic type aliases |
| **1.25** | `sync.WaitGroup.Go` (f must not panic); `go vet` `waitgroup`+`hostport`; `synctest` GA (`synctest.Test`); `T.Attr`/`T.Output` |
| **1.26** | `errors.AsType[E]`; **`go fix` rewritten** (modernize suite); `fmt.Errorf` alloc-parity with `errors.New`; `slog.NewMultiHandler`; `new(expr)` |
| **1.27 (RC)** | **generic methods**, *but* interface methods still can't be generic and generic concrete methods **don't satisfy interface methods**; struct-literal keys may be any field selector; generalized inference. Treat as draft until GA (~Aug 2026). |

---

## What models get wrong {#stale}

1. Emitting `interface{}` instead of `any` [1.18].
2. Loop-var copies `x := x` / "capture the loop var": **redundant** in `go 1.22+`.
3. `for i:=0;i<n;i++` instead of `for i := range n` [1.22]; missing iterator idioms (`maps.Keys`, `slices.Sorted`, range-over-func) [1.23].
4. Hand-rolled `Contains`/`Map`/`Filter`/`min`/`max` instead of `slices.*`/`min`/`max`/`clear` [1.21]; `sort.Slice` over `slices.Sort`.
5. Emitting `tools.go` blank-import files instead of `tool` directives [1.24].
6. `var e *T; errors.As(err, &e)` instead of `errors.AsType[*T](err)` [1.26].
7. Not knowing `sync.WaitGroup.Go` exists [1.25]; still generating `wg.Add(1)` *inside* the goroutine (race; `go vet waitgroup`).
8. `context.Background()` in tests instead of `t.Context()` [1.24]; `time.Sleep`-and-poll instead of `testing/synctest` [1.25].
9. `fmt.Sprintf("%s:%d", host, port)` (breaks IPv6) instead of `net.JoinHostPort` [1.25].
10. Implementor-side interfaces "for mocking": guidance is the opposite: consumer-side, return concrete, test the real impl.
11. Capitalized / punctuated error strings; `"failed to"` prefix; `errors.New` for everything (or `fmt.Errorf` for everything; they're alloc-equal [1.26], so it's stylistic).
12. `GetX()` getters; `Url`/`Id`/`Http` casing; `this`/`self` receivers; `SCREAMING_SNAKE_CASE` constants.
13. Recommending `go.uber.org/atomic` as the universal modern answer: stdlib typed atomics are the default now [1.19].
14. Storing `context.Context` in a struct.
15. "Always `Stop` timers/tickers to avoid leaks" is stale: unreferenced timers are GC-eligible [1.23] (still stop for *semantics*).
16. "Go will never have generic methods" is stale for **1.27 RC**, but also misses the limit (interface methods stay non-generic).
17. `new(T)` instead of `&T{}`; positional struct literals; returning a concrete `*MyError` as `error` (typed-nil trap).
18. Recommending `golint`: archived; → `revive` + `staticcheck`.

---

## Agent addendum {#agent-addendum}

Defaults to **emit** in new 1.26-targeted code: `any`; `for i := range n`; `slices.*`/`maps.*`/`min`/`max`/`clear`; iterator helpers where the API exposes them; `log/slog`; lowercase un-punctuated error strings; `%w` only when the wrapped error is intended API surface; no loop-var copies; `t.Context()`/`b.Loop()`; named `mu` fields; typed `sync/atomic`; `Owner()`/`SetOwner()`; `ID`/`URL`/`HTTP` casing; `tool` directives; `ctx context.Context` first.

Defaults to **never emit:** `interface{}`, `tools.go`, `sort.Slice` for simple sorts, hand-rolled `Contains`/`Map`/`Filter`/`min`/`max`, capitalized error strings, `GetX()` getters, `context.Context` in structs, third-party loggers by default, `log.Fatal` in library code (only `main` exits), `math/rand` for tokens/secrets (use `crypto/rand`), `panic` for ordinary runtime failures.

**Threshold guards (change the default):** module `< go 1.22` → keep loop-var copies, avoid range-over-int/iterators; `< 1.21` → avoid `slices`/`maps`/`min`/`max`/`slog`; `< 1.24` → no `tool` directive / `t.Context` / `b.Loop`; `< 1.25` → no `WaitGroup.Go`/`synctest`; `< 1.26` → no `errors.AsType`. Measured hot-path zero-alloc logging → zap/zerolog over slog. Perf-critical constructor in a tight loop → config struct over functional options. **Always gate a version-tagged idiom on the module's declared `go` directive.**

---

## See Also {#see-also}
- [errors-and-resilience.md](errors-and-resilience.md): error wrapping mechanics, `errors.AsType`, retry, circuit breaker
- [modern-go.md](modern-go.md): full version matrix, `go fix` modernizers, range-over-func
- [concurrency.md](concurrency.md): goroutine lifecycle, `WaitGroup.Go`, errgroup, `synctest`
- [testing.md](testing.md): table-driven tests, `t.Context`, `b.Loop`, testify decision
- [ecosystem-and-tooling.md](ecosystem-and-tooling.md#style-guides): golangci-lint config, CI lint stack

## Sources {#sources}
- google.github.io/styleguide/go/{guide,decisions,best-practices} (three-tier normative/canonical model verified at source); go.dev/doc/effective_go; go.dev/wiki/CodeReviewComments (legacy); github.com/uber-go/guide
- go.dev/doc/go1.18-go1.27 release notes; pkg.go.dev/{errors,slices,maps,cmp,iter,sync,sync/atomic,log/slog,testing,testing/synctest}
- pkg.go.dev/golang.org/x/tools/go/analysis/passes/modernize (analyzer names + off-by-default set verified); golangci-lint.run (v2 schema, default linter set verified)
- mvdan.cc/gofumpt; staticcheck.dev; github.com/mgechev/revive
