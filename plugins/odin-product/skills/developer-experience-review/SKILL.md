---
name: developer-experience-review
description: 'Use when dogfooding a developer-facing product or workflow to produce an evidence-backed DX scorecard. Not for visual UI audit: use web-design-review.'
---

# Developer experience review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /developer-experience-review to dogfood a developer-facing product or workflow |
| Authority | Reversible local: writes only a review log and an optional plan-review section; rollback is undo. No remote mutation. Browser and CLI interactions are reads that change no remote, credential, paid, published, or deployed state. |
| Side effect | A review log and an optional plan-review section under the working directory |
| Done | An evidence-backed eight-dimension scorecard reports measured time to hello world and prioritized DX fixes |

## Inputs

- The product or workflow to dogfood, named by the user (URL, repo path, CLI command, or workflow description). Required.
- One or more benchmark products to score against, named by the user. Optional; when omitted, score the product alone and mark each dimension as absolute rather than comparative.
- A working directory writable for the review log. Defaults to the current directory.

## Procedure

1. Record the target product, any benchmark products, and the current wall-clock start time in the review log. **Done when:** the review log holds the target, benchmarks, and start time.

2. Dogfood the target end to end through the live browser and CLI exactly as a new developer would: install or open it, follow the documented first path, and reach the first meaningful output ("hello world"). Do not skip steps the documentation does not name; do not use private knowledge to bypass friction. **Done when:** the first meaningful output is reached or the run is blocked at a named step.

3. Measure elapsed wall-clock time from the start recorded in step 1 to the first meaningful output. Record the value and every blocking step that extended it. **Done when:** the elapsed time and blocking steps are recorded.

4. Repeat steps 2-3 for each benchmark product, using the same first-meaningful-output definition, and record each measured time. **Done when:** every benchmark is dogfooded with its time recorded, or dropped with a reason.

5. Score the target on eight dimensions, each 1-5, with one sentence of measured evidence per score:
   - Time to hello world: the measured value from step 3, ranked against benchmarks when present.
   - Documentation clarity: whether the first path was completable from docs alone without guessing.
   - Error message quality: whether failures named the cause and the next action.
   - Onboarding friction: count of unexplained steps, manual config, or external prerequisites.
   - Tooling and CLI ergonomics: command discoverability, output readability, and sensible defaults.
   - API or SDK design: whether the first call was obvious from the interface, not from prose.
   - Feedback loop speed: time from a change to observing its effect during dogfooding.
   - Developer support surface: whether help, examples, and status were reachable without leaving the flow.

   **Done when:** all eight dimensions carry a 1-5 score with one measured-evidence sentence.

6. Rank the dimensions by the gap between the target score and the best benchmark score (or, with no benchmarks, by the absolute severity of friction observed). Produce a prioritized list of concrete DX fixes, each tied to the dimension and the measured evidence that motivates it. **Done when:** a prioritized fix list is produced with each fix tied to a dimension and evidence.

7. Write the scorecard, measured times, per-dimension evidence, and prioritized fixes to the review log. If the user supplied a plan or spec to review, append a plan-review section naming where the plan under-invests in the lowest-scored dimensions. **Done when:** the review log is written with the plan-review section appended when a plan was supplied.

8. Return the scorecard and prioritized fixes as the terminal output. **Done when:** the terminal return carries the scorecard and prioritized fixes.

## Failure and recovery
- Cannot reach first meaningful output: stop the clock, record the exact blocking step and the last successful step, score time to hello world as not-achieved, and continue scoring the remaining dimensions from the observed failure. Do not invent a time value.
- Benchmark product unavailable or unreachable: drop it from the comparison, mark the affected dimensions as absolute rather than comparative, and record which benchmark was dropped and why.
- Documentation absent or contradictory: record the contradiction as evidence for the documentation-clarity score; do not guess the intended path.
- Partial result rule: a scorecard missing any dimension is incomplete; keep every dimension present, marking not-achieved or not-observed where evidence is absent, rather than omitting it.
- Rollback: no remote, credential, paid, published, or deployed state is mutated; the only mutation is the local review log, which may be deleted by the user. Never widen scope to fix the product under review.

## Output
A review log with measured time to hello world for the target and each benchmark, an eight-dimension scorecard with one measured-evidence sentence per score, a prioritized list of concrete DX fixes tied to dimensions and evidence, and an appended plan-review section when the user supplied a plan, ordered record-start → dogfood → measure → benchmark → score → prioritize → write → return, with the terminal return being the scorecard and prioritized fixes.
