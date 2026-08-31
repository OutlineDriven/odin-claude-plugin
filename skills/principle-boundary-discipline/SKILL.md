---
name: principle-boundary-discipline
description: 'Use when asked to place validation and error handling. Validate once at trust boundaries so internal code remains lean; trust validated types inside. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle boundary discipline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Place validation and error handling. |
| Authority | Reversible local file edits only; work is discarded if the invariant cannot be established. |
| Side effect | Shapes guards and adapters at system boundaries; does not reshape the interior. |
| Done | Thin shell and trusted internal types. |

## Inputs

- **Codebase or module path** (required): the scope to audit.
- **Boundary rule** (optional, default: public API surface — HTTP handlers, command entry points, message handlers, I/O adapters): explicit boundary specification overrides the default.
- **Direction** (optional, default: bidirectional): `inbound` moves validation inward-to-boundary; `outbound` moves defensive checks boundary-to-outward.

## Procedure

1. **Identify boundaries.** Scan the target scope for trust boundaries: public API entry points, I/O adapters, external command handlers, message queue consumers. Each boundary is a seam between untrusted input and trusted internal types.
2. **Audit validation placement.** For each boundary:
   - Record where validation currently lives.
   - Classify each guard: `boundary` (at the seam), `interior` (inside the trusted surface), or `absent` (unvalidated data flowing through).
3. **Move absent or interior validation outward.** If an unvalidated data flow crosses a boundary, add a guard at the seam. If validation logic appears inside the trusted interior, extract it to the nearest boundary and replace the interior guard with a type assertion or trust of the already-validated value.
4. **Confirm thin shell.** After moving guards, verify the interior contains only value transformation, business logic, or composition — no input checking, no nil guards on data that originated outside, no defensive copies of already-validated structs.
5. **Keep validation cohesive.** Each boundary guard is a single, focused function or block; it validates one concern. Do not combine unrelated validation into one guard.
6. **Log changes.** Record each guard moved or added: original location, new location, and the data flow it protects.

## Failure and recovery
- **No identifiable boundary:** Stop. Report that the scope has no clear trust seam and the skill cannot proceed.
- **Validation cannot be extracted cleanly:** Stop. Report the specific guard that cannot be moved without breaking the interior's contract. Do not leave a partial guard.
- **Interior guard is malformed:** Report and skip. Do not silently absorb a broken guard.
- **Rollback:** If step 4 reveals the interior is not thin, revert all changes from this invocation.

## Output
A boundary audit report:
- List of boundaries identified.
- List of guards: each with `location`, `status` (`boundary`, `interior`, `absent`), and action taken.
- Verdict: `thin-shell-achieved` or `thin-shell-blocked` with reason.

## Provenance

- Origin: `cursor/plugins` pstack subtree (`pstack/skills/principle-boundary-discipline/SKILL.md`).
- Upstream revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`.
- License: MIT (`pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`; authored by Lauren Tan).
- Adaptation: Derived from the validate-once-at-boundaries principle; ODIN authority contract, failure taxonomy, and thin-shell invariant added; internal cross-skill references removed.
