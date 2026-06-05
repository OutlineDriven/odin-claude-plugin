# next-task gates — inline quality contract

These gates run after implementation and before any publish or PR action. They are self-contained. They may use ODIN tools, generic ODIN agents, project-native commands, and git rollback only.

Gate result shape:

```json
{
  "gate": "slop|docs|review|verifier",
  "status": "pass|blocked|rolled-back|flag-only",
  "changedFiles": [],
  "findings": [],
  "fixesApplied": [],
  "verifier": { "command": "", "exitCode": 0, "evidence": "" },
  "rollback": { "ran": false, "files": [], "command": "" }
}
```

## Common rules

1. Mutate only after the implementation smoke check has already made the task work.
2. Keep batches small. Prefer one file or one invariant per batch.
3. Record changed files before every gate fix.
4. Verify immediately after a batch.
5. On regression, run `git restore -- <files...>`, rerun the same verifier, and record the rollback. Do not keep partial fixes.
6. Certainty is not severity:
   - **HIGH**: deterministic search/AST evidence; eligible for auto-fix only when the strategy is mechanical.
   - **MEDIUM**: structural/contextual evidence; report-only unless user approves a manual change.
   - **LOW**: heuristic/tooling hints; report-only.
7. Exclude tests, fixtures, mocks, examples, generated/vendor/build output, lockfiles, minified bundles, and Markdown trailing-space cleanup from mechanical slop edits.

## Gate 1 — deterministic slop cleanup

Intent: remove obvious production-code leftovers without changing behavior.

### Scope

Default scope is the branch diff. Use `origin/<base>` for remote-backed work; use the recorded `baseSha` for local-only detached work:

```bash
git diff --name-only <base-ref>...HEAD
```

Filter to source/config files. Exclude:

```text
**/test/**, **/tests/**, **/__tests__/**, *.test.*, *.spec.*, *_test.*, *Test.java
**/fixtures/**, **/mocks/**, **/testdata/**, **/examples/**, **/benches/**
dist/**, build/**, target/**, coverage/**, vendor/**, node_modules/**, *.min.*
generated/**, **/*.generated.*, protobuf/openapi outputs, lockfiles
```

### HIGH deterministic scan

Use separate searches so each match has one reason:

