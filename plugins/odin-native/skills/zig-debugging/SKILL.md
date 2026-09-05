---
name: zig-debugging
description: 'Use when a Zig program panics, returns an error trace, or needs stepping in GDB or LLDB, print or std.log tracing, or a comptime value printed. Not for compiler flags: use zig-compiler.'
---

# Zig debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user shows a Zig panic or error return trace, wants to step through a Zig binary in GDB or LLDB, needs print or log tracing, or wants to inspect a comptime value. |
| Authority | Read-only. The skill emits build commands, debugger commands, and readings to chat; the user runs them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output; scratch builds and debugger sessions in a scratch directory. |
| Done | The panic or trace is mapped to the source line it names, or the debugger session reaches the requested breakpoint with locals visible, confirmed on the installed Zig and debugger. |

## Inputs

- Zig version from `zig version` and the debugger available (`gdb`, `lldb`): required. Samples ran on Zig 0.14.1 with GDB and LLDB.
- The panic text, error trace, or symptom: required.
- Optimize mode of the failing build: required; `ReleaseFast` and `ReleaseSmall` drop safety checks and error tracing.
- The root source file name: required, because Zig namespaces `main` under it (`ob.main` for `ob.zig`).

## Procedure

1. Build for debugging: `zig build-exe src/main.zig -O Debug -femit-bin=myapp`, or `zig build` which defaults to `Debug` (`-Doptimize=Debug` to be explicit). Debug builds carry DWARF that GDB and LLDB read directly. Done when: the debug binary exists.
2. Read a panic. The format is `thread <id> panic: <reason>` followed by `file:line:col: 0x<addr> in <function> (<module>)` frames with the source line and a caret; read the first frame under the panic line. Reasons seen from the safety checks: `index out of bounds: index N, len M`, `integer overflow`, `attempt to use null value`, `reached unreachable code`, `integer cast truncated bits`, and `invalid enum value`. These fire only in `Debug` and `ReleaseSafe`. Done when: the reason maps to the operation on the named line.
3. Read an error return trace. When `main` returns an error, Zig prints `error: <Name>` and then the frames where the error was created and each `try` that propagated it, innermost first. Read from the bottom to see the call chain (`main`, then `run`, then the function that failed). Error tracing is on in `Debug` and `ReleaseSafe`; enable it in `ReleaseFast` with `-ferror-tracing` or `.error_tracing = true` on the `addExecutable` options, and disable with `-fno-error-tracing`. Done when: the originating `try` is identified.
4. Step in GDB. `gdb ./myapp`, then `break main.main` (the function is namespaced under the root file: `break ob.main` for `ob.zig`), `run`, `next`, `step`, `continue`, `print var`, `info locals`, `bt`. Break on any panic with `break debug.defaultPanic`, which is the symbol Zig 0.14.1's std uses; the older `__zig_panic` names do not exist. Done when: the breakpoint hits and locals print.
5. Step in LLDB with the same DWARF: `lldb ./myapp`, `b ob.main`, `r`, `n`, `s`, `p var`, `frame variable`, `bt`, `c`; `b debug.defaultPanic` for panics. Done when: the breakpoint hits.
6. Trace with prints. `std.debug.print("x = {d}, name = {s}\n", .{ x, name })` writes to stderr unconditionally; `{any}` prints a struct with its fields, `{x}` and `{b}` print hex and binary. Dump the current stack with `std.debug.dumpCurrentStackTrace(null)`; capture one with `std.debug.captureStackTrace` and print later with `std.debug.dumpStackTrace`. Done when: the print shows the value at the point of interest.
7. Log with `std.log`. A scoped logger is `const log = std.log.scoped(.my_module);` with `log.debug`, `log.info`, `log.warn`, `log.err`. Configure in the root file with `pub const std_options: std.Options = .{ .log_level = .debug, .logFn = logFn };`, where `logFn` has the signature `fn (comptime level: std.log.Level, comptime scope: @TypeOf(.enum_literal), comptime format: []const u8, args: anytype) void`. Done when: the log lines appear at the configured level.
8. Inspect compile-time values with `@compileLog(value)`, which prints during compilation and then reports `error: found compile log statement`; remove it after reading. Done when: the comptime value is known.
9. Wire an editor when asked: a CodeLLDB launch configuration of type `lldb` pointing `program` at `zig-out/bin/myapp` with a `zig build` pre-launch task works because the binary carries standard DWARF. Done when: the editor stops at a breakpoint.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `Function "main" not defined` in GDB | Use the namespaced name `<rootfile>.main`; list candidates with `info functions main`. |
| No panic in a release build | Safety checks are off in `ReleaseFast` and `ReleaseSmall`; reproduce under `ReleaseSafe`. |
| Error trace absent in `ReleaseFast` | Build with `-ferror-tracing`. |
| Leak report from an allocator | Use `std.testing.allocator` in a test to pin the leak: use zig-testing. |
| Mixed C and Zig frames | Frames from C objects need the C side built with debug info; the interop rules are in zig-cinterop. |

## Output

A chat report with the reading of the panic or trace against the named source line, or the debugger command sequence that reached the breakpoint, plus the print or log lines added, each confirmed on the installed Zig and debugger.
