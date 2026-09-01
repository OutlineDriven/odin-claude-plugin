---
name: verify-both-ways
description: 'Use when a load-bearing claim is unverified, a plausible statement has never been checked, the user says "fact-check this" or "verify this claim", or an artifact or sentence about to be written asserts something as plausible, absurd, novel, or impossible and doubt arises. Tests every claim in both directions (could the absurd be real? could the obvious be false?), cites sources, and returns a verdict per claim. Standalone-claim mode is read-only; artifact mode also corrects mechanically-clear local-artifact errors with a cited source and leaves deliberate fiction alone.'
---

# Verify both ways

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A load-bearing claim is unverified, a plausible statement has never been checked, the user says "fact-check this" or "verify this claim" (standalone-claim mode); or an artifact, passage, or sentence about to be written asserts something as plausible, absurd, novel, or impossible and doubt arises (artifact mode). |
| Authority | Standalone-claim mode: no file, VCS, credential, paid, published, deployed, or remote mutation; corrections are chat-only suggestions. Artifact mode: reversible local write to the artifact under review only; a fix is applied only when a mechanically-clear error is backed by a cited external source; never mutate sources, credentials, VCS, or remote state. |
| Side effect | Standalone-claim mode: cited corrections or flagged judgment calls are returned in chat; nothing changes when a passing check finds nothing. Artifact mode: cited fixes are written to the local artifact; judgment calls, source gaps, and deliberate fiction are flagged, not rewritten. |
| Done | Every checked claim carries a both-ways verdict with a source, and clear errors are corrected or flagged; artifact mode additionally reports fixes versus flags with the failure direction named for each failed claim. |

## Inputs

- Claims or artifact. Standalone-claim mode: the claim(s) supplied by the user; if no specific claim is named, self-scope to the most recent substantive assertion in the session. Artifact mode: the artifact under review — a file, a passage, or the sentence about to be written that may carry reality-grounded assertions; optional specific claim to check; when no specific claim is supplied, scan the whole supplied artifact including any sentence about to be written that is not yet on the page. Required.
- Source access. web_search and read tools. Required.
- Direction. Each claim is tested in two directions: (A) "Could the absurd-sounding claim be real?" and (B) "Could the obvious-sounding claim be false?" Required.

## Procedure

1. **Select mode.** If the user supplies an artifact, passage, or about-to-be-written sentence to check, enter artifact mode. If the user supplies standalone claim(s) or says "fact-check this" without an artifact, enter standalone-claim mode. **Done when:** the mode is determined.
2. **Collect the claims.** Isolate every reality-grounded assertion in the supplied scope, including small dates, counts, names, versions, and attributions. In artifact mode, scan the whole artifact including any sentence about to be written that is not yet on the page. Classify each assertion as plausible, absurd, obvious, or novel. Distinguish deliberate fiction ("in our world, boxes float" is a declared in-world choice) from real-world assertions; leave deliberate fiction alone. If it is unclear whether a claim is an in-world choice or a real-world assertion, flag it; do not fix it. **Done when:** every reality-grounded assertion is isolated and classified, and every fiction-vs-assertion ambiguity is flagged.
3. **Verify direction A: "Could the absurd be real?"** Search external sources. If no authoritative source can be reached, produce a `flagged-no-source` verdict rather than an unverified assertion. **Done when:** direction A has a verdict or `flagged-no-source` for each claim.
4. **Verify direction B: "Could the obvious be false?"** Search external sources. Check whether the obvious-sounding claim is contradicted, superseded, or was never established. If no source is reachable, produce a `flagged-no-source` verdict. **Done when:** direction B has a verdict or `flagged-no-source` for each claim.
5. **Classify each verdict.** `confirmed` if a source supports the claim in both directions; `corrected` if a mechanically clear error (wrong date, misattributed source, falsified number) is found — in artifact mode apply the cited fix to the local artifact, in standalone-claim mode return the correction as a chat-only suggestion; `flagged-judgment-call` if legitimate ambiguity exists (surface the competing readings, do not rewrite); `flagged-no-source` if no source is reached (assert nothing from intuition); `flagged-deliberate-fiction` if the claim is intentionally non-factual (leave unchanged). **Done when:** each claim has one verdict class, and in artifact mode every mechanically-clear error is fixed or flagged.
6. **Return the report.** For each claim, include the claim text, verdict, source citation or flag reason, and the direction(s) it passed or failed. In artifact mode, applied fixes appear as corrected text with their source; flagged claims appear with the reason and any competing readings. **Done when:** the report contains every claim with its verdict and sources.

## Failure and recovery
- No source reachable. Produce `flagged-no-source` for that direction. Do not assert the claim true or false.
- Ambiguous result. Produce `flagged-judgment-call` with the competing readings. Do not resolve it.
- Claim is mechanically wrong. In artifact mode, apply `corrected` with a cited fix to the local artifact; in standalone-claim mode, return the cited correction as a chat-only suggestion. A fix that cannot be backed by a cited source is not applied — the original text stands and the claim is flagged.
- Ambiguous fiction-vs-assertion. Flag rather than fix; the hardest call is left to the human.
- Non-converged. If any claim cannot be given a verdict in both directions, return the partial report with every unresolved claim listed as `incomplete`; never present an unchecked claim as verified.
- No assertions found. A scan that finds no reality-grounded assertions changes nothing and reports that fact.

## Output
A per-claim report with claim text, verdict, source or flag reason, direction-a and direction-b pass/fail/flagged status, and correction if applicable. In artifact mode, the report reads as fixes versus flags: applied fixes appear as corrected text with their source, flagged claims appear with the reason and competing readings. A scan that found no reality-grounded assertions returns that fact and changes nothing. When every claim is `confirmed` and no corrections apply, return a single `all-verified` summary.
