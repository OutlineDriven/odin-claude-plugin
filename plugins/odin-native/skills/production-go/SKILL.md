---
name: production-go
description: 'Use when writing, reviewing, debugging, or architecting Go code. Routes by project type and topic to conventions and reference chapters, then verifies with toolchain gates and unseen behavioral tests.'
---

# Production Go

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Go code is being written, reviewed, debugged, or architected: a new service, CLI, library, or a change to any `.go` file. |
| Authority | Reversible local: writes only the Go source and project files the invoking task already touches; rollback is version-control restore. No remote mutation. |
| Side effect | Go source files may change under the invoking task; routing, conventions, and verification output go to chat. |
| Done | The code follows the conventions below, the routed references were consulted, and the verification step ran or its blocker is reported. |

## Inputs

1. The Go task (required): code to write, a diff to review, a bug to diagnose, or a design question.
2. The module root (required when it is not the current directory): supplies `go.mod` and its `go` version line.
3. The project type (optional): CLI, service, library, or other; inferred from the layout when omitted.
4. Inherited-reference boundary (note): the references' feature tags `[1.N]` and library picks come from the research horizon named in each file's verification stamp; they are not blanket-revalidated on load. Before a shipped claim leans on one, check it against the installed toolchain (`go version`) and current upstream docs.

## Procedure

1. Fix the Go baseline. The grounded pin is Go 1.27.1 (current stable, released 2026-09-01). Go maintains only the two newest major releases, so 1.26 is still supported and 1.25 is end of life. The `go` line in the module's `go.mod` is the feature ceiling: never emit a feature newer than that line, and remember that bumping it can change runtime behavior through `GODEBUG` defaults. Done when: the effective Go version is named.
2. Route the task. Match the project type and topic to the reference table below and load every file the task touches in the same turn. For a topic the table does not name, look it up in `references/index.md`, the alphabetical topic index. Done when: each relevant reference is loaded.
3. Apply the conventions. Done when: the code or review reflects each convention that applies.
   - Philosophy: clarity over cleverness; composition over inheritance; accept interfaces, return structs; make the zero value useful; errors are values; every goroutine gets a shutdown path; stdlib before third-party.
   - Project structure: start flat and add structure only when the project demands it; `cmd/` holds thin `main()` packages, `internal/` holds private code the compiler keeps unimportable, `pkg/` is optional public library surface; group by domain, never by technical layer; a directory is a package.
   - Naming: packages are short, lowercase, one word; exported identifiers are MixedCaps, unexported are mixedCaps; single-method interfaces take the `-er` suffix; getters drop the `Get` prefix; acronyms stay all-caps (`URL`, `HTTP`, `ID`); error variables are `ErrXxx`, error types are `XxxError`; `ctx context.Context` is always the first parameter.
   - Errors: check every error; wrap with `fmt.Errorf("doing X: %w", err)`; keep messages lowercase without punctuation; `log.Fatal` and `panic` do not belong in library code; wrap third-party errors with `%v` so callers are not coupled to the concrete type.
   - Concurrency: every goroutine checks `ctx.Done()`; prefer `errgroup` over a raw `sync.WaitGroup`; size channels unbuffered for synchronization, buffered 1 for signals, buffered N for known-bounded work; a panic in a goroutine kills the whole process.
   - Interfaces and structs: keep interfaces to one to three methods and define them at the use site; verify implementations with `var _ Iface = (*Impl)(nil)`; use functional options for constructors with optional config; keep receiver types consistent within a type.
   - Dependencies: wire constructors in `main()` by hand; manual DI is the default at every size. Consider a DI generator only on a documented decision, per `references/project-patterns.md` (compile-time DI): `google/wire` is archived (2025) and its maintained fork is unproven at scale.
   - Logging: `slog` is the default; log an error or return it, never both.
   - HTTP: `net/http` method patterns and path parameters cover most APIs; set `ReadTimeout`, `WriteTimeout`, and `IdleTimeout` on every server; drain and close response bodies.
   - Database: parameterize every query; set pool limits; `defer rows.Close()` and `defer tx.Rollback(ctx)`.
   - Testing: table-driven tests with subtests; run `go test -race -count=1 ./...`.
   - Generics: use them for data structures and to replace `any`; prefer a plain interface when the code only calls methods.
