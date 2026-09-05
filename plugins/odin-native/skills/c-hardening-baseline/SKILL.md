---
name: c-hardening-baseline
description: 'Use when C code is written or audited and needs a pure-C baseline: standard, undefined behavior, integer and buffer safety, sanitizers, fuzzing, build flags. Not for C++: use modern-cpp-practices.'
---

# C hardening baseline

This skill is a pure-C policy. It never prescribes a C++ idiom (RAII, destructors, smart pointers, lock guards, containers) as C practice. C++ code goes to `modern-cpp-practices`.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | C code is being written, audited, or hardened and the project needs one baseline for the C standard, undefined behavior, integer and buffer safety, the sanitizer and fuzzing matrix, and build and CI hardening flags. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Emits a guidance report to chat. No source or build file is modified. |
| Done | The report names the C standard with the compiler that supports it, the undefined-behavior catalog with the sanitizer that traps each entry, the integer and buffer rules with their checked-arithmetic form, the hardening flag set the identified compiler accepts, the sanitizer and fuzzing jobs for CI, and the findings the audit checklist produced. |

## Inputs

- C source code or build files (required): the code being written, audited, or hardened.
- Compiler vendor and version (required when not inferrable from build files): for example GCC 16.2 or Clang 23.1.0.
- Active C standard (required when not inferrable from build flags): the `-std=` value or the project-agreed standard.
- Existing warning, hardening, sanitizer, and fuzzing configuration (optional): `CMakeLists.txt`, `meson.build`, `Makefile`, CI job files.

## Procedure

1. Identify the compiler, its version, and the active C standard from build files (`CMakeLists.txt`, `meson.build`, `Makefile`, compiler command lines) or from the inputs. Record whether the code is C++ anywhere in the tree. When the compiler or standard cannot be determined, report the ambiguity and stop. Done when: compiler, version, and standard are named, or the ambiguity is reported.

2. Select the C standard. C23 (ISO/IEC 9899:2024) is the current published standard. Pin `-std=c23` when the compiler accepts it. GCC 16.2 and Clang 23.1.0 both accept `-std=c23`. Fall back to `-std=c17` on an older toolchain and list which C23 controls the fallback loses (`<stdckdint.h>`, `static_assert` as a keyword, `nullptr`, `[[nodiscard]]` and the other standard attributes). Use `-std=c23` or `-std=c17`, not the `gnu` spellings, unless the code needs a GNU extension and a comment names it. Done when: the standard is selected and the compiler's support is recorded.

3. Catalog undefined behavior. Undefined behavior is not implementation-defined and not "works on my machine": it is permission for the optimizer to assume the program never does the thing. A single instance on a reachable path can delete a bounds check or miscompile a loop, and a clean debug build proves nothing. Scan for the high-frequency classes and report each occurrence with `file:line`:
   - Signed integer overflow. `INT_MAX + 1` is UB, so the compiler may assume `x + 1 > x` and remove the overflow check. Unsigned overflow wraps by definition and is not UB, but a wrap that feeds a size is still a bug.
   - Out-of-bounds access, including one past the end for a dereference.
   - Read of an uninitialized automatic variable. Initialize at declaration.
   - Null, misaligned, or invalid pointer dereference. The optimizer may delete null checks that follow a dereference.
   - Strict aliasing violation: access to an object through a pointer of an incompatible type. Type-pun through `memcpy` or through a union; `char` and `unsigned char` may alias anything.
   - Data race: concurrent access to a non-atomic object with at least one writer and no happens-before relation. Use `<stdatomic.h>` or a mutex.
   - Invalid shift: by a count at or past the width, or by a negative count.
   - Modification of a `const` object, a call through a function pointer of the wrong type, and an infinite loop with no side effects.
   Done when: every occurrence of a cataloged class is listed, or the report states that none was found.

