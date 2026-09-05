# Go Mastery: Topic Index

> **Purpose:** When deciding WHICH reference file to load for a given query, use this index to find the right file and section. Each entry maps a topic to `file.md#section-anchor` with a brief description. Entries are alphabetical; 200+ topics covered.

---

## A

- Abstract Factory → design-patterns.md#creational (multi-family object creation)
- Adapter pattern → design-patterns.md#structural (wrapping incompatible interfaces)
- Admission webhooks → cloud-native.md#webhooks (validating/mutating K8s resources)
- Agent frameworks → mcp-and-agents.md#agent-frameworks (ADK, langchaingo, eino)
- AI/LLM SDK integration → advanced-patterns.md#ai-llm (OpenAI, Anthropic, Ollama clients)
- AI/ML beyond LLMs → ai-ml-beyond-llm.md (Gonum, Gorgonia, ONNX, vector DBs, embeddings)
- Allocation reduction → performance.md#allocation-reduction (stack alloc, pre-sizing, pooling)
- Advanced resources → advanced-resources.md (curated links: papers, books, proposals, deep-dive articles)
- API design → api-design.md (REST naming, pagination, errors, versioning)
- API versioning → api-design.md#versioning (URL path vs header vs query param)
- Arena memory → modern-go.md#arena (on hold; use sync.Pool instead)
- Assembly (Plan 9) → advanced-resources.md#3-assembly-ssa-and-compiler-optimization (pseudo-registers, calling convention)
- Atomic operations → concurrency.md#sync-primitives (sync/atomic for lock-free counters)
- Authentication (JWT) → security.md#jwt (token signing, validation, middleware)
- awesome-go → ecosystem-and-tooling.md#web-frameworks (framework and library recommendations)

## B

- Backward compatibility → api-design.md#backward-compat (safe vs breaking changes, deprecation headers)
- Backward compatibility (Go) → supply-chain-security.md#godebug (GODEBUG knobs for compat)
- Batch operations → api-design.md#bulk-operations (bulk create/update API patterns)
- Benchmarking → testing.md#benchmarks (writing benchmarks, b.ReportAllocs)
- Benchmarking methodology → performance.md#benchmarking (statistical rigor, benchstat)
- Benchmarking tools → performance.md#benchmarking (benchstat, pprof, trace)
- Binary encoding → encoding-and-serialization.md#binary (byte order, varint)
- Bloom filter → data-structures-and-caching.md#bloom-filters (probabilistic set membership, rate limiting)
- Binary protocol → networking.md#custom-protocol (length-prefixed framing)
- bpf2go → ebpf.md#bpf2go (eBPF C-to-Go code gen)
- Books about Go → advanced-resources.md (curated book list across publishers)
- Bridge pattern → design-patterns.md#structural (decoupling abstraction from implementation)
- Build tags → platform-and-build.md#build-tags (conditional compilation with //go:build)
- bufio → file-io.md#buffered-io (buffered readers/writers, reducing syscalls)
- Builder pattern → design-patterns.md#creational (step-by-step object construction)

## C

- Cache-aside pattern → data-structures-and-caching.md#caching-strategies (lazy load, singleflight dedup)
- Cache invalidation → data-structures-and-caching.md#caching-strategies (TTL, on-write, event-driven, version tag)
- Cache stampede → data-structures-and-caching.md#singleflight (singleflight prevents thundering herd)
- Caching (building blocks) → data-structures-and-caching.md (LRU, singleflight, sharded maps, weak refs, strategy patterns)
- Caching (library picks) → performance.md#caching (ristretto, groupcache, sync.Map)
- Caching (strategy patterns) → data-structures-and-caching.md#caching-strategies (cache-aside, write-through, write-behind)
- Callbacks (CGo) → cgo-and-interop.md#callbacks (//export, cgo.Handle)
- Certificate pinning → networking.md#tls (custom TLS verification)
- CGo → cgo-and-interop.md (C interop, type mapping, memory rules, callbacks)
- CGo performance → cgo-and-interop.md#performance (call overhead, batch strategies)
- Chain of responsibility → design-patterns.md#behavioral (middleware-style handler chains)
- Channel patterns → concurrency.md#channel-patterns (sizing, done, or-done, tee, direction)
- Channel sizing rules → concurrency.md#channel-patterns (0 for sync, N for known, avoid unbounded)
- Chaos engineering → testing-advanced.md#chaos-engineering (Toxiproxy, fault injection)
- CI/CD pipelines → ecosystem-and-tooling.md#cicd (GitHub Actions, recommended steps)
- Circuit breaker → errors-and-resilience.md#circuit-breaker (preventing cascade failures)
- Clean architecture → project-patterns.md#clean-architecture (domain/app/infra layers in Go)
- CLI design → cli-and-config.md (Cobra, Viper config, graceful shutdown)
- client-go → cloud-native.md#client-go (K8s typed/dynamic/discovery clients)
- Cloud-native → cloud-native.md (K8s client, operators, containers, health probes)
- Cobra → cli-and-config.md#cobra (CLI framework with subcommands)
- Code generation → project-patterns.md#codegen (go generate, stringer, enumer)
- Code review → ecosystem-and-tooling.md#style-guides (style guides with code review standards)
  - Also: style-synthesis.md (synthesized Google + Uber + Effective Go rules)
