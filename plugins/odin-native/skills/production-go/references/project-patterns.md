# Project Patterns, DI, and Architecture

Go rewards **starting flat and letting structure emerge**. The only structural rule the toolchain enforces is `internal/`; everything else (`cmd/`, `pkg/`, layer trees) is convention, and most of it is over-applied. Name packages by what they *provide*, define interfaces where they're *consumed*, accept interfaces and return structs, and wire dependencies with plain constructors in `main` until that genuinely hurts.

> Verified against Go **1.26.4** (stable) + **1.27 RC** draft notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. Triangulated from two deep-research reports + go.dev / pkg.go.dev primary sources.

## TL;DR: the modern deltas (read first)

- `golang-standards/project-layout` is NOT official: its own README says so, and Russ Cox filed issue #117 objecting to the "standard" framing. The authoritative reference is **`go.dev/doc/modules/layout`**: start flat, add `internal/` only when a package outgrows the root, use `cmd/` for multiple binaries, and **never `pkg/`**.
- `pkg/` is an anti-pattern for most repos. It adds 4 chars to every import path and buys nothing `internal/` doesn't. The stdlib itself dropped `pkg/` in Go 1.4. Library code belongs at/near the root; app-private code belongs in `internal/`.
- The `tools.go` blank-import hack is obsolete [1.24]. Track dev tools with the **`tool` directive** in `go.mod` (`go get -tool …`, run via `go tool <name>`). Recommending `//go:build tools` files is stale.
- `google/wire` is archived/unmaintained (final v0.7.0, Aug 2025; pkg.go.dev: "no longer maintained"). For new code default to **manual constructor wiring**; among frameworks the maintained options are `uber-go/fx`, `uber-go/dig`, and the generics-based `samber/do/v2`. A maintained fork (`goforj/wire`) exists but has tiny adoption.
- `go tool doc` removed [1.26]: use `go doc`. `go mod init` writes a `go` line two minors back [1.26].
- Clean Architecture / DDD ported wholesale from Java/C# fights Go. Group by *capability*, not by *layer*; don't pre-declare interfaces; skip the ceremony for CRUD.

