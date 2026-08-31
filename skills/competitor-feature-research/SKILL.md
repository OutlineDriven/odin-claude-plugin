---
name: competitor-feature-research
description: 'Use when the user asks to research a specific feature across competitor products and publish a cited report. Don''t use for automated or model-initiated publication without explicit human approval.'
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

1. Confirm `feature`, `competitors`, and `product_docs_url` are supplied. Stop and request any missing required input before writing anything.
2. For each competitor, fetch the product docs at the configured `product_docs_url` (or the per-competitor URL) and extract the capabilities relevant to the target feature. Record the exact source URL for every extracted claim.
3. Build a per-competitor feature list; each entry is cited with its product-docs URL.
4. Construct a comparison table: rows are competitors, columns are the feature's sub-capabilities, cells are supported / not supported / partial, each non-empty cell cited with a URL.
5. Identify gaps (capabilities no competitor offers), risks (capabilities that are partial or fragile across competitors), and insights (patterns or differentiators).
6. Write a TL;DR summarizing the comparison in three to five sentences.
7. Assemble the report at `reports/feature_research/feature_research_<date>.md` with sections in this order: TL;DR, Competitor Feature Lists, Comparison Table, Gaps, Risks, Insights. Every non-obvious claim carries a cited product-docs URL.
8. Stop before publishing or opening a PR. Present the report path to the human. Only after explicit human approval, open a pull request referencing the report path.

## Failure and recovery
- Missing required input: stop, name the missing input, do not write the report.
- Product docs unreachable or the URL returns non-doc content: mark that competitor's cells as `unknown (source unavailable)` with the attempted URL; do not infer capabilities. Continue with the remaining competitors.
- A claim cannot be resolved to a product-docs URL: drop the claim rather than assert it uncited; record the dropped claim as a Risks note.
- Human does not approve publication: leave the report on disk uncommitted and do not open a PR. The done predicate is not satisfied; return the report path and the blocked reason.
- Partial result: ship the report with the available competitors and explicit `unknown` cells; never silently omit a competitor from the list.

## Output
- A Markdown report at `reports/feature_research/feature_research_<date>.md` containing TL;DR, Competitor Feature Lists, Comparison Table, Gaps, Risks, and Insights, each non-obvious claim cited with a product-docs URL.
- After human approval, an open pull request referencing the report path.

## Provenance

- Origin: warpdotdev/competitive-intelligence-agent-oss, path `.warp/skills/feature_research/SKILL.md`.
- Revision: `9e0363e810a14405ef876fb354562735002797fb`.
- License: MIT; notice retained, mechanism adapted.
- Adaptation: kept the TL;DR plus comparison table plus gaps/risks structure; made the product docs URL a config value; remapped the workflow to odin-research; constrained PR creation to human-only approval.

MIT permission text for the reused mechanism:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
