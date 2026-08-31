---
name: scaffold-exercises
description: 'Use when a course needs numbered problem, solution, and explainer scaffolds. Creates those files and validates them with the course linter. Not for a CLI or Next.js project scaffold — use scaffold-cli or scaffold-nextjs.'
---

# Scaffold exercises

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A course needs numbered problem, solution, and explainer scaffolds. |
| Authority | Write only to tracked section and exercise files/directories in the working directory. Revert with standard VCS. |
| Side effect | Creates or updates numbered section and exercise files and directories. |
| Done | Complete non-empty scaffold passes the course linter. |

## Inputs

Must be supplied:

- `section` — the section number as an integer (e.g. 1, 2, 3)
- `exercise` — the exercise number as a positive integer
- `type` — one of: `problem`, `solution`, `explainer`
- `base_path` — the directory under which sections and exercises live (must be a tracked VCS path)

## Procedure

1. Validate `section` is a non-negative integer. Validate `exercise` is a positive integer. Validate `type` is one of the three allowed values. Validate `base_path` is a non-empty string and points to a directory that exists and is tracked by the local VCS.
2. Compute the section subdirectory as `base_path/section-N` where N is the section number left-padded to two digits.
3. Compute the exercise file as `section_subdirectory/exercise-M.ext` where M is the exercise number left-padded to two digits, and the extension is `.md` for all three types.
4. For each target path that does not already exist, create the directory chain and an empty file at that path.
5. Populate the scaffold:
   - For `problem`: emit a level-2 heading `## Exercise N.N` where N.N is section.exercise, then a blank line, then a fenced code block with the language unspecified.
   - For `solution`: emit a level-2 heading `## Exercise N.N Solution`, then a blank line.
   - For `explainer`: emit a level-2 heading `## Exercise N.N Explained`, then a blank line.
6. Write the populated content to each target path. If any write fails, stop and report the failure.
7. Run the course linter against the target paths. If the linter reports an error, revert the writes from step 4–5 using VCS and report the linter failure.
8. Report the paths created or updated.

## Failure and recovery

- **Invalid input** — stop; do not write any file; report the validation failure.
- **Write failure** — stop; do not run the linter; report the write error.
- **Linter failure** — revert writes made in step 4–5 via VCS checkout of the original content; report the linter output and the revert.
- **No course linter present** — treat this as a linter failure and revert.

Partial-result rule: never produce an unvalidated scaffold on disk.
Rollback: any scaffold written before a linter pass must be reverted if the linter fails.

## Output
A JSON object: `scaffolded` (paths) and `linter` status on success; `error` (named failure class) and `detail` on failure.

## Provenance

Adaptation of `mattpocock/skills` `scaffold-exercises` (MIT, Copyright (c) 2026 Matt Pocock). Original: `mattpocock/skills` at `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. Paths: `skills/misc/scaffold-exercises/SKILL.md`, `skills/misc/scaffold-exercises/agents/openai.yaml`. Adaptation: scoped to numbered course scaffolds with mandatory course-linter gate before commit. License obligation: retain the copyright and permission notice in licenses/NOTICE.
