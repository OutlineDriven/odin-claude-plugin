---
name: claude-settings-audit
description: 'Use when setting up a project, auditing Claude Code settings, or asking which read-only bash commands to allow. Emits a recommended .claude/settings.json allow list and optional .mcp.json suggestions scoped to the detected stack.'
---

# Claude settings audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User sets up a project, audits Claude Code settings, or asks which read-only bash commands to allow. |
| Authority | Read-only: inspects repository files and dependency manifests; emits chat output only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Emits a recommended `.claude/settings.json` and optional `.mcp.json` suggestion as chat output. Writes nothing to disk. |
| Done | A `settings.json` recommendation containing only read-only, project-relevant commands and domains, with no absolute paths. |

## Inputs

- The repository root to audit (defaults to the current working directory).
- Optional: an existing `.claude/settings.json` and `.mcp.json` to merge into.

## Procedure

1. Detect the tech stack by listing the repository root and finding manifest files to depth 2 (`*.toml`, `*.json`, `*.lock`, `*.yaml`, `*.yml`, `Makefile`, `Dockerfile`, `*.tf`). Classify by indicator files:
   - Python: `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile`, `poetry.lock`, `uv.lock`
   - Node.js: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - Go: `go.mod`, `go.sum`; Rust: `Cargo.toml`, `Cargo.lock`; Ruby: `Gemfile`, `Gemfile.lock`
   - Java: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Build: `Makefile`, `Dockerfile`, `docker-compose.yml`; Infra: `*.tf`, `kubernetes/`, `helm/`
   - Monorepo: `lerna.json`, `nx.json`, `turbo.json`, `pnpm-workspace.yaml`
   **Done when:** the tech stack is classified from detected manifest files.
2. Detect services by reading dependency manifests: `package.json` (`dependencies`, `devDependencies`), `pyproject.toml` (`[project.dependencies]` or `[tool.poetry.dependencies]`), `Gemfile`, `Cargo.toml` (`[dependencies]`). Flag Sentry when `sentry-sdk`, `@sentry/*`, `.sentryclirc`, or `sentry.properties` is present; flag Linear when a `.linear/` directory or Linear config exists. **Done when:** services are detected from dependency manifests.
3. Read existing config: `cat .claude/settings.json` and `cat .mcp.json` (tolerate absence). **Done when:** existing config is read or confirmed absent.
4. Build the allow list. Always include the baseline read-only commands, each as `Bash(<cmd>:*)`: `ls`, `pwd`, `find`, `file`, `stat`, `wc`, `head`, `tail`, `cat`, `tree`, `git status`, `git log`, `git diff`, `git show`, `git branch`, `git remote`, `git tag`, `git stash list`, `git rev-parse`, `gh pr view`, `gh pr list`, `gh pr checks`, `gh pr diff`, `gh issue view`, `gh issue list`, `gh run view`, `gh run list`, `gh run logs`, `gh repo view`, `gh api`. **Done when:** the baseline allow list is built.
5. Add stack-specific read-only commands only for tools actually detected:
   - Python: `python --version`, `python3 --version`; `poetry.lock`→`poetry show`, `poetry env info`; `uv.lock`→`uv pip list`, `uv tree`; `Pipfile.lock`→`pipenv graph`; `requirements.txt` alone→`pip list`, `pip show`, `pip freeze`.
   - Node.js: `node --version`; `pnpm-lock.yaml`→`pnpm list`, `pnpm why`; `yarn.lock`→`yarn list`, `yarn info`, `yarn why`; `package-lock.json`→`npm list`, `npm view`, `npm outdated`; `tsconfig.json`→`tsc --version`.
   - Go: `go version`, `go list`, `go mod graph`, `go env`. Rust: `rustc --version`, `cargo --version`, `cargo tree`, `cargo metadata`. Ruby: `ruby --version`, `bundle list`, `bundle show`. Maven: `java --version`, `mvn --version`, `mvn dependency:tree`. Gradle: `java --version`, `gradle --version`, `gradle dependencies`.
   - Build: `Dockerfile`→`docker --version`, `docker ps`, `docker images`; `docker-compose.yml`→`docker-compose ps`, `docker-compose config`; `*.tf`→`terraform --version`, `terraform providers`, `terraform state list`; `Makefile`→`make --version`, `make -n`.
   **Done when:** stack-specific commands are added only for detected tools.
