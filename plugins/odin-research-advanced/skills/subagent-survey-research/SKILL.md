---
name: subagent-survey-research
description: 'Use when answering requires reading many files or conducting a wide survey. Spawns local research subagent(s) and returns a direct answer with key evidence paths and caveats. Don''t use for tasks that require source or remote-system changes.'
---

# Subagent survey research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Answering requires reading many files or wide surveys. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Spawns local research subagent(s). Deliverable is the answer with evidence paths. No artifact write required. |
| Done | Direct answer with key evidence paths and caveats returned as a report. |

## Inputs

- **Topic and scope** (required): the question or investigation goal. Bound scope before spawning subagents.
- **Evidence paths** (produced): file paths or URL references that support each claim.
- **Caveats** (produced): conditions, unknowns, or limits on the answer.

## Refusal

- Subagent returns no findings: return a partial answer with empty evidence paths and a caveat stating the gap. Do not fabricate evidence.
- Source inaccessible: return the answer without that source; name the inaccessible path in the caveats.
- Scope widens mid-survey: stop. Report the widened scope as a caveat. Do not expand the answer beyond the original question.
- Non-converged: state explicitly that the question cannot be answered with available sources. Return empty evidence paths.

## Procedure

1. **Bound scope.** Clarify the question or investigation goal in one concrete statement. Do not widen scope. Done when: one concrete scope statement is recorded.
2. **Plan the survey.** Identify the file regions, directories, or URLs that likely contain the answer. Prefer targeted reads over glob sweeps. Done when: a source list is recorded.
3. **Spawn research subagent(s).** Dispatch local subagent(s) to read the identified sources in parallel. Each subagent returns a cited summary and evidence paths. Done when: every subagent has returned or failed.
4. **Synthesize.** Integrate findings into a direct answer. Mark each claim with its evidence path. Flag caveats explicitly. Done when: every claim has an evidence path and caveats are listed.
5. **Return report.** Output the direct answer, key evidence paths, and caveats as a report. No artifact write is required. Done when: the report is delivered.

## Output

A direct answer report: answer, evidence paths per claim, explicit caveats — in that order.
