---
name: spec-driven-implementation
description: 'Use when a feature begins or specs are checked in: author or update behavioral specs and keep them current with what ships. Not for producing the initial approved spec and plan: use spec-driven.'
---

# Spec driven implementation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Starting a significant feature or when specs are checked in. |
| Authority | Reversible local: writes only checked-in spec files and implementation; rollback is version control (if commit is not yet pushed). No remote mutation. |
| Side effect | Creates or updates checked-in spec files within the project. |
| Done | Specs exist, are behavioral, and stay current with what ships. |

## Inputs

- Feature brief (required): natural-language description of the feature to implement.
- Existing specs (optional): any spec files already present in the project. If absent, the skill treats the feature as greenfield.
- Scope anchor (required): the module, package, or directory boundary the feature affects.

## Refusal

- Spec drift: implementation adds behavior not covered by any spec. Remove the undocumented behavior or add a covering spec before proceeding.
- Scope overrun: the feature brief names more surface than the scope anchor. Stop and report the overrun; do not widen scope without explicit human confirmation.
- Non-behavioral spec: a proposed spec line describes a solution rather than behavior. Reject it; replace with an observable criterion.
- Unreachable rollback: VCS commit already pushed. Authority is exhausted; surface the conflict and stop. Do not overwrite remote history.

## Procedure

1. **Bound the scope.** From the feature brief and scope anchor, enumerate every file that will be created or modified. If the scope is ambiguous, stop and state the ambiguity rather than inferring a larger surface. Done when: the file set is enumerated or ambiguity is reported.
2. **Audit existing specs.** For each spec file already present in the affected scope, verify it is behavioral: each statement describes observable behavior or acceptance criteria, not implementation design. Discard or narrow any spec line that prescribes a solution path. Done when: every existing spec is verified behavioral.
3. **Identify spec gaps.** Map every feature-brief item to at least one behavioral statement. Mark any item that cannot be expressed as observable behavior as out of scope. Done when: every brief item maps to a behavioral statement or is marked out of scope.
4. **Write or update spec files.** For each gap, add a new spec section with a unique label, the behavioral statement, any preconditions and expected outcomes, and the pass/fail criterion that a test could verify. Place each spec in the file that most directly covers the affected surface. Done when: every gap has a spec section.
5. **Verify spec-implementation alignment.** Confirm that no spec file contradicts an existing implementation. If a conflict exists, surface it before writing. Done when: no spec contradicts existing implementation.
6. **Write or confirm the implementation.** Implement the feature to satisfy the spec. Do not add behavior not described by a spec. Done when: the implementation satisfies every spec.
7. **Commit with a spec-referencing message.** VCS-commit the spec and implementation files with a message that names the spec label(s) satisfied. Done when: one commit names the satisfied spec labels.

## Output

Checked-in spec files covering all behavioral requirements of the feature, aligned with the implementation, and commit messages naming the spec labels satisfied.
