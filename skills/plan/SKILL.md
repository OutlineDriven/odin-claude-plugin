---
name: plan
description: 'Use when a user commits to a direction and asks to plan, brief, structure, research, or operationalize it, this skill classifies the request type and tier, runs read-only parallel research, and writes a plan artifact to plans/ with user acknowledgment before the file is considered done. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Knowledge plan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User commits to a direction and asks to plan, brief, structure, research, or operationalize it. |
| Authority | Reversible local: write only named local plan artifacts; state the rollback path. |
| Side effect | Runs read-only parallel research and writes plans/{type}-{descriptive-name}.md, adding a date on collision. |
| Done | Type and tier are classified; prior work, knowledge, live data, external facts when needed, and origin tensions are checked; user acknowledges the context brief; the file leads with the type-correct answer and includes sourced metrics, questions, and references. |

## Inputs

- **Required**: user commitment to a direction and a descriptive name for the plan.
- **Optional**: stated type/tier preference; any pinned evidence or references the user supplies.

## Procedure

1. **Classify type.** Map the user's ask to one of: Product Plan, Technical Plan, Research Brief, Operational Plan. Map the tier to one of: Exploration, Proposal, Execution, Audit.
2. **Research prior work.** Read every file under plans/ relevant to the direction. Record what already exists and what gaps remain.
3. **Research knowledge base.** Query available context (memories, session notes, codebase knowledge) for relevant facts, constraints, and prior decisions.
4. **Research live data.** When the plan requires measurable or factual grounding, fetch current evidence: live search, API lookups, or tool calls that read current state.
5. **Surface origin tensions.** Flag any contradictions between prior work, stated knowledge, and live data. List them as open questions in the plan.
6. **Draft the context brief.** Write one paragraph summarizing the direction, the classified type and tier, and the key tensions surfaced. Present it to the user.
7. **Await acknowledgment.** Do not proceed to file write until the user confirms the context brief is accurate.
8. **Write the plan artifact.** Write plans/{type}-{descriptive-name}.md. If a file at that path already exists, append a date stamp to the filename before writing.
9. **Lead with the type-correct answer.** Open the file with the answer, conclusion, or verdict first, before any background or rationale.
10. **Include sourced metrics, questions, and references.** Every factual claim in the plan carries a source or a citation marker. Open questions are listed explicitly.
11. **Declare done.** Report the written file path and confirm that type, tier, research checks, acknowledgment, leading answer, and sourced references are all present.

## Failure and recovery
- **No direction or name supplied.** Skill stops. No plan is written.
- **Research read failure.** Log the failure. Continue with remaining research streams. If all streams fail, write the plan with an explicit "unverified" section listing every failed check.
- **File write failure.** Do not write a partial file. Report the error and the rollback: no artifact is left behind.
- **User withholds acknowledgment.** Skill stops. No file is written. Report the blocked state.
- **No research findings.** Write the plan with a "Sparse" marker and an explicit list of what was checked and found empty.

## Output
A file at `plans/{type}-{descriptive-name}.md` (or `plans/{type}-{descriptive-name}-{date}.md` on collision), containing: the type-correct answer first, the classified type and tier, sourced metrics, explicit open questions, and references. The file is not done until the user acknowledges the context brief.

## Provenance

Origin: https://github.com/EveryInc/compound-knowledge-plugin | Revision: 766942e9eaee5204adbfe180f1d0651ffecf2575 | License: MIT — adaptation of the compound-knowledge-plugin planning mechanism. Both researcher-agent functions (past-work research and knowledge-base research) are preserved as parallel read-only research steps in Procedure. Local reversible write confirmed per source. Mechanism rewrites recorded in the root provenance ledger are permitted under the license.
