---
name: frontend-ui-engineering
description: 'Use when asked to build or modify user-facing interfaces and pages: creating components, implementing layouts, meeting WCAG requirements, managing state, or when the output must look production-quality. The UI meets the design system, passes WCAG 2.1 AA keyboard and focus checks, is responsive at the required breakpoints, and uses real content instead of placeholders. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Frontend UI engineering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building or modifying user-facing interfaces and pages: creating components, implementing layouts, meeting WCAG requirements, managing state, or when the output must look production-quality. |
| Authority | Write only the named UI component and page files in the local working tree. Revert by discarding the uncommitted changes or restoring the prior file state. No remote, VCS, credential, paid, published, or deployed mutation. |
| Side effect | UI components and pages created or modified in the local working tree. |
| Done | The UI meets the project design system, passes WCAG 2.1 AA keyboard and focus checks, is responsive at the required breakpoints, and uses real content instead of placeholders. |

## Inputs

Required:
- The component or page to build or modify, and the local file paths that will be created or changed.
- The project design system: spacing scale, semantic color tokens, type hierarchy, and border-radius scale.
- The required responsive breakpoints.
- Real content (actual labels, copy, and data shapes) for every rendered surface.

Optional:
- Framework and styling mechanism in use.
- State-management requirements and data-fetching approach.

## Procedure

1. Bound scope before writing: list every component and page file that will be created or modified. Do not touch files outside that list.
2. Read the project design system and use its tokens exclusively: spacing scale, semantic color tokens (`text-primary`, `bg-surface`, `border-default`), type hierarchy, and border-radius scale. Never use raw hex values, off-scale pixel values, or invented spacing.
3. Separate data fetching from presentation: a container component handles loading, error, and empty states; a presentational component receives resolved data and renders it.
4. Compose small focused components rather than over-configured ones. Keep each component under roughly 200 lines and focused on one concern; split when it exceeds that.
5. Choose the simplest state approach that fits the need: local state for component UI, lifted state shared between two or three siblings, context for read-heavy write-rare values (theme, auth, locale), URL state for shareable filters and pagination, a server-state library for remote cached data, and a global store only for complex app-wide client state. Do not prop-drill deeper than three levels.
6. Make every interactive element keyboard accessible. Use native `<button>`, `<a>`, and `<input>` elements so they are focusable by default. If a non-interactive element must act as a control, add `role`, `tabIndex`, and `Enter`/`Space` key handlers. Provide `aria-label` for icon-only controls and for inputs with no visible label; pair inputs with `<label htmlFor>`.
7. Manage focus when content changes: move focus to newly revealed content or its close control, and trap focus inside modal dialogs while they are open.
8. Render meaningful empty, loading, and error states for every data-driven surface. Use skeleton placeholders marked `aria-busy="true"` for loading, never blank screens or spinners for content areas.
9. Build mobile-first responsive layouts using the project breakpoint system, then expand upward. Verify the layout at 320px, 768px, 1024px, and 1440px, or at the project's required breakpoints if they differ.
10. Use real content everywhere. Placeholder or lorem-ipsum text hides wrapping, overflow, and length problems that real content reveals.
11. Avoid the AI aesthetic: no default purple or indigo palettes, no excessive gradients, no `rounded-2xl` on everything, no oversized uniform padding, no stock card grids, and no layered shadows unless the design system specifies them.
12. Verify before declaring done: render without console errors; Tab through every interactive element; confirm a screen reader can convey structure; confirm responsiveness at the required breakpoints; confirm loading, error, and empty states are handled; confirm design-system adherence; run axe-core or browser dev-tools accessibility scan and resolve every warning.

## Failure and recovery
- Missing design system (no tokens, spacing scale, or color tokens available): stop and request it. Do not invent a palette, spacing values, or typography.
- Accessibility check fails (keyboard trap, missing focus target, contrast below 4.5:1 for normal text or 3:1 for large text, color used as the sole state indicator): fix the failing element before proceeding. Never suppress the warning or special-case the input.
- Component exceeds roughly 200 lines or mixes data fetching with presentation: split it before continuing.
- Off-scale spacing, raw hex color, or AI-aesthetic pattern detected: replace with the design-system token or remove the pattern.
- Partial result: ship only the components that pass the done predicate. Mark any unfinished component as blocked and name the failing check.
- Rollback: discard the uncommitted local changes or restore the prior file state. The skill performs no remote, VCS, credential, or deployment mutation, so recovery is local file restoration.

## Output
The created or modified UI component and page files in the local working tree, plus a per-component verification report naming each check and its pass or fail state: console-clean, keyboard navigation, screen-reader conveyance, responsive breakpoints, loading/error/empty states, design-system adherence, and accessibility scan.

## Provenance

Origin: addyosmani/agent-skills. Pinned revision: d2c37ef6225dd8726cdd369a8030307f48592d26. Source path: skills/frontend-ui-engineering/SKILL.md. License: SPDX MIT, copyright "Copyright (c) 2025 Addy Osmani"; the MIT copyright notice and permission text are retained in derived distributions. Adaptation: clean-room adaptation into odin-create (source module odin-design). The source mechanism is preserved — accessible, performant, production-grade UI construction with design-system adherence, WCAG 2.1 AA keyboard and focus requirements, mobile-first responsive layouts, real content, and rejection of the AI aesthetic — while the expression is rewritten.
