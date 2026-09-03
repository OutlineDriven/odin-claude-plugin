---
name: unleak-abstraction
description: 'Use when a user names an abstraction leak and wants it sealed as a module seam, configuration option, or explicit override, or deliberately exposed as a named boundary. Measures hidden and wrapper complexity as branching decisions and admits the change only if the wrapper adds less than half the hidden complexity. Not for detecting concealment patterns: use no-hide.'
---

# Unleak abstraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User names an abstraction leak and wants it sealed as a module seam, configuration option, or explicit override, or deliberately exposed as a named boundary. |
| Authority | Reversible-local: write only named local artifacts; state the rollback path before mutating. |
| Side effect | Refactored code that seals or deliberately exposes the named leak. A wrapper is rejected if it adds more than half the measured complexity of what it hides. |
| Done | The abstraction leak is sealed or deliberately exposed; the complexity gate holds (wrapper complexity is less than half the hidden complexity, or both are zero as the zero-complexity case from step 5), confirmed by post-change re-measurement. |

## Inputs

Required:
- The target code containing the abstraction leak (must be supplied by the user).
- The location or symbol name of the leak.

Optional:
- The desired seam, configuration key, or override shape.
- A stated complexity budget or constraint.

## Complexity metric

Complexity is measured as branching decisions: the count of `if`, `else if`, `else`, `case`/`match` arms, ternary conditionals, and short-circuit logical operators (`&&`, `||`) in conditions that control flow. Each branching decision counts as 1. Linear statements, assignments, and function calls count as 0. This metric is applied identically to the hidden code (the code that conceals the dependency) and the proposed wrapper (the seam, parameter, or configuration surface that replaces it).

## Procedure

1. Locate the leak and its hidden dependency. Examine the code, identify the hidden dependency, implicit coupling, or encapsulation violation the user wants surfaced. Done when: the leak is located and its hidden dependency, coupling, or violation is identified.
2. Confirm the user's intent: seal the leak (make it explicit and controlled) or expose it (name it as a configuration or module seam). Done when: the intent is confirmed as seal or expose.
3. Measure the hidden complexity. Count the branching decisions in the code that conceals the dependency or coupling. Record the count as `hidden_complexity`. Done when: `hidden_complexity` is a non-negative integer.
4. Propose the minimal structural change that achieves the intent: a new parameter, field, configuration entry, module boundary, or override hook. Done when: one minimal structural change is proposed.
5. Measure the wrapper complexity. Count the branching decisions in the proposed wrapper or seam code. Record the count as `wrapper_complexity`. Compute the ratio `wrapper_complexity / hidden_complexity`. If `hidden_complexity` is 0, any wrapper with branching decisions is rejected; a zero-complexity wrapper (a pure pass-through or direct exposure) is admitted. Done when: the ratio is computed and the proposal is admitted (ratio < 0.5) or rejected (ratio >= 0.5).
6. If the proposal is rejected, report the measured ratio and stop. Do not apply. Done when: the rejection is reported.
7. Apply the change. If applying requires deleting or relocating code, record the original text for rollback. Done when: the change is applied and original text is recorded for rollback.
8. Re-measure the wrapper complexity after the change lands. Confirm the gate still holds: if `hidden_complexity` is 0, the wrapper must still have zero branching decisions (the zero-complexity case from step 5); otherwise confirm `wrapper_complexity / hidden_complexity < 0.5`. Done when: the post-change measurement confirms the gate holds.
9. Roll back if the done predicate cannot be satisfied; report the rollback and stop. Done when: the rollback is complete or the done predicate is confirmed.

## Failure and recovery

- No-such-leak: the named symbol does not exist or the leak cannot be reproduced. Report that the target is absent and stop.
- Gate-reject: wrapper complexity is at least half the hidden complexity. Do not apply. Report the measured ratio (`wrapper_complexity / hidden_complexity = N.N`) and stop without mutating.
- Rollback-failure: the change cannot be reversed. Stop further mutation, report the irreversible state, and do not claim done.
- Partial-state: if part of the change lands before a failure, roll back the partial change before reporting. Never leave partial state as the result.
- Non-converged: the leak cannot be sealed or exposed without exceeding the complexity gate. Return the measured ratio and stop.

## Output

Refactored code with the leak sealed or exposed, plus a one-line complexity ratio `wrapper / hidden = N.N` (branching decisions). On gate failure, the ratio and blocked result only.
