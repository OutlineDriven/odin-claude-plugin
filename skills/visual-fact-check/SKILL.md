---
name: visual-fact-check
description: 'Use when invoked as visual-fact-check with a document path. The skill verifies every factual claim against its cited sources, corrects errors in place, and appends a verification summary. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Visual fact check

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A document path, defaulting to the most recently modified HTML in the diagrams directory |
| Authority | Reversible, local mutations only. No remote resources mutated. |
| Side effect | Corrects factual errors in the target document in place; appends a verification summary of what was checked and changed |
| Done | Every verifiable claim classified verified, corrected, unsupported, or unverifiable; document structure preserved |

## Inputs

- **Document path** — an explicit document path or, when omitted, the most recently modified HTML file inside a `diagrams` directory below the working directory.
- **Cited sources** — the links, references, and source notes already attached to claims in the document.

## Procedure

1. Resolve the document path. If the caller did not supply one, select the most recently modified HTML file inside a `diagrams` directory below the working directory. If none exists, return `document-not-found` without writing.
2. Read the complete document and record its element structure before mutation.
3. Extract every factual assertion from paragraphs, list items, captions, table cells, and alternative text. Bind each assertion to its cited source or mark it uncited.
4. Retrieve each cited source with the available web search and read tools. Prefer the cited primary source. A failed retrieval is evidence of `unverifiable`, never permission to substitute a different claim.
5. Classify each assertion against the gathered evidence:
   - `verified` — the cited evidence supports the claim.
   - `corrected` — the cited evidence contradicts the claim and supplies a supported correction.
   - `unsupported` — the cited source does not support the claim.
   - `unverifiable` — the claim has no usable citation or its evidence cannot be retrieved.
6. Correct only claims classified `corrected`. Preserve surrounding structure and record the exact before and after text. Do not invent corrections for unsupported or unverifiable claims.
7. Append one HTML verification summary that lists every claim, citation, classification, and correction. Escape inserted text for the target context.
8. Validate that tags remain balanced and the pre-existing element and attribute structure is unchanged except for corrected text nodes and the appended summary. If validation fails, restore the preserved document bytes.

## Failure and recovery

- **document-not-found** — return blocked without creating or guessing a path.
- **source-unavailable** — classify only the affected claim as `unverifiable`; continue with independent claims.
- **structure-corrupted** — restore the exact pre-mutation document bytes and report the failed structural assertion.
- **partial result** — finish every claim whose cited evidence is available and list the remaining claims as unsupported or unverifiable. Never report them as verified.

## Output

The target document contains only evidence-backed factual corrections plus one verification summary. The returned report lists each claim, its citation, classification, before and after text when corrected, and the structural-integrity result.

## Provenance

Origin: `nicobailon/visual-explainer`, revision `7163c3e10660912e0b89e1af465db9f387282b88`, source path `plugins/visual-explainer/commands/fact-check.md`. License: MIT. This clean-room adaptation preserves the source mechanism of checking every document claim and correcting factual errors while embedding the executable procedure so runtime access to the source repository is unnecessary. The root provenance ledger retains the source notice.