4. Run the review checklist. The code is not done until it is `gofmt`-clean, builds, vets, and passes `go test -race` and `golangci-lint` (v2 config schema; migrate a v1 config with `golangci-lint migrate`). Scan the anti-pattern table below and fix every row that applies. When emitting code without tool access, hold the same bar by hand: gofmt-formatted, with only the imports the code uses. Done when: every gate passes or its failure is reported.
5. Verify by the benchmark method. Grade the change the way the source's companion benchmark measured it: the Go toolchain itself (`go build`, `go vet`, `go test`, `golangci-lint`) plus a behavioral test the implementation has not seen, inside a bounded number of correction rounds, against an external baseline such as the pre-change code. This states the method, not a result; the source's published score deltas are not asserted here. Done when: the toolchain gates and the behavioral check pass, or the correction budget is spent and the residual is reported.

### Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| `_ = f()` discarding an error | Silent failure surfaces later | Handle or wrap every error |
| `go func() { ... }()` with no shutdown path | Goroutine leak | Context cancellation or `errgroup` |
| `time.Sleep` for synchronization | Flaky and racy | Channels, `sync` primitives, tickers |
| `init()` for complex setup | Hidden side effects, untestable | Explicit wiring in `main()` |
| `any` everywhere | Type safety lost | Generics or a narrow interface |
| `sync.Mutex` with no comment | Unclear what it guards | `mu sync.Mutex // guards count` |
| Global mutable state | Races, test pollution | Constructor injection |
| `log.Fatal` in library code | `os.Exit` skips defers | Return the error |
| `select {}` without `ctx.Done()` | Blocks shutdown | Add the cancellation case |
| `time.After` in a `select` loop | New timer per iteration | `time.NewTimer` plus `Reset` |
| Subtests without `t.Parallel()` | Serial CI | Add `t.Parallel()` to independent subtests |
| Library APIs without `context.Context` | Uncancellable, no deadlines | Take `ctx` first |
| Undrained `http.Response.Body` | Kills keep-alive reuse | `io.Copy(io.Discard, resp.Body)` before `Close` |

### Library defaults

| Need | Default | Note |
|---|---|---|
| HTTP router | `net/http`, `chi` | stdlib covers most APIs |
| PostgreSQL | `pgx`, `sqlc` | driver plus type-safe queries |
| Other SQL | `database/sql`, `sqlx` | any driver |
| Migrations | `golang-migrate`, `atlas` | atlas for declarative schema |
| CLI | `cobra`, `kong` | cobra is the ecosystem default |
| Config | `koanf`, `viper` | koanf is lighter |
| Logging | `slog` | stdlib |
| Testing | `testing`, `testify` | assert and mock |
| gRPC | `connectrpc.com/connect` | HTTP-compatible gRPC |
| WebSocket | `coder/websocket` | maintained successor of `nhooyr.io/websocket` |
| Concurrency | `errgroup`, `conc` | conc adds panic safety |
| Validation | `go-playground/validator` | struct tags |
| MCP and agents | `modelcontextprotocol/go-sdk`, `mark3labs/mcp-go` | official SDK plus a mature community alternative |

## References

