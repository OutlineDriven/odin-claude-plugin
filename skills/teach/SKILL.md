---
name: teach
description: 'Use when the user wants ongoing teaching across sessions in a persistent workspace. Builds a mission, resources, lessons, learning records, glossary, and shared assets. Not for source-required lessons with retention gates — use sourced-learning-workspace.'
---

# Teach

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a course, a learning workspace, or ongoing teaching across sessions rather than a one-off explanation. |
| Authority | Reversible-local: writes only named local artifacts inside the teaching workspace at the working directory. |
| Side effect | Creates MISSION.md, RESOURCES.md, learning records, ./lessons, ./assets, ./reference, GLOSSARY.md, and NOTES.md inside the persistent teaching workspace. |
| Done | A grounded mission, a lesson authored to the learner's zone of proximal development, and curated resources exist in the workspace. |

## Inputs

- **Topic** (required): the subject the user wants to learn.
- **Learning goal** (required): the concrete outcome the user is chasing. If vague, interview them before writing MISSION.md.
- **Prior knowledge** (optional): what the user already knows. Record it as a learning record when disclosed.
- **Constraints** (optional): time, budget, learning preferences, prior commitments.

## Refusal

- Missing or vague mission: keep interviewing. Do not write MISSION.md until a concrete goal exists.
- No quality resources found: write a `## Gaps` section in RESOURCES.md. Search more broadly. Never fill gaps with parametric knowledge.
- Lesson drifts from mission: realign the lesson or update MISSION.md with user confirmation.
- Zone miscalibration: read learning records, adjust difficulty, write a new record capturing the calibration.
- Workspace already exists: read existing state (MISSION.md, learning records, glossary). Resume from where the learner left off. Never delete or overwrite existing user work.

## Procedure

1. **Interview the learner.** Ask why they want to learn this topic and what concrete outcome they are chasing. Push for specifics: "Run a half marathon by October" beats "get fitter." If the user cannot articulate why, keep interviewing before writing anything. Done when: a concrete outcome is stated.
2. **Create the workspace.** Set up the directory structure at the working directory: `MISSION.md`, `RESOURCES.md`, `./lessons/`, `./learning-records/` (create lazily on first record), `./reference/`, `./assets/`, `NOTES.md`. Done when: the workspace structure exists.
3. **Write MISSION.md.** Load `references/MISSION-FORMAT.md` and fill the template with the user's answers. One mission per workspace. Concrete over abstract. Push back on vagueness. Keep it short. Done when: `MISSION.md` is written with a concrete goal.
4. **Populate RESOURCES.md.** Find high-quality, high-trust resources for the topic. Never trust parametric knowledge as a primary source. Load `references/RESOURCES-FORMAT.md` and fill the template. Prefer primary sources, recognised experts, peer-reviewed work, and communities with strong moderation. Annotate every entry. Group by Knowledge / Wisdom. If no good resource exists for an area the mission needs, write a `## Gaps` section. Prune ruthlessly. Done when: `RESOURCES.md` is written with annotated trusted sources.
5. **Create the shared stylesheet.** Write a clean, readable CSS file to `./assets/style.css`. Use it in every lesson so the course stays visually consistent. Design it for readability and clean printing. Done when: `./assets/style.css` is written.
6. **Assess the zone of proximal development.** Read existing learning records (if any) and the mission. Determine what the learner knows and what they need next. If no records exist, start from the mission's prerequisites. Done when: the next topic is identified.
7. **Author the lesson.** Create one HTML file in `./lessons/` named `0001-<dash-case-name>.html`, incrementing the number for each new lesson. Each lesson teaches one tightly-scoped thing tied to the mission, includes clean typography, a link to the shared stylesheet, anchors to related lessons and reference documents, one primary source to read or watch, and a reminder to ask follow-up questions. Design for storage strength through desirable difficulty: retrieval practice, spacing, interleaving (for skills practice only). For quiz answers, keep every option the same length in words and characters when possible. Do not leak the answer through formatting. For knowledge acquisition, difficulty is the enemy because it consumes working memory. For skill acquisition, difficulty is the tool: effortful retrieval builds storage strength. Done when: one lesson HTML file is written.
8. **Maintain GLOSSARY.md.** Create at the workspace root when terminology accumulates. Load `references/GLOSSARY-FORMAT.md` and follow the template. Add a term only when the user understands it. Be opinionated: when several words exist for the same concept, pick the best and list the rest as aliases to avoid. Revise as understanding deepens: update in place, do not leave stale entries. Done when: `GLOSSARY.md` exists and follows the format.
9. **Write learning records.** Create records in `./learning-records/` named `0001-<slug>.md`, incrementing the number. Scan for the highest existing number and increment. Load `references/LEARNING-RECORD-FORMAT.md` and follow the template. Write a record when: the user demonstrated genuine understanding of something non-trivial, the user disclosed prior knowledge, a misconception was corrected, or the mission shifted. Do not write records for material merely covered, anything already in the glossary, or session activity logs. When a later record contradicts an earlier one, mark the old record `Status: superseded by LR-NNNN` rather than deleting it. Done when: one learning record is written.
10. **Create reference documents.** Build compressed reference materials in `./reference/` as HTML files: cheat sheets, algorithms, syntax, poses, glossaries. Design them for quick review and clean printing. Lessons are rarely revisited; reference documents are. Done when: reference documents are created as needed.
11. **Record notes.** Capture user preferences and anything that should steer future sessions in NOTES.md. Refer to it when designing lessons. Done when: `NOTES.md` is updated.
12. **Open the lesson.** Show the lesson file to the user with a CLI command when possible. Done when: the lesson file is opened.

## Failure modes

- Rollback: never delete a learning workspace. If the session fails or is interrupted, all written artifacts persist. Existing user work is preserved; learning records are only superseded, never removed. If MISSION.md changes, confirm with the user first and add a learning record documenting the shift.

## Output

The persistent teaching workspace at the working directory: `MISSION.md` (grounded reason for learning), `RESOURCES.md` (curated trusted sources with annotations), `./lessons/*.html` (self-contained interactive lessons), `./learning-records/*.md` (evidence of understanding and ZPD signal), `GLOSSARY.md` (compressed canonical terminology), `./reference/*.html` (compressed reference documents), `./assets/*` (reusable lesson components including the shared stylesheet), `NOTES.md` (user preferences and session steering notes).
