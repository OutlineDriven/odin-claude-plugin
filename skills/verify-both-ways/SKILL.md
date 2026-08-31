---
name: verify-both-ways
description: 'Use when a load-bearing claim is unverified, a plausible statement has never been checked, or the user says "fact-check this" or "verify this claim". Returns a cited both-ways verdict for every claim. Not for testing measurable claims with probes — use verify-this.'
---

# Verify both ways

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A load-bearing claim is unverified, a plausible statement has never been checked, or the user says "fact-check this" or "verify this claim". |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Cited corrections or flagged judgment calls are returned in chat; nothing changes when a passing check finds nothing. |
| Done | Every checked claim carries a both-ways verdict with a source, and clear errors are corrected or flagged. |

## Inputs

- **Claim(s) to verify.** Supplied by the user's request. If no specific claim is named, the skill self-scopes to the most recent substantive assertion in the session. Required.
- **Source access.** web_search and read tools. Required.
- **Direction.** Each claim is tested in two directions: (A) "Could the absurd-sounding claim be real?" and (B) "Could the obvious-sounding claim be false?" Required.

## Procedure

1. **Collect the claims.** Isolate every substantive, reality-grounded assertion in the supplied scope. Classify each as plausible, absurd, obvious, or novel. **Done when:** every assertion is isolated and classified.
2. **Verify direction A: "Could the absurd be real?"** Search external sources. If no authoritative source can be reached, produce a `flagged:no-source` verdict rather than an unverified assertion. **Done when:** direction A has a verdict or `flagged:no-source` for each claim.
3. **Verify direction B: "Could the obvious be false?"** Search external sources. Check whether the obvious-sounding claim is contradicted, superseded, or was never established. If no source is reachable, produce a `flagged:no-source` verdict. **Done when:** direction B has a verdict or `flagged:no-source` for each claim.
4. **Classify each verdict.** `confirmed` if source supports the claim in both directions; `corrected` if mechanically clear error (apply a cited fix); `flagged-judgment-call` if legitimate ambiguity (surface and do not rewrite); `flagged-no-source` if no source reached (assert nothing from intuition); `flagged-deliberate-fiction` if intentionally non-factual (leave unchanged). **Done when:** each claim has one verdict class.
5. **Return the report.** For each claim, include the claim text, verdict, source citation or flag reason, and the direction(s) it passed or failed. **Done when:** the report contains every claim with its verdict and sources.

## Failure and recovery
- **No source reachable.** Produce `flagged-no-source` for that direction. Do not assert the claim true or false.
- **Ambiguous result.** Produce `flagged-judgment-call`. Do not resolve it.
- **Claim is mechanically wrong.** Apply `corrected` with a cited fix; do not flag and move on.
- **Non-converged.** If any claim cannot be given a verdict in both directions, return the partial report with every unresolved claim listed as `incomplete`.

## Output
A per-claim report with claim text, verdict, source or flag reason, direction-a and direction-b pass/fail/flagged status, and correction if applicable; or a single `all-verified` summary when every claim is `confirmed` and no corrections apply.