- Command pattern → design-patterns.md#behavioral (encapsulating operations as objects)
- Circular buffer → data-structures-and-caching.md#container-ring (container/ring, round-robin)
- Compiler directives → internals.md#directives (//go:noescape, //go:linkname, etc.)
- Compiler pipeline → internals.md#compiler (AST → SSA → machine code)
- Composite pattern → design-patterns.md#structural (tree structures with uniform interface)
- Concurrent map patterns → data-structures-and-caching.md#concurrent-maps (sharded map, sync.Map decision)
- Concurrency → concurrency.md (goroutines, channels, sync primitives, patterns)
- Configuration → cli-and-config.md#configuration (Viper, environment, file-based)
- Configuration libraries → ecosystem-and-tooling.md#configuration (Viper, envconfig, koanf comparison)
- Connection pooling (DB) → database.md#connection-pool (MaxOpenConns, MaxIdleConns, lifetime)
- Connection pooling (TCP) → networking.md#tcp-client (custom TCP pool implementation)
- Consensus (Raft) → distributed-systems.md#raft (hashicorp/raft, FSM, bootstrap)
- Constraint composition → advanced-patterns.md#generics (combining generic type constraints)
- Consumer patterns → event-driven.md#consumer-patterns (at-least-once, exactly-once semantics)
- container/heap → data-structures-and-caching.md#container-heap (priority queue implementation)
- container/list → data-structures-and-caching.md#container-list (doubly-linked list, LRU eviction)
- container/ring → data-structures-and-caching.md#container-ring (circular buffer, round-robin)
- Container builds → platform-and-build.md#docker (multi-stage Dockerfile, scratch/distroless)
- Container-aware GOMAXPROCS → cloud-native.md#containers (automaxprocs for cgroups)
- Context propagation → concurrency.md#context (timeout, cancel, value passing)
- Contract testing → testing-advanced.md#contract-testing (Pact consumer/provider tests)
- Contributing to Go → ecosystem-and-tooling.md#governance (proposal process, backward compat, telemetry)
- CORS / CrossOriginProtection → http-and-apis.md#cross-origin (Go 1.25+ built-in)
- CQRS → distributed-systems.md#cqrs (command-query responsibility segregation)
- Cross-compilation → platform-and-build.md#cross-compile (GOOS/GOARCH matrix)
- Cross-compilation (CGo) → cgo-and-interop.md#cross-compile (zig cc, xgo)
- Cryptography → security.md#post-quantum (X25519MLKEM768, HPKE, FIPS)
- CSRF protection → security.md#csrf (net/http.CrossOriginProtection)
- CSV → encoding-and-serialization.md#csv (encoding/csv edge cases)
- Cursor pagination → api-design.md#pagination (opaque cursor tokens)

## D

- Data structures → data-structures-and-caching.md (heap, list, ring, LRU, bloom, concurrent maps)
- Database access → database.md (drivers, pools, queries, transactions, sqlc)
- Data pipelines (ML) → ai-ml-beyond-llm.md#data-pipelines (Go ETL patterns)
- Dead letter queues → event-driven.md#dead-letter-queues (failed message routing)
- Debugging → debugging-and-diagnostics.md (`dlv`, stack traces, race detector, GODEBUG)
- Declarations → style-synthesis.md#declarations (var vs :=, grouping conventions)
- Decorator pattern → design-patterns.md#structural (wrapping with additional behavior)
- Deep learning (Gorgonia) → ai-ml-beyond-llm.md#gorgonia (tensor ops, computation graphs)
- Delivery guarantees → event-driven.md#delivery-guarantees (at-most/at-least/exactly-once)
- `dlv` debugger → debugging-and-diagnostics.md#dlv (launch commands, breakpoints, test debugging)
- Dependency auditing → supply-chain-security.md#dependency-auditing (license checking, go mod graph)
- Dependency injection → project-patterns.md#di (constructor, functional options, Wire)
- Deprecated patterns → modern-go.md#deprecated (old → modern replacements)
- Design patterns → design-patterns.md (creational, structural, behavioral, Go-specific)
- DI frameworks → ecosystem-and-tooling.md#dependency-injection (Wire, fx, dig comparison)
- Direction-restricted channels → concurrency.md#channel-patterns (chan<-, <-chan)
- Distributed locking → distributed-systems.md#distributed-locking (redsync, etcd locks)
- Distributed systems → distributed-systems.md (Raft, leader election, saga, outbox, idempotency)
- DNS resolvers → networking.md#dns (custom net.Resolver)
- Docker builds → platform-and-build.md#docker (multi-stage, scratch base, best practices)
- Docker best practices → ecosystem-and-tooling.md#docker (canonical Dockerfile)
- Documentation tools → ecosystem-and-tooling.md#cross-references (cross-reference to related files)
- Domain-driven design → project-patterns.md#ddd (aggregates, repositories, services)
- Done channel → concurrency.md#channel-patterns (signaling goroutine completion)
- Driver selection (DB) → database.md#drivers (pgx vs lib/pq, go-sql-driver)

