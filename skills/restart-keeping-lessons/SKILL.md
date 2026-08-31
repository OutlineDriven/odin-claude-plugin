---
name: restart-keeping-lessons
description: 'Use when an implementation has accumulated more workarounds than structure and another patch will not pay, or the human says "start over", "scrap it and rebuild", or "restart from scratch". Produces an evidence-backed keep/discard split and a new v0 skeleton with one complete vertical loop and a named first gate. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Restart keeping lessons

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The implementation accumulated more workarounds than structure and another patch will not pay, or the human says "start over", "scrap it and rebuild", or "restart from scratch". |
| Authority | Reversible-local: write only the failed-branch evidence archive and the new v0 skeleton inside the named restart scope. No branch deletion, no force push, no history rewrite, no remote mutation. Rollback: delete the written skeleton files and archive entries; discarded code is never deleted, so this restores the prior state exactly. |
| Side effect | Archives failed branches and dead code as evidence, and writes a new v0 skeleton with one vertical loop. Nothing outside the restart scope is written. |
| Done | An evidence-backed keep/discard split exists, a v0 with one complete vertical loop and a named first gate exists, and no old architecture was copied forward merely because it exists. |

## Inputs

- Required: the complaint or symptom that triggered the restart, and the repository working tree of the build being restarted.
- Optional: the current plan document; lessons, notes, or a retrospective from the prior attempt; QA evidence (passing tests, gate results, review findings). Without QA evidence the skill still runs, but unevidenced keep candidates are forced to discard.

## Procedure

1. Bound the restart before any mutation: name the repository path, the branches or directories being restarted, and the one vertical loop the new v0 must deliver. Everything outside this named scope is out of contract.
2. Read what exists before discarding anything: the current plan, any lessons or notes from the prior attempt, the QA evidence, and the complaint that triggered the restart. Confirm the complaint and QA evidence actually describe this build; a mismatch stops the skill before any write.
3. Split the existing build into keep and discard, citing evidence for every entry (a surviving test, a gate result, a schema that survived QA, the complaint text). Keep only what earned it: contracts, schemas that survived QA, quality gates, vocabulary, reusable services, real-surface tests. No copy-forward unless the evidence supports it.
4. Discard into an archive, never by deletion: explanatory UI, debug panels, scaffold, shallow content, and code whose only value was learning what not to do. Archive each failed branch or dead-code area with one line naming what it taught, so negatives stay as evidence.
5. Name the first gate — the concrete check the vertical loop must clear — before planning any code.
6. Write a v0 skeleton carrying the kept lessons, structured to deliver exactly that one complete vertical loop.
7. Build only that loop until it clears the named first gate. Anything beyond the loop waits; a second loop, an extra subsystem, or an out-of-scope change is a stop-and-report condition, not an extension.

## Failure and recovery
- No valid restart evidence (no complaint, no workaround record): terminal `blocked`, nothing written.
- The complaint or QA evidence references a different build or scope than the named restart scope: terminal `blocked`, nothing written.
- A keep candidate has no producible evidence: it moves to the discard archive; the split is never faked.
- An archive or skeleton write fails partway: leave completed entries in place, stop, and report exactly which entries landed and which did not.
- The loop does not clear the first gate: terminal `non-converged` — report the failing gate and the evidence; do not add a second loop, weaken the gate, or reintroduce discarded code.
- Rollback: delete the written v0 skeleton files and archive entries. Original code is never deleted or rewritten, so this fully restores the prior state.

## Output
Three artifacts inside the restart scope: the keep/discard split with per-entry evidence citations, the evidence archive of failed branches and negatives with failure notes, and the new v0 skeleton containing one complete vertical loop plus its named first gate. Terminal classification is exactly one of `done` (all artifacts exist and the loop clears the gate), `blocked` (no valid evidence or scope mismatch, nothing written), or `non-converged` (the loop fails the gate; failing gate and evidence reported).

## Provenance

Origin: odin-current project-owned skill at `skills/restart-keeping-lessons/SKILL.md`; no pinned revision; project-owned content, no third-party license applies. Adaptation: disposition ADAPT — the source method was rewritten into this bound contract form. The read-before-discard inventory, evidence-backed keep/discard split, negatives-as-archive, named-first-gate, and single-vertical-loop procedure are preserved; external reference pointers and peer-skill routing were removed so the skill is self-contained.
