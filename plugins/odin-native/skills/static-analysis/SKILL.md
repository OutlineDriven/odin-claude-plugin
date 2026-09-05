---
name: static-analysis
description: 'Use when hardening C/C++ code quality with clang-tidy, cppcheck, or scan-build, interpreting check categories, suppressing false positives, integrating into CI, or working with compile_commands.json.'
---

# Static analysis

Select, run, and triage C/C++ static analysis: clang-tidy, cppcheck, and scan-build. Grounded against LLVM/Clang 23.1.0 and cppcheck 2.21.0.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task runs or configures clang-tidy, cppcheck, or scan-build, interprets check categories, suppresses false positives, generates `compile_commands.json`, or wires static analysis into CI. |
| Authority | Reversible local: writes only `.clang-tidy`, suppression comments, source files (through `-fix`), and analysis reports; rollback is version control. No remote mutation. |
| Side effect | `clang-tidy -fix` edits source files in place; analyzers read the compilation database. |
| Done | The analyzer runs over the intended translation units and findings are triaged into fixed, suppressed with reason, or reported. |

## Inputs

- A C/C++ project (required) and its build system.
- A compilation database (required for clang-tidy): `compile_commands.json`.
- Check policy (optional): which categories to enable and which warnings are errors.

## Procedure

1. Generate `compile_commands.json`. Done when: the database covers the sources to analyze.

```bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
ln -s build/compile_commands.json .

# Make-based trees
bear -- make
# or: pip install compiledb && compiledb make
```

2. Run clang-tidy. Done when: diagnostics cover the intended files.

```bash
clang-tidy src/foo.c -- -std=c23 -I include/
run-clang-tidy -p build/ -j"$(nproc)"
clang-tidy -checks='bugprone-*,modernize-*,performance-*' src/foo.cpp
clang-tidy -checks='modernize-use-nullptr' -fix src/foo.cpp
```

3. Pick check categories by goal. Done when: the enabled set matches the stated goal.

| Goal | Categories |
|---|---|
| Find real bugs | `bugprone-*`, `clang-analyzer-*` |
| Modernize C++ | `modernize-*` |
| C++ Core Guidelines | `cppcoreguidelines-*` |
| Performance | `performance-*` |
| Security hardening | `cert-*`, `hicpp-*` |
| Readability and style | `readability-*` |

4. Commit a `.clang-tidy` at the project root so every run uses the same policy. Done when: the config file parses and `clang-tidy` picks it up.

```yaml
Checks: >
  bugprone-*,
  modernize-*,
  performance-*,
  -modernize-use-trailing-return-type,
  -bugprone-easily-swappable-parameters
WarningsAsErrors: 'bugprone-*,clang-analyzer-*'
HeaderFilterRegex: '^(src|include)/.*'
CheckOptions:
  - key: modernize-loop-convert.MinConfidence
    value: reasonable
  - key: readability-identifier-naming.VariableCase
    value: camelCase
```

5. Suppress false positives with NOLINT comments; clang-tidy has no attribute-based suppression. Done when: each suppression names its check and carries a reason.

```cpp
int result = riskyOp();  // NOLINT(bugprone-signed-char-misuse) - hardware register

// NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
constexpr int BUFFER_SIZE = 4096;

// NOLINTBEGIN(readability-*)
...legacy block...
// NOLINTEND(readability-*)
```

Exclude third-party trees with `HeaderFilterRegex` rather than NOLINT.

6. Run cppcheck as a second, independent analyzer. Done when: cppcheck runs with an explicit enable set and exit code.

```bash
cppcheck --enable=warning,performance,portability \
         --suppress=missingIncludeSystem \
         --error-exitcode=1 \
         --std=c23 \
         src/

cppcheck --project=build/compile_commands.json
cppcheck --xml --xml-version=2 src/ 2> cppcheck-report.xml
```

`--enable` values: `warning` (undefined behavior, bad practice), `performance`, `portability`, `information`, or `all`.

7. Run scan-build for path-sensitive analysis. It wraps a build and drives the Clang static analyzer, which tracks execution paths across functions: use-after-free, dead stores, null dereferences on complex paths. Done when: the HTML report is generated and triaged.

```bash
scan-build make
scan-build -o /tmp/scan-out cmake --build build/
scan-view /tmp/scan-out/*/

# Enable a specific checker; list all with clang -cc1 -analyzer-checker-help
scan-build -enable-checker security.insecureAPI.gets make
```

8. Wire analysis into CI as a gate. Done when: the CI job fails on new warnings.

```yaml
- name: Static analysis
  run: |
    cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
    run-clang-tidy -p build -j"$(nproc)" -warnings-as-errors '*'

- name: cppcheck
  run: |
    cppcheck --enable=warning,performance \
             --suppress=missingIncludeSystem \
             --error-exitcode=1 \
             src/
```

For per-check details see `references/clang-tidy-checks.md`.

## Failure and recovery

- clang-tidy finds no compilation database: generate `compile_commands.json` first; without it flags and include paths are guesses.
- Fix-its break the build: revert the file; apply `-fix` per check, not across the whole suite at once.
- Warning storm hides real bugs: enable one category at a time, fix or suppress, then widen.
- NOLINT on a third-party file: exclude the path with `HeaderFilterRegex` instead.
- scan-build reports nothing: it only sees what the wrapped build compiles; force a full rebuild with `make -B` or a clean build directory.
- cppcheck `missingIncludeSystem` noise: the flag suppresses it; deeper fixes need `--includes-file` or `-I` flags.

## Output

A `.clang-tidy` or cppcheck configuration encoding the agreed check policy, a triaged findings list (fixed, suppressed with reason, or open), and a CI step that gates on new warnings.
