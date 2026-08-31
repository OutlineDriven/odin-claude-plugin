---
name: principle-build-the-lever
description: 'Use when asked to execute non-trivial repetitive work. Reviewer can rerun the lever. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Build the lever

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Execute non-trivial repetitive work. |
| Authority | reversible-local: write only named local artifacts; state the rollback path |
| Side effect | Creates scripts, codemods, generators, or skills |
| Done | Reviewer can rerun the lever. |

## Inputs

- Work description: scope and target, supplied by the human.
- Repository context: the codebase in which the work applies.

## Procedure

1. **Assess triviality.** Determine whether the work is genuinely trivial: a couple of obvious edits visible at a glance. If trivial, stop — the lever principle does not apply. If non-trivial, continue.
2. **Work the first unit by hand.** Perform the first unit of work manually to discover the recipe — the exact pattern of what needs to change, in what order, under what conditions.
3. **Codify the recipe into a deterministic script.** Encode the discovered recipe into a script, codemod, generator, or skill. The lever must be:
   - Deterministic: same input always produces the same output.
   - Safe to rerun: no destructive side effects without idempotent guards.
   - Rerunnable: a reviewer can execute it independently without manual intervention.
   Choose the artifact type by intent:
   - Edits: codemod or shell script.
   - Repeated files: generator.
   - Analysis: dump-to-sqlite query or structured script.
   - Verification: rerunnable check with an explicit pass/fail contract.
4. **Prove the first unit.** Run the lever against the first manually completed unit. Diff the result against the hand-done version. The diff must show equivalent output, or any difference must be an explicitly documented and accepted design decision.
5. **Commit the lever when work outlives the session.** If the work will be revisited, commit the script so the next run reruns it instead of redoing it.
6. **Apply the lever to remaining units.** Use the script for any remaining work in scope. If fan-out to subagents is warranted, write the lever as a skill they all read — the recipe, the verification contract, and the do-not-touch fences in one artifact — and keep the skill outside the delegates' write scope so they cannot edit the contract.
7. **Confirm reviewer rerunnability.** Verify that the lever, as committed or presented, can be executed by a reviewer without additional context from the current session.

## Failure and recovery
**Non-converged: missing lever.** Work is non-trivial and no lever was created. Surface the missing artifact explicitly to the human rather than continuing silently with unreviewable hand-done work.

**Execution failure.** The lever runs and fails. Roll back any changes made during this run. Stop rather than continuing with partial or unverifiable state.

**Partial-result rule.** If the lever cannot be safely written due to environmental constraints, declare the partial result to the human and stop.

**Rollback.** Undo any state changed during a failed lever run before reporting failure.

## Output
One or more of:
- Script (shell, Python, or equivalent)
- Codemod
- Generator
- Skill artifact

The reviewer can execute the output independently to reproduce or verify the work.

## Provenance

- Origin: pstack by Lauren Tan (poteto), MIT licensed.
- Source: cursor/plugins repository, path `pstack/skills/principle-build-the-lever/SKILL.md`.
- Revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`.
- License: MIT (LICENSE blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`; pstack authored by Lauren Tan per audit license block).
- Adaptation: Clean-room ODIN 2.0 literal authored from provenance; MIT license permits adaptation. No third-party expression copied directly.
