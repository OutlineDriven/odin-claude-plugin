---
name: frontend-fidelity-rebuild
description: 'Use when an authorized reference surface needs a clean-room frontend reconstruction across static, motion, and responsive fidelity. Captures the reference at declared viewports and timelines, reconstructs, and measures fidelity against tolerances. Not for styling or component work without a reference surface.'
---

# Frontend fidelity rebuild

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An authorized reference surface needs a clean-room frontend reconstruction across static, motion, and responsive fidelity. |
| Authority | IP authorization start approval required. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Authorized frontend reconstruction across static, motion, and responsive fidelity. |
| Done | The clean-room reconstruction passes all three fidelity gates with comparison evidence. |
| Stop | Authorization absent; capture blocked; stagnation. Bound: approved reference, viewports, timelines, tolerances, round cap. |

## Inputs

- IP authorization (required): start approval confirming the reconstruction is authorized.
- Reference surface (required): the URL, file, or design artifact to reconstruct from.
- Viewport set (required): the screen sizes at which fidelity is measured (for example, 375px mobile, 768px tablet, 1440px desktop). Named before any reconstruction.
- Timeline set (required): the animation or interaction sequences to measure for motion fidelity (for example, page load, hover transitions, scroll effects). Named before any reconstruction.
- Comparison tolerances (required): the per-gate thresholds that define a pass. Static: pixel difference percentage or visual regression threshold. Motion: timing deviation in ms and property delta. Responsive: layout shift at each viewport breakpoint.

## Procedure

1. Collect start approval with one harness ask/question call. State the reference surface and the authorized scope. End the run on scope drift. Done when: approval is collected or the run ends on absent authorization.
2. Bind the viewports, timelines, and tolerances. Freeze all three before any reconstruction. Done when: the viewport set, timeline set, and per-gate tolerances are named and frozen.
3. Capture the reference surface. For each viewport in the set, capture a full-page screenshot and the rendered DOM. For each timeline in the set, capture a video or frame sequence of the animation or interaction. Record the capture tool, browser, and version. Done when: reference captures exist for every viewport and timeline.
4. Reconstruct the surface in a clean-room implementation. Build from the captures, not from the reference source code. Match the static layout, the motion timing, and the responsive behavior. Done when: the reconstruction renders at every viewport and plays every timeline.
5. Measure fidelity against the reference. For each viewport, compare the reconstruction screenshot to the reference screenshot using a visual regression tool. Record the pixel difference percentage. For each timeline, compare the reconstruction motion to the reference motion. Record timing deviation and property delta. For each viewport transition, compare the layout shift. Record whether each gate passes its tolerance. Done when: all three fidelity gates have comparison results.
6. Stop at success (all three gates pass their tolerances), any non-success terminal, or the bound. Done when: a terminal class is reached and recorded.
7. Persist per profiles.persistence.P1 (durable_location `.outline/loops/frontend-fidelity-rebuild/<run_id>/` when durable). Emit `receipt.json` before return. Done when: the receipt is written with per-gate comparison evidence, tolerances, and the terminal class.

## Failure and recovery

- Authorization absent: stop before any effect; emit a blocked receipt naming the missing approval.
- Capture blocked: the reference surface cannot be captured at a declared viewport or timeline. Terminal `blocked`; report which capture failed and why.
- Stagnation: repeated reconstruction attempts do not improve fidelity scores. Terminal `stalled`; report the score plateau and the attempts.
- Scope drift after binding: end the run; emit a stalled or blocked receipt.
- Budget exhausted: emit an exhausted receipt; budget exhaustion is never success unless it is the predeclared success predicate.

## Output

An immutable K11 receipt with every K11 field, recording the terminal class (success, capped, stalled, blocked, exhausted, or pending) and the per-gate fidelity comparison evidence: static pixel difference, motion timing deviation, responsive layout shift, and whether each gate passed its tolerance.
