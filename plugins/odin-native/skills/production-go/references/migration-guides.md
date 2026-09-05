# Migration Guides: X → Go, and Go → newer Go

Two migrations live here. **Cross-language** (Python/Java/TS/Rust → Go): the trap is writing the old language in Go syntax: errors are values, composition replaces inheritance, goroutines replace threads. **Within Go** (old toolchain/APIs → current): the Go 1 promise means your code keeps compiling, but `io/ioutil`, `math/rand`, `interface{}`, and `strings.Title` all have modern replacements, and `go fix` now automates most of the rewrite.

> Verified against Go **1.26.x** (stable, Feb 2026) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. No-corpus build: deprecations/versions checked against go.dev release notes + pkg.go.dev; unverified specifics flagged `[verify]`.

## TL;DR: the modern deltas (read first)

- The Go 1 compatibility promise is real: old code compiles on new toolchains. Behavior changes permitted by the promise (bug/security fixes) are gated behind **`GODEBUG`** opt-outs, and the **`go` line in `go.mod` selects the GODEBUG defaults [1.21]**, so just bumping `go 1.x` can change runtime behavior. Don't bump it blind.
- `go fix` was rebuilt as Go's *modernizer* [1.26]: a push-button rewriter for current idioms/APIs, on the same analysis framework as `go vet`. It auto-migrates `interface{}`→`any`, `errors.As`→`AsType`, manual loops→`slices`/`maps`, and more. Run it after every toolchain bump.
- The loop-variable change [1.22] is the one silent behavior break: per-iteration scoping for `for range` and 3-clause `for`. It *fixes* the classic goroutine-capture bug but can change programs that relied on the shared variable. Gated by the `go.mod` `go` line.
- API replacements that are settled: `io/ioutil`→`io`/`os` [1.16], `interface{}`→`any` [1.18], `math/rand`→`math/rand/v2` [1.22], `strings.Title`→`golang.org/x/text/cases`. `grpc.Dial`→`grpc.NewClient`. **`errors.As`→`errors.AsType` [1.26] is preferred but NOT deprecated.**
- `go mod init` now writes a *lower* `go` line [1.26] (`go 1.(N-1).0`) to favor compatibility: don't hand-bump it to the toolchain version without reason.
- Major-version modules need a `/vN` path (`example.com/lib/v2`): there is no other way to ship a breaking change under modules.

