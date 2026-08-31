---
name: unleak-abstraction
description: 'Use when a user names an abstraction leak and wants it sealed as a module seam, configuration option, or explicit override, or deliberately exposed as a named boundary. The skill applies the change only if the wrapper adds less than half the hidden complexity. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Examine the code to locate the named leak: identify the hidden dependency, implicit coupling, or violation of encapsulation the user wants surfaced.
2. Determine the user's intent: seal the leak (make it explicit and controlled) or expose it (name it as a configuration or module seam).
3. Propose the minimal structural change that achieves the intent: a new parameter, field, configuration entry, module boundary, or override hook.
4. Measure the complexity of the proposed wrapper. Measure the complexity of the hidden code it replaces or surfaces. Reject the proposal if `wrapper_complexity > 0.5 * hidden_complexity`. If rejected, report the measured ratio and stop.
5. Apply the change. If applying requires deleting or relocating code, record the original text for rollback.
6. Verify the wrapper complexity is still less than half the hidden complexity after the change lands.
7. Roll back if the done predicate cannot be satisfied; report the rollback and stop.

## Failure and recovery
- **Complexity-exceeded failure**: wrapper complexity exceeds half the hidden complexity. Do not apply. Report the measured ratio and stop without mutating.
- **Rollback failure**: the change cannot be reversed. Stop further mutation, report the irreversible state, and do not claim done.
- **No-leak failure**: the named symbol does not exist or the leak cannot be reproduced. Report that the target is absent and stop.
- **Partial-result rule**: if part of the change lands before a failure, roll back the partial change before reporting. Never leave partial state as the result.
- **Non-converged result**: the leak cannot be sealed or exposed without exceeding the complexity gate; return the measured ratio and stop.

## Output
The refactored code with the leak sealed or exposed, plus a one-line complexity ratio: `wrapper / hidden = N.N`. If the gate failed, return the ratio and the blocked result. Never return partially applied state.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` / `project-owned:user-supplied-source-brief`.
License: project-owned marker; no third-party expression copied.
Adaptation: user-curated abstraction-refactoring workflow; `reversible-local` authority with explicit wrapper-complexity gate.
