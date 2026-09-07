# ODIN Infra

ODIN workflows for CI, deployment, observability, cost, and infrastructure tooling.

13 skills, category Infrastructure. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-infra@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-infra@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-infra/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-infra:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| analysis-artifacts | Use when the user requests a deep dive, exploratory analysis, or data analysis on BigQuery. |
| ci-cd | Use when setting up or modifying CI/CD pipelines, quality gates, test runners, or deployment pipeline configuration through workflow files. |
| ci-fix | Use when "CI is red", "fix the checks", or "make CI green", one check needs classifying, or a bounded sweep runs. |
| consult-deployment | Use when the user asks to rank deployment platforms and stacks against their product with quantitative trade-offs. |
| cost-reduction | Use when a measured cost surface needs one-change-at-a-time reduction under frozen guardrails. |
| dbt-model-index | Use when a human-curated dbt model index must guide BigQuery SQL for a warehouse question. |
| devcontainer-setup | Use when adding a devcontainer or isolated dev environment to a repo that lacks one, for Python, Node/TypeScript, Rust, Go, or a combination. |
| environment-contract-audit | Use when environment-dependent code, templates, or deployment configuration changes, or when runtime configuration is missing. |
| fail-recover | Use when the user asks to restore service from a known failure with a prescribed recovery operation. |
| observability | Use when adding telemetry, composing an observability surface, reviewing alerts, shipping a production feature, or diagnosing a production issue. |
| promql-cli | Use when asked to execute or investigate a PromQL expression against a Prometheus server. |
| terraform-style-check | Use when writing, reviewing, or generating Terraform HCL that must pass fmt and validate. |
| toolchain-health | Use when the user runs /toolchain-health and wants a trustworthy green/yellow/red verdict on the installed toolchain with ranked repairs. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
