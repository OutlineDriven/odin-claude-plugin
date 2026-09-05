---
name: cpp-templates
description: 'Use when a C++ template error needs decoding, a template needs a concept or requires-clause instead of SFINAE, or template instantiation is slowing compilation. Not for C++20 modules: use cpp-modules.'
---

# C++ templates

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user shows a long template error, asks how to constrain a template, asks SFINAE versus concepts, or reports that template-heavy translation units compile slowly. |
| Authority | Read-only. The skill emits readings, constraint rewrites, and profiling commands to chat; the user edits the code. Rollback is not needed. No remote mutation. |
| Side effect | Chat output. Profiling commands write trace files where the user runs them. |
| Done | The failing instantiation is named with the substitution that failed, the proposed constraint compiles on the user's standard, and any compile-time claim carries a measurement command. |

## Inputs

- Compiler, version, and `-std=`: required. Concepts need C++20; C++23 is the current standard and C++20 the floor.
- The full diagnostic text: required for error reading.
- The template and one call site: required for constraint work.
- A build with `compile_commands.json` or a single reproducing TU: required for profiling.

## Procedure

1. Read the error from the bottom up. The first `error:` line names the user's call; the `required from here` (GCC) or `in instantiation of` (Clang) notes trace the chain; the last note names the type whose substitution failed. Shorten the chain with `-ftemplate-backtrace-limit=N` (GCC and Clang); with GCC add `-fconcepts-diagnostics-depth=N` for concept failures; with Clang add `-fno-elide-type` to print full types and `-fdiagnostics-show-template-tree` for a tree diff of the mismatch. Done when: the failing substitution and the call site are named.
2. Write the constraint with concepts when the standard is C++20 or later:

   ```cpp
   template <typename T> concept Arithmetic = std::is_arithmetic_v<T>;
   template <typename T> concept Container = requires(T c) {
       c.begin(); c.end(); c.size(); typename T::value_type;
   };
   template <Arithmetic T> T square(T x) { return x * x; }
   auto square(Arithmetic auto x) { return x * x; }
   template <typename T> requires Arithmetic<T> && (sizeof(T) >= 4)
   T big_square(T x) { return x * x; }
   ```

   Requires-expression forms: `expr;` checks validity, `{ expr } -> std::same_as<U>;` checks the result type, `{ expr } -> std::convertible_to<U>;` checks convertibility, `requires Other<T>;` nests a constraint. Done when: the constraint expresses the operations the body uses and nothing more.
3. Recognize SFINAE in existing code and map it to a concept: `std::enable_if_t<cond, int> = 0` on a parameter, `-> std::enable_if_t<cond, R>` on a return type, and the `std::void_t<decltype(...)>` detection idiom. Replace `enable_if` with a constraint and `void_t` detectors with a `requires` expression. Keep SFINAE only when the standard is below C++20. Done when: each SFINAE site has its concept equivalent or a reason to keep it.
4. Explain the trade-off when asked. Concepts give a named constraint failure at the call site, participate in overload ranking by subsumption, and read directly; SFINAE gives a wall of candidate notes and ranks by hand-built priority. Compile-time differences depend on the code; measure before claiming one. Done when: the comparison is stated without unmeasured speed claims.
5. Profile instantiation cost. Clang: `-ftime-trace` writes `<object>.json` per TU; aggregate a whole build with `ClangBuildAnalyzer --start <dir>`, build, `ClangBuildAnalyzer --stop <dir> capture.bin`, `ClangBuildAnalyzer --analyze capture.bin`, which lists the templates and template sets that took longest to instantiate. Templight, a Clang-based drop-in, traces every instantiation: `templight++ -Xtemplight -profiler -Xtemplight -memory -Xtemplight -ignore-system -c src.cpp` writes `src.o.trace.pbf`; it must be built from source with Clang. Done when: a measurement names the top instantiations.
6. Reduce the measured cost with the pattern that fits: explicit instantiation (`extern template int f<int>(int);` in the header, `template int f<int>(int);` in one TU); `if constexpr` in place of specialization; a constraint that rejects early instead of a deep substitution failure; splitting heavy template implementations into a header included only where needed. Done when: each proposed change is tied to an instantiation the profile named.
7. Confirm the rewrite compiles on the user's compiler and standard with a scratch TU before reporting. Done when: the scratch build passes.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Standard below C++20 | Concepts unavailable; keep SFINAE and shorten diagnostics with the backtrace flags. |
| Diagnostic truncated by the user | Ask for the full output or reproduce it; do not guess the failing type. |
| ClangBuildAnalyzer or Templight absent | Fall back to per-TU `-ftime-trace` and read the JSON with a trace viewer. |
| Slowness is not instantiation | If the profile names headers or codegen, redirect: caching and PCH belong to build-acceleration. |
| Coroutine template question | C++20 coroutines: use cpp-coroutines. |

## Output

A chat report naming the failing instantiation and its cause, the constraint rewrite that compiled on a scratch TU, and, when compile time was the complaint, the measurement command and the instantiations it named with the matching reduction.
