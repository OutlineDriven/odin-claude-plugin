---
name: zeroize-audit
description: 'Use when asked to audit C, C++, or Rust code handling secrets for missing, partial, path-dependent, copied, heap-retained, stack-retained, register-spilled, or compiler-eliminated zeroization when a build context is available. Produce a findings JSON with per-finding source, IR, assembly, CFG, MCP, and PoC evidence plus a final Markdown report. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Create a dedicated temporary audit directory. Validate that the build context exists and is parseable. If missing or unparseable, stop and report the prerequisite.
2. Discover source files that handle secrets. Scan for patterns: key, password, token, secret, PII identifiers, cryptographic operations (encrypt, decrypt, sign, derive), and explicit zeroization calls (memset, explicit_bzero, SecureZeroMemory, zeroize, Zeroize). Record every candidate with file path and line range.
3. For each candidate, perform source-level analysis: identify the zeroization call or its absence, determine scope (local variable, struct field, heap allocation), detect path-dependent zeroization (zeroed only on some branches), and flag copies or moves of sensitive data that may retain the original.
4. Compile translation units or run cargo build to capture compiler artifacts. For C/C++: emit LLVM IR (-emit-llvm -S) and inspect the relevant functions. For Rust: emit MIR (--emit=mir) and assembly (--emit=asm). Record the exact compiler invocation and flags used.
5. Analyze compiler artifacts: verify zeroization calls emit memset or equivalent instructions, check for dead-store elimination or optimization that removes zeroization, examine register spilling that retains sensitive values beyond their intended lifetime, and inspect heap deallocation paths for missing zero-before-free.
6. Run MCP (model-checking/pointer-analysis) if available to detect cross-function data flow and retention patterns invisible to source-level analysis alone. Record MCP tool, version, configuration, and findings.
7. For each finding, generate a proof-of-concept: a minimal C/C++/Rust program that demonstrates the missing or eliminated zeroization. Compile the PoC with the same toolchain and flags. Run it and capture output. Perform semantic verification: confirm the PoC output demonstrates the claimed vulnerability (e.g., sensitive bytes readable after deallocation, zeroization absent from assembly). Record PoC source, compilation command, runtime output, and verification verdict.
8. Generate regression tests for each finding: tests that would catch the zeroization issue. Compile and run them to confirm they fail on current code and would pass with the fix.
9. Assemble findings.json: each finding contains id, severity, file, line range, description, evidence class (source, IR, assembly, CFG, MCP), confidence level (high/medium/low), PoC status (pass/fail/unsupported/failure), coverage gap flag, and recommendation.
10. Assemble final-report.md: executive summary, per-finding detail with all evidence, coverage gaps (files or translation units that could not be compiled or analyzed), compiler version and flags, and prioritized remediation recommendations.

## Failure and recovery
- **Missing build context**: stop immediately; report the missing prerequisite (compile_commands.json or Cargo.toml) and do not proceed.
- **Compilation failure for specific translation units**: record the failure as a coverage gap with the compiler error; continue with compilable units.
- **PoC compilation failure**: mark the finding's PoC status as unsupported with the compiler error; the finding retains source and IR evidence but confidence is downgraded.
- **PoC runtime failure**: mark PoC status as failure with the runtime error; confidence is downgraded.
- **PoC does not demonstrate expected behavior**: record the actual PoC output; re-evaluate the finding and adjust confidence or reclassify.
- **Ambiguous zeroization presence**: report as uncertain with the specific evidence that is ambiguous; do not assert presence or absence.
- Partial results are valid when each finding carries its evidence class and confidence gate. The target repository is never modified; rollback is deletion of the temporary audit directory.

## Output
- findings.json: schema-valid JSON array of findings with all evidence, confidence, and PoC status.
- final-report.md: Markdown report with executive summary, per-finding detail, coverage gaps, and remediation recommendations.
- Temporary audit directory containing all intermediate evidence, PoC sources, and test files.

## Provenance

Adapted from Trail of Bits zeroize-audit skill (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3). Licensed CC-BY-SA-4.0. Trail of Bits attribution and source link preserved; this adaptation is marked as modified. Modifications: consolidated multi-agent carrier into a single self-contained procedure while preserving all evidence-gated observable contracts (source estimates, semantic context, compiler artifacts, hard-evidence classes, coverage gaps, PoC runtime and semantic-verification outputs). No trademark rights claimed; trail-of-bits-mark.svg not reused as branding.
