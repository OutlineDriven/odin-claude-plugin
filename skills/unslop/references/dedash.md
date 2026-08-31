# Dedash mode — grammatical-role classification

## Role classes

| Role | Signal | Replacement |
|---|---|---|
| Parenthetical aside | Em-dash pair or single em-dash setting off a clause | Commas |
| Sentence-break pause | Single em-dash mid-sentence replacing a colon or semicolon | Colon or semicolon matching sentence structure |
| Trailing interruption | Em-dash at end of dialogue or abrupt stop | Leave as-is; surface as judgment call |

## Leave-alone classes

Do not replace; log with the matching tag.

| Class | Example | Log tag |
|---|---|---|
| Numeric range | `2020–2025` | `skipped-range` |
| Code span | `` `--flag` `` | `skipped-code` |
| Mathematical notation | `a – b` | `skipped-code` |
| Proper-name hyphen | `Mercedes-Benz` | `skipped-deliberate` |
| Deliberate typographic mark | Author's stylistic choice | `skipped-deliberate` |

## Strictness

- `default`: replace only clear-cut cases. Ambiguous occurrences surface as judgment calls.
- `strict`: surface every occurrence as a judgment call, including clear-cut ones.

## Report format

Per-file: occurrences found, replaced (by role class), skipped (by leave-alone class), judgment calls.
Aggregate: totals across the scope.
Judgment calls: file path, line number, surrounding context, suggested classification.