4. Apply the integer and buffer rules. Report each violation with `file:line`:
   - Validate ranges before the arithmetic that feeds an allocation size, an array index, a `memcpy` length, or a loop bound. Overflow into a small allocation followed by a large copy is the classic remote code execution shape.
   - Use checked arithmetic: `ckd_add`, `ckd_sub`, and `ckd_mul` from `<stdckdint.h>` under C23, or `__builtin_add_overflow`, `__builtin_sub_overflow`, and `__builtin_mul_overflow` on GCC and Clang under C17.
   - Use `size_t` for sizes and indexes. Guard the order of an unsigned subtraction: `a - b` wraps when `b > a` and the result passes every upper-bound check.
   - Compile with `-Wconversion -Wsign-conversion` and fix narrowing and sign changes at the source.
   - Pass a length with every pointer and check it. Prefer `snprintf` and explicit length checks over unbounded copies. Never compute `ptr + n` from an attacker-controlled `n` before comparing `n` against the real remaining length.
   - Check every allocation return. `realloc` returning `NULL` must not overwrite the original pointer, or the block leaks. Use a temporary.
   - Pair every `malloc`, `calloc`, or `realloc` with exactly one `free` on every exit path, and every `fopen` with `fclose`. Use the goto-cleanup idiom, a single exit label that releases what was acquired, so an early error return cannot skip a release.
   - Do not trust an embedded length field from the wire or from a file. Cap it against the remaining buffer before use.
   - Replace banned functions on sight: `gets` (removed in C11; use `fgets`), `strcpy` and `strcat` (use `snprintf` or `strlcpy` where the platform provides it), `sprintf` and `vsprintf` (use `snprintf` and `vsnprintf`), `scanf("%s")` without a width (add a width or parse by hand), `system` and `popen` with interpolated input (use `posix_spawn` or `execve` with an argument vector), `strtok` (use `strtok_r`), `alloca` and a VLA sized from input (use the heap with a checked size), `atoi` and `atol` (use `strtol` with range and `errno` checks).
   - Never pass user data as a format string. `printf(user)` reads and writes memory through `%n`. Write `printf("%s", user)` and compile with `-Wformat -Wformat=2 -Werror=format-security`.
   - Never use `rand` or `random` for keys, tokens, IVs, or salts. Use `getrandom(2)` or `arc4random_buf` where the platform provides it, or a vetted library.
   - Zero secrets after use with a wipe the compiler cannot elide (`explicit_bzero` or `memset_s` where available). A plain `memset` before a `free` can be optimized away.
   - `assert` is compiled out under `-DNDEBUG`, which the common release presets set. A bounds or validation check written as `assert` does not exist in the shipped binary. Write it as an explicit `if` that returns or aborts, and keep `assert` for internal invariants.
   - Canonicalize paths with `realpath` before checking them, prefer `openat` with `O_NOFOLLOW`, and operate on file descriptors to avoid check-then-use races.
   Done when: every violation is listed with its replacement.

5. Recommend the hardening flag set. Report the flags the identified compiler accepts, split by compiler where support differs. Do not edit build files. Both GCC 16.2 and Clang 23.1.0 accept:
   - Warnings: `-Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion -Wshadow -Wcast-align -Wnull-dereference -Wdouble-promotion -Wimplicit-fallthrough -Wformat=2 -Wshift-overflow=2 -Wvla -Wbidi-chars=any -Wtrampolines`, with `-Werror` in CI. A clean `-Wall -Wextra` build is the floor, not the goal.
   - Fortification and stack: `-O2 -D_FORTIFY_SOURCE=3 -fstack-protector-strong -fstack-clash-protection -fstrict-flex-arrays=3 -ftrivial-auto-var-init=zero`.
   - Control flow on x86-64: `-fcf-protection=full`.
   - Position independence and link: `-fPIE -pie -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack`, and `-Wl,-z,nodlopen` for an executable that no one loads with `dlopen`.
   - Reproducibility: `-ffile-prefix-map=<src>=.` and `SOURCE_DATE_EPOCH`, so a path or timestamp does not leak into the binary. Keep `-g` and ship split debug symbols.
   GCC only: `-fhardened` (an umbrella that enables a subset of the above; verify the subset against the GCC version in use) and `-fzero-init-padding-bits=all`. Clang rejects both. Missing hardening flags on a network-facing or setuid binary is a HIGH finding. Done when: the flag set is listed per compiler with each unsupported flag named.

6. Recommend the sanitizer and fuzzing matrix. Sanitizers ship inside GCC 16.2 and Clang 23.1.0 under `-fsanitize=`. They are for test and CI builds, never production: production uses the flag set from step 5.
   - Job one: `-fsanitize=address,undefined -fno-sanitize-recover=all -fsanitize-address-use-after-scope`, then the full test suite. Any abort is a CRITICAL or HIGH finding. Set `ASAN_OPTIONS=detect_leaks=1:strict_string_checks=1` and `UBSAN_OPTIONS=print_stacktrace=1`.
   - Job two, for threaded code: `-fsanitize=thread`. ASan and TSan cannot run in one binary.
   - Clang only: add `-fsanitize=integer` to catch defined-but-suspicious unsigned wrap. `-ftrapv` is the blunter GCC and Clang alternative for signed overflow.
   - Valgrind Memcheck is the no-recompile fallback for a binary that cannot be rebuilt. It misses the stack and global overflows ASan catches.
   - Do not fix a UBSan report by casting the diagnostic away. Fix the arithmetic or the access.
   - Fuzzing: any code that parses untrusted bytes (network, file formats, decoders) gets a fuzz target. Prefer AFL++ v5.03c for a new target. libFuzzer ships inside Clang 23.1.0 via `-fsanitize=fuzzer` and receives bug fixes only, so an existing libFuzzer target stays supported but a new one belongs on AFL++. Pair every fuzz build with ASan and UBSan. Keep a seed corpus and a regression corpus in the repository. A new crash is a CRITICAL finding.
   - Static analysis: `clang-tidy` with `bugprone-*`, `cert-*`, `clang-analyzer-*`, `misc-*`, `performance-*`, and `portability-*`, committed in `.clang-tidy`, and GCC `-fanalyzer` in a CI job. Commit a `.clang-format` and enforce it with `clang-format --dry-run --Werror`.
   - Dependencies: one manifest and one lockfile, pinned versions, a generated SBOM, and the standard library preferred over a dependency.
   Done when: the sanitizer jobs, the fuzz target list, the static analysis configuration, and the dependency policy are in the report.

