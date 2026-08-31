---
name: ssotize-audit-fold
description: 'Use when a user asks to find duplication, check consistency, establish/repair SSOT, consolidate or unify scattered facts. Audits every occurrence, generates a reversible consolidation plan, and folds unique details into a canonical home once approved; no unique detail is lost and contradictions are reconciled to one value. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# SSOTize audit fold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to find duplication, check consistency, establish/repair SSOT, consolidate or unify scattered facts |
| Authority | Reversible-local: write only named local artifacts. Before any mutation, present the full mutation plan to the human and receive explicit approval. Rollback must restore the pre-mutation state. |
| Side effect | Read-only until the human approves the mutation plan. On approval, fold unique details into the canonical home and replace copies with references pointing to it. |
| Done | Canonical home complete and current; every copy now references it and resolves; no unique detail lost; contradictions reconciled to one value |

## Inputs

- **User request** (required): the explicit ask to find duplication, check consistency, establish/repair SSOT, consolidate, or unify scattered facts. Must identify the fact class (rule, constant, definition, description) and optionally the target path or pattern. |

## Procedure

1. **Classify the request.** Confirm the user wants an occurrence audit and consolidation. If the ask is ambiguous, ask one clarifying question and stop. Do not widen scope.

2. **Bound the scope.** If the user named a path or pattern, start there. If not, infer the relevant directories from the codebase structure. Do not audit the entire repository unless the user explicitly asks for it.

3. **Audit every occurrence.** Find all instances of the fact class the user named. Classify each by occurrence type:
   - **Canonical home**: the instance that is most complete, most current, or most authoritative, the one to preserve
   - **Copy**: an instance that duplicates the canonical content in whole or in part
   - **Partial**: an instance that holds only part of the content
   - **Stale**: an instance that contradicts the canonical content or is demonstrably outdated
   - **Out-of-scope**: an instance that does not belong to the fact class being audited

4. **Detect contradictions.** If two canonical candidates contradict, present the conflict explicitly. Do not choose for the human. Stop and ask for a ruling. The consolidation cannot proceed until the contradiction is resolved.

5. **Generate the mutation plan.** List each action before any write occurs:
   - The canonical home (file, path, lines)
   - Every copy to replace with a reference
   - Every partial to update or merge
   - Every stale to remove
   - The exact text of every reference to be written

6. **Present for consent.** Before any write, show the complete mutation plan to the human. State the authority boundary: the plan is reversible-local only if the human approves. Wait for explicit approval. If the human declines or modifies, adjust and re-present.

7. **Validate and snapshot the write set.** After human approval and before writing, confirm the canonical home and every planned target exist and match the plan. Capture each target's exact pre-write bytes and SHA-256 digest in memory as the rollback snapshot. If any target changed, stop and re-present the audit.

8. **Execute the fold.** Apply mutations in this order:
   a. Complete the canonical home: add any unique details that were confirmed missing in step 3.
   b. Replace every copy with a reference pointing to the canonical home.
   c. Remove every stale instance.
   d. Verify every reference resolves correctly.

9. **Validate the done predicate.** Confirm: canonical home is complete and current; every reference resolves; no unique detail was silently dropped; no contradiction remains. If any check fails, stop and report exactly which check failed and why.

10. **Rollback if blocked.** If any write fails, if any reference does not resolve, or if any contradiction surfaces during execution, restore every target from the in-memory byte snapshot taken in step 7, verify its SHA-256 digest, and report the failure class.

## Failure and recovery
- **Ambiguous request**: stopped at step 1. No mutation occurred. Return the clarification question.
- **Contradiction detected**: stopped at step 4. No mutation occurred. Report the contradictory instances and their content.
- **Consent withheld**: stopped at step 6. No mutation occurred. Return the plan as a report.
- **Canonical home missing or changed**: stopped at step 7. No mutation occurred. Re-run the audit and re-present.
- **Write failure or reference broken**: rollback to the pre-mutation state. Report the failure class and the exact write that failed.
- **Non-converged**: after rollback, if the contradiction cannot be resolved or the canonical home cannot be established, return a report listing the remaining contradictions. Do not pretend the done predicate holds.

## Output
A structured report containing:
- The canonical home path and its completeness status
- The list of occurrences by type (canonical, copy, partial, stale, out-of-scope)
- Contradictions found and their resolutions (if any)
- The mutation plan presented to the human
- The mutations executed (after approval)
- The validation results against the done predicate

## Provenance

Origin: https://github.com/LilMGenius/paperthin | Revision: 3bca079a51bcfff5dafb53d1d7f9f523d66ee317 | License: MIT (c) 2026 LilMGenius. NOTICE: this skill vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. Retain the MIT copyright+permission notice for substantial reuse; per-source attribution obligation binds only verbatim vendor material, which the foundry does not copy. Adaptation: clean-room reimplementation of consolidate-to-one-home with added occurrence-taxonomy audit phase, fold-unique-details-first ordering, trust/permission-boundary consent rule, and fold-audit-into-mutator ordering enforced as a hard precondition. Slug collision resolved: renamed from lilmgenius-paperthin-consolidate-to-one-home to ssotize-audit-fold.
