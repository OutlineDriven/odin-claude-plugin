---
name: write-product-spec
description: 'Use when a user asks for a product spec with numbered behavioral invariants. Writes PRODUCT.md with unambiguous, implementable behavior. Not for evidence-backed PRDs and PR creation — use write-prd; not for implementation plans — use write-tech-spec.'
---

# Write product spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a product spec with numbered behavioral invariants (a PRODUCT.md); route evidence-backed PRD requests to write-prd and implementation plans to write-tech-spec. |
| Authority | Reversible local: write only to the named PRODUCT.md artifact; delete the file to roll back. |
| Side effect | Writes one PRODUCT.md file under specs/<id>/. |
| Done | PRODUCT.md exists and its Behavior section makes desired behavior unambiguous enough that an implementer can build from it without guessing product intent. |

## Inputs

- Feature identifier (required): a short kebab-case name for the feature (e.g. `vertical-tabs-hover-sidecar`). If the user has a ticket or issue number, use that as the identifier. Ask the user for a name if none is provided.
- Feature summary (required): 1–3 sentences describing what the feature does and the desired outcome. Gather via dialogue if not supplied upfront.
- Target consumers (optional): who consumes the surface being designed. Defaults to the end user. For a data model, the consumer is the code that reads and writes it. For an API or library, the consumer is the callers. For a CLI, the consumer is the developer invoking it.
- Key behaviors and edge cases (optional): gather via dialogue. Do not guess; ask.

## Procedure

1. Determine the feature identifier. If the user provides a ticket or issue number, use it. If not, ask for a short kebab-case feature name. Do not proceed without an identifier. Done when: the feature identifier is confirmed.
2. Gather context via dialogue: feature summary, target consumers, key behaviors, edge cases, and how the feature will be validated. Ask one question at a time. Do not guess missing context; ask the user. Done when: the feature summary is confirmed and target consumers, behaviors, and edge cases are gathered or explicitly deferred.
3. Structure the spec with these sections: Summary (required), Behavior (required, the core), Problem (optional, only when motivation is not obvious from Summary), Goals / Non-goals (optional, when scope is ambiguous or contested), Open questions (optional, prefer inline `**Open question:** …` next to the relevant behavior; collect here only if multiple unresolved questions exist). Omit any optional section entirely if it would be empty. Do not write "None" as a placeholder. Do not include Validation, Success criteria, or Testing sections. Done when: the section list is decided with required and optional sections identified.
4. Write the Behavior section as numbered, testable invariants, not prose. Describe from the consumer's perspective:
   - Default behavior and happy-path flow.
   - Every consumer-visible state and the transitions between them.
   - All inputs the consumer can provide and how the surface responds.
   - Empty states, error states, loading/pending states, and cancellation.
   - Edge cases: permission denied, offline, timeouts, races between state changes, stale or missing data, focus loss mid-interaction, interactions with adjacent features.
   - Keyboard, accessibility, and focus expectations where relevant.
   - Invariants that must hold at all times and behaviors that must not regress.
   - Err toward enumerating one more edge case rather than one fewer.
   Done when: the Behavior section contains numbered testable invariants covering default flow, states, inputs, edge cases, and invariants.
5. Apply the length heuristic to everything around Behavior (Summary, optional sections): keep framing thin. Behavior should be as long as the feature requires:
   - Trivial fix or narrow tweak: no spec.
   - Small feature: framing plus Behavior ~30–60 lines total.
   - Medium feature: ~80–150 lines total.
   - Large or behaviorally rich feature: longer is fine; most length lives in Behavior.
   - If the same idea appears in Summary, Problem, Goals, and Behavior, collapse the framing, not the Behavior content.
   Done when: framing is thin relative to Behavior and no idea is duplicated across sections.
6. Write the spec to `specs/<id>/PRODUCT.md` where `<id>` is the feature identifier from step 1. Create the directory if it does not exist. Done when: the file is written to the correct path.
7. Confirm the file was written and present the Summary and a count of Behavior invariants to the user. Done when: the Summary and Behavior invariant count are presented.

## Failure and recovery
If the user cannot provide a feature name or summary after clarification, stop; do not fabricate a spec from assumptions. If a behavior remains unclear after clarification, write it as an explicit `**Open question:** …` inline in the Behavior section rather than guessing. If the file cannot be written (permissions, disk), report the error and the intended path; do not silently discard the spec content. If the procedure stops partway, no file is written; do not save a partial spec. To reverse the side effect, delete the written `specs/<id>/PRODUCT.md` file (and its directory if empty).

## Output
`specs/<id>/PRODUCT.md` — sections in order: Summary, Behavior (numbered invariants), optional Problem, optional Goals/Non-goals, optional Open questions; no Validation, Success criteria, or Testing sections.
