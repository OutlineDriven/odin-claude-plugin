---
name: constant-time-analysis
description: 'Use when reviewing cryptographic code for timing side-channels, statically in compiled output or at runtime with statistical timing tests. Not for known-answer vectors: use wycheproof.'
---

# Constant-time analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs static inspection of compiled assembly or VM bytecode for secret-dependent variable-time operations, or runtime and statistical evidence that a cryptographic implementation leaks timing information. |
| Authority | Reversible local: static mode is read-only and produces only local intermediate compiler output, discarded after analysis; runtime mode writes only a timing-test harness, its compiled binary, and measured sample files under a scratch directory, and rollback is deleting the scratch directory and compiled artifacts. The implementation under test is read and compiled but never edited. No remote mutation. |
| Side effect | A compiler or bytecode analyzer report read from local toolchain output (static), or a local timing-test harness and measured runtime samples (runtime). |
| Done | Static mode: the analyzer runs with warnings for every configuration in the target matrix and every reported instruction is traced to secret or public data before verdict. Runtime mode: a runtime test reports calibrated evidence of leakage or a bounded inconclusive result, with the exercised configuration named. |

## Inputs

- Mode: one of `static` (default) or `runtime`. Runtime mode fires when the user needs empirical timing evidence rather than inspection of emitted instructions.
- Source file or directory to analyze (required).
- Target language, inferred from file extension or supplied (required).
- Configuration matrix for native languages (C, C++, Go, Rust, Swift): an explicit list of target architectures and optimization levels to sweep. Each entry names one architecture (`x86_64`, `arm64`, `riscv64`, ...) and one optimization level (`O0` through `O3`, `Os`, `Oz`). At minimum two architectures and two optimization levels including one size-optimized level (`Os` or `Oz`). Required for native languages; not applicable to JVM/CIL or interpreted languages.
- Optional: function-name regex to narrow scope; compiler override (`gcc`, `clang`, `go`, `rustc`, `swiftc`).
- Runtime mode also requires: the cryptographic function or binary to test, and a statement of which inputs are secret (private keys, exponents, nonces, password hashes) versus public.
- Runtime mode optional: the compiler and flags used in production (default tests at the production optimization level, e.g. `-O3 -march=native`), the target CPU architecture, and a measurement budget in minutes.

## Procedure

Static mode runs steps 1-5. Runtime mode runs step 1, then steps 6-10.

### 1. Confirm secret data and required toolchains

Confirm the target handles secret data: a key, plaintext, nonce, or token. If every input is public, stop: there is no constant-time concern. Static mode inspects compiler output and never executes the code under test; cache and other microarchitectural side channels are invisible to it. Runtime mode executes the code under statistical measurement and dynamic tracing; it covers only exercised paths and inputs.

Detect the language from the file extension and confirm the required toolchain is installed (see `references/per-language-reference.md` Prerequisites). On a missing toolchain, stop and name the absent tool. Runtime mode additionally requires a C compiler for the harness and `valgrind` for the dynamic trace.

For native languages, confirm the toolchains for every architecture in the supplied configuration matrix are available. Cross-arch toolchains differ: clang crosses with `--target` and needs the target's C library headers or fails with `bits/libc-header-start.h file not found`; Go cross-builds through `GOARCH` but `go tool objdump` has no riscv64 disassembler; gcc needs a named cross binary (`--compiler x86_64-linux-gnu-gcc`, `--compiler riscv64-linux-gnu-gcc`) and nothing is substituted automatically; rustc needs the target installed via `rustup target add`. Report any missing cross toolchain; do not silently substitute a different one.

Done when: secret data is confirmed present (or the skill stops with no constant-time concern), the language is detected, and every toolchain in the configuration matrix is confirmed or the absent tool is named.

### 2. Compile the source against every configuration in the target matrix

For native languages (C, C++, Go, Rust, Swift), compile the source against every architecture and optimization level in the supplied configuration matrix. Division timing and branch lowering are architecture- and optimization-dependent: x86_64 `IDIV` and arm64 `SDIV` differ, and a `cmov` at `-O2` can become a branch at `-O0`. A single clean run proves one configuration safe, not the code. The matrix is closed: sweep every entry, no more and no less.