```text
search pattern="console\.(log|debug)\(" paths=[changed JS/TS source]
search pattern="\b(print\(|breakpoint\(|import pdb|import ipdb)" paths=[changed Python source]
search pattern="(println!|dbg!|eprintln!)\(" paths=[changed Rust source]
search pattern="throw\s+new\s+Error\s*\(\s*['\"`].*(TODO|implement|not\s+impl)" paths=[changed JS/TS source]
search pattern="\b(todo|unimplemented)!\s*\(|\bpanic!\s*\(\s*['\"].*(TODO|implement)" paths=[changed Rust source]
search pattern="raise\s+NotImplementedError|def\s+\w+\s*\([^)]*\)\s*:\s*(pass|\.\.\.)" paths=[changed Python source]
search pattern="catch\s*(\([^)]*\))?\s*\{\s*\}|except\s*[^:]*:\s*pass\s*$|if\s+err\s*!=\s*nil\s*\{\s*\}" paths=[changed source]
search pattern="sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}|AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9._~+/-]{20,}|-----BEGIN (RSA )?PRIVATE KEY-----" paths=[changed source]
search pattern="^\t+ +|^ +\t+|[ \t]+$" paths=[changed non-Markdown source]
```

Use `ast-grep` where syntax shape matters:

```text
ast-grep pat="console.log($$$ARGS)" paths=[changed JS/TS source]
ast-grep pat="try { $$$BODY } catch ($E) { }" paths=[changed JS/TS source]
ast-grep pat="$X.unwrap()" paths=[changed Rust source]
ast-grep pat="$X.expect($MSG)" paths=[changed Rust source]
ast-grep pat="throw new UnsupportedOperationException($$$ARGS)" paths=[changed Java source]
```

### MEDIUM contextual scan

Report only. Prefer codegraph when indexed; otherwise combine `ast-grep`, `search`, and narrow `read` ranges.

MEDIUM signals:

- doc/comment ratio greater than 3:1 inside real functions;
- more than two comments per code line in a function;
- code after `return`, `throw`, `break`, or `continue` where the language does not require fallthrough;
- wrapper/infrastructure objects created and only re-exported;
- buzzword comments such as “production-ready”, “enterprise-grade”, “secure by default”, or “scalable” with no concrete code evidence;
- directories deeper than four real module levels without boundaries;
- functions whose significant body is only `0`, `null`, `undefined`, `None`, `nil`, `false`, `true`, `[]`, `{}`, `""`, empty collections, `Default::default()`, or `Optional.empty()`.

### Fix strategy

Only HIGH findings with one of these strategies may be edited:

| Strategy | Allowed when | Forbidden when |
|---|---|---|
| `remove-line` | debug prints, isolated commented-out code, mechanical trailing whitespace | line is user-visible CLI output or fixture content |
| `replace-whitespace` | mixed indentation in changed non-Markdown source | formatter would be required to understand layout |
| `add-comment` | an empty handler is provably intentional from surrounding code | intent unknown; do not invent logging |
| `remove-block` | placeholder/dead block is unreachable and not API surface | live API stub or behavior gap |
| `flag-only` | secrets, unwrap/expect, live stubs, contextual dead code, architecture smell | never auto-edit |

Hardcoded credentials are HIGH evidence and usually `flag-only`: deletion is not remediation. Require rotation and replacement with environment/config access.

### Verification and rollback

1. Apply one mechanical batch.
2. Run the repo-native verifier candidate from Gate 4, or the narrowest relevant command for the touched files.
3. If green, commit the cleanup batch.
4. If red:

```bash
git restore -- <changed-files-in-cleanup-batch>
```

5. Rerun the same verifier. If baseline is not green, mark the gate `blocked` and stop; do not keep cleanup edits.

## Gate 2 — docs and changelog sync

Intent: make public docs describe the changed code without inventing prose.

### Scope and evidence

Use the same base as isolation. `<base-ref>` is `origin/<base>` for remote-backed work or the recorded `baseSha` for local-only detached work:

```bash
git diff --name-status <base-ref>...HEAD
git diff --name-only <base-ref>...HEAD
git --no-pager log --oneline --no-merges <base-ref>..HEAD
```

Changed surfaces that can require docs:

- public API/export changes;
- CLI flags, config names, package names, routes, environment variables;
- install/import paths;
- manifest versions;
- behavior visible in README/docs/examples;
- migrations or deprecations.

Extract coupling terms from changed files:

- filename stem and full path;
- import strings in the diff;
- public symbols from codegraph or AST search;
- route/config/CLI flag names;
- manifest package and version.

Search only live docs first: `README.md`, `CHANGELOG.md`, root `*.md`, and `docs/**/*.md`. Use `search` per escaped term and `read` around matches.

### Certainty taxonomy

| Certainty | Issue | Action |
|---|---|---|
| HIGH | manifest version mismatch on a clearly version-labeled line | safe fix |
| HIGH | missing `## [Unreleased]` entry for public-surface change | safe fix |
| HIGH | removed/renamed public symbol still documented with symbol proof | flag-only |
| HIGH | changed import path in fenced example where old path no longer resolves | flag-only unless one-to-one rename is explicit |
| MEDIUM | stale example mentions changed file/symbol but intent needs review | flag-only |
| MEDIUM | new public export lacks docs after entry-point/internal filtering | flag-only |
| LOW | broad stale prose suspicion or filename-only coupling | flag-only |

### Safe fixes

Only two edits are safe by default:

1. **Version bump**
   - Read source-of-truth manifest: `package.json`, `Cargo.toml`, `pyproject.toml`, or equivalent.
   - Replace stale semver only on a line that labels a version, package badge, or install snippet.
   - Do not replace years, ports, protocol versions, dates, or arbitrary examples.
2. **CHANGELOG `## [Unreleased]` entry**
   - If absent, insert `## [Unreleased]` immediately below the title.
   - If present, add a minimal bullet under an existing appropriate subsection; otherwise add a plain bullet under `## [Unreleased]`.
   - Ground the bullet in changed files or commit subjects. Do not invent product claims.

Everything else remains flagged with `reasonFlagOnly`.

### Post-edit check

After any docs edit:

1. Re-read edited ranges.
2. Confirm only the intended line/block changed.
3. Run the relevant docs check if the repo has one.
4. If the edit drifted into prose guessing or verifier fails, `git restore -- <doc-file>` and record the issue as flag-only.

## Gate 3 — review loop

Intent: independent reviewers find critical/high defects before delivery.

### Reviewer roster

Always launch four core generic ODIN `reviewer` agents in parallel:

- code quality: correctness, error handling, maintainability, duplication;
- security: auth/authz, input validation, injection, secrets, unsafe defaults;
- performance: hot paths, N+1 work, blocking I/O, memory growth, allocation churn;
- test quality: missing edge cases, weak assertions, integration coverage, bad mocks.

Add conditional reviewers when changed files justify them:

| Signal | Reviewer focus |
|---|---|
| `db`, `migration`, `schema`, `prisma`, `sql` | database/data integrity |
| `api`, `route`, `controller`, `handler` | API contract |
| `.tsx`, `.jsx`, `.vue`, `.svelte`, CSS/UI routes | frontend/UX correctness |
| `server`, `backend`, `service`, `domain` | backend/domain correctness |
| `.github/workflows`, `Dockerfile`, `k8s`, `terraform`, deploy scripts | devops/release safety |
| 20+ changed files or broad codegraph impact | architecture boundaries |

