---
name: ui-animation
description: 'Use when asked to build spring, easing, gesture, and choreographed animations with correct physics and reduced-motion support. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# UI animation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | spring animation, gesture, easing, screen recording, animate this, curve fitting, choreography |
| Authority | reversible-local — write files under the project directory only; no VCS, credential, paid, published, or deployed mutation |
| Side effect | Produces animation code/curves; may run Python scripts to extract motion |
| Done | Animation uses correct springs, curves, choreography, and respects reduced motion |

## Inputs

- **Required**: a UI element or component to animate, or an explicit request to build an animation from scratch.
- **Optional**: reference recording (screen capture or video), target framework or library (CSS, React, SwiftUI, Compose, etc.), existing design tokens or motion constants.
- **Blocked**: anything requiring network calls, authentication, or non-local execution beyond the project directory.

## Procedure

1. **Classify the ask.** If the user names a framework or library, route to its animation primitives. If the user supplies a screen recording or video, propose curve-fitting extraction before writing code.
2. **Validate scope.** Confirm the animation target is a UI element, component, or screen under the project directory. Stop if the request targets a remote, deployed, or credential-protected resource.
3. **Decide whether to animate.** Reject a request if animation does not serve a clear functional purpose (feedback, transition, continuity, guidance). State the rejection reason and wait for clarification.
4. **Select animation type.** Choose from: entrance, exit, state transition, scroll-linked, gesture-driven, or continuous ambient. Reject compound multi-type animations unless the user splits them.
5. **Design the animation.** For each moving element:
   - Pick a physics model: spring (mass–stiffness–damping), easing curve (CSS cubic-bezier or equivalent), or keyframe sequence.
   - Choose a duration and easing. Default to fast (150–250 ms) for micro-interactions, medium (250–400 ms) for transitions.
   - For spring animations, compute or estimate stiffness, damping, and mass. Never hard-code arbitrary numbers without rationale.
   - For gesture-driven animations, model the drag axis, snap points, and release velocity.
6. **Apply choreography.** When multiple elements move together, define the sequence, stagger interval, and overlap. State the choreography logic explicitly.
7. **Respect reduced motion.** If the user request or the `prefers-reduced-motion` media query is detected, replace physics-based or continuous animations with instant state changes or opacity-only fades. Document this substitution.
8. **Write the animation code.** Produce code in the target framework or library. Annotate each transition with the curve name, duration, and the element it affects. Inline the animation; do not assume a shared motion library exists.
9. **Validate the output.** Confirm every animation block has a defined curve, duration, and target. Confirm reduced-motion is handled. If a Python script was run to extract motion, note the script name and what it produced.

## Failure and recovery
- **Scope violation**: the request targets a non-local or credential-protected resource. Stop immediately. Return the classification that was blocked and the reason.
- **Framework unknown**: the target framework is not stated and cannot be inferred from the project. Stop at Procedure step 1. Ask the user to name a framework.
- **No functional purpose**: the animation serves no feedback, transition, continuity, or guidance purpose. Stop at Procedure step 3. State the rejection reason.
- **Partial result**: if a Python script fails mid-run, discard any partial output. Report the script name, the failure point, and the last valid output before the failure. Do not claim the animation is complete.
- **Non-converged**: animation quality cannot be judged algorithmically. Present the output for user review. Mark the skill complete only when the user confirms the animation meets the done predicate.

## Output
A code artifact containing the animation, with:
- Named animations, curves, or spring parameters for each element.
- Duration and easing for every transition.
- A comment or flag noting reduced-motion substitution, if applied.
- If curve fitting was performed: the fitted parameters and the script that produced them.

## Provenance

Origin: mblode/agent-skills, revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9.
License: MIT — Copyright (c) 2026 Matthew Blode. Preserve the copyright notice and the license text in all copies or substantial portions.
Adaptation: Clean-room rewrite per MIT reuse constraints. Trigger, authority, and procedure derived from the original skill design; written to ODIN 2.0 SKILL.md schema without copying expression.
