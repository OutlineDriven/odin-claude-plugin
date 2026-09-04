---
name: scaffold-exercises
description: 'Use when a course needs numbered problem, solution, and explainer scaffolds. Not for a CLI or Next.js project scaffold: use scaffold-cli or scaffold-nextjs.'
---

# Scaffold exercises

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A course needs numbered problem, solution, and explainer scaffolds. |
| Authority | Reversible local: writes only tracked section and exercise files/directories in the working directory; rollback is version control. No remote mutation. |
| Side effect | Creates or updates numbered section and exercise files and directories. |
| Done | A JSON object naming scaffolded paths and linter status, with no unvalidated scaffold left on disk. |

## Inputs

Must be supplied:

- `section`: the section number as a non-negative integer (e.g. 1, 2, 3)
- `exercise`: the exercise number as a positive integer
- `type`: one of: `problem`, `solution`, `explainer`
- `base_path`: the directory under which sections and exercises live (must be a tracked VCS path)

## Procedure

1. Validate inputs and `base_path`. Confirm `section` is a non-negative integer, `exercise` is a positive integer, `type` is one of the three allowed values, and `base_path` is a non-empty string pointing to a directory that exists and is tracked by the local VCS. Stop on any validation failure without writing. Done when: all inputs pass validation.

2. Compute the section subdirectory and a type-specific exercise filename. The section subdirectory is `base_path/section-N` where N is the section number left-padded to two digits. The exercise filename is `exercise-M-<type>.md` where M is the exercise number left-padded to two digits and `<type>` is the supplied type value. The three types produce distinct filenames (`exercise-M-problem.md`, `exercise-M-solution.md`, `exercise-M-explainer.md`) so they do not collide or overwrite each other. Done when: the subdirectory and filename are computed.

3. Create the directory chain and file. Create the section subdirectory if it does not exist. Create the exercise file at the computed path. Done when: the directory chain and file exist.

4. Populate the scaffold with the type-specific heading. For `problem`: emit `## Exercise N.N` where N.N is section.exercise, then a blank line, then a fenced code block with the language unspecified. For `solution`: emit `## Exercise N.N Solution`, then a blank line. For `explainer`: emit `## Exercise N.N Explained`, then a blank line. Write the populated content to the file. If the write fails, stop and report the failure. Done when: the file contains the type-specific heading and scaffold.

5. Discover the course linter command from the project manifest, configuration, or documentation, and run it against the target paths. Search for a linter command in `package.json` scripts, a linter config file, or project documentation. If no course linter is present, treat this as a linter failure. If the linter reports an error, delete newly created untracked files and revert tracked modifications via VCS. Done when: the linter passes, or the linter fails and all writes are reverted.

## Failure and recovery

- Invalid input: stop; do not write any file. Report the validation failure.
- Write failure: stop; do not run the linter. Report the write error.
- Linter failure: delete newly created untracked files and revert tracked modifications via VCS checkout. Report the linter output and the revert.
- No course linter present: treat as a linter failure. Delete newly created untracked files and revert tracked modifications. Report that no linter was found.
- Partial-result rule: never produce an unvalidated scaffold on disk. Any scaffold written before a linter pass must be reverted if the linter fails or is absent.

## Output

A JSON object: `scaffolded` (array of paths created) and `linter` (status: `pass` or `fail` with output) on success; `error` (named failure class) and `detail` on failure. No unvalidated scaffold remains on disk in any terminal state.
