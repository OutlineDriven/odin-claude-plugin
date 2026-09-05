---
name: agent-surface-forge
description: 'Use when asked to audit or repair agent surfaces (plugins, agents, skills, CLAUDE.md/AGENTS.md, docs, prompts, commands, hooks) or improve one skill at depth. Not for agent grading: use skill-doctor.'
---

# Agent surface forge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to audit or repair agent surfaces, plugin configs, agent definitions, skills, CLAUDE.md/AGENTS.md, docs, prompts, commands, or hooks; or asks to iteratively improve one skill, fix skill-quality findings, or resolve scanner alerts (W001, W011, W012) on a skill. |
| Authority | Reversible local: audit mode writes only HIGH-certainty autoFix:yes findings on the named plugin/agent/skill/docs/prompt/claudemd/hooks surfaces under --apply; improve mode writes only files within the resolved skill directory; rollback is reverting any applied edit whose re-analysis introduces a new HIGH finding or restoring prior file content. No remote mutation. |
| Side effect | Local file edits to HIGH + autoFix:yes items only under --apply, or minimal contract-preserving edits inside one skill directory in improve mode; re-verifies after each edit. No suppression state, no model routing, no external analyzer binary outside scanner remediation. |
| Done | Audit mode: surface audit report produced with all HIGH findings complete in default output, MEDIUM/LOW shown only under --verbose, and under --apply each HIGH finding removed without new HIGH issues. Improve mode: a final review contains no critical or major findings and finalization edits pass scope and regression checks, or a non-success terminal status is reported without being presented as convergence; scanner remediation ends on a clean scan with information preserved and the pre-authoring checklist passed. |

## Inputs

- `mode` (optional): `audit` (default) or `improve`. Audit runs the multi-surface sweep; improve runs the deep single-skill loop.
- `target` (optional, audit mode): path to audit; defaults to `.`. Taken from the first non-flag argument.
- `--apply` (optional flag, audit mode): apply only HIGH-certainty findings with `autoFix: yes`. Absent means report only.
- `--verbose` (optional flag): include MEDIUM and LOW findings. Default output shows HIGH plus MEDIUM/LOW summary counts.
- `--focus=<type>` (optional, audit mode): comma-separated subset of `plugin`, `agent`, `skill`, `docs`, `prompt`, `claudemd`, `hooks`, `cross-file`. Unknown values are rejected.
- Target skill path (required, improve mode): a path to a `SKILL.md` file or a skill slug that resolves to one by searching `skills/`.
- Improvement scope (optional, improve mode): specific findings to fix, remaining findings from an interrupted run to resume, or quality dimensions to focus on. When the scope is scanner alerts, the scan output listing each alert as a code with its file, or the skill directory to scan to produce one. Optional `SNYK_TOKEN` is supplied by the operator environment, never requested or stored by this workflow.

## Procedure

1. Select mode. `improve` when the user names one skill to iteratively improve, fix skill-quality findings on, or clear scanner alerts (W001, W011, W012) from; otherwise `audit`. Done when: the mode is selected.

### Mode audit

2. Parse intent. Extract `target`, `--apply`, `--verbose`, `--focus`. Reject unknown focus values against the valid set above before any file access. Done when: target and flags are parsed and unknown focus values are rejected.
3. Discover files per analyzer family using these globs; keep concrete path lists and never pass globs to workers as the target contract:
   - plugin: `plugins/*/.claude-plugin/plugin.json`, `.claude-plugin/plugin.json`, `**/.claude-plugin/plugin.json`
   - agent: `**/agents/*.md`
   - skill: `**/SKILL.md`
   - claudemd: `CLAUDE.md`, `AGENTS.md`, `**/CLAUDE.md`, `**/AGENTS.md`
   - docs: `docs/**`, `README.md`, `CHANGELOG.md`
   - prompt: `commands/**`, `prompts/**`, `**/commands/*.md`, `**/prompts/*.md`
   - hooks: `hooks/**`, `**/hooks/**`
   - cross-file: enabled only when two or more of plugin/agent/skill/claudemd/prompt are present
   Skip analyzers with no discovered files. Under `--focus`, skip every non-focused family even if files exist. Done when: concrete file lists are discovered per analyzer family with non-focused families skipped.
4. Launch parallel analyzers in one `task` batch. Dispatch one generic `task` worker for each analyzer family that has files. Give each worker the analyzer name, exact file list, `--verbose` state, check catalog below, and required JSON return shape. Parallelize by analyzer family, never by file shards, because cross-surface consistency depends on seeing all relevant files for a family. Done when: one task worker is dispatched per analyzer family with files.
5. Check catalog per family. Every finding needs file, line or section, observed evidence, and a concrete fix; classify each by issue label: excess surface, duplication, structure, or correctness.
   - plugin: manifest fields explicit and bounded; `name` and `description` present; no excess or duplicated permissions; structure valid.
   - agent: frontmatter parses; `name` and `description` present and bounded; no duplicated or contradictory directives; structure valid.
   - skill: frontmatter parses; `name` matches the directory; `description` present and bounded; no excess surface, duplication, or structural drift; sections internally consistent.
   - claudemd: directives explicit and bounded; no duplicated or contradictory rules; no stale aliases; structure valid.
   - docs: referenced paths exist; no duplicated or contradictory content; structure valid.
   - prompt: command and prompt definitions explicit and bounded; no duplicated commands; structure valid.
   - hooks: hook scripts explicit and bounded; no duplicated handlers; structure and syntax valid.
   - cross-file: links between surfaces resolve; no duplicated or contradictory definitions across families; names referenced in one surface exist in the target surface.
   Done when: each analyzer family has its check catalog applied.
