---
name: ios-visual-review
description: 'Use when the user invokes /ios-visual-review to audit an iOS app''s visuals on a real device. Produces a per-screen visual-review report scoring ten dimensions 0-10 with a biggest-leverage fix for each. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# iOS visual review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs `/ios-visual-review`. |
| Authority | Reversible-local: write only the named review-report artifact; delete or overwrite it to roll back. |
| Side effect | Local-write to iOS screen visual-review findings (one Markdown report file). |
| Done | An iOS visual-review report is produced. |

## Inputs

- A running read-only iOS observation session against a real device or simulator, exposing screenshot capture and an accessibility-tree element query. Required; the skill does not start or mutate the session.
- The set of screens to review. Optional: if omitted, discover screens from the accessibility tree and confirm the discovered set before scoring.
- A project DESIGN.md or equivalent design-intent document. Optional: when present, evaluate against it in addition to Apple HIG; when absent, evaluate against HIG and general iOS design practice only.

## Procedure

1. Acquire read-only access to the observation session. Issue no mutating calls to the device or app.
2. Determine the screen set. Use the user-supplied list when provided; otherwise, enumerate screens from the accessibility tree and confirm the set with the user before proceeding.
3. For each screen in the set:
   1. Capture a screenshot.
   2. Query the accessibility tree for elements.
   3. Score each of the ten dimensions below 0-10 and state what would push the score to 10.
   4. Record concrete findings tied to the screenshot.
4. Apply the ten-dimension rubric:
   1. Typography hierarchy. Display, body, and caption sizes follow the Apple HIG dynamic-type scale on SF Pro. Line-height matches font size. No undersized body text.
   2. Spacing rhythm. A 4pt or 8pt grid is applied consistently. No unexplained magic paddings. Safe-area insets are respected.
   3. Color hierarchy. The primary action carries the highest contrast; secondary actions are muted; destructive actions are visually distinct. Dark mode renders correctly. Body text meets WCAG AA 4.5:1 and large text 3:1.
   4. Touch targets. Every interactive element is at least 44x44pt. No tappable text smaller than 24pt.
   5. Loading, empty, and error states. Each is present and intentional. No blank screens during async work. Empty states tell the user what to do next.
   6. Accessibility. VoiceOver labels exist on every interactive element. Dynamic Type up to XXL does not break layouts. Reduce Motion is respected. The palette is checked against deuteranopia.
   7. Animation discipline. No more than two simultaneous animations. UI feedback durations land in 200-300ms. Spring damping matches the seriousness of the flow.
   8. iOS idiom alignment. Native components (NavigationStack, List, Form, system sheets) are used where appropriate. Navigation is not reinvented. No web-style hamburger menus on phone.
   9. Information density. Per-screen content fits without horizontal scroll. Long screens carry section anchors. Lists use real iOS list patterns (swipe actions, contextual menus).
   10. AI-slop check. No generic stock layouts, leftover placeholder data, cargo-culted Material Design imported from Android, or gradients that read as AI-generated.
5. For every dimension scoring below 7 on any screen, surface the issue with a recommended fix and its tradeoff and let the user decide whether to address it. Do not auto-apply fixes.
6. Write the report artifact described under Output. Done when: every reviewed screen has ten scores, concrete findings, and one biggest-leverage fix per dimension, while unscored screens carry their blocker.

## Failure and recovery
- Observation session unavailable or rejects read-only access: stop and report the exact error. Do not attempt to start, upgrade, or re-mint the session. Roll back is trivial: no report is written.
- Screenshot returns blank or black: confirm with the user that the app is in the expected state before scoring that screen; do not score a screen from a blank capture.
- Discovered screen count differs from a user-supplied ground-truth list: ask the user whether the missing screens are hidden behind state not yet triggered; do not silently drop or add screens.
- Partial-result rule: scores and findings already captured for completed screens are retained; the report marks any screen that could not be scored and the reason. Never present an unscored screen as scored.
- Non-mutation rule: the device and app are never mutated. The only written artifact is the report file, which can be deleted or overwritten to roll back.
- Blocked result: report BLOCKED with the exact blocker and what was attempted; do not emit a done predicate that does not hold.

A Markdown report written to a local path under the project directory, named `ios-visual-review-<date>.md`. It contains, per screen: the screenshot, the 0-10 score for each of the ten dimensions, the what-would-make-it-a-10 note for each dimension, and one biggest-leverage fix per dimension. Screens scoring below 7 on any dimension are flagged with the surfaced fix and tradeoff. The report is the terminal deliverable; no source, device, or app state is changed.
