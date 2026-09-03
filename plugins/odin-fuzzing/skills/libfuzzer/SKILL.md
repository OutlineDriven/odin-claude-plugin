---
name: libfuzzer
description: 'Use when asked to build, run, and triage Clang libFuzzer campaigns: harness structure, sanitizer-compiled binary, corpus-driven execution, and crash reproduction. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# libFuzzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to build, run, tune, or triage a Clang libFuzzer campaign or LLVMFuzzerTestOneInput harness. |
| Authority | Reversible-local: write only to named fuzzing artifacts (binary, corpus dir, crash files); rollback by deleting them. |
| Side effect | Local write to a compiled fuzzing binary, its corpus directory, and any crash artifacts written by the target. |
| Done | The instrumented binary runs against its corpus and any crash artifact reproduces in the same target with identical sanitizer output. |

## Inputs

- Required: Clang compiler (`clang++`) with libFuzzer runtime present.
- Required: One `LLVMFuzzerTestOneInput` harness function visible to the linker.
- Required: Source or object files for the code under test.
- Optional: Seed corpus directory. It may be empty; when omitted, create `./corpus/`.
- Optional: Fuzzing dictionary file (see Dictionary format below).
- Optional: Clang build flags: `-fsanitize=address`, `-fsanitize=undefined`, `-g`, `-O2`, `-max_len`, `-dict`, `-timeout`, `-close_fd_mask`, `-fork`, `-ignore_crashes`.

## Procedure

1. **Verify Clang.** Run `clang++ --version`. Stop if Clang is absent; install it before proceeding. Done when: `clang++ --version` succeeds and Clang is confirmed present.

2. **Build the harness binary.** Compile with:
   ```
   clang++ -fsanitize=fuzzer[,address,undefined] -g -O2 -U_FORTIFY_SOURCE <harness>.cc <target>.cc -o <binary>
   ```
   Required: `-fsanitize=fuzzer` links the libFuzzer runtime and provides `main`. Add `,address` for heap/stack buffer overflow, use-after-free, and double-free detection. Add `,undefined` for signed-integer overflow, null dereference, and similar undefined behavior. Add `-U_FORTIFY_SOURCE` when using ASan to avoid fortification interference. Omit `-fsanitize=address` for a faster build when only checking sanitizer-uncovered defects. Done when: the binary compiles and links successfully.

3. **Prepare the corpus directory.** Create `<corpus_dir>/`. Optionally seed it with valid example inputs representing the target format to reach code paths faster. The fuzzer discovers additional inputs during execution. Done when: `<corpus_dir>/` exists and is optionally seeded.

4. **Run the campaign.**
   ```
   <binary> [-max_len=<N>] [-timeout=<S>] [-dict=<dict_file>] [-close_fd_mask=3] [-fork=1 -ignore_crashes=1] [-jobs=<N> -workers=<N>] <corpus_dir>/
   ```
   `-max_len`: cap per-input byte size (2× minimal realistic input is a reasonable start; omit to let libFuzzer grow dynamically). `-timeout`: abort test cases exceeding this many seconds. `-dict`: pass a fuzzing dictionary for format-aware mutation. `-close_fd_mask=3`: close stdout and stderr for a speed boost when the target writes to them. `-fork=1 -ignore_crashes=1`: continue after finding a crash rather than exiting. `-jobs`/`-workers`: run N parallel jobs sharing the corpus. Done when: the campaign runs and produces output (coverage stats, crash artifacts, or clean exit).

5. **Collect crash artifacts.** When the binary exits with a deadly signal or sanitizer report, libFuzzer writes an artifact named `crash-<SHA1-hash-of-content>` in the current directory. Note the artifact path and the sanitizer output. Done when: every crash artifact path and its sanitizer output are recorded.

6. **Reproduce the crash.** Re-run the binary directly on the artifact:
   ```
   <binary> ./crash-<hash>
   ```
   Verify the same sanitizer error or deadly signal recurs. If it does not, check for non-determinism in the harness or target (remove random-number generators and uninitialized-memory reads). Done when: the crash reproduces with identical sanitizer output, or non-determinism is identified.

7. **Report.** State the artifact path, the sanitizer violation type, and whether reproduction succeeded. Done when: the report states artifact path, violation type, and reproduction result.

### LLVMFuzzerTestOneInput harness signature

```
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size < <minimum>) return 0;      // reject undersized inputs
    // parse or pass data to target
    return 0;                            // always return 0
}
```

Rules: do not call `exit()`; join all threads before returning; keep execution fast (target hundreds to thousands of executions per second); maintain determinism (no `rand()`, no reading from `/dev/random`); reset global state between calls.

### Dictionary format

One quoted string per line; `#` marks a comment line:
```
"\\x89PNG"
"GET"
"Content-Type"
```
Generate from headers with `grep -o '"[^"]*"' <header.h>`, from binary strings with `strings ./binary | sed 's/^/"/; s/$/"/'`, or from man pages with `man <cmd> | grep -oP '^\s*(--|-)\K\S+' | sed 's/[,.]//g' | sed 's/^/"/; s/$/"/' | sort -u`.

### Interpreting output

| libFuzzer line | Meaning |
|---|---|
| `INITED` | Initialization complete, corpus loaded |
| `NEW cov: N` | New coverage edge found; input added to corpus |
| `stat::cov: N` | Running coverage edge count |
| `exec/s: N` | Executions per second |
| `libFuzzer: deadly signal` | Crash: signal received (SEGV, ABRT, etc.) |
| `AddressSanitizer: <type>` | ASan violation: heap/stack/global buffer overflow, use-after-free, double-free, or leak |
| `UndefinedBehaviorSanitizer: <type>` | UBSan violation: signed-integer overflow, null dereference, etc. |

## Failure and recovery
| Failure class | Diagnosis | Recovery |
|---|---|---|
| `no-clang` | `clang++ --version` fails or reports GCC | Install LLVM/Clang; re-run Step 2 |
| `link-error` | Undefined references to target symbols | Verify all source and library objects are passed to the compiler |
| `sanitizer-violation` (expected) | Deadly signal or sanitizer report during fuzzing | Artifacts written to `./crash-*`; reproduce per Step 6; report type and artifact path |
| `hang` | No output for > timeout interval | Increase `-timeout`; check whether target is entering an infinite loop or blocking I/O |
| `no-coverage` | Fuzzer runs but `stat::cov` never increases | Add seed corpus inputs; supply a dictionary; verify harness calls the target; use `-runs=0 <corpus_dir>/` to exhaust the static corpus first |
| `non-reproducible` | Crash artifact does not reproduce | Remove non-determinism from harness and target; rebuild without `-fsanitize=fuzzer-no-link` |
| `corpus-exhausted` | `stat::cov` plateaus, no new coverage for extended runtime | Extend corpus, add dictionary, improve seed inputs, run coverage analysis |

Partial-result rule: if the campaign finds no crash after a bounded run, report the final coverage count and `non-converged`.

Rollback: delete the compiled `<binary>`, the `<corpus_dir>/` contents, and any `crash-*` files to restore the pre-run state.

## Output

Terminal classification: `non-converged` (binary exits zero or no sanitizer violation, with final coverage count), crash found (artifact path, sanitizer violation type, reproduction result), compilation failure (compiler error message), or failure class name with diagnostic message.
