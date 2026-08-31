---
name: rhythmic-taste
description: 'Use when a user wants to derive a hard creative constraint for section or layer rhythm from a disclosed random seed and five random Wikipedia titles. Not for judging an artifact''s taste — use taste.'
---

# Rhythmic taste

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a hard creative constraint for section/layer rhythm from a disclosed random seed and five random Wikipedia titles. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. A rhythm constraint for sections or layers, not used as factual authority. |
| Done | A rhythm constraint is derived from the disclosed random seed and five random Wikipedia titles. |

## Inputs

- **Random seed** (required): a number, word, or phrase the user discloses openly.
- **Five Wikipedia titles** (required): five article titles supplied by the user or fetched from Wikipedia's random endpoint. Exactly five; no substitutes.

## Procedure

1. Receive the random seed and five Wikipedia titles from the user.
2. Convert the seed to a deterministic numeric value (hash or ASCII sum). Use this value to select a permutation of the five titles and to choose a primary rhythm pattern from: alternating long-short, crescendo (short to long), decrescendo (long to short), syncopated (irregular gaps), or steady pulse.
3. For each title in the permuted order, measure its structural properties: syllable count, word count, presence of parenthetical or disambiguation suffixes, and whether the title names a person, place, concept, or event.
4. Map the measured properties to section or layer rhythm instructions: assign each title to a section, set relative length or density from the title's syllable count, and set pacing from the chosen rhythm pattern. Titles with parenthetical suffixes create nested or parenthetical sub-sections. Titles naming persons or events get higher narrative density; titles naming concepts or places get wider spacing.
5. Present the derived rhythm constraint as a structured list of section assignments with pacing, density, and nesting instructions. State explicitly that this constraint is a creative scaffold derived from random inputs, not a factual or authoritative source about the Wikipedia topics.

## Failure and recovery
- **Missing seed or titles**: request the missing input before proceeding. Do not substitute or generate defaults.
- **Fewer than five titles**: report the count mismatch and request the remainder. Do not pad with invented titles.
- **Derivation produces no usable constraint** (e.g., all titles collapse to identical structure): report the collision, present the raw measurements, and ask the user to supply replacement titles or a different seed.
- No partial results are accepted; the full five-title rhythm constraint is the minimum deliverable.

## Output
A structured rhythm constraint: an ordered list of five section or layer assignments, each with pacing direction, relative density, nesting rule, and the Wikipedia title that generated it. Preceded by the disclosed seed and the chosen rhythm pattern name. Followed by a one-line disclaimer that the constraint is a creative tool derived from random inputs, not factual authority on the Wikipedia topics.

## Provenance

Origin: curated idea `curated:curated-ideas:curated-063` from `project-owned:user-curated-skill-ideas`, supplemented by `project-owned:user-supplied-source-brief`. No pinned revision. No third-party license applies; this is a clean-room adaptation of a user-curated creative workflow. Project-owned.