## E

- eBPF → ebpf.md (cilium/ebpf, bpf2go, kprobe, XDP, ring buffer)
- Embedding (composition) → design-patterns.md#go-specific (struct/interface embedding)
- Embedding files → platform-and-build.md#embed (//go:embed for static assets)
- Encoding → encoding-and-serialization.md (JSON, protobuf, msgpack, gob, binary, CSV, XML)
- enhanced new(expr) → modern-go.md#type-system (Go 1.26+ new with expressions)
- Error hierarchy → errors-and-resilience.md#error-hierarchy (sentinel, typed, opaque errors)
- Error responses (RFC 9457) → api-design.md#error-responses (problem details for HTTP APIs)
- Error style → style-synthesis.md#error-style (lowercase, no punctuation, wrapping conventions)
- Error wrapping → errors-and-resilience.md#wrapping-strategy (%w, errors.Is, errors.As)
- Error-as-value → design-patterns.md#go-specific (Go's error handling philosophy)
- errors.AsType → modern-go.md#errors (Go 1.26+ generic error assertion)
- Errors and resilience → errors-and-resilience.md (hierarchy, wrapping, retry, circuit breaker)
- errgroup → concurrency.md#errgroup (parallel tasks with error collection)
- Escape analysis → internals.md#compiler (stack vs heap decisions)
- Escape analysis (practical) → performance.md#memory (common escape causes, -gcflags)
- etcd election → distributed-systems.md#leader-election (leader election with etcd)
- Event-driven architecture → event-driven.md (Kafka, RabbitMQ, NATS, Redis Streams, Watermill)
- Event sourcing → distributed-systems.md#event-sourcing (event store, aggregates, projections)

## F

- Facade pattern → design-patterns.md#structural (simplified interface to complex subsystem)
- Factory function → design-patterns.md#creational (NewXxx constructor pattern)
- Fan-out/Fan-in → concurrency.md#fan-out-fan-in (distributing and collecting work)
- File I/O → file-io.md (reading, writing, streaming, path handling, os.Root, fs.FS, fsnotify)
- File embedding → platform-and-build.md#embed (//go:embed for static assets)
  - Also: file-io.md#embed
- File streaming → file-io.md#streaming (line-by-line, chunk-by-chunk, io.Copy)
- File watching (fsnotify) → file-io.md#fsnotify (filesystem event monitoring, config reload)
- fs.FS → file-io.md#fs-fs (filesystem abstraction, testing/fstest, embed.FS)
- Functional composition (FP) → advanced-patterns.md#functional-patterns (Map, Filter, Reduce with iter.Seq)
- fentry/fexit → ebpf.md#attaching (BTF-enabled kernel function tracing)
- FIPS 140-3 → security.md#post-quantum (GOEXPERIMENT=fips140)
- Flight recorder → observability.md#runtime-diagnostics (circular trace buffer)
  - Also: debugging-and-diagnostics.md#go-tool-trace, modern-go.md#concurrency
- Formatting → style-synthesis.md#formatting (gofmt, goimports, line length)
- Function design → style-synthesis.md#function-design (parameter order, return values)
- Functional options → design-patterns.md#go-specific (WithXxx option pattern)
  - Also: project-patterns.md#di
- Fuzz testing → testing.md#fuzzing (corpus, f.Fuzz, crashers)

## G

- Garbage collector → internals.md#gc (tri-color, phases, GOGC tuning)
- GC tuning → performance.md#gc-tuning (GOGC, GOMEMLIMIT, Green Tea GC)
- Generic Result type → advanced-patterns.md#generics (Result[T] for error-or-value)
- Generic type aliases → modern-go.md#type-system (Go 1.24+ parameterized aliases)
- Generics → advanced-patterns.md#generics (constraints, self-referential, when NOT to use)
- gnet → networking.md#high-perf (event-loop networking)
- go fix → modern-go.md#tooling (Go 1.26+ automatic code modernizers)
  - Also: platform-and-build.md#go-fix
