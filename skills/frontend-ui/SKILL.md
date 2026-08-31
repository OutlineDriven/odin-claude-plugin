---
name: frontend-ui
description: 'Use when asked to build user-facing interfaces when creating or modifying components, implementing layouts and state, or when output must look hand-crafted. The component renders without console errors, is keyboard and screen-reader accessible, responsive across 320-1440px, design-system-compliant, and handles every interaction state. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Frontend UI engineering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Creating or modifying UI components, implementing layouts and state, or output must look hand-crafted |
| Authority | Write only named local UI component and layout files; rollback by reverting the changed files |
| Side effect | UI components and layouts written against project design tokens and accessibility standards |
| Done | Component renders without console errors, keyboard and screen-reader accessible, responsive at 320-1440px, design-system-compliant, all states handled |

## Inputs

- The build or modify request naming the component or layout to produce.
- The project design system: spacing scale, type hierarchy, and semantic color tokens. Required; if absent, request it before building.
- The target stack and framework the project uses. Required.
- The existing component to modify, when the task is a modification. Optional for new builds.

## Procedure

1. Read the project design system and take spacing, type hierarchy, and semantic color tokens from it. Never invent values the system does not define; if the system is missing, stop and request it.
2. Choose the narrowest state category that fits, in order: local component state, lifted to parent, context, URL, server, global store. Lift state or use context before prop-drilling past one level.
3. Use the native HTML element first; reach for ARIA only when no native element fits. Meet WCAG 2.1 AA for every interactive element.
4. Reject the AI aesthetic with concrete tells: use the project's actual color palette rather than purple/indigo defaults, flat or subtle gradients matching the system, consistent border-radius from the system, content-first layouts over generic hero sections, realistic placeholder content over lorem ipsum, the system's spacing scale over oversized uniform padding, purpose-driven layouts over stock card grids, and subtle or no shadows unless the system specifies them.
5. Build responsive mobile-first and verify the layout at 320px, 768px, 1024px, and 1440px.
6. Handle loading, error, and empty states explicitly for every data-driven view.
7. Keep each component under 200 lines; split larger components by composition. Never use color as the sole indicator of state; pair color with text or icons.
8. Verify the result: render without console errors, Tab through every interactive element, confirm a screen reader conveys content and structure, and run axe-core or dev-tools accessibility checks with zero warnings.

## Failure and recovery
- Missing design system: stop and request it; do not invent tokens. No file is written.
- Component exceeds 200 lines: split it before declaring done.
- Accessibility check fails (keyboard trap, missing label, axe-core warning): fix the native-element or ARIA issue; never suppress the warning or special-case the input.
- Console errors or accessibility warnings remain: the done predicate does not hold. Report blocked with the exact failing check and the file; do not claim success.
- Rollback: revert the changed local files. This skill performs no remote, VCS-force, credential, paid, publish, or deploy mutation.

## Output
A UI component or layout, in the project's stack, that renders without console errors, is keyboard and screen-reader accessible, is responsive across 320-1440px, conforms to the project design system, and handles loading, error, and empty states.

## Provenance

Origin: odin-1.x current skill at `skills/frontend-ui/SKILL.md`. Revision unpinned. License: project-owned. Adaptation: collapsed two overlapping accessibility references into one inline WCAG 2.1 AA standard and folded the generic-principle references into this self-contained procedure; no third-party expression copied.
