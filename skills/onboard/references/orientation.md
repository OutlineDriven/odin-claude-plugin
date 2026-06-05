# Onboard orientation reference

This reference is the self-contained checklist and output contract for the onboarding op. Use it to keep collection bounded, synthesis consistent, and degradation honest.

## Data-collection checklist

### Scope

- Root path resolved and readable.
- Depth parsed: `quick | normal | deep`.
- Focus captured if user supplied one.
- Exclusion set applied to walks: `node_modules`, `.git`, `dist`, `target`, `out`, `.next`, `.nuxt`, `__pycache__`, `.pytest_cache`, `coverage`, `.cache`, `vendor`, `.idea`, `.vscode`.

### Manifest and project identity

Collect the first matching primary manifest, then workspace manifests where present.

| Ecosystem | Files | Extract |
|---|---|---|
| npm / JS / TS | `package.json`, `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, `nx.json` | name, version, description, package manager, scripts, dependencies/devDependencies, `main`, `exports`, `bin`, workspaces, monorepo shape |
| Rust | `Cargo.toml`, workspace members, `crates/*/Cargo.toml` | package/workspace, edition, dependencies, `[[bin]]`, examples, tests, benches, primary crate |
| Go | `go.mod`, `go.work`, `cmd/*`, `Makefile` | module path, Go version, required modules, commands under `cmd/`, make targets |
| Python | `pyproject.toml`, `setup.py`, `requirements*.txt`, `tox.ini`, `noxfile.py` | project name/version, package layout, dependencies, console scripts, pytest/nox/tox config |
| Maven | `pom.xml`, child `pom.xml` | group/artifact/version, modules, plugins, test/build commands |
| Gradle | `build.gradle(.kts)`, `settings.gradle(.kts)` | root project, subprojects, plugins, application main class, tasks |
| C/C++/make | `CMakeLists.txt`, `meson.build`, `configure.ac`, `Makefile` | project name, targets, build commands, test targets |

Monorepo detection:
- `package.json.workspaces`, `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, `nx.json`.
- Cargo `[workspace]`.
- Go `go.work`.
- Maven `<modules>`.
- Gradle `include(...)` in `settings.gradle(.kts)`.
- Python `libs/*/pyproject.toml`, `packages/*/pyproject.toml`, `python/*/pyproject.toml`.

### Structure walk

Required: 3-level directory walk with file counts and key files.

Headless recipes:

```bash
fd -d 3 -t d . "$ROOT" \
  -E node_modules -E .git -E dist -E target -E out -E .next -E .nuxt \
  -E __pycache__ -E .pytest_cache -E coverage -E .cache -E vendor -E .idea -E .vscode
```

Fallback:

```bash
find "$ROOT" -maxdepth 3 -type d \
  \( -name node_modules -o -name .git -o -name dist -o -name target -o -name out \
     -o -name .next -o -name .nuxt -o -name __pycache__ -o -name .pytest_cache \
     -o -name coverage -o -name .cache -o -name vendor -o -name .idea -o -name .vscode \) \
  -prune -o -type d -print