- go tool trace → debugging-and-diagnostics.md#go-tool-trace (execution tracer, latency analysis)
- go.mod anatomy → modules-and-dependencies.md#1-gomod-anatomy (require, replace, tool directives)
- go.sum → modules-and-dependencies.md#2-gosum--checksum-database (checksum verification)
- Gob → encoding-and-serialization.md#gob (Go-native binary encoding)
- GODEBUG → debugging-and-diagnostics.md#godebug (GC trace, scheduler trace)
  - Also: supply-chain-security.md#godebug
- Golden files → testing.md#golden-files (snapshot comparison testing)
- GOMAXPROCS → cloud-native.md#containers (container-aware CPU limits)
- Gonum → ai-ml-beyond-llm.md#gonum (matrices, stats, optimization)
- gopls MCP → mcp-and-agents.md#gopls-mcp (LSP-powered MCP tools)
- Goroutine leak detection → concurrency.md#goroutine-lifecycle (goleak in TestMain)
  - Also: debugging-and-diagnostics.md#symptom-guide, testing-advanced.md#goroutine-leaks
- Goroutine lifecycle → concurrency.md#goroutine-lifecycle (panic recovery, leak detection)
- Goroutine states → debugging-and-diagnostics.md#stack-traces (running, runnable, IO wait, etc.)
- GoReleaser → platform-and-build.md#releases (cross-platform release automation)
  - Also: ecosystem-and-tooling.md#releases
- GOTRACEBACK → debugging-and-diagnostics.md#stack-traces (controlling panic output)
- govulncheck → supply-chain-security.md#govulncheck (vulnerability scanning for Go modules)
- Go proposals → advanced-resources.md (design documents, accepted/declined proposals)
- Graceful degradation → errors-and-resilience.md#graceful-degradation (fallback strategies)
- Graceful shutdown → cli-and-config.md#shutdown (signal handling, context cancel)
- Green Tea GC → performance.md#gc-tuning (Go 1.26+ default GC improvement)
  - Also: modern-go.md#runtime
- gRPC / ConnectRPC → http-and-apis.md#grpc (protocol-agnostic RPC)

## H

- Heap (priority queue) → data-structures-and-caching.md#container-heap (container/heap interface)
- Health checks → observability.md#health-checks (liveness, readiness, startup probes)
  - Also: cloud-native.md#health-probes
- Heap base randomization → security.md#runtime-hardening (Go 1.26+ ASLR improvement)
- HPKE → security.md#post-quantum (hybrid public key encryption, Go 1.26+)
- HTTP client → http-and-apis.md#http-client (timeouts, transport, connection reuse)
- HTTP handler testing → testing.md#http-testing (httptest.NewRecorder, httptest.NewServer)
- HTTP security headers → security.md#http-security (HSTS, CSP, X-Frame-Options)
- HTTP server → http-and-apis.md#http-server (Go 1.22+ ServeMux enhanced routing)
- HTTP server timeouts → security.md#runtime-hardening (Read/Write/Idle timeouts)

## I

- Idempotency → distributed-systems.md#idempotency (HTTP middleware, consumer-side dedup)
- Imports and packages → style-synthesis.md#imports-packages (grouping, blank imports, dot import ban)
- Informers → cloud-native.md#client-go (K8s watch + cache pattern)
- Inlining → internals.md#compiler (compiler inlining budget, //go:noinline)
- io.Reader/Writer → file-io.md#composition (composition, adapters, streaming)
- Input validation → security.md#input-validation (allow-lists, regex, size limits)
  - Also: api-design.md#validation
- Integration tests → testing.md#integration (build tags, testcontainers)
- Interfaces → style-synthesis.md#interfaces (small, consumer-defined, accept interfaces)
  - Also: design-patterns.md#go-specific
- Internals → internals.md (scheduler, GC, memory model, allocator, compiler, unsafe, reflection)
- Iterator (iter.Seq) → advanced-patterns.md#iterators (range-over-func, custom iterators)
  - Also: design-patterns.md#behavioral, modern-go.md#iteration

## J

- Java → Go migration → migration-guides.md#java-to-go (concept map, traps, translations)
- JSON → encoding-and-serialization.md#json (struct tags, omitempty, custom marshal)
- JSON API patterns → http-and-apis.md#json-api (request/response handling)
- JSON streaming → encoding-and-serialization.md#json (json.Decoder for large payloads)
- JSON v2 → encoding-and-serialization.md#json-v2 (Go 1.25 experimental overhaul)
- JWT → security.md#jwt (token signing, claims, middleware)

## K

- Kafka → event-driven.md#kafka (segmentio/kafka-go, confluent-kafka-go)
- ko → platform-and-build.md#ko (Dockerless container builds)
- Kprobe/Kretprobe → ebpf.md#attaching (kernel function tracing)
- Kubebuilder markers → cloud-native.md#operator-dev (RBAC, webhook, CRD annotations)
- Kubernetes client → cloud-native.md#client-go (typed, dynamic, discovery)

