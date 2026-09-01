---
name: devcontainer-setup
description: 'Use when adding a new devcontainer or isolated Claude Code dev environment to a repo that lacks one, for Python, Node/TypeScript, Rust, Go, or a combination. Not for editing an existing devcontainer. No remote, credential, publish, deploy, or irreversible changes.'
---

# Devcontainer setup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to add a new devcontainer or isolated Claude Code development environment to a repository that does not already have one, for Python, Node/TypeScript, Rust, Go, or a supported combination. |
| Authority | Reversible local writes confined to the repository's `.devcontainer/` directory. No container is built, launched, published, or pushed. |
| Side effect | Creates or replaces the five generated files under `.devcontainer` (Dockerfile, devcontainer.json, post_install.py, .zshrc, and install.sh) with project substitutions and merged language-specific features, settings, extensions, commands, and persistent-volume declarations. |
| Done | All template placeholders are resolved; devcontainer.json is valid; every detected language is represented without duplicate configuration; postCreateCommand composes all required setup commands; the security mounts and token-forwarding contract are explicit; and the user receives both VS Code and CLI startup instructions without claiming the container was built or launched unless it was. |

## Inputs

Required: the repository root to scan for language manifests and to write `.devcontainer/`.

Optional, supplied by the user when known: a human-readable project name (otherwise inferred), a preferred Python version (otherwise the default from the base template), and a package manager choice for Node/TypeScript (otherwise detected from the lockfile).

## Procedure

1. **Reject modification requests.** If `.devcontainer/` already exists, stop: this skill only adds a new devcontainer. Direct the user to edit the existing configuration. Do not trigger for general Docker, production container, or container lifecycle questions. **Done when:** the skill confirms `.devcontainer/` is absent, or stops and directs the user to edit the existing config.

2. **Infer project name and slug.** Probe in order and use the first match: `package.json` `name` field, `pyproject.toml` `project.name`, `Cargo.toml` `package.name`, `go.mod` module path (last segment after `/`), then the repository directory name as fallback. Derive the slug by lowercasing and replacing spaces and the underscore with hyphens. Keep the human-readable name distinct from the slug. **Done when:** a human-readable name and a derived slug are recorded.

3. **Detect the language stack.** Detect each language from its manifest: Python from `pyproject.toml`, `requirements.txt`, `setup.py`, or `*.py`; Node/TypeScript from `package.json` or `tsconfig.json`; Rust from `Cargo.toml`; Go from `go.mod` or `go.sum`. Record every detected language; multi-language projects configure all of them. **Done when:** every detected language is recorded, or the skill stops because none was detected.

4. **Generate the five files from the base templates.** Substitute `{{PROJECT_NAME}}` with the human-readable name and `{{PROJECT_SLUG}}` with the slug in Dockerfile, devcontainer.json, post_install.py, .zshrc, and install.sh. The base template carries Claude Code with marketplace plugins, sandboxing via bubblewrap and socat, Python via uv, Node via fnm, ast-grep, network isolation tools, security mounts (`.devcontainer/` mounted read-only to prevent container escape), token forwarding of `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` via `remoteEnv`, and modern CLI tools. **Done when:** all five files are written with the two placeholders substituted.

5. **Re-ground pinned toolchain versions and review broad privileges.** Do not copy pinned toolchain versions or broad container privileges (NET_ADMIN capability, iptables/ipset, bubblewrap sandboxing) verbatim from the source template. Confirm each pinned version against the current upstream release the project targets, and confirm each broad privilege is justified for this project's isolation needs; narrow or drop privileges that are not justified. Record the chosen versions and privilege set in the generated files. **Done when:** every pinned version is re-grounded and every broad privilege is justified or dropped, with the choice recorded.

