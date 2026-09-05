---
name: rust-debugging
description: 'Use when debugging Rust binaries with GDB or LLDB, enabling pretty-printers, interpreting panics and backtraces, debugging async with tokio-console, or stepping through no_std code'
---

# Rust debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Debugging a Rust binary, getting backtraces, setting breakpoints, inspecting variables, debugging async tasks, or triaging panics. |
| Authority | Reversible local. Adds and removes temporary debug instrumentation in local source files and `Cargo.toml`, runs local debuggers and builds, and writes build artifacts to `target/`; rollback reverts source and configuration edits and removes build artifacts. No remote mutation. |
| Side effect | Local source edits for `dbg!`, `tracing`, `console-subscriber`, and `RUST_BACKTRACE` settings; local debug builds; debugger transcripts. |
| Done | The fault is located or the question is answered with a backtrace, breakpoint state, variable value, or async task trace. |

## Inputs

1. **Symptom** (required): the failing binary, panic message, wrong output, or hang.
2. **Build mode** (required if not inferrable): debug build or release with debug symbols.
3. **Debugger** (required): GDB, LLDB, `rust-gdb`, `rust-lldb`, or tokio-console.
4. **Optional inputs**: custom panic hook, tracing subscriber configuration, or embedded probe settings.

## Procedure

1. **Build with debug information.** Use `cargo build` for a debug build, or add a `release-with-debug` profile in `Cargo.toml` for release. For separate debug symbols on Linux/ELF, build release, then `objcopy --only-keep-debug`, `strip --strip-debug`, and `objcopy --add-gnu-debuglink`. Done when: the binary has symbols the chosen debugger can read.
2. **Select the debugger and load pretty-printers.** Use `rust-gdb <binary>` or `rust-lldb <binary>` for automatic Rust pretty-printers. For manual setup, source `gdb_lookup.py` and `lldb_lookup.py` from the `rustc --print sysroot` path. Done when: the debugger starts and `String`, `Vec`, and `Option` values render as Rust types.
3. **Set breakpoints and run.** In GDB: `break myapp::module::function_name`, `run <args>`, `next`, `step`, `continue`. In LLDB: `b myapp::module::function_name`, `r <args>`, `n`, `s`, `c`. Use `break rust_panic` to stop on panic. Done when: execution stops at the expected location or reproduces the fault.
4. **Inspect state.** Print variables and backtraces: `p my_vec`, `info locals`, `bt` in GDB; `p my_vec`, `frame variable`, `thread backtrace` in LLDB. Done when: the variable or call stack explains the symptom.
5. **Capture backtraces on panic.** Set `RUST_BACKTRACE=1` or `RUST_BACKTRACE=full`, or call `std::backtrace::Backtrace::force_capture()` in a custom panic hook. Done when: a backtrace is produced and identifies the panic site.
6. **Triage the panic.** Match the panic message to its likely cause and decide whether to fix bounds checking, unwrap or expect handling, overflow, or assertions. In release, set `panic = "abort"` to abort on panic; core-dump capture depends on OS and ulimits. Done when: the root cause is identified and a fix is stated.
7. **Add structured logging with tracing.** Add `tracing` and `tracing-subscriber` to `Cargo.toml`, initialize a subscriber in `main`, and instrument functions with `#[instrument]`. Remove after use. Done when: logs show the execution path around the fault.
8. **Debug async tasks with tokio-console.** Add `console-subscriber` and enable the `tokio/tracing` feature, run the program, then run `tokio-console`. Inspect task states, waker activity, blocked tasks, and poll durations. Done when: the async bottleneck or deadlock is visible.
9. **Debug `#[no_std]` binaries.** Connect with OpenOCD and `rust-gdb` over a target remote, or use `probe-run --chip <chip> target/<triple>/debug/<binary>`. Verify the probe connection and target power. Done when: the target halts at a breakpoint or outputs probe logs.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Pretty-printers not loading | Use `rust-gdb`/`rust-lldb` or manually source the sysroot scripts. |
| No debug symbols | Rebuild with `debug = true` or a `release-with-debug` profile. |
| Backtrace is incomplete | Set `RUST_BACKTRACE=full` or increase the backtrace limit. |
| Async task not visible | Confirm `console_subscriber::init()` is called and the tokio `tracing` feature is enabled. |
| Embedded probe not found | Check the probe connection, OpenOCD config, and target power. |

## Output

1. The located fault, identified panic cause, or confirmed async bottleneck.
2. The commands and configuration used for the debug session.
3. A list of source changes made, if any, so they can be reverted.
