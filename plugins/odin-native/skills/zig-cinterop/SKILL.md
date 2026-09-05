---
name: zig-cinterop
description: 'Use when Zig code calls C or C code calls Zig: @cImport, translate-c, C type mapping, extern and packed structs, export fn, opaque handles, or a mixed C and Zig build. Not for Rust FFI: use rust-ffi.'
---

# Zig C interop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user calls a C function from Zig, exposes a Zig function to C, needs a struct that matches a C layout, wants to see how a C header translates, or builds a project that mixes C and Zig sources. |
| Authority | Read-only. The skill emits Zig declarations, `build.zig` lines, and `translate-c` commands to chat; the user writes them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output; `translate-c` output goes where the user redirects it. |
| Done | The declarations and build lines for the request are reported, they compile against libc on the installed Zig in a scratch file, and every C type in the request has its Zig mapping. |

## Inputs

- Zig version from `zig version`: required. The samples ran on Zig 0.14.1.
- The C header or function signatures involved: required.
- Direction: required. C called from Zig, Zig called from C, or both.
- Whether the C code lives in the project or in a system library: required; decides `addCSourceFile` versus `linkSystemLibrary`.

## Procedure

1. Call C from Zig with `@cImport`: `const c = @cImport({ @cInclude("stdio.h"); @cDefine("MY_FEATURE", "1"); @cUndef("SOME_MACRO"); });` then `_ = c.printf("value: %d\n", @as(c_int, 42));`. Variadic C functions such as `printf` work through the import. Single-file builds need `-lc`; in `build.zig` call `exe.linkLibC()` and `exe.addIncludePath(b.path("include"))`. Done when: the call compiles and links against libc.
2. Inspect the translation when a declaration looks wrong: `zig translate-c -lc -I include -DFEATURE=1 mylib.h > mylib.zig`, or with `-target aarch64-linux-gnu` to see another platform's layout. Read the output to learn the generated names and types, then keep using `@cImport` in code; the translated file is a reference, not a source to commit. Done when: the generated declaration for the symbol in question is read.
3. Map C types from the table; `translate-c` output is the authority for anything not listed. Done when: every parameter and return type in the request is mapped.

   | C | Zig |
   |---|---|
   | `int`, `unsigned`, `long`, `unsigned long`, `long long` | `c_int`, `c_uint`, `c_long`, `c_ulong`, `c_longlong` |
   | `size_t`, `ssize_t` | `usize`, `isize` |
   | `char *` (null-terminated) | `[*:0]u8`; `const char *` is `[*:0]const u8`; generated code shows `[*c]u8` |
   | `void *` | `*anyopaque`; nullable `?*anyopaque` |
   | `NULL` | `null` |
   | `bool` (C99) | `bool` |
   | `float`, `double` | `f32`, `f64` |
   | `T *` returned from C | `?*T` when it may be null; `[*c]T` in generated code |

   Zig string literals are already `[*:0]const u8`. Build a dynamic C string with `std.fmt.bufPrintZ(&buf, "hello {d}", .{42})` on a `[N:0]u8` buffer and pass `.ptr`. Done when: no string crosses the boundary without a terminator.
4. Match C layouts with `extern struct`, which uses the C ABI layout: `const Point = extern struct { x: c_int, y: c_int };`. Match bitfields and wire formats with a backed packed struct: `const Flags = packed struct(u8) { mode: u4, kind: u4 };` and convert with `@bitCast`. Model a forward-declared C type as `const FILE = opaque {};` and declare its functions with `extern fn fopen(path: [*:0]const u8, mode: [*:0]const u8) ?*FILE;`. Done when: each C struct has one Zig counterpart with the same layout rule.
5. Export Zig to C: `export fn zig_add(a: c_int, b: c_int) c_int { return a + b; }` exports the symbol with the C calling convention; a non-exported C-callable function is `pub fn f(x: u32) callconv(.c) u32`; data is `export const VERSION: c_int = 42;`. Write the matching C header by hand with the C types from the table (`int zig_add(int, int); extern int VERSION;`). Done when: the header's prototypes match the exported signatures.
6. Build the mixed project. Zig library consumed by C: build with `b.addLibrary(.{ .linkage = .static, ... })`, then a C executable with `c_exe.addCSourceFile(.{ .file = b.path("src/main.c"), .flags = &.{"-std=c11"} })`, `c_exe.linkLibrary(lib)`, `c_exe.linkLibC()`. C consumed by Zig: `exe.addCSourceFiles`, `exe.addIncludePath`, `exe.linkLibC()`, or `exe.linkSystemLibrary("name")` for an installed library. Details of the build graph: use zig-build-system. Done when: the artifact links.
7. Handle memory across the boundary: memory from C `malloc` is freed with `c.free`; `std.heap.c_allocator` gives Zig code an allocator backed by libc so buffers can cross either way. Model a C pointer that may be `NULL` as an optional and handle it with `orelse`. Done when: every allocation has one owner and every nullable pointer is checked.
8. Confirm with a scratch file compiled by `zig build-exe scratch.zig -lc` and, for exports, inspect the symbol table (use elf-inspection). Done when: the scratch build runs.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `@cImport` struct has no member `name` | The header that declares it is not included or the macro guard hid it; add the `@cInclude` or `@cDefine`. |
| `translate-c` fails on `size_t` or similar | The header relies on an include it does not pull in; pass `-lc` and add the missing `@cInclude` or `-I`. |
| Calling convention mismatch | Non-exported callbacks passed to C need `callconv(.c)`; the 0.14.1 spelling is lowercase `.c`. |
| Bitfield layout differs from C | Zig packed structs pack from the least significant bit; confirm against the C compiler's layout on the target before relying on it. |
| Build graph question | `build.zig` structure: use zig-build-system. |

## Output

A chat report with the `@cImport` block or `extern` declarations, the type mapping for every signature in the request, the `build.zig` lines that link the pieces, and the scratch-build line confirming they compile on the installed Zig.