6. Analyzer contract. Each worker reports only observed findings as JSON:
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
7. Deduplicate. Stable key: `analyzer|file|line|check|normalized evidence`. If two analyzers report the same underlying defect, keep the higher certainty; if equal, keep the one with narrower file/line evidence. Done when: findings are deduplicated by stable key.
8. Aggregate. Sort by certainty HIGH then MEDIUM then LOW, then analyzer, file, line. Count totals by analyzer and certainty. Done when: findings are sorted and totals are counted.
9. Report. Default output: executive summary table, all HIGH findings, MEDIUM/LOW counts, and the HIGH auto-fixable list. Under `--verbose`, include MEDIUM and LOW sections with issue labels. Done when: the report is emitted with the correct verbosity.
10. Apply guarded fixes, only when `--apply` is present: filter to `certainty === HIGH && autoFix === true`; group by analyzer; edit the minimal lines required; re-read changed files after each edit; never apply MEDIUM or LOW fixes automatically. Done when: all HIGH autoFixable findings are applied (under --apply) or listed as safe edits (without --apply).
11. Verify the fix set. Re-run only the analyzers whose files changed. A fix passes if the exact HIGH finding is gone and no new HIGH finding appears in the changed file. If a fix introduces a new HIGH issue, revert that fix and keep the finding in the report as manual. Done when: every applied fix is verified with no new HIGH findings, or reverted findings are labeled manual.

### Mode improve

Run instead of steps 2-11.

1. **Resolve target.** Locate the `SKILL.md` file. If the path does not exist or does not contain a valid skill frontmatter block, report `invalid-target` and stop. Done when: the target is resolved or `invalid-target` is reported.
2. **Bound scope.** The improvement scope is the single resolved skill directory. No file outside that directory may be read or written. Done when: the scope boundary is established.
3. **Initial review.** Read the full `SKILL.md` and any `agents/openai.yaml` in the skill directory. Evaluate against these quality dimensions:
   - Trigger clarity: does the frontmatter description and trigger predicate route precisely?
   - Authority fidelity: does the body restatement match the declared authority without expansion?
   - Procedure completeness: are steps numbered, executable, and free of ambiguity or missing branches?
   - Semantic minimum: does every line earn its place by changing routing, authority, reads/writes, procedure, proof, failure handling, or license?
   - Failure coverage: are named failure classes present with partial-result rules, rollback rules, and exact blocked-terminal output?
   - Self-containment: does the body avoid pointers to other skills, AGENTS.md, system prompts, or rule files?
   - Provenance: is origin, revision, license, and adaptation statement present?
   Classify each finding as `critical`, `major`, or `minor` and record them in the run report. Done when: findings are classified and recorded.
4. **Gate check.** If zero critical and zero major findings exist, proceed to step 7 (finalization). If the iteration count equals max iterations, proceed to step 6 (non-converged terminal). Done when: the gate decision is made.
5. **Fix cycle.** For each critical and major finding, in severity-then-file order: read the affected section; apply the minimal edit that resolves the finding without changing the skill's contract, trigger, authority, side-effect, or done predicate; record the diff in the run report. After all fixes for this iteration, re-run the review (step 3) with an incremented iteration counter. Done when: all critical and major findings for this iteration are fixed and the review is re-run.
6. **Non-converged terminal.** If max iterations are exhausted with remaining critical or major findings, report `non-converged` with the remaining finding count and severity breakdown. Do not present this as convergence. Done when: the non-converged status is reported.
7. **Finalization.** Run a scope check: confirm no edit changed the trigger predicate, authority class, side-effect target, or done predicate. Run a regression check: confirm the edited skill still parses (valid frontmatter, required sections present). If either check fails, revert the last iteration's edits and report `finalization-failed`. If both pass, report `converged` with the final review findings. Done when: the finalization verdict is reported.

Scanner remediation replaces steps 3-7 when the improvement scope is scanner alerts (W001, W011, W012). Parse the scan output into `(alert code, file)` pairs. Only files named in the alert list are edited.