## L

- Linked list → data-structures-and-caching.md#container-list (container/list for LRU, not general use)
- Leader election → distributed-systems.md#leader-election (etcd, PostgreSQL advisory lock)
  - Also: cloud-native.md#leader-election
- License checking → supply-chain-security.md#dependency-auditing (go-licenses, license-eye)
- Linting → ecosystem-and-tooling.md#linting (golangci-lint, staticcheck, revive)
- LLM streaming → advanced-patterns.md#streaming (SSE proxy for LLM responses)
- LRU cache → data-structures-and-caching.md#lru-cache (map + list implementation, golang-lru library)
- Load testing → testing-advanced.md#load-testing (Vegeta library + CLI)
- Loop variable capture → concurrency.md#common-bugs (fixed in Go 1.22+)

## M

- Map (functional) → advanced-patterns.md#functional-patterns (transform elements in iter.Seq pipeline)
- Map operations (eBPF) → ebpf.md#maps (CRUD, iteration, ring buffer)
- MCP protocol → mcp-and-agents.md#mcp-primitives (tools, resources, prompts)
- MCP server (mcp-go) → mcp-and-agents.md#mcp-go (community SDK)
- MCP server (official) → mcp-and-agents.md#official-sdk (Anthropic SDK)
- Memory allocator → internals.md#allocator (size classes, mcache, mcentral, mheap)
- Memory management (CGo) → cgo-and-interop.md#memory (C.malloc/C.free, Go finalizers)
- Memory model → internals.md#memory-model (happens-before, synchronized ops, data races)
- Memory profiling → performance.md#memory (heap profiles, escape analysis, -gcflags)
- MessagePack → encoding-and-serialization.md#msgpack (compact binary serialization)
- Metrics → observability.md#metrics (OTel instruments, Prometheus, cardinality rules)
- Middleware → http-and-apis.md#middleware (chaining, logging, auth, recovery)
- Migration guides → migration-guides.md (Python, Java, TypeScript/Node, Rust → Go)
- Migrations (DB) → database.md#migrations (goose, golang-migrate, atlas)
- Minimum version selection → modules-and-dependencies.md#3-minimum-version-selection-mvs (how Go picks versions)
- Mocking → testing.md#mocking (interface-based test doubles)
- Modern Go (1.21-1.26) → modern-go.md (range-over-func, generics, Green Tea GC, go fix)
- Modules → modules-and-dependencies.md (go.mod, go.sum, MVS, workspaces, vendoring)
- MongoDB → database.md#mongodb (official Go driver patterns)
- mTLS → networking.md#tls (mutual TLS configuration)
- Multi-agent patterns → mcp-and-agents.md#multi-agent (orchestration, delegation)
- Multi-error handling → errors-and-resilience.md#multi-error (errors.Join, multi-error collect)
- Multi-module monorepos → modules-and-dependencies.md#9-multi-module-monorepos (when to split modules)
- Mutex → concurrency.md#sync-primitives (sync.Mutex, sync.RWMutex patterns)

## N

- Naming → style-synthesis.md#naming (MixedCaps, short names, abbreviations)
- NATS JetStream → event-driven.md#nats-jetstream (lightweight message streaming)
- net.Conn deadlines → networking.md#deadlines (SetDeadline, SetReadDeadline; the #1 mistake)
- Networking → networking.md (TCP, UDP, TLS, DNS, Unix sockets, binary protocols, gnet)
- Numerical computing → ai-ml-beyond-llm.md#gonum (Gonum matrices, stats)

## O

- Object pool → design-patterns.md#creational (sync.Pool pattern)
- Observability → observability.md (OTel, tracing, metrics, structured logging, health checks)
- os.Root → file-io.md#os-root (directory-scoped I/O, path traversal prevention [Go 1.24+])
- Observer pattern → design-patterns.md#behavioral (event notification)
- Offset pagination → api-design.md#pagination (page/per_page params, simple cases only)
- ONNX Runtime → ai-ml-beyond-llm.md#onnx (running pre-trained models in Go)
- OpenAPI codegen → api-design.md#openapi-codegen (oapi-codegen from spec to Go)
- OpenTelemetry → observability.md#otel-setup (provider setup, exporters, shutdown)
- Operator development → cloud-native.md#operator-dev (controller-runtime, reconciler)
- Or-Done channel → concurrency.md#channel-patterns (cancellable reads)
- ORM comparison → ecosystem-and-tooling.md#orm-database (GORM, Ent, sqlc, Bun)
- Outbox pattern → distributed-systems.md#outbox (reliable event publishing via DB)
- OWASP top 10 → security.md#owasp (Go-specific mitigations)

## P

