---
name: modern-python
description: 'Use when creating or migrating a Python project or script to uv, Ruff, ty, and pytest. Not for pushing to a remote or publishing: use new-branch-and-pr for that.'
---

# Modern Python

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create or migrate a Python project or script to uv, Ruff, ty, pytest, and current packaging conventions. |
| Authority | Reversible local: writes only local project files through init, add, remove, and sync; rollback is version control, and it commits or aborts but never pushes. No remote mutation. |
| Side effect | Local write to Python project metadata, dependency lock, tooling config, and source layout appropriate to the project type. |
| Done | The project uses one coherent modern toolchain and its lint, type, and test checks pass for the detected project type. |

## Inputs

Required: the project root (cwd or explicit path) and the project type (single-file script, multi-file project, reusable package, or migration from existing tooling).

Optional: existing `pyproject.toml`, `requirements.txt`, `setup.py`, `setup.cfg`, legacy config files, or a request to use the Trail of Bits cookiecutter template.

If the project type is not stated, ask before proceeding. Do not guess.

## Procedure

1. Detect project type. From user input, classify as: (a) single-file script with dependencies, (b) new multi-file project not for distribution, (c) new reusable package or library, or (d) migration from existing project. Confirm the classification with the user. Done when: exactly one project type is selected and confirmed.

2. Apply per-type setup. Follow `references/project-types.md` for the branch matching the detected type. Each branch produces the toolchain files appropriate to that type:
   - Single-file script: PEP 723 inline metadata header in the script file. No `pyproject.toml`, no `uv.lock`, no `src/` layout.
   - Multi-file project: `pyproject.toml`, `uv.lock`, tooling config.
   - Reusable package: `pyproject.toml`, `uv.lock`, `src/<name>/` layout, Makefile, tooling config.
   - Migration: converted `pyproject.toml`, `uv.lock`, tooling config; legacy files removed.
   Done when: the branch's setup steps complete and the type-appropriate files exist.

3. Configure toolchain and dependencies. Add dependencies with `uv add` and dev tools with `uv add --group dev`. For single-file scripts, dependencies are declared in the PEP 723 inline metadata header and resolved by `uv run`. Run `uv sync` for project and package types. Done when: dependencies are configured and the lock or inline metadata is current.

4. Validate the done predicate with checks appropriate to the project type:
   - Single-file script: `uv run python <script>` exits 0; `uv run ruff check <script>` exits 0.
   - Multi-file project: `uv run ruff check .` exits 0; `uv run ty check src/` exits 0; `uv run pytest` exits 0.
   - Reusable package: `make lint` exits 0; `make test` exits 0.
   - Migration: the target type's checks pass and no legacy config remains.
   Done when: every check for the detected type exits 0, or the failing check is identified and not marked done.

5. Report configured project state. State the project type, the toolchain files produced, the dependency groups, and the validation results. Done when: the report lists every artifact and every validation result.

## Failure and recovery

| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Project type cannot be determined | Stop before any mutation. | Ask the user to specify: single-file script, multi-file project, package, or migration. |
| `uv init` or `uv sync` fails | Leave `pyproject.toml` and `uv.lock` as-is; do not commit. | Inspect stderr. Fix the user-supplied input or dependencies. Re-run. If unrecoverable, stop. |
| Dependency import fails | The `uv.lock` may be stale. | Run `uv sync`. Re-run the failing command. |
| Tooling verification fails (lint, type, test) | Leave config and source files mutated; do not mark done. | Fix the reported issue; do not suppress it. |
| Migration leaves legacy files | Leave the project in a partially migrated state; do not mark done. | Remove identified legacy files manually; confirm the user approves before deletion. |

Rollback: `git checkout -- .` restores pre-mutation state. Do not push partial migrations.

## Output

A configured Python project with the toolchain files appropriate to its type, ordered by the procedure steps that produced them. The done predicate holds only when the type-appropriate lint, type, and test checks all exit 0.