1. **Order the queue.** Fix one alert at a time in order: W001, W011, then W012. Starting with the simplest alert minimizes rework when one fix surfaces another. Done when: the queue is ordered.
2. **Apply the restructuring rule for the alert code.** Every rule preserves the original information by relocating or rephrasing it; deleting content to silence an alert is prohibited. Done when: the matching rule is applied.
   - W001 (prompt injection via named MCP tool functions): replace each explicitly named tool function in body prose with a generic formulation naming the capability instead. Tool names remain acceptable in the frontmatter `allowed-tools` field; only the body is restricted.
   - W011 (imperative external-content instructions): rewrite sentences that send the agent to fetch, check, or evaluate external content into passive availability statements that keep the URL and its purpose. Remove `always` from instructions involving external resources. Move tool invocations from prose checklists into code blocks. Running a tool is fine, but its remote-sourced output must not be the sole trigger for acting.
   - W012 (external content fetched and executed at runtime): replace `@latest` with an exact pinned version. Move install commands out of body prose into the alerted skill's frontmatter metadata install block. Pin GitHub Actions to a major version verified to exist in the action's releases. Never pipe remote content into a shell.
3. **Re-run the scanner after each fix.** Run `SNYK_TOKEN=<token> snyk-agent-scan --skills <skill-directory>`. If the binary is absent, run `uvx snyk-agent-scan` without installing it. Compare alert counts. If the count did not drop, undo that edit and choose a different restructuring; never stack unverified changes. Done when: the post-fix alert count is compared.
4. **Queue surfaced alerts.** Expect W011 fixes to surface hidden W012 alerts as URLs become prominent after restructuring. Treat each surfaced alert as a new item in the ordered queue. Done when: surfaced alerts are queued.
5. **Restructure likely false positives.** Treat a URL in a reference-data table cell, official documentation link, frontmatter homepage link, or `always` outside an external-resource sentence the same as a confirmed alert: use the passive-availability pattern. Do not override, suppress, or assume scanner error. Done when: likely false positives are restructured.
6. **Prevent recurrence.** When the scan is clean, apply the pre-authoring checklist to the edited content: no sentence with the agent acting on a URL, no `@latest` in body install instructions, no MCP tool names in body prose, install commands in frontmatter, GitHub Actions versions real, tool invocations in code blocks, and no `always` before external-resource instructions. Done when: the checklist passes on the edited content.

## Failure and recovery

- Unknown `--focus` value: reject before discovery; no files read or changed.
- Analyzer worker returns malformed JSON or no findings array: discard that worker's result, mark the analyzer as errored in the report, and continue other analyzers. The partial result covers every family that returned valid output.
- An applied fix introduces a new HIGH finding: revert that single edit, keep the original finding in the report labeled manual, and leave other applied fixes intact.
- No files discovered for any family: report zero analyzers run; do not invent findings.
- Non-converged fix: if re-analysis cannot confirm a finding is gone after a revert, report the finding as unresolved and stop applying further fixes in that file.
- `invalid-target` (improve mode): the target path does not exist or lacks valid skill frontmatter. Report and stop.
- `scope-violation` (improve mode): an edit would touch a file outside the resolved skill directory. Revert the edit, record the violation, and continue with remaining findings.
- `non-converged` (improve mode): max iterations exhausted with critical or major findings remaining. Report the count and severity breakdown. Do not claim convergence.
- `finalization-failed` (improve mode): the post-convergence scope or regression check fails. Revert the last iteration's edits and report the specific check failure.
- `review-error` (improve mode): the review step itself fails (unparseable skill, tool error). Record the error, skip the fix cycle, and report `review-error` with the error message.
- `scanner-unavailable`: the scanner binary is missing and the `uvx` drop-in fails, or `SNYK_TOKEN` is missing. Report the exact error and stop. No edit made in an unverified run may be claimed as fixed.
- `alert-count-not-dropping`: restore the pre-edit bytes and select a different restructuring. The failing edit must not survive.
- `alert-count-rising`: revert to the last state with the lowest verified count and stop the loop there.
- `information-preservation-limit`: an alert cannot clear without deleting content. Stop editing, keep all verified fixes, and return the blocking file, alert code, and constraint. Do not claim the done predicate.

Partial results (improve mode): record each iteration's findings and fixes in the run report as they happen. A mid-run interruption preserves everything emitted so far; resume by passing the remaining findings as the improvement scope.

## Output

Audit mode: a markdown surface audit report with target path and flags, analyzers run, an executive summary table with HIGH/MEDIUM/LOW/autoFixableHigh counts per analyzer, every HIGH finding with file/line/check/evidence/fix, MEDIUM/LOW counts (full sections only under --verbose), and an auto-fix section listing applied edits and re-analysis results or safe edits without --apply.

Improve mode: on `converged`, a report listing the final review findings (all minor or informational) and the total iteration count; on `non-converged`, the remaining critical and major findings and the iteration count; on `invalid-target`, `finalization-failed`, or `review-error`, a terminal status message with the specific failure class and diagnostic detail. Scanner remediation: a per-file remediation report ordered by alert queue, listing code, restructuring, before-and-after counts, then final clean status or exact blockers, and the pre-authoring checklist result.