- Package design → project-patterns.md#package-design (cohesion, naming, internal/)
- Pagination → api-design.md#pagination (cursor-based vs offset-based)
- Panic recovery → concurrency.md#goroutine-lifecycle (goroutine-safe recovery)
  - Also: errors-and-resilience.md#panic-recovery
- Panic stack traces → debugging-and-diagnostics.md#stack-traces (reading anatomy, goroutine states)
- Password hashing → security.md#passwords (bcrypt, argon2id)
- Performance → performance.md (profiling, allocation, GC tuning, benchmarking, PGO)
- Priority queue → data-structures-and-caching.md#container-heap (container/heap implementation)
- PGO → performance.md#pgo (profile-guided optimization)
- Pipeline pattern → concurrency.md#pipelines (stage-chained channels)
  - Also: design-patterns.md#go-specific
- Platform and build → platform-and-build.md (cross-compile, Windows, Docker, embed, releases)
- Plugin architecture → project-patterns.md#plugins (interface-based, go-plugin gRPC)
- Pointer passing (CGo) → cgo-and-interop.md#pointer-rules (what you can/can't pass to C)
- Post-quantum crypto → security.md#post-quantum (ML-KEM, HPKE)
- pprof → observability.md#runtime-diagnostics (net/http/pprof in prod)
- Private modules → modules-and-dependencies.md#6-private-modules (GOPRIVATE, GONOSUMDB, auth)
- Process execution → cli-and-config.md#process-exec (os/exec patterns)
  - Also: platform-and-build.md#windows
- Producer patterns → event-driven.md#producer-patterns (sync/async publishing)
- Production checklist → observability.md#production-checklist (instrumentation checklist)
- Production checklist (HTTP) → http-and-apis.md#production-checklist (HTTP service launch checklist)
- Profiling workflow → performance.md#profiling-workflow (CPU → memory → block → mutex)
- Project layout → ecosystem-and-tooling.md#project-layout (layout conventions)
  - Also: project-patterns.md#package-design
- Project patterns → project-patterns.md (packages, DI, plugins, code gen, DDD, clean arch)
- Property-based testing → testing-advanced.md#property-based (rapid, invariant checking)
- Protocol Buffers → encoding-and-serialization.md#protobuf (buf.build workflow, basic usage)
- Provenance and signing → supply-chain-security.md#provenance (SLSA, Sigstore, Cosign)
- Proxy pattern → design-patterns.md#structural (lazy load, access control, caching proxy)
- Pull-style iterators → advanced-patterns.md#iterators (iter.Pull conversion)
- Pure Go alternatives (to CGo) → cgo-and-interop.md#pure-go (avoiding CGo when possible)
- Python → Go migration → migration-guides.md#python-to-go (concept map, traps, translations)

## Q

- Query patterns → database.md#queries (QueryRow, Query, prepared statements)

## R

- RabbitMQ → event-driven.md#rabbitmq (exchange types, consumer patterns)
- Race conditions → concurrency.md#common-bugs (map access, closed channel, nil channel)
- Race detector → debugging-and-diagnostics.md#race-detector (go test -race, output format, fixes)
- Raft → distributed-systems.md#raft (hashicorp/raft, FSM, bootstrap)
- Range-over-func → advanced-patterns.md#iterators (Go 1.23+ iter.Seq/Seq2)
  - Also: modern-go.md#iteration
- Rate limiting → concurrency.md#rate-limiting (token bucket, semaphore)
  - Also: api-design.md#rate-limiting (HTTP rate limit headers)
- Reconciler → cloud-native.md#operator-dev (K8s controller reconcile loop)
- Reduce (functional) → advanced-patterns.md#functional-patterns (accumulate iter.Seq into single value)
- Redis → database.md#redis (go-redis client patterns)
- Redis Streams → event-driven.md#redis-streams (lightweight event streaming)
- redsync → distributed-systems.md#distributed-locking (Redis distributed mutex)
- Reflection → internals.md#reflection (three laws, struct tags, reflect iterators)
- Release automation → platform-and-build.md#releases (GoReleaser, cross-platform builds)
- Reproducible builds → supply-chain-security.md#reproducible-builds (trimpath, build flags)
- Repository pattern → database.md#repository (interface-based DB access)
- Request validation → api-design.md#validation (struct tags, go-playground/validator)
- REST naming → api-design.md#rest-naming (URL conventions, resource naming)
- Retry → errors-and-resilience.md#retry (jitter, max attempts, exponential backoff)
- Ring buffer → data-structures-and-caching.md#container-ring (container/ring, round-robin)
- Ring buffer (eBPF) → ebpf.md#maps (kernel 5.8+ event streaming)
- Round-robin → data-structures-and-caching.md#container-ring (container/ring for server selection)
- runtime.Pinner → cgo-and-interop.md#pinner-handle (pinning Go memory for C)
- runtime/metrics → observability.md#runtime-diagnostics (Go runtime metric sampling)
- Runtime cost reference → performance.md#runtime-costs (ns/op for common operations)
- Runtime hardening → security.md#runtime-hardening (heap randomization, server timeouts)
- Rust → Go migration → migration-guides.md#rust-to-go (concept map, traps, translations)

