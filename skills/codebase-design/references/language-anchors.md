# Per-language anchors

Each language maps the shared vocabulary (module, interface, seam, adapter) to its own constructs. Use the row matching the target language when anchoring terms in step 8 of the procedure.

## Rust

Module is a crate or module path. Interface includes trait bounds, lifetime constraints, error enums, and `#[must_use]`. Seam is a trait-object boundary or a generic parameter. Adapter is the concrete `impl Trait for Type`.

## Go

Module is a package. Interface includes the named interface type, package error sentinels, and the context-cancellation contract. Seam is the interface declaration site. Adapter is the concrete struct with method receivers.

## OCaml

Module is the `.ml`/`.mli` pair. Interface is the `.mli` plus invariants encoded by the abstract type `t`. Seam is the signature consumed by a functor. Adapter is the functor argument module.

## Java/Kotlin

Module is a package or Gradle module. Interface is the `interface` or `sealed interface` plus checked exceptions and documented invariants. Seam is the interface. Adapter is the implementation injected via the DI container.
