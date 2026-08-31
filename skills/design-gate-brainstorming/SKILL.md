---
name: design-gate-brainstorming
description: 'Use before implementing creative work when no approved design exists; routes through spike, bounded, or architectural design until intent is approved. Not for work with an approved design already in context — proceed to implementation. No remote or irreversible changes.'
---

# Design gate brainstorming

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests creative work — a feature, component, or behavior change — and no approved design exists; must fire before any implementation action on every such path. |
| Authority | Reversible-local: write only the named spec document on the architectural path; bounded and spike paths write no files. Rollback is deleting the spec file before approval. |
| Side effect | Architectural path commits a spec document and may dispatch a spec-reviewer subagent. Bounded path produces an in-chat design only. Spike produces a recommendation only; anything built is labeled throwaway. |
| Done | The user explicitly approved the intent before any implementation. Bounded ends at in-chat design approval; spike ends at a reported recommendation; architectural ends at a self-review-clean spec plus handoff to the plan writer. |

## Inputs

- A creative-work request (feature, component, or behavior change). Must be supplied.
- Any already-approved design present in context. Optional; if present, this skill does not route.
- The user, in-loop, to approve or reject the produced design or recommendation. Required on every path.

## Procedure

1. On any creative-work request with no approved design already in context, stop implementation and route. Confirm at the trust boundary that the request is creative work and that no approved design exists; if an approved design is present, do not route. **Done when:** the request is confirmed as creative work with no approved design, or the skill stands down because an approved design exists.

2. Classify the request into exactly one path:
   - **Spike** — the question is exploratory or the design space is unknown. Build nothing durable; any code produced is labeled throwaway. Produce a recommendation only.
   - **Bounded** — the change fits one component or a small, well-understood surface. Produce the design in chat: goal, constraints, key decisions, open questions.
   - **Architectural** — the change crosses module boundaries, alters a contract, or has durable blast radius. Write a spec document to a local file under the project covering problem, constraints, design, alternatives considered, and risks.

   **Done when:** exactly one path is chosen and named.

3. For the architectural path only: self-review the spec against its own acceptance criteria, then dispatch a spec-reviewer subagent if available; revise until self-review is clean. **Done when:** the spec is self-review-clean (and reviewer notes recorded if a reviewer ran).

4. On every path, present the result and ask the user for explicit approval before any implementation action. **Done when:** the result is presented and explicit approval is requested.

5. Record the user's decision: approved, approved-with-changes, or rejected. Do not begin implementation until approval is recorded. **Done when:** the decision is recorded and, if approved, implementation is cleared to start.

6. Architectural path: on approval, hand the clean spec to the plan writer. Bounded path: on approval, the in-chat design is the recorded decision. Spike path: the recommendation is the terminal output. **Done when:** the path's terminal handoff is made.

## Failure and recovery
- **Ambiguous path**: if the request does not clearly fit spike, bounded, or architectural, ask the user to pick the path before proceeding; do not default silently.
- **User rejects or requests changes**: record the rejection or change request, revise the design or recommendation, and re-ask; never begin implementation on a rejection.
- **Spec self-review not clean**: keep revising; if the spec cannot reach a self-review-clean state, stop and report the blocking issue rather than handing off a dirty spec.
- **Spec-reviewer subagent unavailable**: architectural path proceeds on self-review alone; note the missing review in the handoff.
- **Partial-result rule**: no path produces a partial implementation. Spike code is throwaway and never committed as durable work.
- **Non-mutation rule**: bounded and spike paths write no files. Architectural path writes only the spec document; rollback is deleting that file before approval.

## Output
One terminal classification per path: spike → a reported recommendation; bounded → an in-chat design plus the user's recorded approval; architectural → a self-review-clean spec plus handoff to the plan writer — ordered confirm-need → classify → self-review → present → record → handoff, with the user's explicit approval or rejection recorded before any implementation.
