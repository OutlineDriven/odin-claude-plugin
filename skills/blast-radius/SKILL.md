---
name: blast-radius
description: 'Use when asked to determine what a change could break before it ships. Return confirmed risks, cleared items, and the cheapest pre-merge test that catches the real bug. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Blast radius

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Determine what a change could break. |
| Authority | Write only one local proof script or test; delete it after the report. No VCS, credential, published, or remote mutation. |
| Side effect | May write and run one proof. |
| Done | Confirmed risks, cleared items, and cheapest pre-merge test. |

## Inputs

A diff, branch, or set of changed files to analyze. The change must be readable from the working tree or a supplied patch. Optional: the running application for in-app reproduction.

## Procedure

1. Read the change completely: the diff, the symbols it adds, changes, and deletes, and what it now does differently, including behavior the diff does not spell out.
2. Find the single fact the change's safety depends on. Most changes that look dangerous are safe because of one fact — for example, "this call only drops already-dead cache entries and does nothing else." If that fact holds, most scary cases collapse at once. Spend time here, not on a long list of maybes.
3. Look where a symbol search stops. Read the source of any library the change calls; check its pinned version and any local patch. Work out when things run: async task ordering, teardown and unmount, framework-specific lifecycle. Follow what a grep misses: a JSON shape an API returns, a database column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream.
4. For each risk, give it a real chance of happening and a real cost if it does. Cite a concrete file:line for every claim. A search that finds nothing is still an answer. Never invent a caller or an API.
5. Rate each safety fact on the certainty ladder and say where it stopped:
   1. Stated without evidence — worthless on its own.
   2. Pointed at the line — a real file:line or the library's own source.
   3. Walked the failure path step by step and it does not reach the bad case.
   4. Ran it — a script or test calling the real code that fails loud if the claim is wrong.
   5. Reproduced in the running application.
   Any safety fact that cannot reach step 4 must be stated as unproven, not written up as settled. Step 4 is usually one small script importing the same library the application ships and calling the exact function in question.
6. Write and run one proof script or test that exercises the single load-bearing fact. Run it. Paste the output. If the proof cannot be produced cheaply, mark the fact unproven — do not round up.
7. Delete the proof script after capturing its output.

## Failure and recovery
- **Unprovable fact**: If the one safety fact cannot reach certainty-ladder step 4 within one script, mark it unproven and return the report with that fact exposed. Do not assert safety.
- **No single fact found**: If no single load-bearing fact exists, treat every risk as independent and prove or mark each one. Do not collapse to a guess.
- **Proof script fails**: The failure is evidence. Report what it broke, at which step, and what that implies for the change.
- **Scope widening**: If the change is too large for one proof, return a partial report covering the facts that could be checked and name what remains. Do not widen scope or run multiple proofs.
- Rollback: delete the proof script. No other artifact is created.

## Output
A report with five parts:
1. **What it does** — what changed, including the part that is not obvious from the diff.
2. **The one fact** — the single load-bearing safety fact, the certainty-ladder step it reached, and the proof output. If unproven, say so.
3. **Risks** — only confirmed risks. Each names how it breaks, the file:line, likelihood, cost, and how to check. Paste the proof for the ones that matter.
4. **Cleared** — what was checked and why it is fine.
5. **Before merging** — the cheapest test or repro that catches the real bug, including the proof script output.

## Provenance

Adapted from the `blast-radius` skill in the pstack Cursor plugin (cursor/plugins, revision 68836ddaf5697224520f1847d90cdb90ca8babaa), authored by Lauren Tan under the MIT license. Clean-room adaptation: the certainty-ladder confidence rating, the single-load-bearing-fact method, the grep-stops search scope, and the five-part report structure are preserved as mechanisms; expression is rewritten.
