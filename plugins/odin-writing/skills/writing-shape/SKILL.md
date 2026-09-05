---
name: writing-shape
description: 'Use when shaping a source document paragraph by paragraph without modifying it. Not for selected-beat assembly: use writing-beats. Not for fragment capture: use writing-fragments.'
---

# Writing shape

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A read-only pile needs paragraph-by-paragraph shaping. |
| Authority | Reversible local: writes only `<source_path>.shaped.md`; rollback is deleting that file, or version control when the artifact was already tracked. No remote mutation. |
| Side effect | Agreed paragraphs accumulated from the single in-memory read of the read-only pile; human approves each before it enters the output document. The source file is never modified. |
| Done | Coherent grounded document with explicit format choices and named gaps. |

## Inputs

The read-only pile: a file path to a document whose content the human wants shaped paragraph by paragraph.

## Procedure

1. Read the entire source file into memory as `pile`.
2. Split `pile` on double-newline boundaries into paragraphs in original order.
3. For each paragraph at index `i` in order:
   a. Propose the shaped version: one concrete format improvement per paragraph (reordering, condensing, clarifying, splitting, or preserving the original text verbatim).
   b. Present the proposal to the human for review and approval.
   c. If the human approves: add the approved shaped text to the in-memory output document.
   d. If the human rejects: add a named unsupported gap entry for paragraph `i` to the in-memory output document in the form `## Gap: paragraph-{i+1}\n[{rejection reason}]`.
4. Continue until no paragraphs remain at index `i`.
5. Write the in-memory output document to `<source_path>.shaped.md` once. Do not modify the original source file.
6. Assert the shaped document is coherent, every format choice is explicit, and every gap is named.

## Failure and recovery

- Unreadable source: the source file does not exist, is not valid UTF-8, or cannot be opened. Stop. Do not write. Return the failure.
- Human rejects paragraph: the human marks a paragraph as unsupported. Flag it as a named gap. Continue with the next paragraph. Partial result: the output contains all previously approved paragraphs plus the gap entry.
- Non-converged: paragraphs remain but the human declines to continue. Stop. Do not force-approve. Write the accumulated partial output document to `<source_path>.shaped.md` before returning it. Return the partial result with all approved paragraphs and a named gap for the current paragraph.

Rollback: delete `<source_path>.shaped.md`. Version control applies only if the artifact was already tracked.

## Output

`<source_path>.shaped.md`, approved paragraphs in original order with rejected paragraphs marked as named gaps; original source file unmodified.
