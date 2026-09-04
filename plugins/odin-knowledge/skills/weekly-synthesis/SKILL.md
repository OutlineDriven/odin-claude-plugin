---
name: weekly-synthesis
description: 'Use when the user asks for a weekly synthesis, a weekly report, or a "what you need to know this week" digest from team reports. Not for the underlying reports or ad-hoc summaries.'
---

# Weekly synthesis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs the period's scattered reports synthesized into one evidence-grounded weekly digest. |
| Authority | Reversible local: writes only one markdown file under `reports/weekly-synthesis/`; rollback is undo. No remote mutation. |
| Side effect | Exactly one local file: `reports/weekly-synthesis/synthesis_YYYY-MM-DD.md`. No network calls, no credentials, no publishing. |
| Done | The synthesis file exists with sections 1 through 5 strictly factual, section 6 labeled agent-generated recommendations, and the self-review checklist passed. |

## Inputs

- **Report source directories** (at least one report across all of them required): the directories under the repository root holding the period's reports. The synthesis covers only artifacts that already exist; it never collects new data or generates the underlying reports.
- Synthesis date `YYYY-MM-DD` (optional): the week being synthesized; defaults to today.
- Previous synthesis (optional): the most recent file in `reports/weekly-synthesis/` enables the trend comparison and follow-up on prior recommendations.
- Planning context (optional): active planning items and primary metrics the operator supplies. When absent, sections 1 and 3 omit planning alignment and the omission is recorded in section 5.

## Procedure

1. Resolve the repository root with `git rev-parse --show-toplevel`; outside a repository, use the current directory. Report paths resolve from that root. **Done when:** the root is recorded.
2. Discover the most recent report per source directory. Sort by filename, never by filesystem modification time: filenames carry `YYYY-MM-DD` dates and mtimes are unreliable in freshly cloned repositories.

   ```bash
   ls "$ROOT/reports/<source-dir>/"*.md 2>/dev/null | sort | tail -1
   ```

   If no report exists in any source directory, stop and tell the operator; do not fabricate content. **Done when:** the most recent report per directory is discovered, or the run stopped on no reports.
3. Read every discovered report, plus the previous synthesis when it exists, to track trends and follow up on prior recommendations. **Done when:** all discovered reports are read.
4. Synthesize the six sections following `references/section-specs.md`: matter-of-fact and evidence-driven, citing issue numbers, customer names, commit counts, and competitor names. **Done when:** all six sections follow the section specs.
5. Self-review every section against the checklist in `references/section-specs.md` and fix all violations before writing the file. **Done when:** every checklist item passes.
6. Write `reports/weekly-synthesis/synthesis_YYYY-MM-DD.md`: all six sections separated with `---` under a header naming the period and the source reports. **Done when:** the file is written.
7. Report the file path, the source reports used, and coverage gaps (empty directories, or reports older than 14 days). **Done when:** the report is emitted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No report in any source directory | Stop before writing. Name the empty directories. Never substitute placeholder content for missing evidence. |
| A discovered report is unreadable | Record the gap in section 5 and continue with the readable reports. |
| Self-review violations | Fix before writing. Never write a synthesis that fails its own checklist. |

## Output

The written synthesis path with a one-line summary per section, the list of source reports used with their dates, and the recorded coverage gaps.
