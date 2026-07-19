---
name: writing-fragments
description: 'Use when the user wants to generate raw writing material before structuring it, has scattered ideas for an article, or says "collect fragments", "mine this topic", or "gather notes first".'
---

# Mine fragments

Treat this as **explore**: widen the space of what could be written without committing to structure. Committing is **exploit**, handled by `writing-shape` or `writing-beats`.

Run an `askme` **adversarial** session to relentlessly interview the user about whatever they want to write about. Imposing phases, outlines, or article structure is out of scope here.

As fragments emerge from either side of the conversation, append them to a single markdown file.

If the user did not pass a path, ask once where to save the document, then remember it for the rest of the session.

> **Restricted-write harness fallback:** the fragments file is written to the path the user chose, and an explicit `local://` output path is honored in any mode. When the harness blocks working-tree writes but exposes session-local artifacts (for example omp plan mode's `local://`), redirect the output to a named session-local draft such as `local://<title-slug>-fragments.md`, then re-read and append to that URI exactly as you would the file, and report the user's intended repo path separately in chat. Do not write any path metadata into the document itself; this skill's format forbids added metadata. The `local://` draft is a working draft, not persistence: never report it as saved to the user's path; it reaches that path only when a writes-allowed session materializes it there.

Capture fragments from the very first thing the user says, including the initial prompt.

On first write, put a single H1 at the top with a working title (it can change later) and nothing else: no metadata, no TOC, no date.

## What is a fragment

A **fragment** is any piece of text that might survive into the final article. It must be readable by the author (the author can tell what it means), but it does not need to define its terms or be comprehensible to a cold reader. The bar is "is this a piece of good writing?", not "is this a self-contained argument?".

Fragments are deliberately heterogeneous. Examples of what could count:

- A sharp sentence to deploy somewhere, location unknown.
- A claim with a one-line justification.
- A vignette: a thing that happened, a code snippet, a scenario, an analogy.
- A half-thought: "something about how X feels like Y, work this out later."
- A quote, a piece of dialogue, an overheard line.
- A list of related observations that hang together by feel.
- A complaint, a confession, a punchline.
- A **leading word**: a compact metaphor or coinage the whole piece can hang on (one term that names the idea, the way _tracer bullets_ or _fog of war_ names a whole pattern).

Of these, the leading word is the most valuable fragment to land. It is load-bearing: name the right one in explore and it shapes the structure, the transitions, and the title later, paying dividends through the entire exploit phase. When the conversation circles a recurring idea, push to coin a word for it.

The novelist's diary is the model: years of unstructured noticings that later get mined for raw material. Fragments are noticings.

## File format

```markdown
# Working title

A first fragment lives here.

It can be multiple paragraphs. It can include lists, code, quotes — whatever
shape the fragment naturally takes.

---

A second fragment.

---

> A quoted line that the user wants to keep around.

A reaction to it.

---

- A cluster of related observations
- That hang together by feel
- And want to be near each other
```

Separate fragments with a horizontal rule (`\n---\n`). No headings inside the body. No tags. No order beyond the order they were added.

## Writing rhythm

Append silently. Do not ask permission for each fragment. Mention what you added in passing ("adding that"), but do not interrupt the conversation with save dialogs.

Before every write: re-read the file from disk. The user may have edited, reordered, or deleted fragments between turns; preserve their changes. Never overwrite the file; only append, or edit a specific fragment in place if the user asks.

The user can say "cut the last one", "rewrite that one sharper", or "merge those two" at any time. Treat those as first-class instructions.
