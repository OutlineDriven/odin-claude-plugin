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

## Procedure

1. Name the concrete problem. State what is hard, repeated, or leaky about the raw form. Do not abstract a non-problem.
2. Enumerate the raw form's surface: operations, concepts, failure modes, and escape hatches the user touches.
3. Propose one abstraction boundary. The boundary must:
   - Collapse at least two raw-form concepts into one.
   - Expose every escape hatch the raw form offers, either as a direct pass-through or as a named override.
   - Not introduce a new concept that does not exist in the raw form.
4. Apply the sharp-engineer test: would a senior engineer who understands the raw form choose this abstraction voluntarily? If the abstraction hides a detail the engineer needs to reason about correctly, reject it and expose that detail.
5. Compute the complexity ratio: the abstraction's surface complexity must be strictly less than the raw form's. If the ratio is equal or greater, reject the abstraction.
6. Name the leak surface explicitly: every point where the abstraction can break, surprise, or require raw-form knowledge. For each leak, state whether it is sealed, exposed as configuration, or documented as a known seam.
7. Write the specification artifact containing: abstraction name, boundary definition, surface comparison table, leak surface inventory, complexity ratio, escape-hatch mapping, and usage contract.
8. Stop. Do not implement the abstraction, refactor existing code, or widen scope beyond the specified boundary.

## Failure and recovery
- **No real problem**: the raw form has no meaningful complexity to collapse. Report the finding; write no artifact.
- **Abstraction hides critical detail**: the proposed boundary obscures something the engineer must reason about. Expose the detail or reject the abstraction.
- **Complexity ratio fails**: the abstraction is not simpler than the raw form. Reject and report the comparison.
- **Scope creep**: the design touches code, dependencies, or domains outside the stated problem. Stop and report the boundary violation.

Partial results are not artifacts. If any step fails, no specification is written.

## Output
One local abstraction specification file containing:
- Abstraction name and one-sentence purpose.
- Boundary definition: what is inside and what is outside.
- Surface comparison: raw-form concepts mapped to abstraction concepts.
- Leak surface: every seam, override, and known breakage point.
- Complexity ratio: raw surface count vs. abstracted surface count.
- Escape-hatch mapping: how every raw-form escape hatch remains accessible.
- Usage contract: when to use the abstraction, when to bypass it, and what the engineer must still understand about the raw form.

## Provenance

- Origin: `project-owned:user-curated-skill-ideas`, line 62.
- Supplementary source: `project-owned:user-supplied-source-brief`.
- Candidate ID: `curated:curated-ideas:curated-041`.
- Revision: not pinned.
- License: project-owned.
- Adaptation: clean-room rewrite of the user-curated brief into an executable skill contract. No third-party expression copied.