```

Annotate, do not paste. Prefer directories with source, tests, configuration, packages/apps, migrations, generated code, and public API surfaces.

### README and local rules

Read, capped near 5KB each:
- `README.md`, `README.mdx`, `README.rst`, `README`.
- `CLAUDE.md`.
- `AGENTS.md`.

If README contains exactly one line ending in `.md`, read that file as the effective README.

Extract:
- Plain-language purpose.
- Install/build/test/run commands.
- Required services, environment variables, database setup.
- Architecture notes.
- Project-specific constraints.

### CI and runtime services

Inspect:
- `.github/workflows/*.{yml,yaml}`.
- `.gitlab-ci.yml`, `azure-pipelines.yml`, `.circleci/config.yml`.
- `Dockerfile`, `docker-compose*.yml`, `compose.yaml`, `Procfile`.
- Deployment roots: `k8s/`, `helm/`, `terraform/`, `serverless.yml`, `vercel.json`, `netlify.toml`, `fly.toml`.

Extract:
- CI provider and workflow names.
- Build/test/lint commands actually run in CI.
- Runtime services and prerequisites.
- Deployment shape only if obvious from files.

### Git signals

If inside a git repository, collect:

```bash
git rev-parse --show-toplevel
git branch --show-current
git rev-list --count HEAD
git log -1 --format='%ci %h %s'
git remote get-url origin
git rev-parse --is-shallow-repository
git shortlog -sn --all -- .
git --no-pager log --since='180 days ago' --format='' --name-only -- .
```

Use the name-only log to count recent churn by file. Top hotspots are active-development signals, not automatic risk. Cross-check owners with `git shortlog` or path-scoped history when available:

```bash
git shortlog -sn --all -- path/to/area
git --no-pager log --since='180 days ago' --format='%an' -- path/to/area
```

### Native entry-point and convention signals

Prefer indexed codegraph where present:
- `codegraph_explore("entry points main binaries commands framework configs tests")`.
- `codegraph_search` for `main`, CLI symbols, server boot functions, exported package roots.
- `codegraph_callees` from selected entry point for first-hop flow.
- `codegraph_files` for package/module inventory.

Fallback recipes:

```bash
# JS/TS entry surfaces
git grep -nE 'createServer|listen\(|commander|yargs|cac\(|program\.command|vite|next|astro|svelte|express\(' -- '*.js' '*.jsx' '*.ts' '*.tsx' '*.mjs' '*.cjs'

# Rust
git grep -nE '^\[\[bin\]\]|^path\s*=|fn main\(' -- 'Cargo.toml' '*.rs'

# Go
git grep -nE '^package main$|func main\(' -- '*.go'

# Python
git grep -nE 'if __name__ == .__main__.|console_scripts|click\.command|typer\.Typer|argparse' -- '*.py' 'pyproject.toml' 'setup.py'

# JVM
git grep -nE 'public static void main|@SpringBootApplication|application.yml|mainClass|plugins \{' -- '*.java' '*.kt' '*.groovy' '*.kts' 'build.gradle' 'build.gradle.kts' 'pom.xml'

# Tests
fd '(test|spec|_test)\.(js|jsx|ts|tsx|rs|go|py|java|kt)$' "$ROOT"
```

Conventions to infer only from evidence:
- Naming style: repeated file/function/class naming in read files.
- Test pattern: actual test file names and framework imports.
- Module boundaries: imports/exports or package manifests.
- Commit style: recent `git log --format=%s -n 30` subjects.

### Whole-repo digest

Use repomix once per onboarding pass:

```text
MCP: pack_codebase(directory="$ROOT", compress=true)
CLI: npx -y repomix "$ROOT" --compress -o /tmp/onboard-repomix.xml
```

Use the digest to confirm stack, top-level modules, naming conventions, and suspicious omissions. Do not quote long digest chunks. If repomix fails, continue with local collection and mark the digest gate degraded.

### Deep-read file selection

Pick 2-3 files:
1. **Entry point**: structural entry point from codegraph/AST, manifest `bin`/`main`, Cargo `[[bin]]`, Go `cmd/*/main.go`, Python console script target, framework config, or app boot.
2. **Largest module**: directory with highest file count from structure walk, excluding generated/vendor/build directories. Read its central `index`, `mod`, `lib`, `main`, or most-imported file if available.
3. **Representative test**: first relevant test near the entry/largest module, or a top-level integration test.

For each file, record:
- Path.
- Why it was chosen.
- Key imports/calls/exports observed.
- What it tells a newcomer.

## Seven-section orientation template

Use section names exactly. Omit a section only when the required data is absent and the omission is stated locally.

```markdown
## 1. What it does

<One or two sentences. Combine README first paragraph + manifest description. Remove marketing language.>

## 2. Tech stack + CI

- Language/runtime: <observed>
- Package/build system: <observed>
- Frameworks/libraries: <observed major deps only>
- Build/test/lint: `<command>` / `<command>` / `<command>` when grounded
- CI: <provider + workflow/job names>, or "No CI detected"

## 3. Where execution starts

- **Binaries / CLIs**: `<name>` → `<path>` — <what runs it>
- **Server / app boot**: `<symbol/path>` — <first-hop flow after reading file>
- **Framework-loaded config**: `<path>` — <framework>
- **Library exports**: `<path>` — <public API surface>
- **Tests / benches**: `<path pattern>` — <framework>

If no structural entry point is found: "No structural entry point found; this appears to be a library/config-only project. Start at <manifest export or primary module>."

## 4. Project structure, annotated

- `<dir>/` — <purpose from files/manifests/imports>
- `<dir>/` — <purpose>
- Unusual layout: <monorepo/workspace/plugin/generated code note, if any>

## 5. Active development — hotspots + owners

- Hotspots: `<file>` (<reason from churn/path>), `<file>`, `<file>`
- Owners/maintainers: <top authors overall or area-specific authors>
- Recent direction: <commit subjects or changed areas, HIGH/MEDIUM certainty>

## 6. Code health

- HIGH: <tool-observed issue, count, file examples>
- MEDIUM: <pattern observed across files>
- LOW: <inference, clearly labeled>

Only include signals useful for orientation: dead exports to avoid, wrapper-heavy areas, commented-out code, tautological conditions, missing/weak tests, stale docs, high-churn low-owner files.

## 7. Getting started — exact runnable commands

```bash
<clone only if remote observed and useful>
<install command from manifest/README/CI>
<build command from manifest/README/CI>
<test command from manifest/README/CI>
<run command from manifest/README/CI>
```

