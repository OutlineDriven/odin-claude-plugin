---
name: rhythmic-taste
description: 'Use when the user says "give this rhythm", "vary the structure", or "the sections all read the same". Derives a rhythm constraint from the document''s own sections or from a disclosed seed with random inputs. Not for judging an artifact''s overall taste — use taste.'
---

# Rhythmic taste

Vary structural rhythm and variation across a document's sections. The core is rhythm: the pattern of length, density, pacing, and nesting that keeps a reader moving, and the deliberate variation that keeps them awake. A document whose sections all read the same — same length, same shape, same cadence — flattens attention regardless of how good each section is.

Two modes: **document mode** (default) derives a rhythm constraint from the document's own sections, no external inputs required; and **seeded constraint mode** (optional) adds random variation from a disclosed seed and the user's chosen random inputs.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "give this rhythm", "vary the structure", "the sections all read the same", or asks for section or layer rhythm variation. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. A rhythm constraint for sections or layers, not used as factual authority. |
| Done | A rhythm constraint is derived and presented: in document mode, from the document's own sections; in seeded constraint mode, additionally from the disclosed seed and the user's chosen random inputs. |

## Inputs

- The document or section list (required in document mode): the sections, layers, or structural units to vary, supplied directly or read from the artifact in scope.
- Random seed (optional, required only for seeded constraint mode): a number, word, or phrase the user discloses openly.
- Random inputs (optional, required only for seeded constraint mode): titles, words, or items the user supplies or fetches from a random source. Any count the user chooses; no fixed minimum.

## Procedure — document mode (default)

1. Receive the document or section list. If sections are not supplied, derive them from the artifact's headings, layers, or structural breaks.
2. Measure each section's structural properties: relative length, sentence or paragraph density, pacing (tight to expansive), and nesting depth.
3. Diagnose the current rhythm: name the pattern the sections follow (steady pulse, monotone, crescendo, decrescendo, syncopated) and where variation is missing — which sections collapse to the same shape.
4. Choose a target rhythm pattern from: alternating long-short, crescendo (short to long), decrescendo (long to short), syncopated (irregular gaps), or steady pulse. Choose the pattern that serves the document's purpose, not the one closest to the current shape.
5. Map the target pattern to section assignments: set relative length or density per section, set pacing from the chosen pattern, and assign nesting where the content calls for sub-sections. Vary the assignments so no two adjacent sections collapse to identical structure.
6. Present the derived rhythm constraint as a structured list of section assignments with pacing, density, and nesting instructions, preceded by the diagnosed current rhythm and the chosen target pattern.

## Procedure — seeded constraint mode (optional)

Enter only when the user supplies a seed and asks for random variation. Run document mode steps 1–2 first, then:

1. Convert the seed to a deterministic numeric value (hash or ASCII sum). Use this value to select a permutation of the user's random inputs and to choose a primary rhythm pattern from the set in document mode step 4.
2. For each random input in the permuted order, measure its structural properties: syllable or word count, presence of parenthetical or disambiguation suffixes, and whether it names a person, place, concept, or event.
3. Map the measured properties to section or layer rhythm instructions: assign each input to a section, set relative length or density from its count, and set pacing from the chosen rhythm pattern. Inputs with parenthetical suffixes create nested or parenthetical sub-sections; inputs naming persons or events get higher narrative density; inputs naming concepts or places get wider spacing.
4. Present the derived rhythm constraint as a structured list of section assignments with pacing, density, and nesting instructions. State explicitly that the constraint is a creative scaffold derived from random inputs, not a factual or authoritative source about those inputs.

## Failure and recovery

| Failure | Recovery |
|---|---|
| No document or sections supplied and none derivable | Request the document or section list before proceeding. Do not invent sections. |
| Derivation produces no usable constraint (e.g., all sections collapse to identical structure and no variation is possible) | Report the collision, present the raw measurements, and ask the user to supply replacement sections or a different target pattern. |
| Seeded mode missing seed or random inputs | Request the missing input before proceeding. Do not substitute or generate defaults. |

No partial results are accepted; a complete rhythm constraint is the minimum deliverable.

## Output

A structured rhythm constraint: an ordered list of section or layer assignments, each with pacing direction, relative density, and nesting rule. Preceded by the diagnosed current rhythm and the chosen target pattern. In seeded constraint mode, also preceded by the disclosed seed and followed by a one-line disclaimer that the constraint is a creative tool derived from random inputs, not factual authority on those inputs.
