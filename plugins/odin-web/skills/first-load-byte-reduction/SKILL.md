---
name: first-load-byte-reduction
description: 'Use when a first screen needs lower transfer bytes without visual or behavioral change. Not for visual redesign or behavioral changes.'
---

# First-load byte reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A first screen needs lower transfer bytes without visual or behavioral change. |
| Authority | Reversible local: writes only named local artifacts; rollback is version control. No remote mutation. Asks before adding or upgrading a dependency. |
| Side effect | Pixel-identical first-load byte reduction: local writes to the fixed screens and their asset pipeline. |
| Done | The fixed first screen transfers fewer compressed bytes with pixel identity and passing tests. |
| Stop | No safe reduction; blocked; budget exhausted. Bound: fixed screens, target environment, byte budget. |

## Inputs

- Fixed screens (required): the exact pages or routes to reduce, named before any mutation.
- Target environment (required): the browser, device, or network condition that defines the measurement context.
- Byte budget (required): the target compressed byte count or percentage reduction, declared before work begins.

## Procedure

1. Bind the fixed screens, target environment, and byte budget. Freeze all three before any mutation. Done when: the screens, environment, and budget are named and frozen.
2. Capture the baseline. For each fixed screen, measure the compressed transfer bytes in the target environment using a network waterfall or build-output size report. Record the per-resource byte breakdown: HTML, CSS, JavaScript, images, fonts, other. Simultaneously capture the visual identity rubric: a full-page screenshot at the target viewport and the rendered DOM structure. Done when: baseline bytes and visual identity are recorded.
3. Execute byte reduction inside the bound. Apply asset and bundle optimizations that preserve visual and behavioral identity: compress and resize images to the display dimensions, subset fonts to the used glyphs, tree-shake unused JavaScript, split bundles by route, inline critical CSS, defer non-critical resources, compress text assets with Brotli or gzip. Ask before adding or upgrading a dependency. Done when: the reduced screen transfers fewer compressed bytes than the baseline.
4. Prove pixel identity. Render the reduced screen at the same viewport as the baseline. Compare the full-page screenshot pixel-by-pixel against the baseline screenshot. Tolerances: zero pixel difference for static content; animated or lazy-loaded content must reach the same final rendered state. Run the test suite to confirm no behavioral regression. Done when: pixel identity is confirmed and tests pass.
5. Stop at success (fewer bytes with pixel identity and passing tests), any non-success terminal, or the bound. Done when: a terminal class is reached and named.
6. Persist the run record to `.outline/loops/first-load-byte-reduction/<run_id>/` when durable. Emit `receipt.json` before return. Done when: the receipt is written with before/after byte counts, pixel-identity confirmation, and test result.

## Failure and recovery

- No safe reduction: no byte reduction preserves pixel identity. Terminal `stalled`; report what was attempted and why identity broke.
- Blocked: the environment or pipeline cannot be exercised. Terminal `blocked`; report the blocking condition.
- Budget exhausted: the declared budget is spent before the byte target is met. Terminal `capped`; report the best reduction achieved. Budget exhaustion is never success unless it is the predeclared success predicate.
- Partial result: emit the best reduction obtained; never present a screen that lost pixel identity or failed tests as done.

## Output

A terminal classification (`success`, `capped`, `stalled`, `blocked`, or `pending`) plus the before/after compressed byte counts, per-resource breakdown, pixel-identity confirmation, test result, and the run receipt.
