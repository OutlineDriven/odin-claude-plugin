---
name: zig-compiler
description: 'Use when invoking zig directly: build-exe, build-lib, optimize modes, zig cc as a C compiler, emit flags, ast-check, fmt, or a Zig compile error. Not for build.zig projects: use zig-build-system.'
---

# Zig compiler

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user compiles a Zig file from the command line, asks which optimize mode to use, wants `zig cc` as a C or C++ compiler, needs assembly or LLVM IR from Zig, or shows a Zig compile error. |
| Authority | Read-only. The skill emits commands and readings to chat; the user runs them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output; scratch compiles write into a scratch directory. |
| Done | The command for the request is reported, every flag in it is confirmed against `zig build-exe --help` on the installed Zig, and each error message in the request has a reading and fix. |

## Inputs

- Zig version from `zig version`: required. Everything below was run on Zig 0.14.1; flag spellings change between releases.
- Source file or C source: required.
- Goal: required. Debug build, safe release, fastest, smallest, library, C compile, inspection, or error reading.
- Target when not the host: optional; see zig-cross for the triple and CPU choices.

## Procedure

1. Compile. Run in place: `zig run src/main.zig`. Executable: `zig build-exe src/main.zig`, named output `-femit-bin=myapp`. Static library: `zig build-lib src/mylib.zig`; shared: `zig build-lib src/mylib.zig -dynamic`. Object: `zig build-obj src/main.zig`. Link libc when C is involved: `-lc`. Done when: the artifact exists.
2. Choose the optimize mode with `-O <mode>`. Done when: the mode matches the goal.

   | Mode | Safety checks | Use |
   |---|---|---|
   | `Debug` (default) | On, with debug info | Development |
   | `ReleaseSafe` | On | Production where a panic beats undefined behavior |
   | `ReleaseFast` | Off | Throughput, only after the code passed under `ReleaseSafe` |
   | `ReleaseSmall` | Off | Size-constrained targets: embedded, WebAssembly |

   With checks on, integer overflow, out-of-bounds indexing, unwrapping `null`, reaching `unreachable`, and an invalid enum tag all panic with a source location; with checks off the same conditions are undefined behavior. Safe alternatives when the arithmetic is intentional: `+%` wraps, `@addWithOverflow` reports the overflow bit, `std.math.add` returns an error. A comptime overflow is a compile error in every mode. Done when: the user knows what each mode does on error.
3. Use `zig cc` and `zig c++` as a C and C++ compiler. They accept Clang flags: `zig cc -O2 -Wall main.c -o myapp`, `zig c++ -std=c++17 -O2 main.cpp -o myapp`. Cross-compile without a system toolchain: `zig cc -target aarch64-linux-gnu -O2 main.c -o myapp-arm`; static musl: `zig cc -target x86_64-linux-musl -static main.c -o myapp-static`. In CMake: `CC="zig cc" CXX="zig c++" cmake -S . -B build`; in Make: `CC="zig cc" make`. Zig bundles the libc it links for the triples listed under `.libc` in `zig targets`; no system cross toolchain is needed. Done when: the C artifact runs on its target.
4. Emit intermediate forms with `-femit-asm=<path>` and `-femit-llvm-ir=<path>` (also `-femit-llvm-bc`); add `-fno-emit-bin` to skip the binary. There are no `--emit-asm` or `--emit-llvm-ir` spellings. Done when: the requested file exists.
5. Validate without compiling: `zig ast-check src/main.zig` checks syntax and AST-level errors; `zig fmt src/` formats a tree, `zig fmt --check src/` reports files that would change. Done when: the check passes or the reported file is named.
6. Read compile errors: each has `file:line:col: error: <message>`, a caret under the token, and `note:` lines for context. Done when: each message maps to a fix.

   | Message | Meaning and fix |
   |---|---|
   | `expected type 'X', found 'Y'` | Type mismatch; convert explicitly (`@intCast`, `@as`) or fix the declaration |
   | `use of undeclared identifier 'X'` | Missing import or typo |
   | `type 'u8' cannot represent integer value '300'` | Comptime overflow; widen the type |
   | `cannot assign to constant` | `const` binding mutated; make it `var` |
   | `unused local constant` or `unused local variable` | Every local must be used; discard with `_ = x;` |
   | `unused function parameter 'x'` | Same rule; `_ = x;` in the body |

7. Read runtime panics such as `thread <id> panic: integer overflow` or `panic: index out of bounds: index 5, len 3` followed by a source location: the check fired in `Debug` or `ReleaseSafe`; fix the arithmetic or bound. Deeper debugging: use zig-debugging. Done when: the panic maps to the line it names.
8. Confirm environment facts with `zig version` and `zig env` (which prints `zig_exe` and `lib_dir`). Done when: the version and library directory are known.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Flag rejected as `unrecognized parameter` | Look it up in `zig build-exe --help`; only `-f`-prefixed emit flags exist. |
| `Unsupported operating system freestanding` from std | The program touches std facilities that need an OS on a freestanding target; restructure or pick a hosted target. |
| `zig cc` link fails against a system library | Pass `-l<name>` and, for a non-native target, the library must exist for that target; there is no host library reuse. |
| Multi-file or multi-target project | Move to `build.zig`: use zig-build-system. |
| Target triple or CPU question | Use zig-cross. |

## Output

A chat report with the compile command, the optimize mode and its safety consequence, any emit or check commands, and a reading of each error or panic in the request, each confirmed on the installed Zig.
