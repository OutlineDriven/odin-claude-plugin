---
name: frontend-ui-engineering
description: 'Use when asked to build or modify production-quality components, layouts, state, and pages with WCAG 2.1 AA and real content. Not for token-system design: use frontend-design-deslop.'
---

# Frontend UI engineering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building or modifying user-facing interfaces and pages: creating components, implementing layouts, managing state, meeting WCAG requirements, or when the output must look production-quality and hand-crafted. |
| Authority | Reversible local: writes only named UI component and page files in the local working tree; rollback is undo. No remote mutation. |
| Side effect | UI components and pages created or modified in the local working tree. |
| Done | The UI meets the project design system, passes WCAG 2.1 AA keyboard and focus checks, is responsive at the required breakpoints, uses real content instead of placeholders, and rejects every named AI-aesthetic tell. |

## Not for

- Token-system design with slop-audit gates: use frontend-design-deslop.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required:
- The component or page to build or modify, and the local file paths that will be created or changed.
- The project design system: spacing scale, semantic color tokens, type hierarchy, and border-radius scale. If absent, stop and request it; never invent values the system does not define.
- The required responsive breakpoints.
- Real content (actual labels, copy, and data shapes) for every rendered surface.

Optional:
- Framework and styling mechanism in use.
- State-management requirements and data-fetching approach.

## Procedure

1. Bound scope before writing: list every component and page file that will be created or modified. Do not touch files outside that list. Done when: the file list is stated and bounded.
2. Read the project design system and use its tokens exclusively: spacing scale, semantic color tokens (`text-primary`, `bg-surface`, `border-default`), type hierarchy, and border-radius scale. Never use raw hex values, off-scale pixel values, or invented spacing. Done when: every value traces to a design-system token.
3. Separate data fetching from presentation: a container component handles loading, error, and empty states; a presentational component receives resolved data and renders it. Done when: data fetching and presentation are in separate components.
4. Compose small focused components rather than over-configured ones. Keep each component under roughly 200 lines and focused on one concern; split larger components by composition. Done when: no component exceeds 200 lines and each has one concern.
5. Choose the narrowest state category that fits, in order: local component state, lifted to the parent, context, URL, server-state library, global store. Use local state for component UI, lifted state shared between two or three siblings, context for read-heavy write-rare values (theme, auth, locale), URL state for shareable filters and pagination, a server-state library for remote cached data, and a global store only for complex app-wide client state. Lift state or use context before prop-drilling past one level, and never prop-drill deeper than three levels. Done when: the state approach is the narrowest that fits and prop-drilling stays within its limits.
6. Make every interactive element keyboard accessible. Use the native HTML element first (`<button>`, `<a>`, `<input>`) so elements are focusable by default; reach for ARIA only when no native element fits. If a non-interactive element must act as a control, add `role`, `tabIndex`, and `Enter`/`Space` key handlers. Provide `aria-label` for icon-only controls and for inputs with no visible label; pair inputs with `<label htmlFor>`. Done when: every interactive element is keyboard accessible with a visible label or aria-label.
7. Manage focus when content changes: move focus to newly revealed content or its close control, and trap focus inside modal dialogs while they are open. Done when: focus management is implemented for every dynamic content change and modal.
8. Render meaningful empty, loading, and error states for every data-driven surface. Use skeleton placeholders marked `aria-busy="true"` for loading, never blank screens or spinners for content areas. Never use color as the sole indicator of state; pair color with text or icons. Done when: all three states are rendered for every data-driven surface and no state relies on color alone.
9. Build mobile-first responsive layouts using the project breakpoint system, then expand upward. Verify the layout at 320px, 768px, 1024px, and 1440px, or at the project's required breakpoints if they differ. Done when: the layout is verified at all required breakpoints.
10. Use real content everywhere. Placeholder or lorem-ipsum text hides wrapping, overflow, and length problems that real content reveals. Done when: every rendered surface uses real content.
11. Reject the AI aesthetic with concrete tells: no default purple or indigo palettes, no excessive gradients, no `rounded-2xl` on everything, no oversized uniform padding, no stock card grids, no generic hero sections where content-first layouts serve, and no layered shadows unless the design system specifies them. Use the project's actual palette, flat or subtle gradients matching the system, and consistent border-radius from the system. Done when: every AI-aesthetic tell is checked and rejected.
12. Verify before declaring done: render without console errors; Tab through every interactive element; confirm a screen reader can convey structure; confirm responsiveness at the required breakpoints; confirm loading, error, and empty states are handled; confirm design-system adherence; run axe-core or browser dev-tools accessibility scan and resolve every warning. Done when: every check passes with zero warnings.

## Failure and recovery

- Missing design system (no tokens, spacing scale, or color tokens available): stop and request it. Do not invent a palette, spacing values, or typography. No file is written.
- Accessibility check fails (keyboard trap, missing focus target, contrast below 4.5:1 for normal text or 3:1 for large text, color used as the sole state indicator): fix the failing element before proceeding. Never suppress the warning or special-case the input.
- Component exceeds roughly 200 lines or mixes data fetching with presentation: split it before continuing.
- Off-scale spacing, raw hex color, or AI-aesthetic pattern detected: replace with the design-system token or remove the pattern.
- Console errors or accessibility warnings remain: the done predicate does not hold. Report blocked with the exact failing check and the file; do not claim success.
- Partial result: ship only the components that pass the done predicate. Mark any unfinished component as blocked and name the failing check.
- Rollback: discard the uncommitted local changes or restore the prior file state. The skill performs no remote, VCS, credential, or deployment mutation, so recovery is local file restoration.

## Output

Created or modified UI component and page files in the local working tree, plus a per-component verification report naming each check and its pass or fail state: console-clean, keyboard navigation, screen-reader conveyance, responsive breakpoints, loading/error/empty states, design-system adherence, and accessibility scan.
