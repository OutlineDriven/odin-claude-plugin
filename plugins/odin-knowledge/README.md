# ODIN Knowledge

ODIN workflows for memory, session continuity, decision records, and retrospectives.

41 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-knowledge@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-knowledge@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-knowledge/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-knowledge:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| autolearn | Use when a verified non-trivial fix lands or existing solution docs need refresh. |
| catchup | Use when the human returns after a gap, cannot follow the project, asks what happened, or wants a visual HTML recap page. |
| compound | Use when the user explicitly asks to save, curate, or consolidate what was learned, or closes a meaningful knowledge-work session. |
| context-engineering | Use when a long session has accumulated stale or conflicting context or the user asks to refresh it. |
| continual-learning | Use when asked to mine prior chats on a scheduled or watcher tick and maintain project memory. |
| decision-diary | Use when a user wants to record why one world won over the others, as a decision-diary entry. |
| docs-and-adrs | Use when making an architectural decision, changing a public API, shipping a feature, or recording a codebase term. |
| domain-modeling | Use when pinning down domain terminology, maintaining the domain model, or when a term conflicts or needs sharpening. |
| eligibility-batch-organizer | Use when the user asks to classify a batch of projects against eligibility rules and generate an approval preview before creating hierarchical child documents. |
| engineering-retrospective | Use when a user requests an engineering retrospective for a period. |
| grill-with-docs | Use when a repository decision needs an interview plus durable terminology and decision records. |
| gut-sync | Use when a user resumes work and needs an orientation card without full human recall. |
| handoff | Use when work reaches a session boundary or the user asks to hand off, delegate, or get a clipboard-ready prompt. |
| history-forget | Use when the user asks to remove a session or note from recall, or to unforget or list exclusions. |
| history-health | Use when a user asks to audit what recall fed agents. |
| history-notes | Use when the user says remember this or settles one durable fact. |
| history-recall | Use when a user requests the reasoning behind one matched session by query or handle. |
| history-source-registry | Use when a coding-agent session store is added or its format drifts, to document its layout, roles, quirks. |
| history-sync | Use when the user requests memory transfer to or from a named peer. |
| keep-why-autostart-examples | Use when skill or knowledge activation is unreliable, or setup reaches activation reliability. |
| keep-why-continuous-capture | Use when a non-trivial change lands or is abandoned and its decision, rejected alternatives, and reason must be captured. |
| keep-why-interview | Use when departing knowledge must enter project topic files through a narration-first interview. |
| keep-why-maintenance | Use when contradictions, revisit conditions, or duplicates appear in knowledge entries. |
| keep-why-repo-structure | Use when project documentation needs a layout or a knowledge item needs one home. |
| keep-why-repo-trust-boundary | Use when repo content crosses into working context or synthesized knowledge. |
| keep-why-retrospective | Use when an existing repository needs its unexplained rationale recovered into topic files. |
| keep-why-schema-migration | Use when a project context-schema differs from the installed entry format. |
| knowledge-refresh | Use when a knowledge artifact needs review before sharing or execution. |
| memory-clean | Use when a human asks to audit memory, find stale or duplicate memories, or needs tidy's ICM-state audit. |
| memory-sanitize | Use when the user asks to sanitize memory for sharing, redact PII, or scan memory for credentials. |
| memory-update | Use when the user explicitly says to save something to memory or scan this session for memories. |
| mutual-sync | Use when the user and agent may hold different pictures of current state after a gap, sync request, or exposed stale claim. |
| recall | Use when asked to recover prior work and current status before resuming. |
| session-share | Use when the user asks to beam, publish, or share the current local coding session to an authenticated remote receiver. |
| session-viewer | Use when the user asks to view, export, or inspect a session transcript in a browser. |
| ssotize-audit-fold | Use when asked to find duplication, check consistency, establish or repair SSOT, consolidate facts, or when the user says "consolidate this" or "ssotize this". |
| weekly-review | Use when asked to summarize authored work over the last week or a named date range, commit range, or branch. |
| weekly-synthesis | Use when the user asks for a weekly synthesis, a weekly report, or a "what you need to know this week" digest from team reports. |
| work-records-summary | Use when the user asks to discover, group, and summarize work records across multiple systems for a given period or project. |
| workflow-evidence-mining | Use when authorized workflow history may contain a repeated process worth extracting and replay-testing. |
| workflow-from-chats | Use when a user asks to mine recent chats for workflow preferences. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