## Table of Contents
1. [Package layout that scales](#package-design)
2. [The `internal/` boundary & why `pkg/` is an anti-pattern](#internal-vs-pkg)
3. [Package naming](#naming)
4. [Interface placement & "accept interfaces, return structs"](#interfaces)
5. [Dependency injection: manual vs Wire vs fx/dig vs do](#di)
6. [Functional-options constructors](#options)
7. [Config loading](#config)
8. [Domain-vs-transport layering & testability seams](#layering)
9. [Domain-Driven Design in Go](#ddd)
10. [Clean Architecture mapping](#clean-architecture)
11. [Avoiding import cycles & god packages](#cycles)
12. [Plugin architecture](#plugins)
13. [Code generation & the `tool` directive](#codegen)
14. [Library & tooling status](#libraries)
15. [Version map 1.22→1.27](#versions)
16. [What models get wrong](#stale)

---

## Package layout that scales {#package-design}

The official progression (`go.dev/doc/modules/layout`). *Follow it, don't scaffold ahead of it*:

| Stage | Shape | Trigger to advance |
|---|---|---|
| **Basic package/command** | `go.mod` + `modname.go` (+ more `.go` files, same `package`) at the root | None |
| **Supporting packages** | add `internal/auth/`, `internal/hash/` | the root package loses cohesion |
| **Multiple binaries** | `cmd/<prog>/main.go` | a second `func main` appears |
| **Server** | bulk in `internal/`, all binaries in `cmd/`; reusable bits → **separate modules** | code becomes broadly reusable |

A **directory is a package**: don't create packages just to file-organize; that invites import cycles and premature structure. The `module` line in `go.mod` is the real repo path (`module github.com/you/modname`); a `/v2`+ suffix is required at major version ≥ 2.

```text
// RIGHT — minimal, earns structure as it grows
modname/
  go.mod
  modname.go        // package modname
  modname_test.go
  internal/         // added only when the root stops being cohesive
    auth/auth.go

// RIGHT — server: internal/ for logic, cmd/ for binaries
myservice/
  go.mod
  internal/
    auth/  orders/  platform/postgres/
  cmd/
    api/main.go
    worker/main.go
```

```text
// WRONG — cargo-culted "standard layout" on day one for a one-binary app
myapp/
  cmd/ pkg/ internal/ api/ configs/ deployments/ scripts/ test/ …
  # a dozen near-empty dirs and import-path noise before any boundary is proven
```

Alex Edwards' rule: *"let the code you're writing guide the files and packages that you create."* The official server example does keep all commands in `cmd/` even when a repo is commands-only (useful once you add importable packages; not mandatory before that).

---

## The `internal/` boundary & why `pkg/` is an anti-pattern {#internal-vs-pkg}

**`internal/` is the only compiler-enforced structural rule** (since Go 1.4). A package under `.../internal/...` is importable **only** by code rooted at `internal/`'s parent. Cross-module imports fail to build:

```text
use of internal package github.com/you/modname/internal/auth not allowed
```

That makes `internal/` real access control: you can refactor anything under it without breaking external users, because there are none. `pkg/`, by contrast, enforces nothing.

```text
DON'T:  module/pkg/auth/auth.go     // exported to the world; +4 chars per import; no benefit
DO:     module/internal/auth/auth.go // app-private, refactor-free
DO:     module/auth/auth.go          // genuinely importable library API → at the root, not under pkg/
```

Why `pkg/` is an anti-pattern for ~most projects (Bendersky, Brad Fitzpatrick): the stdlib dropped its own `pkg/` in Go 1.4; the community cargo-culted it from early Kubernetes-era repos. Roughly 90% of projects need no separate package directory at all; of those that do, most should use `internal/`. If a top-level application exposes importable packages, they should be **split into their own small, self-contained modules**, not parked under `pkg/` in the app repo. Use `pkg/` only as a deliberate namespace tier you can justify, knowing it is convention, not Go guidance.

The `golang-standards/project-layout` debate is settled at the source: the repo's README states *"This is NOT an official standard defined by the core Go dev team."* Russ Cox (issue #117): *"the vast majority of packages in the Go ecosystem do not put the importable packages in a pkg subdirectory… It is unfortunate that this is being put forth as 'golang-standards' when it really is not."* Treat it as one person's opinion. When someone says "you're not using the standard layout," the correct rebuttal is: there isn't one. There's `go.dev/doc/modules/layout`.

---

## Package naming {#naming}

**Name by what the package PROVIDES, not what it CONTAINS.** The Go blog's package-naming guidance: if you can't find a name that is a meaningful *prefix* for its exported identifiers, the boundary is probably wrong. It explicitly calls out `util`, `common`, `misc`; Google's style guide adds `helper`, `model`, `base`. These accrete unrelated dependencies and become god packages.

```text
DON'T (grab-bags, layer names):           DO (capability names):
  util/ common/ helpers/ base/              auth/        // authn/authz
  models/ services/ controllers/            billing/     // billing domain
  interfaces/ dto/                          postgres/    // a PostgreSQL impl
                                            smtp/        // email via SMTP
```

Avoid **stutter**: the name is part of the identifier at the call site, so `chubby.ChubbyFile` → `chubby.File`, `http.HTTPServer` → `http.Server`. Names are short, lowercase, no underscore characters, no plurals-as-grab-bags.

**Honest nuance:** the *official* layout doc's own server example uses a package named `model/`. So "never name a package `model`" is a strong heuristic, not an absolute: a cohesive domain-model package is fine; a `model/` that's just "all the structs, organized by layer" is the anti-pattern. The smell is layer-naming, not the word.

---

## Interface placement & "accept interfaces, return structs" {#interfaces}

**Define interfaces in the package that USES them, not the one that implements them.** Go's structural typing means an implementer satisfies an interface *without importing it*, so the consumer owns the contract. Peter Bourgon: *"interfaces are consumer contracts, not producer contracts, so, as a rule, we should be defining them at callsites in consuming code."* Don't pre-declare an interface before a consumer needs it, and keep it to the methods that consumer calls.

```go
// internal/order/service.go — the CONSUMER declares exactly what it needs
package order

type Store interface {
    Save(ctx context.Context, o Order) error      // narrow: only what Service uses
}

type Service struct{ store Store }
func NewService(s Store) *Service                  { return &Service{store: s} }
func (s *Service) Place(ctx context.Context, o Order) error { return s.store.Save(ctx, o) }

// internal/platform/postgres/order.go — the PRODUCER imports nothing of order's contract
package postgres

type OrderStore struct{ pool *pgxpool.Pool }
func NewOrderStore(p *pgxpool.Pool) *OrderStore                       { return &OrderStore{p} } // returns a STRUCT
func (s *OrderStore) Save(ctx context.Context, o order.Order) error  { /* ... */ return nil }
```

```go
// WRONG — producer-side interface, "I"-prefix, Java-in-Go
package repositories
type IOrderRepository interface { Save(o Order) error } // forces consumers to import this package
```

**"Accept interfaces, return structs":** parameters are interfaces (callers swap implementations, tests pass fakes); return values are concrete (callers get the full type, full docs, full method set, no premature narrowing). Returning an interface erases capability and complicates `nil` checks. Exceptions exist (factories that genuinely return one of several impls, `error`), but make them deliberate.

---

## Dependency injection: manual vs Wire vs fx/dig vs do {#di}

**The idiomatic default is manual constructor wiring in `main`.** Constructors are plain functions; you call them in order. Both Wire and Fx are explicitly *built around ordinary Go constructor functions*: they consume the same shape you'd write by hand, which is the tell that manual is the baseline and frameworks are escalation tools.

```go
// RIGHT — explicit, compile-time-checked, greppable, debuggable, zero deps
func main() {
    cfg  := config.Load()
    db   := store.NewDB(cfg.DSN)
    repo := user.NewRepository(db)
    svc  := user.NewService(repo)
    srv  := api.NewServer(svc, cfg.Addr)
    log.Fatal(srv.Run())
}
```

```go
// WRONG — hidden global + init(): unordered, untestable, ignored error
var globalStore *Store
func init() { globalStore, _ = NewStore(loadConfig()) }       // hidden startup, swallowed err
func NewHandler() *Handler { return &Handler{Store: globalStore} } // service-locator smell
```

**Escalate only on evidence.** Rough trigger: when `main`'s wiring is a large, churning, *static* graph (~50-100+ lines of tedious plumbing), then weigh a container. Pushing fx/dig onto a small/medium service "because DI is best practice" is over-engineering.

### Compile-time DI: `google/wire` (and its fork)
Providers collected in `wire.NewSet`; an injector stub calls `wire.Build`; the `wire` tool generates `wire_gen.go` (plain Go, **no runtime reflection**, errors at generation time). **`google/wire` is archived read-only (Aug 25 2025), final tag v0.7.0**; pkg.go.dev shows "no longer maintained." Existing setups are safe; **don't start new projects on it**.

```go
//go:build wireinject

func InitializeApp(cfg Config) (*App, error) {
    wire.Build(NewDB, NewUserRepo, NewUserService, NewApp)
    return nil, nil // wire generates the body
}
```

- API trap: passing a **struct value directly** to `wire.NewSet(Svc{})` is *deprecated*: use `wire.Struct(new(Svc), "*")` (or named fields). Core surface: `Build`, `NewSet`, `Bind`, `Value`, `InterfaceValue`, `Struct`, `FieldsOf`; providers may add an optional `func()` cleanup and trailing `error`, and the injector signature must match.
- Maintained fork: `github.com/goforj/wire` (v1.2.0, Apr 2026) is a drop-in, API-compatible fork (faster, deterministic, `wire watch`); migrate existing imports with `go mod edit -replace=github.com/google/wire=github.com/goforj/wire@latest`. **Caveat:** adoption is tiny (single-digit importers). Vet before standardizing on it. [verify: long-term maintenance]

### Runtime DI: `uber-go/dig`, `uber-go/fx`, `samber/do/v2`
- **`dig`**: reflection inspects constructor signatures to build a DAG (`dig.New`, `Provide`, `Invoke`). Its README is explicit: good for *powering a framework / resolving the graph at startup*; **bad as a service locator or for resolving deps after startup**. Errors are runtime, stack traces deep.
- **`fx`**: application framework on top of dig: `fx.Module`, `fx.Provide/Invoke`, `fx.Lifecycle` (`OnStart`/`OnStop`) for graceful start/stop. Justified at scale (many modules, cross-cutting lifecycle). Gotchas models miss: `fx.Decorate` is scoped to its deepest `fx.Module`; `fx.Private` restricts a provider to its subtree; **`fx.Supply` provides the most-specific reflected type**: to expose an interface you must `fx.Annotate(ctor, fx.As(new(Iface)))`, it won't infer it.
- **`samber/do/v2`**: generics-based, **type-safe, no reflection, no codegen** (`do.New`, `do.Provide[T]`, `do.Invoke[T]`). Health checks, graceful + dependency-aware parallel shutdown, scopes, named services. v2 is a breaking GA, notably `do.Injector` became an *interface*. A modern container alternative to dig when you want type safety without code generation.

```go
// fx: exposing a concrete type AS an interface requires fx.Annotate(..., fx.As(...))
app := fx.New(
    fx.Provide(fx.Annotate(NewSQLStore, fx.As(new(order.Store)))),
    fx.Provide(order.NewService),
    fx.Invoke(RunHTTPServer),
)
```

**Decision framework:** manual → default. Compile-time generated Go for a large static graph → Wire-style (weigh archival; consider the fork or stay manual). Long-lived service needing lifecycle + module scoping across many modules → `fx`. Type-safe container without codegen → `samber/do/v2`. Bare `dig` only when you're building framework plumbing. *The "successor to Wire" is community consensus, not an official statement: the archive notice names no replacement.*

---

## Functional-options constructors {#options}

Use options for *optional* configuration with sane defaults (especially when a constructor would otherwise sprout many params or boolean flags). Keep **required** deps as positional constructor args; options are for the long tail.

```go
type Server struct {
    addr   string
    db     *sql.DB
    logger *slog.Logger
    cache  Cache
}
type Option func(*Server)

func WithLogger(l *slog.Logger) Option { return func(s *Server) { s.logger = l } }
func WithCache(c Cache) Option         { return func(s *Server) { s.cache = c } }

func NewServer(addr string, db *sql.DB, opts ...Option) *Server { // required: addr, db
    s := &Server{addr: addr, db: db, logger: slog.Default()}      // defaults first
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

**Traps:** don't use options for *required* dependencies (a server with no `db` shouldn't be constructible). For validation/failure, an option may need to return an error: either `func(*Server) error` accumulated by the constructor, or validate after applying. Don't reach for options on a 2-field struct; a plain constructor or struct literal is clearer. Full pattern (incl. config-struct alternative): [design-patterns.md](design-patterns.md#go-specific).

---

## Config loading {#config}

Load config **once at the edge** (in `main`/composition root), validate it, then pass concrete values or a small `Config` struct *down* via constructors. Never read env vars or call a global `viper.Get` deep in business logic (that's a hidden dependency and untestable).

```go
type Config struct {
    Addr string `env:"ADDR" envDefault:":8080"`
    DSN  string `env:"DSN,required"`
}

func Load() (Config, error) {
    var c Config
    if err := env.Parse(&c); err != nil { return Config{}, fmt.Errorf("parse config: %w", err) }
    if c.DSN == "" { return Config{}, errors.New("DSN is required") } // fail fast at startup
    return c, nil
}
```

- **Precedence** (lowest→highest): defaults → file → env → flags. Validate before any goroutine starts; a misconfig should crash at boot, not at first request.
- Pass **what each consumer needs**, not the whole `Config` god-struct, which recreates a global. Library packages take their own narrow params/structs.
- `//go:embed` baked-in defaults are reproducible; secrets come from env/secret-manager, never embedded. Cobra/Viper wiring: [cli-and-config.md](cli-and-config.md).

---

## Domain-vs-transport layering & testability seams {#layering}

Separate **domain logic** (pure, testable, no I/O imports) from **transport** (HTTP/gRPC handlers) and **infrastructure** (DB/queue adapters). The seam is the consumer-defined interface (above): the domain depends on a small `Store`/`Notifier` interface; transport calls the domain; infra implements the interface. The domain imports neither transport nor infra.

```text
cmd/api  →  internal/order (domain: Service + Store interface)  →  (no infra import)
   │                 ▲
   └─ http handler   └── internal/platform/postgres implements order.Store
```

This buys the **testability seam**: unit-test `order.Service` with an in-memory fake `Store`; integration-test `postgres.OrderStore` against a real DB (or testcontainers). Handlers stay thin (decode → call service → encode). Don't pass `*http.Request` or `http.ResponseWriter` into the domain: translate at the boundary. Other seams: pass `context.Context` as the first arg (cancellation/deadlines), inject a `*slog.Logger` and a clock (`func() time.Time`) rather than calling `time.Now()` directly when behavior is time-dependent.

---

## Domain-Driven Design in Go {#ddd}

DDD/Clean/Hexagonal originate in OOP languages with heavy DI containers and inheritance; ported literally to Go they fight the language. **Use them tactically, not ceremonially.** There is **no official Go-team doctrine** endorsing DDD/Clean as the default repo shape: the official docs prescribe package-oriented organization (root → `internal/` → real importable packages → separate modules), full stop.

What works: group by *capability* (`order/`, `billing/`, `inventory/`), each package owning its entity, service, and the interfaces *it* consumes. Repository pattern is fine **when you genuinely abstract storage**: define the interface at the service, implement it in an infra adapter. For plain CRUD it's needless ceremony.

```text
internal/
├── order/                 # capability package (NOT a layer)
│   ├── order.go           # domain model + invariants
│   ├── service.go         # application service + consumer-side Store interface
│   ├── handler.go         # HTTP transport (thin)
│   └── events.go          # domain events
├── billing/
└── platform/              # infrastructure adapters
    ├── postgres/order_repo.go   # implements order.Store
    └── stripe/billing.go        # external-service adapter
```

```text
// WRONG — package-per-layer; every type just forwards to the next package
internal/{model,entity,repository,service,usecase,handler,adapter,dto}/
```

When it pays off: long-lived products with complex domains, multiple teams needing explicit boundaries, frequently-changing infra, a premium on fast isolated tests. When it's over-engineering: CRUD admin tools, prototypes, one-off integrations. Three Dots Labs (a leading Go DDD voice) concede it: *"in simple, data-oriented services, these patterns usually don't make sense."* Kubernetes, a massive Go codebase, uses a flat, functionality-oriented structure, not Clean Architecture. Apply selectively *per module*, not uniformly.

---

## Clean Architecture mapping {#clean-architecture}

If you do adopt it: Entities → domain types in a capability package; Use cases → service types; Interface adapters → handlers + repo implementations; Frameworks/Drivers → `cmd/main.go`, DB drivers, HTTP server. The dependency rule (source deps point inward) is enforced in Go by **putting interfaces on the inner/consumer side** and concrete adapters on the outer side, the same seam as everywhere in this file. A *when-is-a-boundary-worth-it?* test: it must buy at least one of: independent package docs, reduced dependency fan-in, real alternate-implementation pressure, test isolation, or stable cross-binary reuse. If not, keep the code in fewer packages (Google style guide: tightly coupled types that callers must import together usually belong together).

---

## Avoiding import cycles & god packages {#cycles}

Go **forbids import cycles at compile time**: `package a imports b imports a` won't build. This is a design forcing-function, not just an error. Fixes, in order of preference:

1. **Invert with a consumer-side interface**: the lower-level package stops importing the higher-level one; the consumer declares the contract (see [Interface placement](#interfaces)).
2. **Extract the shared types** into a third, lower-level package both can import (e.g. a small `order` types package the service and the adapter share).
3. **Merge** two packages that are genuinely one concept artificially split: a cycle often means the boundary is wrong.

**Never** break a cycle by reaching for `interface{}`/`any` or `init()` registration just to dodge the compiler. That hides the coupling. **God packages** (a `common`/`util` everything imports, or one package with 50+ files) cause slow compiles, impossible navigation, and cycle pressure: split by capability. A directory is a package: over-splitting *also* invites cycles, so the goal is *cohesive* packages, not *many* packages.

---

## Plugin architecture {#plugins}

In-process, interface-based (trusted, same-language): a contract + a concurrency-safe registry.

```go
type Plugin interface {
    Name() string
    Execute(ctx context.Context, in []byte) ([]byte, error)
    Close() error
}

type Registry struct {
    mu      sync.RWMutex
    plugins map[string]Plugin
}
func (r *Registry) Register(p Plugin)            { r.mu.Lock(); defer r.mu.Unlock(); r.plugins[p.Name()] = p }
func (r *Registry) Get(name string) (Plugin, bool) {
    r.mu.RLock(); defer r.mu.RUnlock()
    p, ok := r.plugins[name]
    return p, ok
}
```

Out-of-process (untrusted or language-agnostic): `hashicorp/go-plugin` runs each plugin as a **separate process over gRPC**: fault isolation and language independence at the cost of serialization. Prefer it over the stdlib `plugin` package, which is Linux/macOS-only, requires exact toolchain/flag matching between host and plugin, can't be unloaded, and is widely considered fragile.

---

## Code generation & the `tool` directive {#codegen}

`go generate` is intentionally narrow: **never run by `go build`/`go test`**, does *no* dependency analysis, and scans raw source for `//go:generate` comments (no space after `//`), so it can match lookalike directives inside strings/comments. It sets the `generate` build tag and exposes `$GOFILE`, `$GOLINE`, `$GOPACKAGE`. Generated files carry `// Code generated … DO NOT EDIT.`

**The major shift: the `tool` directive [1.24]** (proposal #48429). It replaces the `tools.go` blank-import hack so tool versions are pinned per-module and reproducible across the team/CI, instead of relying on whatever each dev `go install`'d globally.

```text
# WRONG (pre-1.24): tools.go blank-import + unpinned global binary
//go:build tools
package tools
import _ "golang.org/x/tools/cmd/stringer"

# RIGHT [1.24]: record a tool directive, run cached via `go tool`
go get -tool golang.org/x/tools/cmd/stringer   # adds `tool` directive + require
go tool stringer -type=Pill                     # built & cached in $GOCACHE; matches by last path segment when unique
go tool                                          # list tools
go install tool                                  # install all into GOBIN
go get tool                                       # upgrade all tools
```

```go
//go:generate go tool stringer -type=State -trimprefix=State  // contributors need no global install
type State int
const ( StateUnknown State = iota; StateReady; StateFailed )
```

Resulting `go.mod` (the `tool` meta-pattern resolves to all tools in the module; built-in tool names win on conflict, so use the full path to disambiguate):

```text
go 1.26
tool golang.org/x/tools/cmd/stringer
require golang.org/x/tools v0.47.0 // indirect
```

**Known limitations:** `go get -tool` adds tool deps to the **main** `go.mod`, mixing dev tools with app deps (same downside `tools.go` had). Workaround: a separate `-modfile=tools.go.mod` tool module. Only Go-built tools are supported (not eslint/jq). Older toolchains (≤1.23) **cannot parse `tool` directives**: the 1.27 command working group is adjusting behavior for modules that declare a `tool` directive while claiming `go 1.23` or earlier (treat as an in-flight gotcha). `stringer` itself is current (`golang.org/x/tools/cmd/stringer` v0.47.0). Adjacent: `go.mod`'s **`ignore` directive [1.25]** excludes dirs from `./...`/`all` expansion (but they're *still in the module zip*, not a privacy/packaging feature). Common generators: `sqlc`, `mockgen`, `stringer`, `buf generate`, `oapi-codegen`. **Commit generated code** (or run `go generate` in CI) so contributors build without every generator installed.

---

## Library & tooling status {#libraries}

| Item | Status [2026] | Use when / note |
|---|---|---|
| `go.dev/doc/modules/layout` | **Authoritative** | The real layout reference (start flat → `internal/` → `cmd/`) |
| `golang-standards/project-layout` | **Not official** (issue #117) | Don't cite as a standard |
| `internal/` boundary | **Compiler-enforced** [1.4] | The only structural rule; real access control |
| `tool` directive in `go.mod` | **Default** [1.24] | Supersedes `tools.go` blank imports |
| Manual constructor wiring | **Default** | Almost always; escalate only on evidence |
| `google/wire` | **Archived/unmaintained** (v0.7.0, Aug 2025) | Existing code only; don't start new projects |
| `goforj/wire` | Maintained fork (v1.2.0, Apr 2026) | Drop-in Wire successor; **tiny adoption; vet first** |
| `uber-go/fx` | Active (v1.24.0, May 2025) | Large services: lifecycle + module scoping |
| `uber-go/dig` | Active (v1.19.0, May 2025) | Framework plumbing; **not** a service locator |
| `samber/do/v2` | Active GA (v2.0.0, Sep 2025) | Type-safe container, no reflection/codegen |
| `hashicorp/go-plugin` | Active | Out-of-process gRPC plugins (untrusted/polyglot) |
| stdlib `plugin` pkg | Niche/fragile | Linux/macOS only, exact-toolchain match, no unload |
| `go doc` | **Default** | `go tool doc` was **removed [1.26]** |

---

## Version map 1.22→1.27 {#versions}

| Ver | Project-structure / tooling delta |
|---|---|
| **1.22** | range-over-int (cleaner wiring loops); `go vet` slog arg checks |
| **1.24** | **`tool` directive** in `go.mod` + `go get -tool`/`go tool` (replaces `tools.go`); `go run`/`go tool` executables cached in build cache |
| **1.25** | `go.mod` **`ignore` directive** (excludes dirs from `./...`; still zipped) |
| **1.26** | `go tool doc`/`cmd/doc` **removed** (use `go doc`); `go mod init` defaults the `go` line two minors back; `go fix` becomes the modernizer home (`//go:fix inline`) |
| **1.27 (RC, draft)** | `go mod tidy` merges duplicate `require` blocks (≤ direct+indirect) for `go 1.27`+ modules; new `go fix` modernizers (`atomictypes`, `embedlit`, `slicesbackward`, `unsafefuncs`); `waitgroup` analyzer → `waitgroupgo`; `stdversion` vet check runs under `go test` by default. Draft until GA (~Aug 2026), subject to change. |

---

## What models get wrong {#stale}

1. Citing `golang-standards/project-layout` as "the standard Go layout." It is explicitly **not** official (issue #117); cite `go.dev/doc/modules/layout`.
2. Defaulting to **`pkg/`** for importable code: anti-pattern; adds import-path noise; use `internal/` (or split a real library into its own module). Stdlib dropped `pkg/` in 1.4.
3. Recommending the **`tools.go` + `//go:build tools`** blank-import pattern: obsolete [1.24]; use the `tool` directive.
4. Recommending **`google/wire`** as a live project: archived/unmaintained since Aug 2025; flag it (the maintained fork is `goforj/wire`, but adoption is tiny).
5. Passing a **struct value to `wire.NewSet(S{})`**: deprecated; use `wire.Struct`.
6. Pushing **fx/dig as best practice**: manual constructor wiring is the idiomatic default; frameworks are for scale.
7. **Java-style layered packages** (`models`/`services`/`repositories`, `I`-prefixed interfaces, producer-defined interfaces): group by capability; define interfaces at the consumer.
8. Defining **interfaces on the implementer side**: forces consumers to import the package; put them at the call site.
9. Returning **interfaces from constructors** by default: return concrete structs; accept interfaces in params.
10. **`fx.Supply`/reflection DI inferring your interface**: it provides the most-specific concrete type; you must `fx.Annotate(..., fx.As(...))`.
11. Using **`dig` as a service locator** / resolving deps after startup: its own README calls that a bad use.
12. Naming packages **`util`/`common`/`helper`/`base`** (or `model` *as a layer*): name by capability; the smell is layer-naming.
13. Breaking **import cycles** with `any`/`init()` registration instead of inverting via a consumer interface or extracting shared types.
14. Creating **packages just to file-organize**: a directory *is* a package; over-splitting invites cycles and premature structure.
15. **`func init()` for complex/ordered setup**: hidden, untestable; wire explicitly from `main`.
16. **`go tool doc`**: removed [1.26]; use `go doc`. Assuming `go install …@latest` global binaries are the modern tooling story: prefer pinned per-module `tool` directives.
17. Reading **config (env/global Viper) deep in business logic**: load once at the edge, inject down.
18. Generating code but **not committing it** (or not running `go generate` in CI): breaks contributor/CI builds.

---

## See Also {#see-also}
- [design-patterns.md](design-patterns.md#go-specific): functional options in depth, middleware, GoF in Go
- [style-synthesis.md](style-synthesis.md): naming conventions, package organization, code review rules
- [modules-and-dependencies.md](modules-and-dependencies.md#5-workspaces-go-118): modules, `/v2` paths, `go.work` workspaces
- [ecosystem-and-tooling.md](ecosystem-and-tooling.md#project-layout): layout conventions, DI-framework comparison, CI/CD
- [cli-and-config.md](cli-and-config.md): Cobra/Viper config wiring, graceful shutdown
- [errors-and-resilience.md](errors-and-resilience.md): error types at package boundaries, `%w` as API contract

## Sources {#sources}
- go.dev/doc/modules/layout ("Organizing a Go module"); go.dev/ref/mod (`tool` directive, `go tool`); cmd/go internal-package rule
- go.dev/doc/go1.24-go1.27 release notes (`tool` directive, `ignore`, `go fix` modernizers, `go doc`); go.dev/blog/wire, go.dev/blog (package names)
- pkg.go.dev/{github.com/google/wire (v0.7.0, "no longer maintained"), github.com/goforj/wire (v1.2.0), go.uber.org/fx (v1.24.0), go.uber.org/dig (v1.19.0), github.com/samber/do/v2 (v2.0.0), golang.org/x/tools/cmd/stringer (v0.47.0)}
- Russ Cox, golang-standards/project-layout issue #117; Eli Bendersky, "Simple Go project layout with modules"; Peter Bourgon, "interfaces are consumer contracts"; Alex Edwards; Three Dots Labs (Wild Workouts / "basic CQRS in Go"); Google Go Style Guide (package names)
