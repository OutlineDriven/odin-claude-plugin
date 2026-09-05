---
name: idiomatic-rust
description: 'Use when writing, reviewing, or refactoring Rust code. Routes the task to handbook chapters on idioms, lints, errors, testing, generics, and pointers under the edition 2024 and current-stable pins.'
---

# Idiomatic Rust

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Rust code is being written, reviewed, or refactored, or a Rust design choice about borrowing, error handling, dispatch, or testing needs the idiomatic answer. |
| Authority | Reversible local: writes only the Rust source and project files the invoking task already touches; rollback is version-control restore. No remote mutation. |
| Side effect | Rust source files may change under the invoking task; chapter guidance and verification output go to chat. |
| Done | The code or review follows the conventions below, the routed chapters were consulted, and the toolchain verification ran clean or its failure is reported. |

## Inputs

1. The Rust task (required): code to write, a diff to review, or a design question.
2. The crate or workspace root (required when it is not the current directory): supplies `Cargo.toml`, `rust-toolchain.toml`, and the edition pin.
3. The toolchain pin (optional): defaults to the grounded pin in step 1.

## Procedure

1. Fix the toolchain baseline. The grounded pin is Rust 1.98.1 stable (released 2026-09-03) on edition 2024. Rust ships a rolling six-week stable train with no LTS channel, so current stable is the maintained target. When the project pins an older toolchain or edition, work inside that pin and note the delta. Done when: the effective toolchain and edition are named.
2. Route the task to the handbook chapters. Read every chapter the task touches in the same turn; the routing table is under References. Done when: each relevant chapter is loaded.
3. Apply the core conventions. Done when: the code or review reflects each convention that applies.
   - Borrowing and ownership: prefer `&T` over `.clone()` unless ownership must move; take `&str` over `String` and `&[T]` over `Vec<T>` in parameters; use `Cow<'_, T>` when ownership is ambiguous.
   - `Copy` types: passing a small `Copy` type by value is a heuristic, not a rule. The handbook's threshold is about two to three machine words, roughly 24 bytes on a 64-bit target, because the copy avoids a pointer indirection. The real cutoff depends on the target's register and calling conventions; measure when the path is hot.
   - Error handling: return `Result<T, E>` for fallible operations; keep `panic!` for unrecoverable bugs; use `thiserror` for library error types and `anyhow` for application binaries; propagate with `?`.
   - `unwrap()` and `expect()` stay out of production paths; tests and examples may use them.
   - Performance: benchmark with `--release`; run `cargo clippy -- -D clippy::perf` for hints; avoid cloning in loops; prefer iterators and avoid intermediate `.collect()` calls.
   - Dispatch: prefer generics (static dispatch) on hot paths; use `dyn Trait` for heterogeneous collections; box at API boundaries, not internally.
   - Type state: encode valid states in the type system when invalid transitions must fail at compile time.
   - Documentation: `//` comments carry why (safety, workarounds, rationale); `///` doc comments carry what and how on public API; every `TODO` names a tracking issue; enable `#![deny(missing_docs)]` on libraries.
4. Verify with the toolchain. Run `cargo fmt --check`, `cargo clippy --all-targets --all-features --locked -- -D warnings`, and `cargo test`. A lint that must be suppressed uses `#[expect(clippy::lint)]` with a justification comment, never a bare `#[allow]`. Done when: all three commands pass or each failure is reported with its cause.

## References

Chapter content is inherited from the pinned handbook sources; the headline Rust 1.98.1 pin does not independently revalidate its per-feature and library assertions.

| File | Read when |
|---|---|
| `references/chapter_01.md` | Borrowing vs cloning, `Copy`, `Option`/`Result` handling, iterators, comments, when to extract a function |
| `references/chapter_02.md` | Clippy configuration, key lints, workspace lint setup |
| `references/chapter_03.md` | Profiling, redundant clones, stack vs heap, zero-cost abstractions |
| `references/chapter_04.md` | `Result` vs panic, `thiserror` vs `anyhow`, error hierarchies |
| `references/chapter_05.md` | Test naming, one assertion per test, snapshot testing |
| `references/chapter_06.md` | Static vs dynamic dispatch, trait objects |
| `references/chapter_07.md` | Compile-time state safety with the type-state pattern |
| `references/chapter_08.md` | When to comment, doc comments, rustdoc |
| `references/chapter_09.md` | Thread safety, `Send`/`Sync`, pointer types |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `cargo clippy` missing | Install it with `rustup component add clippy`; clippy ships as a rustup component in lockstep with rustc, not as a separately versioned package. |
| Clippy false positive | Suppress with `#[expect(clippy::lint)]` and a justification comment; `expect` warns once the lint stops firing, so the suppression cannot go stale. |
| Heuristic conflicts with measurement | The measurement wins; a heuristic states a default, not a law. |
| Project pins an older toolchain | Work inside the project's pin and report which conventions need a newer toolchain. |

## Output

Rust code or review feedback that follows the conventions above, with the toolchain verification results or the blocking failure named.
