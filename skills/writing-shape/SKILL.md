---
name: writing-shape
description: 'Use when asked to shape a read-only document paragraph by paragraph. Produces a coherent grounded document with explicit format choices and named unsupported gaps. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Writing shape

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A read-only pile needs paragraph-by-paragraph shaping. |
| Authority | Reversible-local: write only named local artifacts; recover via version control. |
| Side effect | Agreed paragraphs appended after re-read; human approves each before shaping is applied. |
| Done | Coherent grounded document with explicit format choices and gaps. |

## Inputs

The read-only pile: a file path to a document whose content the human wants shaped paragraph by paragraph.

## Procedure

1. Read the entire source file into memory as `pile`.
2. Split `pile` on double-newline boundaries into paragraphs in original order.
3. For each paragraph at index `i` in order:
   a. Propose the shaped version: one concrete format improvement per paragraph (reordering, condensing, clarifying, splitting, or preserving the original text verbatim).
   b. Present the proposal to the human for review and approval.
   c. If the human approves: append the approved shaped text to the output document.
   d. If the human rejects: append a named unsupported gap entry for paragraph `i` to the output document in the form `## Gap: paragraph-{i+1}\n[{rejection reason}]`.
4. Continue until no paragraphs remain at index `i`.
5. Write the output document to a separate file at `<source_path>.shaped.md`. Do not modify the original source file.
6. Assert the shaped document is coherent, every format choice is explicit, and every gap is named.

## Failure and recovery
**Unreadable source.** Condition: the source file does not exist, is not valid UTF-8, or cannot be opened. Stop. Do not write. Return the failure.

**Human rejects paragraph.** Condition: the human marks a paragraph as unsupported. Flag it as a named gap. Continue with the next paragraph. Partial result: the output contains all previously approved paragraphs plus the gap entry.

**Non-converged.** Condition: paragraphs remain but the human declines to continue. Stop. Do not force-approve. Return the partial result with all approved paragraphs and a named gap for the current paragraph.

Rollback: version control. Do not commit unapproved or rejected paragraphs.

## Output
A shaped document file at `<source_path>.shaped.md` containing the approved paragraphs in original order, with rejected paragraphs marked as named gaps. The original read-only source file is not modified. Result: coherent grounded document with explicit format choices and gaps.

## Provenance

Origin: mattpocock/skills (mattpocock/skills, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76).
License: MIT (Copyright (c) 2026 Matt Pocock).
Adaptation: clean-room adaptation into odin-create; paragraph-by-paragraph shaping of a supplied read-only pile with named unsupported gaps retained as the core mechanism.
