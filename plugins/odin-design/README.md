# ODIN Design

ODIN workflows for interface design, prototypes, and visual fidelity.

21 skills, category Design. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-design@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-design@odin-marketplace
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one with `/skill:<name>`.

| Skill | Trigger |
|---|---|
| design | Use when starting UI work, defining palettes or tokens, fixing AI-generic UI, or persisting a design system to DESIGN.md (modes: implement, persist). |
| design-gate-brainstorming | Use when creative work is requested with no approved design, or a raw idea or repository must be developed into an approved design document. |
| design-variants | Use when /design-variants generates distinct design directions and a gallery for selection. |
| final-grain | Use when asked to push an already-working artifact to finished composition, texture, and feel. |
| fixed-view-visual-benchmark | Use when a visual needs repeatable fixed-view rendering and independent rubric scoring. |
| frame-rate-stability | Use when a rendering path needs stable frame-time, CPU, GPU, and memory evidence against fixed targets. |
| frontend-design-deslop | Use when a user builds or styles a web frontend or asks to make it not look AI-generated. |
| frontend-fidelity-rebuild | Use when an authorized reference surface needs a clean-room frontend reconstruction across static, motion, and responsive fidelity. |
| frontend-ui-engineering | Use when asked to build or modify production-quality components, layouts, state, and pages with WCAG 2.1 AA and real content. |
| ios-visual-review | Use when the user invokes /ios-visual-review to audit an iOS app's visuals on a real device. |
| make-bot-ui | Use when a human invokes this skill to build a webhook UI that wakes a bot. |
| polished-web-prototype | Use when /polished-web-prototype runs or a user builds an artifact from a mockup, design plan, or brief. |
| product-design | Use when deciding what an interface should do before UI is built or audited: consequences, action scope, reachable states, naming, and accessibility. |
| prototype | Use when asked to prototype one design question through a cheap logic or UI experiment, including button-driven state-model checks. |
| tailwind-best-practices | Use when writing, editing, cleaning, or refactoring Tailwind classes, components, or configuration. |
| thumbnail-accuracy-scorecard | Use when thumbnail concepts need real-size, accuracy-first scoring without misleading claims. |
| typography-audit | Use when asked to audit typography across a codebase. |
| ui-animation | Use when asked to build spring, easing, gesture, and choreographed animations with correct physics and reduced-motion support. |
| ui-design | Use when directing, building, or auditing React/Next.js Tailwind UI: visual direction, responsive/dark-mode retrofits, UX audits. |
| web-accessibility-audit | Use when the user requests an accessibility audit, a11y check, or WCAG compliance review. |
| web-design-review | Use when the user runs /web-design-review with a URL to visually audit and fix a live UI. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
