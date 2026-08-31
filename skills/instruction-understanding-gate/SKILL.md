---
name: instruction-understanding-gate
description: 'Use when a request is long, bundled, high-stakes, hard to undo, or has ambiguous scope or referents such as this, that, it, the other one, whatever is cleaner, or whichever order makes sense. Verifies the model''s understanding of the instruction before spending non-trivial work: restates internally, cross-checks against available context, proceeds silently when resolved, and surfaces only a genuine surviving fork. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Instruction understanding gate

Verify understanding before acting.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Long/bundled/high-stakes/hard-to-undo instruction, or ambiguous scope/referents (this, that, it, whatever is cleaner) |
| Authority | reversible-local: no file, VCS, credential, paid, published, deployed, or remote mutation before the gate passes |
| Side effect | None before the gate passes; at most one clarifying question and one durable understood-as log line for substantial work |
| Done | Restatement is a paraphrase; every surfaced fork is genuinely unresolved by available context; no substantial work starts otherwise |

## Inputs

The user's instruction and all context reachable by read: current message, session history, project memory files, filesystem, and established project conventions. All inputs are sourced by the model; no user-provided artifact is required.

## Procedure

1. **Check the read signal.** Recognize when the instruction is long, multi-part, ambiguous in scope or referents, deliberately flexible, or high-stakes enough that a wrong read costs real work. If none of these signals are present, stop.

2. **Restate the instruction.** Paraphrase the instruction in the agent's own words. Do not copy the user's wording and treat that as understanding.

3. **Cross-check against context.** Compare the restatement against all available context: the current message, session history, project memory, files on disk, and established conventions. Look for contradictions, missing antecedents, or two plausible readings that context cannot choose between.

4. **Gate decision.**

   - If context resolves every fork: proceed silently. Do not surface a question for a resolved or unambiguous request.
   - If a genuine fork survives: surface one specific clarifying question anchored to the restated understanding. Name the choice; do not ask a vague "does this look right?" question.

5. **Log substantial work.** Before beginning any substantial work, write one durable "understood as: ..." log line so a later reader can audit whether the work matched the confirmed read. "Substantial" means plans, multi-file changes, irreversible actions, or work a fresh reviewer may need to audit. A routine single-turn response does not need a log.

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

## Provenance

Origin: https://github.com/LilMGenius/paperthin, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License: MIT (c) 2026 LilMGenius. NOTICE: additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. Retain the MIT copyright+permission notice for substantial reuse; per-source attribution obligation binds only verbatim vendor material, which the foundry does not copy. Adaptation: ADAPT as a distinct model-invoked intent gate, kept separate from clarify (user-invoked tiered scan) and mutual-sync (stale-picture reconciliation); silent-pass-is-the-good-outcome retained. Module odin: universal pre-work intent gate. Policy model+human: read-only until the gate passes. No third-party expression copied; clean-room adaptation.
