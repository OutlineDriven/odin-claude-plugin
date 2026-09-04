---
name: design-gate-brainstorming
description: 'Use when creative work is requested with no approved design, or a raw idea or repository must be developed into an approved design document. Not for work with an approved design in context.'
---

# Design gate brainstorming

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests creative work (a feature, component, or behavior change) or supplies a raw idea or repository to develop, and no approved design exists; fires before any implementation action on every such path. |
| Authority | Reversible local: writes only named design documents, builder profiles, analytics records, and spec documents depending on path; rollback is undo. No remote mutation. The idea path writes the named design document, builder profile, and analytics records; the architectural path writes only the named spec document; bounded and spike paths write no files. URL opens are reads. |
| Side effect | Idea path: a redaction-checked design document, builder profile, and session analytics records on local disk. Architectural path: a spec document and optionally a spec-reviewer subagent dispatch. Bounded path: an in-chat design only. Spike path: a recommendation only; anything built is labeled throwaway. |
| Done | The user explicitly approved the intent before any implementation. Idea path ends at an approved, saved, redaction-checked design document handed off with a tiered closing and next-skill offer; bounded at in-chat design approval; spike at a reported recommendation; architectural at a self-review-clean spec plus handoff to the plan writer. |

## Inputs

- A creative-work request (feature, component, or behavior change), or a raw idea description or repository path to develop. One must be supplied.
- Any already-approved design present in context. Optional; if present, this skill does not route.
- The user, in-loop, to approve or reject the produced design or recommendation. Required on every path.
- Prior context for the idea path. Optional; absent context is gathered from the repository or the idea alone.

## Procedure

1. On any creative-work request with no approved design already in context, stop implementation and route. Confirm at the trust boundary that the request is creative work and that no approved design exists; if an approved design is present, do not route. Done when: the request is confirmed as creative work with no approved design, or the skill stands down because an approved design exists.

2. Classify the request into exactly one path:
   - Idea: the input is a raw idea or a repository to develop into a design; no change to existing work is named. Produce a saved design document.
   - Spike: the question is exploratory or the design space is unknown. Build nothing durable; any code produced is labeled throwaway. Produce a recommendation only.
   - Bounded: the change fits one component or a small, well-understood surface. Produce the design in chat: goal, constraints, key decisions, open questions.
   - Architectural: the change crosses module boundaries, alters a contract, or has durable blast radius. Write a spec document to a local file under the project covering problem, constraints, design, alternatives considered, and risks.

   Done when: exactly one path is chosen and named.

3. Idea path only: gather context from the supplied idea or repository, opening any referenced URLs as reads only and never mutating a remote resource. Run the startup diagnostic: identify the problem, the intended audience, and the hard constraints. Run the builder brainstorm: enumerate candidate approaches, select the strongest against the diagnostic, and record the selection rationale. Draft the design document covering problem, approach, scope, and open questions. Redaction-check the draft: scan for secrets, credentials, and private data, and remove or redact every match before any file is saved. Save the redaction-checked design document, the builder profile (who is building, with the constraints and preferences observed this session), and the session analytics records (source kind, diagnostic summary, selected approach, confidence tier) to local files. Done when: the design document is drafted, redaction-checked, and saved alongside the builder profile and analytics records.

4. Architectural path only: self-review the spec against its own acceptance criteria, then dispatch a spec-reviewer subagent if available; revise until self-review is clean. Done when: the spec is self-review-clean (and reviewer notes recorded if a reviewer ran).

5. On every path, present the result and ask the user for explicit approval before any implementation action. The idea path presents a tiered closing: a summary of the saved design, a confidence tier, and a next-skill offer for the build phase. Done when: the result is presented and explicit approval is requested.

6. Record the user's decision: approved, approved-with-changes, or rejected. Do not begin implementation until approval is recorded. Done when: the decision is recorded and, if approved, implementation is cleared to start.

7. Make the path's terminal handoff. Idea and architectural paths hand the approved document to the plan writer. The bounded path's approved in-chat design is the recorded decision. The spike path's recommendation is the terminal output. Done when: the path's terminal handoff is made.

## Failure and recovery

- Missing idea or repository on the idea path: stop and request the input; write no file.
- Redaction check finds a secret: stop saving the unredacted draft, redact or request human removal, and re-run the check; never save a secret.
- Repository unreadable or a URL open fails: record the gap, proceed with the available context, and mark the confidence tier down.
- Ambiguous path: if the request does not clearly fit idea, spike, bounded, or architectural, ask the user to pick the path before proceeding; do not default silently.
- User rejects or requests changes: record the rejection or change request, revise the design or recommendation, and re-ask; never begin implementation on a rejection.
- Spec self-review not clean: keep revising; if the spec cannot reach a self-review-clean state, stop and report the blocking issue rather than handing off a dirty spec.
- Spec-reviewer subagent unavailable: the architectural path proceeds on self-review alone; note the missing review in the handoff.
- Partial result: no path produces a partial implementation. On the idea path, save only the completed sections, mark the incomplete sections explicitly, and never fabricate missing content. Spike code is throwaway and never committed as durable work.
- Rollback: delete the written design document, builder profile, analytics records, or spec file to revert to the pre-skill state.

## Output

One terminal classification per path: idea produces an approved, redaction-checked design document saved with its builder profile and analytics records, closed with a summary, confidence tier, and next-skill offer; spike produces a reported recommendation; bounded produces an in-chat design plus the user's recorded approval; architectural produces a self-review-clean spec plus handoff to the plan writer. Ordered confirm-need, classify, produce, present, record, handoff, with the user's explicit approval or rejection recorded before any implementation.
