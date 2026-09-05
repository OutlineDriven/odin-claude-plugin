---
name: cpu-pipelines-and-hazards
description: 'Use when explaining pipeline stages, data or control hazards, forwarding, stalls, or superscalar basics behind a counter reading. Not for mispredict cost: use branch-prediction-and-speculation.'
---

# CPU pipelines and hazards

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A stall counter needs interpreting, instruction order changes throughput in a hot loop, or assembly scheduling needs relating to hardware behavior. |
| Authority | Read-only. The skill runs `perf stat` on a user-named binary and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. |
| Done | The hazard class in the loop is named, the counter that shows it is quoted where a binary exists, and one restructuring is proposed with its condition. |

## Inputs

- Hot loop (required): source or assembly.
- Binary and workload (optional): needed for counter evidence.
- Target microarchitecture (optional): in-order embedded core or out-of-order desktop or server core. The answer differs.

## Procedure

1. Set the model. The five-stage in-order pipeline (fetch, decode, execute, memory, writeback) overlaps instruction N in execute with N+1 in decode. Out-of-order cores rename registers, issue to several ports, and retire in order; the five-stage picture still explains where a dependency costs. Done when: the user knows which model applies to the target.
2. Classify the hazard. Done when: each dependency in the loop has a class.

| Hazard | Example | Hardware answer |
|---|---|---|
| Read after write (true dependency) | `add r1, r2, r3` then `sub r4, r1, r5` | Forwarding from the execute or memory stage; a stall when the producer is a load |
| Write after read or write after write | Rare in an in-order core; matters under out-of-order rename | Register renaming |
| Control | A branch whose target is unknown until execute | Prediction, then a flush on mispredict; cost scales with pipeline depth |
| Structural | One memory port shared by two loads | Stall with no dependency at all |

3. Break the dependency chain where the loop is latency-bound. A single accumulator serializes every iteration on the add latency. Two or more accumulators expose independent chains and let the core issue them in parallel. Done when: the loop is restructured or the user confirms the loop is memory-bound and the change would not help.

```c
/* Serial: each iteration waits on acc. */
for (int i = 0; i < n; i++)
    acc = acc + data[i];

/* Two chains: the core overlaps them. */
acc0 = acc1 = 0;
for (int i = 0; i < n; i += 2) {
    acc0 += data[i];
    acc1 += data[i + 1];
}
acc = acc0 + acc1;
```

4. Measure the stall split. Done when: front-end and back-end stall counts for the real workload are recorded, or the answer is marked unmeasured.

```bash
perf stat -e instructions,cycles,stalled-cycles-frontend,stalled-cycles-backend ./app
```

Read instructions per cycle against the core's issue width, not against a fixed number: a four-wide core running a dependent chain sits near one, and that is the chain's floor, not a defect. A high front-end stall share points at instruction cache misses or mispredicts; a high back-end share points at load latency or a saturated port. Memory latency dominates most loops, so pair this with `cpu-cache-opt` before scheduling instructions by hand.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No binary or workload | Deliver the hazard classification and the restructuring as a hypothesis. |
| `perf stat` denied | Report the `perf_event_paranoid` value the tool prints. Do not change the sysctl. |
| High front-end stalls | Look at instruction cache footprint and mispredicts; use `branch-prediction-and-speculation`. |
| Unrolling gives no gain | The loop is memory-bound. Profile loads and consider prefetch; use `cpu-cache-opt`. |
| Cycle model does not match | The target is out-of-order and the in-order count was applied. Use the counters, not a hand count. |
| A `nop` fixes a device timing bug | That is memory-mapped I/O ordering, not a pipeline hazard. Use the proper barrier or delay primitive; never tune device delays with `nop`. |

## Output

A chat answer naming the hazard class for each dependency, the front-end versus back-end stall split when measured, and one restructuring with the condition under which it helps.