6. Add `WebFetch(domain:...)` entries for detected frameworks: Django→`docs.djangoproject.com`; Flask→`flask.palletsprojects.com`; FastAPI→`fastapi.tiangolo.com`; React→`react.dev`; Next.js→`nextjs.org`; Vue→`vuejs.org`; Express→`expressjs.com`; Rails→`guides.rubyonrails.org`, `api.rubyonrails.org`; Go→`pkg.go.dev`; Rust→`docs.rs`, `doc.rust-lang.org`; Docker→`docs.docker.com`; Kubernetes→`kubernetes.io`; Terraform→`registry.terraform.io`. When Sentry is detected, also add `docs.sentry.io`, `develop.sentry.dev`, `docs.github.com`, `cli.github.com`. **Done when:** framework domain entries are added for detected frameworks.
7. For MCP suggestions (emitted for `.mcp.json`, not `settings.json`): if Sentry is detected, suggest an HTTP MCP server entry pointing at `https://mcp.sentry.dev/mcp/{org-slug}/{project-slug}` with the org and project slugs left as placeholders. If Linear is detected, suggest a `pnpm dlx @linear/mcp-server` entry with `LINEAR_API_KEY` sourced from the environment. Never suggest a GitHub MCP server; use `gh` CLI commands instead. **Done when:** MCP suggestions are emitted for detected services, or omitted when none are detected.
8. Enforce the safety rules before emitting:
   - Include only read-only commands that cannot modify state (no install, build, run, write, or delete).
   - Include only tools actually detected via lock files or manifests.
   - Use the `:*` suffix so a base command accepts any arguments.
   - Never include absolute paths or user-specific paths.
   - Never include project scripts that may have side effects (e.g., `./scripts/deploy.sh`).
   - Include only the package manager the project actually uses: if `pnpm-lock.yaml` is present, omit npm and yarn; if `yarn.lock`, omit npm and pnpm; if `package-lock.json`, omit yarn and pnpm; if `poetry.lock`, omit pip unless `requirements.txt` also exists; if `uv.lock`, omit pip and poetry; if `Pipfile.lock`, omit pip and poetry. Where multiple lock files coexist, include commands for each detected manager.
   **Done when:** every emitted command is read-only, detected, scoped with `:*`, and free of absolute paths.

## Failure and recovery
- **Missing manifests:** report the stack as undetected for that category and emit only the baseline commands; do not guess frameworks.
- **Unreadable existing config:** note the read failure and emit a fresh recommendation rather than merging.
- **Ambiguous stack with conflicting lock files:** apply the package-manager rule in step 8 and list each detected manager; never silently pick one.
- **No services detected:** omit MCP suggestions; the `settings.json` recommendation is still complete.
- **Invalid recommendation:** if any emitted command can modify state, contains an absolute path, or names a tool not detected in the repository, re-run step 8 and re-emit.

## Output
A chat report with four parts: a detected-stack summary table (languages, package manager, frameworks, services, build tools); the complete recommended `.claude/settings.json` with `permissions.allow` grouped by category and `permissions.deny` empty; MCP suggestions for `.mcp.json` when Sentry or Linear is detected; and merge instructions when an existing `settings.json` was found.

## Provenance

Adapted clean-room from `getsentry/skills` (`skills/claude-settings-audit/SKILL.md`, revision `c2f99a5b04b4cd99ec3022d7c2c3e23e938d241`, Apache-2.0). The Sentry-internal skill allow list and Sentry-only always-include domains were dropped; the read-only detection and local-config-emit mechanism is preserved.
