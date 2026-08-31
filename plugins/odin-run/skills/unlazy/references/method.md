# The depth tree: construction and orchestration

The tree is a decomposition tool, not an effort multiplier. Measured runs show models treat depth arithmetic as a thoroughness dial and ignore the math, so the effort guarantee lives where it can be enforced: per-leaf gates and fresh per-leaf contexts. What depth buys is structure.

## Construction rules

1. **Layer 1 is the task.** Split at natural joints, binary where the joints allow, N layers deep. Leaves are the only places real work happens; every layer above them is decomposition and integration.
2. **A leaf is a real unit of work.** Ten or more minutes of focused effort, one coherent deliverable, one gates file. If splitting produces smaller leaves, you went one layer too deep; back off a layer. Depth follows the task's joints, never a number you crank for effort.
3. **Contracts before fan-out.** Interfaces, data ownership, naming, and error conventions go into the plan before any leaf starts. No two leaves may own the same file; if they seem to need to, the split is wrong or the shared thing belongs in the contract.
4. **Leaves get gates; branches get gates.** A leaf's gates prove its deliverable. A branch's gates prove integration: children merged, interfaces match, end-to-end behavior works, no sibling regressions. The most expensive failure of deep trees is thirty-two locally perfect leaves that do not compose; branch gates catch exactly that.
5. **Effort per leaf comes from its gates plus the four passes** (implement fully, expert re-read, defect hunt, free polish). A leaf is finished when its gates are fully met with evidence AND a full pass finds nothing to improve. "Budget spent" is not a finish line, because budgets are the part models re-negotiate with themselves.

## Choosing N

- Tree 2-3: a feature, a bug hunt, a document. Solo mode, one gates file, 2-4 leaves worked in sequence in one session.
- Tree 4-5: a subsystem, a refactor, a serious review. Consider orchestrated mode; 8-16 leaves is past what one context holds well.
- Tree 6-7: an entire project built to a high bar. Orchestrated mode, leaves mapped onto disjoint work units, parallelized where the harness allows, branch gates at every merge point.

When the user gives no depth, pick the smallest N whose leaves match the task's natural parts. Go one deeper only when a leaf would clearly hide multiple deliverables inside it.

## When to orchestrate

The stall-at-80-percent failure is an end-of-long-context disease. Attention, not time, is the scarce resource, and a fresh subagent per leaf resets it. That is the honest version of "every leaf gets the full budget".

Orchestrate at tree depth 4+, or any build clearly beyond one sitting, roughly half an hour of real work and above. Below that, stay solo: subagent overhead (context re-establishment per leaf) costs more than it buys, and one `.outline/GATES.md` in one session gives you most of the discipline at a fraction of the cost. Checks-as-commands do the economizing everywhere: every CHECK line converts model re-reading into a free subprocess, and evidence stays capped at the deciding lines, never a log.

## The driver loop

In orchestrated mode you (the main session) are the driver. You do not implement leaves; you plan, dispatch, verify, integrate.

1. **Plan.** Write the plan (contract, tree, one gates file per leaf and branch) from the template. This is the only step where the whole task must fit in one head.
2. **Dispatch one leaf.** Spawn a subagent whose entire brief is: the contract section of the plan (not the whole file, not your history), its own gates file verbatim, and the instruction to work the four passes until every gate is met with evidence, then stop; if a gate is impossible, ABANDON it with a reason. Lean briefs are the point: a leaf never receives the driver's transcript or the other leaves' outputs.
3. **Verify, never trust.** When the leaf returns, re-run its checks yourself: `python3 <skill-dir>/scripts/gate_check.py --status .outline/gates/leaf-x.md`, plus a spot re-run of the CHECK commands. A leaf that checked its own boxes without evidence gets sent back with the specific unmet gates named. This layer makes self-certification worthless.
4. **Log and advance.** Append one line to the plan's status log (append-only; never rewrite lines above). Dispatch the next leaf. When all children of a branch are verified, work the branch's integration gates yourself or dispatch an integration leaf.
5. **Report.** Only when the root's gates are met. Paste the ledger, N of N, with every ABANDON line surfaced, and re-measure every number you state.

## Parallelism

Leaves whose file ownership is disjoint (the contract guarantees this) can run concurrently where the harness supports it. Parallelism buys wall-clock time, not token savings; never use it as an excuse to skip per-leaf verification. If two leaves ever need the same file, fix the plan; do not coordinate through hope.

## Verification hierarchy

Three layers, weakest to strongest, each catching what the layer below misses:

1. **Leaf self-check**: gate-check run by the leaf itself. Catches honest incompleteness, misses self-deception.
2. **Parent re-run**: the driver re-executes the checks. Catches self-deception and environment differences.
3. **Structural stop enforcement** (harness-dependent, not shipped here): blocks a session from ending while gates are unmet. Catches the driver itself drifting into report mode.

Prose discipline is layer zero and the weakest. Prefer moving any repeated judgment call up this hierarchy: if you find yourself re-checking the same thing twice by reading, write a CHECK command for it.

## Model and effort tiering

Where the harness allows choosing a model or effort per subagent, tier by leaf type. Mechanical leaves (rename sweeps, fixture generation, applying a decided pattern across files) go to a cheaper model or lower effort. Design leaves, integration branches, and every verification pass stay on the strong model. The driver stays on the strong model always; a weak driver invalidates every verification above layer one.
