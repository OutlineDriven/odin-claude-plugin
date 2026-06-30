# Action-class rubric

Action class describes the **intrinsic shape** of follow-up work — it is routing advice, not a fix. This skill is read-only; the class tells the caller what to do next.

| Action class | Meaning | Route |
|--------------|---------|-------|
| **safe** | Mechanical, behavior-preserving, single-site; the fix is unambiguous. | `fix` (unattended). |
| **gated** | The fix is clear but touches a contract or multiple sites — needs verified batches and a resolve gate. | `review-fix-grill-loop`. |
| **manual** | Needs a human design decision; no single correct fix. | Surface as a question; no auto-route. |
| **advisory** | Opinion or nit; recording it is the whole action. | None. |

## Persona guidance

- Prefer **safe** when you can write a defensible `suggested-route` for a localized, behavior-preserving change.
- Use **gated** when the fix touches an API contract, spans multiple files, or needs verified batches.
- Use **manual** when the right fix depends on product intent, architecture, or cross-cutting refactors.
- Use **advisory** when nothing breaks if left unfixed but the observation has value.
- Do not reclassify a safe fix as gated to appear more thorough. The class is signal, not a severity proxy.
