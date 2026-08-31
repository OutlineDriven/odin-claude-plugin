---
name: deep-review
description: 'Use when a user asks to run combined bug/security and code-quality branch audits. Produces a deduplicated prioritized synthesis and unified verdict. Don''t use for tasks that require source or remote-system changes.'
---

# Deep review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to run combined bug/security and code-quality branch audits |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output. Read-only review fan-out: two parallel reviewers spawn, return findings, synthesis merges and deduplicates. |
| Done | A single deduplicated prioritized synthesis exists as a unified verdict ordered by severity. |

## Inputs

The diff range, PR number, or branch commit range to audit. Required. The model determines what constitutes the review scope from the supplied input; stop if no scope can be determined.

Invocation policy is model+human: a human triggers the review; the orchestrator decides when to fan out, then executes the review, synthesizes the findings, and reports.

## Procedure

1. Confirm the scope: the diff range, PR number, or commit range to audit. Stop if scope cannot be determined. Done when: the audit scope is confirmed or the run stops with scope-unresolvable.

2. Fan out two simultaneous reviewers:
   - Reviewer A — bug and security audit: reads the scope, identifies defect, security, and regression findings, produces a severity-ordered list.
   - Reviewer B — code quality audit: reads the scope, identifies maintainability, style, and structural quality findings, produces a severity-ordered list.
   Both reviewers operate under the same read-only authority. Neither reviewer makes changes.

   Done when: both reviewers are spawned with their audit assignments and read-only authority.

3. Wait for both reviewers to return their findings. Done when: both reviewers have returned their findings lists.

4. If either reviewer fails or returns empty after retry, report the partial result from the surviving reviewer with the failure identified. Done when: both reviewers returned, or the surviving reviewer's partial result is reported with the failure identified.

5. Synthesize:
   - Merge findings from both reviewers.
   - Deduplicate and consolidate overlapping findings.
   - Rank merged findings by severity (critical > high > medium > low > informational).
   - Group findings by file or component.
   - Omit findings already resolved or not applicable.
   - Record which reviewer produced each finding for attribution.

   Done when: findings are merged, deduplicated, severity-ranked, grouped, resolved findings omitted, and reviewer attribution recorded.

6. Return a unified audit report: findings in severity order, each labeled with severity, category, affected file(s) and line(s), description, rationale, and reviewer source. Done when: the unified report is returned with all findings labeled and severity-ordered.

## Failure and recovery
| Failure class | Blocking result |
|---|---|
| scope-unresolvable | Stop. Report that the diff, PR, or commit range could not be determined. |
| reviewer-failure | Retry once. On second failure, return the surviving reviewer's findings with the failure stated. Do not synthesize from a missing reviewer. |
| synthesis-empty | Return the exact partial result each reviewer produced; state that no synthesis was possible. |

Partial-result rule: always return what was produced. Never claim the done predicate holds when it does not.

## Output
A unified audit report with deduplicated findings prioritized by severity, grouped by file or component, each labeled with severity, category, affected location, description, rationale, and reviewer source. Or a partial-result report if synthesis was not possible.

## Provenance

Adaptation of the MIT-licensed Cursor plugins thermos skill. Origin: `cursor/plugins` @ `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT (cursor/plugins root README and plugin manifest). Two-parallel-reviewer combined audit orchestrator; distinct fan-out/synthesis contract from the single deep audits.
