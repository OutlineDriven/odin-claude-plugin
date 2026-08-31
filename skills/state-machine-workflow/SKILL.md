---
name: state-machine-workflow
description: 'Generate a state-machine specification with states, events, guards, outcomes, and illegal transitions when work has distinct modes. Use when the user says "state machine", "workflow states", "mode transitions", or wants structured state modeling instead of a prose todo list. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

- **Required:** A description of the domain, process, or system whose states are being modeled.
- **Optional:** An existing list of states or transitions to refine. An existing state-machine file to extend.

## Procedure

1. **Scope the domain.** Name the system boundary. Identify what entity or process owns the states. Confirm the scope with the user before enumerating.

2. **Enumerate states.** List every distinct mode the system can occupy. Each state has a unique name, a clear entry condition, and at least one outgoing transition. Name states as nouns or adjective-noun pairs that describe the mode, not the action that caused it.

3. **Enumerate transitions.** For each state, list every valid transition to another state. Each transition names:
   - The source state.
   - The destination state.
   - The event that triggers it.
   - The guard condition that must hold for the transition to fire.
   - The outcome or side effect produced.

4. **Define outcomes.** For terminal or milestone states, name the concrete observable result. Outcomes are verifiable: a file written, a decision recorded, a value returned, a signal emitted.

5. **Identify illegal transitions.** For every pair of states where a direct transition must never occur, name the pair and state why it is forbidden. Illegal transitions guard against invalid shortcuts.

6. **Validate completeness.** Check:
   - Every state has at least one outgoing transition (no dead states except explicit terminal states).
   - Every path from the initial state reaches a terminal or outcome state.
   - No two transitions from the same state share an identical event and guard.
   - Every guard references a condition observable within the scoped domain.

7. **Present for approval.** Show the complete specification as a structured table or diagram. Ask the user to confirm states, transitions, guards, and illegal transitions before writing.

8. **Write the specification.** After approval, write the state-machine specification to the project. Use the format the project already prefers (Markdown table, Mermaid diagram, or code). If no preference exists, write a Markdown file with sections for states, transitions, guards, outcomes, and illegal transitions.

## Failure and recovery
| Failure class | Response |
|---|---|
| Domain too vague to enumerate states | Stop. Ask the user to name the entity, the boundary, or the modes. Do not invent scope. |
| User rejects the state enumeration | Revise based on feedback. Do not write a specification the user has not approved. |
| Contradictory guards or unreachable states | Surface the contradiction. Propose a resolution. Do not write until resolved. |
| Partial specification | Write only what is complete and approved. Mark remaining states or transitions as open, never as stubs or placeholders. |

## Output
A state-machine specification file containing:
- All states with entry conditions.
- All transitions with source, destination, event, guard, and outcome.
- All terminal outcomes.
- All illegal transitions with rationale.

The specification is sufficient to encode in types, a state-machine library, or a runtime enum.

## Provenance

Project-owned. Adapted from user-curated workflow-synthesis ideas. No third-party content.
