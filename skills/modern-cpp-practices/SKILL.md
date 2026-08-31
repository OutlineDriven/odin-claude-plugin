---
name: modern-cpp-practices
description: 'Use when C++ code is being written or reviewed and the compiler supports modern safe idioms. Returns guidance on supported features, safer patterns, and compiler-compatible hardening flags. Don''t use for tasks that require source or remote-system changes.'
---

# Modern C++ practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | C++ code is being written, modernized, or reviewed and the selected compiler and standard permit newer safe idioms. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: modernized C++ design or review guidance using supported language features, safer idioms, and appropriate hardening. |
| Done | Touched C++ uses supported modern idioms, avoids cataloged hazards, and applies measured, compiler-compatible hardening without inventing unavailable features. |

## Inputs

1. **C++ source code or diff** (required): the code being written, modernized, or reviewed.
2. **Compiler identification** (required if not inferrable from build files): compiler vendor and version (e.g., GCC 14, Clang 18, MSVC 19.40).
3. **C++ standard level** (required if not inferrable from build flags): the `-std=` value or project-agreed standard (e.g., C++20, C++23).
4. **Build system or compiler flags** (optional): existing warning and hardening flags.

## Procedure

1. Identify the compiler vendor, version, and active C++ standard level from build files (`CMakeLists.txt`, `Makefile`, `meson.build`, compiler command lines) or from the supplied inputs. If the compiler or standard level cannot be determined, report the ambiguity and stop. Done when: the step’s stated result is achieved or its stop condition is reported.
2. For each modern C++ idiom or feature the code uses or the review proposes, check the corresponding feature-test macro (e.g., `__cpp_concepts >= 202002L`, `__cpp_lib_format >= 202110L`, `__cpp_constexpr >= 202211L`, `__cpp_modules >= 202207L`, `__cpp_lib_expected >= 202211L`, `__cpp_lib_print >= 202207L`, `__cpp_lib_ranges >= 202110L`, `__cpp_lib_generator >= 202207L`, `__cpp_lib_mdspan >= 202207L`). A feature is available only when its macro is defined and meets the required value for the compiler and standard in use. Done when: the step’s stated result is achieved or its stop condition is reported.
3. Catalog applicable C++20 features: concepts, ranges, coroutines (`co_await`/`co_yield`/`co_return`), `std::format`, three-way comparison (`<=>`), `consteval`, `constinit`, modules, designated initializers, `std::span`, `std::jthread`, `std::source_location`. Done when: the step’s stated result is achieved or its stop condition is reported.
4. Catalog applicable C++23 features: `std::expected`, `std::print`/`std::println`, `std::generator`, `std::mdspan`, `std::flat_map`/`std::flat_set`, `if consteval`, multidimensional subscript operator, `std::stacktrace`, deducing this. Done when: the step’s stated result is achieved or its stop condition is reported.
5. Catalog conditionally available C++26 features: `std::inplace_vector`, `std::contract` (contracts), reflection (`^`/`[:`/`:]`), pattern matching (`inspect`). Gate each on its feature-test macro; if the macro is absent or below threshold, mark the feature as unavailable for this compiler. Done when: the step’s stated result is achieved or its stop condition is reported.
6. Scan the code for cataloged anti-patterns and replace each with its modern equivalent: Done when: the step’s stated result is achieved or its stop condition is reported.
   - Raw `new`/`delete` → smart pointers (`std::unique_ptr`, `std::shared_ptr`) or RAII wrappers.
   - C-style casts → `static_cast`, `reinterpret_cast`, `std::bit_cast`.
   - Manual resource management in destructors → RAII types or `std::scope_success`/`std::scope_fail` (C++26) / `std::unique_resource` proposals.
   - `NULL`/`0` for null pointers → `nullptr`.
   - Unscoped `enum` → `enum class`.
   - `typedef` for type aliases → `using`.
   - SFINAE metaprogramming → concepts and `requires` clauses.
   - `std::bind` / `std::bind1st` / `std::bind2nd` → lambdas.
   - `throw()` / dynamic exception specifications → `noexcept`.
   - Implicit captures in complex lambdas → explicit capture lists.
   - `#pragma once` in multi-TU builds → include guards (or modules when available).
   - `std::auto_ptr` → `std::unique_ptr`.
   - `volatile` for thread synchronization → `std::atomic`.
7. Apply compiler-compatible hardening flags. Recommend the maximal set the compiler and standard support: Done when: the step’s stated result is achieved or its stop condition is reported.
   - Warnings: `-Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion -Wnull-dereference -Wimplicit-fallthrough`.
   - Treat warnings as errors in CI: `-Werror`.
   - Sanitizers (when available): `-fsanitize=address,undefined -fno-sanitize-recover=all`.
   - Stack protection: `-fstack-protector-strong`.
   - Fortification: `-D_FORTIFY_SOURCE=2` (GCC/libc) or `-D_FORTIFY_SOURCE=3` (glibc 2.38+).
   - Format security: `-Wformat -Wformat-security -Wformat=2`.
   - Control-flow integrity: `-fcf-protection` (GCC/Clang x86) or `-fsanitize=cfi` (Clang).
   - Position-independent code: `-fPIE -pie` for executables, `-fPIC` for shared libraries.
   - If a flag is unsupported by the compiler, omit it and note the omission rather than forcing a build failure.
8. Verify that every recommended feature and flag is grounded in the compiler version and standard level identified in step 1. Do not recommend a feature whose feature-test macro is absent or below threshold. Do not invent unavailable features. Done when: the step’s stated result is achieved or its stop condition is reported.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Compiler or standard undetermined | Report the ambiguity with the evidence examined. Do not guess. Guidance is blocked until the compiler and standard are identified. |
| Feature-test macro absent or below threshold | Mark the feature as unavailable for this compiler. Recommend the closest available alternative or defer the feature. Do not assume availability from the standard level alone. |
| Hardening flag unsupported | Omit the flag. Note which compiler rejects it. Recommend the subset that compiles cleanly. |
| Code uses a feature not yet standardized | Report the feature, its current proposal status, and the compiler-specific extension if one exists. Do not recommend non-standard features as portable. |
| Anti-pattern has no direct modern replacement | Report the anti-pattern, explain why no drop-in replacement exists, and recommend the closest safe alternative or a refactor path. |

No partial result is claimed complete. If any step cannot finish, the guidance report states which steps succeeded and which are blocked.

## Output
A structured guidance report containing:
1. **Applicable modern idioms**: list of C++20/C++23/C++26 features available for the identified compiler and standard, each with its feature-test macro and required value.
2. **Hardening flags**: the recommended compiler flag set, noting any unsupported flags.
3. **Anti-pattern replacements**: each identified anti-pattern with its modern replacement.
4. **Unavailable features**: features gated behind absent or insufficient feature-test macros, with deferral notes.
