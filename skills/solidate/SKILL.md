---
name: solidate
description: 'Use when a user invokes this skill to harden a chosen but tentative artifact into one durable result. The artifact is written back with resolved assumptions, named invariants, and removed temporary choices; its stable end state is verified before returning. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Verify artifact existence.** Read the artifact path. If the file does not exist or is not readable, stop and report the failure class `artifact-not-found`.

2. **Parse assumptions, invariants, and temporary choices.** Confirm each input list is a non-empty collection of strings. If any list is empty or not a collection of strings, stop and report `invalid-inputs`.

3. **Audit the artifact body.** Locate every assumption, every temporary choice, and every unnamed or implicit condition within the artifact text. Record the line ranges for each.

4. **Resolve assumptions.** For each assumption, replace it with a verified statement or an explicit uncertainty marker (`[UNRESOLVED: <assumption> — must resolve before hardening]`). Do not invent evidence; use only what the user supplied or what is present in the artifact.

5. **Name invariants.** Append or inline a `## Invariants` section listing each invariant with a one-line justification. If the artifact already contains an invariants section, merge the new list into it without duplication.

6. **Remove temporary choices.** Replace each temporary choice with its resolved form. If the resolution is not provided, mark it as `[PLACEHOLDER: <choice> — supply resolution before finalizing]` and count it as unresolved.

7. **Write the hardened artifact.** Overwrite the artifact path with the modified content. If write fails, stop and report `write-failed`.

8. **Verify stable end state.** Re-read the written file. Confirm:
   - No `[UNRESOLVED` markers remain.
   - The `## Invariants` section exists and contains every named invariant.
   - No temporary choice markers remain.
   If any check fails, stop and report `end-state-unverified`.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `artifact-not-found` | Artifact path does not exist or is unreadable | Stop; do not write. |
| `invalid-inputs` | Assumptions, invariants, or temporary choices are empty or malformed | Stop; do not harden. |
| `write-failed` | Disk write fails after hardening | Stop; original artifact unchanged. |
| `end-state-unverified` | Unresolved markers, missing invariants, or remaining placeholders after write | Stop; do not claim done. Report which checks failed. |

Partial-result rule: if step 7 fails, the original artifact is not modified. No rollback is required because no mutation occurs on failure.

## Output
The hardened artifact is written back to its original path. The skill returns a structured confirmation:

```
Hardened: <artifact-path>
Assumptions resolved: <count>
Invariants named: <count>
Temporary choices resolved: <count>
End state verified: true
```

If `end-state-unverified`, the output includes the specific failing checks and the skill does not claim the done predicate.

## Provenance

Origin: `curated:curated-ideas:curated-058` — local curated idea repository (`project-owned:user-curated-skill-ideas`, `project-owned:user-supplied-source-brief`). No revision pin, no third-party license.

Adaptation statement: this skill adapts the user-curated hardening workflow described in the curated idea. It restates D28 (resolve loose assumptions, name invariants, remove temporary choices, verify stable end state) as a bounded, reversible local procedure with named failure classes. Clean-room adaptation; no third-party expression copied.
