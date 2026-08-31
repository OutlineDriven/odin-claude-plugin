---
name: ssotize-audit-fold
description: 'Use when asked to find duplication, check consistency, establish or repair SSOT, consolidate scattered facts, or when the user says "consolidate this" or "ssotize this". Audits every occurrence, proposes a reversible plan, then folds unique details into one approved canonical home. Not for remote or irreversible changes.'
---

# SSOTize audit fold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to find duplication, check consistency, establish or repair SSOT, consolidate, unify scattered facts, or says "consolidate this" or "ssotize this". |
| Authority | Reversible-local: write only named local artifacts. Before any mutation, present the full mutation plan to the human and receive explicit approval. Rollback must restore the pre-mutation state. |
| Side effect | Read-only until the human approves the mutation plan. On approval, fold unique details into the canonical home and replace copies with references pointing to it. |
| Done | Canonical home complete and current; every copy now references it and resolves; no unique detail lost; contradictions reconciled to one value. |

## Inputs

- User request (required): the explicit ask to find duplication, check consistency, establish or repair SSOT, consolidate, or unify scattered facts. Must identify the fact class (rule, constant, definition, description) and optionally the target path or pattern.
- The fact to consolidate: the specific rule, constant, or definition. It must be one statement, not a whole document. The user must supply it.
- Audit scope (optional): the files or directories to enumerate. Defaults to the paths where the user saw the repetition. Widen only with explicit approval.

## Refusal

- Ambiguous request: stopped at step 1. No mutation occurred. Return the clarification question.
- Contradiction detected: stopped at step 5. No mutation occurred. Report the contradictory instances and their content.
- Consent withheld: stopped at step 7. No mutation occurred. Return the plan as a report.
- Canonical home missing or changed: stopped at step 8. No mutation occurred. Re-run the audit and re-present.
- Write failure or reference broken: rollback to the pre-mutation state. Report the failure class and the exact write that failed.
- Non-converged: after rollback, if the contradiction cannot be resolved or the canonical home cannot be established, return a report listing the remaining contradictions. Do not pretend the done predicate holds.

## Procedure

1. Classify the request. Confirm the user wants an occurrence audit and consolidation. If the ask is ambiguous, ask one clarifying question and stop. Do not widen scope. **Done when:** the request is classified or a clarification question is returned.
2. Name the truth. Restate the single statement being consolidated in one sentence, distinct from the surrounding documents. **Done when:** the statement is restated in one sentence.
3. Bound the scope. If the user named a path or pattern, start there. If not, infer the relevant directories from the codebase structure. Do not audit the entire repository unless the user explicitly asks for it. **Done when:** the scope is bounded.
4. Audit every occurrence. Find all instances of the fact class the user named. Classify each by occurrence type: Canonical home (most complete, current, or authoritative, the one to preserve), Copy (duplicates canonical content in whole or in part), Paraphrase (restates the canonical content in different words), Partial (holds only part of the content), Stale (contradicts canonical content or is demonstrably outdated), Contradictory (conflicts with another occurrence on the same fact), Out-of-scope (does not belong to the fact class being audited). **Done when:** every occurrence is classified.
5. Re-enumerate by a second method. Use a different search pattern, symbol index, or reverse direction to confirm the first pass was complete. **Done when:** the second method confirms the first pass was complete or surfaces missed occurrences.
6. Detect contradictions. If two canonical candidates contradict, present the conflict explicitly. Do not choose for the human. Stop and ask for a ruling. The consolidation cannot proceed until the contradiction is resolved. **Done when:** no contradictions remain or the conflict is surfaced for human ruling.
7. Pick the canonical home. The most authoritative, best-maintained location closest to where the fact actually changes. Propose creating a new home in scope if none exists. Never promote a weak copy because it is convenient. **Done when:** a canonical home is picked with a one-line justification.
8. Generate the mutation plan. List each action before any write occurs: the canonical home (file, path, lines), every copy to replace with a reference, every paraphrase or partial to update or merge, every stale to remove, and the exact text of every reference to be written. **Done when:** the mutation plan is complete.
9. Present for consent. Before any write, show the complete mutation plan to the human. State the authority boundary: the plan is reversible-local only if the human approves. Wait for explicit approval. If the human declines or modifies, adjust and re-present. **Done when:** the human approves the plan.
10. Validate and snapshot the write set. After human approval and before writing, confirm the canonical home and every planned target exist and match the plan. Capture each target's exact pre-write bytes and SHA-256 digest in memory as the rollback snapshot. If any target changed, stop and re-present the audit. **Done when:** every target is validated and snapshotted.
11. Execute the fold. Apply mutations in this order: (a) complete the canonical home by adding any unique details confirmed missing in step 4; (b) replace every copy with a reference pointing to the canonical home; (c) remove every stale instance; (d) verify every reference resolves correctly. **Done when:** all mutations are applied and references resolve.
12. Validate the done predicate. Confirm: canonical home is complete and current; every reference resolves; no unique detail was silently dropped; no contradiction remains. If any check fails, stop and report exactly which check failed and why. **Done when:** all four checks pass.
13. Rollback if blocked. If any write fails, if any reference does not resolve, or if any contradiction surfaces during execution, restore every target from the in-memory byte snapshot taken in step 10, verify its SHA-256 digest, and report the failure class. **Done when:** every target is restored and verified.

## Failure and recovery

- Undecided contradiction: report the conflicting statements and stop read-only; never guess a resolution.
- Out-of-scope occurrence found after approval: stop, re-report including the widened scope, and wait for new approval; never widen scope silently.
- Any step fails after mutation began: restore every touched file from the pre-edit capture and report the failure; never leave the home updated while a duplicate still stands or a pointer is broken.
- The audit finds nothing that genuinely improves: terminal no-op. Change nothing and report that.

## Output

A structured report: canonical home path and completeness status, occurrences by type (canonical, copy, paraphrase, partial, stale, contradictory, out-of-scope), contradictions found and their resolutions, the mutation plan presented to the human, the mutations executed (after approval), and the validation results against the done predicate. Terminal classification: `consolidated` (home holds complete truth, every copy resolves to it), `blocked` (missing approval or decision named), or `no-op` (nothing improved, zero edits).
