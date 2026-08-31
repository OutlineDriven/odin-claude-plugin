# Outcome-oriented execution — procedure

The rollback-anchor lifecycle and per-step verification behind the anchor.

1. Parse the plan: extract the target architecture and enumerate each step. Absent or incoherent plan → stop (plan-not-parseable).
2. Establish the rollback anchor before the first mutation: capture the pre-mutation state of every affected artifact. Cannot capture → stop, no mutation attempted (rollback-anchor-failed).
3. Validate reachability: confirm the target architecture is reachable from the current state via the plan steps. Not reachable → stop (target-unreachable).
4. Execute steps sequentially. For each step: apply it, then verify the step produced the intermediate state the plan predicts. Mismatch → roll back all mutations to the anchor and stop (step-N-verification-failed). Done when: each step's observed state matches its prediction.
5. Verify the end state: assert the resulting state matches the target architecture with no compatibility residue. Fail → roll back to the anchor (target-state-not-achieved).
6. Release the rollback anchor only after step 5 passes.

## Failure classes and outcomes

- plan-not-parseable: blocked; no mutation.
- rollback-anchor-failed: blocked; no mutation attempted.
- target-unreachable: terminated with reason.
- step-N-verification-failed: partial; rollback to pre-mutation anchor, completed steps listed, failed step named.
- target-state-not-achieved: partial; rollback to pre-mutation anchor.
- termination (human or plan signals the target is no longer achievable): stopped; roll back if changes exist.

When stopped after step 4 or 5, rollback restores the pre-mutation state. Report each completed step, the failed step, and the rollback outcome.
