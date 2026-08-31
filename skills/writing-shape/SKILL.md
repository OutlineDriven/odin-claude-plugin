---
name: writing-shape
description: 'Use when shaping a source document paragraph by paragraph without modifying it. Produces an approved, grounded document with named gaps. Not for selected-beat assembly — use writing-beats; not for fragment capture — use writing-fragments.'
---

# Writing shape

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A read-only pile needs paragraph-by-paragraph shaping. |
| Authority | Reversible local writes only to named artifacts; recover via version control. |
| Side effect | Agreed paragraphs appended after re-read; human approves each before shaping is applied. |
| Done | Coherent grounded document with explicit format choices and gaps. |

## Inputs

The read-only pile: a file path to a document whose content the human wants shaped paragraph by paragraph.

## Procedure

1. Read the entire source file into memory as `pile`. Done when: the source file is read into `pile`.
2. Split `pile` on double-newline boundaries into paragraphs in original order. Done when: `pile` is split into an ordered paragraph list.
3. For each paragraph at index `i` in order:
   a. Propose the shaped version: one concrete format improvement per paragraph (reordering, condensing, clarifying, splitting, or preserving the original text verbatim).
   b. Present the proposal to the human for review and approval.
   c. If the human approves: append the approved shaped text to the output document.
   d. If the human rejects: append a named unsupported gap entry for paragraph `i` to the output document in the form `## Gap: paragraph-{i+1}\n[{rejection reason}]`.
   Done when: the paragraph is either approved and appended or rejected and recorded as a named gap.
4. Continue until no paragraphs remain at index `i`. Done when: every paragraph is processed.
5. Write the output document to a separate file at `<source_path>.shaped.md`. Do not modify the original source file. Done when: the shaped document is written to `<source_path>.shaped.md` and the original source is unmodified.
6. Assert the shaped document is coherent, every format choice is explicit, and every gap is named. Done when: the shaped document is coherent with explicit format choices and named gaps.

## Failure and recovery
- **Unreadable source**: the source file does not exist, is not valid UTF-8, or cannot be opened. Stop. Do not write. Return the failure.
- **Human rejects paragraph**: the human marks a paragraph as unsupported. Flag it as a named gap. Continue with the next paragraph. Partial result: the output contains all previously approved paragraphs plus the gap entry.
- **Non-converged**: paragraphs remain but the human declines to continue. Stop. Do not force-approve. Return the partial result with all approved paragraphs and a named gap for the current paragraph.

Rollback: version control. Do not commit unapproved or rejected paragraphs.

## Output
`<source_path>.shaped.md` — approved paragraphs in original order with rejected paragraphs marked as named gaps; original source file unmodified.
