---
name: restart-keeping-lessons
description: 'Use when an implementation has more workarounds than structure and another patch will not pay. Not for in-place re-derivation: use breaking-driven. Not for one-artifact rewrites: use rewrite-clean-v0.'
---

# Restart keeping lessons

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The implementation accumulated more workarounds than structure and another patch will not pay, or the human says "start over", "scrap it and rebuild", or "restart from scratch". |
| Authority | Reversible local: writes only the failed-branch evidence archive and the new v0 skeleton inside the named restart scope; rollback is undo (delete the written skeleton files and archive entries; original code is never deleted). No remote mutation. No branch deletion, no force push, no history rewrite, no deletion or rewrite of original code. |
| Side effect | Archives failed branches and dead code as evidence, and writes a new v0 skeleton with one vertical loop. Nothing outside the restart scope is written. |
| Done | Three schema-conformant artifacts exist in the restart scope and the v0 loop clears its named first gate. |

## Inputs

- Required: the complaint or symptom that triggered the restart, and the repository working tree of the build being restarted.
- Optional: the current plan document; lessons, notes, or a retrospective from the prior attempt; QA evidence (passing tests, gate results, review findings). Without QA evidence the skill still runs, but unevidenced keep candidates are forced to discard.

## Artifact paths and schemas

All artifacts are written inside the named restart scope directory.

1. Keep/discard split: `<restart-scope>/RESTART-SPLIT.md`
   Schema: a list of entries, each with:
   - `item`: the file, module, or component name
   - `decision`: `keep` or `discard`
   - `evidence_citation`: the specific evidence supporting the decision (a surviving test name, a gate result, a schema that survived QA, the complaint text)

2. Evidence archive: `<restart-scope>/RESTART-ARCHIVE.md`
   Schema: a list of entries, each with:
   - `item`: the discarded file, module, or component
   - `failure_note`: one line naming what it taught (what not to do, what failed QA, what was scaffold)

3. v0 skeleton: `<restart-scope>/v0/` directory containing the skeleton code structured to deliver exactly one vertical loop, plus `<restart-scope>/v0/GATE.md` naming the first gate.

## Procedure

1. Bound the restart scope before any mutation. Name the repository path, the branches or directories being restarted, and the one vertical loop the new v0 must deliver. Name the first gate: the concrete check the vertical loop must clear. Everything outside this named scope is out of contract. Done when: the restart scope, vertical loop, and first gate are named.
2. Read what exists before discarding anything: the current plan, any lessons or notes from the prior attempt, the QA evidence, and the complaint that triggered the restart. Confirm the complaint and QA evidence actually describe this build; a mismatch stops the skill before any write. Done when: the complaint, QA evidence, and prior lessons are read and confirmed to match the named scope.
3. Split the existing build into keep and discard, citing evidence for every entry (a surviving test, a gate result, a schema that survived QA, the complaint text). Keep only what earned it: contracts, schemas that survived QA, quality gates, vocabulary, reusable services, real-surface tests. No copy-forward unless the evidence supports it. Done when: every item has a keep or discard decision with an evidence citation.
4. Write the keep/discard split to `<restart-scope>/RESTART-SPLIT.md` following the artifact schema. Archive discards into `<restart-scope>/RESTART-ARCHIVE.md` with one-line failure notes. Original code is never deleted or rewritten; the archive records what was discarded and why, not the deletion itself. Done when: both files exist and conform to their schemas.
5. Write a v0 skeleton to `<restart-scope>/v0/` carrying the kept lessons, structured to deliver exactly that one complete vertical loop. Discover the project build and verification commands from the project manifest: read `Makefile`, `justfile`, `package.json` scripts, `Cargo.toml`, `CMakeLists.txt`, or equivalent to find the build command and the test or verification command. Record them in the skeleton. Done when: the v0 skeleton exists with one vertical loop structure and the discovered build and verification commands recorded.
6. Build only that loop until it clears the named first gate, using the discovered build and verification commands. Anything beyond the loop waits; a second loop, an extra subsystem, or an out-of-scope change is a stop-and-report condition, not an extension. Done when: the loop clears the first gate, or the gate failure is reported.

## Failure and recovery

- `blocked`: no valid restart evidence (no complaint, no workaround record) or the complaint and QA evidence reference a different build or scope than the named restart scope. Nothing written. Report the blocker.
- `partial`: an archive or skeleton write failed partway. Report which entries landed and which did not. The completed entries remain in place; the missing entries are named. Do not silently complete or silently delete partial writes.
- `non-converged`: the loop does not clear the first gate. Report the failing gate and the evidence. Do not add a second loop, weaken the gate, or reintroduce discarded code.
- Rollback: delete the written v0 skeleton files and archive entries. Original code is never deleted or rewritten, so this fully restores the prior state.

## Output

Three artifacts inside the restart scope: the keep/discard split (`RESTART-SPLIT.md`) with per-entry evidence citations, the evidence archive (`RESTART-ARCHIVE.md`) of failed branches and negatives with failure notes, and the v0 skeleton (`v0/` with `GATE.md`) containing one complete vertical loop plus its named first gate. Terminal classification is exactly one of `done` (all artifacts exist and the loop clears the gate), `blocked` (no valid evidence or scope mismatch, nothing written), `partial` (an archive or skeleton write failed partway; report landed and missing entries), or `non-converged` (the loop fails the gate; failing gate and evidence reported).
