---
name: design-consultation
description: 'Use when the user runs /design-consultation, propose a design system with mockups or an HTML preview and persist the approved system in DESIGN.md. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Design consultation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /design-consultation |
| Authority | Write only the named local artifacts: DESIGN.md, CLAUDE.md pointers, and design artifacts (mockups or an HTML preview). No remote, VCS, credential, paid, published, or deployed mutation. Roll back by reverting those files. |
| Side effect | Local writes to DESIGN.md, CLAUDE.md pointers, and design artifacts, bounded to the current project directory. |
| Done | An approved design system is persisted in DESIGN.md. |

## Inputs

- A design brief or the feature/surface under design, supplied by the user. Required.
- Project context: existing design tokens, brand guidance, target surface (web, TUI, mobile), and any existing DESIGN.md to extend. Optional; read what is present.
- User approval is the in-loop gate: no design system is persisted until the user approves it.

## Procedure

1. Read the project context that is present: existing DESIGN.md, design tokens, brand guidance, and the target surface. Do not invent context that is absent; state what is missing.
2. From the brief and context, propose a design system: color palette, typography scale, spacing and rhythm, component primitives, and interaction states. Keep the proposal concrete and tied to the named surface.
3. Produce a preview the user can react to: mockups or a self-contained HTML preview rendered for the target surface. The preview must reflect the proposed tokens, not generic defaults.
4. Present the proposal and preview to the user and request approval. This is the gate: do not write DESIGN.md before approval.
5. On approval, persist the approved design system in DESIGN.md: tokens, component primitives, and the rules needed to apply them. Add CLAUDE.md pointers that reference DESIGN.md as the design source of truth.
6. Keep the design artifacts (mockups or the HTML preview) alongside DESIGN.md in the project directory.

## Failure and recovery
- User rejects the proposal: revise the design system and preview, then re-present. Do not persist an unapproved system.
- User does not approve within the session: leave DESIGN.md unchanged. Any artifacts produced are marked unapproved and are not referenced as the design source of truth.
- Missing context (no brief or no target surface): stop and request the missing input rather than inferring a design from defaults.
- Partial result: artifacts may exist, but the done predicate is not met; report the session as blocked awaiting approval, not as done.

## Output
- DESIGN.md containing the approved design system: tokens, component primitives, and application rules.
- CLAUDE.md pointers identifying DESIGN.md as the design source of truth.
- Design artifacts (mockups or an HTML preview) in the project directory.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adaptation: clean-room re-derivation of the design-consultation procedure; no third-party expressive prose or code copied wholesale.
