---
name: fresh-reader-review
description: 'Use when asked to cold-read an artifact with fresh zero-context eyes and cut whatever a stranger cannot follow: dispatch a blind sub-session, compare its understanding against intent, and report defects by severity. Not for criteria-review of requirements docs — use doc-review.'
---

# Fresh reader review

Can a new reader understand the artifact without the context that produced it?

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks 'does this make sense to someone new' or 'cold-read this', or a README, document, skill, or PR description is about to ship. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | One isolated clean-room sub-session is dispatched; the verdict and ordered fixes return in chat and the artifact is never edited. |
| Done | A fresh sub-session, blind to the artifact's intent, returns a standalone verdict and ordered fixes. |

## Inputs

- **Artifact** (required): The file, document, or text to cold-read. Supplied inline as content, not as a repo path.
- **Intent note** (optional): A one-line private note on what the artifact is meant to be and who it is for. The reviewer never sees this.

## Procedure

1. **Pin the scope.** Identify the artifact in focus, or the set just produced. Privately note in one line what it is meant to be and who it is for; the reviewer never sees this. Done when: the artifact is identified and the intent is privately noted.
2. **Launch a fresh sub-session** with the artifact's contents inline, not a repo path. Instruct it: (a) do not open the project's README, docs, or neighbors; (b) read only what is provided inline; (c) diagnose, do not fix. Done when: the sub-session is dispatched with the artifact inline and isolation instructions.
3. **Ask it to perform a blind cold read** and report what it takes the artifact to be, what is unclear or assumed but unstated, and what it had to guess before it could act. Done when: the sub-session reports its understanding, unclear points, and guesses.
4. **Compare** its blind understanding against the intent noted in step 1. Every mismatch is a defect in the artifact. Done when: every mismatch is identified as a defect.
5. **Report the defects** and concrete fixes, ordered by how badly each blocks a fresh reader. A single cold read is one draw; for a high-visibility artifact, irreversible publish, or safety-critical content, escalate to multiple independent sub-sessions. Merge their defect lists, deduplicate overlaps, and report the consensus verdict. Done when: defects are ordered by severity with concrete fixes, or the verdict 'stands on its own' is returned with an empty fix list.

## Failure and recovery
- **Sub-session receives context it should not**: Abort. Re-dispatch with explicit instruction to read only the inline artifact and no surrounding files.
- **Artifact too large for one sub-session**: Split into independent segments. Each segment gets its own blind read. Merge defect lists, deduplicating overlaps.
- **Sub-session cannot determine artifact type**: Report this as a defect (the artifact fails to declare its own purpose). Continue with the cold read.
- **No defects found**: Return the verdict 'stands on its own' with an empty fix list. Do not invent defects to fill the report.
- **Empty artifact**: If the artifact contents are empty or missing, stop and return `blocked` with reason `empty-artifact`. No sub-session is spawned.

## Output
A report containing:
1. **Verdict**: one of 'stands on its own', 'minor gaps', or 'needs work'.
2. **Blind summary**: what the sub-session understood the artifact to be.
3. **Defect list**: ordered by severity, each with the specific passage and a concrete fix.

