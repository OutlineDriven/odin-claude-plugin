---
name: fresh-reader-review
description: 'Use when asked to cold-read an artifact with fresh zero-context eyes and cut whatever a stranger cannot follow. Not for criteria-review of requirements docs: use doc-review.'
---

# Fresh reader review

Can a new reader understand the artifact without the context that produced it?

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks 'does this make sense to someone new' or 'cold-read this', or a README, document, skill, or PR description is about to ship. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | One or more isolated clean-room sub-sessions are dispatched depending on artifact stakes and size; the verdict and ordered fixes return in chat and the artifact is never edited. |
| Done | Blind sub-sessions, each reading only the inline artifact with no surrounding context, return a standalone verdict and severity-ordered fixes. |

## Inputs

- Artifact (required): The file, document, or text to cold-read. Supplied inline as content, not as a repo path.
- Intent note (required): A one-line private note on what the artifact is meant to be and who it is for. The reviewer never sees this.

## Procedure

1. **Pin scope and private intent.** Identify the artifact in focus. Privately note in one line what it is meant to be and who it is for; the reviewer never sees this. Done when: the artifact is identified and the intent is privately noted.
2. **Segment the artifact if oversized.** If the artifact exceeds what one sub-session can hold in context, split it into independent segments at natural boundaries (sections, chapters, files). Each segment gets its own blind read in step 3. Done when: the artifact is either confirmed as a single read or split into segments with boundaries marked.
3. **Dispatch the required number of blind sub-sessions.** Each sub-session receives the artifact (or one segment) inline, not a repo path. Instruct every sub-session: (a) do not open the project's README, docs, or neighbors; (b) read only what is provided inline; (c) diagnose, do not fix. The number of sub-sessions is:
   - **One** for a standard artifact with normal visibility.
   - **Multiple independent** for a high-visibility artifact, irreversible publish, or safety-critical content. Use at least three; each gets the full artifact independently.
   - **One per segment** for an oversized artifact that was split in step 2. Each sub-session reads only its segment.
   Done when: the required sub-sessions are dispatched with the artifact inline and isolation instructions.
4. **Collect blind understanding.** Ask each sub-session to report what it takes the artifact to be, what is unclear or assumed but unstated, and what it had to guess before it could act. Done when: every sub-session reports its understanding, unclear points, and guesses.
5. **Compare blind understanding against intent.** For each sub-session, compare its blind understanding against the intent noted in step 1. Every mismatch is a defect in the artifact. Done when: every mismatch is identified as a defect.
6. **Merge, deduplicate, and order defects.** When multiple sub-sessions ran, merge their defect lists, deduplicate overlaps, and order by how badly each blocks a fresh reader. A defect reported by multiple independent sub-sessions ranks higher than one reported by a single sub-session. Done when: defects are ordered by severity with concrete fixes, or the verdict 'stands on its own' is returned with an empty fix list.

## Failure and recovery

- Context leaked: Abort the affected sub-session. Re-dispatch with explicit instruction to read only the inline artifact and no surrounding files.
- Empty artifact: If the artifact contents are empty or missing, stop and return `blocked` with reason `empty-artifact`. No sub-session is spawned.
- Sub-session cannot determine artifact type: Report this as a defect (the artifact fails to declare its own purpose). Continue with the cold read.
- No defects found: Return the verdict 'stands on its own' with an empty fix list. Do not invent defects to fill the report.

## Output

A report containing:
1. **Verdict**: one of 'stands on its own', 'minor gaps', or 'needs work'.
2. **Blind summary**: what the sub-session(s) understood the artifact to be.
3. **Defect list**: ordered by severity, each with the specific passage and a concrete fix. When multiple sub-sessions ran, note how many independently flagged each defect.
