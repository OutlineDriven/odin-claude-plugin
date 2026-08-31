---
name: necessary-work
description: 'Use when work is about to grow past the ask, the task may already be done, or the user requests only the minimum. Produce a bounded contract whose every admitted action is necessary, then stop at proof. Not for executing the work — use the appropriate build or fix skill.'
---

# Necessary work

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Work is about to grow past the ask, the task may already be done, or the user requests the minimum, only what is needed, or a stop once it works. |
| Authority | Read and assess available request, environment, policy, and evidence only; do not mutate files, version control, credentials, paid services, publications, deployments, or remote state. |
| Side effect | Narrow the scope of work by classification only; produce no operational side effect. |
| Done | The contract is written before work, every admitted action fails the delete test, and classification stops once the minimum proof is identified. |

## Inputs

Supply the request and the available evidence of its current state. Include any binding environmental limits or authoritative policies that constrain the outcome. Existing measurements are optional; do not create measurements unless the delete test establishes that they are necessary. If the request is ambiguous and the available inputs cannot resolve it, use the smallest interpretation consistent with the stated intent and record that interpretation.

## Procedure

1. Write the contract before admitting work: state the requested outcome and the minimum evidence that would prove it. Done when: the outcome and its proof requirement are stated in writing.
2. Enumerate only candidate actions that could close a stated outcome or proof gap. Treat no action as automatically necessary because it is useful, conventional, safer, cleaner, or more thorough. Done when: every plausible candidate is listed and none is admitted by default.
3. For each candidate `c`, apply the delete test: if deleting `c` would leave the contract unmet or unproven, admit only the smallest reliable form of `c`; otherwise reject it. Done when: every candidate has an admit-or-reject decision with its delete-test result.
4. Admit a limit, threshold, retry, budget, abstraction, artifact, check, process, or follow-up only when its necessity comes from the request, the environment, authoritative policy, or measured evidence. Done when: every admitted action has a named necessity source.
5. Classify the admitted and rejected candidates without executing them or changing any state. Do not widen scope or invent evidence when an input is missing. Done when: the classification is complete and no state has changed.
6. Stop as soon as the admitted actions and minimum proof are sufficient for the contract. Do not add speculative follow-up work. Done when: the minimum sufficient set is identified and no further candidate is considered.

## Failure and recovery

- Unresolved ambiguity: bind the smallest interpretation consistent with stated intent, identify the ambiguity in the output, and do not widen the contract.
- Missing necessity source: reject the candidate and name the absent request, environmental limit, authoritative policy, or measured evidence; do not invent support for it.
- Insufficient available evidence: return `blocked` with the exact unproven part of the contract and the missing evidence; do not claim completion or perform a new check under this read-only authority.
- Accidental scope admission: remove any candidate that does not fail the delete test and recompute the minimum set. Because this procedure makes no mutations, rollback is not required.

A partial classification may be returned only with unresolved items named; it is not a successful result unless the done predicate holds.

## Output

A scope decision: outcome, minimum proof, admitted actions (each with its contract gap), rejected candidates (each with its delete-test result), and status (`sufficient`, `already done`, or `blocked`) — ordered by the procedure steps that produced them.
