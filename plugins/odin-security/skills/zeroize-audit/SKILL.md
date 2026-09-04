---
name: zeroize-audit
description: 'Use when auditing C, C++, or Rust secret-handling code to verify zeroization survives compiler optimization. Not for test vectors: use wycheproof.'
---

# Zeroize audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to audit C, C++, or Rust code that handles keys, passwords, tokens, PII, or other secrets for missing, partial, path-dependent, copied, retained, register-spilled, or compiler-eliminated zeroization, and a compile_commands.json or Cargo.toml build context is available. |
| Authority | Reversible local: writes only audit artifacts and reports to a temporary directory; rollback is deleting the temporary directory. No remote mutation. The target repository is read-only. |
| Side effect | Reads the target repository without modifying it. Executes captured compilation, cargo, and LLVM/MIR/assembly emission commands. Writes intermediate evidence, generated PoCs, findings.json, and final-report.md under a dedicated temporary audit directory. |
| Done | findings.json and final-report.md exist in the temporary directory, every finding carries its source and compiler-artifact evidence with a confidence level, and all source/compiler phases and known coverage gaps are accounted for. |

## Inputs

- Target repository path (required): root of the codebase to audit.
- Build context (required): path to `compile_commands.json` for C/C++ or `Cargo.toml` for Rust.
- Scope (optional): specific files or directories to limit the audit; defaults to the full repository.

## Procedure

1. **Discover candidate secret-handling code paths via source heuristics.** Create a dedicated temporary audit directory. Validate that the build context exists and is parseable. If missing or unparseable, halt with failure state `missing-build-context`. Search the target repository for secret-handling identifiers: key, password, token, secret, PII; cryptographic operations (encrypt, decrypt, sign, derive); and explicit zeroization calls (memset, explicit_bzero, SecureZeroMemory, zeroize, Zeroize). Record every candidate with its file path and line range. Done when: every candidate secret-handling file is recorded with its path and line range.

2. **Intercept the build to emit optimized compiler artifacts for candidate units.** For C/C++, use the compile_commands.json entries for candidate translation units and emit LLVM IR with `-emit-llvm -S` at the optimization level the project uses (typically `-O2` or `-O3`). For Rust, emit MIR with `--emit=mir` and assembly with `--emit=asm` for candidate crates. Record the exact compiler invocation, flags, and optimization level. If compilation fails for a specific unit, record the compiler error as a coverage gap and continue with the units that compiled. Done when: compiler artifacts are captured for every compilable candidate unit with the exact invocation and flags recorded.

3. **Analyze the emitted artifacts to trace sensitive values and prove whether zeroization instructions persist.** For each candidate unit, inspect the emitted IR, MIR, or assembly:
   - Verify that zeroization calls (memset, explicit_bzero, zeroize) emit the corresponding store instructions in the optimized output.
   - Check for dead-store elimination: the compiler may remove a store to a stack variable that is never read again. Compare the optimized output against `-O0` output to detect eliminated stores.
   - Examine register spills: determine whether sensitive values are spilled to the stack and whether the spill location is zeroed before the function returns.
   - Inspect heap deallocation paths: check whether memory is zeroed before free, or whether the deallocator itself zeroizes.
   - Detect path-dependent zeroization: zeroing that occurs only on some branches, leaving sensitive data unzeroed on other paths.
   - Flag copies or moves of sensitive data that may retain the original in a location that is not zeroed.
   Done when: every compiler artifact is analyzed for elimination, spills, heap deallocation, path-dependence, and copies.

4. **Attempt to generate a safe PoC that dumps residual memory prior to deallocation or flags absent instructions.** For each finding, write a minimal C/C++/Rust program that demonstrates the missing or eliminated zeroization without invoking undefined behavior. The PoC must read residual memory from a stack or heap location after the function returns but before the memory is reused or deallocated, using only well-defined operations such as reading through a pointer to memory the program still owns. Compile the PoC with the same toolchain and flags as the target. Run it and capture the output. If the PoC cannot be constructed without undefined behavior, or if compilation or execution fails, downgrade the finding's confidence and record the PoC status as `unsupported` or `failure`. Done when: every finding has a PoC with source, compilation command, runtime output, and verification verdict, or an explicit unsupported/failure status.

5. **Assemble a structured JSON dataset and Markdown report correlating source lines with optimization-level evidence.** Write `findings.json`: each finding contains id, severity, file, line range, description, evidence class (source, IR, MIR, assembly), confidence level (high/medium/low), PoC status (pass/fail/unsupported/failure), coverage gap flag, and recommendation. Write `final-report.md`: executive summary, per-finding detail with all evidence and the optimization level at which the zeroization was eliminated or retained, coverage gaps (files or translation units that could not be compiled or analyzed), compiler version and flags, and prioritized remediation recommendations. Done when: `findings.json` and `final-report.md` exist in the temporary directory with all required fields per finding.

## Failure and recovery

- Missing build context: halt immediately. Report the missing prerequisite (`compile_commands.json` or `Cargo.toml`) and do not proceed.
- Compilation failure for specific translation units: record the compiler error as a coverage gap. Continue with compilable units. Do not modify the target repository to fix compilation.
- PoC compilation failure: mark the finding's PoC status as `unsupported` with the compiler error. The finding retains source and IR evidence but confidence is downgraded.
- PoC runtime failure: mark PoC status as `failure` with the runtime error. Confidence is downgraded.
- PoC requires undefined behavior to demonstrate the issue: do not construct the PoC. Mark PoC status as `unsupported` with reason `requires-undefined-behavior`. Rely on compiler-artifact evidence instead.
- Ambiguous zeroization presence: report as uncertain with the specific evidence that is ambiguous. Do not assert presence or absence.

Partial results are valid when each finding carries its evidence class and confidence gate. The target repository is never modified; rollback is deletion of the temporary audit directory.

## Output

`findings.json` (schema-valid array with evidence, confidence, and PoC status per finding) and `final-report.md` (executive summary, per-finding detail with optimization-level evidence, coverage gaps, compiler info, and remediation), both under the temporary audit directory with intermediate evidence and PoC sources.
