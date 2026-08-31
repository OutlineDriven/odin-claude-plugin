---
name: first-load-byte-reduction
description: 'Use when a first screen needs lower transfer bytes without visual or behavioral change: reduce compressed bytes to a budget while proving pixel identity and passing tests. Not for visual redesign or behavioral changes — use the relevant design or feature skill.'
---

# First-load byte reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A first screen needs lower transfer bytes without visual or behavioral change. |
| Authority | Reversible local with dependency ask: write only named local artifacts; ask before adding or upgrading a dependency. |
| Side effect | Pixel-identical first-load byte reduction: local writes to the fixed screens and their asset pipeline. |
| Done | The fixed first screen transfers fewer compressed bytes with pixel identity and passing tests. |

## Inputs

- The fixed screens, the target environment, and the byte budget. Required.
- The bound: freeze all three before any mutation.

## Procedure

1. Bind the fixed screens, environment, and byte budget; freeze all three before any mutation. Done when: the screens, environment, and budget are named and frozen.
2. Execute the pixel-identical byte reduction inside the bound: reduce transfer bytes while preserving visual and behavioral identity. Done when: the reduced screen transfers fewer compressed bytes than the baseline.
3. Prove pixel identity and run the test suite. Done when: pixel identity is confirmed and tests pass.
4. Stop at success (fewer bytes with pixel identity and passing tests), any non-success terminal (no safe reduction, blocked, budget exhausted), or the bound. Done when: a terminal class is reached and named.
5. Persist the run per the durability policy; emit the receipt before return. Done when: the run record and receipt are written.

## Failure and recovery

- **No safe reduction**: no byte reduction preserves pixel identity. Terminal `stalled`; report what was attempted and why identity broke.
- **Blocked**: the environment or pipeline cannot be exercised. Terminal `blocked`; report the blocking condition.
- **Budget exhausted**: the declared budget is spent before the byte target is met. Terminal `capped`; report the best reduction achieved. Budget exhaustion is never success unless it is the predeclared success predicate.
- **Partial result**: emit the best reduction obtained; never present a screen that lost pixel identity or failed tests as done.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, `exhausted`, or `pending`) plus the before/after compressed byte counts, pixel-identity confirmation, test result, and the run receipt.

## Provenance

- Profile P-CATALOG: source https://signals.forwardfuture.com/loop-library/catalog.json. Derived provenance ledger records catalog number, URL, access date, and no-expression-reuse attestation. Expression reuse: none.
