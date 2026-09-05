---
name: substack-ghostwriting
description: 'Use when asked to ghostwrite Substack newsletters and web posts from structured intake. Not for tasks that require source or remote-system changes.'
---

# Substack ghostwriting

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User brings a Substack or newsletter content task. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. May fetch public web references. |
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

## Refusal

- Missing Phase-1 input: name only the missing fields and stop before drafting.
- Reference URL fails: keep claims supported by other supplied material. Name the failed URL. If it was the only support for the requested claim or voice, mark that part blocked.
- Voice evidence conflicts: preserve the common properties and list the conflict. Ask the user to select the governing sample when the conflict changes tone or point of view.
- Unsupported factual claim: draft the supported surrounding content. Insert `Gap: <claim>` with the missing evidence; never fabricate support.
- Content goal cannot be met: return any independently supported sections. State which part of the goal is unreachable and why.

## Procedure

1. **Complete Phase-1 intake.** Ask only for missing required fields. Do not draft with an unstated content goal, format, voice basis, source basis, or audience. Done when: every required field is stated.
2. **Establish the format rules inline.** For `substack`, prepare three subject lines of at most 60 characters, open with the reader-facing promise, keep one idea per section, use short paragraphs, and end with the promised takeaway. For `web-post`, prepare a title tag of at most 60 characters, a meta description of at most 155 characters, a clear opening claim, and descriptive section headings. For both, keep links descriptive, avoid unsupported urgency, and preserve factual qualifiers from the source material. Done when: format rules are recorded for the chosen format.
3. **Establish the voice model from evidence.** Record sentence length, formality, point of view, recurring vocabulary, heading style, and humor level. Reproduce those properties without copying distinctive source phrases or pretending to be a person the user did not authorize. Done when: voice properties are recorded and reproducible.
4. **Fetch every supplied public URL.** Extract only passages relevant to the content goal. Record the source URL beside each retained claim. Do not infer a fact from a failed fetch. Done when: every supplied URL is fetched or named as failed.
5. **Choose the outline.** Put the strongest supported reader value first. Order later sections by the dependency between ideas, not by the order of the notes. Done when: an outline is recorded.
6. **Draft the body from the source material.** Every factual claim must trace to supplied material or a fetched source. Mark an unsupported requested claim as a named gap instead of inventing support. Done when: every claim traces to a source or is marked as a gap.
7. **Place calls to action only when `cta_goal` exists.** Put the primary call after the reader has received the promised value; repeat it at the close only when the issue is long enough that the first call is no longer visible. Use the supplied link and wording constraints. Do not add engagement bait. Done when: CTA placement matches the rule or no CTA is placed when `cta_goal` is absent.
8. **Draft a one-to-three-sentence Notes teaser.** It must stand alone, reveal the concrete takeaway, and avoid promising material absent from the body. Done when: the teaser is drafted.
9. **When distribution channels are supplied, draft one post per channel.** Adapt the hook and length to the named channel; do not merely truncate the newsletter. Preserve the same factual claims and call to action. Done when: one companion post per requested channel is drafted.
10. **Run a final evidence pass.** Check: content goal achieved, format fields present, voice properties consistent, every factual claim supported, optional sections present only when requested, and no content added outside the stated audience and goal. Done when: every check passes.

## Output

Sections in order: subject-line options (substack) or SEO title+meta (web-post), formatted body, Notes teaser, one companion post per distribution channel, coverage notes listing unsupported gaps and failed references.
