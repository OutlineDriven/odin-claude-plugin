# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [LANGUAGE.md](LANGUAGE.md) — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test through the new interface directly. No adapter needed.

_Examples_: a Rust parser combinator chain consolidated into one `parse(input) -> Result<Ast, ParseError>`; a Python pipeline `parse_invoice` + `apply_tax` + `round_total` collapsed into `Invoice.finalize(raw) -> Invoice`.

### 2. Local-substitutable

Dependencies that have local test stand-ins (PGLite for Postgres, in-memory filesystems, Testcontainers, OCaml `Eio.Mock`). Deepenable when the stand-in exists. The deepened module is tested with the stand-in running in the test suite. The seam is internal; no port at the module's external interface.

_Examples_: a Go data-access module fronting Postgres tested with `pgx` against a Testcontainers Postgres; a Java repository tested with H2 in-memory; an OCaml store tested through `Eio_mock` filesystem.

### 3. Remote but owned (Ports & Adapters)

Owned services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Tests use an in-memory adapter. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: *"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it is deployed across a network."*

_Examples_: a Kotlin service calling an internal pricing microservice via a `PricingPort` interface — gRPC adapter in production, in-memory adapter in tests; a Rust client wrapping an internal queue with a `JobQueue` trait — RabbitMQ adapter in production, channel-backed adapter in tests.

### 4. True external (Mock)

Third-party services (Stripe, Twilio, GitHub, Auth0, etc.) the team does not control. The deepened module takes the external dependency as an injected port; tests provide a mock adapter.

_Examples_: a Python billing module that takes a `PaymentGateway` protocol — `StripePaymentGateway` in production, a `pytest`/`hypothesis` mock in tests; a Go SMS dispatcher with a `Notifier` interface — Twilio adapter in production, recording fake in tests.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Do not introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Internal seams vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Do not expose internal seams through the interface just because tests use them.

## Testing strategy: replace, do not layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist — delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert on observable outcomes through the interface, not internal state.
- Tests should survive internal refactors — they describe behaviour, not implementation. If a test has to change when the implementation changes, it is testing past the interface.