## S

- Saga pattern → distributed-systems.md#saga (orchestration saga for distributed txns)
- Sharded map → data-structures-and-caching.md#concurrent-maps (high-contention concurrent map)
- singleflight → data-structures-and-caching.md#singleflight (cache stampede prevention)
- Sampling (traces) → observability.md#tracing (head-based, tail-based, ratio)
- SBOM → supply-chain-security.md#sbom (go version -m, Syft)
- Scheduler (GMP) → internals.md#scheduler (goroutine/machine/processor model)
- Scheduling / background jobs → advanced-patterns.md#scheduling (cron, tickers, job queues)
- Secrets management → security.md#secrets (env vars, vault, runtime/secret)
- Security → security.md (OWASP, auth, TLS, crypto, CSRF, headers, static analysis)
- Self-referential generics → advanced-patterns.md#generics (recursive type constraints)
  - Also: modern-go.md#type-system
- Semantic import versioning → modules-and-dependencies.md#4-semantic-import-versioning (v2+ path suffix)
- Sentinel behavior → design-patterns.md#go-specific (unexported interface guard)
- Serialization → encoding-and-serialization.md (JSON, protobuf, msgpack, gob, binary, CSV, XML)
- Server-Sent Events (SSE) → http-and-apis.md#sse (streaming responses)
- Service discovery → distributed-systems.md#service-discovery (Consul registration/lookup)
- ServeMux matching → http-and-apis.md#servemux-rules (precedence, wildcards, overlap)
- Singleton → design-patterns.md#creational (sync.Once / sync.OnceValue)
- Size optimization (WASM) → wasm-and-embedded.md#size-optimization (binary size reduction)
- slog → observability.md#logging (structured logging, handlers, groups)
- Snapshot testing → testing-advanced.md#snapshot-testing (cupaloy, golden snapshots)
- SQL injection prevention → security.md#sql-injection (parameterized queries)
- sqlc → database.md#sqlc (type-safe SQL code generation)
- SSE → http-and-apis.md#sse (server-sent events)
- Stack management → internals.md#stacks (segmented → contiguous, goroutine stacks)
- Stack traces → debugging-and-diagnostics.md#stack-traces (reading panic output)
- State machine → advanced-patterns.md#state-machines (type-safe with iota)
- State pattern → design-patterns.md#behavioral (runtime behavior switching)
- Static analysis → security.md#static-analysis (gosec, staticcheck, govulncheck)
- Static vs dynamic linking → cgo-and-interop.md#linking (CGO_ENABLED, musl)
- Strategy pattern → design-patterns.md#behavioral (swappable algorithm via interface)
- Streaming patterns → advanced-patterns.md#streaming (LLM SSE relay, process output)
- String optimization → performance.md#string-slice (strings.Builder, pre-alloc)
- Structured concurrency → concurrency.md#errgroup (errgroup lifecycle)
- Structured logging → observability.md#logging (slog with trace correlation)
- Style guides → style-synthesis.md (naming, errors, declarations, interfaces, formatting)
  - Also: ecosystem-and-tooling.md#style-guides (Effective Go, Google, Uber)
- Subtests → testing.md#subtests (t.Run, t.Parallel)
- Supply chain security → supply-chain-security.md (govulncheck, SBOM, reproducible builds, signing)
- sync.Map → concurrency.md#sync-primitives (append-only or key-partitioned use cases)
- sync.Once → concurrency.md#sync-primitives (one-time init)
- sync.Pool → concurrency.md#sync-primitives (temporary object recycling)
  - Also: performance.md#sync-pool
- Synctest → testing-advanced.md#synctest-patterns (deterministic concurrency testing)
  - Also: testing.md#synctest

## T

