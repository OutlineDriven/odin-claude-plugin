---
name: agent-surface-forge
description: 'Use when the user asks to audit or repair agent surfaces — plugin configs, agent definitions, skills, CLAUDE.md/AGENTS.md, docs, prompts, commands, or hooks. Produces a certainty-graded breadth report and applies only HIGH auto-fixable findings with --apply. Not for deep one-skill improvement — use skill-improver.'
---

# Agent surface forge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to audit or repair agent surfaces — plugin configs, agent definitions, skills, CLAUDE.md/AGENTS.md, docs, prompts, commands, or hooks. Not for deep one-skill improvement — use skill-improver. |
| Authority | Reversible local writes, only with --apply, only to HIGH-certainty autoFix:yes findings on the named plugin/agent/skill/docs/prompt/claudemd/hooks surfaces. Rollback: revert any applied edit whose re-analysis introduces a new HIGH finding. |
| Side effect | Local file edits to HIGH + autoFix:yes items only under --apply; re-verifies after each edit. No suppression state, no model routing, no external analyzer binary. |
| Done | Surface audit report produced with all HIGH findings complete in default output, MEDIUM/LOW shown only under --verbose, and under --apply each HIGH finding removed without new HIGH issues. |

## Inputs

- `target` (optional): path to audit; defaults to `.`. Taken from the first non-flag argument.
- `--apply` (optional flag): apply only HIGH-certainty findings with `autoFix: yes`. Absent means report only.
- `--verbose` (optional flag): include MEDIUM and LOW findings. Default output shows HIGH plus MEDIUM/LOW summary counts.
- `--focus=<type>` (optional): comma-separated subset of `plugin`, `agent`, `skill`, `docs`, `prompt`, `claudemd`, `hooks`, `cross-file`. Unknown values are rejected.

## Procedure

1. Parse intent. Extract `target`, `--apply`, `--verbose`, `--focus`. Reject unknown focus values against the valid set above before any file access. Done when: target and flags are parsed and unknown focus values are rejected.
2. Discover files per analyzer family using these globs; keep concrete path lists and never pass globs to workers as the target contract:
   - plugin: `plugins/*/.claude-plugin/plugin.json`, `.claude-plugin/plugin.json`, `**/.claude-plugin/plugin.json`
   - agent: `**/agents/*.md`
   - skill: `**/SKILL.md`
   - claudemd: `CLAUDE.md`, `AGENTS.md`, `**/CLAUDE.md`, `**/AGENTS.md`
   - docs: `docs/**`, `README.md`, `CHANGELOG.md`
   - prompt: `commands/**`, `prompts/**`, `**/commands/*.md`, `**/prompts/*.md`
   - hooks: `hooks/**`, `**/hooks/**`
   - cross-file: enabled only when two or more of plugin/agent/skill/claudemd/prompt are present
   Skip analyzers with no discovered files. Under `--focus`, skip every non-focused family even if files exist. Done when: concrete file lists are discovered per analyzer family with non-focused families skipped.
3. Launch parallel analyzers in one `task` batch. Dispatch one generic `task` worker for each analyzer family that has files. Give each worker the analyzer name, exact file list, `--verbose` state, check catalog below, and required JSON return shape. Parallelize by analyzer family, never by file shards, because cross-surface consistency depends on seeing all relevant files for a family. Done when: one task worker is dispatched per analyzer family with files.
4. Check catalog per family. Every finding needs file, line or section, observed evidence, and a concrete fix; classify each by issue label: excess surface, duplication, structure, or correctness.
   - plugin: manifest fields explicit and bounded; `name` and `description` present; no excess or duplicated permissions; structure valid.
   - agent: frontmatter parses; `name` and `description` present and bounded; no duplicated or contradictory directives; structure valid.
   - skill: frontmatter parses; `name` matches the directory; `description` present and bounded; no excess surface, duplication, or structural drift; sections internally consistent.
   - claudemd: directives explicit and bounded; no duplicated or contradictory rules; no stale aliases; structure valid.
   - docs: referenced paths exist; no duplicated or contradictory content; structure valid.
   - prompt: command and prompt definitions explicit and bounded; no duplicated commands; structure valid.
   - hooks: hook scripts explicit and bounded; no duplicated handlers; structure and syntax valid.
   - cross-file: links between surfaces resolve; no duplicated or contradictory definitions across families; names referenced in one surface exist in the target surface.
   Done when: each analyzer family has its check catalog applied.
5. Analyzer contract. Each worker reports only observed findings as JSON:
   ```json
   {
     "analyzer": "plugin|agent|skill|docs|prompt|claudemd|hooks|cross-file",
     "findings": [
       {"file":"path","line":1,"check":"missing_description","certainty":"HIGH","autoFix":false,"evidence":"...","fix":"..."}
     ],
     "summary": {"high":0,"medium":0,"low":0,"autoFixableHigh":0}
   }
   ```
   Use native tools directly: `find` and `read` for presence and frontmatter; `search` scoped to discovered files for regex and field checks; `ast-grep` for command snippets, shell patterns, and hook bodies where syntax matters; codegraph MCP for cross-file symbols, callers, and impact when indexed, falling back to `ast-grep` plus scoped text search; repomix (`pack_codebase` or `pnpm dlx repomix --compress`) only for large repos to build a digest for the workers. Done when: each worker returns findings in the required JSON shape.
6. Deduplicate. Stable key: `analyzer|file|line|check|normalized evidence`. If two analyzers report the same underlying defect, keep the higher certainty; if equal, keep the one with narrower file/line evidence. Done when: findings are deduplicated by stable key.
7. Aggregate. Sort by certainty HIGH then MEDIUM then LOW, then analyzer, file, line. Count totals by analyzer and certainty. Done when: findings are sorted and totals are counted.
8. Report. Default output: executive summary table, all HIGH findings, MEDIUM/LOW counts, and the HIGH auto-fixable list. Under `--verbose`, include MEDIUM and LOW sections with issue labels. Done when: the report is emitted with the correct verbosity.
9. Apply guarded fixes, only when `--apply` is present: filter to `certainty === HIGH && autoFix === true`; group by analyzer; edit the minimal lines required; re-read changed files after each edit; never apply MEDIUM or LOW fixes automatically. Done when: all HIGH autoFixable findings are applied (under --apply) or listed as safe edits (without --apply).
10. Verify the fix set. Re-run only the analyzers whose files changed. A fix passes if the exact HIGH finding is gone and no new HIGH finding appears in the changed file. If a fix introduces a new HIGH issue, revert that fix and keep the finding in the report as manual. Done when: every applied fix is verified with no new HIGH findings, or reverted findings are labeled manual.

## Failure and recovery
- Unknown `--focus` value: reject before discovery; no files read or changed.
- Analyzer worker returns malformed JSON or no findings array: discard that worker's result, mark the analyzer as errored in the report, and continue other analyzers. The partial result covers every family that returned valid output.
- An applied fix introduces a new HIGH finding: revert that single edit, keep the original finding in the report labeled manual, and leave other applied fixes intact.
- No files discovered for any family: report zero analyzers run; do not invent findings.
- Non-converged fix: if re-analysis cannot confirm a finding is gone after a revert, report the finding as unresolved and stop applying further fixes in that file.

## Output
A markdown surface audit report with target path and flags, analyzers run, an executive summary table with HIGH/MEDIUM/LOW/autoFixableHigh counts per analyzer, every HIGH finding with file/line/check/evidence/fix, MEDIUM/LOW counts (full sections only under --verbose), and an auto-fix section listing applied edits and re-analysis results or safe edits without --apply.
