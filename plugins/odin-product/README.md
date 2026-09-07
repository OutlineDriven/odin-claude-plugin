# ODIN Product

ODIN workflows for product strategy, market signals, and developer adoption.

14 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-product@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-product@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-product/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-product:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| buyer-objection-research | Use when product copy needs buyer-objection evidence collected through approved, consented outreach. |
| buzzword-analysis | Use when the user wants the current jargon weather of a domain described without advocacy. |
| buzzword-hijack | Use when a user wants to choose and execute a bounded positioning move that rides a jargon wave. |
| competitor-feature-research | Use when asked to research a feature across competitor products or to analyze competitor release changelogs (mode: changelog), and publish a cited report. |
| customer-feedback-report | Use when customer feedback, NPS, churn, email feedback, call transcripts, or voice-of-the-customer analysis needs a report over a time window. |
| developer-experience-review | Use when dogfooding a developer-facing product or workflow to produce an evidence-backed DX scorecard. |
| pricing-projection | Use when projecting cost, estimating BYO cost or spend, or sizing a deal. |
| product-signal-pulse | Use when invoking /product-signal-pulse with an optional lookback window to query configured product signals. |
| recorded-feedback-analysis | Use when asked to analyze a screen recording, voice capture, or meeting notes artifact for product feedback. |
| release-promotion | Use when asked to draft launch or promotion copy for a shipped feature across channels via /release-promotion. |
| social-sentiment | Use when the user asks for a weekly sentiment report, weekly social summary, or how mentions looked this week. |
| strategy | Use when defining product strategy, starting or redirecting a product, or repairing stale STRATEGY.md. |
| viral-opportunity-scout | Use when asked to find distribution opportunities for a template, tool, or artifact. |
| write-product-spec | Use when a user asks for a product spec with invariants, a tech spec, or a PRD. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
