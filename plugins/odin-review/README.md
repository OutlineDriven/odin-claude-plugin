# ODIN Review

ODIN workflows for reviewing diffs, branches, and implementations against their specs.

17 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-review@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-review@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-review/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-review:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| audit-project | Use when the user says "audit my code", "find all the bugs", "review until clean", or "grill my changes". |
| ax-audit | Use when asked to audit an agent or AI feature for agentic-experience quality (AX review, agent-native critique, trust question). |
| blast-radius | Use when asked to determine what a change could break before it ships. |
| complexity-grill | Use when a user wants to identify the true sources of complexity qualitatively before counting metrics. |
| dx-audit | Use when auditing the developer-facing surface of a CLI, SDK, library, or package: API contracts, errors, public types, onboarding, and config. |
| feedback-pattern-sweep | Use when recent resolved feedback may reveal a broader recurring defect pattern across the project surface. |
| interrogate | Use when asked to "interrogate" or run an adversarial multi-model review of a supplied code artifact. |
| no-hide | Use when the user asks to detect clever-concealment patterns that obscure real code structure. |
| perspective-complete-review | Use when one named review viewpoint must run fix cycles until a fresh reviewer finds nothing. |
| pr-impact-quiz | Use when the user invokes this skill to generate targeted questions proving the author understands the change's codebase effect. |
| review | Use when asked to review a pull request, examine code changes, find bugs, or audit a branch, in standard or depth mode. |
| review-speedread | Use when a human asks for the change shape before reading a diff. |
| sarif-parsing | Use when a user supplies existing SARIF to inspect, filter, aggregate, deduplicate, diff, convert, or gate findings. |
| show-review | Use when the user wants a per-finding visual walk through a diff or PR. |
| spec-to-code-compliance | Use when implementation must be checked against an authoritative specification, or during PR review for spec drift against checked-in specs. |
| validate-changes-match-specs | Use when asked to compare implementation against repository specs, report mismatches, resolve by user decision, or check PR-review commitments. |
| visual-diff-review | Use when asked to review a diff and produce a 7-section visual page. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
