---
name: zig-comptime
description: 'Use when Zig code needs compile-time evaluation: comptime parameters, generic types, anytype, @typeInfo reflection, comptime tables, or a ported C++ template pattern. Not for C++: use cpp-templates.'
---

# Zig comptime

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user writes a generic Zig function or type, asks how `comptime` or `anytype` works, needs reflection over a type's fields, wants a table or string computed at compile time, or is porting template metaprogramming from C++. |
| Authority | Read-only. The skill emits Zig code and readings to chat; the user writes them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output; scratch compiles in a scratch directory. |
| Done | The comptime construct for the request is reported and a scratch file using it compiles and runs on the installed Zig. |

## Inputs

- Zig version from `zig version`: required. Samples ran on Zig 0.14.1, where `@typeInfo` tags are lowercase (`.int`, `.@"struct"`); older releases used capitalized tags.
- The function, type, or value the user wants computed or generic: required.
- Whether the result must exist at compile time (table, type) or only be generic (function over `T`): required.

## Procedure

1. State the basics. `comptime_int` and `comptime_float` are arbitrary precision and exist only at compile time. A `comptime { ... }` block runs during compilation; `std.debug.assert` inside it is a compile-time check. A `comptime T: type` parameter must be known at the call site: `fn makeArray(comptime T: type, comptime n: usize) [n]T { return [_]T{0} ** n; }`. Compile-time evaluation is bounded by a branch quota; raise it with `@setEvalBranchQuota(N)` inside the evaluating scope when a recursive or long loop exceeds the default 1000 backward branches. Done when: the user knows which values are comptime-known.
2. Write generic functions and types. A function over a type takes `comptime T: type`: `fn max(comptime T: type, a: T, b: T) T`. A generic type is a function returning `type`:

   ```zig
   fn Stack(comptime T: type) type {
       return struct {
           items: []T,
           top: usize,
           allocator: std.mem.Allocator,
           const Self = @This();
           pub fn init(allocator: std.mem.Allocator) !Self {
               return .{ .items = try allocator.alloc(T, 64), .top = 0, .allocator = allocator };
           }
           pub fn push(self: *Self, value: T) void { self.items[self.top] = value; self.top += 1; }
           pub fn deinit(self: *Self) void { self.allocator.free(self.items); }
       };
   }
   ```

   `Stack(i32)` and `Stack(f64)` are distinct types, memoized per argument. Done when: the generic compiles for two argument types.
3. Use `anytype` for duck-typed parameters. The type is inferred per call site: `fn printLength(thing: anytype) void { std.debug.print("{}\n", .{thing.len}); }` works for a string literal, an array, or a slice. Guard it for a clear error: `if (!@hasDecl(@TypeOf(writer), "write")) @compileError("writer must have a write method");`. The standard library's writer parameters follow this pattern. Done when: every `anytype` parameter has the operations it needs, checked or documented.
4. Reflect with `@typeInfo`, which returns a tagged union `std.builtin.Type` at comptime. Switch on it with the lowercase tags: `.int => |i| i.bits, i.signedness`, `.float => |f| f.bits`, `.@"struct" => |s| s.fields`, `.@"enum" => |e| e.fields`, `.optional => |o| o.child`, `.array => |a| a.len, a.child`. Iterate fields with `inline for (s.fields) |field|`; `std.meta.fields(T)` is the shorthand. Reject unsupported types with `if (@typeInfo(T) != .int) @compileError("requires an integer type, got: " ++ @typeName(T));`. Done when: the reflection covers every tag the code can meet or ends in `else`.
5. Build data at compile time. A lookup table is a labeled block: `const table = blk: { var t: [256]f32 = undefined; @setEvalBranchQuota(10000); for (0..256) |i| t[i] = @sin(@as(f32, @floatFromInt(i)) * (2.0 * std.math.pi / @as(f32, 256))); break :blk t; };`. Mixed `comptime_float` and `comptime_int` division must be made explicit with `@as`, or the compiler reports an ambiguous coercion. A comptime string transform returns `[s.len]u8` from a `comptime s: []const u8` parameter. Structural typing checks fields with `@hasField(T, "width")` and falls back to `@compileError`. Done when: the table or string is a `const` and the build proves it evaluates.
6. Map C++ template idioms when porting. Done when: each idiom in the request has its Zig form.

   | C++ | Zig |
   |---|---|
   | `template<typename T>` | `fn f(comptime T: type)` |
   | Specialization `template<> class Foo<int>` | `if (T == i32) { ... }` inside the type function, at comptime |
   | SFINAE and `enable_if` | `@hasDecl`, `@hasField`, `@typeInfo`, `@compileError` |
   | Variadic templates | `anytype` tuples and `inline for` |
   | `constexpr` | Any expression evaluated in a `comptime` context |
   | Macros | Comptime functions |

7. Apply the recurring patterns: conditional compilation with `const is_debug = @import("builtin").mode == .Debug;` and `if (comptime is_debug)`; `inline for` over comptime-known slices to unroll per field. Done when: no runtime branch depends on a value known at compile time.
8. Confirm with a scratch file run by `zig run scratch.zig` on the installed Zig. Done when: it prints the expected values.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `evaluation exceeded 1000 backwards branches` | Add `@setEvalBranchQuota(N)` in the scope that performs the evaluation, not in the callee. |
| `ambiguous coercion of division operands` | Cast one operand with `@as(f32, ...)` or `@as(f64, ...)`. |
| Capitalized `@typeInfo` tags rejected | The installed Zig uses lowercase tags; rewrite `.Int` as `.int`, `.Struct` as `.@"struct"`. |
| `@compileError` fires from an `anytype` guard | The call site passed a type without the required decl or field; the message names the missing one. |
| Test of a comptime function wanted | Comptime asserts inside `test` blocks: use zig-testing. |

## Output

A chat report with the comptime code for the request, the reading of any reflection or coercion error, and the scratch-run line showing it compiled and ran on the installed Zig.