## Table of Contents
1. [The Go 1 compatibility promise & GODEBUG](#go1-compat)
2. [Upgrading toolchains safely](#upgrading)
3. [`go fix` / modernizers: automated migration](#go-fix)
4. [Standard-library API migrations](#stdlib-apis)
5. [The loop-variable change [1.22]](#loopvar)
6. [`interface{}` → `any` & generics adoption](#generics)
7. [GOPATH → modules; `/vN` major versions](#modules)
8. [Ecosystem migrations (gRPC, json/v2)](#ecosystem)
9. [Cross-language: Universal Traps](#universal-traps)
10. [Python → Go](#python-to-go)
11. [Java → Go](#java-to-go)
12. [TypeScript/Node → Go](#typescript-to-go)
13. [Rust → Go](#rust-to-go)
14. [Quick Reference](#quick-reference)
15. [Version / migration map](#versions)
16. [What models get wrong](#stale)

---

## The Go 1 compatibility promise & GODEBUG {#go1-compat}

The [Go 1 compatibility guarantee](https://go.dev/doc/go1compat): source valid under Go 1 keeps compiling and running across 1.x releases. The escape hatch for unavoidable behavior changes (security/bug fixes, new defaults like HTTP/2) is **GODEBUG**: a `key=value` mechanism that lets a program opt back into the *old* behavior.

The load-bearing fact models miss: the `go` line in `go.mod` sets GODEBUG defaults [1.21]. A 1.26 toolchain compiling a module that says `go 1.20` runs with 1.20-era defaults (e.g. `panicnil=1`, shared loop variables). Bumping the line flips many defaults at once.

```go
// go.mod
module example.com/app

go 1.26                  // ← selects 1.26 GODEBUG defaults (and 1.22+ loopvar, etc.)

godebug (                // [1.23] explicit overrides; only the MAIN module's are read
    default=go1.24       // take unspecified settings from 1.24
    panicnil=1           // but keep pre-1.21 panic(nil) behavior
    asynctimerchan=0     // and the new 1.23 timer-channel behavior
)
```

Per-file override (precedes `package`), useful in a single `main`:

```go
//go:debug gotypesalias=0
package main
```

Inspect what a binary will actually use:

```bash
go list -f '{{.DefaultGODEBUG}}' ./cmd/server   # only differences from toolchain defaults
```

Rules & guarantees: compatibility GODEBUGs are kept **≥ 2 years (4 releases)**; some (`http2client`, `http2server`) indefinitely. Each has a `runtime/metrics` counter `/godebug/non-default-behavior/<name>:events`: wire it into a dashboard to detect reliance on legacy behavior before a setting is removed. **Only the main module's `godebug` directives are honored** (deps' are ignored). GODEBUG is a *migration cushion*, not a config system: fix the code and remove the override.

---

## Upgrading toolchains safely {#upgrading}

Two independent knobs in `go.mod`, often confused:

| Directive | Meaning |
|---|---|
| `go 1.26` | **Language + GODEBUG-default version.** Minimum toolchain that can build this module; gates language features (generics, range-over-func, loopvar) and GODEBUG defaults. |
| `toolchain go1.26.4` | **Which toolchain to fetch/run** [1.21]. If the installed `go` is older than required, Go downloads this one automatically (toolchain management). |

```bash
go get go@1.26          # bump the `go` line (and toolchain) to 1.26
go mod tidy             # reconcile deps against the new language version
go fix ./...            # apply modernizers (below)
go vet ./... && go test -race ./...   # catch behavior changes the bump introduced
```

Discipline: bump the `go` line in a *dedicated commit* (so a regression bisects cleanly), after reading the release notes' compatibility section. Raising `go 1.x` is a behavior change, not just a feature unlock: loopvar semantics and dozens of GODEBUG defaults move with it; treat it like a dependency upgrade, with tests. **`go mod init` writes a *lower* `go` line [1.26]**: a `1.N.X` toolchain emits `go 1.(N-1).0` (1.26 writes `go 1.25.0`; RCs write `1.(N-2).0`) to favor compatibility; don't reflexively raise it to your local toolchain.

---

## `go fix` / modernizers: automated migration {#go-fix}

`go fix` was completely rebuilt in [1.26] into the home of Go's *modernizers*: "a dependable, push-button way to update Go code bases to the latest idioms and core library APIs," built atop the **same analysis framework as `go vet`**. The old (long-obsolete) fixers were removed.

```bash
go fix ./...            # apply all modernizers + idiom/API migrations [1.26]
go vet ./...            # the diagnostics side of the same analyzers
```

It mechanically applies safe rewrites: `interface{}`→`any`, `errors.As`(throwaway-var)→`errors.AsType`, manual min/max→builtins, hand-rolled loops→`slices`/`maps` helpers, `for i:=0;i<n;i++`→`for range n`, and more. Fixers "should not change the behavior of your program."

Author your own API migration with a source-level inliner: mark a deprecated function so callers are rewritten to its replacement.

```go
//go:fix inline
func OldName(x int) int { return NewName(x, defaultMode) } // callers get rewritten to NewName
```

`gopls` surfaces the same modernizers as editor quick-fixes. Before [1.26], the equivalent lived in `golang.org/x/tools/gopls/.../modernize` and `staticcheck`; on 1.26+ prefer the built-in `go fix`. Run it as a CI check (`gofmt`-style diff gate) so the codebase tracks idioms automatically.

---

## Standard-library API migrations {#stdlib-apis}

All of these are deprecated-but-functional (Go 1 promise): the old code compiles forever; migrate for clarity and to satisfy `staticcheck`/`go vet`.

`io/ioutil` → `io` / `os` [1.16] (whole package deprecated; verified on pkg.go.dev):

```go
// WRONG (deprecated [1.16/1.17])          // RIGHT
ioutil.ReadFile(name)                       os.ReadFile(name)
ioutil.WriteFile(name, b, 0o644)            os.WriteFile(name, b, 0o644)
ioutil.ReadAll(r)                           io.ReadAll(r)
ioutil.ReadDir(dir)   // []fs.FileInfo      os.ReadDir(dir)   // []fs.DirEntry — partial results on error
ioutil.NopCloser(r)                         io.NopCloser(r)
ioutil.Discard                              io.Discard
ioutil.TempFile(dir, pat)                   os.CreateTemp(dir, pat)   // [1.17]
ioutil.TempDir(dir, pat)                    os.MkdirTemp(dir, pat)    // [1.17]
```

`os.ReadDir` returns `[]fs.DirEntry` (lazy `Info()`), not `[]fs.FileInfo`: the one signature change; adapt callers that needed `FileInfo`.

`math/rand` → `math/rand/v2` [1.22] (the only `vN` in the stdlib; verified on pkg.go.dev):

```go
// WRONG (math/rand)                         // RIGHT (math/rand/v2)
rand.Seed(time.Now().UnixNano())             // GONE: auto-seeded [1.20]; v1 Seed is a no-op [1.24]
rand.Intn(n)                                 rand.IntN(n)      // N suffix
rand.Int63n(n)                               rand.Int64N(n)
r := rand.New(rand.NewSource(seed))          r := rand.New(rand.NewPCG(s1, s2))  // or NewChaCha8
                                             rand.N(100 * time.Millisecond)      // generic [1.22]
```

`v2` drops the global `Seed` (auto-seeded), adds generic `N[Int]`, and exposes named sources `PCG`/`ChaCha8`. For security-sensitive randomness use `crypto/rand`, never either `math/rand`.

`strings.Title` → `golang.org/x/text/cases` [deprecated 1.18]: `strings.Title` only handles ASCII word boundaries and mis-cases Unicode; it has no stdlib replacement:

```go
// WRONG: strings.Title(s)  — deprecated, Unicode-broken
import (
    "golang.org/x/text/cases"
    "golang.org/x/text/language"
)
caser := cases.Title(language.English)
out := caser.String(s)   // construct caser once; reuse (it's stateful per language)
```

`interface{}` → `any` [1.18]: `any` is an alias, so the change is purely cosmetic (identical type), but it's the idiom and `go fix` rewrites it (see [#generics](#generics)).

Boundary/security defaults that moved (Go 1 promise + GODEBUG): TLS min version → 1.2 [1.22] (`tls10server`); `net/http` empty `Content-Length` rejected [1.22] (`httplaxcontentlength`); `panic(nil)` → `*runtime.PanicNilError` [1.21] (`panicnil`); timer channels synchronous [1.23] (`asynctimerchan`, **removed 1.27**); `net/http/httputil` `ReverseProxy.Director` deprecated for `Rewrite` [1.26]. If a bump breaks you, the release notes name the exact GODEBUG to buy migration time.

---

## The loop-variable change [1.22] {#loopvar}

The single behavior break that bites real code. Through 1.21, a `for` loop reused **one** variable per loop; 1.22 makes each iteration create a **fresh** variable for both `for range` and 3-clause `for i := ...`.

```go
// Pre-1.22: classic capture bug — all goroutines saw the FINAL v.
// 1.22+: fixed automatically — each closure captures its own v.
for _, v := range items {
    go func() { fmt.Println(v) }()      // [1.22] prints each item; pre-1.22 printed the last, N times
}
```

What this fixes vs. breaks:
- *Fixes* the #1 Go beginner bug (goroutine/closure capture; `errgroup`/`t.Run` loops). The old `v := v` shadow line is now redundant.
- *Breaks* code that **relied** on the shared variable: e.g. capturing `&v`'s address expecting one slot, or appending `&v` to a slice and expecting all entries to alias. Those now get distinct addresses.

Gating & audit: the change is tied to the `go.mod` `go` line: modules at `go 1.21` or lower keep the old semantics even on a 1.26 toolchain; bumping to `go 1.22+` activates it.

```bash
# Audit BEFORE bumping the go line to 1.22+:
go vet -loopclosure ./...                 # flags suspicious captures
GOEXPERIMENT=loopvar go test ./...        # [≤1.21] dry-run new semantics on an old toolchain  [verify exact flag]
go test -race ./...                       # after bumping
```

Search for `&loopvar` taken inside the loop body and for `append(s, &v)` patterns: those are the realistic regressions. Pure value-capture code only improves.

---

## `interface{}` → `any` & generics adoption {#generics}

`any` [1.18] is a built-in alias for `interface{}`: same type, zero runtime change. Migrate for readability; `go fix` does it mechanically.

Generics adoption is additive, not a rewrite. Reach for type parameters only where they remove duplication or unsafe `interface{}` casts: not everywhere.

```go
// BEFORE: interface{} + runtime assertion (panics on misuse)
func First(xs []interface{}) interface{} { return xs[0] }

// AFTER: type parameter — compile-time safety, no boxing
func First[T any](xs []T) T { return xs[0] }
```

Strategy:
- Replace `interface{}`-based containers/utilities (`Map`, `Filter`, `Keys`) with generics or the stdlib `slices`/`maps` packages [1.21]: `go fix` migrates many manual loops automatically.
- Constrain with `comparable`, `cmp.Ordered` [1.21], or `~`-underlying constraints: not bare `any` unless you truly accept anything.
- Don't parameterize a function used at one type, or to "future-proof." Concrete types read better and inline more reliably.
- Methods can't add their *own* type parameters before **[1.27]** (generic methods land in 1.27 RC): until then, put parameters on the enclosing type or a free function.

`interface{ ... }` *behavioral* interfaces (`io.Reader`, `error`) remain the right tool for polymorphism; generics are for type-uniform code (containers, numeric algorithms).

---

## GOPATH → modules; `/vN` major versions {#modules}

GOPATH mode is gone: modules are the only supported workflow (module mode is the default since 1.16; `GO111MODULE=on` is unnecessary). Migrate a legacy GOPATH project:

```bash
cd legacy-project
go mod init github.com/org/project   # synthesize go.mod from imports
go mod tidy                          # populate require/go.sum, drop unused
# delete vendor/ unless you deliberately vendor; rely on the module cache + go.sum
```

Semantic-import versioning: the `/vN` rule. A module's **major version ≥ 2 must appear in the import path**; this is the *only* mechanism for a breaking release under modules.

```go
// go.mod of the library, v2+:
module github.com/org/lib/v2
go 1.26

// consumers import the versioned path:
import "github.com/org/lib/v2"        // v0/v1 import WITHOUT a suffix
```

Migration steps for a breaking release: (1) edit `module` path to end `/v2`; (2) update intra-module imports to the `/v2` path; (3) tag `v2.0.0`. Two layout choices: a `v2/` subdirectory, or a `v2` branch: both valid; the subdirectory keeps one branch. **v0/v1 share the unsuffixed path**; only v2+ takes a suffix. Skipping `/vN` is the most common module mistake: `go get` then refuses the upgrade because it's a *different* module path, not a new version of the old one.

Workspaces [1.18] (`go work init ./a ./b`) let you develop across multiple modules locally without `replace` directives: use for multi-module repos, then remove before release. Deeper dive: [modules-and-dependencies.md](modules-and-dependencies.md).

---

## Ecosystem migrations (gRPC, json/v2) {#ecosystem}

`grpc.Dial` / `grpc.DialContext` → `grpc.NewClient` (grpc-go). `Dial`/`DialContext` are deprecated in favor of `NewClient`, which fixes long-standing footguns: it does **not** dial eagerly, ignores the passed `ctx` for connection establishment, and defaults the resolver to `dns:///`.

```go
// WRONG (deprecated): eager-ish, blocking knobs, ctx misused for the conn
conn, err := grpc.DialContext(ctx, addr, grpc.WithBlock(), grpc.WithInsecure())

// RIGHT: lazy connect; pick a credentials option explicitly
conn, err := grpc.NewClient(addr,
    grpc.WithTransportCredentials(insecure.NewCredentials()), // or real TLS creds
)
if err != nil { return err }
defer conn.Close()
```

Migration notes: drop `WithBlock`/`WithReturnConnectionError` (no eager dial: the first RPC connects; wait on RPC readiness instead); `WithInsecure()`→`WithTransportCredentials(insecure.NewCredentials())`; if you relied on the old default scheme, prefix the target with `passthrough:///`. The deprecation landed in grpc-go around **v1.63 (mid-2024)** `[verify exact version]`; match your project's `google.golang.org/grpc` version.

Preparing for `encoding/json/v2`: a major revision of `encoding/json` (correctness fixes, streaming, big performance gains) is in flight as an experiment (`GOEXPERIMENT=jsonv2`); `v1` stays supported under the Go 1 promise and is re-implemented on the v2 engine. It is **not yet GA in 1.26** `[verify GA release — possibly 1.27+]`. Prepare now without committing:

```go
// Write decoupling-friendly code today so a later switch is mechanical:
// - prefer json.Decoder/Encoder (streaming) over Marshal/Unmarshal of whole blobs
// - rely on struct tags + interfaces, not on v1's exact error TEXT (which v2 changes)
// - centralize (un)marshal in one helper so the import swap is one edit
```

Behavioral deltas to expect at GA: stricter defaults (e.g. case-sensitive keys, duplicate-key rejection), changed error messages, `omitzero` semantics. Don't assert on v1 error strings. Full detail: [encoding-and-serialization.md](encoding-and-serialization.md#json-v2).

---

## Cross-language: Universal Traps {#universal-traps}

| Trap | What Happens | Fix |
|------|-------------|-----|
| **Nil interface ≠ nil pointer** | `var p *T = nil; var i I = p; i != nil` is `true` | Return `nil` directly, not a typed nil pointer |
| **Slice append reallocates** | `append(s, v)` may return a new backing array | Always assign back: `s = append(s, v)` |
| **Defer captures args immediately** | `defer fmt.Println(x)` captures `x` now, not at exit | Use closure: `defer func() { fmt.Println(x) }()` |
| **Map order is random** | `for k, v := range m` differs each run | Sort keys first if order matters |
| **Strings are bytes** | `len("café")` is 5 (bytes), not 4 (runes) | `for _, r := range s` iterates runes |
| **Zero values are real** | `int` is `0`, `string` is `""`: valid, not "empty" | Use `*T` when "unset" must be distinguishable |

> **Loop variable [1.22]:** capture in `for range` and 3-clause `for` is now per-iteration: the old goroutine-capture bug is fixed (see [#loopvar](#loopvar)). Gated by the `go.mod` `go` line.

---

## Python → Go {#python-to-go}

| Python | Go | Key Difference |
|--------|----|----------------|
| GIL + threading | Goroutines + channels | True parallelism; ~2 KB initial stack |
| Duck typing | Interfaces (implicit) | Compile-time checked, not runtime |
| `try/except` | `(value, error)` | Errors are values, checked explicitly |
| `pip` + `requirements.txt` | `go mod` + `go.sum` | Checksum-verified, no virtualenv |
| List comprehensions | `for`+`append` / `slices` | No expression-level building |
| Decorators | Middleware / HOFs | Wrap `http.Handler` or pass functions |
| Generators (`yield`) | Channels / `iter.Seq` [1.23] | Range-over-func iterators |
| `class` | `struct` + methods | No `__init__`; explicit receiver |
| `with` | `defer` | Function-scoped, not block-scoped |
| `**kwargs` | Functional options | `WithTimeout(d)` |

Traps: (1) No truthiness: `if len(s) > 0`, not `if s`. (2) Nil map panics on write (`m["k"]=v`); nil slice is append-safe. `make(map...)` always. (3) `defer` is function-scoped, unlike `with`: deferring in a loop leaks; extract a helper. (4) No universal `None`: `*string` can be nil, `string` can't. (5) Error verbosity is intentional; `if err != nil` *is* idiomatic: don't hide it in a panicking `must()`.

```go
// list comprehension → loop;  decorator → middleware
var result []int
for _, x := range items { if x > 0 { result = append(result, x) } }

func withLogging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        slog.Info("request", "method", r.Method, "path", r.URL.Path)
        next.ServeHTTP(w, r)
    })
}
// `with` → defer: extract a function so the defer fires per "block"
func processFile(name string) error {
    f, err := os.Open(name)
    if err != nil { return err }
    defer f.Close()
    return process(f)
}
```

---

## Java → Go {#java-to-go}

| Java | Go | Key Difference |
|------|----|----------------|
| Class inheritance | Struct embedding | Delegation, not polymorphism: no virtual dispatch |
| Interfaces (explicit) | Interfaces (implicit) | No `implements`; satisfy by having methods |
| Annotations | Struct tags | `json:"name"`: runtime reflection only |
| Maven/Gradle | `go mod` | Declarative; no scripted build file |
| Generics (erasure) | Generics [1.18] (GC shapes) | Dictionary-based; constraints replace bounds |
| Checked exceptions | `error` value | No `throws`; caller handles or propagates |
| Constructor overloading | Functional options | `NewServer(WithPort(8080))` |
| `synchronized` | `sync.Mutex` / channels | Channels for comms, mutexes for state |
| Streams API | `for` / `slices` pkg | No lazy pipelines; explicit loops |
| Spring DI | Constructor injection | Pass deps as params; no annotation magic |

Traps: (1) Embedding ≠ inheritance: embedded methods don't virtually dispatch; `Base.Greet()` calling `Name()` always calls `Base.Name`. (2) No method overloading: distinct names (`ReadByte`/`ReadRune`). (3) No `Optional<T>`: nil-check pointers/slices/maps/chans/interfaces. (4) Never `panic` for expected errors. (5) No `instanceof`: use `switch v := x.(type)`.

```go
// constructor overloading → functional options
type Option func(*Server)
func WithPort(p int) Option { return func(s *Server) { s.port = p } }
func NewServer(opts ...Option) *Server {
    s := &Server{port: 8080}
    for _, o := range opts { o(s) }
    return s
}
// inheritance → composition via interface;  Spring DI → constructor injection
type Namer interface { Name() string }
func Greet(n Namer) string { return "Hello, " + n.Name() }
func NewService(repo *Repo, logger *slog.Logger) *Service {
    return &Service{repo: repo, logger: logger}
}
```

---

## TypeScript/Node → Go {#typescript-to-go}

| TypeScript/Node | Go | Key Difference |
|-----------------|----|----------------|
| Event loop | Goroutines + scheduler | Multi-threaded; no single-thread bottleneck |
| `async/await` | Goroutines + channels | No function coloring |
| `Promise.all()` | `errgroup.Group` | Structured concurrency + error propagation |
| npm + `package.json` | `go mod` + `go.sum` | No `node_modules`; global cache |
| Express/Fastify | `net/http` | [1.22] built-in method+wildcard routing |
| `any`/`unknown` | `any` | Prefer generics for type safety |
| `undefined` vs `null` | Zero value | One concept; no undefined |
| Enums | `const` + `iota` | Typed constants, not a distinct type |
| `?.` chaining | Explicit nil checks | No shorthand |
| `try/catch` | `(value, error)` | Check at every call site |

Traps: (1) Goroutines leak silently: blocked ones live forever (unlike GC'd Promises); cancel via `context.Context`; the [1.26] experimental `goroutineleak` profile finds them. (2) No `undefined`: `var x string` is `""`; use `*string` for "not provided." (3) Nil slice marshals to `null`, `[]int{}` to `[]`. (4) No `keyof`/mapped types: use `go generate`. (5) Shared state races: Go is multi-threaded; use `sync.Mutex` or channels.

```go
// Promise.all → errgroup (x/sync/errgroup): WithContext + g.Go, bounded by SetLimit(n).
// Express route → stdlib mux [1.22]
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")   // no framework needed
})
// async/await → goroutine + channel
type result struct { data []byte; err error }
ch := make(chan result, 1)
go func() { d, e := fetchData(ctx); ch <- result{d, e} }()
res := <-ch
```

---

## Rust → Go {#rust-to-go}

| Rust | Go | Key Difference |
|------|----|----------------|
| Ownership + borrowing | Garbage collector | No lifetimes; concurrent GC, sub-ms pauses |
| Traits | Interfaces | Implicit; no `impl Trait for Type` |
| `enum` (algebraic) | Sealed interface | Unexported marker method simulates sum types |
| `Result<T, E>` | `(T, error)` | No `?`; explicit checks |
| `match` | `switch` / type switch | No exhaustiveness checking |
| `Option<T>` | `*T` | `nil` = absent; zero value = present |
| Cargo | `go mod` | No build scripts or feature flags |
| `Arc<Mutex<T>>` | `sync.Mutex` | Embed in struct; no ownership wrapper |
| Macros | `go generate` / `go fix` inliner | External tools, not compile-time hygiene |
| `unsafe {}` | `unsafe` package | Far narrower in scope |

Traps: (1) No exhaustive matching: `switch` silently skips; add `default` with panic/log. (2) Data races are possible (no ownership): always `go test -race`. (3) No `?`: every fallible call needs `if err != nil`; `Must()` at init only (`regexp.MustCompile`). (4) Nil typed-interface trap: `var e *MyError; var err error = e; err != nil` is `true`: interface is nil only when both type and value are nil. (5) Generics are simpler: no associated types, specialization, or const generics.

```go
// Result → (value, error)
func parseConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil { return nil, fmt.Errorf("reading config: %w", err) }
    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parsing config: %w", err)
    }
    return &cfg, nil
}
// enum-with-data → sealed interface (unexported method gates external impls)
type Shape interface { isShape() }
type Circle struct{ Radius float64 }
func (Circle) isShape() {}
type Rect struct{ W, H float64 }
func (Rect) isShape() {}
func Area(s Shape) float64 {
    switch v := s.(type) {
    case Circle: return math.Pi * v.Radius * v.Radius
    case Rect:   return v.W * v.H
    default:     panic(fmt.Sprintf("unhandled: %T", s))
    }
}
// trait impl → implicit satisfaction: just define the method (satisfies fmt.Stringer)
type Point struct{ X, Y float64 }
func (p Point) String() string { return fmt.Sprintf("(%g, %g)", p.X, p.Y) }
```

---

## Quick Reference {#quick-reference}

Cross-language: Classes → structs+methods+interfaces. Inheritance → embedding. Exceptions → `(value, error)`. Generics → [1.18]. Pattern matching → type switches. Enums → `const`+`iota`. Package manager → `go mod`. Ternary → `if/else`. map/filter → loops or `slices`/`maps`.

Within Go: Bump → `go get go@1.x` + `go fix` + `go vet` + `go test -race`. `ioutil`→`io`/`os`. `math/rand`→`math/rand/v2`. `interface{}`→`any`. `strings.Title`→`x/text/cases`. `errors.As`→`AsType` (preferred, not required). Behavior opt-out → `GODEBUG`/`go.mod` `godebug`. Breaking release → `/vN` import path.

---

## Version / migration map {#versions}

| Source → target | Migration | Released |
|---|---|---|
| `io/ioutil` → `io`/`os` | mechanical func swap; `ReadDir` returns `DirEntry` | **1.16** (TempFile/Dir 1.17) |
| `interface{}` → `any` | alias; cosmetic; `go fix` | **1.18** |
| GOPATH → modules | `go mod init` + `go mod tidy` | module mode default since 1.16 |
| generics adoption | type params for type-uniform code only | **1.18** |
| `panic(nil)` → `PanicNilError` | GODEBUG `panicnil` | **1.21** |
| `go.mod` `go` line sets GODEBUG defaults | bump = behavior change | **1.21** |
| `slices`/`maps` stdlib | replace hand-rolled generic utils | **1.21** |
| loop-variable per-iteration | audit `&v`/`append(s,&v)`; gated by `go` line | **1.22** |
| `math/rand` → `math/rand/v2` | `Intn`→`IntN`, drop `Seed`, `PCG`/`ChaCha8` | **1.22** |
| range-over-func iterators | generators → `iter.Seq` | **1.23** |
| `go.mod` `godebug` directives | explicit per-setting overrides | **1.23** |
| `toolchain` auto-download | `toolchain go1.x.y` line | **1.21** |
| `errors.As` → `errors.AsType` | preferred, **not deprecated**; `go fix` | **1.26** |
| `go fix` modernizers | push-button idiom/API migration | **1.26** |
| `go mod init` lower `go` line | writes `go 1.(N-1).0` | **1.26** |
| `ReverseProxy.Director` → `Rewrite` | safer header handling | **1.26** (Rewrite since 1.20) |
| `fmt.Errorf("x")` ≈ `errors.New` | the "use New for plain strings" rule is stale | **1.26** |
| generic methods | methods may declare type params | **1.27 (RC)** `[verify]` |
| `asynctimerchan` GODEBUG removed | timers always synchronous | **1.27 (RC)** |
| `encoding/json/v2` GA | streaming/correctness; stricter defaults | `[verify — 1.27+]` |

---

## What models get wrong {#stale}

1. Thinking the Go 1 promise means **nothing** changes on upgrade: behavior changes do happen (gated by GODEBUG / the `go.mod` `go` line). Bumping `go 1.x` is a behavior change.
2. Forgetting **the `go` line in `go.mod` selects GODEBUG defaults [1.21]**, so a version bump silently flips loopvar semantics and dozens of defaults.
3. Treating the **loop-variable change [1.22]** as pure win: it can break code that relied on the shared variable (`&v`, `append(s,&v)`). Audit before bumping past `go 1.21`.
4. Hand-writing migrations that **`go fix` [1.26]** now automates (`interface{}`→`any`, `As`→`AsType`, loops→`slices`); not running it after a bump.
5. Claiming `io/ioutil` is **removed**: it's *deprecated* [1.16] but still compiles (Go 1 promise). Same for `strings.Title` [1.18].
6. Using `math/rand`'s `rand.Seed`: **no-op since [1.24]**; v1 auto-seeds [1.20]; new code should use `math/rand/v2` (`IntN`, `N`, `PCG`/`ChaCha8`).
7. Saying `errors.As` is **deprecated**: it isn't; docs say "for most uses, prefer `AsType` [1.26]." Keep `As` for pre-1.26 or a dynamic `target any`.
8. Shipping a breaking library release **without the `/vN` import path**: modules reject it as the same path, not a new major.
9. Setting `GO111MODULE=on` or keeping a GOPATH workflow: modules are the default; the flag is noise.
10. Using `grpc.Dial`/`DialContext` + `WithBlock` + `WithInsecure()` in new code: use `grpc.NewClient` + `WithTransportCredentials(insecure.NewCredentials())`; no eager dial.
11. Asserting on **`encoding/json` v1 error strings**: v2 changes the text and tightens defaults; centralize (un)marshal and don't match error substrings.
12. Reflexively parameterizing everything with generics: concrete types read better and inline more reliably; generics are for type-uniform code.
13. Raising the `go.mod` `go` line to the local toolchain after `go mod init`: [1.26] deliberately writes a *lower* line (`go 1.(N-1).0`) for compatibility.
14. Confusing the `go` directive (language/GODEBUG version) with `toolchain` (which binary to run): they're independent.
15. Writing `interface{}` in new code: use `any` [1.18] (`go fix` rewrites it).

---

## See Also {#see-also}
- [modules-and-dependencies.md](modules-and-dependencies.md): `go.mod`/`go.sum`, MVS, `/vN`, workspaces, vendoring
- [modern-go.md](modern-go.md): range-over-func, generics, `slices`/`maps`, `go fix` in the version matrix
- [errors-and-resilience.md](errors-and-resilience.md): `errors.AsType` vs `As`, wrapping, the same `else if` shadowing footgun
- [concurrency.md](concurrency.md): goroutine lifecycle, `errgroup`, loopvar capture
- [encoding-and-serialization.md](encoding-and-serialization.md#json-v2): `encoding/json/v2` migration detail
- [design-patterns.md](design-patterns.md): functional options, middleware
- [style-synthesis.md](style-synthesis.md): idiomatic Go style

## Sources {#sources}
- go.dev/doc/go1compat (Go 1 compatibility promise); go.dev/doc/godebug (GODEBUG history, `go.mod` defaults)
- go.dev/doc/go1.16, go1.18, go1.21, go1.22, go1.23, go1.26 release notes; go1.27 RC notes
- pkg.go.dev/{io/ioutil (deprecated 1.16/1.17), math/rand/v2, errors#AsType (added 1.26.0), strings#Title}
- go.dev/doc/go1.26 §Tools: `go fix` modernizers + `//go:fix inline`; `go mod init` lower `go` line; `errors.AsType`; `fmt.Errorf` alloc parity
- go.dev/wiki: modules `/vN` semantic-import versioning; "From X to Go"; Effective Go; Go FAQ
- grpc-go `Dial`/`DialContext` deprecation → `grpc.NewClient` (version `[verify]`); `encoding/json/v2` proposal (`GOEXPERIMENT=jsonv2`, GA `[verify]`)