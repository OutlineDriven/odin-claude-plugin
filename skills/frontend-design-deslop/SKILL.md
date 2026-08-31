---
name: frontend-design-deslop
description: 'Use when a user builds or styles a web frontend or asks to make it not look AI-generated. Commits a token system and a crafted interface that passes a recorded slop-audit and WCAG 2.2 AA gate. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Frontend design deslop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User builds or styles a web frontend or asks to make it not look AI-generated. |
| Authority | Reversible local writes only to DESIGN.md, design token files, and component CSS in the working project. Roll back by reverting those files via version control; no other files are touched. |
| Side effect | Writes DESIGN.md, design tokens, and component CSS. |
| Done | A committed token system and a crafted interface with a recorded slop-audit pass and a WCAG 2.2 AA pass/fail gate that passes. |

## Inputs

Required: the frontend project directory to style, and the surface to craft (page, component, or app shell).

Optional: brand palette, typeface preferences, existing token files, and a target framework. When omitted, derive a neutral token system from the project's existing styles; state that it was derived rather than supplied.

## Procedure

1. Read the target surface and any existing styles, tokens, and brand inputs. Record what was found versus supplied so the design system is grounded, not invented.
2. Author a design strategy in DESIGN.md: layout grid, type scale, color system in OKLCH, spacing scale, motion intent, and component list. State the strategy before writing tokens so the tokens follow a decision, not a guess.
3. Emit a token system as CSS custom properties (or the project's token format) covering color, typography, spacing, radius, shadow, and motion. Tokens are the single source of truth; component CSS references tokens, never hard-coded values.
4. Craft the interface using the tokens. Apply the NEVER-slop list and reject every violation before claiming the surface done:
   - Generic AI gradient backgrounds and rainbow color stops.
   - Default framework spacing, borders, and radius with no design intent.
   - Centered hero stacks, three-card feature grids, and other templated AI layouts used without purpose.
   - Hard-coded color, font, spacing, or radius values that bypass the token system.
   - Placeholder copy, lorem ipsum, or unfilled image alt text.
   - Low-contrast text, focus rings removed, or interactive elements without a visible focus state.
5. Run a WCAG 2.2 AA pass/fail gate over the crafted surface: contrast ratios for text and UI components, focus visibility, target sizes, and semantic structure. Record pass or fail per criterion.
6. Run a slop audit against the NEVER-slop list and record each item as cleared or violated. Fix violations in the interface and tokens before recording a pass.
7. Commit DESIGN.md, the token files, and the component CSS. Record the slop-audit result and the WCAG 2.2 AA gate result alongside the commit so the pass is auditable.

## Failure and recovery
- WCAG 2.2 AA gate fails: do not record a pass. Fix the failing criterion in tokens or component CSS and re-run the gate. If a criterion cannot be met within the supplied inputs, stop and report the unmet criterion and the input gap.
- Slop audit finds a violation: fix it in the interface or tokens and re-audit. A partial pass (some items cleared, others not) is not a done state; record the outstanding violations and continue only on them.
- Token system conflicts with existing styles: prefer the new token system and update component CSS to reference it; do not leave hard-coded overrides. If a caller-supplied constraint makes the token system incoherent, stop and report the conflict rather than shipping inconsistent tokens.
- Rollback: revert DESIGN.md, token files, and component CSS via version control. No other files were written, so no further recovery is needed.

## Output
A committed DESIGN.md, a token system file, and component CSS that implements the crafted interface, plus a recorded slop-audit pass and a WCAG 2.2 AA gate pass. The done predicate is met only when both gates pass and the artifacts are committed.

## Provenance

Origin: samber/cc-skills, skill `frontend-design-deslop`. Pinned revision f9953962e135235137628ea92d06ea085688031f. License: MIT. Adapted as a clean-room semantic-minimum procedure preserving the source mechanism: a strategy-driven frontend design workflow with a NEVER-slop list and a WCAG 2.2 AA pass/fail gate that writes DESIGN.md, tokens, and component CSS.