- Table-driven tests → testing.md#table-driven (test case structs, subtests)
- TCP client → networking.md#tcp-client (dial, reconnect, pooling)
- TCP server → networking.md#tcp-server (accept loop, graceful stop)
- Tee channel → concurrency.md#channel-patterns (duplicating channel output)
- Telemetry → ecosystem-and-tooling.md#governance (Go toolchain telemetry, opt-in Go 1.23+)
- Template method → design-patterns.md#behavioral (algorithm skeleton with hooks)
- Test architecture → testing-advanced.md#test-architecture (helpers, fixtures, project layout)
- Test artifacts → testing.md#artifacts (t.TempDir, cleanup)
- Test helpers → testing.md#helpers (t.Helper, assertion patterns)
- Testing → testing.md (table-driven, subtests, mocking, fuzzing, golden files, integration)
- Testing advanced → testing-advanced.md (property-based, contracts, snapshot, load, chaos)
- Ticker leak → concurrency.md#common-bugs (forgetting to stop tickers)
- Timeouts and deadlines → errors-and-resilience.md#timeouts (context.WithTimeout)
- Timer/Ticker GC → modern-go.md#iteration (Go 1.23+ auto-cleanup)
- Thundering herd → data-structures-and-caching.md#singleflight (singleflight.Do deduplication)
- TinyGo (embedded) → wasm-and-embedded.md#tinygo-embedded (microcontrollers, sensors)
- TinyGo (WASM) → wasm-and-embedded.md#tinygo-wasm (smaller WASM binaries)
- TLS → security.md#tls (TLS 1.3, cipher suites, cert loading)
  - Also: networking.md#tls
- TLS over raw TCP → networking.md#tls (manual TLS handshake)
- Tool directives → modern-go.md#tooling (go.mod tool directive, Go 1.24+)
  - Also: modules-and-dependencies.md#1-gomod-anatomy
- Toxiproxy → testing-advanced.md#chaos-engineering (network fault injection)
- Trace correlation → observability.md#logging (slog + OTel trace IDs)
- Tracepoint (eBPF) → ebpf.md#attaching (kernel tracepoint attachment)
- Tracing → observability.md#tracing (spans, auto-instrumentation, propagation)
- Transactions → database.md#transactions (begin/commit/rollback, context timeout)
- Transport (MCP) → mcp-and-agents.md#transports (stdio, SSE, streamable HTTP)
- Type mapping (CGo) → cgo-and-interop.md#type-mapping (C.int, C.char, size correspondence)
- TypeScript → Go migration → migration-guides.md#typescript-to-go (concept map, traps, translations)

## U

- UDP → networking.md#udp (datagram patterns)
- unique package → modern-go.md#iteration (Go 1.23+ interning for comparable values)
- Unix domain sockets → networking.md#unix-sockets (local IPC)
- unsafe package → internals.md#unsafe (6 valid conversion patterns, helper functions)
- Uprobe/Uretprobe → ebpf.md#attaching (userspace function tracing)

## V

- Vector databases → ai-ml-beyond-llm.md#vector-dbs (Qdrant, Weaviate, Milvus)
- Vendoring → modules-and-dependencies.md#7-vendoring (go mod vendor, when to use)
- Version information → platform-and-build.md#versioning (-ldflags, debug.ReadBuildInfo)
- Version quick-reference → modern-go.md#quick-ref (Go 1.21-1.26 feature matrix)
- Visitor pattern → design-patterns.md#behavioral (double dispatch, tree walking)
- Vulnerability scanning → ecosystem-and-tooling.md#vulnerability-scanning (govulncheck in CI)

## W

- Weak references (caching) → data-structures-and-caching.md#weak-unique (GC-friendly caches, Go 1.24+)
- WASI (wasip1) → wasm-and-embedded.md#wasip1 (server-side WASM)
- WASM (browser) → wasm-and-embedded.md#browser-wasm (syscall/js)
- WASM → wasm-and-embedded.md (standard Go, TinyGo, go:wasmexport)
  - Also: platform-and-build.md#wasm
- WASM reactor mode → wasm-and-embedded.md#reactor (long-lived WASM instances)
- Watermill → event-driven.md#watermill (event-driven framework)
  - Also: distributed-systems.md#event-sourcing
- Web frameworks → ecosystem-and-tooling.md#web-frameworks (Gin, Echo, Fiber, chi)
- Web scraping → advanced-patterns.md#scraping (colly, rod, chromedp)
- WebSocket → http-and-apis.md#websockets (nhooyr/websocket, gorilla)
- Windows patterns → platform-and-build.md#windows (paths, services, process exec)
- Write-behind cache → data-structures-and-caching.md#caching-strategies (async writeback, buffered flush)
- Write-through cache → data-structures-and-caching.md#caching-strategies (synchronous write to cache + source)
- Wire (DI) → project-patterns.md#di (compile-time dependency injection)
- Worker pools → concurrency.md#worker-pools (bounded goroutine pool pattern)
- Workspaces → modules-and-dependencies.md#5-workspaces-go-118 (go.work for multi-module dev)
- go:wasmexport → wasm-and-embedded.md#wasmexport (exporting Go funcs to WASM host)
  - Also: cgo-and-interop.md#wasmexport

## X

- X25519MLKEM768 → security.md#post-quantum (post-quantum key exchange, Go 1.24+)
- XDP → ebpf.md#attaching (express data path packet processing)
- XML → encoding-and-serialization.md#xml (encoding/xml patterns)

## Z

- Zero-value usability → design-patterns.md#go-specific (designing types with useful defaults)
