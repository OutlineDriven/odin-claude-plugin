---
name: changelog-updates
description: 'Use when a release or a since-tag window needs user-facing release communication drafted. Composes a draft release note covering exactly that window and advances the file-based since-tag marker once without publishing.'
---

# Changelog updates

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A release or a since-tag window needs user-facing release communication drafted |
| Authority | Reversible local writes only: create or update a draft release note and advance the file-based since-tag marker; no git tag, no publish, no release, no remote mutation |
| Side effect | Writes or updates one draft release note file and advances the since-tag state marker exactly once |
| Done | The draft covers exactly the since-tag window and the marker advanced once; publishing remains a separate human action |

## Inputs

- A repository with a file-based since-tag state marker (a local file identifying the last covered release boundary). Required.
- The current head reference or commit range to cover. Required.
- The set of user-facing changes since the marker (commits, merged PRs, or issues). Required; gathered from local history only.
- An optional audience or tone preference (e.g., developer-facing, end-user-facing). Optional; defaults to developer-facing.

## Procedure

1. Read the since-tag state marker and record the boundary it names. Do not mutate it yet. **Done when:** the boundary is read and recorded.
2. Compute the since-tag window as the range from that marker to the current head. If the marker is missing or ambiguous, stop and report the missing boundary. **Done when:** the window is computed from marker to head, or the missing boundary is reported.
3. Gather user-facing changes inside the window from local history only: commit messages, merged PR titles, and linked issues. Classify each as Added, Changed, Fixed, Deprecated, Removed, or Security. **Done when:** every change in the window is gathered and classified.
4. Compose a draft release note covering exactly the window: one section per non-empty category, one bullet per change, no entries outside the window, no forward-looking or invented items. **Done when:** the draft covers exactly the window with one section per non-empty category.
5. Write or update the draft release note file at the project's changelog location. If the location is unspecified, write to a draft file adjacent to the marker and report the chosen path. **Done when:** the draft is written to the changelog location and the path is reported.
6. Advance the file-based since-tag state marker exactly once to the current head so the next run starts from this boundary. Update the marker file contents to record the current head commit. Do not create a git tag, push, publish, or open a release. Done when: the marker file is advanced once to the current head.
7. Report the draft path, the window covered, the change count per category, and that publishing is a separate human action. **Done when:** the report is delivered with draft path, window, counts, and publishing notice.

## Failure and recovery
- Missing or ambiguous since-tag marker: stop before any write. Report the missing boundary. Do not guess a window or advance a marker that cannot be identified.
- Empty window (head equals marker): stop without writing. Report that there is nothing to draft since the last boundary.
- Conflicting or duplicate draft content for the same window: do not overwrite silently. Report the conflict and leave both the draft and marker unchanged.
- Partial draft written before a failure: leave the partial draft in place and do not advance the marker. Report the partial state and the unadvanced marker so the next run re-covers the full window.
- Swallowed error: never report the done predicate as satisfied when the marker did not advance or the window is incomplete.

## Output
One draft release note file covering exactly the since-tag window organized by change category, the since-tag state marker advanced once to the current head, and a report listing the draft path, the window covered, the change count per category, and an explicit statement that publishing remains a separate human action.
