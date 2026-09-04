---
name: frontend-design-deslop
description: 'Use when a user builds or styles a web frontend or asks to make it not look AI-generated. Not for component-level UI work without the token system: use frontend-ui-engineering.'
---

# Frontend design deslop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User builds or styles a web frontend or asks to make it not look AI-generated. |
| Authority | Reversible local: writes only DESIGN.md, design token files, and component CSS in the working project; rollback is version control. No remote mutation. No other files are touched. |
| Side effect | Writes DESIGN.md, design tokens, and component CSS. |
| Done | A committed token system and a crafted interface with a recorded slop-audit pass and a WCAG 2.2 AA pass/fail gate that passes. |

## Not for

- Component-level UI work without a token system: use frontend-ui-engineering.
- Clean-room reconstruction of an authorized reference surface: use frontend-fidelity-rebuild.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required: the frontend project directory to style, and the surface to craft (page, component, or app shell).

Optional: brand palette, typeface preferences, existing token files, and a target framework. When omitted, derive a neutral token system from the project's existing styles; state that it was derived rather than supplied.

## Procedure

1. Read the target surface and any existing styles, tokens, and brand inputs. Record what was found versus supplied so the design system is grounded, not invented. Done when: found-versus-supplied is recorded.
2. Author a design strategy in DESIGN.md: layout grid, type scale, color system in OKLCH, spacing scale, motion intent, and component list. State the strategy before writing tokens so the tokens follow a decision, not a guess. Done when: DESIGN.md strategy section is written.
3. Emit a token system as CSS custom properties (or the project's token format) covering color, typography, spacing, radius, shadow, and motion. Tokens are the single source of truth; component CSS references tokens, never hard-coded values. Done when: token system covers all six categories and no component CSS uses hard-coded values.
4. Craft the interface using the tokens. Apply the never-slop list and reject every violation before claiming the surface done:
   - Generic AI gradient backgrounds and rainbow color stops.
   - Default framework spacing, borders, and radius with no design intent.
   - Centered hero stacks, three-card feature grids, and other templated AI layouts used without purpose.
   - Hard-coded color, font, spacing, or radius values that bypass the token system.
   - Placeholder copy, lorem ipsum, or unfilled image alt text.
   - Low-contrast text, focus rings removed, or interactive elements without a visible focus state.
   Done when: every never-slop item is checked and cleared or fixed.
5. Run a WCAG 2.2 AA pass/fail gate over the crafted surface: contrast ratios for text and UI components, focus visibility, target sizes, and semantic structure. Record pass or fail per criterion. Done when: every criterion is recorded as pass.
6. Run a slop audit against the never-slop list and record each item as cleared or violated. Fix violations in the interface and tokens before recording a pass. Done when: every item is recorded as cleared.
7. Commit DESIGN.md, the token files, and the component CSS. Record the slop-audit result and the WCAG 2.2 AA gate result alongside the commit so the pass is auditable. Done when: artifacts are committed with both gate results recorded.

## Failure and recovery

- WCAG 2.2 AA gate fails: do not record a pass. Fix the failing criterion in tokens or component CSS and re-run the gate. If a criterion cannot be met within the supplied inputs, stop and report the unmet criterion and the input gap.
- Slop audit finds a violation: fix it in the interface or tokens and re-audit. A partial pass is not a done state; record the outstanding violations and continue only on them.
- Token system conflicts with existing styles: prefer the new token system and update component CSS to reference it; do not leave hard-coded overrides. If a caller-supplied constraint makes the token system incoherent, stop and report the conflict rather than shipping inconsistent tokens.
- Rollback: revert DESIGN.md, token files, and component CSS via version control. No other files were written, so no further recovery is needed.

## Output

Committed DESIGN.md, token system file, and component CSS implementing the crafted interface, plus a recorded slop-audit pass and WCAG 2.2 AA gate pass; the done predicate holds only when both gates pass and the artifacts are committed.
