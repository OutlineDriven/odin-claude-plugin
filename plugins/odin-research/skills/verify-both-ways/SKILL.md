---
name: verify-both-ways
description: 'Use when a claim needs checking both ways, "fact-check this", or an artifact or HTML document needs claims verified and corrected in place. Modes: claim, artifact. Not for measuring: use verify-this.'
---

# Verify both ways

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A load-bearing claim is unverified, a plausible statement has never been checked, or the user says "fact-check this" or "verify this claim" (claim mode); or an artifact, passage, HTML document, or sentence about to be written asserts something as plausible, absurd, novel, or impossible and doubt arises (artifact mode). |
| Authority | Reversible local: writes only the artifact under review in artifact mode; rollback is version control or undo, and a fix is applied only when a mechanically-clear error is backed by a cited source. Claim mode writes nothing. No remote mutation. |
| Side effect | Claim mode: cited corrections or flagged judgment calls are returned in chat; nothing changes when a passing check finds nothing. Artifact mode: cited fixes are written to the local artifact, and an HTML document also gets one appended verification summary; judgment calls, source gaps, and deliberate fiction are flagged, not rewritten. |
| Done | Every checked claim carries a both-ways verdict with a source, and clear errors are corrected or flagged; artifact mode also reports fixes versus flags with the failure direction named for each failed claim, and an HTML document keeps its element structure with the verification summary appended. |

## Inputs

- Mode. `claim` or `artifact`; when omitted, step 1 selects it from the input shape. Optional.
- Claims or artifact. Claim mode: the claim(s) supplied by the user; if no specific claim is named, self-scope to the most recent substantive assertion in the session. Artifact mode: the artifact under review, a file, a passage, an HTML document, or the sentence about to be written that may carry reality-grounded assertions; optional specific claim to check; when no specific claim is supplied, scan the whole supplied artifact. Required.
- Source access. web_search and read tools; in artifact mode, the citations already attached to claims in the artifact are retrieved first. Required.
- Direction. Each claim is tested in two directions: (A) "Could the absurd-sounding claim be real?" and (B) "Could the obvious-sounding claim be false?" Required.

## Procedure

1. **Select mode.** Mode claim: the user supplies standalone claim(s) or says "fact-check this" without an artifact. Mode artifact: the user supplies an artifact, passage, HTML document, or about-to-be-written sentence to check. **Done when:** the mode is determined.
2. **Collect the claims.** Isolate every reality-grounded assertion in the supplied scope, including small dates, counts, names, versions, and attributions. Classify each assertion as plausible, absurd, obvious, or novel. Distinguish deliberate fiction ("in our world, boxes float" is a declared in-world choice) from real-world assertions; leave deliberate fiction alone, and flag any claim whose fiction-vs-assertion status is unclear. Mode artifact: scan the whole artifact including any sentence about to be written that is not yet on the page; for an HTML document, record the element structure before mutation, extract assertions from paragraphs, list items, captions, table cells, and alternative text, and bind each assertion to its cited source or mark it uncited. **Done when:** every reality-grounded assertion is isolated and classified, every fiction-vs-assertion ambiguity is flagged, and in artifact mode each assertion is bound to a citation or marked uncited.
3. **Verify direction A: "Could the absurd be real?"** Search external sources; in artifact mode prefer the cited primary source. If no authoritative source can be reached, produce a `flagged-no-source` verdict rather than an unverified assertion; a failed retrieval is never permission to substitute a different claim. **Done when:** direction A has a verdict or `flagged-no-source` for each claim.
4. **Verify direction B: "Could the obvious be false?"** Search external sources. Check whether the obvious-sounding claim is contradicted, superseded, or was never established. If no source is reachable, produce a `flagged-no-source` verdict. **Done when:** direction B has a verdict or `flagged-no-source` for each claim.
5. **Classify each verdict.** `confirmed` if a source supports the claim in both directions; `corrected` if a mechanically clear error (wrong date, misattributed source, falsified number) is found; `flagged-unsupported` if the cited source does not support the claim and supplies no supported correction; `flagged-judgment-call` if legitimate ambiguity exists (surface the competing readings, do not rewrite); `flagged-no-source` if no source is reached (assert nothing from intuition); `flagged-deliberate-fiction` if the claim is intentionally non-factual (leave unchanged). **Done when:** each claim has one verdict class.
6. **Apply corrections.** Mode claim: return each `corrected` claim as a chat-only suggestion. Mode artifact: apply each cited fix to the local artifact and record the exact before and after text; never invent corrections for `flagged-unsupported` or `flagged-no-source` claims. For an HTML document, preserve surrounding structure, correct only the text nodes of `corrected` claims, append one HTML verification summary table listing every claim, citation, verdict, and correction with inserted text escaped for the target context, then validate that tags remain balanced and the pre-existing element and attribute structure is unchanged except for corrected text nodes and the appended summary; if validation fails, restore the recorded pre-mutation bytes. **Done when:** every `corrected` claim is fixed or suggested with before/after text recorded, and an HTML document passes structural validation or is restored.
7. **Return the report.** For each claim, include the claim text, verdict, source citation or flag reason, and the direction(s) it passed or failed. In artifact mode, applied fixes appear as corrected text with their source; flagged claims appear with the reason and any competing readings. **Done when:** the report contains every claim with its verdict and sources.

## Failure and recovery
- Artifact not found. In artifact mode, if a supplied artifact path does not resolve, return `document-not-found` without writing or guessing a path.
- No source reachable. Produce `flagged-no-source` for that claim and continue with independent claims. Do not assert the claim true or false.
- Ambiguous result. Produce `flagged-judgment-call` with the competing readings. Do not resolve it.
- Claim is mechanically wrong. In artifact mode, apply `corrected` with a cited fix to the local artifact; in claim mode, return the cited correction as a chat-only suggestion. A fix that cannot be backed by a cited source is not applied; the original text stands and the claim is flagged.
- Ambiguous fiction-vs-assertion. Flag rather than fix; the hardest call is left to the human.
- Structure corrupted. For an HTML document, restore the exact pre-mutation bytes and report the failed structural assertion.
- Non-converged. If any claim cannot be given a verdict in both directions, finish every claim whose evidence is available and list the rest as `incomplete`; never present an unchecked claim as verified.
- No assertions found. A scan that finds no reality-grounded assertions changes nothing and reports that fact.

## Output
A per-claim report with claim text, verdict, source or flag reason, direction-a and direction-b pass/fail/flagged status, and correction if applicable. In artifact mode, the report reads as fixes versus flags: applied fixes appear as corrected text with before/after text and their source, flagged claims appear with the reason and competing readings, and an HTML document report also names the structural-integrity result. `document-not-found` is returned when a supplied artifact path does not resolve. A scan that found no reality-grounded assertions returns that fact and changes nothing. When every claim is `confirmed` and no corrections apply, return a single `all-verified` summary.
