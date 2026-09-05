---
name: subagent-driven
description: 'Use when a user says execute with subagents or hands over an ordered multi-task plan. Not for credential, paid, or deployment work, or any mutation outside the skill''s designated workspace.'
disable-model-invocation: true
---

# Subagent-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'execute with subagents' or hands over an ordered multi-task plan. |
| Authority | Remote: publishes the branch via git-branchless `submit`; requires explicit human invocation. Also writes locally within the skill's designated workspace (commits, briefs, reports, ledger); rollback is version control. |
| Side effect | Lands atomic commits, writes implementer briefs, reviewer reports, and diff packages as files, maintains the durable progress ledger, and ends in one final atomic ship. |
| Done | Every task is audit-clean and verifier-green, the ledger is complete, and the whole-branch review has been dispatched and resolved. |

## Inputs

Required: an ordered multi-task plan file. The plan defines task boundaries, file scopes, and "done" criteria. Model selection for each dispatch is required (an omitted model silently inherits the session's most expensive model, defeating cost control). Ledger recovery from `git log` on session compaction; no external state store required.

## Refusal

- Blocked implementer (BLOCKED): diagnose and act; context problem adds context and re-dispatches; reasoning problem escalates model capability; size problem splits the task; plan error escalates to the user. If the worker says it is stuck, something must change before retry.
- Reviewer Cannot Verify from Diff items: requirements living in unchanged code or spanning tasks. Do not block on them; resolve each centrally before marking the task complete. A confirmed gap is a failed spec review; return to the implementer, then re-review.
- Audit cannot be cleared: abort the chain rather than build on it. Do not squash or force through.

## Procedure

1. **Scan the plan for self-conflicts** (tasks contradicting each other, Global Constraints, or plan-mandated defects). Batch every finding into one user question before execution. Clean scan proceeds silently. Done when: the plan is conflict-free or all findings are batched into one user question.
2. **Check for a recovery ledger**: `cat "$(git rev-parse --show-toplevel)/.outline/sdd/progress.md"`. Tasks marked complete there are DONE; resume at the first incomplete task. Done when: the resume point is identified.
3. **For each task, in order:**
   a. Decompose into one-concern tasks with explicit file boundaries. Two tasks editing the same file are not independent; sequence or merge them. Done when: the task is decomposed with file boundaries.
   b. Run `scripts/task-brief PLAN_FILE N`. It extracts the task's full text to a uniquely named file and prints the path. The brief is the single source of requirements. Done when: the brief file path is printed.
   c. Record BASE commit (current HEAD) before dispatching. Done when: BASE is recorded.
   d. Dispatch one fresh implementer subagent with `references/implementer-prompt.md` filled in. Fresh per task: no carried context, no resumed worker. Always specify the model explicitly. Done when: the implementer is dispatched.
   e. The worker implements, runs verification, commits one concern, self-reviews, and writes a full report to the report file. The worker returns a short status: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED. Done when: the worker returns a status.
   f. Handle the implementer status: supply missing context and re-dispatch for NEEDS_CONTEXT; re-dispatch the same model with additional context for context problems; re-dispatch a more capable model for reasoning problems; re-dispatch with a split task for size problems; escalate to the user for plan errors. Done when: the status is resolved.
   g. Run `scripts/review-package BASE HEAD`. It writes one file (commit list, stat summary, full diff with context) and prints the path. Use the recorded BASE, not HEAD~1. Done when: the review package path is printed.
   h. Dispatch a fresh reviewer subagent with `references/task-reviewer-prompt.md` filled in, handing it the brief path, report path, diff-package path, and verbatim Global Constraints. Done when: the reviewer is dispatched.
   i. Gate: audit clean and verifier green marks the task complete in the ledger. Audit finds a Critical/Important issue dispatches one fix worker with the complete findings list, then re-review. Abort the chain if the audit cannot be cleared. Done when: the task is marked complete or the chain is aborted.
4. **After all tasks land**, run `scripts/review-package MERGE_BASE HEAD` where MERGE_BASE = `git merge-base main HEAD`. Dispatch the final reviewer on the most capable model, pointing it at the Minor findings the ledger accumulated. Done when: the final review is dispatched.
5. **Final-review findings** dispatch one fix worker with the complete list, then re-review. Done when: the final review is resolved.
6. **Ship via the atomic path**: sort work into atomic commits in detached HEAD, then publish with git-branchless `submit`. Done when: the branch is published.

## Failure modes

- Mid-task worker death: recover from the ledger file (`scripts/sd-workspace` → `.outline/sdd/progress.md`): the commits it names exist in git. Trust the ledger and `git log` over recollection. `git clean -fdx` destroys the ledger; recover from `git log`.
- Partial ledger recovery: if the ledger is missing, reconstruct from `git log` using the plan's task order and the timestamps of commits that match each task's concern.

## Output

Atomic commits per task on a branch, each preceded by a review package file and followed by a reviewer verdict. Durable ledger file at `.outline/sdd/progress.md` tracking completion state. Whole-branch review dispatched and resolved. Final ship via ODIN atomic path.
