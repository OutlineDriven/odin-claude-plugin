---
name: zeroize-audit
description: 'Use when auditing C, C++, or Rust secret-handling code for missing, partial, path-dependent, copied, retained, register-spilled, or compiler-eliminated zeroization with build context available. Produces findings JSON and a Markdown report. Not for test vectors — use wycheproof.'
---

# Zeroize audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to audit C, C++, or Rust code that handles keys, passwords, tokens, PII, or other secrets for missing, partial, path-dependent, copied, heap-retained, stack-retained, register-spilled, or compiler-eliminated zeroization, and a compile_commands.json or Cargo.toml build context is available. |
| Authority | Reversible-local: target repository is read-only; only the temporary audit directory is written; rollback by deleting that directory. |
| Side effect | Reads the target repository without modifying it; executes captured compilation, cargo, LLVM/MIR/assembly, MCP, and generated PoC/test commands; writes schemas, intermediate evidence, generated PoCs/tests, findings.json, and final-report.md under a dedicated temporary audit directory. |
| Done | A final Markdown report and schema-valid findings JSON exist; every finding carries its required source/MCP/IR/assembly/CFG evidence and confidence gate, all source/compiler phases and known coverage gaps are accounted for, and each supported finding has a compiled/run and semantically verified PoC result or an explicit unsupported/failure status. |

## Inputs

- **Target repository path** (required): root of the codebase to audit.
- **Build context** (required): path to compile_commands.json for C/C++ or Cargo.toml for Rust.
- **Scope** (optional): specific files or directories to limit the audit; defaults to the full repository.

## Procedure

1. Create a dedicated temporary audit directory. Validate that the build context exists and is parseable. If missing or unparseable, stop and report the prerequisite. Done when: the audit directory is created and the build context is validated.
2. Discover source files that handle secrets. Search for key, password, token, secret, and PII identifiers; cryptographic operations (encrypt, decrypt, sign, derive); and explicit zeroization calls (memset, explicit_bzero, SecureZeroMemory, zeroize, Zeroize). Record every candidate with its file path and line range. Done when: every candidate secret-handling file is recorded with its path and line range.
3. Analyze each candidate at the source level. Identify the zeroization call or its absence, determine its scope (local variable, struct field, heap allocation), detect path-dependent zeroization (zeroed only on some branches), and flag copies or moves of sensitive data that may retain the original. Done when: every candidate is analyzed for zeroization presence, scope, path-dependence, and copies.
4. Compile translation units or run cargo build to capture compiler artifacts. For C/C++, emit LLVM IR (-emit-llvm -S) and inspect the relevant functions. For Rust, emit MIR (--emit=mir) and assembly (--emit=asm). Record the exact compiler invocation and flags. Done when: compiler artifacts are captured with the exact invocation and flags recorded.
5. Analyze compiler artifacts. Verify that zeroization calls emit memset or equivalent instructions, check for dead-store elimination or optimization that removes zeroization, examine register spills that retain sensitive values beyond their intended lifetime, and inspect heap deallocation paths for missing zero-before-free. Done when: every compiler artifact is analyzed for elimination, spills, and heap deallocation paths.
6. Run MCP (model-checking/pointer-analysis) if available to detect cross-function data flow and retention patterns invisible to source-level analysis alone. Record MCP tool, version, configuration, and findings. Done when: MCP is run (or reported unavailable) with tool, version, configuration, and findings recorded.
7. Generate a proof of concept for each finding: a minimal C/C++/Rust program that demonstrates the missing or eliminated zeroization. Compile the PoC with the same toolchain and flags. Run it and capture the output. Verify that the PoC output demonstrates the claimed vulnerability, such as sensitive bytes remaining readable after deallocation or zeroization being absent from assembly. Record the PoC source, compilation command, runtime output, and verification verdict. Done when: every finding has a PoC with source, compilation, runtime output, and verification verdict.
8. Generate regression tests for each finding: tests that would catch the zeroization issue. Compile and run them to confirm they fail on current code and would pass with the fix. Done when: every finding has a regression test that fails on current code.
9. Assemble findings.json: each finding contains id, severity, file, line range, description, evidence class (source, IR, assembly, CFG, MCP), confidence level (high/medium/low), PoC status (pass/fail/unsupported/failure), coverage gap flag, and recommendation. Done when: findings.json is assembled with all required fields per finding.
10. Assemble final-report.md: executive summary, per-finding detail with all evidence, coverage gaps (files or translation units that could not be compiled or analyzed), compiler version and flags, and prioritized remediation recommendations. Done when: final-report.md is assembled with executive summary, per-finding detail, coverage gaps, compiler info, and remediation recommendations.

## Failure and recovery
- **Missing build context**: stop immediately; report the missing prerequisite (compile_commands.json or Cargo.toml) and do not proceed.
- **Compilation failure for specific translation units**: record the compiler error as a coverage gap; continue with compilable units.
- **PoC compilation failure**: mark the finding's PoC status as unsupported with the compiler error; the finding retains source and IR evidence but confidence is downgraded.
- **PoC runtime failure**: mark PoC status as failure with the runtime error; confidence is downgraded.
- **PoC does not demonstrate expected behavior**: record the actual PoC output; re-evaluate the finding and adjust confidence or reclassify.
- **Ambiguous zeroization presence**: report as uncertain with the specific evidence that is ambiguous; do not assert presence or absence.
- Partial results are valid when each finding carries its evidence class and confidence gate. The target repository is never modified; rollback is deletion of the temporary audit directory.

## Output
`findings.json` (schema-valid array with evidence, confidence, and PoC status per finding) and `final-report.md` (executive summary, per-finding detail, coverage gaps, remediation); both under the temporary audit directory with intermediate evidence and PoC sources.

## Provenance

Adapted from Trail of Bits zeroize-audit skill (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3). Licensed CC-BY-SA-4.0. Trail of Bits attribution and source link preserved; this adaptation is marked as modified. Modifications: consolidated multi-agent carrier into a single self-contained procedure while preserving all evidence-gated observable contracts (source estimates, semantic context, compiler artifacts, hard-evidence classes, coverage gaps, PoC runtime and semantic-verification outputs). No trademark rights claimed; trail-of-bits-mark.svg not reused as branding.
