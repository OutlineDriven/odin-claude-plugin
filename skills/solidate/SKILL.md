---
name: solidate
description: 'Use when a user invokes this skill to harden a chosen but tentative artifact into one durable result. Resolves assumptions, names invariants, removes temporary choices, and verifies the stable end state. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Solidate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to harden a chosen but tentative artifact into one durable result. |
| Authority | Reversible local write only; no VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes the hardened artifact to its existing path; does not create, move, or delete files. |
| Done | The chosen artifact is hardened and its stable end state is verified. |

## Inputs

- **Artifact** (required): the tentative file path supplied by the user. Must exist on disk and be readable as text.
- **Assumptions** (required, user-supplied): the list of loose or unverified assumptions currently embedded in the artifact.
- **Invariants** (required, user-supplied): the list of named conditions that must hold true after hardening.
- **Temporary choices** (required, user-supplied): the list of placeholder or provisional decisions to be resolved and replaced.

No other skill, module, host instruction file, or planning artifact is required.

## Procedure

1. **Verify artifact existence.** Read the artifact path. If the file does not exist or is not readable, stop and report the failure class `artifact-not-found`. Done when: the artifact is read successfully, or `artifact-not-found` is reported and nothing is written.

2. **Parse assumptions, invariants, and temporary choices.** Confirm each input list is a non-empty collection of strings. If any list is empty or not a collection of strings, stop and report `invalid-inputs`. Done when: all three lists are non-empty collections of strings, or `invalid-inputs` is reported.

3. **Audit the artifact body.** Locate every assumption, every temporary choice, and every unnamed or implicit condition within the artifact text. Record the line ranges for each. Done when: every assumption, temporary choice, and implicit condition carries recorded line ranges.

4. **Resolve assumptions.** For each assumption, replace it with a verified statement or an explicit uncertainty marker (`[UNRESOLVED: <assumption> — must resolve before hardening]`). Do not invent evidence; use only what the user supplied or what is present in the artifact. Done when: each assumption is replaced by a verified statement or an explicit `[UNRESOLVED: ...]` marker, with no invented evidence.

5. **Name invariants.** Append or inline a `## Invariants` section listing each invariant with a one-line justification. If the artifact already contains an invariants section, merge the new list into it without duplication. Done when: every named invariant appears exactly once with a one-line justification.

6. **Remove temporary choices.** Replace each temporary choice with its resolved form. If the resolution is not provided, mark it as `[PLACEHOLDER: <choice> — supply resolution before finalizing]` and count it as unresolved. Done when: each temporary choice is replaced by its resolved form or a counted `[PLACEHOLDER: ...]` marker.

7. **Write the hardened artifact.** Overwrite the artifact path with the modified content. If write fails, stop and report `write-failed`. Done when: the artifact path holds the hardened content, or `write-failed` is reported with the original unchanged.

8. **Verify stable end state.** Re-read the written file. Confirm:
   - No `[UNRESOLVED` markers remain.
   - The `## Invariants` section exists and contains every named invariant.
   - No temporary choice markers remain.
   If any check fails, stop and report `end-state-unverified`. Done when: the re-read shows no `[UNRESOLVED` markers, a `## Invariants` section containing every named invariant, and no placeholder markers — or `end-state-unverified` names the failed checks.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `artifact-not-found` | Artifact path does not exist or is unreadable | Stop; do not write. |
| `invalid-inputs` | Assumptions, invariants, or temporary choices are empty or malformed | Stop; do not harden. |
| `write-failed` | Disk write fails after hardening | Stop; original artifact unchanged. |
| `end-state-unverified` | Unresolved markers, missing invariants, or remaining placeholders after write | Stop; do not claim done. Report which checks failed. |

Partial-result rule: if step 7 fails, the original artifact is not modified. No rollback is required because no mutation occurs on failure.

## Output
The hardened artifact is written back to its original path and the skill returns one confirmation line in fixed order: `Hardened: <artifact-path>`, assumptions resolved count, invariants named count, temporary choices resolved count, `End state verified: true`. On `end-state-unverified` it instead lists the failing checks and does not claim the done predicate.
