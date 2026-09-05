# Project-type branches

Each branch produces the toolchain files appropriate to its type. The shared spine in
SKILL.md detects the project type and validates the done predicate with per-type checks;
this file holds the per-type setup steps.
## Single-file scripts (PEP 723)

- Add PEP 723 inline metadata header to the script file: start with `# /// script`, list top-level `requires-python = "..."` and `dependencies = [...]`, then close with `# ///`.
- Confirm the file is runnable with `uv run <script>`.
- Run `uvx ruff check <script>` to verify lint passes.

## New multi-file projects

- Run `uv init <name>` in the project root.
- Add dependencies with `uv add <pkg>` and dev tools with `uv add --group dev pytest ruff ty`.
- Verify with `uv run pytest`, `uv run ruff check .`, and `uv run ty check src/`.

## New reusable packages

- Ask whether to bootstrap with the Trail of Bits cookiecutter: `uvx cookiecutter gh:trailofbits/cookiecutter-python`. If yes, run it and skip to validation. If no, proceed.
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

## Migrations

### From requirements.txt

Run `uv init --bare`. Then pipe each non-comment, non-flag line of `requirements.txt` through `uv add` (inspect each package before adding). Run `uv sync`. Delete `requirements.txt`, `requirements-dev.txt`, and any `venv/` or `.venv/` directory. Confirm `uv.lock` is tracked in version control.

### From setup.py / setup.cfg

Run `uv init --bare`. Use `uv add` for each dependency from `install_requires`. Copy name, version, and description to `[project]`. Delete `setup.py`, `setup.cfg`, and `MANIFEST.in`.

### From flake8 + black + isort

Remove those tools via `uv remove flake8 black isort`. Delete `.flake8`, `[tool.black]`, and `[tool.isort]` config sections. Add ruff: `uv add --group dev ruff`. Run `uv run ruff check --fix .` and `uv run ruff format .`.

### From mypy / pyright

Remove those tools via `uv remove mypy pyright`. Delete `mypy.ini`, `pyrightconfig.json`, and legacy `[tool.mypy]`/`[tool.pyright]` sections. Add ty: `uv add --group dev ty`. Run `uv run ty check src/`.

### General

After migration, verify using the target project type's checks (only package projects use `make`).
