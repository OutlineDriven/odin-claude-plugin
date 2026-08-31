---
name: substack-ghostwriting
description: 'Use when asked to ghostwrite Substack newsletters and web posts from structured intake; delivers formatted drafts with subject lines, SEO metadata, Notes teasers, and optional social posts. Don''t use for tasks that require source or remote-system changes.'
---

# Substack ghostwriting

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User brings a Substack or newsletter content task. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. May fetch public web references. |
| Side effect | Fetches public references when supplied and returns drafted issue or post text in chat. |
| Done | A formatted issue or web post includes its subject or SEO fields, body, Notes teaser, and any requested distribution posts. |

## Inputs

Phase-1 intake is mandatory before drafting:

- `content_goal`: one sentence stating what the issue or post must achieve.
- `format`: `substack` or `web-post`.
- `author_voice`: a first-person voice guide, brand voice guide, public reference URLs, or representative sample text.
- `source_material`: facts, claims, links, notes, or an existing draft to incorporate.
- `audience`: geographic, professional, or interest-based description.
- `cta_goal` (optional): the action the reader should take, plus required link or wording.
- `distribution_channels` (optional): channels that need companion posts.

## Procedure

1. Complete Phase-1 intake. Ask only for missing required fields. Do not draft with an unstated content goal, format, voice basis, source basis, or audience.
2. Establish the format rules inline:
   - For `substack`, prepare three subject lines of at most 60 characters, open with the reader-facing promise, keep one idea per section, use short paragraphs, and end with the promised takeaway.
   - For `web-post`, prepare a title tag of at most 60 characters, a meta description of at most 155 characters, a clear opening claim, and descriptive section headings.
   - For both formats, keep links descriptive, avoid unsupported urgency, and preserve factual qualifiers from the source material.
3. Establish the voice model from evidence. Record sentence length, formality, point of view, recurring vocabulary, heading style, and humor level. Reproduce those properties without copying distinctive source phrases or pretending to be a person the user did not authorize.
4. Fetch every supplied public URL. Extract only passages relevant to the content goal. Record the source URL beside each retained claim. Do not infer a fact from a failed fetch.
5. Choose the outline. Put the strongest supported reader value first. Order later sections by the dependency between ideas, not by the order of the notes.
6. Draft the body from the source material. Every factual claim must trace to supplied material or a fetched source. Mark an unsupported requested claim as a named gap instead of inventing support.
7. Place calls to action only when `cta_goal` exists. Put the primary call after the reader has received the promised value; repeat it at the close only when the issue is long enough that the first call is no longer visible. Use the supplied link and wording constraints. Do not add engagement bait.
8. Draft a one-to-three-sentence Notes teaser. It must stand alone, reveal the concrete takeaway, and avoid promising material absent from the body.
9. When distribution channels are supplied, draft one post per channel. Adapt the hook and length to the named channel; do not merely truncate the newsletter. Preserve the same factual claims and call to action.
10. Run a final evidence pass: content goal achieved, format fields present, voice properties consistent, every factual claim supported, optional sections present only when requested, and no content added outside the stated audience and goal.

## Failure and recovery
| Failure class | Partial-result rule | Blocked or non-converged result |
|---|---|---|
| Missing Phase-1 input | None. | Name only the missing fields and stop before drafting. |
| Reference URL fails | Keep claims supported by other supplied material. | Name the failed URL. If it was the only support for the requested claim or voice, mark that part blocked. |
| Voice evidence conflicts | Preserve the common properties and list the conflict. | Ask the user to select the governing sample when the conflict changes tone or point of view. |
| Unsupported factual claim | Draft the supported surrounding content. | Insert `Gap: <claim>` with the missing evidence; never fabricate support. |
| Content goal cannot be met | Return any independently supported sections. | State which part of the goal is unreachable and why. |

## Output
Return sections in this order:

1. Three subject-line options for `substack`, or the SEO title and meta description for `web-post`.
2. The formatted body.
3. The Notes teaser.
4. One companion post per requested distribution channel.
5. Coverage notes listing unsupported gaps and failed references.

## Provenance

Origin: https://github.com/samber/cc-skills, revision f9953962e135235137628ea92d06ea085688031f. License: MIT. Adaptation: clean-room, self-contained reconstruction of mandatory Phase-1 intake, source-grounded voice matching, value-gated call-to-action placement, Notes teaser production, and channel-specific distribution drafting. Runtime dependencies: zero.
