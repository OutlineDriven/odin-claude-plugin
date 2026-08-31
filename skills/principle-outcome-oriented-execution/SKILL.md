---
name: principle-outcome-oriented-execution
description: 'Use when asked to execute a planned migration or rewrite to verified target architecture, tolerating scoped reversible intermediate breakage. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Outcome-oriented execution

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Execute a planned migration or rewrite. |
| Authority | Reversible-local: mutations are reversible via rollback to a saved pre-mutation state. Intermediate breakage that is itself reversible is permitted. |
| Side effect | Permits scoped reversible intermediate breakage. |
| Done | Verified target architecture without compatibility residue. |

## Inputs

Must supply: a migration or rewrite plan that specifies the target architecture and the steps to reach it.
Must supply: the source artifacts to be migrated or rewritten.
Optional: rollback boundary definition if the plan omits it.

## Procedure

1. **Parse the plan.** Read the migration or rewrite plan. Extract the target architecture and enumerate each step. If the plan is absent or incoherent, stop and report: plan-not-parseable.
2. **Define rollback boundary.** Before any mutation, capture the pre-mutation state of all affected artifacts to a rollback anchor. If the rollback anchor cannot be established, stop and report: rollback-anchor-failed.
3. **Validate target state.** Confirm the target architecture is reachable from the current state given the plan steps. If not reachable, stop and report: target-unreachable.
4. **Execute steps sequentially.** For each step in order:
   a. Apply the step to the affected artifact.
   b. Verify the step produced the intermediate state the plan predicts.
   c. If verification fails, roll back all mutations to the rollback anchor and stop: step-{N}-verification-failed.
5. **Verify end state.** After all steps complete, assert the resulting state matches the target architecture with no compatibility residue. If the assertion fails, roll back to the rollback anchor and stop: target-state-not-achieved.
6. **Release rollback anchor.** Remove the rollback anchor only after step 5 passes.

## Failure and recovery
- **plan-not-parseable**: Plan is absent or cannot be interpreted. Result: blocked.
- **rollback-anchor-failed**: Pre-mutation state cannot be captured. Result: blocked; no mutation attempted.
- **target-unreachable**: The plan cannot reach the declared target from the current state. Result: terminated with reason.
- **step-N-verification-failed**: Step N produced an unexpected intermediate state. Recovery: rollback to pre-mutation anchor. Result: partial.
- **target-state-not-achieved**: End state does not match target architecture. Recovery: rollback to pre-mutation anchor. Result: partial.
- **termination**: Human or plan signals the target is no longer achievable. Result: stopped; rollback if changes exist.

Partial-result rule: When stopped after step 4 or 5, rollback restores the pre-mutation state. Report each completed step, each failed step, and the rollback outcome.

## Output
- Verified migration: target architecture achieved, rollback anchor released, compatibility residue absent.
- Partial migration: rollback to pre-mutation state completed, failure point named, completed steps listed.
- Blocked: no mutation attempted, root cause named.
- Terminated: stopped without rollback, reason and state named.

## Provenance

Origin: cursor/plugins (pstack/skills/principle-outcome-oriented-execution/SKILL.md), revision 68836ddaf5697224520f1847d90cdb90ca8babaa.
License: MIT — pstack authored by Lauren Tan (poteto) under MIT per audit license block (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25, 1067 bytes).
Adaptation: Re-expressed for odin-run execution governance. Source mechanism: target-state convergence principle tolerating reversible intermediate breakage, execution governance, odin-run per ruling.
