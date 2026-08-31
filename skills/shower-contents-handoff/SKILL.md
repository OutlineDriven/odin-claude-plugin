---
name: shower-contents-handoff
description: 'Use when fresh eyes are gone or a clean-room comprehension smoke test is needed before handoff, publish, or merge. Spawns a context-free sub-session that blind-reads the artifact and returns a verdict with defects ordered by severity. Not for self-cold-read — use shower.'
---

# Shower contents handoff

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Long session has worn away fresh eyes; before handoff/publish/merge; clean-room comprehension smoke test requested |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Spawns a context-free sub-session receiving only the artifact contents; read-only diagnosis. No state change to any external system. |
| Done | Read came from a fresh sub-session blind to author intent; verdict (stands alone / minor gaps / needs work) with defects ordered by reader-blockage. |

## Inputs

- **Artifact contents** (required): The full text of the artifact to be blind-read. Passed as contents, not as a file path.
- **Author intent notes** (optional): A brief statement of what the artifact is supposed to communicate. Used only for hidden-intent comparison; never forwarded to the sub-session.

## Procedure

1. Accept the artifact contents as a string. If contents are empty or missing, stop and return `blocked` with reason `empty-artifact`. Done when: the artifact contents are accepted or the empty-artifact block is returned.
2. Spawn a local sub-session that receives only the artifact contents. Do not forward the author intent notes, session history, file paths, project context, or any information beyond the artifact text itself. Done when: the sub-session is spawned with only the artifact contents.
3. Instruct the sub-session to read the artifact contents without searching for external context, related files, or supplementary documentation. The sub-session must evaluate only what is present in the supplied text. Done when: the sub-session is instructed to evaluate only the supplied text.
4. If author intent notes were supplied, compare the sub-session's comprehension against the hidden intent after the sub-session completes. Identify any gap between what the author intended and what a fresh reader would understand. Done when: the hidden-intent comparison is performed or skipped (no notes supplied).
5. Collect the sub-session's verdict. Classify it as `stands alone` (a fresh reader understands the artifact without external context), `minor gaps` (the artifact is usable but needs a small clarification), or `needs work` (one or more points block the reader). Order defects by how severely they block a fresh reader's comprehension. For a high-visibility artifact, irreversible publish, or safety-critical content, escalate to multiple independent sub-sessions. Merge their defect lists, deduplicate overlaps, and report the consensus verdict. Done when: the verdict is classified with defects ordered by severity.
6. If the sub-session cannot be spawned or returns an error, stop and return `blocked` with the error description. Do not retry with relaxed constraints or substitute a simulated read. Done when: the error is reported as `blocked` or the verdict is collected.

## Failure and recovery
- **Empty artifact**: Return `blocked` with reason `empty-artifact`. No sub-session is spawned.
- **Sub-session spawn failure**: Return `blocked` with the spawn error. No fallback or simulated read.
- **Sub-session error mid-read**: Return `blocked` with the sub-session error. Partial results from a failed sub-session are discarded.
- **Scope creep detected**: If the sub-session searches for external context despite instruction, terminate it and return `blocked` with reason `scope-creep`. Re-spawn only with tighter instructions.
- No rollback is needed because no state is mutated.

## Output
A report with: verdict (`stands alone` / `minor gaps` / `needs work`); defects ordered by reader-blockage severity (each naming the passage, what a fresh reader cannot resolve, and severity); hidden-intent gaps if author intent notes were supplied; and read metadata (sub-session identifier, whether intent comparison was performed).

## Provenance

Adapted from LilMGenius/paperthin `skills/depth/shower/SKILL.md` at revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. Licensed under MIT (c) 2026 LilMGenius. Clean-room adaptation; no verbatim third-party expression copied. The source NOTICE additionally vendors material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution, but the foundry does not copy that vendor material, so the per-source attribution obligation does not bind this adaptation. Retain the MIT copyright and permission notice for substantial reuse.
