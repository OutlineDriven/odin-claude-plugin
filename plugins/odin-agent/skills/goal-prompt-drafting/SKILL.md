---
name: goal-prompt-drafting
description: 'Use when asked to draft copy-ready /goal objectives for long-running agents; returns one normalized one-line objective with measurable end state, grounded proof, easy-out invariants, a stop clause, and a Missing list. Not for source or remote-system changes.'
---

# Goal prompt drafting

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to draft, rewrite, compress, or prepare a copy-ready goal-mode objective or /goal command for a long-running agent. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; applies a deterministic one-line normalizer and returns one normalized /goal command plus only necessary missing-information warnings. |
| Done | The objective states a measurable end state, grounded proof, invariants against easy-outs, and a stop or blocked clause; it is one line within the 4,000-character harness limit, and any ungrounded contract element is listed as missing. |

## Inputs

- The user's draft, request, or conversation describing the intended work (required).
- Repository context the agent may read to ground elements: files, the exact test command, logs, or a plan (optional; looked up rather than guessed).
- The harness character limit is fixed at 4,000; `/goal` is taken as one line.

## Procedure

1. Read the user's draft and any referenced repository context. Never invent an element: look things up in the request, conversation, or repository; an element that cannot be grounded is left out and flagged (see Failure and recovery). Done when: the grounding set is listed and every element is sourced from the request, conversation, or repository, with ungroundable elements flagged for the Missing list.
2. Draft the condition as elements joined with AND, never "or": the loop takes the cheaper branch of an OR: Done when: the condition is drafted as AND-joined elements with no OR, and each element names an end state, scope, check, invariant, or stop bound.
   1. **End state, not activity**: "all `legacyAuth()` call sites use `auth.verify()`", not "migrate the auth code". An activity can be claimed; an end state is true or false.
   2. **Scope to read first**: the files, issue, logs, or plan to read before acting.
   3. **Stated check**: the exact command and its observable result ("`pnpm test` exits 0"), plus an instruction to run it and show the output; a result that never lands in the transcript does not exist to the evaluator.
   4. **Invariants**: what must not change ("without modifying vendor/"), always including "do not weaken, skip, or edit the checks themselves".
   5. **Stop bound or blocked clause**: "or stop after 20 turns", "if blocked, stop and report the blocker". Without one, a mis-stated condition loops forever. (A turn bound silently extends across session resume because the counter resets.)
3. Keep it small. Every constraint narrows the state space the model can explore. Collapse to one terminating criterion when possible, move scope and definitions into a referenced file, and drop non-goals: a constraint earns its place only by closing a real easy-out. For long goals, name the final evidence (diff, report, artifact) and require a progress log file for durable state across compaction and resume. If the brief exceeds 4,000 characters, put the details in a `GOAL.md` and reference that file from the objective. Done when: the objective is one terminating criterion or the minimal set, definitions are moved to a referenced file, and the total length is at or under 4,000 characters.
4. Reread the drafted condition as a lazy model would: what is the cheapest way to make every check pass without doing the intended work? Close the cheapest outs: prefer pairing existing checks over adding constraints, and do not enumerate every conceivable out into a non-goal list. The recurring outs: Done when: each named easy-out is closed by pairing an existing check, and no constraint was added that restates the step rather than closing a specific out.
   - Delete or stub instead of fix: "search prints nothing" also holds when the callers are gone; pair such a check with one that proves the feature still works.
   - Pass on a subset: running one test file, narrowing the search path, excluding directories from the check.
   - Game the gate: skipping/xfail-ing tests, hardcoding expected outputs, special-casing the test inputs, editing the check (the invariants rule).
   - Claim without running: declaring done or blocked with no check output in the transcript (the show-the-output rule).
5. For security research goals, collapse to one terminating criterion: identify, trigger, and validate one high-severity vulnerability valid under a referenced threat-model file. That file, not the goal, carries scope, attacker powers, severity baseline, and known findings to skip. Use neutral wording ("trigger and validate", not "prove this is exploitable"), require demonstrated preconditions: assumed attacker access is the most common false positive: and stop for human review after each finding rather than piling up untriaged reports. Validate findings with a second pass by a fresh agent, never the finder alone. Done when: the security goal collapses to one terminating criterion referencing a threat-model file, and the neutral wording, precondition requirement, and second-pass validation are stated.
6. Normalize deterministically: collapse all whitespace to one line, strip `/goal` prefixes, surrounding quotes, and code fences; warn if a stop clause is missing; reject output over 4,000 characters: shorten or move detail to a referenced file and rerun rather than truncating the contract. Done when: the output is one line, whitespace-collapsed, stripped of prefixes and fences, at or under 4,000 characters, and carries a stop-clause warning if one is absent.
7. Return exactly one fenced `text` block, one line, as shown in Output. Add no prose around it except a `Missing:` list when checklist elements could not be grounded. Done when: exactly one fenced text block is returned on one line, with no surrounding prose except a Missing list when elements are ungrounded.

## Failure and recovery
- Missing element: never invent. Optimize and format what the user provided, leave the ungrounded element out, and follow the block with a `Missing:` list, one line per gap, telling the user what to supply. A goal with an invented success condition terminates on the wrong contract.
- Unclosable easy-out: list it in `Missing:` as a warning rather than inventing an absurd constraint; an invented or absurd constraint is worse than a flagged gap.
- Output over 4,000 characters: shorten or move detail to a referenced file and rerun the normalizer; do not truncate the contract.
- Missing stop clause: warn; do not silently ship a condition that can loop forever.
- Blocked / non-converged: return the formatted objective plus the `Missing:` list; never claim the done predicate holds while a contract element is ungrounded.

## Output
Exactly one fenced `text` block, one line:

```text
/goal <single normalized objective>
```

Followed by a `Missing:` list (one line per gap) only when checklist elements could not be grounded. No other prose.

Example grounded result:

```text
/goal All legacyAuth() call sites use auth.verify(): `rg "legacyAuth\(" -t ts` prints nothing AND `pnpm test` exits 0 (run both, show the output), without modifying vendor/ or weakening any test. If blocked, stop and report attempted paths and the blocker, or stop after 20 turns.
```

Example with gaps (no metric or benchmark in context):

```text
/goal Make checkout faster
```

Missing:
- measurable end state: which metric and threshold count as "faster"
- verification: the benchmark or command that proves it
- stop bound: e.g. "or stop after 20 turns"
