---
name: maintain-verification-skill
description: 'Use when asked to repair drift in a project verification skill. Returns an honest clean, changed, or blocked outcome after editing only the verification-skill directory. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Maintain verification skill

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Repair drift in a project verification skill. |
| Authority | Reversible local: write only files inside the named verification-skill directory; state the rollback path before mutation. |
| Side effect | Edits only the verification-skill directory and may open one user-approved PR. |
| Done | Honest terminal classification: clean, changed, or blocked. |

## Inputs

- **Verification skill directory** (required): path to the project verification skill whose content has drifted.
- **Drift evidence** (required): the concrete mismatch between the verification skill and current project state — failing checks, stale commands, outdated paths, or changed contracts.
- **PR approval** (optional): explicit human approval to open one PR after edits land. Without it, edits stay local.

## Procedure

1. Read the verification-skill directory and identify every file it contains. Done when: every file in the directory is enumerated.
2. Compare each file with the supplied drift evidence. Record the exact lines, commands, paths, or assertions that no longer match the current project state. Done when: every mismatch is recorded with its exact location.
3. Before editing, list every file that will change. Do not touch files outside the verification-skill directory. Done when: the change list is stated and no out-of-scope file is queued.
4. State the rollback path: version control or the pre-edit working tree can restore the original content. Done when: the rollback path is named.
5. Edit only files inside the verification-skill directory to eliminate the recorded drift. Replace stale commands with current ones, update paths to match the project tree, and align assertions with the real contract. Done when: every recorded mismatch is corrected or classified as blocked.
6. Run the verification skill against the project again to confirm the drift is repaired. If the verification skill cannot be executed, validate the edits by comparing the changed files with the current project state. Done when: the re-run passes or the manual validation confirms the fix.
7. Classify the outcome honestly: **clean** (no drift found; no edits made), **changed** (drift repaired; edits landed inside the directory), or **blocked** (drift confirmed but cannot be repaired without widening scope, missing information, or touching files outside the directory). Done when: exactly one classification is selected and recorded.
8. If the outcome is **changed** and PR approval was given, open one PR containing only the edits to the verification-skill directory. Done when: the PR is opened or no PR was requested.

## Failure and recovery

- **Drift unrepairable inside scope**: if repairing the drift requires editing files outside the verification-skill directory, stop and classify as **blocked**. Do not widen scope.
- **Verification skill cannot be re-run**: validate edits by reading changed files against current project state. If validation is inconclusive, classify as **blocked** with the reason.
- **Missing drift evidence**: if the supplied evidence does not identify concrete drift, classify as **clean** and report that no actionable drift was found.
- **Partial edits**: if some drift is repaired but remaining drift cannot be fixed inside scope, classify as **changed** for the repaired portion and report the remaining drift as **blocked**.
- **Rollback**: all edits are inside the verification-skill directory and recoverable from version control or the pre-edit working tree. No rollback action is needed beyond discarding the local changes.

## Output

Report a terminal classification — **clean**, **changed**, or **blocked** — with the files edited (if any), the drift repaired, any remaining drift, and the PR URL if one was opened.

## Provenance

Origin: cursor/plugins (pstack), revision 68836ddaf5697224520f1847d90cdb90ca8babaa. MIT license. Clean-room adaptation: the mechanism — drift repair scoped to the verification-skill directory with an honest terminal classification — is preserved; expression is rewritten.
