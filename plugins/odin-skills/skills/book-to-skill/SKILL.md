---
name: book-to-skill
description: 'Use when the user names one book, course, paper, or source document and asks to distill it into a reusable skill. Not for a folder of sources: use map-corpus.'
---

# Book to skill

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user names one book, course, paper, or comparable single source document and asks to distill it into a reusable skill. |
| Authority | Reversible local: writes only the chosen target skill directory (SKILL.md and optional references/); rollback is deleting that directory. No remote mutation. No source file is mutated or copied wholesale. |
| Side effect | Creates files under the chosen target directory only; never copies the source document into the skill. |
| Done | A SKILL.md that parses as YAML, carries an attribution line, passes four validation checks, and routes correctly on at least two positive and two negative probe prompts. |

## Inputs

- The named source document, accessible as a file the agent can open. A document the agent cannot open stops the run.
- Optional: a write target directory, defaulting to `.claude/skills/<name>/`.
- A folder of multiple sources is out of scope; that belongs to corpus mapping, not this skill.

## Procedure

1. **Read the source.** List its chapters, top-level headings, or sections, whichever structure the document provides. Show one line per unit with its heading slug where one exists. Done when: an inventory covering every top-level unit is shown.
2. **Classify.** Ask whether three or more ordered actions can be named, each with a checkable done-state. Three or more is **procedure** (a sequence the agent can follow). Fewer is **reference** (distinctions and rules consulted on demand). If both are present, use a procedure spine with judgment material in `references/`. Done when: the classification is stated with the three actions named, or with the statement that fewer than three exist.
3. **Extract into four buckets.** Sort what you read into coined terms and leading words; constraints and prohibitions; procedures with their completion criteria; and deep material destined for `references/`. Done when: every inventoried unit has contributed to a bucket or is marked out of scope for the skill.
4. **Name it.** Kebab-case matching `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 64 characters, identical to the directory name. Done when: the name matches the directory to be written to.
5. **Write the frontmatter.** `description` at most 1024 characters, front-loaded, one trigger per genuinely distinct branch, phrased positively. Redirect rather than forbid: "for X, use skill Z" rather than "do not use for X". Done when: the `description` parses as single-quoted YAML and is within the limit.
6. **Write the body in the shape its classification selects.** Include one attribution line naming title, author, and year. Paraphrase throughout; quote only a coined term or named law where the exact phrasing is the idea. The two shapes:
   - Procedure shape:
     ```
     # {Skill name}
     {One-paragraph attribution: title, author, year.}
     ## When to use
     {One trigger per branch, positively phrased.}
     ## Steps
     1. {Action} — done when {checkable condition}
     2. {Action} — done when {checkable condition}
     ## Rules
     - {Constraint or guardrail}
     ```
   - Reference shape:
     ```
     # {Skill name}
     {One-paragraph attribution: title, author, year.}
     ## When to use
     {One trigger per branch, positively phrased.}
     ## Reference
     {Definitions, distinctions, or judgment material consulted on demand. No ordered steps.}
     ## Rules
     - {Constraint or guardrail}
     ```
   - A source with both gets the procedure shape with judgment material in `references/`. Every step ends on a checkable done condition; a reference shape carries no steps. The frontmatter `description` is the only place the trigger is worded for dispatch; the body restates the when as prose but does not re-word the trigger for dispatch. Done when: the body follows its shape and carries the attribution.
7. **Disclose.** Material only some branches reach moves to `references/<topic>.md`, linked one level deep from the body. Keep the body under 500 lines. Done when: branch-specific material lives behind a pointer and the body line count is under the cap.
8. **Validate.** Check four conditions: `name` equals the directory name; the frontmatter parses as YAML; `description` is within 1024 characters; every relative link resolves on disk. Run `yaml.safe_load` on the frontmatter and `test -f` on each link target. Done when: all four pass.
9. **Probe and place.** Author three to five probe prompts, at least two that must fire the skill and at least two out-of-scope prompts that must not, and run each in a subagent. Adjust the `description` until every probe lands correctly. Then ask for the write target, defaulting to `.claude/skills/<name>/`, and re-run step 8 there. Done when: probe results are reported and the checks are green at the target.

One skill per run; another source is another run. Paraphrase the source; do not paste it. The skill, not the book, is the source of truth when the skill runs; keep it runnable without the source in context.

## Failure and recovery
- Source unopenable. A file the agent cannot open stops the run; name the file. This skill owns no converter and does not invent content for a source it cannot read.
- Fewer than three ordered actions. Not a failure: classify as reference and proceed with the reference shape.
- Validation check fails. Fix the offending field or link and re-run step 8. Do not claim done while any check is red.
- Probe lands wrong. Adjust the `description` and re-probe. Never mark done with a misrouting probe; a wrong negative probe is as blocking as a wrong positive one.
- Partial result. If the run stops mid-procedure, the written files are incomplete. Either complete the procedure or delete the target directory as rollback. Do not leave a half-written skill that parses as valid.
- Rollback. Delete the target skill directory. No artifact outside that directory is touched, so deletion is a complete recovery.

## Output
A self-contained `SKILL.md` (and optional `references/<topic>.md`) under the chosen target directory, carrying an attribution line and passing all four validation checks and the probe set: the report states the classification, chosen name, target path, validation results, and probe results (positive and negative).
