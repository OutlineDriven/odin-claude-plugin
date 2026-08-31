---
name: tailwind-best-practices
description: 'Use when a user asks to write, edit, review, clean, refactor, or audit Tailwind classes, components, or configuration. The skill reorders, deduplicates, and minifies class lists while enforcing semantic utility use and component-level token extraction. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Tailwind best practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write, edit, review, clean, refactor, or audit Tailwind classes, components, or configuration. |
| Authority | Reversible local writes only. Edit class lists and component variants in place; every mutation is reversible by restoring the prior class string or file content. |
| Side effect | Edits class lists and component variants; flags ad-hoc tokens, @apply-heavy styles, magic values, and missing minification. |
| Done | Token and component prerequisites exist; unnecessary utilities, semantics, ordering, @apply avoidance, and fixed variants are checked with version-aware minification. |

## Inputs

- One or more files containing Tailwind class strings, component definitions, or a Tailwind configuration file.
- Optional: target Tailwind CSS version (defaults to the version declared in the project's `package.json` or `tailwind.config`).

## Procedure

1. **Identify Tailwind version.** Read `package.json` or `tailwind.config.js`/`tailwind.config.ts` to determine the installed Tailwind CSS major version. If absent, stop and report the missing prerequisite.
2. **Scan class strings.** Locate every `class`, `className`, `class:list`, template literal containing utility classes, and `@apply` directive in the supplied files.
3. **Remove unnecessary utilities.** Delete utilities that duplicate another utility in the same string (same property, same breakpoint scope). Delete utilities whose effect is overridden by a later utility in the same group.
4. **Enforce semantic utility use.** Replace arbitrary value brackets (`[...]`) with the nearest named utility when one exists. Replace raw color literals in arbitrary values with the project's design-token color scale if defined.
5. **Reorder class strings.** Group utilities by category in this order: layout, flexbox/grid, spacing, sizing, typography, backgrounds, borders, effects, filters, tables, transitions/transforms, interactivity, accessibility. Within each category, sort alphabetically.
6. **Extract repeated patterns into components.** When three or more identical class strings appear across files, propose extracting them into a reusable component or a `@apply`-free utility class in the project's stylesheet. Record the extraction but do not auto-apply if the project lacks a component directory.
7. **Minimize @apply usage.** For each `@apply` block, check whether the same combination can be expressed as a single utility class or a short utility string. If yes, replace the `@apply` block with inline utilities. If the `@apply` block is inside a `@layer` or pseudo-element that requires it, leave it and annotate the reason.
8. **Check fixed variants.** Flag responsive variants (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) that use fixed pixel breakpoints inconsistent with the project's `theme.screens` configuration. Report each mismatch.
9. **Verify minification readiness.** Confirm the project's build pipeline includes CSS minification (check for `cssnano`, `lightningcss`, or Tailwind's built-in minification in v4+). If absent, report the gap.
10. **Emit report.** Produce a summary listing each file changed, the count of utilities removed, reordered, or replaced, and any flags raised.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| No Tailwind config or dependency found | Stop before editing. Report the missing prerequisite. No files are modified. |
| Class string parse failure (malformed template literal) | Skip the malformed string. Log the file and line. Continue with remaining strings. |
| Ambiguous utility replacement | Keep the original utility. Flag it for human review. Do not guess. |
| @apply block required by pseudo-element or @layer | Leave the block unchanged. Annotate with the reason. |

Partial results are valid: files already edited remain edited. No rollback is performed for completed edits; the user can revert via version control.

## Output
- Edited files with reordered, deduplicated, and semantically corrected class strings.
- A summary report listing: files touched, utilities removed, utilities reordered, arbitrary values replaced, @apply blocks converted, fixed-variant flags, and minification-gap flags.

## Provenance

Adapted from `evilmartians/agent-skills` at revision `a2a83b280a2c5b9a6176c5934298fad0224bbce4`. Original license: MIT. Copyright and permission notice preserved. This is a clean-room adaptation; no third-party expression is copied verbatim.
