---
name: state-machine-workflow
description: 'Use when work has distinct modes and the user wants states, events, guards, outcomes, and illegal transitions instead of a prose todo list. Produces a codable state-machine specification. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# State machine workflow

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Work has distinct modes and the user wants states, events, guards, outcomes, and illegal transitions instead of a prose todo list. |
| Authority | Reversible local write. The specification file is the only artifact created; deleting it fully reverses the side effect. |
| Side effect | Writes one state-machine specification file to the project. |
| Done | A runnable/codable state-machine specification exists with all states, events, guards, outcomes, and illegal transitions defined. |

## Inputs

- Required: a description of the domain, process, or system whose states are being modeled.
- Optional: an existing list of states or transitions to refine, or an existing state-machine file to extend.

## Refusal

- Domain too vague to enumerate states: stop. Ask the user to name the entity, the boundary, or the modes. Do not invent scope.
- User rejects the state enumeration: revise based on feedback. Do not write a specification the user has not approved.
- Contradictory guards or unreachable states: surface the contradiction. Propose a resolution. Do not write until resolved.
- Partial specification: write only what is complete and approved. Mark remaining states or transitions as open, never as stubs or placeholders.

## Procedure

1. **Scope the domain.** Name the system boundary. Identify what entity or process owns the states. Confirm the scope with the user before enumerating. Done when: the user confirms the system boundary.
2. **Enumerate states.** List every distinct mode the system can occupy. Each state has a unique name, a clear entry condition, and at least one outgoing transition. Name states as nouns or adjective-noun pairs that describe the mode, not the action that caused it. Done when: every state is named with an entry condition and outgoing transition.
3. **Enumerate transitions.** For each state, list every valid transition to another state. Each transition names the source state, destination state, triggering event, guard condition that must hold for the transition to fire, and outcome or side effect produced. Done when: every transition is enumerated with all five fields.
4. **Define outcomes.** For terminal or milestone states, name the concrete observable result. Outcomes are verifiable: a file written, a decision recorded, a value returned, a signal emitted. Done when: every terminal or milestone state has a verifiable outcome.
5. **Identify illegal transitions.** For every pair of states where a direct transition must never occur, name the pair and state why it is forbidden. Illegal transitions guard against invalid shortcuts. Done when: every forbidden pair is named with rationale.
6. **Validate completeness.** Check: every state has at least one outgoing transition (no dead states except explicit terminal states); every path from the initial state reaches a terminal or outcome state; no two transitions from the same state share an identical event and guard; every guard references a condition observable within the scoped domain. Done when: all four checks pass.
7. **Present for approval.** Show the complete specification as a structured table or diagram. Ask the user to confirm states, transitions, guards, and illegal transitions before writing. Done when: the user approves the specification.
8. **Write the specification.** After approval, write the state-machine specification to the project. Use the format the project already prefers (Markdown table, Mermaid diagram, or code). If no preference exists, write a Markdown file with sections for states, transitions, guards, outcomes, and illegal transitions. Done when: the specification file is written.

## Output

A state-machine specification file: all states with entry conditions, all transitions with source/destination/event/guard/outcome, all terminal outcomes, all illegal transitions with rationale — sufficient to encode in types, a state-machine library, or a runtime enum.
