---
name: design-consultation
description: 'Use when /design-consultation proposes a design system with mockups or HTML and persists the approved system in DESIGN.md. Not for in-chat direction picking — use design. No remote, credential, publish, deploy, or irreversible changes.'
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

1. Read the project context that is present: existing DESIGN.md, design tokens, brand guidance, and the target surface. Do not invent context that is absent; state what is missing. **Done when:** present context is read and missing context is named.

2. From the brief and context, propose a design system: color palette, typography scale, spacing and rhythm, component primitives, and interaction states. Keep the proposal concrete and tied to the named surface. **Done when:** the five system parts are proposed and tied to the named surface.

3. Produce a preview the user can react to: mockups or a self-contained HTML preview rendered for the target surface. The preview must reflect the proposed tokens, not generic defaults. **Done when:** a preview exists that reflects the proposed tokens.

4. Present the proposal and preview to the user and request approval. This is the gate: do not write DESIGN.md before approval. **Done when:** the proposal and preview are presented and approval is requested.

5. On approval, persist the approved design system in DESIGN.md: tokens, component primitives, and the rules needed to apply them. Add CLAUDE.md pointers that reference DESIGN.md as the design source of truth. **Done when:** DESIGN.md and CLAUDE.md pointers are written.

6. Keep the design artifacts (mockups or the HTML preview) alongside DESIGN.md in the project directory. **Done when:** artifacts sit alongside DESIGN.md.

## Failure and recovery
- User rejects the proposal: revise the design system and preview, then re-present. Do not persist an unapproved system.
- User does not approve within the session: leave DESIGN.md unchanged. Any artifacts produced are marked unapproved and are not referenced as the design source of truth.
- Missing context (no brief or no target surface): stop and request the missing input rather than inferring a design from defaults.
- Partial result: artifacts may exist, but the done predicate is not met; report the session as blocked awaiting approval, not as done.

## Output
DESIGN.md with the approved design system (tokens, primitives, application rules), CLAUDE.md pointers naming DESIGN.md as source of truth, and design artifacts alongside — ordered read-context → propose → preview → present → persist → keep-artifacts, gated on user approval before any persistence.
