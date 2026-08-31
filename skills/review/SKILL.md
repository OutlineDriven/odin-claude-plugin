---
name: review
description: 'Use when a user asks to review a pull request or examine code changes, produce a structured review report with severity-graded validated findings, each with concrete fix recommendations. Don''t use for tasks that require source or remote-system changes.'
---

# Severity graded review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review a pull request, examine code changes, or provide feedback on code quality |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Chat output: produces a review report with findings |
| Done | Validated findings with severity, evidence, and concrete fixes; no style-only findings |

## Inputs

Required: a PR URL, diff content, or code snippet to review.

Optional: a stated focus area (e.g., security, performance, correctness).

The skill operates entirely within the current session context. No file system, repository, credential, or remote access is required or authorized.

## Procedure

1. **Acquire diff.** Receive the PR URL, diff text, or code snippet from the user. If no code change is supplied, ask for it.
2. **Fetch changes.** Use the available tools to retrieve diff or file content for the target revision range. Do not assume write access.
3. **Bound scope.** Limit analysis to the supplied diff or code range. Do not widen scope to surrounding code or unrelated files.
4. **Categorize findings.** Assign each finding to one of: Correctness, Security, Performance, Maintainability, Robustness, Logic, or API Usage.
5. **Grade severity.** Assign one severity level to each finding:
   - **Critical**: exploitable bug, data loss, or security vulnerability with no workaround
   - **High**: significant bug, regression risk, or breach of contract without mitigation
   - **Medium**: correctness concern, degraded performance, or maintainability debt
   - **Low**: minor issue, cosmetic concern, or opportunity for improvement
6. **Validate findings.** Each finding must cite specific code locations, line ranges, or diff hunk markers as evidence. Do not assert a finding without quoting the supporting code.
7. **Reject style-only findings.** Do not report formatting, naming conventions, or cosmetic preferences unless they cause a correctness or security issue.
8. **Prescribe concrete fixes.** For each finding, write a specific, actionable recommendation that addresses the root cause, not a surface-level patch.
9. **Assemble report.** Structure findings as: Severity → Category → Finding → Evidence → Recommended Fix. Sort by severity descending.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `empty-diff` | No diff or code supplied | Ask the user for the PR or code to review; do not produce a report |
| `review-blocked` | Cannot access the target PR or revision | Report the access failure explicitly; do not fabricate content |
| `partial-result` | Some files or hunks are inaccessible | List accessible findings; state which parts were skipped and why |
| `scope-widening` | Analysis extends beyond supplied diff | Discard widened findings; report only bounded results |
| `style-only-report` | All findings are style-only | State that no actionable findings were found; describe what was evaluated |

## Output
A structured review report returned as chat output. One section per severity level (Critical, High, Medium, Low), each containing:

- **Severity** and **Category**
- **Finding**: the specific issue with code location and evidence
- **Recommended Fix**: concrete, actionable correction

Unsuitable scope is reported as a named failure. An empty diff or inaccessible PR is reported as a named failure. The report must not contain findings without cited evidence.

## Provenance

Origin: `getsentry/skills` (Apache-2.0), revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`.

Adaptation: clean-room implementation of the severity-graded validated-findings review workflow. Written for the ODIN 2.0 Skill Foundry literal authoring contract. Source expression not copied.
