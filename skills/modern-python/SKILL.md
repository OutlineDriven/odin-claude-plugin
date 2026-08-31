---
name: modern-python
description: 'Use when a user wants to create or migrate a Python project or script to uv, Ruff, ty, pytest, and current packaging conventions. Not for pushing to a remote or publishing — use new-branch-and-pr for that.'
---

# Modern Python

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create or migrate a Python project or script to uv, Ruff, ty, pytest, prek, and current packaging conventions. |
| Authority | reversible-local: init bare, add, remove, and sync; create, delete, and rewrite local project files only; commit or abort but never push. |
| Side effect | Local write to Python project metadata (`pyproject.toml`), dependency lock (`uv.lock`), tooling config, and source layout under `./src/`. |
| Done | The project uses one coherent modern toolchain and its dependency sync, lint, type, test, audit, and build commands fit the project type. |

## Inputs

- **Required**: The user must supply the project root (cwd or explicit path). The user must state whether the goal is a single-file script, a multi-file project, a reusable package/library, or migration from existing tooling.
- **Optional**: Existing `pyproject.toml`, `requirements.txt`, `setup.py`, `setup.cfg`, legacy config files, or a request to use the Trail of Bits cookiecutter template.

## Procedure

1. **Detect project type.** From user input, classify as: (a) single-file script with dependencies, (b) new multi-file project not for distribution, (c) new reusable package/library, or (d) migration from existing project. Done when: exactly one project type is selected and the user confirms it.
2. **Apply the per-type setup.** Follow `references/project-types.md` for the branch matching the detected type. Each branch produces a working `pyproject.toml`, `uv.lock`, and tooling config. Done when: the branch's setup steps complete and the project files exist.
3. **Validate the done predicate.** Confirm: `uv run ruff check .` exits 0; `uv run ty check src/` exits 0; `uv run pytest` exits 0; and the Makefile targets execute correctly for the project type. Done when: every check exits 0 or the failing check is identified and not marked done.

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

A configured Python project with `pyproject.toml`, `uv.lock`, tooling config, and source layout — ordered by the procedure steps that produced them. The done predicate holds only when lint, type, and test all exit 0.

## Provenance

- **Origin**: Trail of Bits skills repository, `plugins/modern-python/skills/modern-python/SKILL.md`.
- **Pinned revision**: `d1f1575cff97816e5cc08af66cd2506099c681d3`.
- **License**: CC-BY-SA-4.0. Trail of Bits attribution and source link preserved; modifications marked; adaptations ShareAlike; no trademark rights claimed.
- **Adaptation**: Clean-room rewrite for ODIN 2.0 skill format. Per-type setup detail moved to `references/project-types.md` per I3 branching disclosure. No third-party expression copied verbatim.
