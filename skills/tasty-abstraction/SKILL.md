---
name: tasty-abstraction
description: 'Use when a user wants to design the abstraction a sharp engineer would choose to hold. Produces a bounded abstraction specification with explicit trade-offs, leak surface, and usage contract. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Tasty abstraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to design the abstraction a sharp engineer would choose to hold |
| Authority | Reversible local write only |
| Side effect | Writes one abstraction specification to a named local file |
| Done | A sharp-engineer-worthy abstraction specification exists |

## Inputs

- **Problem statement** (required): the concrete complexity, repetition, or leak the abstraction must address.
- **Raw form** (required): the current unabstracted surface the user works with directly.
- **Sharp-engineer persona** (optional): a specific engineer whose taste anchors the design; defaults to a senior generalist who values clarity over cleverness.

## Refusal

- No real problem: the raw form has no meaningful complexity to collapse. Report the finding; write no artifact.
- Abstraction hides critical detail: the proposed boundary obscures something the engineer must reason about. Expose the detail or reject the abstraction.
- Complexity ratio fails: the abstraction is not simpler than the raw form. Reject and report the comparison.
- Scope creep: the design touches code, dependencies, or domains outside the stated problem. Stop and report the boundary violation.

## Procedure

1. **Name the concrete problem.** State what is hard, repeated, or leaky about the raw form. Do not abstract a non-problem. Done when: a concrete problem is stated.
2. **Enumerate the raw form's surface**: operations, concepts, failure modes, and escape hatches the user touches. Done when: the surface is enumerated.
3. **Propose one abstraction boundary.** The boundary must collapse at least two raw-form concepts into one, expose every escape hatch the raw form offers (as a direct pass-through or named override), and not introduce a new concept that does not exist in the raw form. Done when: one boundary is proposed meeting all three constraints.
4. **Apply the sharp-engineer test.** Would a senior engineer who understands the raw form choose this abstraction voluntarily? If the abstraction hides a detail the engineer needs to reason about correctly, reject it and expose that detail. Done when: the abstraction passes the test or is rejected with a reason.
5. **Compute the complexity ratio.** The abstraction's surface complexity must be strictly less than the raw form's. If the ratio is equal or greater, reject the abstraction. Done when: the ratio is computed and the abstraction is simpler.
6. **Name the leak surface explicitly.** Every point where the abstraction can break, surprise, or require raw-form knowledge. For each leak, state whether it is sealed, exposed as configuration, or documented as a known seam. Done when: every leak is classified.
7. **Write the specification artifact** containing: abstraction name, boundary definition, surface comparison table, leak surface inventory, complexity ratio, escape-hatch mapping, and usage contract. Done when: the specification file is written.
8. **Stop.** Do not implement the abstraction, refactor existing code, or widen scope beyond the specified boundary. Done when: no implementation or refactoring has occurred.

## Failure modes

- Partial results are not artifacts. If any step fails, no specification is written.

## Output

One local abstraction specification file: abstraction name and purpose, boundary definition, surface comparison (raw-form concepts mapped to abstraction concepts), leak surface (every seam, override, and known breakage point), complexity ratio, escape-hatch mapping, usage contract (when to use, when to bypass, what the engineer must still understand about the raw form).
