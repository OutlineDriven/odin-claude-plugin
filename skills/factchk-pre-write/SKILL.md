---
name: factchk-pre-write
description: 'Use when an artifact or the sentence about to be written asserts something as plausible, absurd, novel, or impossible from intuition and metacognitive doubt arises before relying on a factual claim; verifies each reality-grounded assertion against external sources in both directions, fixes mechanically-clear errors with cited sources, flags judgment calls, and returns a fixes-vs-flags report with the failure direction named. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Factchk pre write

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

1. Scan the supplied artifact — and the sentence about to be written if one is in flight — for reality-grounded assertions: anything leaning on "this is plausible / realistic / absurd / novel / impossible because X." Include claims not yet on the page.
2. For each assertion, verify against external sources in both directions: could the "absurd" be real? could the "obvious" or "novel" be false or long-established?
3. Classify each verdict. A mechanically-clear error — a wrong date, a misattributed source, a falsified number — correct it in the local artifact with a cited source. A judgment call — a contested or interpretive claim — flag it; do not silently rewrite.
4. If an external source cannot be reached for a claim, flag it as unverifiable; never assert a verdict from intuition.
5. Distinguish deliberate fiction ("in our world, boxes float" is a declared in-world choice) from real-world assertions; leave deliberate fiction alone. When it is unclear whether a claim is an in-world choice or a real-world assertion, flag, do not fix.
6. If the scan finds no reality-grounded assertions, change nothing.

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
