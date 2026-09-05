---
name: zig-testing
description: 'Use when writing or running Zig tests: test blocks, zig test, filters, std.testing assertions, the leak-detecting allocator, comptime tests, or the fuzzer. Not for build.zig: use zig-build-system.'
---

# Zig testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user writes a `test` block, wants to run a subset of tests, needs the right `std.testing` assertion, suspects a leak in a test, wants a comptime check, or asks about Zig's fuzzer. |
| Authority | Read-only. The skill emits test code, `build.zig` lines, and commands to chat; the user runs them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output; scratch test runs in a scratch directory. |
| Done | The test code and run command for the request are reported and a scratch `zig test` of the same shape passes (or fails on the leak or condition it was written to catch) on the installed Zig. |

## Inputs

- Zig version from `zig version`: required. Samples ran on Zig 0.14.1; the fuzzer is present there and marked experimental.
- The function or module under test: required.
- Whether tests live in the source file or a separate test root: required for the `build.zig` shape.
- Allocation behavior of the code under test: required to choose the allocator assertion.

## Procedure

1. Write tests as `test "name" { ... }` blocks in the source file or a dedicated file, using `const testing = std.testing;`. Run one file with `zig test src/math.zig`; run the project with `zig build test`. Filter by substring with `zig test --test-filter "add" src/math.zig`; in `build.zig`, pass filters through `addTest(.{ .filters = ... })`, for example from `b.option([]const []const u8, "test-filter", "...")`, so `zig build test -Dtest-filter=add` selects them. `zig build test --summary all` prints per-step results. Done when: the chosen subset runs.
2. Wire `build.zig`: `const unit_tests = b.addTest(.{ .root_module = <module> });` then `b.step("test", "Run unit tests").dependOn(&b.addRunArtifact(unit_tests).step);`. A second `addTest` on `tests/integration.zig` hooked to the same step runs both; a separate `test-unit` step runs one. Done when: `zig build test` runs every intended test root.
3. Choose the assertion from `std.testing`: `expectEqual(expected, actual)`, `expectEqualStrings`, `expectEqualSlices(T, expected, actual)`, `expectApproxEqAbs(expected, actual, tolerance)` and `expectApproxEqRel` for floats, `expectError(error.Name, result)`, `expect(condition)`, `expectStringStartsWith`, `expectStringEndsWith`. Literal integers need a typed expected value, `@as(i32, 5)`, because `expectEqual` coerces to the expected type. Done when: each check uses the assertion that reports the most useful failure.
4. Detect leaks with `std.testing.allocator`, which reports any allocation not freed by the end of the test and fails it (`[gpa] (err): memory address ... leaked`). Pattern: `var list = std.ArrayList(u32).init(testing.allocator); defer list.deinit();`. For code that owns its allocator, `std.heap.GeneralPurposeAllocator(.{}){}` (an alias of `DebugAllocator` on 0.14.1) returns `.ok` or `.leak` from `deinit()`; assert on it in a `defer` block. Done when: every allocating test frees through a `defer` and a leak fails the run.
5. Test at compile time where the value is comptime-known: `comptime { std.debug.assert(isPowerOfTwo(16)); }` fails the build; inside a `test` block, `comptime { try testing.expect(isPowerOfTwo(8)); }` runs the check during compilation; type facts use `@sizeOf`, `@alignOf`, and `@typeInfo(u8).int.signedness` with the lowercase tag. Done when: the comptime check compiles and the negative case fails the build.
6. Fuzz with the built-in fuzzer. Inside a `test` block call `try std.testing.fuzz(context, testOne, .{})`, where `testOne` has the signature `fn (context: @TypeOf(context), input: []const u8) anyerror!void` and calls the parser or decoder under test; `.corpus` in the options seeds inputs. Run `zig build test --fuzz`, which starts a web interface on a local port and keeps searching; a plain `zig build test` runs each fuzz test once with a fixed input. Done when: the fuzz test is discovered (`N fuzz tests found`) and the fuzz run starts.
7. Confirm with a scratch `zig test` on the installed Zig, including one intentionally leaking test to see the allocator report. Done when: the pass and the intended failure both appear.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `expectEqual` type mismatch on a literal | Wrap the expected value in `@as(T, ...)`. |
| Test passes alone, leaks in the suite | The leaked allocation is in shared state; free it in the test that created it or in a `defer`. |
| Fuzz test not found | The `test` block must call `std.testing.fuzz`; an `export fn fuzz` is not the entry point. |
| `--fuzz` unavailable | The installed Zig predates the built-in fuzzer; use an external fuzzer against a C-ABI export. |
| Comptime evaluation quota exceeded | Add `@setEvalBranchQuota(N)` in the evaluating scope: use zig-comptime. |

## Output

A chat report with the test code, the `build.zig` lines when the project needs them, the run and filter commands, and the scratch-run lines showing the pass count and the leak report from the deliberately leaking test.
