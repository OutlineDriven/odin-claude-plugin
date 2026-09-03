---
name: to-greenfield
description: 'Use when the user says greenfield this or rescue this codebase, or names a field: dark, red, blue, or brown. Also handles per-subsystem diagnosis. Not for writing specs — use to-spec; not for remote or irreversible changes.'
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

## Refusals

- Will not widen scope beyond one subsystem — a second subsystem is a second invocation.
- Will not execute more than one corrective action per invocation.
- Will not invent evidence to support a field diagnosis.
- Will not swallow a failed first action or claim Done — revert and report non-converged.

## Procedure

1. **Bound the scope.** Name the subsystem under diagnosis and the paths it covers. Stop rather than widen scope; a second subsystem is a second invocation. **Done when:** the subsystem and its paths are named.
2. **Diagnose the field** through read-only inspection, including verifier runs and path and symbol searches. Apply this precedence: red trumps all (a broken bluefield is redfield until green), then darkfield, then bluefield, then brownfield. Redfield: verifier fails, active regressions, red CI, or broken build. Darkfield: no tests and no docs; structure unclear; nobody can say what a change would break. Bluefield: two coexisting implementations of one concern — old/new directories, migration flags, `v2` suffixes, TODO-migrate markers. Brownfield: green and working, but compat shims, legacy patterns, and dead weight. **Done when:** one field is selected with its evidence.
3. Cite exactly one fact as the field's evidence: verifier output for red, a missing-tests-and-docs observation for dark, a named dual-implementation pair for blue, or a shim and legacy-pattern list for brown. If the user-named field is refuted, report the refuting fact and proceed with the evidence-supported field. **Done when:** the one-fact evidence is cited.
4. **State the rollback path**, then execute exactly one first corrective action for the diagnosed field. Redfield: fix the single highest-priority verifier failure with the smallest change that turns that check green; quarantine a flaky check by naming it in the report, never by deleting it. Darkfield: map the scoped subsystem (structure, entry points, dependencies) and write one newcomer doc as a local artifact. Bluefield: record the concern's canonical and legacy paths with their remaining callers in the chat report, then migrate the first remaining caller onto the canonical path. Brownfield: add one behavior-pinning characterization test where coverage is thinnest. **Done when:** the one corrective action is executed and its rollback path is stated.
5. **Verify the action.** Red: rerun the single failing verifier and confirm green. Dark: every doc claim traces to a mapped path. Blue: the migrated caller resolves against the canonical path only. Brown: the new test passes as written; a failing one refutes the diagnosis. **Done when:** the action is verified.
6. **Report in chat.** Field, one-fact evidence, action executed, files touched, rollback path, verification result, and the next action for that field. One diagnosis and one first action per invocation. **Done when:** the chat report is emitted with all seven elements.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Unboundable scope (no identifiable subsystem or region) | Report the blocker, mutate nothing, end blocked. |
| Inconclusive diagnosis (signals support no single field) | Report the observed facts and the competing fields, execute no action, end blocked. Never invent evidence. |
| Failed first action (verifier stays red, migrated caller breaks, doc or test cannot be validated) | Revert the touched change to its prior state, report the failure, the unchanged field state, and the next action; end non-converged. Never swallow the error or claim Done. |
| Partial-result rule | At most one edit or one artifact is ever in flight; on any failure its rollback removes it completely, and a diagnosis failure leaves zero mutations. |

## Output

A chat report naming the field, its one-fact evidence, the first corrective action executed, files touched, the rollback path, the verification result, and the next action for the field; darkfield also leaves the one newcomer-doc artifact — greenfield is reached when a re-diagnosis assigns no color to any scoped subsystem.
