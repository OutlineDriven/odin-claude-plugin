---
name: fix-p0-issues
description: 'Use when the user asks to fix P0s, address critical issues, or work on priorities from the weekly product briefing. Don''t use for non-P0 issues or local bug fixes.'
disable-model-invocation: true
---

# Fix P0 issues

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to fix P0s, address critical issues, or work on priorities from the weekly product briefing. |
| Authority | Human-only. No agent is spawned without explicit user confirmation. Remote mutation is limited to spawning ODIN cloud coding agents for triaged, actionable P0s. |
| Side effect | Triages P0s, spawns high-confidence agents, and reports run IDs and monitoring commands. |
| Done | Actionable P0s have run IDs; skipped items are documented; no agent runs without user confirmation. |

## Inputs

- The repository root, resolved via `git rev-parse --show-toplevel`.
- The most recent weekly product briefing under `reports/weekly_product_briefings/*.md`.
- Optional: GitHub issue numbers embedded in briefing P0 sections as `#NNNN`.

## Procedure

1. Resolve the repository root, then find the most recent briefing by sorting filenames (which contain `YYYY-MM-DD` dates). Do not use `ls -t` — filesystem modification times are unreliable in freshly cloned repos.
   ```bash
   REPO_ROOT=$(git rev-parse --show-toplevel)
   ls "$REPO_ROOT/reports/weekly_product_briefings/"*.md 2>/dev/null | sort | tail -1
   ```
2. Parse the briefing for sections starting with `#### P0:`. For each P0, extract the title (text after `#### P0:`), GitHub issue numbers (`#NNNN` patterns), the problem description paragraph(s), and any engineering-alignment notes.
3. For each P0, fetch GitHub issue details when issue numbers are present (`gh issue view <issue_number> --repo <org>/<repo>`), then search the codebase for relevant code using keywords from the issue. Document relevant file paths, existing related code or tests, and dependencies.
4. Triage each P0 into one category and record the decision:
   - **Inactionable Complaint**: no specific description, reproduction steps, or fix indication. Skip; note in the report.
   - **Bug Fix**: clearly scoped, has reproduction steps or a clear error, narrow scope, identifiable root cause. Decision: Spawn Agent.
   - **Feature Request**: assess scope (Small 1-2 files, Medium 3-10 files, Large 10+ files or architectural), complexity, and confidence 1-5. Confidence 5 or 4 → Spawn Agent (4 with caveats); 3 or lower → Skip and note.
   Skip any P0 the briefing notes is already being addressed on an active branch. Do not spawn more than 3 agents at once.
5. For each P0 marked Spawn Agent, construct a prompt containing the issue number and title, the problem description, fetched issue details, relevant file paths, and the task (investigate, implement fix, add or update tests, create a PR with a clear description). Present the full spawn plan — P0 titles, issue numbers, categories, confidence, decisions, and constructed prompts — to the user and obtain explicit confirmation before proceeding. Do not spawn any agent without confirmation.
6. For each confirmed P0, spawn an ODIN cloud coding agent:
   ```bash
   odin agent run-cloud \
     --environment <ODIN_ENVIRONMENT_ID> \
     --prompt "<constructed prompt>"
   ```
   Use exactly `odin` to spawn cloud agents. If `odin` is not available, stop and report the error rather than substituting another binary.
7. Record each spawned agent's run ID and emit the report described in Output.

## Failure and recovery
- **No briefing found**: stop and report that no weekly product briefing exists under `reports/weekly_product_briefings/`; do not spawn agents.
- **`odin` unavailable**: stop and report the error; do not substitute another binary or spawn method.
- **GitHub issue fetch fails**: continue with briefing-only context for that P0; note the fetch failure in the report.
- **User declines confirmation**: do not spawn any agent; report the declined plan as the terminal result.
- Partial-result rule: agents already spawned remain spawned; report their run IDs. No rollback of remote runs is performed by this skill.

## Output
A report of the form:

```
=== P0 Fix Agents Spawned ===

P0: <Title>
- GitHub Issues: #NNNN, #NNNN
- Category: <Bug Fix | Feature Request | Inactionable Complaint>
- Confidence: <1-5> (Feature Requests only)
- Decision: <Spawn Agent | Skip>
- Run ID: <run-id>
- Monitor: odin run get <run-id>

...

Skipped:
- <Title>: <reason>

To check all runs:
odin run list --output-format text
```

Skipped P0s (inactionable, low-confidence, or already addressed) are listed with their reason. No agent runs without user confirmation.

## Provenance

Origin: `warpdotdev/competitive-intelligence-agent-oss`, `.warp/skills/fix_p0_issues/SKILL.md`. Pinned revision `9e0363e810a14405ef876fb354562735002797fb`. License MIT; mechanism adapted (clean-room): the Oz cloud-agent binary is replaced by the ODIN cloud-agent, and human confirmation before spawning is added as a guardrail.
