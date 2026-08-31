---
name: constant-time-analysis
description: 'Use when reviewing cryptographic code for timing side-channels (C, C++, Go, Rust, Swift, Java, Kotlin, C#, PHP, JS, TS, Python, Ruby). Statically inspects assembly or VM bytecode for secret-dependent variable-time ops. Not for runtime timing tests — use constant-time-testing.'
---

# Constant-time analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs static inspection of compiled assembly or VM bytecode for secret-dependent variable-time operations across supported languages. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Compiling and disassembling produce only local intermediate artifacts used to read emitted instructions; discard them after analysis. |
| Side effect | A compiler or bytecode analyzer report read from local toolchain output. |
| Done | The analyzer runs with warnings for the relevant configuration and every reported instruction is traced to secret or public data before verdict. |

## Inputs

- Source file or directory to analyze (must be supplied).
- Target language, inferred from file extension or supplied.
- Optional: function-name regex to narrow scope; target architecture (`x86_64`, `arm64`, `riscv64`, ...); optimization level (`O0`-`O3`, `Os`, `Oz`); compiler override (`gcc`, `clang`, `go`, `rustc`, `swiftc`).

## Procedure

1. Confirm the target handles secret data - a key, plaintext, nonce, or token. If every input is public, stop: there is no constant-time concern. This skill inspects compiler output statically and never executes the code under test; cache and other microarchitectural side channels are invisible to it. Done when: secret data is confirmed present or the skill stops with no constant-time concern.
2. Detect the language from the file extension and confirm the required toolchain is installed (see `references/per-language-reference.md` Prerequisites). On a missing toolchain, stop and name the absent tool. Done when: the language is detected and the toolchain is confirmed or the absent tool is named.
3. Run the constant-time analyzer over each source file with warning-severity detection enabled (`--warnings`). Without it only error-severity findings are reported - division, modulo, and weak RNG - and four warning-severity families stay silent: secret-dependent branches, early-exit comparison (`memcmp`, `strcmp`, `.equals`, `==`), table lookups indexed by a secret, and variable-time encoding. Early-exit comparison of an authentication tag is the most common timing bug in real code, so a default run is quiet about the finding most likely to be present.

   | Flag | Effect |
   |---|---|
   | `--warnings` | Add the four warning-severity families. Pass it every time. |
   | `--func <regex>` | Restrict output to function names matching the regex. |
   | `--json` | Machine-readable output. |
   | `--arch <target>` | Target architecture - native languages only. |
   | `--opt-level <level>` | Optimization level - native languages only. |
   | `--compiler <name>` | Override compiler choice. |

   Narrow a large file to the routines that handle secrets, e.g. `--func 'sign|verify'`.
   Done when: the analyzer runs with `--warnings` over every source file.
