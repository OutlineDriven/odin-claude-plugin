---
name: rust-security-review
description: 'Use when the user requests a security or correctness audit of a Rust crate, service, library, or subtree, especially unsafe, FFI, concurrency, async, or untrusted-input code. Writes scoped findings and SARIF. Not for a general security audit — use security-review.'
---

# Rust security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a security or correctness audit of a Rust crate, service, library, or Rust subtree, especially code using unsafe blocks, FFI, concurrency, async runtimes, or untrusted inputs. |
| Authority | reversible-local: read-only source analysis; write only named local artifacts (review directory, findings, SARIF); state the rollback path. |
| Side effect | Read project source, run read-only searches and analysis helpers, and write a scoped findings report and SARIF artifacts without changing audited production code. |
| Done | Every capability-selected review cluster has a recorded outcome, duplicate and false-positive judging completed or is explicitly marked partial, and final Markdown and SARIF reports identify scope, coverage, surviving findings, severity, and incomplete workers. |

## Inputs

| Input | Required | Description |
|---|---|---|
| source_path | required | Path to the Rust project root, crate, or subtree to audit. Must exist and contain Rust source files. |
| scope | optional | Subset of the source to prioritize: specific crates, modules, or directories within the workspace. Defaults to the full workspace. |
| capability_level | optional | Controls which analysis clusters run: \`minimal\` (critical only), \`standard\` (default, common vulnerability classes), \`deep\` (exhaustive including research-grade patterns). |

## Procedure

1. Validate the source path. It must point to a directory that exists and is readable. If it does not, stop.
2. Expand the source path to a workspace root if Cargo.toml is found at or above it. Record this as the effective workspace root.
3. Acquire a review directory path as a sibling to the source root or in a temp location. Create it empty. If creation fails, stop.
4. Identify Rust source files in scope. If none exist, stop.
5. Load the cluster list and general finder list for the capability level. Standard capability includes: unsafe-boundary, memory-safety, concurrency-data-race, concurrency-locking, async-runtime, ffi-cross-language, input-os-safety, layout-safety, logic-correctness, error-handling, panic-dos, recursion-dos, resource-handling, info-disclosure, static-hygiene clusters. Deep adds: arithmetic-overflow, buffer-overflow-unsafe, closure-ffi, closure-panic, destructor-skip, double-free, drop-panic, dyn-trait-ffi, foreign-drop, invalid-free, out-of-bounds-index, panic-unwind-unsafe, pointer-exposure, refcell-borrow-panic, repr-c-padding, send-sync-bounds, uninitialized-read, unsafe-sync-impl, use-after-free, vec-set-len-uninit finders.
6. Dispatch each cluster to an independent review worker. Each worker reads the cluster prompt, runs targeted searches over the source, records findings, and writes a worker report to the review directory.
7. After all cluster workers complete or report failure, dispatch a dedup judge over all findings. It reads every worker report, identifies findings that describe the same defect, and writes a dedup report to the review directory.
8. Dispatch a false-positive judge over all non-deduplicated findings. It reads the dedup report, classifies each finding as true positive or false positive, and writes an fp report to the review directory.
9. Merge all surviving findings from the fp judge into a final findings list. If the dedup or fp judge failed or produced no output, mark the review partial.
10. Generate a SARIF file from the final findings list and write it to the review directory.
11. Assemble the primary Markdown report with the scope, coverage, severity classification, surviving findings, and any incomplete workers. Write it to the review directory.
12. Return the review directory path.

Rollback path: delete the review directory.

## Failure and recovery
| Failure class | Response |
|---|---|
| Source inaccessible | Stop before any write. |
| Review directory creation fails | Stop. |
| Cluster worker fails or produces no output | Log failure, mark that worker incomplete in the review log, continue with remaining workers. |
| Dedup judge fails or produces no output | Mark review partial. |
| FP judge fails or produces no output | Mark review partial. |
| No Rust source files in scope | Mark review partial; write partial Markdown and SARIF. |
| SARIF generation fails | Write Markdown report with a warning; do not fabricate SARIF. |

Partial-result rule: the Markdown report and SARIF file are always written when the review directory is created. The report header records whether the review is complete or partial and names each incomplete worker.

## Output
A review directory containing:

- \`report.md\`: Markdown findings report identifying scope, coverage, severity classifications, all surviving findings, and incomplete workers.
- \`findings.sarif\`: SARIF 2.1.0 output for integration with security tooling.

The Markdown report always identifies: what was audited, how much was covered, all surviving findings organized by severity, and any workers that did not complete.
