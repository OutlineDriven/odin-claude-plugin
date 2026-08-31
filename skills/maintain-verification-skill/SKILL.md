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

1. Read the verification-skill directory and identify every file it contains.
2. Compare each file against the supplied drift evidence. Record the exact lines, commands, paths, or assertions that no longer match current project state.
3. Bound scope: list every file to be edited before making any change. No file outside the verification-skill directory is touched.
4. State the rollback path: the original content is recoverable from version control or the pre-edit working tree.
5. Edit only the files inside the verification-skill directory to eliminate the recorded drift. Replace stale commands with current ones, update paths to match the project tree, and align assertions with the real contract.
6. Re-run the verification skill against the project to confirm the drift is repaired. If the verification skill itself cannot be executed, validate the edits by reading the changed files against current project state.
7. Classify the outcome honestly:
   - **clean**: no drift found; no edits made.
   - **changed**: drift repaired; edits landed inside the verification-skill directory.
   - **blocked**: drift confirmed but cannot be repaired without widening scope, missing information, or touching files outside the directory.
8. If the outcome is **changed** and PR approval was given, open one PR containing only the edits to the verification-skill directory.

## Failure and recovery
- **Drift unrepairable inside scope**: if repairing the drift requires editing files outside the verification-skill directory, stop and classify as **blocked**. Do not widen scope.
- **Verification skill cannot be re-run**: validate edits by reading changed files against current project state. If validation is inconclusive, classify as **blocked** with the reason.
- **Missing drift evidence**: if the supplied evidence does not identify concrete drift, classify as **clean** and report that no actionable drift was found.
- **Partial edits**: if some drift is repaired but remaining drift cannot be fixed inside scope, classify as **changed** for the repaired portion and report the remaining drift as **blocked**.
- **Rollback**: all edits are inside the verification-skill directory and recoverable from version control or the pre-edit working tree. No rollback action is needed beyond discarding the local changes.

## Output
A terminal classification — **clean**, **changed**, or **blocked** — with the list of files edited (if any), the drift repaired, any remaining drift, and the PR URL if one was opened.

## Provenance

Origin: cursor/plugins (pstack), revision 68836ddaf5697224520f1847d90cdb90ca8babaa. MIT license. Clean-room adaptation: the mechanism — drift repair scoped to the verification-skill directory with an honest terminal classification — is preserved; expression is rewritten.
