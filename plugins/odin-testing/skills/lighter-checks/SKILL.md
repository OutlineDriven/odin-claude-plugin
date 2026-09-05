---
name: lighter-checks
description: 'Use when verification is looping, would re-run untouched code, or duplicates an established proof. Not for tasks that require source or remote-system changes.'
---

# Lighter checks

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Checking has started to loop, a check would re-run against untouched code, a second tool would prove what the first proved, or the user asks to stop over-checking and ship. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Emits a delivery decision only. |
| Side effect | Run scoped typecheck, lint, and test verification once per touched language, trim redundant verification, and report whether delivery may proceed. |
| Done | One proving action has run per claim, no action was repeated for reassurance, each touched language's complete project gate ran once, and the result is delivered on the first green gate. |

## Inputs

Required inputs are the claims to prove, the changed files or explicitly bounded changed surface, the languages touched, and the project's typecheck, lint, and test commands for those languages. Supplied results must include their command, scope, and outcome. Never assume an optional input establishes evidence.

## Procedure

1. Bound verification to the supplied changed surface and touched languages. If either is unknown, stop rather than inspect or verify unrelated scope. Done when: the changed surface and touched languages are bounded, or the skill stops for unknown scope.

2. Map each claim to the narrowest action that directly proves it. Reuse a supplied result only when its command and scope cover that claim and the relevant code has not changed since it ran. Done when: every claim is mapped to one narrowest proving action or a reused result that covers it.

3. Remove any proposed re-run against unchanged code and any second tool that covers the same failure class as an accepted result. Keep a second action only if it proves a distinct claim or failure class. Done when: no redundant re-runs or duplicate-class tools remain in the plan.

4. Run the project's complete typecheck, lint, and test gate once for every touched language. Use the narrowest project-supported scope that still covers the changed surface; use a repository-wide command only when no narrower command covers it. Done when: one complete gate has run per touched language.

5. Treat each command's output as its evidence. Do not re-read a diff, repeat a green command, or add a stricter tool solely for reassurance. Done when: each command's output is recorded as evidence and no reassurance re-run is performed.

6. If every required action is green, stop immediately and return the evidence with a deliver decision. Do not perform any further check after the first complete green gate. Done when: the deliver decision is returned on the first green gate, or a failure is reported.

## Failure and recovery
- Missing boundary or command: Return `blocked` with the missing changed surface, language, or project command; do not substitute a guessed command or widen scope.
- Failed check: Return `red` with the exact command, scope, and failure output. Make no repair under read-only authority. After a correction is supplied, re-run only the failed action unless the correction changed another action's covered surface.
- Unavailable or inconclusive check: Return `blocked` and identify the unproved claim; partial green results remain evidence only for the claims they directly cover.
- Mutation required or observed: Stop before mutation, or stop immediately if a command reports one, and return `blocked` with the affected target. Never report delivery while any required claim is failed, unavailable, inconclusive, or unproved.

## Output

Return a chat report listing each claim, its single proving command and scope, its observed result, any omitted redundant checks and why they were redundant, and exactly one terminal classification: `deliver`, `red`, or `blocked`.
