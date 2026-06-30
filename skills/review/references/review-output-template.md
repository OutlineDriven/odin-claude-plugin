# Review Output Template

This is the **canonical skeleton** for deep-mode review output -- copy the section structure; the example shows one good rendering, not the only permitted layout. Shape each finding for the reader's next action. Findings are grouped by severity, not by persona.

**Hard constraints (non-negotiable):** ASCII-safe only -- no box-drawing or per-item horizontal-rule separators, no Unicode arrows, middot, or em dashes; use `->` for arrows, `--` for dashes. Don't paste file contents or re-print the diff -- cite `file:line`. Stable `#` numbering, reused wherever a finding reappears. The Verdict blockquote is always last and self-sufficient. The Actionable Findings section is conditional (include when the queue is non-empty) and always precedes Pre-existing and Coverage.

**If you use a markdown table, escape literal pipe characters in cells.** Any `|` inside a finding title, issue description, code snippet, or example must be written as `\|` so column boundaries are determined only by unescaped pipes.

## Example

```markdown
## Code Review Results

**Scope:** merge-base with the review base branch -> working tree (14 files, 342 lines)
**Intent:** Add order export endpoint with CSV and JSON format support
**Mode:** deep

**Personas:** correctness, testing, maintainability, security, api-contract
- security -- new public endpoint accepts user-provided format parameter
- api-contract -- new /api/orders/export route with response schema

### P0 -- Critical

| # | File | Issue | Persona | Confidence |
|---|------|-------|---------|------------|
| 1 | `orders_controller.rb:42` | User-supplied ID in lookup, no ownership check | security | high |

- **#1** -- `find(params[:id])` on the export path has no `where(account: current_account)` scope, so any authenticated user can export another account's orders. Scope the lookup to the current account.

### P1 -- High

| # | File | Issue | Persona | Confidence |
|---|------|-------|---------|------------|
| 2 | `export_service.rb:87` | Loads all orders into memory -- unbounded | performance | high |

- **#2** -- `Order.where(...).to_a` materializes the full result set; a large account OOMs the worker. Stream with `find_each` or paginate.

### P2 -- Moderate

| # | File | Issue | Persona | Confidence |
|---|------|-------|---------|------------|
| 3 | `export_service.rb:45` | No error handling for CSV serialization failure | correctness | med |

### P3 -- Low

| # | File | Issue | Persona | Confidence |
|---|------|-------|---------|------------|
| 4 | `export_helper.rb:12` | Format detection could use an early return | maintainability | med |

### Actionable Findings

| # | File | Issue | Route | Notes |
|---|------|-------|-------|-------|
| 1 | `orders_controller.rb:42` | Ownership check missing on export lookup | `gated -> review-fix-grill-loop` | `suggested-route` present -- caller decides whether to apply |
| 2 | `export_service.rb:87` | Unbounded memory on export | `safe -> fix` | Mechanical: add `find_each` |

### Pre-existing Issues

| # | File | Issue | Persona |
|---|------|-------|---------|
| 1 | `orders_controller.rb:12` | Broad rescue masking failed permission check | correctness |

### Coverage

- Suppressed: 2 findings below the confidence gate
- Residual risks: No rate limiting on export endpoint
- Testing gaps: No test for concurrent export requests

---

> **Verdict:** Ready with fixes
>
> **Reasoning:** 1 critical auth bypass must be fixed. The memory issue (P1) should be addressed for production safety.
>
> **Fix order:** P0 auth bypass -> P1 memory -> P2 error handling if straightforward
```

## Formatting Rules

- **ASCII-safe only** -- never box-drawing characters or per-item horizontal-rule separators between entries, no Unicode arrows or middot; use `->`.
- **Escape literal `|` in table cells** -- any `|` inside a finding title, issue description, code snippet, or example must be written as `\|`.
- **Severity-grouped sections** -- `### P0 -- Critical`, `### P1 -- High`, `### P2 -- Moderate`, `### P3 -- Low`. Omit empty severity levels.
- **Stable sequential finding numbers** -- assign finding numbers once after sorting, continue them across severity sections, and reuse those same numbers when findings are repeated in Actionable Findings.
- **Always include file:line location** for code review issues.
- **Persona column** shows which persona(s) flagged the issue. Multiple personas = cross-persona agreement.
- **Confidence column** shows `high`, `med`, or `low`.
- **No Route column in per-severity tables** -- the route appears only in the Actionable Findings table.
- **Detail line (per finding, as needed)** -- keep the scannable line short; put the why-it-matters + fix in a per-finding detail line keyed by stable `#`: `- **#N** -- <why it matters + what response it needs>`.
- **Actionable Findings section** -- include when the actionable queue is non-empty.
- **Pre-existing section** -- separate table, no confidence column.
- **Coverage section** -- suppressed count, residual risks, testing gaps.
- **Summary uses blockquotes** for verdict, reasoning, and fix order.
- **Horizontal rule** (`---`) separates findings from verdict.
- **`###` headers** for each section.