For JVM/CIL languages (Java, Kotlin, C#), `--arch` and `--opt-level` do not apply: the analyzer reads bytecode, and the JIT may still introduce variable-time native code the analyzer cannot see. State this limitation and run bytecode analysis once.

Done when: the source is compiled for every configuration in the matrix (native) or bytecode is produced (JVM/CIL).

### 3. Run the static analyzer with warnings enabled

Run the constant-time analyzer over each compiled artifact with warning-severity detection enabled (`--warnings`). Without it only error-severity findings are reported: division, modulo, and weak RNG. Four warning-severity families stay silent without `--warnings`: secret-dependent branches, early-exit comparison (`memcmp`, `strcmp`, `.equals`, `==`), table lookups indexed by a secret, and variable-time encoding. Early-exit comparison of an authentication tag is the most common timing bug in real code, so a default run is quiet about the finding most likely to be present.

| Flag | Effect |
|---|---|
| `--warnings` | Add the four warning-severity families. Pass it every time. |
| `--func <regex>` | Restrict output to function names matching the regex. |
| `--json` | Machine-readable output. |
| `--arch <target>` | Target architecture (native languages only). |
| `--opt-level <level>` | Optimization level (native languages only). |
| `--compiler <name>` | Override compiler choice. |

Narrow a large file to the routines that handle secrets, e.g. `--func 'sign|verify'`.

Apply the per-language coverage limits when interpreting findings and silence. See `references/per-language-reference.md` Coverage limits.

Done when: the analyzer runs with `--warnings` over every compiled artifact in the matrix.

### 4. Triage every flagged instruction

The analyzer has no data flow analysis and flags every dangerous instruction regardless of whether a secret reaches it, so a FAILED report is a worklist, not a verdict. For each flagged instruction, read the source and trace from the instruction's function back to the caller's inputs, then classify:

| Question | If yes |
|---|---|
| Is the operand a compile-time constant? | Likely false positive. |
| Is the operand a public parameter: length, count, index bound? | Likely false positive. |
| Is the operand derived from a key, plaintext, nonce, or token? | True positive. |
| Can an attacker influence the operand's value? | True positive. |

A finding that cannot be traced to a secret is not a finding; say so explicitly rather than dropping it silently.

Weak-RNG and encoding findings ask a different question. For `Math.random`, `mt_rand`, `random.randint`, `System.Random`, and `base64_encode`, no operand is secret, so the operand question does not resolve them. Ask what the result is used for: seeding a nonce or key is a true positive; jittering a retry delay is not. These are reported by a source regex scan, so they are attributed to `<source>` with a line number rather than the enclosing function (except PHP, which carries the function).

Comparison and lookup findings have their own question and fix. For an early-exit comparison, ask whether either side is secret: comparing an authentication tag, MAC, or password hash is a true positive; comparing a public protocol header is not. For a table lookup, ask whether the index is secret; the array's contents do not matter, only what selects the element. Both are exploitable as written, so a confirmed finding needs the language's constant-time primitive (see `references/per-language-reference.md` Constant-time comparison primitives), not a loop rewrite.

Done when: every flagged instruction has a verdict (true positive, false positive, or untraced) with data-flow justification, and every weak-RNG, encoding, comparison, or lookup finding is classified by use or operand with the fix primitive named for confirmed findings.

### 5. State the verdict and re-run on fix

State which compiler, architecture, and optimization level produced each result when reporting it, since findings and silence both depend on the configuration. Every reported result names its compiler, architecture, and optimization level.

Re-run the whole sweep on any fix, across every configuration in the matrix. A fix that works by handing the compiler a constant divisor to strength-reduce is a fix only where the compiler cooperates, and that choice varies: gcc riscv64 emits a division at `O0` through `Oz`; gcc arm64 and gcc x86_64 at `Os`, `Oz`; clang arm64 at `O0`, `Oz`. Strength reduction is an optimizer courtesy, not a language guarantee. Prefer an explicit multiply-shift, and verify it against the original expression over the full input range rather than on sampled values; an off-by-a-power-of-two reciprocal matches for millions of inputs before it diverges.

Done when: every reported result names its configuration, and any fix is verified across the full matrix.

### 6. Build the runtime harness (runtime mode)

Create a scratch directory for the harness, compiled binary, and sample files. Write a C harness that defines `do_one_computation` calling the target function and `prepare_inputs` that assigns each measurement to a fixed input class or a random input class keyed on the secret. Compile the implementation under test unchanged into the harness with the production flags; never edit it to make it testable. Keep the four common violation patterns in view when choosing input classes: secret-dependent conditional branches, secret-dependent array access, variable-time integer division by a secret, and variable-time shifts by a secret.

Done when: the scratch directory exists and the implementation under test is compiled unchanged into the harness.

### 7. Run the statistical test (runtime mode)

Run the dudect harness for the measurement budget (5-10 minutes minimum; hours for high assurance). Pin the process to an isolated core (`taskset -c <cpu>`) to reduce OS noise. Read the Welch's t-test t-value: a high absolute t-value indicates timing leakage correlated with the secret.

Done when: the dudect harness runs for the budget and the t-value is read.

### 8. Run the dynamic trace (runtime mode)

If statistical testing detects leakage or a specific suspect site exists, mark only the true secret memory with `VALGRIND_MAKE_MEM_UNDEFINED` (poison), run the function under `valgrind --track-origins=yes`, then unpoison. Valgrind reports the exact line where a conditional jump or move depends on the secret. Mark only true secrets to avoid false positives.

Done when: the dynamic trace runs and reports secret-dependent operations or confirms none.

### 9. Calibrate the runtime result (runtime mode)

Test at the production optimization level, since leaks hidden at `-O0` may appear at `-O3`; on the target architecture, since x86 and ARM differ; and across the compiler versions and architectures the user supplied or that are accessible. Do not require calibration across compilers or architectures that were not supplied and are not installed. Confirm the compiler did not introduce or remove branches by inspecting assembly (`objdump -d`).

Done when: the result is calibrated across the supplied or accessible compiler versions and architectures.

### 10. Classify the runtime result (runtime mode)

If the Welch t-test yields p < 0.00001 (equivalently |t| > 4.5) or Valgrind reports a secret-dependent operation, report leakage with the site, the violated pattern, and the exercised configuration (compiler, flags, architecture, duration). If measurements are noisy or the t-value does not exceed the threshold after the budget, report a bounded inconclusive result: statistical testing gives confidence only over the exercised paths and inputs and cannot prove absence of leakage.

Done when: a leakage or bounded inconclusive classification is stated with the exercised configuration.

## Failure and recovery

- Missing toolchain or analyzer: stop, name the absent tool, and report no findings. Do not fabricate results.
- FAILED report: it is a worklist, not a verdict. Triage every item; never report raw analyzer output as a set of vulnerabilities.
- Untraced finding: classify it as untraced and state that explicitly. Do not silently drop a finding or assert it is safe without a data-flow justification.
- Single-configuration clean run: not proof. Require the full matrix sweep before claiming the code safe.
- Cross-arch build failure (missing target headers or cross binary): report the toolchain gap; do not silently substitute a different toolchain, and name the binary that ran.
- Noisy measurements or t-value never settles (runtime): do not declare clean. Extend the run, pin to an isolated core, minimize non-crypto code in the harness, and re-run. If still unsettled after the budget, return the bounded inconclusive result naming the configuration.
- Valgrind reports no secret-dependent operation but dudect flags leakage (runtime): microarchitecture timing (cache, division, shifts) may not be visible to Valgrind. Report the statistical evidence and note the dynamic trace covered only executed paths.
- Harness fails to compile or the function cannot be isolated (runtime): stop; report the blocker and the attempted configuration. Do not edit the implementation under test to make it testable.
- No mutation of the implementation under test occurs on any error. The only artifacts are local intermediate compiler output and, in runtime mode, the scratch directory, which may be discarded.

## Output

Static mode: per-configuration report (`PASSED` with warnings listed separately, or `FAILED` with flagged instructions per function), each naming compiler, architecture, and optimization level; every flagged instruction carries a verdict (true positive, false positive, or untraced) with data-flow justification. Runtime mode: one of leakage detected (leak site, violated pattern, tool and signal, exercised configuration) or bounded inconclusive (exercised configuration named, statistical testing covers only exercised paths and inputs).