6. **Merge language-specific configuration in priority order.** For each detected language, merge its devcontainer features, VS Code extensions, VS Code settings, and postCreateCommand segment into devcontainer.json and the Dockerfile. Priority order when multiple languages are present: Python (primary, uses the Dockerfile for uv and Python installation), Node/TypeScript (uses a devcontainer feature), Rust (uses a devcontainer feature), Go (uses a devcontainer feature). Merge extensions and settings from all detected languages; do not duplicate entries.

   - Python: if `pyproject.toml` declares a Python version different from the base default, set it in the Dockerfile via `uv python install <version> --default`. Add extensions `ms-python.python`, `ms-python.vscode-pylance`, `charliermarsh.ruff`. Add settings `python.defaultInterpreterPath` to `.venv/bin/python` and a `[python]` formatter block using ruff with organize-imports on save. postCreateCommand segment: `rm -rf .venv && uv sync && uv run /opt/post_install.py` when `pyproject.toml` exists.
   - Node/TypeScript: no Dockerfile additions. Add the `biomejs.biome` extension. Set `biomejs.biome` as the default formatter and enable its safe source fixes on save; do not introduce ESLint or Prettier. Detect the package manager from the lockfile: `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`, `yarn.lock` → `yarn install --immutable`, `package-lock.json` → `npm ci`, no lockfile → initialize pnpm 11 and run `pnpm install`. postCreateCommand segment chains the chosen install after the base command.
   - Rust: add feature `ghcr.io/devcontainers/features/rust:1`. Add extensions `rust-lang.rust-analyzer`, `tamasfe.even-better-toml`. Add a `[rust]` formatter block using rust-analyzer. postCreateCommand segment: `cargo build --locked` when `Cargo.lock` exists, otherwise `cargo build`. Add a persistent volume `source={{PROJECT_SLUG}}-cargo-${devcontainerId},target=/home/vscode/.cargo,type=volume`.
   - Go: add feature `ghcr.io/devcontainers/features/go:1` with `version` `latest`. Add extension `golang.go`. Add settings `[go]` formatter using `golang.go` and `go.useLanguageServer` true. postCreateCommand segment: `go mod download`. Add a persistent volume `source={{PROJECT_SLUG}}-go-${devcontainerId},target=/home/vscode/go,type=volume`.

   Done when: every detected language's features, extensions, settings, and postCreateCommand segment are merged without duplicates.

7. **Compose postCreateCommand.** Chain every detected language's setup segment with `&&`, preserving the priority order, so all required setup runs on container creation. For a Python-plus-Node project this yields, for example, `uv run /opt/post_install.py && uv sync && pnpm install --frozen-lockfile`. **Done when:** postCreateCommand chains every language segment in priority order.

8. **Validate before presenting.** Confirm every `{{PROJECT_NAME}}` and `{{PROJECT_SLUG}}` placeholder is replaced; `devcontainer.json` is valid JSON with no trailing commas and correct nesting; language-specific extensions are present for every detected language; no extension or setting is duplicated; `postCreateCommand` includes all required setup commands chained with `&&`; the security mounts and token-forwarding `remoteEnv` are explicit. **Done when:** every validation check passes.

9. **Present startup instructions.** Tell the user how to start: open the repository in VS Code and select "Reopen in Container", or run `devcontainer up --workspace-folder .`, or run `.devcontainer/install.sh self-install` to add the `devc` CLI helper to PATH. Do not claim the container was built or launched unless a build or launch was actually performed. **Done when:** VS Code and CLI startup instructions are delivered with no false build/launch claim.

## Failure and recovery
- Existing devcontainer. If `.devcontainer/` already exists, stop without writing. Report that this skill only adds a new devcontainer and that existing configuration should be edited directly.
- No language detected. If none of Python, Node/TypeScript, Rust, or Go is detected, stop without writing. Report which manifests were checked and ask the user which language to target.
- Unresolvable placeholder. If a project name cannot be inferred from any manifest and the user did not supply one, stop before writing files that would still contain `{{PROJECT_NAME}}` or `{{PROJECT_SLUG}}`. Ask for the name; do not emit unresolved placeholders.
- Invalid generated JSON. If `devcontainer.json` fails validation after merging, do not present it. Re-derive the merged configuration from the per-language segments and re-validate before presenting.
- Partial-result rule. Either all five files are written with all placeholders resolved and validation passing, or no file is written. Never leave a partial `.devcontainer/` tree.
- Rollback. Because the side effect is local file creation under `.devcontainer/`, recovery from any failure is removing the partially written `.devcontainer/` directory and re-running from step 1.

## Output
Five files under the repository's `.devcontainer/` (Dockerfile, devcontainer.json, post_install.py, .zshrc, install.sh) with all placeholders resolved, all detected languages represented without duplicate configuration, a composed postCreateCommand, explicit security mounts and token forwarding, and re-grounded toolchain versions and reviewed privileges, plus a short report of detected languages, chosen versions and privilege set, and VS Code and CLI startup instructions, ordered detect → infer → generate → re-ground → merge → compose → validate → present, with no false build/launch claim.
