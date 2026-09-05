---
name: instruction-understanding-gate
description: 'Use when a request is long, bundled, high-stakes, or has ambiguous referents. Not for tiered scans: use askme. Not for interviews: use askme.'
---

# Instruction understanding gate

Verify understanding before acting.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Long/bundled/high-stakes/hard-to-undo instruction, or ambiguous scope/referents (this, that, it, whatever is cleaner) |
| Authority | Reversible local: writes at most one durable understood-as log line for substantial work, after the gate decision; rollback is revert to pre-check state. No remote mutation. |
| Side effect | None before the gate passes; at most one clarifying question and one durable understood-as log line for substantial work |
| Done | Restatement is a paraphrase; every surfaced fork is genuinely unresolved by available context; no substantial work starts otherwise |

## Inputs

The user's instruction and all readable context: the current message, session history, project memory files, filesystem, and established project conventions. The model obtains these inputs; the user does not need to provide an artifact.

## Procedure

1. **Check the read signal.** Recognize when the instruction is long, multi-part, ambiguous in scope or referents, deliberately flexible, or high-stakes enough that a wrong read costs real work. If none of these signals are present, stop. Done when: the matched signals are named, or none is and the gate stops here.

2. **Restate the instruction.** Paraphrase the instruction in the agent's own words. Do not copy the user's wording and treat that as understanding. Done when: the instruction is paraphrased in the agent's own words, not copied from the user.

3. **Cross-check against context.** Compare the restatement against all available context: the current message, session history, project memory, files on disk, and established conventions. Look for contradictions, missing antecedents, or two plausible readings that context cannot choose between. Done when: the restatement is cross-checked against all available context and any contradictions, missing antecedents, or unresolvable forks are identified.

4. **Gate decision.**

   - If context resolves every fork: proceed silently. Do not surface a question for a resolved or unambiguous request.
   - If a genuine fork survives: surface one specific clarifying question anchored to the restated understanding. Name the choice; do not ask a vague "does this look right?" question. Done when: the gate decision is made: proceed silently if context resolves every fork, or one specific clarifying question is surfaced if a genuine fork survives.

5. **Log substantial work.** Before beginning substantial work, write one durable "understood as: ..." log line so a later reader can audit whether the work matched the confirmed read. Substantial work includes plans, multi-file changes, irreversible actions, or work a fresh reviewer may need to audit. A routine single-turn response does not need a log. Done when: the understood-as log line is written for substantial work, or the work is confirmed as routine and needs no log.

## Failure and recovery
| Failure class | Result |
|---|---|
| Instruction is unambiguous or context resolves it | Silent pass; proceed without surfacing any question |
| Fork surfaced but context later resolves it | Re-evaluate before acting; do not act on a fork that context answers |
| Multiple genuine forks found | Surface the highest-stakes one first; hold the rest pending resolution |
| Misread: restatement does not match the instruction | Surface the mismatch as the first finding; do not proceed until resolved |
| Question surfaced for a resolved ambiguity | Defect: retract the question; the gate passed silently |

Partial-result rule: if the instruction is a multi-step request, verify the read for the whole before beginning any part. A partial misread of step 2 means step 1 was done against a wrong target.

Non-mutation rule: no file, credential, paid, published, deployed, or remote mutation occurs before the gate passes. A durable log line is the only allowed write and only after the gate decision.

## Output
When the gate passes silently: proceed with the work; no output to the user beyond the work itself.

When a fork survives: one specific clarifying question anchored to the restated understanding, naming the choice.
