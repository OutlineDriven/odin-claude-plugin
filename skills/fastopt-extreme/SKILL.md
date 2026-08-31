---
name: fastopt-extreme
description: 'Use when a user wants to optimize estimated hot paths and complexity-neutral cold paths while refusing complexity theater. Hot and cold path hypotheses and benchmark designs are emitted and complexity theater is refused. Don''t use for tasks that require source or remote-system changes.'
---

# Fastopt extreme

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to optimize estimated hot paths and complexity-neutral cold paths while refusing complexity theater. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: hypotheses and benchmark designs for estimated hot paths and complexity-neutral cold paths. |
| Done | Hot and cold path hypotheses and benchmark designs are emitted; complexity theater is refused. |

## Inputs

The target code region or module to analyze. Optional: known call frequencies, profiling data, or prior benchmark results that sharpen hot-path estimates. If no code is supplied, request it before proceeding.

## Procedure

1. Bound scope to the named code region or module. Do not widen to unrelated code.
2. Estimate hot paths from call frequency, loop depth, allocation density, and I/O or syscall blocking. Label every estimate as a hypothesis, not a measured fact.
3. Identify complexity-neutral cold paths: paths whose optimization adds no new abstraction, wrapper, configuration flag, caching layer, or indirection. The change must be simpler than or equal in complexity to the original.
4. For each hot-path hypothesis, design a benchmark that would confirm or refute it. State the metric, the baseline measurement, and the falsification condition under which the hypothesis is rejected.
5. For each complexity-neutral cold-path candidate, state the specific simplification and why it adds no complexity.
6. Refuse complexity theater: reject any proposed optimization that introduces a new abstraction, wrapper, flag, caching layer, or indirection whose complexity exceeds the gain it claims. State the refusal, the complexity cost, and the claimed gain.
7. Emit all hypotheses, benchmark designs, simplification proposals, and refusals as chat output. Do not mutate any file.

## Failure and recovery
- **No code supplied**: request the target region; do not guess or analyze from memory.
- **Path unclassifiable**: if a path cannot be classified as hot or cold from available evidence, label it unclassified and exclude it from optimization proposals.
- **Complexity theater detected**: refuse the proposal; record the complexity cost and the claimed gain. Do not emit it as a valid optimization.
- **Partial result**: emit the hypotheses and designs obtained; mark every unclassified or refused item explicitly so the done predicate is not falsely satisfied.
- **Non-mutation**: no file, VCS, or remote change is made. Rollback is not applicable.

## Output
A report containing: hot-path hypotheses (each labeled as a hypothesis with a benchmark design specifying metric, baseline, and falsification condition), complexity-neutral cold-path simplification proposals (each with the specific simplification and complexity justification), and explicit refusals of complexity theater (each with the complexity cost and claimed gain stated).

## Provenance

Origin: `project-owned:user-curated-skill-ideas`, user-curated skill idea `fastopt-extreme`. Pinned revision: none. License: none (project-owned user curation). Adaptation: clean-room procedural restatement of the one-line curated brief; no third-party expression copied.
