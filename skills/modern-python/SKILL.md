---
name: modern-python
description: 'Use when a user wants to create or migrate a Python project or script to uv, Ruff, ty, pytest, and current packaging conventions. Result: one coherent modern toolchain with sync, lint, type, test, audit, and build commands that fit the project type. Don''t use for pushing to a remote, publishing, or changes outside local Python project files and tooling config.'
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

1. **Detect project type.** From user input, classify as: (a) single-file script with dependencies, (b) new multi-file project not for distribution, (c) new reusable package/library, or (d) migration from existing project.

2. **For single-file scripts (PEP 723):**
   - Add PEP 723 inline metadata header to the script file: `# /// - projdeps`, then `# ///`, then a `[[project]]` or `[project]` table with name, version, requires-python, and dependencies.
   - Confirm the file is runnable with `uv run python <script>`.

3. **For new multi-file projects:**
   - Run `uv init <name>` in the project root.
   - Add dependencies with `uv add <pkg>` and dev tools with `uv add --group dev pytest ruff ty`.
   - Verify with `uv run pytest` and `uv run ruff check .`.

4. **For new reusable packages:**
   - Ask whether to bootstrap with the Trail of Bits cookiecutter: `uvx cookiecutter gh:trailofbits/cookiecutter-python`. If yes, run it and skip to step 6. If no, proceed to step 4b.
   - Run `uv init --package <name>` in the project root. This creates `pyproject.toml`, `README.md`, `src/<name>/`, and `.python-version`.
   - Write a `pyproject.toml` with these required sections:
     ```toml
     [project]
     requires-python = ">=3.11"
     dependencies = []

     [dependency-groups]
     lint = ["ruff", "ty"]
     test = ["pytest", "pytest-cov"]
     audit = ["pip-audit"]

     [tool.ruff]
     line-length = 100
     target-version = "py311"

     [tool.ruff.lint]
     select = ["ALL"]
     ignore = ["D", "COM812", "ISC001"]

     [tool.pytest.ini_options]
     addopts = ["--cov=src/<name>", "--cov-fail-under=80"]

     [tool.ty.environment]
     python-version = "3.11"
     ```
   - Run `uv sync --all-groups` to install all dependency groups.
   - Write a `Makefile` with `.PHONY` targets `dev`, `lint`, `format`, `test`, and `build`:
     ```makefile
     .PHONY: dev lint format test build

     dev:
     	uv sync --all-groups

     lint:
     	uv run ruff format --check && uv run ruff check && uv run ty check src/

     format:
     	uv run ruff format .

     test:
     	uv run pytest

     build:
     	uv build
     ```
   - Verify with `make test` and `make lint`.

5. **For migrations:**
   - **From requirements.txt**: Run `uv init --bare`. Then pipe each non-comment, non-flag line of `requirements.txt` through `uv add` (inspect each package before adding). Run `uv sync`. Delete `requirements.txt`, `requirements-dev.txt`, and any `venv/` or `.venv/` directory. Confirm `uv.lock` is tracked in version control.
   - **From setup.py / setup.cfg**: Run `uv init --bare`. Use `uv add` for each dependency from `install_requires`. Copy name, version, and description to `[project]`. Delete `setup.py`, `setup.cfg`, and `MANIFEST.in`.
   - **From flake8 + black + isort**: Remove those tools via `uv remove`. Delete `.flake8`, `[tool.black]`, and `[tool.isort]` config sections. Add ruff: `uv add --group dev ruff`. Run `uv run ruff check --fix .` and `uv run ruff format .`.
   - **From mypy / pyright**: Remove those tools via `uv remove`. Delete `mypy.ini`, `pyrightconfig.json`, and legacy `[tool.mypy]`/`[tool.pyright]` sections. Add ty: `uv add --group dev ty`. Run `uv run ty check src/`.
   - **General**: After migration, verify with `make test` and `make lint`.

6. **Validate the done predicate.** Confirm: `uv run ruff check .` exits 0; `uv run ty check src/` exits 0; `uv run pytest` exits 0; and the Makefile targets execute correctly for the project type.

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
A configured Python project (or migrated existing project) with:
- `pyproject.toml` with `[project]`, `[dependency-groups]`, `[tool.ruff]`, `[tool.ruff.lint]`, `[tool.pytest.ini_options]`, and optionally `[tool.ty.*]` sections.
- `uv.lock` present and committed.
- A `Makefile` with `dev`, `lint`, `format`, `test`, and `build` targets.
- For packages: `src/<name>/` layout and a `Makefile` whose `lint` target includes `ty check src/`.
- A `Makefile` whose `lint` target for scripts or simple projects excludes `ty check src/`.

## Provenance

- **Origin**: Trail of Bits skills repository, `plugins/modern-python/skills/modern-python/SKILL.md`.
- **Revision**: `d1f1575cff97816e5cc08af66cd2506099c681d3`.
- **License**: CC-BY-SA-4.0. Adapted from the Trail of Bits modern-python skill. Attribution preserved; source link preserved; ShareAlike applied to adaptations; no trademark rights claimed; trail-of-bits-mark.svg not used as branding.
- **Adaptation**: Normalized to ODIN 2.0 SKILL.md literal schema. Decision tree and anti-pattern table merged into executable procedure. References converted to inline content. Migration decision tree made explicit. Makefile targets scoped to project type.
