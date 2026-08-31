---
name: teach
description: 'Use when the user wants to learn a skill or concept across multiple sessions in a persistent teaching workspace at the cwd. Builds MISSION.md, RESOURCES.md, lessons, learning records, a glossary, and shared assets from scratch. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

## Procedure

1. **Interview the learner.** Ask why they want to learn this topic and what concrete outcome they are chasing. Push for specifics: "Run a half marathon by October" beats "get fitter." If the user cannot articulate why, keep interviewing before writing anything. A bad mission is worse than no mission.

2. **Create the workspace.** Set up the directory structure at the working directory:
   - `MISSION.md` at the workspace root.
   - `RESOURCES.md` at the workspace root.
   - `./lessons/` directory for lesson HTML files.
   - `./learning-records/` directory (create lazily on first record).
   - `./reference/` directory for compressed reference documents.
   - `./assets/` directory for reusable lesson components.
   - `NOTES.md` at the workspace root.

3. **Write MISSION.md.** Use this format:

   ```md
   # Mission: {Topic}

   ## Why
   {1-3 sentences. The concrete real-world goal the user is chasing. What changes in their life or work when they have this skill? Avoid abstract framings like "to understand X" — push for the underlying outcome.}

   ## Success looks like
   - {A specific, observable thing the user will be able to do}
   - {Another specific thing}
   - {…}

   ## Constraints
   - {Time, budget, prior commitments, learning preferences, anything that bounds the approach}

   ## Out of scope
   - {Adjacent topics the user explicitly does not want to chase right now — protects the zone of proximal development}
   ```

   Rules: one mission per workspace. Concrete over abstract. Push back on vagueness. Keep it short. If MISSION.md runs past a screen, it has stopped being a compass and started being a plan.

4. **Populate RESOURCES.md.** Find high-quality, high-trust resources for the topic. Never trust parametric knowledge as a primary source. Use this format:

   ```md
   # {Topic} Resources

   ## Knowledge

   - [Book: _Title_ — Author](https://example.com)
     What it covers and when to reach for it.
   - [Article: "Title" — Author (Source)](https://example.com)
     What it covers and when to reach for it.

   ## Wisdom (Communities)

   - [r/subreddit](https://reddit.com/r/subreddit)
     What it is good for.
   ```

   Rules: high-trust only: prefer primary sources, recognised experts, peer-reviewed work, and communities with strong moderation. Annotate every entry with what it covers and when to reach for it. Group by Knowledge / Wisdom. If no good resource exists for an area the mission needs, write a `## Gaps` section listing what is missing. Prune ruthlessly: five sharp sources beat thirty mediocre ones. If the user has opted out of joining communities, note it here.

5. **Create the shared stylesheet.** Write a clean, readable CSS file to `./assets/style.css`. Every lesson links it so the course looks coherent. Design for readability and clean printing.

6. **Assess the zone of proximal development.** Read existing learning records (if any) and the mission. Determine what the learner knows and what they need next. If no records exist, start from the mission's prerequisites.

7. **Author the lesson.** Create one HTML file in `./lessons/` named `0001-<dash-case-name>.html`, incrementing the number for each new lesson. Each lesson:
   - Teaches one tightly-scoped thing tied to the mission.
   - Links the shared stylesheet from `./assets/style.css`.
   - Links to related lessons and reference documents via HTML anchors.
   - Includes interactive elements: quizzes, light in-browser tasks, or guided real-world steps.
   - Recommends one primary source for the user to read or watch.
   - Includes a reminder to ask follow-up questions.
   - Is self-contained: everything a learner needs lives inside the workspace. No external resource or other lesson required to use it.
   - Is beautiful: clean typography, readable layout, because the user will review it later.
   - Is short: learners' working memory is small. Each lesson gives one tangible win.

   Design for storage strength through desirable difficulty: retrieval practice (recall from memory), spacing (distribute practice over time), interleaving (mix related topics during skills practice only). For quiz answers, keep every option the same length in words and characters when possible. Do not leak the answer through formatting.

   For knowledge acquisition, difficulty is the enemy because it consumes working memory. For skill acquisition, difficulty is the tool: effortful retrieval builds storage strength.