7. Run the audit checklist against the tree and report each hit with its severity. Every command below is `grep -rnE` over `*.c` and `*.h`:
   - Banned functions, HIGH or CRITICAL: `\b(gets|strcpy|strcat|sprintf|vsprintf|scanf|system|popen|strtok|atoi|atol)\s*\(`.
   - `alloca` and VLAs sized from input, HIGH: `\balloca\s*\(`, plus a build with `-Wvla` to list every VLA, then read each hit for the source of its size.
   - Format string with a non-literal first argument, CRITICAL: `(printf|fprintf|snprintf|syslog|err|warn)\s*\([^"]*\)`.
   - Overflow-prone size arithmetic, HIGH: `(malloc|calloc|realloc|alloca)\s*\([^;]*[*+][^;]*\)`, then check for `ckd_` or `__builtin_.*_overflow` in the same function.
   - Check-then-use on paths, HIGH: `\b(access|stat|lstat)\s*\(`, then check whether the following open uses the checked name.
   - Insecure randomness for secrets, HIGH: `\b(rand|random|srand)\s*\(`.
   - Timing leak, MEDIUM: `memcmp` on a buffer named like a MAC, token, secret, or digest.
   - Unchecked allocation, HIGH: each `= (malloc|calloc|realloc)\(` hit not followed by a `NULL` check.
   - Missing hardening in the build, HIGH on a network or setuid binary: no `_FORTIFY_SOURCE`, `stack-protector`, `relro`, `fcf-protection`, or `PIE` in the build files.
   - Missing sanitizer or fuzz job in CI, HIGH for input-parsing code: no `fsanitize`, `afl`, or `fuzzer` in the CI configuration.
   Done when: every checklist line has run and each hit is in the report with a severity.

8. Verify every recommendation against the compiler and standard named in step 1. Drop a flag the compiler rejects and record the drop. Drop every C++ prescription that a source or a prior draft carries as C policy and list it under dropped prescriptions. Done when: every recommendation is verified and the dropped list is complete.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Compiler or standard undetermined | Report the ambiguity with the evidence examined. Do not guess. Guidance is blocked until both are named. |
| C23 unsupported | Fall back to `-std=c17` and list the C23 controls that are lost, with the C17 replacement for each (`__builtin_*_overflow` for `<stdckdint.h>`, `_Static_assert` for `static_assert`). |
| Hardening flag rejected | Omit it, name the compiler that rejects it, and recommend the subset that compiles cleanly. |
| Sanitizer unavailable on the platform | Name the missing sanitizer, recommend Valgrind Memcheck as the fallback, and state what it misses. |
| C++ found in the tree | Report the C++ files and route them to `modern-cpp-practices`. Apply this baseline to the C files only. |
| Prescription found that is a C++ idiom | Drop it from the report and list it under dropped prescriptions. |

No partial result is claimed complete. When a step cannot finish, the report states which steps succeeded and which are blocked.

## Output

A guidance report with these sections:

| Section | Content |
|---|---|
| C standard | C23 or C17, with the compiler and version that justify the choice and the controls a C17 fallback loses. |
| Undefined behavior catalog | Each cataloged class found in the code, with `file:line` and the sanitizer that traps it. |
| Integer and buffer rules | Each violation with its checked-arithmetic, bounded, or ownership replacement. |
| Hardening flags | The flag set per compiler, with every rejected flag named. |
| Sanitizer and fuzzing matrix | The CI jobs, fuzz targets, static analysis configuration, and dependency policy. |
| Audit findings | Each checklist hit with `file:line` and severity, CRITICAL first. |
| Dropped prescriptions | Every C++ idiom cut from a source or draft because it does not apply to C. |
