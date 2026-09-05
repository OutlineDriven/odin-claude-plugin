---
name: fastopt-extreme
description: 'Use when optimizing estimated hot and complexity-neutral cold paths while refusing complexity theater. Not for measured-floor rebuilds: use extremely-optimize. Not for hypothesis-only: use fastopt.'
---

# Fastopt extreme

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to optimize estimated hot paths and complexity-neutral cold paths while refusing complexity theater. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: hypotheses and benchmark designs for estimated hot paths; simplification proposals for complexity-neutral cold paths. |
| Done | Hot-path hypotheses with benchmark designs and cold-path simplification proposals are emitted; complexity theater is refused. |

## Inputs

The target code region or module to analyze. Optional: known call frequencies, profiling data, or prior benchmark results that sharpen hot-path estimates. If no code is supplied, request it before proceeding.

## Procedure

1. Bound scope to the named code region or module. Do not widen to unrelated code. Done when: the scope is bounded to the named region or module.
2. Estimate hot paths from call frequency, loop depth, allocation density, and I/O or syscall blocking. Label every estimate as a hypothesis, not a measured fact. Done when: every hot-path estimate is labeled as a hypothesis with its basis stated.
3. Identify complexity-neutral cold paths: paths whose optimization adds no new abstraction, wrapper, configuration flag, caching layer, or indirection. The change must be simpler than or equal in complexity to the original. Done when: every cold-path candidate is classified as complexity-neutral or rejected.
4. For each hot-path hypothesis, design a benchmark that would confirm or refute it. State the metric, the baseline measurement, and the falsification condition under which the hypothesis is rejected. Done when: every hot-path hypothesis has a benchmark design with metric, baseline, and falsification condition.
5. For each complexity-neutral cold-path candidate, state the specific simplification and why it adds no complexity. Done when: every cold-path candidate has its simplification and complexity justification stated.
6. Refuse complexity theater: reject any proposed optimization that introduces a new abstraction, wrapper, flag, caching layer, or indirection whose complexity exceeds the gain it claims. State the refusal, the complexity cost, and the claimed gain. Done when: every complexity-theater proposal is refused with its cost and claimed gain stated.
7. Emit all hypotheses, benchmark designs, simplification proposals, and refusals as chat output. Do not mutate any file. Done when: the chat report is emitted with no file mutation.

## Failure and recovery
- No code supplied: request the target region; do not guess or analyze from memory.
- Path unclassifiable: if a path cannot be classified as hot or cold from available evidence, label it unclassified and exclude it from optimization proposals.
- Complexity theater detected: refuse the proposal; record the complexity cost and the claimed gain. Do not emit it as a valid optimization.
- Partial result: emit the hypotheses and designs obtained; mark every unclassified or refused item explicitly so the done predicate is not falsely satisfied.
- Non-mutation: no file, VCS, or remote change is made. Rollback is not applicable.

## Output
A report containing: hot-path hypotheses (each labeled as a hypothesis with a benchmark design specifying metric, baseline, and falsification condition), complexity-neutral cold-path simplification proposals (each with the specific simplification and complexity justification), and explicit refusals of complexity theater (each with the complexity cost and claimed gain stated).
