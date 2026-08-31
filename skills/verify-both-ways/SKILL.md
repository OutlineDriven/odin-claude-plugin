---
name: verify-both-ways
description: 'Use when a load-bearing claim is unverified, a plausible statement has never been checked, or the user says "fact-check this" or "verify this claim". Verify it in both directions and return a cited verdict for every claim. Don''t use for tasks that require source or remote-system changes.'
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

1. **Collect the claims.** Isolate every substantive, reality-grounded assertion in the supplied scope. Classify each as plausible, absurd, obvious, or novel.
2. **Verify direction A: "Could the absurd be real?"** Search external sources. If no authoritative source can be reached, produce a `flagged:no-source` verdict rather than an unverified assertion.
3. **Verify direction B: "Could the obvious be false?"** Search external sources. Check whether the obvious-sounding claim is contradicted, superseded, or was never established. If no source is reachable, produce a `flagged:no-source` verdict.
4. **Classify each verdict.**
   - `confirmed`: source supports the claim in both directions.
   - `corrected`: mechanically clear error; apply a cited fix.
   - `flagged-judgment-call`: legitimate ambiguity; surface and do not rewrite.
   - `flagged-no-source`: no source reached; assert nothing from intuition.
   - `flagged-deliberate-fiction`: intentionally non-factual; leave unchanged.
5. **Return the report.** For each claim: the claim text, the verdict, the source citation or flag reason, and which direction(s) it passed or failed.

## Failure and recovery
- **No source reachable.** Produce `flagged-no-source` for that direction. Do not assert the claim true or false.
- **Ambiguous result.** Produce `flagged-judgment-call`. Do not resolve it.
- **Claim is mechanically wrong.** Apply `corrected` with a cited fix; do not flag and move on.
- **Non-converged.** If any claim cannot be given a verdict in both directions, return the partial report with every unresolved claim listed as `incomplete`.

## Output
A per-claim report returned in chat. Each entry:
- `claim`: the original assertion.
- `verdict`: one of `confirmed`, `corrected`, `flagged-judgment-call`, `flagged-no-source`, `flagged-deliberate-fiction`, `incomplete`.
- `source`: URL or reference, or the flag reason.
- `direction-a`: pass/fail/flagged for "could the absurd be real".
- `direction-b`: pass/fail/flagged for "could the obvious be false".
- `correction` (if `corrected`): the cited fix.

If every claim is `confirmed` and no corrections apply, return a single `all-verified` summary and change nothing.

## Provenance

Origin: `skills/verify-both-ways` in the current ODIN skill tree.
Revision: current (no pinned SHA; tree version at time of authoring).
License: ODIN project-owned; no third-party expression copied.
Adaptation: restructured from `## Method` into the canonical five-section contract layout per the ODIN 2.0 authoring contract; procedure steps derived from source method bullets; all authority, side-effect, and done predicates restated from roster metadata.
