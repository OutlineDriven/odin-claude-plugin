---
name: flaky-test-stabilization
description: 'Use when a confirmed flaky test needs root-cause repair and consecutive-run proof without blind retries: repair the root cause, then prove the suite flake-free with N consecutive comparable runs. Not for quarantine-only stabilization or blind retries — use fix for general repair.'
---

# Flaky test stabilization

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A confirmed flaky test needs root-cause repair and consecutive-run proof without blind retries. |
| Authority | Reversible local: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Flake-free test stabilization: root-cause repair and consecutive-run proof. |
| Done | N consecutive comparable full-suite runs are green. |

## Inputs

- The confirmed flaky test, the preselected N (consecutive run count), and a comparable environment. Required.
- The bound: freeze all three before any mutation.

## Procedure

1. Bind the confirmed flaky test, preselected N, and comparable environment; freeze all three before any mutation. Done when: the test, N, and environment are named and frozen.
2. Repair the root cause of the flake inside the bound — no blind retries, no quarantine-only fixes. Done when: the root cause is identified and repaired.
3. Run N consecutive comparable full-suite runs. Done when: all N runs are green, or a run fails and the root cause is revisited.
4. Stop at success (N consecutive green runs), any non-success terminal (root cause blocked, visible quarantine, budget exhausted), or the bound. Done when: a terminal class is reached and named.
5. Persist the run per the durability policy; emit the receipt before return. Done when: the run record and receipt are written.

## Failure and recovery

- **Root cause blocked**: the flake's root cause cannot be identified or repaired. Terminal `blocked`; report the flake evidence and what was attempted.
- **Visible quarantine**: the only available stabilization is quarantining the test without root-cause repair. Terminal `stalled`; report that quarantine is not root-cause repair.
- **Budget exhausted**: the declared budget is spent before N consecutive green runs. Terminal `capped`; report how many consecutive runs passed. Budget exhaustion is never success unless it is the predeclared success predicate.
- **Partial result**: emit the repair and run results obtained; never present fewer than N consecutive green runs as flake-free.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the root cause, the repair applied, the N consecutive run results, and the run receipt.
