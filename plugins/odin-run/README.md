# ODIN Run

ODIN workflows for executing plans, orchestrating subagents, and bounded autonomous loops.

46 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-run@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-run@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-run/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-run:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| append-run-log | Use when a completed agent run must be recorded as durable, queryable evidence. |
| artifact-arena | Use when asked to run /artifact-arena to generate and judge competing artifact implementations. |
| audit-loop-scaffold | Use when loop scaffold files have drifted from their provenance-pinned templates. |
| autopilot | Use when a human has an approved delivery plan and wants the full chain run under phase gates. |
| cloud-task-orchestrator | Use when a human explicitly runs /cloud-task-orchestrator for a large task across cloud agents to drain a verified task graph. |
| corroborate-by-independent-reruns | Use when a candidate patch or answer needs independent corroboration before it is trusted. |
| cross-run-playbook | Use when a long agentic project needs each cycle to end in a learning memo and a keep/iterate/restart decision. |
| cybernetic-loop | Use when the caller supplies a falsifiable out-of-happy-path invariant and a finite budget. |
| cycle-memo | Use when a build, QA pass, demo, user complaint, or abandoned attempt leaves the next pass needing lessons rather than code. |
| diagnose-loop-health | Use when a configured loop misbehaves, produces unexpected results, or its setup soundness is questioned. |
| diagnose-wave-stall | Use when a dispatched agent wave idles on a result that never arrives and the blocking node must be named. |
| diamond-task | Use when one issue or PR is too large for a worker and partitions into disjoint write sets. |
| do-it-now | Use when the user says do it now, ship it now, no phases, or finish it now, or would defer work to phases, rollouts, follow-up PRs, or TODOs. |
| duet | Use when the user invokes /duet, says pair on this, or faces aesthetic, architectural, or irreversible decisions. |
| feedback-sweep | Use when asked to /feedback-sweep [setup\|reconfigure] [mode:non-interactive]. |
| figure-it-out | Use when non-trivial work should run a matched playbook to verified real-surface completion, or a bespoke workflow when none fits. |
| gate-file-completion | Use when a task needs gate-file proof before a done claim. |
| gate-proposed-change | Use when asked to evaluate a proposed commit, merge, or auto-merge against a gate config. |
| goal-prompt-drafting | Use when asked to draft copy-ready /goal objectives for long-running agents. |
| guardrail-carve-run | Use when guardrail-adjacent material (stealth, scraping, privacy, IP, policy, security) or mixed reversible/irreversible, sensitive work, or the user says "autobahn this". |
| implement-spec | Use when a ticket DAG from a complete specification needs parallel execution into a green draft PR. |
| llm-self-loop | Use when a button click, dashboard check, or human verdict sits inside an iteration loop and needs an autonomous gate. |
| negotiate-run-budget | Use when a high-priority run reaches at least 90% of its budget and requests an extension. |
| new-space | Use when a user starts a new work session and asks to split human decisions from agent execution. |
| notion-writer | Use when the user explicitly asks to create, update, query, or archive Notion pages, databases, or blocks. |
| orchestration-patterns | Use when work decomposes across subagents or role panels and needs coupling-based orchestration. |
| parallel-launch | Use when work splits into independent sub-tasks or cross-domain research. |
| partition-scopes-to-subagents | Use when asked to partition non-overlapping scopes across subagents and drive each to completion. |
| post-to-slack | Use when the user explicitly asks to share a message on Slack through an incoming webhook. |
| propose-external-change | Use when asked to change state in an external system: propose the write locally and halt at the human gate without executing. |
| respond-to-slack-thread | Use when the user asks to reply to or follow up on a specific Slack thread. |
| saga | Use when a user runs saga or asks to autonomously build a sizable feature. |
| schedule-dependency-waves | Use when work units carrying declared dependencies must be ordered into execution waves before any dispatch, including detecting a dependency cycle. |
| scheduler | Use when asked to set, list, pause, update, or delete a reminder or local task that fires at a confirmed time or interval. |
| seed-casebook | Use when a user opens a build cycle in a repo with an iteration convention and wants the casebook seeded with real content. |
| show-me-your-work | Use when the user invokes it to append a structured decision record to an append-only TSV log, ending with an Attention section for reviewers. |
| size-the-run | Use when a run could be over- or under-powered, before dispatching a subagent, or the user asks how hard to think about a task. |
| subagent-driven | Use when a user says execute with subagents or hands over an ordered multi-task plan. |
| swarm | Use when asked to run partitioned parallel coverage or races across isolated workers. |
| thin-repo-pulse | Use when a scheduled or watcher tick fires and a lightweight pulse must capture current external state. |
| watch-for | Use when monitoring a file, log, endpoint, or artifact for drift or errors, or polling a target until a predicate holds. |
| watch-for-harness-mode | Use when a proven watch pattern should become a reusable harness artifact with configurable inputs. |
| watch-for-structured | Use when the user wants to classify a surface state and page an on-call API when triggered. |
| wizard | Use when asked to generate a bash wizard for provisioning, credentials, dashboards, migrations, or cutovers a human performs. |
| work | Use when implementing from a plan, spec, clear build request, or settled ticket, orchestrated or standalone. |
| workflows-driven | Use when work decomposes across subagents or phases: audits, migrations, research sweeps, or scale one context cannot hold. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
