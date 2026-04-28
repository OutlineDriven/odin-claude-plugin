# Per-task `GOALS.md` template (task-ephemeral)

This is the *task-ephemeral* counterpart to `AGENTS.md` (project-stable). Project invariants live in AGENTS.md; per-task success criteria live here, in `.agent-tasks/<task-id>/GOALS.md` (or whatever path the project chose; AGENTS.md cites the location).

## Architectural rule

- AGENTS.md never contains task-specific goals (would leak as project policy across sessions).
- This file never contains project-wide invariants (would duplicate per task and drift).
- After the task merges, this file (and its sibling `tests/` directory) is cleaned up.

## Template

```markdown
# Task <id>: <one-line goal>

## What success looks like (prose)

<2–4 sentences of plain-language goal. The reader who hasn't seen the issue should be able to tell when the task is done.>

## Verifiable goals (code)

The loop runs until every test in `tests/` passes. Each test corresponds to one acceptance criterion below.

| # | Criterion (prose)                                | Test                                         |
| - | ------------------------------------------------ | -------------------------------------------- |
| 1 | <criterion>                                       | `tests/test_<name>.py::test_<criterion>`     |
| 2 | <criterion>                                       | `tests/test_<name>.py::test_<criterion>`     |

## Out of scope

- <thing the task explicitly does not cover>
- <thing that would expand scope>

## Done criterion

- [ ] All tests in `tests/` pass.
- [ ] No new linter warnings.
- [ ] No new typechecker errors.
- [ ] AGENTS.md unchanged (this task does not modify project policy).
- [ ] (Optional) Manual sanity check by user before merge.

## Cleanup

After merge, delete `.agent-tasks/<id>/` entirely. The git history preserves the artifact; the working tree should not.
```

## When to write tests vs prose first

- **Prose first** — when the goal is conceptually unclear and the user needs to see it stated before committing to acceptance criteria. Loop structure: prose → discuss → tests stub → loop.
- **Tests first** — when the goal is mechanically clear and the only question is "do all the cases pass?" Loop structure: tests stub → run red → loop until green.

The skill's three-mode shape (interactive / template-driven / hybrid) maps to which path the user chooses at write time.

## Anti-patterns

- **AGENTS.md drift** — task-specific goals creeping into AGENTS.md across sessions. Detect via `git log AGENTS.md` showing per-task entries; if present, factor out to per-task GOALS.md.
- **Stale GOALS.md** — task merged but the file lingers. Cleanup is part of the merge, not a follow-up.
- **Prose-only goals** — writing the criterion in prose without a test makes the loop unverifiable. Always include the test column.
