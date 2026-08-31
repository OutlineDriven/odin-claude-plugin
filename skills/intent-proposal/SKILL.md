---
name: intent-proposal
description: 'Use when material arrives without a fully-formed ask or the ask reads thinner than the data suggests. Reads the data end to end and proposes the intent behind it as a confirmation-ready proposal paired with a next-step sketch, so the user confirms, corrects, or adjusts with a short reply instead of composing the ask from scratch. Don''t use for tasks that require source or remote-system changes.'
---

# Intent proposal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Material arrives without a fully-formed ask, or the ask reads thinner than the data suggests |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | None; emits a one-line intent proposal plus next-step sketch for confirmation |
| Done | User's reply is short: yes, correction, or adjust; if they had to compose the ask from scratch, the skill failed |

## Inputs

- The handed-over material (files, repository, paste, chat scrollback, or any data drop). Required.

## Procedure

1. Read every piece of the handed-over material end to end before proposing anything.
2. State the intent read from the data, in one line grounded in what the data actually shows.
3. Sketch briefly the next action on that intent.
4. Propose only to confirm: right, wrong, or adjust.
5. If two intents are plausible, propose the likelier and name the other in a clause. One intent per turn.

## Failure and recovery
- **Data too thin to propose from**: say so and stop. Do not fall back to asking.
- **Proposal without reading**: a guess; re-read the data before proposing.
- **User composes the ask from scratch**: the proposal was wrong or a question in disguise; redo the proposal grounded in the data.
- No mutation occurs on any path; rollback is trivial: nothing was changed.

## Output
A one-line intent proposal grounded in the data, a next-step sketch, and a confirm/correct/adjust prompt. No file, state, or remote change.

## Provenance

Origin: https://github.com/LilMGenius/paperthin, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317, path skills/depth/aim/SKILL.md. License MIT (c) 2026 LilMGenius; NOTICE vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. Clean-room adaptation: the proposal-not-question intent reflex and read-before-propose mechanism are re-expressed in ODIN 2.0 contract form; no verbatim vendor material is copied.
