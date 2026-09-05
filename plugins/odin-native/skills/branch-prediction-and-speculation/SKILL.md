---
name: branch-prediction-and-speculation
description: 'Use when explaining branch predictors, mispredict penalties, speculative execution, Spectre or Meltdown mitigations, or branchless code. Not for pipeline stage theory: use cpu-pipelines-and-hazards.'
---

# Branch prediction and speculation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Branchy hot code underperforms, a `likely` or branchless refactor needs judgment, a kernel mitigation such as retpoline or KPTI needs explaining, or code branches on secret data. |
| Authority | Read-only. The skill runs `perf stat` on a user-named binary, reads sysfs, and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. `perf stat` writes counters to stdout. |
| Done | The answer names the branch that mispredicts or the speculation path that leaks, gives a measured `branch-misses` count where a binary exists, and states the fix with the condition under which it helps. |

## Inputs

- Code or hot loop (required): the source or disassembly around the branch in question.
- Binary and workload (optional): needed for a measured verdict. Without them the answer is a hypothesis.
- Threat model (optional): whether the question is performance only or also side-channel safety.

## Procedure

1. Explain the mechanism in one pass. The front end predicts a direction for each conditional branch, executes the predicted path, and on resolve either commits or squashes the wrong-path work and refetches from the correct address. The squash cost grows with the distance from fetch to resolve, so a deeper pipeline pays more per mispredict. Backward branches are usually loop closers and predict taken; a data-dependent forward branch with no pattern is the hard case. Done when: the user can say why a given branch is predictable or not.
2. Measure before changing code. Done when: a `branch-misses` count and its ratio to `branches` for the real workload is recorded, or no binary exists and the answer is marked as unmeasured.

```bash
perf stat -e branches,branch-misses ./app
```

Read the ratio against the workload, not against a fixed number: a tight loop over sorted data should show a ratio near zero, while a parser over random input can sit far higher and still be at its floor. Only a ratio that drops after a change proves the change.

3. Pick the remedy for a mispredicting branch. Done when: one remedy is chosen and the condition under which it wins is stated.
   - Sort or partition the data so the branch becomes a run of one direction.
   - Replace the branch with a select. `int m = a < b ? a : b;` may lower to `cmov`. The select executes both operands every time, so it wins only when the branch mispredicts often; on a predictable branch it loses.
   - Split hot and cold paths so the rare path leaves the hot cache line.
   - Peel the loop exit or handle the tail without a branch when the exit mispredicts.
4. Apply compiler hints last. `__builtin_expect(!!(x), 1)` and `__builtin_expect(!!(x), 0)` steer code layout, not the dynamic predictor. On a current out-of-order core the predictor already learns most static patterns, so the hint helps layout of the cold path and little else. Measure after adding one. Done when: the hint is kept only with a measured win.
5. Cover the security side when the branch touches secrets. Speculation past a bounds check can load secret-dependent memory and leave its address in cache state (Spectre variant 1). Meltdown let a user load read a kernel mapping before the fault retired; KPTI separates the page tables. Done when: the applicable mitigation layer is named.
   - Kernel: read the state from `/sys/devices/system/cpu/vulnerabilities/` (one file per issue, such as `spectre_v1`, `spectre_v2`, `meltdown`, `l1tf`). Retpoline, IBRS, IBPB, and STIBP appear in the `spectre_v2` text. A host booted with `mitigations=off` reports `Vulnerable` here.
   - Compiler: Clang's `-mspeculative-load-hardening` masks pointers on the speculative path.
   - Code: constant-time algorithms with no secret-dependent branch or index. This is the only layer that protects a secret from a same-process timing channel.

For the pipeline model behind the penalty, use `cpu-pipelines-and-hazards`. For cache timing channels, use `cpu-cache-opt`. For the kernel mitigation set (KPTI, CET), use `kernel-security`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No binary or workload | Deliver the mechanism and the candidate fixes as hypotheses. Mark the answer unmeasured. |
| `perf stat` denied | Report the `perf_event_paranoid` value the tool prints and the capability it needs. Do not change the sysctl. |
| Hint shows no gain | The predictor already handled the branch. Remove the hint and profile for the real bottleneck. |
| Branchless version slower | The branch was predictable and the select now executes both operands. Revert and benchmark on the target CPU. |
| Mitigation regresses throughput | Name the mitigation and its cost. Isolating the secret-handling code is the alternative; do not recommend disabling mitigations. |

## Output

A chat answer that names the mechanism, the measured `branch-misses` figure when a binary exists, one chosen remedy with its winning condition, and the mitigation layer that applies when secrets are involved.