8. **Maintain GLOSSARY.md.** Create at the workspace root when terminology accumulates. Use this format:

   ```md
   # {Topic} Glossary

   {One or two sentence description of the topic this glossary covers.}

   ## Terms

   **Term**:
   One or two sentence definition. Define what the term IS, not what it does.
   _Avoid_: synonym1, synonym2
   ```

   Rules: add a term only when the user understands it: the glossary is a record of compressed knowledge, not a dictionary the user reads to learn. Be opinionated: when several words exist for the same concept, pick the best and list the rest as aliases to avoid. Use the glossary's own terms inside definitions. Flag ambiguities explicitly. Revise as understanding deepens: update in place, do not leave stale entries.

9. **Write learning records.** Create records in `./learning-records/` named `0001-<slug>.md`, incrementing the number. Scan for the highest existing number and increment. Use this format:

   ```md
   # {Short title of what was learned or established}

   {1-3 sentences: what was learned (or what prior knowledge was established), and why it matters for future sessions.}
   ```

   Optional sections when they add genuine value: Status frontmatter (`active | superseded by LR-NNNN`), Evidence (how understanding was demonstrated), Implications (what this unlocks or rules out).

   Write a record when: the user demonstrated genuine understanding of something non-trivial, the user disclosed prior knowledge, a misconception was corrected, or the mission shifted. Do NOT write records for material merely covered, anything already in the glossary, or session activity logs.

   When a later record contradicts an earlier one, mark the old record `Status: superseded by LR-NNNN` rather than deleting it.

10. **Create reference documents.** Build compressed reference materials in `./reference/` as HTML files: cheat sheets, algorithms, syntax, poses, glossaries. Design them for quick review and clean printing. Lessons are rarely revisited; reference documents are.

11. **Record notes.** Capture user preferences and anything that should steer future sessions in NOTES.md. Refer to it when designing lessons.

12. **Open the lesson.** Show the lesson file to the user with a CLI command when possible.

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|---|
| Missing or vague mission | User cannot articulate why they want to learn this | Keep interviewing. Do not write MISSION.md until a concrete goal exists. |
| No quality resources found | RESOURCES.md has gaps or only low-trust sources | Write a `## Gaps` section in RESOURCES.md. Search more broadly. Never fill gaps with parametric knowledge. |
| Lesson drifts from mission | Lesson content does not trace back to MISSION.md | Realign the lesson or update MISSION.md with user confirmation. |
| Zone miscalibration | Lesson is too easy or too hard based on user feedback | Read learning records, adjust difficulty, write a new record capturing the calibration. |
| Workspace already exists | Working directory contains prior teaching artifacts | Read existing state (MISSION.md, learning records, glossary). Resume from where the learner left off. Never delete or overwrite existing user work. |

Rollback rule: never delete a learning workspace. If the session fails or is interrupted, all written artifacts persist. Existing user work is preserved; learning records are only superseded, never removed. If MISSION.md changes, confirm with the user first and add a learning record documenting the shift.

## Output
The persistent teaching workspace at the working directory containing:
- `MISSION.md` — the grounded reason for learning.
- `RESOURCES.md` — curated trusted sources with annotations.
- `./lessons/*.html` — self-contained interactive lessons.
- `./learning-records/*.md` — evidence of understanding and zone-of-proximal-development signal.
- `GLOSSARY.md` — compressed canonical terminology (created when terms accumulate).
- `./reference/*.html` — compressed reference documents for review.
- `./assets/*` — reusable lesson components including the shared stylesheet.
- `NOTES.md` — user preferences and session steering notes.

## Provenance

- Origin: current-odin-skill-tree, path `skills/teach/SKILL.md`.
- Revision: none pinned.
- License: project-owned.
- Adaptation: adapted from the ODIN teach skill. Reference format templates (MISSION-FORMAT, RESOURCES-FORMAT, LEARNING-RECORD-FORMAT, GLOSSARY-FORMAT) inlined into the procedure. Peer-skill routing table and cross-skill references removed to make the skill self-contained.