| File | Read when |
|---|---|
| `references/index.md` | The topic is not named below; alphabetical index of 200+ topics to file and section |
| `references/concurrency.md` | Goroutines, channels, sync primitives, parallel work |
| `references/http-and-apis.md` | HTTP servers, routers, middleware, REST and gRPC APIs, WebSockets |
| `references/database.md` | SQL, ORMs, connection pools, migrations, transactions |
| `references/testing.md` | Unit tests, integration tests, benchmarks, fuzzing |
| `references/errors-and-resilience.md` | Error handling, retries, circuit breakers, graceful degradation |
| `references/performance.md` | Profiling, allocation reduction, GC tuning, benchmarking |
| `references/cli-and-config.md` | CLI frameworks, configuration, environment management |
| `references/project-patterns.md` | Project layout, DI, plugin systems, code generation |
| `references/platform-and-build.md` | Cross-compilation, Windows specifics, embedding, distribution |
| `references/security.md` | Auth, secrets, input validation, TLS, OWASP patterns |
| `references/modern-go.md` | Go 1.18 through 1.27 features, deprecated patterns, stale training habits |
| `references/advanced-patterns.md` | Generics, state machines, streaming, scheduling, AI/LLM integration |
| `references/advanced-resources.md` | Curated external resources: internals, assembly, unsafe, cgo, Raft, books, papers |
| `references/observability.md` | OpenTelemetry, tracing, metrics, structured logging, health checks |
| `references/ecosystem-and-tooling.md` | Framework comparisons, style guides, CI/CD, release management, vulnerability scanning |
| `references/internals.md` | Scheduler, garbage collector, memory model, allocator, compiler pipeline, unsafe |
| `references/networking.md` | TCP/UDP servers, deadlines, connection pooling, mTLS, Unix sockets, DNS |
| `references/mcp-and-agents.md` | MCP servers, agent frameworks, multi-agent patterns |
| `references/api-design.md` | REST naming, pagination, RFC 9457 errors, rate limiting, versioning, OpenAPI |
| `references/cgo-and-interop.md` | CGo basics, type mapping, memory across the boundary, pure Go alternatives |
| `references/design-patterns.md` | GoF patterns in Go, composition over inheritance, decision tree |
| `references/distributed-systems.md` | Raft, outbox pattern, sagas, distributed locking, idempotency, CRDTs |
| `references/cloud-native.md` | Kubernetes client-go, operators, admission webhooks, leader election |
| `references/debugging-and-diagnostics.md` | `dlv` debugger, stack traces, GODEBUG flags, profiling workflow |
| `references/style-synthesis.md` | Merged Google, Uber, and community style rules |
| `references/modules-and-dependencies.md` | go.mod operations, MVS, workspaces, GOPROXY, vendoring, monorepos |
| `references/encoding-and-serialization.md` | JSON, Protocol Buffers, MessagePack, CBOR, CSV, YAML, TOML |
| `references/wasm-and-embedded.md` | WebAssembly, WASI, TinyGo, embedded patterns |
| `references/migration-guides.md` | Idiomatic Go translations from Python, Java, TypeScript, Rust, C++ |
| `references/testing-advanced.md` | Property-based testing, contract testing, load testing, synctest |
| `references/supply-chain-security.md` | govulncheck, SBOM, SLSA, cosign, reproducible builds |
| `references/ebpf.md` | eBPF from Go with cilium/ebpf, bpf2go, kernel-level tracing |
| `references/event-driven.md` | Kafka, RabbitMQ, NATS, Watermill, dead-letter queues, delivery semantics |
| `references/data-structures-and-caching.md` | Heaps, LRU caches, singleflight, sharded maps, bloom filters, cache strategies |
| `references/ai-ml-beyond-llm.md` | ONNX inference, Gonum, vector databases, embedding pipelines |
| `references/file-io.md` | File operations, io.Reader/Writer composition, buffered I/O, streaming, fs.FS |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Module `go` line older than a needed feature | Work inside the module's ceiling, or report the required bump and its `GODEBUG` behavior risk. |
| `golangci-lint` v1 config | Migrate with `golangci-lint migrate`; the v2 schema moved formatter settings into `formatters` and renamed `linters.disable-all` to `linters.default: none`. |
| Correction budget spent | Report the residual failure with the toolchain output; do not claim the change verified. |
| Convention conflicts with the caller's contract | The caller's contract wins: reproduce required identifiers, signatures, and output formats exactly. |

## Output

Go code or review feedback that follows the conventions above, with the toolchain gate results and the behavioral check outcome, or the named blocker.
