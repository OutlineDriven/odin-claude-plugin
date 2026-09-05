# Go Ecosystem & Tooling

The `go` command *is* the build system, test runner, formatter-driver, dependency manager, and module-aware vet host: reach for an external tool only where the stdlib genuinely stops. The skill is knowing which third-party tools have become de-facto standards (`golangci-lint`, `gopls`, `delve`, `govulncheck`, `goreleaser`), which belong in **CI vs local**, and which are **legacy** (`gccgo`, GOPATH-mode, `golint`).

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes; gopls **v0.22.0**, golangci-lint **v2**, `dlv` **v1.26.1**, 2026-06. Version tags `[1.N]` mark the Go release a claim applies to. Tool versions are pinned where load-bearing.

## TL;DR: the modern deltas (read first)

- `go` is the platform. `go build/test/vet/mod/work/tool/telemetry` cover most needs with zero installs. `vet` runs automatically as part of `go test`. Don't add a Makefile to wrap one-liners.
- `go tool` [1.24] records developer tools as `tool` directives in `go.mod`: version-pinned, reproducible, no global `go install`. This replaces the `tools.go` blank-import hack. (Mechanics: [modules-and-dependencies.md](modules-and-dependencies.md#1-gomod-anatomy).)
- golangci-lint is v2 now. Config requires `version: "2"`; **formatters moved to their own `formatters:` block** (gofumpt/goimports/gci/golines are no longer "linters"). A v1 `.golangci.yml` will not run unmodified: `golangci-lint migrate` rewrites it.
- gopls has a built-in MCP server [verify: gopls `mcp` mode, v0.21+]: agents drive `go/definition`, `go/references`, diagnostics over MCP instead of shelling out to `grep`. See [mcp-and-agents.md](mcp-and-agents.md#gopls-mcp).
- The `modernize` analyzer auto-rewrites old idioms (`interface{}`→`any`, manual min/max, `for i:=0;i<n` →range-over-int) and is folding into **`go fix`** [1.26]; it ships in gopls and as a golangci-lint linter (`modernize`).
- Telemetry default is `local`, not off [1.23]. Counters are collected on-disk locally; *uploading* to telemetry.go.dev is strictly opt-in (`go telemetry on`). `gccgo` and GOPATH mode are legacy: assume gc + modules.

## Table of Contents
1. [The `go` command surface](#go-command)
2. [`go env` and machine config](#go-env)
3. [gopls: the language server](#gopls)
4. [Formatting: gofmt, goimports, gofumpt](#formatting)
5. [Linting: golangci-lint v2 & staticcheck](#linting)
6. [The modernize analyzer & `go fix`](#modernize)
7. [Debugging with `Delve`](#debugging)
8. [Vulnerability scanning (govulncheck)](#vulnerability-scanning)
9. [Code generation (stringer, mockgen, sqlc)](#codegen)
10. [Benchmark analysis (benchstat)](#benchstat)
11. [Live reload (air, reflex)](#live-reload)
12. [Release automation (GoReleaser)](#releases)
13. [Protobuf tooling (buf)](#protobuf)
14. [Telemetry & governance](#governance)
15. [Library landscape (frameworks, ORM, DI, config)](#library-landscape)
16. [Web frameworks](#web-frameworks) · [ORM/DB](#orm-database) · [CLI](#cli-frameworks) · [DI](#dependency-injection) · [Config](#configuration) · [Project layout](#project-layout)
17. [CI vs local: where each tool runs](#cicd)
18. [Docker builds](#docker)
19. [Style guides](#style-guides)
20. [Cross-references](#cross-references)
21. [Tooling status table](#status)
22. [Version map 1.22→1.27](#versions)
23. [What models get wrong](#stale)

---

## The `go` command surface {#go-command}

The single binary subsumes what is five separate tools in other ecosystems. Know the surface before reaching outward:

| Command | What it does | Note |
|---|---|---|
| `go build` / `go run` | compile / compile-and-run | `-race`, `-cover`, `-pgo=auto` [1.21] (auto-uses `default.pgo`), `-ldflags="-s -w"` to strip |
| `go test` | run tests + benchmarks + examples | **runs `go vet` first** by default; `-race`, `-fuzz`, `-bench`, `-cover`, `-shuffle=on` |
| `go vet` | bundled correctness analyzers | printf, struct tags, loopclosure, `lostcancel`, `slog` kv pairs [1.22] |
| `go mod` | module/dependency management | `tidy`, `download`, `verify`, `why`, `graph`, `edit` |
| `go work` | multi-module workspaces [1.18] | `go.work` for local cross-module dev without `replace` |
| `go tool` | run module-pinned tools [1.24] | `go tool <name>`; add via `go get -tool`; replaces `tools.go` |
| `go telemetry` | toolchain telemetry mode [1.23] | `local` (default) / `on` / `off` |
| `go generate` | run `//go:generate` directives | not run by `build`; invoke explicitly (CI step) |
| `go env` | read/write persistent config | `go env -w KEY=val` writes to the env file |

`go vet` is not optional and not a linter: it is a correctness checker the team already runs for you inside `go test`. Treat its output as build errors. It does **not** check style; that's [formatting](#formatting)/[linting](#linting).

```bash
# WRONG — re-running vet separately when test already did it, and ignoring -race in CI
go vet ./... && go test ./...

# RIGHT — race + coverage + shuffle; vet is implied by `go test`
go test -race -shuffle=on -coverprofile=cover.out ./...
go build ./...   # the only thing test doesn't do is produce the artifact
```

`gccgo` and GOPATH mode are legacy. The gc toolchain + modules is the baseline; `GO111MODULE` is gone as a concern on `[1.16]+`. Don't emit `GOPATH`-era advice (no `$GOPATH/src`, no `dep`/`glide`).

---

## `go env` and machine config {#go-env}

`go env -w` persists settings to a per-user env file (`go env GOENV` shows its path) so they survive shells: better than exporting in `.zshrc`, and scoped to the Go toolchain.

```bash
go env -w GOFLAGS=-mod=readonly         # fail instead of silently editing go.mod
go env -w GOTOOLCHAIN=auto              # [1.21] auto-download the go.mod-pinned toolchain
go env -w GOPRIVATE=github.com/acme/*   # bypass proxy+sumdb for private modules
go env GOMODCACHE GOCACHE               # where modules & build cache live (for CI caching)
```

Traps: `go env -w` does **not** override a real environment variable already set in the shell (the exported value wins). `GOTOOLCHAIN=local` pins to the installed toolchain and refuses auto-download: useful in hermetic CI, surprising on a laptop. Private-module auth, `GONOSUMCHECK`, and `GOPRIVATE` details live in [modules-and-dependencies.md](modules-and-dependencies.md#6-private-modules).

---

## gopls: the language server {#gopls}

`gopls` (v0.22.0) is the official LSP server, maintained by the Go team: it powers completion, go-to-definition, refactoring, and inline diagnostics in every editor. It is **not** something you invoke directly; your editor manages it. Install/update with `go install golang.org/x/tools/gopls@latest`.

- It runs analyzers live: the same `vet` checks plus gopls-only ones (`unusedparams`, `fillstruct`, `unusedfunc`, `modernize`). Diagnostics you see in-editor are often *ahead* of CI.
- MCP mode [verify]: recent gopls exposes its index over the Model Context Protocol so an agent can ask for definitions/references/diagnostics structurally instead of regex-grepping a tree. This is the right substrate for Go-aware agents: details and setup in [mcp-and-agents.md](mcp-and-agents.md#gopls-mcp).
- It participates in [telemetry](#governance) (the editor opt-in prompt comes from gopls).

Don't confuse gopls (interactive, editor-facing) with `golangci-lint` (batch, CI-facing): they overlap on analyzers but serve different moments. Debugger integration (DAP) is [`Delve`](#debugging), surfaced through gopls-adjacent editor plugins.

---

## Formatting: gofmt, goimports, gofumpt {#formatting}

Formatting in Go is **not a debate**: there is one canonical format and it is enforced by tooling, not reviewers. The ladder:

| Tool | Adds over the previous | Where it lives in v2 |
|---|---|---|
| **`gofmt`** | the canonical format (ships with Go) | baseline; always applied |
| **`goimports`** | adds/removes/groups imports | `formatters: [goimports]` |
| **`gofumpt`** | a stricter superset of gofmt (extra rules, no config knobs) | `formatters: [gofumpt]` |
| **`gci`** | deterministic, configurable import grouping (std / 3rd-party / local) | `formatters: [gci]` |

```bash
gofmt -l .          # list files that aren't formatted (CI gate: must be empty)
gofmt -w .          # rewrite in place
```

DO pick gofumpt for new projects (it is gofmt-compatible, just stricter) and run it via golangci-lint's `formatters` block so it's one config. **DON'T** add formatting *linters* that fight the formatter, hand-format, or argue line length in review: `gofmt`/`gofumpt` win by construction. Style *rationale* (naming, declaration grouping, doc comments: the parts a formatter can't enforce) is synthesized in [style-synthesis.md](style-synthesis.md).

---

## Linting: golangci-lint v2 & staticcheck {#linting}

`golangci-lint` is the de-facto meta-linter: it runs dozens of analyzers in parallel with shared type-checking and caching, so a hundred linters cost roughly one parse. v2 is the current major and **changed the config contract**.

```yaml
# .golangci.yml — v2. The version key is mandatory; omit it and v2 refuses to run.
version: "2"
linters:
  default: standard            # standard | all | none | fast
  enable:
    - errcheck                 # unchecked errors (in `standard`)
    - govet                    # the vet analyzers
    - staticcheck              # 150+ deep checks, incl. former gosimple/stylecheck
    - ineffassign
    - unused
    - errorlint                # %w / errors.Is misuse  → errors-and-resilience.md
    - bodyclose                # unclosed HTTP response bodies
    - sqlclosecheck            # unclosed rows
    - gosec                    # security: SQLi, weak crypto, hardcoded creds
    - misspell
    - modernize                # auto-modernizing rewrites (see below)
  settings:
    staticcheck:
      checks: ["all"]
formatters:                    # v2: formatters are SEPARATE from linters
  enable: [gofumpt, goimports]
```

```bash
golangci-lint run ./...        # lint
golangci-lint fmt              # apply the `formatters` block (v2)
golangci-lint migrate          # rewrite a v1 config to v2 (comments are NOT carried over)
```

`staticcheck` is the crown jewel and is bundled inside golangci-lint: in v2 it also absorbs the old `gosimple` (S-prefixed) and `stylecheck` (ST-prefixed) checks, so you no longer enable those separately. Run it standalone (`staticcheck ./...`) only outside a golangci-lint setup.

```yaml
# WRONG — v1-era config; v2 errors out ("missing version") and gofumpt isn't a linter anymore
linters:
  enable: [gofumpt, gosimple, stylecheck, golint]

# RIGHT — v2: version pinned, formatters split out, deprecated linters dropped
version: "2"
linters: { enable: [staticcheck, govet, errcheck] }
formatters: { enable: [gofumpt] }
```

Pin the golangci-lint version in CI: its default linter set evolves between releases, so an unpinned `@latest` makes CI non-reproducible (new linters = new failures on unchanged code). `golint` is **archived** (use `revive` if you want a configurable style linter, or just `staticcheck`); standalone `errcheck`/`gosimple` are redundant with the bundle.

---

## The modernize analyzer & `go fix` {#modernize}

`modernize` (from `golang.org/x/tools/go/analysis/passes/modernize`, shipped in gopls) flags and **auto-fixes** code that predates newer Go idioms: `interface{}`→`any`, manual min/max helpers→builtin `min`/`max` [1.21], C-style counting loops→`for range n` [1.22], `errors.As(err,&x)`→`errors.AsType[T]` [1.26], `sort.Slice`→`slices.Sort`, and more.

```bash
# Apply modernizers across the module (the standalone cmd is deprecated in favor of `go fix`):
go run golang.org/x/tools/go/analysis/passes/modernize/cmd/modernize@latest -fix ./...
```

The Go team is folding the modernizer suite into **`go fix`** [1.26] (issue 71859), so `go fix ./...` will become the front door and the standalone command is on its way out. Until then, run it via gopls (editor "quick fix"), the standalone command above, or the `modernize` linter in golangci-lint. **DON'T** run `-fix` on a dirty working tree: review the diff; an aggressive rewrite can touch hundreds of files at once.

---

## Debugging with `Delve` {#debugging}

`Delve` (`dlv`, v1.26.1) is the Go debugger: `gdb` does not understand goroutines, the Go runtime, or modern DWARF and is not recommended. `Delve` speaks DAP, so it backs the debugger in every major editor.

```bash
dlv debug ./cmd/server          # build with -gcflags="all=-N -l" and start a session
dlv test ./pkg/foo -- -test.run TestX   # debug a specific test
dlv attach <pid>                # attach to a running process
dlv exec ./bin/server          # debug an already-built binary
```

`Delve` disables inlining/optimization for fidelity; use `dlv` (not raw `gdb`) and capture goroutine dumps with `goroutines -t`. **Full launch recipes, breakpoint syntax, remote/headless debugging, and reading stack traces are in [debugging-and-diagnostics.md](debugging-and-diagnostics.md#dlv).** Runtime knobs (`GODEBUG`, `GOTRACEBACK`) and the race detector also live there. `Delve` is one of the Go-team-blessed telemetry dependencies, so it shares the [telemetry](#governance) plumbing.

---

## Vulnerability scanning (govulncheck) {#vulnerability-scanning}

`govulncheck` is the official supply-chain scanner. Its differentiator vs manifest scanners (`npm audit`, `pip-audit`): **call-graph analysis**: it reports a CVE only if your code can actually reach the vulnerable symbol, slashing false positives.

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...               # source mode: precise, call-graph aware
govulncheck -mode=binary ./app  # scan a built binary (no source needed)
```

Make it a CI gate. Data comes from the Go Vulnerability Database (vuln.go.dev), backed by NVD + GitHub advisories. **Provenance, SBOM, license auditing, and dependency policy are out of scope here**: see [supply-chain-security.md](supply-chain-security.md#govulncheck) for the canonical, deeper treatment.

---

## Code generation (stringer, mockgen, sqlc) {#codegen}

Go's answer to macros is **code generation driven by `//go:generate`** comments + checked-in output. The output is real Go you can read and debug: no runtime reflection, no magic. Pin generators with `go tool` [1.24] so the version is reproducible.

| Tool | Generates | Trigger |
|---|---|---|
| **stringer** (`golang.org/x/tools/cmd/stringer`) | `String()` for int-enum types | `//go:generate stringer -type=Status` |
| **mockgen** (`go.uber.org/mock`) | interface mocks for tests | `//go:generate mockgen -source=repo.go` |
| **sqlc** | type-safe Go from raw SQL + schema | `sqlc generate` (config: `sqlc.yaml`) |
| **protoc-gen-go** / **buf** | Go structs + gRPC stubs from `.proto` | [buf](#protobuf) |
| **oapi-codegen** | server/client from an OpenAPI spec | see [api-design.md](api-design.md#openapi-codegen) |

```go
//go:generate go tool stringer -type=Pill
type Pill int
const ( Placebo Pill = iota; Aspirin; Ibuprofen )
```

```bash
go generate ./...   # NOT run by `go build`; run it explicitly and commit the output
```

`go.uber.org/mock` is the maintained mock generator: the original `github.com/golang/mock` is archived; don't start there. **DON'T** `.gitignore` generated files (it breaks `go build` for anyone who hasn't run `generate`); **DO** check them in and add a CI step that re-runs `go generate` and fails on a dirty diff (proves the committed output is current). For `sqlc` vs ORMs see [database.md](database.md); generation patterns in [project-patterns.md](project-patterns.md#codegen).

---

## Benchmark analysis (benchstat) {#benchstat}

A single `go test -bench` run is **noise**. `benchstat` (`golang.org/x/perf/cmd/benchstat`) runs statistics over repeated samples and reports deltas with a significance test: the only credible way to claim "X% faster."

```bash
go test -bench=. -count=10 -benchmem ./... > old.txt
# ...make the change...
go test -bench=. -count=10 -benchmem ./... > new.txt
benchstat old.txt new.txt       # shows mean, variation, and a p-value per benchmark
```

Never report a one-shot benchmark number. `-count=10` (or more) feeds benchstat the samples it needs; a "p=0.3" delta is not a real improvement. Benchmarking *methodology*: pinning CPU frequency, `b.ResetTimer`, avoiding dead-code elimination, PGO: is in [performance.md](performance.md#benchmarking); writing the benchmarks themselves in [testing.md](testing.md#benchmarks).

---

## Live reload (air, reflex) {#live-reload}

For the edit-save-see-it-running loop on a web service, a file watcher that rebuilds + restarts beats Ctrl-C/`go run` by hand.

| Tool | Style | Note |
|---|---|---|
| **air** (`air-verse/air`) | config-file watcher, rebuild+rerun | most popular; `.air.toml`, build-error display |
| **reflex** (`cespare/reflex`) | generic regex-triggered command runner | not Go-specific; `reflex -r '\.go$' -- go run .` |
| **wgo** / **watchexec** | minimal watchers | lighter alternatives |

These are **local-only dev conveniences**: never a build dependency, never in CI, never in a container image or `go.mod` `tool` directive. They belong in your dev shell only.

---

## Release automation (GoReleaser) {#releases}

GoReleaser is the de-facto release tool for shipping Go binaries: cross-compile the OS/arch matrix, archive, generate changelogs from git, sign (checksums/cosign), and publish to GitHub/GitLab releases, Homebrew taps, Scoop, and container registries: all from one `.goreleaser.yaml`, typically in a tag-triggered CI job.

```bash
goreleaser release --clean      # full release on a new tag (CI)
goreleaser build --snapshot --clean   # local dry-run, no publish
```

Rule of thumb: distributing a CLI or binary to users → GoReleaser. It is **not** for library modules (those are consumed via `go get`, no build artifact). The build/cross-compile mechanics it wraps (GOOS/GOARCH, `ko` for containers, ldflags) are detailed in [platform-and-build.md](platform-and-build.md#releases): this entry is the "which tool and why."

---

## Protobuf tooling (buf) {#protobuf}

For Protocol Buffers and gRPC, **`buf` is the modern toolchain** over raw `protoc`: a `buf.yaml`/`buf.gen.yaml` config, a managed plugin pipeline (no fragile `protoc --go_out=...` invocations), built-in **lint** and **breaking-change detection**, and a schema registry (BSR) for sharing.

```bash
buf lint                 # style + correctness on .proto
buf breaking --against '.git#branch=main'   # block wire-incompatible changes in CI
buf generate             # run configured plugins (protoc-gen-go, -go-grpc, connect)
```

DON'T hand-maintain long `protoc` command lines or skip breaking-change checks on a published API. `buf` plus `protoc-gen-go`/`protoc-gen-go-grpc` (or ConnectRPC) is the current default; usage and the gRPC side are in [encoding-and-serialization.md](encoding-and-serialization.md#protobuf) and [http-and-apis.md](http-and-apis.md#grpc).

---

## Telemetry & governance {#governance}

Go toolchain telemetry [1.23] collects counters about the toolchain's own reliability/usage (crashes, latency buckets): only for Go-team tools (`go`, `gopls`, `govulncheck`, `Delve`). The default mode is **`local`**: data is written to an on-disk file and **never leaves the machine**. Uploading an approved subset to telemetry.go.dev is **opt-in**.

```bash
go telemetry            # show current mode
go telemetry on         # opt IN to uploading approved counters
go telemetry off        # disable everything, including local collection
go telemetry local      # default: collect locally, upload nothing
```

It does **not** collect source code, file names, or user inputs: stack counters carry only Go-tool function names/line numbers. Don't conflate it with application observability ([observability.md](observability.md)): this is telemetry *about the toolchain*, not your service.

| Topic | Reference |
|---|---|
| Proposal process | https://github.com/golang/proposal |
| Backward-compatibility promise (Go 1) | https://go.dev/doc/go1compat |
| Toolchain telemetry | https://go.dev/doc/telemetry |

---

## Library landscape (frameworks, ORM, DI, config) {#library-landscape}

Default to the stdlib; reach out deliberately. These are starting points, not mandates: *never* a blanket "don't use library X." A wrong framework choice costs migration-months, so bias toward `net/http` + stdlib until a concrete need justifies more. (Each area below is canonical in another file; here is just the default + the "how to choose" line.)

Web frameworks {#web-frameworks}: Default to **`net/http` + `chi`**; the [1.22] router added method/wildcard patterns, so "pick a framework on day one" is stale. **Gin** for the largest ecosystem, **Echo** for structured middleware. **Fiber** is fast but built on **fasthttp**, not `net/http`, so `http.Handler` middleware doesn't compose (choose eyes-open). Patterns: [http-and-apis.md](http-and-apis.md).

ORM / DB access {#orm-database}: Default **`database/sql` + `pgx`** (control, pooling, `COPY`). **sqlc** when you're SQL-fluent and want type-safe Go with zero ORM overhead; **sqlx** for lightweight scanning; **Ent** for large graph-relational codebases; **GORM** for fast code-first prototyping (reflection cost). Drivers/pooling/tx: [database.md](database.md); sqlc wiring: [#codegen](#codegen).

CLI frameworks {#cli-frameworks}: **Cobra** for multi-subcommand CLIs (kubectl/helm lineage, completions); **urfave/cli** for simpler ones; **kong** for struct-tag definitions; **bubbletea** for interactive TUIs. Patterns + graceful shutdown: [cli-and-config.md](cli-and-config.md#cobra).

Dependency injection {#dependency-injection}: **Manual DI** (constructors + functional options) almost always. **Wire** (google/wire) for compile-time generated wiring once boilerplate hurts; **dig/fx** (uber-go) for runtime DI + lifecycle hooks in large services. Patterns: [project-patterns.md](project-patterns.md#di).

Configuration {#configuration}: **`koanf`** (modular providers, no forced key-lowercasing, lean deps); **envconfig** for pure env-to-struct; **Viper** only if you want its Cobra integration (it lowercases keys, can break case-sensitive specs). Patterns: [cli-and-config.md](cli-and-config.md#configuration).

Project layout {#project-layout}: Start with one `main.go` + `go.mod`; add structure only when it earns its keep. `/cmd/<app>/` for entry points, `/internal/` for compiler-enforced privacy, package **by domain not by layer**. Follow the official module layout (https://go.dev/doc/modules/layout): `golang-standards/project-layout` is **not** official. Full treatment: [project-patterns.md](project-patterns.md#package-design).

---

## CI vs local: where each tool runs {#cicd}

The single highest-signal distinction in Go tooling: **which tools gate merges (CI) vs which speed up your inner loop (local).**

| Tool | CI (gate) | Local (inner loop) | Note |
|---|---|---|---|
| `go build ./...` | yes | yes | catches compile breaks across all packages |
| `go test -race -shuffle=on` | yes | yes (subset) | `-race` mandatory in CI; runs `vet` for free |
| `gofmt -l .` / `golangci-lint fmt` | yes (fail if non-empty) | on save (editor) | formatting is a gate, not a suggestion |
| `golangci-lint run` | yes (pinned version) | optional | pin the version for reproducibility |
| `govulncheck ./...` | yes | occasional | known-CVE gate |
| `go generate` + dirty-diff check | yes | when editing generators | proves committed output is current |
| `gopls` | no | always | editor-only, interactive |
| **`Delve`** | no | when debugging | never in CI |
| **air/reflex** | **no** | always (dev server) | never in CI or images |
| GoReleaser | yes (tag job) | snapshot dry-run | release pipeline only |

```yaml
# Canonical GitHub Actions sequence (cache GOMODCACHE + GOCACHE between runs):
- uses: actions/setup-go@v5            # version per actions/setup-go [verify]
- run: go build ./...
- run: go test -race -shuffle=on -coverprofile=cover.out ./...
- run: gofmt -l . | tee /dev/stderr | (! read)   # fail if any file is unformatted
- run: golangci-lint run ./...         # pin golangci-lint version in the workflow
- run: govulncheck ./...
```

DON'T put interactive tools (gopls, dlv, air) in CI, and **DON'T** leave golangci-lint unpinned: its default linters drift and break unchanged code. **DO** cache `GOMODCACHE` and `GOCACHE` (massive speedup) and run independent jobs in parallel.

---

## Docker builds {#docker}

Multi-stage build + a `CGO_ENABLED=0` static binary on a distroless/scratch base is the canonical Go container: sub-20 MB images, minimal attack surface.

```dockerfile
FROM golang:1.26-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12   # ~2 MiB, no shell, nonroot variant available
COPY --from=build /out/server /server
ENTRYPOINT ["/server"]                    # vector form — distroless has no shell
```

Key points: `CGO_ENABLED=0` → fully static (required for `scratch`/distroless); `-ldflags="-s -w"` strips debug info (smaller binary, but breaks `Delve` symbol resolution: don't ship stripped if you debug in prod); **pin the Go image tag** (`golang:1.26-bookworm`, never `:latest`) for reproducible builds; copy only the binary into the runtime stage. Cross-compile/build internals: [platform-and-build.md](platform-and-build.md#docker).

---

## Style guides {#style-guides}

| Guide | Use for |
|---|---|
| **Effective Go** (go.dev/doc/effective_go) | Idiom foundations, but predates modules/generics; supplement it. |
| **Google Go Style Guide** (google.github.io/styleguide/go) | The most comprehensive public guide, with rationale per rule. |
| **Uber Go Style Guide** (github.com/uber-go/guide) | Production-focused: interfaces, mutexes, goroutine lifecycle, functional options. |

These cover the judgment a formatter can't enforce (naming, package design, when-to-interface). A synthesized, deduplicated view across all three is in [style-synthesis.md](style-synthesis.md), which also holds error-message and declaration conventions. Code-review standards flow from these guides.

---

## Cross-references {#cross-references}

| Topic | Lives in |
|---|---|
| Module mechanics, `tool` directive, `go.sum` | [modules-and-dependencies.md](modules-and-dependencies.md) |
| `Delve` recipes, GODEBUG, race detector, stack traces | [debugging-and-diagnostics.md](debugging-and-diagnostics.md) |
| Style/formatting rationale, naming, error style | [style-synthesis.md](style-synthesis.md) |
| gopls MCP, Go agents | [mcp-and-agents.md](mcp-and-agents.md#gopls-mcp) |
| Benchmarking methodology, profiling, PGO | [performance.md](performance.md#benchmarking) |
| Vulnerability/SBOM/provenance, dependency policy | [supply-chain-security.md](supply-chain-security.md) |
| Cross-compile, Windows, `go:embed`, releases | [platform-and-build.md](platform-and-build.md) |
| Project layout, codegen patterns, DI, DDD | [project-patterns.md](project-patterns.md) |
| CLI + config patterns, graceful shutdown | [cli-and-config.md](cli-and-config.md) |

---

## Tooling status table {#status}

| Tool | Status [2026] | Use when |
|---|---|---|
| `go` command (`build`/`test`/`vet`/`mod`/`work`/`tool`) | **Default** | Always: it's the platform |
| `gopls` v0.22.x | **Default** (Go team) | Editor LSP; agent MCP backend |
| `golangci-lint` v2 | **De-facto standard** | CI lint gate (pin the version) |
| `staticcheck` | **Default**, bundled in golangci-lint | Deep static analysis (incl. ex-gosimple/stylecheck) |
| `gofumpt` | Active, stricter gofmt | New projects' formatter (via golangci-lint `formatters`) |
| `modernize` | Active; folding into `go fix` [1.26] | Auto-migrate to modern idioms |
| `govulncheck` | **Default** (Go team) | CVE gate, call-graph aware |
| `delve` (dlv) v1.26.x | **Default** debugger | Interactive debugging; `gdb` is not recommended |
| `go.uber.org/mock` (mockgen) | Active | Interface mocks (golang/mock is archived) |
| `sqlc` / `stringer` | Active | SQL→Go / enum `String()` codegen |
| `benchstat` | **Default** (Go team) | Statistical benchmark comparison |
| `air` / `reflex` | Active | Local-only live reload (never CI) |
| `goreleaser` | **De-facto standard** | Binary/CLI release automation |
| `buf` | **De-facto standard** | Protobuf/gRPC build, lint, breaking checks |
| `koanf` | Recommended | Config (lean, spec-compliant keys) |
| `gccgo` / GOPATH mode | **Legacy** | Never for new code: assume gc + modules |
| `golint` / standalone `gosimple` | **Archived/redundant** | Use `staticcheck`/`revive` instead |
| `github.com/golang/mock` | **Archived** | Use `go.uber.org/mock` |

---

## Version map 1.22→1.27 {#versions}

| Ver | Tooling-relevant |
|---|---|
| **1.22** | `net/http` enhanced router (method + wildcard patterns); `go vet` checks `slog` key/value pairs; range-over-int; `math/rand/v2` |
| **1.23** | `go telemetry` subcommand (default mode `local`, opt-in upload); generic `iter` ecosystem in `gopls` refactors; timer-leak advice obsolete |
| **1.24** | **`go tool` directive** in `go.mod` (replaces `tools.go`); `go get -tool`; `testing/synctest` experiment; FIPS toolchain mode |
| **1.25** | `go vet` flags `wg.Add` in new goroutine; `go.mod` `ignore` directive; flight recorder; container-aware `GOMAXPROCS` default |
| **1.26** | **`go fix` modernizers** (auto-migrate idioms incl. `errors.As`→`AsType`); `errors.AsType[E]`; `fmt.Errorf` alloc-parity with `errors.New`; Green Tea GC default |
| **1.27 (RC)** | Generic methods; `asynctimerchan` GODEBUG removed; `encoding/json/v2` GA. Treat as draft until GA (~Aug 2026). |

(golangci-lint **v2**, gopls **v0.22.x**, `dlv` **v1.26.x** are independent of the Go release cycle: pin them explicitly.)

---

## What models get wrong {#stale}

1. Treating `go vet` as an optional standalone step: it **runs inside `go test`**; the gap CI must add is `-race`, not a separate `vet`.
2. Emitting a v1 `.golangci.yml` (no `version:` key, `gofumpt`/`goimports` as *linters*): **v2 requires `version: "2"` and a separate `formatters:` block**; run `golangci-lint migrate`.
3. Enabling `gosimple`/`stylecheck` separately: **folded into `staticcheck`** in golangci-lint v2.
4. Recommending `golint`: **archived**; use `staticcheck` or `revive`.
5. The `tools.go` blank-import hack for pinning tools: superseded by **`go tool`** directives [1.24].
6. Recommending `gdb` for Go: use **`Delve`**; gdb doesn't understand goroutines/runtime.
7. Recommending `github.com/golang/mock`: **archived**; use `go.uber.org/mock`.
8. Reporting a single `go test -bench` number: meaningless without `-count=N` + **benchstat**.
9. Leaving `golangci-lint` **unpinned** in CI: default linters drift and break unchanged code.
10. Putting interactive tools (gopls, dlv, **air/reflex**) in CI or Docker images: local-only.
11. GOPATH-era advice (`$GOPATH/src`, `GO111MODULE`, `dep`/`glide`) or `gccgo`: **legacy**; assume gc + modules.
12. Claiming telemetry is on/uploading by default: default is **`local`** (on-disk only); upload is opt-in [1.23].
13. "You must choose a web framework on day one": `net/http` + the [1.22] router covers most routing; add `chi` for ergonomics.
14. Saying Fiber is just a faster net/http: it's on **fasthttp**, so `http.Handler` middleware doesn't compose.
15. `.gitignore`-ing generated code: breaks `go build` for fresh clones; **check it in** and CI-verify it's current.
16. Shipping `-ldflags="-s -w"` binaries you then try to debug: stripping removes the symbols `Delve` needs.

---

## See Also {#see-also}
- [modules-and-dependencies.md](modules-and-dependencies.md): `go.mod`/`go.sum`, the `tool` directive, private modules
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md): `Delve`, GODEBUG, race detector, stack traces
- [style-synthesis.md](style-synthesis.md): formatting/linting rationale, naming, error style
- [mcp-and-agents.md](mcp-and-agents.md#gopls-mcp): gopls MCP server for Go-aware agents
- [performance.md](performance.md#benchmarking): benchstat methodology, profiling
- [platform-and-build.md](platform-and-build.md) · [supply-chain-security.md](supply-chain-security.md) · [project-patterns.md](project-patterns.md)

## Sources {#sources}
- go.dev/doc/go1.22 to go1.27 release notes; go.dev/ref/mod (`tool` directive); go.dev/doc/telemetry; go.dev/doc/modules/layout
- pkg.go.dev/golang.org/x/tools/gopls (v0.22.0; `internal/mcp`, `internal/analysis/modernize`); golang.org/x/tools/go/analysis/passes/modernize (go.dev/issue/71859: `go fix`)
- golangci-lint.run/docs (v2 config: `version: "2"`, `linters`/`formatters` split, `migrate`); staticcheck.dev
- pkg.go.dev/github.com/`go-delve/delve` (v1.26.1); golang.org/x/vuln/cmd/govulncheck; golang.org/x/perf/cmd/benchstat
- goreleaser.com; buf.build/docs; go.uber.org/mock; sqlc.dev; air-verse/air; knadh/koanf
- Google Go Style Guide; Uber Go Style Guide; go.dev/doc/effective_go