---
name: fresh-reader-review
description: 'Use when asked to cold-read an artifact with fresh zero-context eyes and cut whatever a stranger cannot follow, answering whether it stands alone. Use before shipping a README, document, skill, or PR description, or when the user asks "does this make sense to someone new" or "cold-read this". The read runs in a clean context with no access to the conversation that produced the artifact. For requirements documents, judge standalone clarity only and return a complete criteria-review brief without invoking another skill. Don''t use for tasks that require source or remote-system changes.'
---

# Fresh reader review

Step out of the session and let a clean mind read the artifact. Does it stand on its own?

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks 'does this make sense to someone new' or 'cold-read this', or a README, document, skill, or PR description is about to ship. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | One isolated clean-room sub-session is dispatched; the verdict and ordered fixes return in chat and the artifact is never edited. |
| Done | A standalone-ness verdict plus ordered fixes, produced by a fresh sub-session blind to the artifact's intent, is returned. |

## Inputs

- **Artifact** (required): The file, document, or text to cold-read. Supplied inline as content, not as a repo path.
- **Intent note** (optional): A one-line private note on what the artifact is meant to be and who it is for. The reviewer never sees this.

## Procedure

1. **Pin the scope.** Identify the artifact in focus, or the set just produced. Privately note in one line what it is meant to be and who it is for; the reviewer never sees this.
2. **Launch a fresh sub-session** with the artifact's contents inline, not a repo path. Instruct it: (a) do not open the project's README, docs, or neighbors; (b) read only what is provided inline; (c) diagnose, do not fix.
3. **Have it cold-read blind** and report: what it takes the artifact to be, what is unclear or assumed-but-unstated, what it had to guess to act.
4. **Compare** its blind understanding against the intent noted in step 1. Every mismatch is a defect in the artifact.
5. **Report the defects** and concrete fixes, ordered by how badly each blocks a fresh reader. A single cold read is one draw; escalate to multiple independent reads when the stakes justify it.

## Failure and recovery
- **Sub-session receives context it should not**: Abort. Re-dispatch with explicit instruction to read only the inline artifact and no surrounding files.
- **Artifact too large for one sub-session**: Split into independent segments. Each segment gets its own blind read. Merge defect lists, deduplicating overlaps.
- **Sub-session cannot determine artifact type**: Report this as a defect (the artifact fails to declare its own purpose). Continue with the cold read.
- **No defects found**: Return the verdict 'stands on its own' with an empty fix list. Do not invent defects to fill the report.

## Output
A report containing:
1. **Verdict**: one of 'stands on its own', 'minor gaps', or 'needs work'.
2. **Blind summary**: what the sub-session understood the artifact to be.
3. **Defect list**: ordered by severity, each with the specific passage and a concrete fix.

## Provenance

Origin: current ODIN skill tree. Adapted from `skills/shower/SKILL.md`. Project-owned; no third-party expression. License: project-owned.
