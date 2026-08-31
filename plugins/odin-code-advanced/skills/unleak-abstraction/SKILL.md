---
name: unleak-abstraction
description: 'Use when a user names an abstraction leak and wants it sealed as a module seam, configuration option, or explicit override, or deliberately exposed as a named boundary. Applies the change only if the wrapper adds less than half the hidden complexity.'
---

# Unleak abstraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User names an abstraction leak and wants it sealed as a module seam, configuration option, or explicit override, or deliberately exposed as a named boundary. |
| Authority | `reversible-local`: write only named local artifacts; state the rollback path before mutating. |
| Side effect | Refactored code that seals or deliberately exposes the named leak. A wrapper is rejected if it adds more than half the measured complexity of what it hides. |
| Done | The abstraction leak is sealed or deliberately exposed; wrapper complexity is less than half the hidden complexity. |

## Inputs

Required:
- The target code containing the abstraction leak (must be supplied by the user).
- The location or symbol name of the leak.

Optional:
- The desired seam, configuration key, or override shape.
- A stated complexity budget or constraint.

## Procedure

1. Examine the code and locate the named leak. Identify the hidden dependency, implicit coupling, or encapsulation violation the user wants surfaced. **Done when:** the leak is located and its hidden dependency, coupling, or violation is identified.
2. Determine the user's intent: seal the leak (make it explicit and controlled) or expose it (name it as a configuration or module seam). **Done when:** the intent is confirmed as seal or expose.
3. Propose the minimal structural change that achieves the intent: a new parameter, field, configuration entry, module boundary, or override hook. **Done when:** one minimal structural change is proposed.
4. Measure the complexity of the proposed wrapper. Measure the complexity of the hidden code it replaces or surfaces. Reject the proposal if `wrapper_complexity > 0.5 * hidden_complexity`. If rejected, report the measured ratio and stop. **Done when:** the complexity ratio is measured and the proposal passes or is rejected.
5. Apply the change. If applying requires deleting or relocating code, record the original text for rollback. **Done when:** the change is applied and original text is recorded for rollback.
6. Verify the wrapper complexity is still less than half the hidden complexity after the change lands. **Done when:** the post-change complexity ratio confirms the gate holds.
7. Roll back if the done predicate cannot be satisfied; report the rollback and stop. **Done when:** the rollback is complete or the done predicate is confirmed.

## Failure and recovery
- **Complexity-exceeded failure**: wrapper complexity exceeds half the hidden complexity. Do not apply. Report the measured ratio and stop without mutating.
- **Rollback failure**: the change cannot be reversed. Stop further mutation, report the irreversible state, and do not claim done.
- **No-leak failure**: the named symbol does not exist or the leak cannot be reproduced. Report that the target is absent and stop.
- **Partial-result rule**: if part of the change lands before a failure, roll back the partial change before reporting. Never leave partial state as the result.
- **Non-converged result**: the leak cannot be sealed or exposed without exceeding the complexity gate; return the measured ratio and stop.

## Output
Refactored code with the leak sealed or exposed, plus a one-line complexity ratio `wrapper / hidden = N.N`; on gate failure, the ratio and blocked result only.
