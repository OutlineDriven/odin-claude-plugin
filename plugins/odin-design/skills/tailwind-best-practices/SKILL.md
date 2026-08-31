---
name: tailwind-best-practices
description: 'Use when writing, editing, cleaning, or refactoring Tailwind classes, components, or configuration. Reorders and deduplicates classes, replaces arbitrary values with project tokens, and checks component extraction. Not for read-only audits of Tailwind code, or general CSS without Tailwind.'
---

# Tailwind best practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write, edit, clean, or refactor Tailwind classes, components, or configuration. Read-only review or audit requests are out of scope. |
| Authority | Reversible local writes only. Edit class lists and component variants in place; every mutation is reversible by restoring the prior class string or file content. |
| Side effect | Edits class lists and component variants; flags ad-hoc tokens, @apply-heavy styles, magic values, and missing minification. |
| Done | Token and component prerequisites exist; unnecessary utilities, semantics, ordering, @apply avoidance, and fixed variants are checked with version-aware minification. |

## Inputs

- One or more files containing Tailwind class strings, component definitions, or a Tailwind configuration file.
- Optional target Tailwind CSS version; defaults to the version declared in the project's `package.json` or Tailwind configuration.

## Refusal

- No Tailwind config or dependency found: stop before editing. Report the missing prerequisite. Modify no files.
- Class string parse failure: skip the malformed string. Record its file and line, then continue.
- Ambiguous utility replacement: keep the original utility and flag it for human review. Do not guess.
- Required `@apply` block: leave an `@apply` inside a pseudo-element or `@layer` unchanged and record why.
- Read-only review or audit requested with no edits: out of scope. Report that this skill runs only as a write, edit, clean, or refactor pass, and modify no files.

## Procedure

1. **Identify the Tailwind version.** Read `package.json` or the Tailwind configuration to determine the installed major version. Done when: the version is known or the missing prerequisite is reported.
2. **Scan class strings.** Locate every `class`, `className`, `class:list`, template literal containing utility classes, and `@apply` directive in the supplied files. Done when: every supplied file has been scanned.
3. **Remove unnecessary utilities.** Delete utilities that duplicate another utility in the same string and breakpoint scope. Delete utilities overridden by a later utility in the same group. Done when: no known duplicate or overridden utility remains.
4. **Enforce semantic utility use.** Replace arbitrary value brackets with the nearest named utility when one exists. Replace raw color literals with the project's design-token color scale when defined. Done when: each arbitrary value is replaced or retained with a reason.
5. **Reorder class strings.** Group utilities in this order: layout, flexbox/grid, spacing, sizing, typography, backgrounds, borders, effects, filters, tables, transitions/transforms, interactivity, accessibility. Sort alphabetically within each category. Done when: every parsed class string follows the order.
6. **Extract repeated patterns into components.** When three or more identical class strings appear across files, propose a reusable component or an `@apply`-free utility class. Record the extraction but do not apply it when the project lacks a component directory. Done when: repeated patterns are extracted or flagged.
7. **Minimize `@apply`.** Replace each `@apply` block with inline utilities when the same combination has a direct expression. Keep blocks required by a pseudo-element or `@layer` and record why. Done when: every block is converted or justified.
8. **Check fixed variants.** Flag responsive variants whose fixed pixel breakpoints conflict with `theme.screens`. Done when: every mismatch is reported.
9. **Verify minification readiness.** Check for `cssnano`, `lightningcss`, or Tailwind's built-in minification in v4+. Done when: minification is confirmed or the gap is reported.
10. **Emit the report.** Record each file changed, utility counts removed/reordered/replaced, and every flag. Done when: the report accounts for every edit and unresolved item.

## Failure modes

- Partial result: completed file edits remain. The user can restore prior content through version control; do not roll back successful edits because another class string could not be parsed.

## Output

Edited files, then a summary report ordered by file with utilities removed, reordered, arbitrary values replaced, `@apply` blocks converted, fixed-variant flags, and minification gaps.
