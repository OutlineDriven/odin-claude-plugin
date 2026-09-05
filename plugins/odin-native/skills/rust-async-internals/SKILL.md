---
name: rust-async-internals
description: 'Use when understanding the Rust Future poll model, Pin and Unpin, tokio scheduling, async stack traces, waker leaks, or select!/join! behavior.'
---

# Rust async internals

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks how Rust async/await works, implements a `Future`, diagnoses a slow or stuck async task, uses `tokio-console`, or fixes a blocking call or `select!`/`join!` pitfall. |
| Authority | Reversible local: writes only local Rust source, `Cargo.toml` instrumentation, and diagnostic reports; rollback is `git checkout --` or `rm` for new files. No remote mutation. |
| Side effect | Local source or `Cargo.toml` may gain temporary tracing; chat emits guidance and diagnostic findings. |
| Done | The async behavior is explained, the task is instrumented and verified, or the pitfall is named with a concrete fix. |

## Inputs

1. The Rust code or runtime behavior (required): the async function, runtime builder, or tokio console output.
2. The task (required): explain the poll model, implement a `Future`, diagnose `Pin`/`Unpin`, debug with `tokio-console`, or fix blocking/`select!`/`join!` issues.
3. Runtime version (optional): defaults to `tokio` on Rust 1.98.1.

## Procedure

1. Identify the runtime and Rust version. Run `rustc --version` and `cargo tree -i tokio`. Confirm the project uses `tokio` or another executor. Done when: the runtime and version are known.
2. Explain the `Future` poll model. Describe the `Future` trait, `Poll::Ready` and `Poll::Pending`, the `Context` waker, and the executor loop. Done when: the user can trace how `.await` maps to `poll()` calls and wakeups.
3. Implement a simple `Future` if asked. Write a type that stores state and returns `Poll::Pending` until an event, then clones and wakes the waker. Done when: the custom `Future` compiles and runs under `cargo test` or the example binary.
4. Explain `Pin` and `Unpin`. State that `Pin<P>` prevents moving the value behind `P`, that async state machines are self-referential, and that `Box::pin` or `std::pin::pin!` creates a pinned reference. Done when: the user can pick the correct pinning method for a stack, heap, or trait object future.
5. Explain the tokio task model. Describe `tokio::spawn`, `tokio::task::spawn_blocking`, `tokio::task::yield_now`, and `tokio::task::LocalSet` for `!Send` futures. Done when: the user can choose the right spawn method for CPU, blocking I/O, or local futures.
6. Set up `tokio-console` if asked. Add `console-subscriber` to `Cargo.toml`, initialize it before the runtime, build with `RUSTFLAGS="--cfg tokio_unstable" cargo run`, and run `tokio-console` in another terminal. Done when: `tokio-console` shows tasks and poll times.
7. Find and fix blocking in async. Replace `std::thread::sleep` with `tokio::time::sleep(...).await`, `std::fs` reads with `tokio::fs`, and heavy CPU calls with `tokio::task::spawn_blocking`. Done when: the async task no longer blocks a runtime thread.
8. Diagnose `select!` and `join!` pitfalls. Explain that `select!` completes when the first branch wins and drops the others, `join!` waits for all, `biased;` changes polling order, and `Fuse` is needed for polling a future repeatedly. Done when: the user can rewrite the branch or loop safely.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Async code blocks the runtime | Move blocking calls to `tokio::task::spawn_blocking` or replace them with async equivalents. |
| Future cannot be polled after completion | Use `Fuse` or re-create the future inside the loop. |
| `Pin` error at an `await` point | Check for self-referential borrows; pin the future with `Box::pin` or `pin!` before awaiting. |
| `tokio-console` shows no tasks | Confirm `console-subscriber` is initialized before the runtime and `tokio_unstable` is set. |
| `select!` drops an in-progress branch | Accept the cancellation semantics or guard cleanup with `tokio::select!` and a drop guard. |

## Output

1. An explanation of the poll model, `Pin`, or tokio task model as requested.
2. Instrumented source or `Cargo.toml` with `console-subscriber` when diagnostics are needed.
3. A chat report naming the blocking call, waker leak, or `select!`/`join!` fix.
