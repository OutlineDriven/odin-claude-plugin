---
name: to-greenfield
description: 'Use when the user says "greenfield this" or "rescue this codebase", or names a field. The skill names the codebase field — darkfield, redfield, bluefield, or brownfield — with one-fact evidence and executes the first corrective action itself. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# To greenfield

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'greenfield this' or 'rescue this codebase', or names a field. |
| Authority | Reversible-local: read-only diagnosis, then exactly one bounded first corrective action limited to named local artifacts and the smallest edits that action requires; the rollback path is stated before any mutation. |
| Side effect | Field diagnosis and the first corrective action are reported in chat; durable effects are limited to the single bounded action this skill executes under its own authority. |
| Done | The field (dark, red, brown, or blue) is named with its one-fact evidence and the first corrective action has been executed. |

## Inputs

1. **Target scope** (required): one repository region or subsystem to diagnose. "Greenfield this" scopes to the subsystem the working session covers; a larger repository is diagnosed per subsystem, never as one undifferentiated whole.
2. **Field name** (optional): a user-named field — dark, red, blue, or brown. It is a hypothesis, not authority: diagnosis must confirm or refute it with evidence before any action.
3. **Verifier command** (optional): the project's check command for the scoped subsystem. When absent, read it from the project's own configuration or task runner; never invent one.

## Procedure

1. **Bound the scope.** Name the subsystem under diagnosis and the paths it covers. Stop rather than widen scope; a second subsystem is a second invocation.
2. **Diagnose the field** by read-only inspection — verifier runs, path and symbol search — and settle precedence: **red trumps all** (a broken bluefield is redfield until green), then darkfield, then bluefield, then brownfield:
   - **redfield**: verifier fails, active regressions, red CI, or broken build.
   - **darkfield**: no tests and no docs; structure unclear; nobody can say what a change would break.
   - **bluefield**: two coexisting implementations of one concern — old/new directories, migration flags, `v2` suffixes, TODO-migrate markers.
   - **brownfield**: green and working, but compat shims, legacy patterns, and dead weight.
3. Cite exactly **one fact** as the field's evidence: verifier output for red, a missing-tests-and-docs observation for dark, a named dual-implementation pair for blue, or a shim and legacy-pattern list for brown. If the user-named field is refuted, report the refuting fact and proceed with the evidence-supported field.
4. **State the rollback path**, then execute exactly one first corrective action for the diagnosed field:
   - **redfield** — fix the single highest-priority verifier failure with the smallest change that turns that check green; quarantine a flaky check by naming it in the report, never by deleting it. Rollback: revert the one edit.
   - **darkfield** — map the scoped subsystem (structure, entry points, dependencies) and write one newcomer doc as a local artifact. Rollback: delete that doc.
   - **bluefield** — record the concern's canonical and legacy paths with their remaining callers in the chat report, then migrate the first remaining caller onto the canonical path. Rollback: revert that caller's change.
   - **brownfield** — add one behavior-pinning characterization test where coverage is thinnest. Rollback: delete that test file.
5. **Verify the action.** Red: rerun the single failing verifier and confirm green. Dark: every doc claim traces to a mapped path. Blue: the migrated caller resolves against the canonical path only. Brown: the new test passes as written; a failing one refutes the diagnosis (see Failure and recovery).
6. **Report in chat**: field, one-fact evidence, action executed, files touched, rollback path, verification result, and the next action for that field. One diagnosis and one first action per invocation.

## Failure and recovery
- **Unboundable scope** (no identifiable subsystem or region): report the blocker, mutate nothing, end blocked.
- **Inconclusive diagnosis** (signals support no single field): report the observed facts and the competing fields, execute no action, end blocked. Never invent evidence.
- **Failed first action** (the verifier stays red after the minimal fix, the migrated caller breaks, or the doc or test cannot be validated): revert the touched change to its prior state, report the failure, the unchanged field state, and the next action; end non-converged. Never swallow the error or claim Done.
- **Partial-result rule**: at most one edit or one artifact is ever in flight; on any failure its rollback removes it completely, and a diagnosis failure leaves zero mutations.

## Output
A chat report naming the field, its one-fact evidence, the first corrective action executed, files touched, the rollback path, the verification result, and the next action for the field; darkfield also leaves the one newcomer-doc artifact. Greenfield — a codebase a newcomer could extend without archaeology — is reached when a re-diagnosis assigns no color to any scoped subsystem: verifier green, behavior pinned, one path per concern, and a newcomer doc that matches reality.

## Provenance

Project-owned. Origin: the project's own ODIN skill tree at `skills/to-greenfield/SKILL.md`; no external source and no third-party license apply. Adapted for ODIN 2.0: the per-field peer-skill routing was replaced by direct execution of the bounded first corrective action under this skill's reversible-local authority; the field taxonomy, precedence, one-fact evidence rule, per-subsystem field maps, and first-action definitions are preserved.
