---
name: rust-no-std
description: 'Use when writing #![no_std] Rust crates, using core and alloc without std, selecting panic handlers, or testing no_std code on the host.'
---

# Rust no_std

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user writes or debugs `#![no_std]` Rust, splits code between `core`, `alloc`, and `std`, implements a global allocator, selects a panic handler, or tests a `no_std` crate on the host. |
| Authority | Reversible local: writes only local `no_std` crate source, `Cargo.toml` feature gates, and report files; rollback is `git checkout --` or `rm` for new files. No remote mutation. |
| Side effect | Local `lib.rs`, `Cargo.toml`, and test files may change; chat emits guidance. |
| Done | The crate builds for the target, the allocator or panic handler is wired, or the host test runs pass. |

## Inputs

1. The target platform (required): a bare-metal triple, an embedded MCU, or `x86_64-unknown-linux-gnu` for host tests.
2. The task (required): crate structure, `core`/`alloc`/`std` boundaries, global allocator, panic handler, or host testing.
3. Rust version (optional): defaults to 1.98.1 with edition 2024.
4. Allocator crate (optional): for example `linked-list-allocator`, `buddy-alloc`, `dlmalloc`, or `talc`.

## Procedure

1. Identify the target and toolchain. Run `rustc --version` and `rustup target list --installed`. Confirm the target triple is installed. Done when: the target and Rust version are known.
2. Set up the `no_std` crate structure. Add `#![no_std]` at the top of `src/lib.rs`. Gate `alloc` behind a feature with `extern crate alloc` under `#[cfg(feature = "alloc")]`. Keep dependencies `no_std`-compatible. Done when: `cargo check --no-default-features` and `cargo check --all-features` pass.
3. Explain `core` versus `alloc` versus `std`. State that `core` needs no OS or heap, `alloc` needs a global allocator, and `std` needs an OS. List the modules available in `core`. Done when: the user can choose the right crate for each API.
4. Provide a global allocator when `alloc` is enabled. Add the `#[global_allocator]` static, initialize it with the heap start and size, and call the init function before any allocation. Done when: `alloc::vec::Vec` and `alloc::string::String` work on the target.
5. Select a panic handler. Add `#[panic_handler] fn panic(_info: &PanicInfo) -> !`. Choose `loop {}` for a halt, `defmt` plus `cortex_m::asm::udf()` for a debug probe, or a `panic-halt`/`panic-reset`/`panic-probe` crate. Done when: the binary links without a missing panic handler.
6. Write portable `no_std` libraries. Return borrowed data from `core` APIs and put `alloc` APIs behind `#[cfg(feature = "alloc")]`. Use borrowed slices for the core path. Done when: the library builds with and without the `alloc` feature.
7. Test on the host. Use `#![cfg_attr(not(test), no_std)]` to keep `std` available to the test harness, or run `cargo test --target x86_64-unknown-linux-gnu` for logic tests. For bare-metal targets, use `cargo check --target <triple>`. Done when: host tests pass or the target build succeeds.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `no_std` crate still links `std` | Check dependencies for `std` features and remove or replace them. |
| `alloc` types fail to compile | Confirm `extern crate alloc` and a `#[global_allocator]` are present and initialized. |
| Missing panic handler | Add `#[panic_handler]` or depend on a `panic-*` crate. |
| Host tests pull in `std` code | Use `cfg_attr(not(test), no_std)` and keep tests separate from library `std` use. |
| Bare-metal target has no test runner | Run pure logic tests on the host or use an embedded test harness such as `defmt-test`. |

## Output

1. A `no_std` crate structure with feature-gated `alloc`.
2. A global allocator and panic handler wired for the target.
3. Host test or target build command output and a chat report.
