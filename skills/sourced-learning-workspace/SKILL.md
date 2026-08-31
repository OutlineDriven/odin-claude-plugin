---
name: sourced-learning-workspace
description: 'Use when multi-session learning needs a sourced workspace where every lesson cites a trusted source and advancement requires demonstrated retention. Not for general ongoing teaching — use teach. Don''t use for remote or irreversible changes.'
---

# Sourced learning workspace

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Multi-session learning needs a persistent sourced workspace. |
| Authority | Reversible local: files, VCS, and credentials scoped to the current working tree; no remote mutation. |
| Side effect | Mission, resources, glossary, lessons, and learning records. |
| Done | Each lesson yields one sourced win and future work follows demonstrated retention. |

## Inputs

- **Topic**: the subject to learn. Required.
- **Goal**: the concrete outcome the user wants. Required.
- **Prior knowledge**: what the user already knows. Optional.
- **Constraints**: time, budget, learning preferences. Optional.

## Refusal

- Corrupt workspace file: if `MISSION.md`, `RESOURCES.md`, `GLOSSARY.md`, any learning record, or any lesson file is corrupt (unreadable, malformed, or inconsistent with its own format), preserve the corrupt file as-is, quarantine it by renaming to `<filename>.corrupt-<timestamp>`, and return a blocker. Never recreate corrupt data from conversation context.
- Missing trusted source: if no high-quality source exists for a topic, stop and ask the user to provide a source or approve a lower-trust one. Do not proceed with parametric knowledge as the primary source.
- Unclear mission: if the user cannot articulate why they want to learn something, interview them further before writing anything. Do not proceed with a vague mission.
- Non-converged: if the user cannot demonstrate retention after two attempts at the same topic, review all learning records to identify the gap and return a blocker.

## Procedure

1. **Initialize workspace.** Create this structure at the cwd: `MISSION.md`, `RESOURCES.md`, `GLOSSARY.md`, `./learning-records/`, `./lessons/`, `./assets/`, `NOTES.md`. Treat the current directory as a teaching workspace. Never scatter workspace state outside this structure. Done when: the workspace structure exists.
2. **Interview user for mission.** Ask why they want to learn this topic. Push for concrete real-world outcomes, not abstract goals. Write `MISSION.md`:
   ```md
   # Mission: {Topic}

   ## Why
   {1-3 sentences. The concrete real-world goal the user is chasing.}

   ## Success looks like
   - {A specific, observable thing the user will be able to do}
   - {Another specific thing}

   ## Constraints
   - {Time, budget, prior commitments, learning preferences}

   ## Out of scope
   - {Adjacent topics explicitly excluded}
   ```
   Done when: `MISSION.md` is written with a concrete goal.
3. **Create RESOURCES.md.** Find high-quality, high-trust sources:
   ```md
   # {Topic} Resources

   ## Knowledge
   - [Source](url)
     What it covers and when to reach for it.

   ## Wisdom (Communities)
   - [Community](url)
     What it is good for.

   ## Gaps
   - {What is missing}
   ```
   Done when: `RESOURCES.md` is written with trusted sources.
4. **Create GLOSSARY.md.** Start empty. Add terms as the user demonstrates understanding:
   ```md
   # {Topic} Glossary

   ## Terms

   **Term**:
   Definition.
   _Avoid_: Aliases to avoid
   ```
   Done when: `GLOSSARY.md` exists (may be empty initially).
5. **Create shared stylesheet.** Write `./assets/style.css` as the first reusable component. Every lesson links it so the course looks coherent. Done when: `./assets/style.css` is written.
6. **For each lesson:**
   a. Read `MISSION.md`, `GLOSSARY.md`, and `./learning-records/` to determine the next topic in the user's zone of proximal development. Infer the most relevant next step from the mission.
   b. Find a trusted source for the topic. Cite it in the lesson.
   c. Create `./lessons/NNNN-<dash-case-name>.html`. It must deliver one sourced win: one tangible, source-cited outcome tied to the mission and in the user's zone of proximal development. Include clean typography, a link to the shared stylesheet, anchors to related lessons and reference documents, one primary source to read or watch, and a reminder to ask follow-up questions.
   d. Create `./learning-records/NNNN-<dash-case-name>.md`:
      ```md
      # {Short title}

      {1-3 sentences: what was learned and why it matters for future sessions.}
      ```
   e. Update `GLOSSARY.md` if new terms were understood. Add a term only when the user demonstrates they can use it correctly.
   f. Update `RESOURCES.md` if new sources were found. Prune sources that proved wrong or off-mission.
   g. Open the lesson file for the user with a CLI command when possible.
   Done when: one lesson and its learning record are written, and glossary/resources are updated.
7. **Retention check before advancing.** Before each new lesson, verify that the user demonstrated understanding of the prior lesson through an answered question, a completed exercise, or cited prior experience. Without demonstrated retention, adjust the zone of proximal development and revisit the gap before advancing. Done when: retention is demonstrated or the gap is identified for revisit.
8. **Record NOTES.md.** Track user preferences and anything that steers future sessions. Done when: `NOTES.md` is updated.

## Output

The persistent workspace: `MISSION.md` (reason for learning with concrete success criteria), `RESOURCES.md` (curated trusted sources), `GLOSSARY.md` (canonical terminology), `./learning-records/*.md` (one record per lesson), `./lessons/*.html` (one lesson per sourced win), `./assets/style.css` (reusable components), `NOTES.md` (user preferences and working notes).

## Provenance

- **Origin**: mattpocock/skills (https://github.com/mattpocock/skills)
- **Pinned revision**: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76
- **License**: MIT — Copyright (c) 2026 Matt Pocock
- **Obligation**: Retain the copyright and permission notice in root PROVENANCE.md.
- **Adaptation**: Adapted from mattpocock/skills productivity/teach into odin-research persistent sourced learning workspace. Matt's teach skill provides the three-layer philosophy (knowledge, skills, wisdom), the workspace file structure, the lesson format, and the four template formats (MISSION, RESOURCES, LEARNING-RECORD, GLOSSARY). This variant requires one sourced win per lesson and retention-based progression. Sourced wins and demonstrated retention are explicit gate conditions for advancing. Four FORMAT.md templates are incorporated inline rather than as separate support files. Obligor: project-owned.
