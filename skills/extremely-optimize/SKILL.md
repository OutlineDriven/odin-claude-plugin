---
name: extremely-optimize
description: 'Rebuild code from its performance floor: split hot paths from cold, demolish and re-derive the hot ones first, then grill every remaining inefficiency in the cold ones. Use for a subsystem-wide or repo-wide performance campaign, when another round of patching has stopped paying, or when the user says "make this as fast as possible", "extremely optimize", or "grill every inefficiency".'
argument-hint: "[path to a subsystem, or blank for a repo-wide survey]"
metadata:
  short-description: Rebuild hot paths from their performance floor
---

# Extremely-Optimize

Patching a slow subsystem keeps the shape that made it slow. Each fix threads through the structure responsible for the cost, so the structure survives the fix and the next fix buys less. This skill stops patching: measure what the work must cost, tear out the implementation that misses it, and rebuild against that number.

The number is the **floor** — the work the contract cannot avoid. Bytes that must move at achievable bandwidth. Comparisons the lower bound demands. Round-trips the protocol requires. Every target carries a multiple of its floor, and that multiple, not intuition, decides what gets rebuilt and when to stop.

Order is fixed. **Hot** first, because a factor there is the whole win. **Cold** after, because cold code is never free — but it is graded in a different currency, and speed is rarely it.

## Scope

Repo-wide is opt-in, never inferred.

- A named path, or a target identified in the request, is the whole job.
- A bare invocation, or wording that asks for a sweep, profiles the repo's own workload and works the ranked list.

A campaign runs one target at a time, each landing as its own atomic commit. Half-rebuilt is the forbidden state: finish a target or revert it.

## Workflow

1. **Pin the workload and the baseline.** Find or write one runnable command that exercises the target with representative input and takes at least a second of wall clock. Run `hyperfine --warmup 3 --min-runs 10 '<cmd>'`. Record median, stddev, min, max.

   Reject the measurement while stddev exceeds 20 % of median. Pin CPU frequency, isolate the process, widen `--min-runs`, or enlarge the input until the noise clears. Every later comparison resolves against this number, so a noisy baseline poisons the campaign from step one.
   *Done when:* one command reproduces the cost on demand and its median carries a stddev under 20 %.

2. **Split hot from cold.** Profile that workload. A unit is **hot** when it holds ≥ 5 % of total measured time, or when its call count scales with input size. Everything else is **cold**. Write the split down as two lists — the cold list is worked in step 8 and graded against this record.

   Sampling profilers misreport short leaf functions and inlined code. Where the profile disagrees with a call-count argument, believe the call count and confirm it by instrumentation.
   *Done when:* every unit in the target sits on the hot list or the cold list, and the hot list accounts for the bulk of measured time.

3. **State the contract, compute the floor.** Work the hot list in descending order of time share. For each unit:
   - Write what it owes its callers, sourced from call sites, tests, and the signature — never from its own internals.
   - Compute the floor from that contract alone: bytes that must be read and written at achievable bandwidth, the algorithmic lower bound at a measured per-operation cost, the syscalls or round-trips the protocol cannot avoid. Show the arithmetic; compute it with `eval`, never in prose.
   - Divide measured cost by floor. That multiple is the unit's headroom.

   A unit already within 2× of its floor is finished. Record it and move on: rewriting it buys noise and costs structure.
   *Done when:* every hot unit carries a written contract, a floor with its arithmetic, and a multiple.

4. **Classify the surface, then derive blind.** Inventory the unit's consumers and mark each **interior** (every caller in-tree, nothing persisted or shipped) or **boundary** (public API, wire or on-disk format, config running in someone else's deployment, plugin point). A consumer channel static analysis cannot resolve — reflection, string dispatch, generated code, external integration — holds boundary class until evidence moves it.

   Build the replacement from the contract and the floor alone. Reading the old implementation while deriving reproduces its shape under fresh names, and its shape is the cost.

   Data layout comes before code: choose the representation that puts the floor in reach — contiguity, batching, hot and cold fields split apart, one pass where there were three — then write the code that layout implies.
   *Done when:* every consumer is classified, unresolved channels are listed by name and hold boundary class, and a replacement builds from the contract without the old body having been read for structure.

5. **Audit the divergence.** Walk the old implementation branch by branch and place every behavior: folded into the replacement (**essential**) or cut (**residue**), each with a one-line reason. Read for behavior — guards, early returns, side effects, ordering guarantees, error semantics, state transitions.

   Nothing executable proves the replacement equivalent, so a branch never read is a feature deleted by accident. This walk is the only backstop the method has.
   *Done when:* every branch of the old unit is classified essential or residue with a reason.

