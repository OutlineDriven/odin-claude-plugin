---
name: rust-security-review
description: 'Use when asked for a Rust security or correctness audit of a crate, service, or library with unsafe, FFI, concurrency, async, or untrusted-input code. Not for general review: use security-review.'
---

# Rust security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a security or correctness audit of a Rust crate, service, library, or Rust subtree, especially code using unsafe blocks, FFI, concurrency, async runtimes, or untrusted inputs. |
| Authority | Reversible local: writes only named local artifacts (review directory, findings, SARIF); rollback is deleting the review directory. No remote mutation. Source analysis is read-only. |
| Side effect | Read project source, run read-only searches, and write a scoped findings report and SARIF artifacts without changing audited production code. |
| Done | Every capability-selected review cluster has a recorded outcome, duplicate and false-positive judging completed or explicitly marked partial, and final Markdown and SARIF reports identify scope, coverage, surviving findings, severity, and incomplete workers. |

## Inputs

| Input | Required | Description |
|---|---|---|
| `source_path` | Yes | Path to the Rust project root, crate, or subtree to audit. Must exist and contain Rust source files. |
| `scope` | No | Subset of the source to prioritize: specific crates, modules, or directories within the workspace. Defaults to the full workspace. |
| `capability_level` | No | Controls which analysis clusters run: `minimal` (critical only), `standard` (default, common vulnerability classes), `deep` (exhaustive including research-grade patterns). |

## Procedure

1. Validate `source_path`. It must point to a directory that exists and is readable. If it does not, stop before any write. Expand to the workspace root if `Cargo.toml` is found at or above it. Record this as the effective workspace root. Done when: the source path is validated and the workspace root is recorded.

2. Create a review directory as a sibling to the source root or in a temp location. If creation fails, stop. Done when: the review directory exists and is empty.

3. Identify Rust source files in scope. If none exist, stop. No report is written. Done when: Rust source files are enumerated or the absence is confirmed and reported.

4. Load the cluster and finder definitions for the capability level from `references/clusters.md`. That file contains: the cluster list for each capability level, per-cluster search terms and finding criteria, the worker report JSON schema, the dedup identity rule, the false-positive proof standard, and the SARIF conversion mapping. Standard capability includes: unsafe-boundary, memory-safety, concurrency-data-race, concurrency-locking, async-runtime, ffi-cross-language, input-os-safety, layout-safety, logic-correctness, error-handling, panic-dos, recursion-dos, resource-handling, info-disclosure, static-hygiene. Deep adds the finders listed in the reference file. Done when: the cluster list for the capability level is loaded.

5. Dispatch each cluster to an independent review worker. Each worker reads the cluster criteria from `references/clusters.md`, runs the targeted searches over the source, records findings in the worker report JSON schema, and writes a worker report to the review directory. A worker that finds nothing writes a report with an empty `findings` array and `status: "complete"`. A worker that crashes writes `status: "failed"` with an empty `findings` array. Done when: every cluster worker has completed or reported failure.

6. Dispatch a dedup judge over all worker findings. The dedup judge reads every worker report, groups findings by the dedup identity `(file, line, class)` triple, and writes a dedup report listing one surviving finding per group with the source worker noted. If the dedup judge fails or produces no output, mark the review partial and continue with unfiltered findings. Done when: the dedup report is written or the judge failure is recorded.

7. Dispatch a false-positive judge over all non-deduplicated findings. The false-positive judge reads each finding, checks the cited evidence against the source, and classifies it as `true-positive` or `false-positive` per the proof standard in `references/clusters.md`: a finding is a false positive only when the reviewer can cite a `path:line` where the code establishes the safety invariant the finding claims is missing. A finding without a cited mitigation is a true positive; absence of a mitigation is not proof of safety. If the false-positive judge fails or produces no output, mark the review partial and continue with all non-deduplicated findings as surviving. Done when: the false-positive report is written or the judge failure is recorded.

8. Merge all surviving findings into a final findings list. Generate `findings.sarif` (SARIF 2.1.0) from the final findings using the conversion mapping in `references/clusters.md`. If SARIF generation fails, write the Markdown report with a warning and do not fabricate SARIF. Done when: `findings.sarif` is written or the failure is recorded.

9. Assemble `report.md` with: scope (what was audited), coverage (which clusters ran and their outcomes), severity classification, surviving findings organized by severity, and any incomplete workers or judges. Write it to the review directory. Done when: `report.md` is written.

10. Return the review directory path. Done when: the path is returned.

Rollback path: delete the review directory.

## Failure and recovery

| Failure class | Response |
|---|---|
| Source inaccessible | Stop before any write. No report. |
| Review directory creation fails | Stop. No report. |
| No Rust source files in scope | Stop. No report. State what was searched. |
| Cluster worker fails or produces no output | Log failure, mark that worker incomplete in the report, continue with remaining workers. |
| Dedup judge fails or produces no output | Mark review partial. Continue with unfiltered findings. |
| False-positive judge fails or produces no output | Mark review partial. Continue with all non-deduplicated findings as surviving. |
| SARIF generation fails | Write `report.md` with a warning noting SARIF is absent. Do not fabricate SARIF. |

Partial-result rule: `report.md` is always written when the review directory is created and at least one worker ran. The report header records whether the review is complete or partial and names each incomplete worker or judge. When no Rust source files exist, no report is written because the review never started.

## Output

A review directory containing:

- `report.md`: Markdown findings report identifying scope, coverage, severity classifications, all surviving findings, and incomplete workers or judges.
- `findings.sarif`: SARIF 2.1.0 output for integration with security tooling, when generation succeeded.

The Markdown report always identifies: what was audited, how much was covered, all surviving findings organized by severity, and any workers or judges that did not complete.
