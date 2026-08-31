---
name: principle-fix-root-causes
description: 'Use when debugging a defect. The run reproduces the failure, traces it to the root cause, and removes the root cause plus every instance of its repeated shape instead of the symptom. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle fix root causes

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Debug a defect. |
| Authority | Reversible local edits only: changes are confined to the project working tree and must be revertable; no credential, remote, published, or deployed mutation. |
| Side effect | Instruments and fixes source: temporary diagnostics plus root-cause edits in project source files; nothing outside the project tree. |
| Done | Root cause and repeated shape removed — the reproduction passes and no instance of the defective shape remains. |

## Inputs

Required: a defect report naming observable wrong behavior (expected vs actual) and a way to run the failing path (command, test, or steps). Optional: error output, logs, or a suspected area to start from. Without a way to reproduce, treat the defect as unreproducible (see Failure and recovery).

## Procedure

1. Restate the defect as expected vs actual in one sentence. If the report asks for new behavior rather than wrong behavior, stop: that is a feature change, not a defect.
2. Reproduce first, before any edit: build the smallest reproduction (command, test, or scripted steps) that fails now. A fix never seen to fail cannot be verified.
3. Bound scope before mutating: state the suspected root cause and the files it touches.
4. Trace the why-chain: ask why the failure happens and check each answer against the source until the chain lands on a decision in this project's source that can be changed, not another symptom. When stuck, instrument instead of guessing: add logging or assertions at the divergence point, rerun the reproduction, and read the actual error.
5. Reject symptom fixes. A change that only silences the failure — a nil/null check to stop a crash, a swallowed or broadened catch, a disabled assertion or test — is not a fix. A check may be added only where the why-chain proves the guarded state invalid, at the boundary where that state enters.
6. Apply the paragraph test before settling: if the change needs a long justification comment explaining why it does not address the real cause, the code is wrong — return to step 4.
7. Fix the pattern, not the instance: search the project for the same shape the why-chain identified (call sites, copies, near-identical guards) and fix every instance.
8. For failures that appear after restart or intermittently, suspect state before code: code does not change between runs, state does. Check stale persistent state first — config, caches, lock files, serialized state. If clearing a state file restores normal behavior, the fix is source-side validation or handling of that state, not a manual clearing step.
9. Verify: the reproduction now passes, the targeted checks covering the touched code pass, and a re-search for the defective shape returns no instances. Remove every diagnostic added in step 4.

## Failure and recovery
- Unreproducible defect: make no source change. Record the exact reproduction attempts and the evidence that would decide the why-chain; classify the run blocked. Never claim done without a passing reproduction.
- Why-chain terminates outside this project (dependency, platform, environment, data): report the chain and the external cause; do not patch around it. Classify blocked unless the project owns the decision.
- Attempted fix fails verification: revert that attempt entirely, including its instrumentation, and return to the why-chain; never stack a new fix on a failed one.
- A repeated-shape instance cannot be fixed (generated, vendored, or owned elsewhere): done does not hold. Report the instances left, the reason, and the state: root cause fixed, shape removal incomplete.
- Never swallow an error to end the run, and never report done while the reproduction fails or any instance of the shape remains.

## Output
Either: fixed source with the root cause removed, every repeated-shape instance fixed, instrumentation removed, and the reproduction plus targeted checks passing, with a report stating the why-chain (symptom to root cause), the instances changed, and the verification evidence. Or: a blocked classification naming which failure class stopped the run, what was reverted, and what evidence or ownership is missing.

## Provenance

Adapted (clean-room) from the pstack skill principle-fix-root-causes in cursor/plugins at revision 68836ddaf5697224520f1847d90cdb90ca8babaa; source licensed MIT per pstack LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25 (pstack by Lauren Tan, poteto). The reproduce, why-chain, fix-the-pattern mechanism is retained; all expression is rewritten for this skill and no source text is copied.