6. **Gate the boundary.** Present every surface marked boundary in step 4 and get an explicit answer before touching it. Interior surfaces need no ask; demolish them.
   *Done when:* every boundary surface carries a recorded yes or no. None cut on silence, none cut after a no.

7. **Measure, prove, land.** Re-run the step 1 workload. A replacement that fails to beat the baseline median by 1.05× is not a win: revert it and keep the original.

   Run the repo's own verifier, and cover every behavior classified essential in step 5 that no test reached. Delete the old unit and every symbol reachable only from it. Commit this target atomically before starting the next.
   *Done when:* the workload median improved past noise, the verifier is green, searching the residue symbols returns nothing, and one commit carries the target.

8. **Grill the cold paths.** The currency changes here. Cold code is off the clock, so buying speed with complexity is a loss. The cold pass hunts waste that costs something other than time on this workload:
   - complexity that bites at a larger N than today's input,
   - allocations and retained memory,
   - redundant IO, repeated round-trips, work done twice,
   - startup, import, and build cost,
   - artifact size and dependency weight.

   Every unit on the step 2 cold list takes one verdict: **fixed** (naming the cost that fell), **at floor**, or **left** (with the reason). A cold fix that adds a branch, a cache, or a configuration knob to buy microseconds is rejected — in cold code the simplest form is the optimum.
   *Done when:* every cold unit carries one of the three verdicts, each fix names the cost it removed, and the verifier is green.

## When NOT to Apply

- One known hot path, one transform, benchmarked and committed — `optimize`.
- Bloat with no performance claim behind it — `breaking-driven`.
- Dead fields and redundant wrappers in code you are already editing — `cleanup-codebase`.
- No runnable workload and no way to build one. Measurement is the method; without it this degrades into guesswork with a rewrite attached.

## Anti-patterns

- **Grilling the cold path first.** Cold work is the easy work, which is exactly why it jumps the queue. Hot pass, then cold pass.
- **Rewriting toward a feeling.** "Faster" is not a target; a multiple of the floor is. Compute the floor before touching the code.
- **Reading the old implementation while deriving.** It returns with new names and the same cost. State the contract, then look away.
- **Skipping the divergence audit.** Derivation alone is the rewrite that silently drops edge cases. Walk every branch.
- **Trusting a noisy benchmark.** A baseline with 20 % stddev makes every later comparison a coin flip. Clear the noise first.
- **Buying cold-path speed with complexity.** The branch costs forever and pays nothing. Leave cold code simple.
- **Keeping an adapter from the new shape back to the old.** The cost you removed climbs back in through it. Migrate the callers.
- **Escalating a named target into a repo-wide campaign.** Scope equals the ask.

## Validation Gates

| Gate | Condition |
|------|-----------|
| Baseline trusted | One reproducible workload command; median stddev under 20 % |
| Split recorded | Every unit in the target named hot or cold, both lists written down |
| Floor computed | Every hot unit carries a contract, a floor with arithmetic, and a measured multiple |
| Derived blind | Each replacement was written from contract and floor, before the old implementation was read for behavior |
| Divergence audited | Every old branch classified essential or residue with a reason |
| Boundary answered | Every boundary surface carries a recorded yes or no; none cut on silence, none cut after a no |
| Win proven | Post-change median beats baseline by ≥ 1.05× on the step 1 workload |
| Cold graded | Every cold unit carries a fixed / at-floor / left verdict, and no cold fix added a branch, cache, or knob |
| Landed atomically | Verifier green; the target committed on its own; no half-rebuilt target in the tree |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Hot units rebuilt against their floors with a proven win, cold units graded, residue gone, verifier green |
| 10 | No workload: the target's cost cannot be reproduced on demand, so nothing can be measured or proven |
| 11 | Baseline too noisy: stddev exceeded 20 % of median and the noise could not be cleared |
| 12 | No headroom: every hot unit already sits within 2× of its floor |
| 13 | No win: the replacement failed to beat the baseline by 1.05× and was reverted |
| 14 | Divergence unclassified: old behavior neither folded in as essential nor cut as residue |
| 15 | Boundary cut without an answer: a published surface was destroyed on silence or after a no. Restore it and settle the question |
| 16 | Campaign stalled mid-target: a target is half old, half new. Finish it or revert it, never ship it |
| 17 | Scope exceeded: a repo-wide sweep ran off a named target. Revert the untargeted work |