Prerequisites: <services/env vars/toolchain versions observed>. If unknown, say "No explicit prerequisites found".
```

After the seven sections, add:

```markdown
## Deep read

I read:
- `<entry-file>` — <observed flow, imports/calls/exports>
- `<module-file>` — <role in project>
- `<test-file>` — <test framework and pattern>

<2-4 sentences connecting these files.>
```

Then ask the next-step question.

## Depth matrix

| Depth | Collection | Deep read | Repomix | Intended latency | Use |
|---|---|---|---|---|---|
| `quick` | Manifest, README, 3-level structure, git info, CI presence | 1 entry file if obvious | Optional; attempt only if cheap | Seconds | Fast refresh, small repo, user wants quick bearings |
| `normal` | Quick + CLAUDE/AGENTS, CI details, native entry-point search, hotspots/owners, conventions | 2-3 files: entry, largest module, representative test | Required attempt | Short bounded pass | Default onboarding |
| `deep` | Normal + codegraph/callers/callees where indexed, broader AST/text fallback, package/module boundaries | 2-3 files plus focused follow-up read after `ask` choice | Required; use digest actively to cross-check omissions | Longer bounded pass | Monorepos, unfamiliar stack, pre-implementation planning |

Depth does not change the seven-section output shape. It changes confidence and evidence.

## Interaction contract

Use `ask` with one axis: `next_step`.

| Option | Label | Recommended? | Follow-up |
|---|---|---|---|
| `explore_area` | Explore an area | Yes for first-time orientation | Ask for directory/package if not provided; read central exports and most-imported file |
| `trace_feature` | Trace a feature | No | Ask for feature name; locate entry point; trace calls/imports; read 2-3 key files |
| `first_change` | Make a first change | No | Ask for desired change; map risk via hotspots, owners, and tests; identify first files to inspect |
| `where_help` | Where can I help? | No | Combine hotspots, low-owner areas, doc drift, test gaps, and small cleanup candidates into file-level suggestions |

Fallback prompt if `ask` is unavailable:

```text
What would you like to do next?
1. Explore an area (recommended)
2. Trace a feature
3. Make a first change
4. Where can I help?
```

## Degradation and error table

Evaluate top-to-bottom. Report degradation in the affected section, then continue.

| Situation | Action | Certainty |
|---|---|---|
| Root path missing or unreadable | Stop; ask for a valid path or use current working directory if no path was supplied | HIGH |
| No manifest found | Continue with README + structure + git; state "No primary manifest detected" | HIGH |
| Manifest parse error | Name file and parse failure briefly; continue with other manifests if present | HIGH |
| Multiple workspace manifests | Treat as monorepo/workspace; identify root and primary package only if evidence exists | HIGH/MEDIUM |
| README missing | Use manifest description and root file names; state README missing | HIGH |
| README is a one-line redirect | Read target Markdown if present; otherwise treat redirect as README content | HIGH |
| CLAUDE.md/AGENTS.md missing | Omit local-rules notes; do not degrade the whole orientation | HIGH |
| Structure walk huge | Keep depth 3 and annotate major directories only | HIGH |
| Git unavailable or not a repo | Omit branch/owners/hotspots from git; rely on file structure and manifests | HIGH |
| Shallow clone | Use available git data; mark owners/hotspots incomplete | HIGH |
| No recent history | State "No recent git history available"; do not infer active areas | HIGH |
| Codegraph unavailable | Use AST/text fallback; mark entry-point certainty by evidence | HIGH |
| AST/text fallback returns no entry point | Fall back to manifest exports/scripts; state project may be library/config-only | MEDIUM |
| Repomix fails | Continue; state digest unavailable and avoid whole-repo claims not otherwise grounded | HIGH |
| No CI detected | Say "No CI detected" in Tech stack + CI | HIGH |
| No test files found | State no test pattern found; do not invent a test command unless manifest/README provides one | HIGH |
| Only one source file exists | Read it; deep-read section may contain one file | HIGH |
| Entry point generated/minified | Skip generated file; read source map target or nearest source entry if visible | MEDIUM |
| Commands absent from manifest/README/CI | Do not invent install/build/test/run; list only observed commands and mark missing commands | HIGH |
| User supplied focus but no matching files | Complete general orientation, then ask for a different area/feature name | HIGH |

## Certainty grading

- **HIGH**: directly observed in file content, tool output, manifest fields, CI files, or git history.
- **MEDIUM**: supported by two or more weak signals, such as dependency + directory pattern, or repeated naming/import conventions.
- **LOW**: plausible inference from limited data. Label inline as `[INFERENCE]` and keep it out of commands.

## Output quality rules

- Prefer exact paths over generic labels.
- Prefer observed commands over ecosystem defaults.
- Prefer fewer, clearer hotspots over complete churn tables.
- Do not introduce cleanup tasks unless the user chooses `where_help` or `first_change`.
- Do not praise or market the project. Orient the developer.
