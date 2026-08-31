---
name: claude-settings-audit
description: 'Use when setting up a project, auditing agent command permissions, or asking which read-only bash commands and domains to allow. Inspects repository manifests to detect the tech stack and synthesizes a least-privilege command and domain allowlist that forbids state-modifying commands. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Agent command policy audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User sets up a project, audits agent command permissions, or asks which read-only bash commands and domains to allow |
| Authority | Read-only: inspects repository files and dependency manifests; outputs recommendations without mutating state |
| Side effect | Emits a recommended command and domain allowlist as chat output. Writes nothing to disk |
| Done | A validated, least-privilege command and domain policy recommendation containing only read-only, project-relevant commands and domains, with no state-modifying commands |

## Inputs

- The repository root to audit (defaults to the current working directory).
- Optional: an existing policy file to merge into.

## Procedure

1. Parse repository manifests to identify the tech stack. List the repository root and find manifest files to depth 2 (`*.toml`, `*.json`, `*.lock`, `*.yaml`, `*.yml`, `Makefile`, `Dockerfile`, `*.tf`). Classify by indicator files:
   - Python: `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile`, `poetry.lock`, `uv.lock`
   - Node.js: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - Go: `go.mod`, `go.sum`; Rust: `Cargo.toml`, `Cargo.lock`; Ruby: `Gemfile`, `Gemfile.lock`
   - Java: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Build: `Makefile`, `Dockerfile`, `docker-compose.yml`; Infra: `*.tf`, `kubernetes/`, `helm/`
   - Monorepo: `lerna.json`, `nx.json`, `turbo.json`, `pnpm-workspace.yaml`
   Done when: the tech stack is classified from detected manifest files.
2. Read any existing policy files. Tolerate absence. Done when: existing policy is read or confirmed absent.
3. Synthesize a read-only command and domain allowlist specific to the detected stack. Build the baseline read-only commands, each as `Bash(<cmd>:*)`: `ls`, `pwd`, `find`, `file`, `stat`, `wc`, `head`, `tail`, `cat`, `tree`, `git status`, `git log`, `git diff`, `git show`, `git branch`, `git remote`, `git tag`, `git stash list`, `git rev-parse`, `gh pr view`, `gh pr list`, `gh pr checks`, `gh pr diff`, `gh issue view`, `gh issue list`, `gh run view`, `gh run list`, `gh run logs`, `gh repo view`. Add stack-specific read-only commands only for tools actually detected by lock files or manifests. Done when: the stack-specific allowlist is built.
4. Filter the allowlist to strictly forbid state-modifying commands. Remove any command that can mutate state: no install, build, run, write, delete, or push. Remove unrestricted API wrappers (e.g. `gh api` without a read-only subcommand) that can issue mutating requests. Include only the package manager the project actually uses: if `pnpm-lock.yaml` is present, omit npm and yarn; if `yarn.lock`, omit npm and pnpm; if `package-lock.json`, omit yarn and pnpm. Where multiple lock files coexist, include commands for each detected manager. Done when: every remaining command is read-only, detected, and scoped.
5. Add `WebFetch(domain:...)` entries for detected frameworks: Django to `docs.djangoproject.com`; Flask to `flask.palletsprojects.com`; FastAPI to `fastapi.tiangolo.com`; React to `react.dev`; Next.js to `nextjs.org`; Vue to `vuejs.org`; Express to `expressjs.com`; Rails to `guides.rubyonrails.org`, `api.rubyonrails.org`; Go to `pkg.go.dev`; Rust to `docs.rs`, `doc.rust-lang.org`; Docker to `docs.docker.com`; Kubernetes to `kubernetes.io`; Terraform to `registry.terraform.io`. Done when: framework domain entries are added for detected frameworks.
6. Format the recommendation as a safe policy block. Use the `:*` suffix so a base command accepts any arguments. Never include absolute paths, user-specific paths, or project scripts that may have side effects. Done when: the policy block is formatted with only read-only, detected, scoped commands and domains.

## Failure and recovery

- Missing manifests: report the stack as undetected for that category and emit only the baseline commands; do not guess frameworks.
- Unreadable existing policy: note the read failure and emit a fresh recommendation rather than merging.
- Ambiguous stack with conflicting lock files: apply the package-manager rule in step 4 and list each detected manager; never silently pick one.
- Invalid recommendation: if any emitted command can modify state, contains an absolute path, or names a tool not detected in the repository, re-run step 4 and re-emit.

## Output

A chat report with three parts: a detected-stack summary table (languages, package manager, frameworks, services, build tools); the complete recommended command and domain allowlist with `permissions.allow` grouped by category and `permissions.deny` empty; and merge instructions when an existing policy file was found.
