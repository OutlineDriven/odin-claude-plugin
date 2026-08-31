---
name: competitor-feature-research
description: 'Use when the user asks to research a specific feature across competitor products and publish a cited report. Not for summarizing changelogs — use competitor-changelog.'
disable-model-invocation: true
---

# Competitor feature research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to research a specific feature or functionality across competitor products. |
| Authority | Human-only. The model researches and drafts; only a human approves report publication and PR creation. No model-initiated publish, PR, or remote mutation. |
| Side effect | Writes a structured feature analysis report to reports/feature_research/ and opens a pull request referencing it. No other files, credentials, or remote mutation. |
| Done | Report exists at reports/feature_research/ and includes TL;DR, per-competitor feature lists, a comparison table, gaps, risks, and insights, each non-obvious claim cited with a product-docs URL; a PR is open referencing the report. |

## Inputs

- `feature`: the feature or functionality to research (required).
- `competitors`: the set of competitor products to cover (required, at least one).
- `product_docs_url`: base URL or per-competitor docs URL used as the citation source (required config value, supplied by the human).
- Optional: report date (defaults to today) and report filename suffix.

## Procedure

1. Confirm `feature`, `competitors`, and `product_docs_url` are supplied. Stop and request any missing required input before writing anything. Done when: all required inputs are confirmed or the missing input is named and the skill stops.
2. For each competitor, fetch the product docs at the configured `product_docs_url` (or the per-competitor URL) and extract the capabilities relevant to the target feature. Record the exact source URL for every extracted claim. Done when: every competitor's docs are fetched and capabilities extracted with source URLs, or the unreachable competitor is marked unknown.
3. Build a per-competitor feature list; each entry is cited with its product-docs URL. Done when: every competitor has a cited feature list.
4. Construct a comparison table: rows are competitors, columns are the feature's sub-capabilities, cells are supported / not supported / partial, each non-empty cell cited with a URL. Done when: the comparison table is complete with cited cells.
5. Identify gaps (capabilities no competitor offers), risks (capabilities that are partial or fragile across competitors), and insights (patterns or differentiators). Done when: gaps, risks, and insights are each listed.
6. Write a TL;DR summarizing the comparison in three to five sentences. Done when: the TL;DR is written.
7. Assemble the report at `reports/feature_research/feature_research_<date>.md` with sections in this order: TL;DR, Competitor Feature Lists, Comparison Table, Gaps, Risks, Insights. Every non-obvious claim carries a cited product-docs URL. Done when: the report is assembled with all six sections in order and every non-obvious claim cited.
8. Stop before publishing or opening a PR. Present the report path to the human. Only after explicit human approval, open a pull request referencing the report path. Done when: the PR is open after explicit human approval, or the report path is presented and the skill awaits approval.

## Failure and recovery
- Missing required input: stop, name the missing input, do not write the report.
- Product docs unreachable or the URL returns non-doc content: mark that competitor's cells as `unknown (source unavailable)` with the attempted URL; do not infer capabilities. Continue with the remaining competitors.
- A claim cannot be resolved to a product-docs URL: drop the claim rather than assert it uncited; record the dropped claim as a Risks note.
- Human does not approve publication: leave the report on disk uncommitted and do not open a PR. The done predicate is not satisfied; return the report path and the blocked reason.
- Partial result: ship the report with the available competitors and explicit `unknown` cells; never silently omit a competitor from the list.

## Output
Report at `reports/feature_research/feature_research_<date>.md` (TL;DR → Competitor Feature Lists → Comparison Table → Gaps → Risks → Insights, each non-obvious claim cited), plus after human approval an open PR referencing the report path.
