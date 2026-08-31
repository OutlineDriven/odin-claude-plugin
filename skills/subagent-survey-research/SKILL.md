---
name: subagent-survey-research
description: 'Use when answering requires reading many files or wide surveys. Direct answer with key evidence paths and caveats returned via spawned local research subagent(s). Don''t use for tasks that require source or remote-system changes.'
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

## Procedure

1. **Bound scope.** Clarify the question or investigation goal in one concrete statement. Do not widen scope.
2. **Plan the survey.** Identify the file regions, directories, or URLs that are likely to contain the answer. Prefer targeted reads over glob sweeps.
3. **Spawn research subagent(s).** Dispatch local subagent(s) to read the identified sources in parallel. Each subagent returns a cited summary and evidence paths.
4. **Synthesize.** Integrate findings into a direct answer. Mark each claim with its evidence path. Flag caveats explicitly.
5. **Return report.** Output the direct answer, key evidence paths, and caveats as a report. No artifact write is required.

## Failure and recovery
| Failure class | Result |
|---|---|
| Subagent returns no findings | Return partial answer with empty evidence paths and a caveat stating the gap. Do not fabricate evidence. |
| Source is inaccessible | Return the answer without that source; name the inaccessible path in the caveats. |
| Scope widens mid-survey | Stop. Report the widened scope as a caveat. Do not expand the answer beyond the original question. |
| Non-converged | State explicitly that the question cannot be answered with available sources. Return empty evidence paths. |

## Output
A direct answer report containing:
- The answer to the question.
- Key evidence paths cited per claim.
- Explicit caveats on unknowns, limits, or gaps.

## Provenance

- Origin: https://github.com/warpdotdev/common-skills
- Revision: f589e224907eda566c13755529f59db563090d14
- License: MIT — Copyright (c) 2026 Denver Technologies, Inc. Adaptation with attribution in module provenance ledger. Vendored third-party JS bundle (pierre-diffs.js) is NOT carried over.
- Adaptation: Clean-room rewrite of `.agents/skills/research/SKILL.md` into ODIN 2.0 structure. Subagent survey mechanism preserved; artifact-write branch removed; report-returned made explicit.
