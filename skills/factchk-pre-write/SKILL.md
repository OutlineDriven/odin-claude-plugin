---
name: factchk-pre-write
description: 'Use when an artifact or sentence about to be written asserts something as plausible, absurd, novel, or impossible and doubt arises: verify each assertion against external sources in both directions, fix clear errors, flag judgment calls, and return a fixes-vs-flags report.'
---

# Factchk pre-write

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An artifact or the sentence about to be written asserts something as plausible, absurd, novel, or impossible from intuition; metacognitive doubt before relying on a factual claim |
| Authority | Reversible local: correct mechanically-clear errors in the local artifact with a cited external source; flag judgment calls; never mutate sources, credentials, VCS, or remote state |
| Side effect | Local write to the artifact under review only; fixes are limited to mechanically-clear errors backed by a cited external source; deliberate fiction is left untouched |
| Done | Every verdict traces to a citable external source and the report reads as fixes-vs-flags with the failure direction named for each failed claim |

## Inputs

The artifact under review: a file, a passage, or the sentence about to be written that may carry reality-grounded assertions. Optional: a specific claim to check. When no specific claim is supplied, scan the whole supplied artifact, including any sentence about to be written that is not yet on the page.

## Procedure

1. Scan the supplied artifact and any sentence about to be written for reality-grounded assertions. Look for claims that depend on "this is plausible / realistic / absurd / novel / impossible because X." Include claims not yet on the page. Done when: every reality-grounded assertion in the artifact (including unwritten sentences) is identified.
2. For each assertion, verify against external sources in both directions: could the "absurd" be real? could the "obvious" or "novel" be false or long-established? Done when: every assertion is verified in both directions or flagged as unverifiable.
3. Classify each verdict. Correct a mechanically-clear error — a wrong date, a misattributed source, a falsified number — in the local artifact with a cited source. Flag a judgment call — a contested or interpretive claim — rather than silently rewriting it. Done when: every assertion has a verdict (verified, fixed, or flagged).
4. If an external source cannot be reached for a claim, flag it as unverifiable; never assert a verdict from intuition. Done when: every unreachable claim is flagged as unverifiable.
5. Distinguish deliberate fiction ("in our world, boxes float" is a declared in-world choice) from real-world assertions. Leave deliberate fiction alone. If it is unclear whether a claim is an in-world choice or a real-world assertion, flag it; do not fix it. Done when: every ambiguous fiction-vs-assertion case is flagged.
6. If the scan finds no reality-grounded assertions, change nothing. Done when: the scan is complete and either changes were made or no assertions were found.

## Failure and recovery
- Unreachable source: flag the claim as unverifiable; do not assert a verdict from intuition.
- Ambiguous fiction-vs-assertion: flag rather than fix; the hardest call is left to the human.
- Judgment call: flag with the competing readings; do not silently rewrite.
- Partial result: return every claim checked so far with its verdict or flag; never present an unchecked claim as verified.
- Non-mutation: a pass that finds nothing changes nothing; a fix that cannot be backed by a cited source is not applied — the original text stands and the claim is flagged.

## Output
A fixes-vs-flags report listing each reality-grounded claim, its verdict (verified / fixed / flagged), the cited external source, and — for a failed claim — which direction it failed (the absurd was real, or the obvious was false). Applied fixes appear as corrected text with their source. Flagged claims appear with the reason and any competing readings. A scan that found no reality-grounded assertions returns that fact and changes nothing.

## Provenance

Origin: github.com/LilMGenius/paperthin, skills/depth/factchk/SKILL.md. Pinned revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License MIT (c) 2026 LilMGenius; the source NOTICE additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution — this adaptation is clean-room and copies no verbatim vendor material. Adaptation: renamed to factchk-pre-write to expose the proactive about-to-write trigger, and restated the both-directions verification, fix-vs-flag split, and flag-when-unreachable rules as a self-contained procedure.