### Required reviewer schema

Every reviewer returns JSON:

```json
{
  "pass": "code-quality|security|performance|test-quality|database|api|frontend|backend|devops|architecture",
  "findings": [
    {
      "file": "path/to/file.ext",
      "line": 42,
      "severity": "critical|high|medium|low",
      "category": "short category",
      "description": "what is wrong and why it matters",
      "suggestion": "specific fix",
      "confidence": "HIGH|MEDIUM|LOW",
      "falsePositive": false,
      "falsePositiveReason": "required non-empty string only when falsePositive is true"
    }
  ]
}
```

Drop or downgrade vague findings. A blocking finding needs exact file, exact line, concrete failure mode, and a fix.

### False-positive contract

1. Normalize all reviewer JSON.
2. Honor `falsePositive: true` only when `falsePositiveReason.trim()` is non-empty.
3. If the reason is missing, force the finding back to `OPEN` and mark `reasonMissing: true`.
4. Deduplicate by `pass:file:line:description`.
5. Sort by severity: critical, high, medium, low.
6. Count only non-dismissed findings as open.
7. Extract LOW findings into `.outline/next-task/low-debt.md`; they do not block the critical/high loop.
8. Compute `dismissed_false_positive / total_findings`. If `total_findings >= 10` and ratio `> 0.5`, pause with `ask`:
   - `treat-all-as-open` (Recommended): strip dismissals and continue;
   - `accept-dismissals`;
   - `stop-with-review-queue`.

### Iteration loop

Loop condition:

```text
open critical/high findings > 0 AND iteration < 5
```

Per iteration:

1. Fix critical before high.
2. Within severity, group by file and smallest safe batch.
3. Apply the concrete fix, not adjacent style cleanup.
4. Run the repo-native verifier after each batch.
5. On regression, restore the batch files, rerun verifier, keep finding open with rollback note.
6. Re-review only changed files plus impacted public/entry surfaces, using reviewers whose domains touch those files and reviewers that emitted the fixed findings.
7. Re-consolidate and rerun the false-positive contract before checking for zero.
8. Compute:

```text
findingsHash = sha256(sorted(open critical/high keys: pass:file:line:severity:description:suggestion))
```

If the same hash appears in two consecutive iterations, stall. At stall or iteration cap, use `ask`:

- `continue-with-new-fix-plan` (Recommended only when a new concrete fix path exists);
- `create-private-issues-for-rest`;
- `leave-in-queue`;
- `abort-and-restore-last-batch`.

Completion status is `pass` only when no open critical/high findings remain. User deferral is `blocked` or `deferred`, not `pass`.

## Gate 4 — repo-native verifier

Intent: prove the branch still works under the project’s own checks.

### Command discovery

Read manifests and CI config. Prefer commands the repo already uses. Do not invent a new toolchain.

Order:

1. JavaScript/TypeScript:
   - package manager from lockfile (`bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`);
   - scripts: `test`, `lint`, `typecheck` or `check`, `build` when present.
2. Rust: `cargo test`; `cargo clippy` only when configured or customary in CI.
3. Go: `go test ./...`; `go vet ./...` when configured.
4. Python: `pytest`; then configured `ruff`, `mypy`, or `tox` when present.
5. JVM: `mvn test`, `gradle test`, or wrapper variants if present.
6. Other ecosystems: use the documented CI command.

If no verifier exists, run the narrowest parser/typecheck available and mark `verifier.status = unavailable`. Do not present that as full proof for publish; require a completion decision that acknowledges the limitation.

### Required checks

- Worktree/index clean before publish: `git status --porcelain` empty.
- Commits are ahead of base: `git rev-list --count <base-ref>..HEAD` > 0 unless the task was queue-only.
- Tests pass when a test command exists.
- Lint/type/build pass when they are repo-native required checks.
- Task requirements have evidence in changed files, tests, or docs.

### Regression handling

If a verifier turns red after a gate or review-fix batch:

```bash
git restore -- <files-from-that-batch>
```

Rerun the exact same verifier:

- green baseline: keep the finding open, record rollback, continue only with a different fix plan;
- still red: the branch baseline is broken; stop and repair baseline before more gate fixes.

Never suppress tests, rewrite expectations to match broken behavior, skip required checks, or mark unavailable checks as passing.

## Final gate report

Before the completion decision, append to `flow.json.gateResults` and summarize:

```json
{
  "slop": { "highFixed": 0, "flagged": 0, "rollback": false },
  "docs": { "safeFixes": 0, "flagged": 0, "rollback": false },
  "review": { "iterations": 1, "remainingCriticalHigh": 0, "stalled": false },
  "verifier": { "commands": [], "passed": true, "unavailable": [] }
}
```

No publish or PR action may run until this report shows no red required gate.