4. For native languages (C, C++, Go, Rust, Swift), run at more than one `--arch` and `--opt-level`, including `Os` and `Oz`. Division timing and branch lowering are architecture- and optimization-dependent: x86_64 `IDIV` and arm64 `SDIV` differ, and a `cmov` at `-O2` can become a branch at `-O0`. A single clean run proves one configuration safe, not the code. Cross-arch toolchains differ: clang crosses with `--target` and needs the target's C library headers or fails with `bits/libc-header-start.h file not found`; Go cross-builds through `GOARCH` but `go tool objdump` has no riscv64 disassembler; gcc needs a named cross binary (`--compiler x86_64-linux-gnu-gcc`, `--compiler riscv64-linux-gnu-gcc`) and nothing is substituted automatically; rustc needs the target's standard library (`rustup target add`); Swift on Linux targets only the host. Compare against the toolchain that builds the product, not whichever cross build a distribution packages. Done when: every arch and opt-level combination is run or the toolchain gap is named.
5. For JVM/CIL languages (Java, Kotlin, C#), `--arch` and `--opt-level` do not apply: the analyzer reads bytecode, and the JIT may still introduce variable-time native code the analyzer cannot see. Done when: the JVM/CIL limitation is stated and bytecode analysis is run.
6. Apply the per-language coverage limits when interpreting findings and silence. See `references/per-language-reference.md` Coverage limits. Done when: every finding is interpreted with its language's coverage limits applied.
7. Triage every flagged instruction. The analyzer has no data flow analysis and flags every dangerous instruction regardless of whether a secret reaches it, so a FAILED report is a worklist, not a verdict. For each flagged instruction, read the source and trace from the instruction's function back to the caller's inputs, then classify:

   | Question | If yes |
   |---|---|
   | Is the operand a compile-time constant? | Likely false positive. |
   | Is the operand a public parameter - length, count, index bound? | Likely false positive. |
   | Is the operand derived from a key, plaintext, nonce, or token? | True positive. |
   | Can an attacker influence the operand's value? | True positive. |

   State the verdict and the data flow that justifies it for every flagged item. A finding that cannot be traced to a secret is not a finding - say so explicitly rather than dropping it silently.
   Done when: every flagged instruction has a verdict (true positive, false positive, or untraced) with data-flow justification.
8. Weak-RNG and encoding findings ask a different question. For `Math.random`, `mt_rand`, `random.randint`, `System.Random`, and `base64_encode`, no operand is secret, so the operand question does not resolve them. Ask what the result is used for: seeding a nonce or key is a true positive; jittering a retry delay is not. These are reported by a source regex scan, so they are attributed to `<source>` with a line number rather than the enclosing function (except PHP, which carries the function). Done when: every weak-RNG or encoding finding is classified by use, not by operand.
9. Comparison and lookup findings have their own question and fix. For an early-exit comparison, ask whether either side is secret: comparing an authentication tag, MAC, or password hash is a true positive; comparing a public protocol header is not. For a table lookup, ask whether the index is secret - the array's contents do not matter, only what selects the element. Both are exploitable as written, so a confirmed finding needs the language's constant-time primitive (see `references/per-language-reference.md` Constant-time comparison primitives), not a loop rewrite. Done when: every comparison or lookup finding is classified and the fix primitive is named for confirmed findings.
10. Re-run the whole sweep on any fix, across compilers, targets, and every level including `Os` and `Oz`. A fix that works by handing the compiler a constant divisor to strength-reduce is a fix only where the compiler cooperates, and that choice varies: gcc riscv64 emits a division at `O0` through `Oz`; gcc arm64 and gcc x86_64 at `Os`, `Oz`; clang arm64 at `O0`, `Oz`. Strength reduction is an optimizer courtesy, not a language guarantee. Prefer an explicit multiply-shift, and verify it against the original expression over the full input range rather than on sampled values - an off-by-a-power-of-two reciprocal matches for millions of inputs before it diverges. Done when: the full sweep re-runs on every fix and the fix holds across all configurations.
11. State which compiler, architecture, and optimization level produced each result when reporting it, since findings and silence both depend on the configuration. Done when: every reported result names its compiler, architecture, and optimization level.

## Failure and recovery
- Missing toolchain or analyzer: stop, name the absent tool, and report no findings. Do not fabricate results.
- FAILED report: it is a worklist, not a verdict. Triage every item; never report raw analyzer output as a set of vulnerabilities.
- Untraced finding: classify it as untraced and state that explicitly. Do not silently drop a finding or assert it is safe without a data-flow justification.
- Single-configuration clean run: not proof. Require the multi-arch, multi-opt-level sweep before claiming the code safe.
- Cross-arch build failure (missing target headers or cross binary): report the toolchain gap; do not silently substitute a different toolchain, and name the binary that ran.
- No mutation occurs on any error. The only artifacts are local intermediate compiler output, which may be discarded.

## Output
Per-configuration report (`PASSED` with warnings listed separately, or `FAILED` with flagged instructions per function), each naming compiler, architecture, and optimization level. Every flagged instruction carries a verdict (true positive, false positive, or untraced) with data-flow justification.

## Provenance

- Origin: https://github.com/trailofbits/skills, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`, file `/plugins/constant-time-analysis/skills/constant-time-analysis/SKILL.md`.
- License: CC-BY-SA-4.0. Preserve Trail of Bits attribution and the source link; mark modifications; license adaptations ShareAlike; claim no trademark rights; never reuse `trail-of-bits-mark.svg` as branding.
- Adaptation: clean-room adaptation to self-contained form. Preserved the static compiler-output inspection mechanism, the error- and warning-severity detector families, the multi-architecture/optimization sweep, the no-data-flow triage to secret or public operands, the per-language coverage limits, and the constant-time comparison and lookup fix primitives. Removed references to non-shipped reference guides and to other skills or plugins. Per-language coverage limits, constant-time comparison primitives, and prerequisites moved to `references/per-language-reference.md`.
