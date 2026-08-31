# Verifier detection and guard matrix

## Section 1: Verifier detection precedence

Repo-native first. Check in this order:

1. `Justfile` — run `just test` (guard: `just check`)
2. `Makefile` — run `make test` (guard: `make check` or `make lint`)
3. `package.json` — run the `test` script (guard: `typecheck` or `lint` script if present)
4. `dune-project` — run `dune build @runtest` (guard: `dune build`)
5. Language fallbacks (see matrix below)

Detection signal: use `fd` to locate these files from the repo root before falling back to language heuristics.

```
fd --max-depth 2 '^Justfile$'
fd --max-depth 2 '^Makefile$'
fd --max-depth 2 '^package\.json$'
fd --max-depth 2 '^dune-project$'
```

## Section 2: Per-language verifier matrix

| Language | Primary verifier | Guard command | Detection signal |
|---|---|---|---|
| TypeScript/JavaScript | `vitest run` or `jest --passWithNoTests` or `npm test` | `tsc --noEmit && eslint .` | `tsconfig.json` + `package.json` |
| Python | `pytest` | `ruff check . && mypy .` | `pyproject.toml` or `setup.py` or `*.py` in `src/` |
| Rust | `cargo test` | `cargo clippy -- -D warnings` | `Cargo.toml` |
| Go | `go test ./...` | `golangci-lint run` | `go.mod` |
| OCaml | `dune build @runtest` | `dune build` | `dune-project` |
| Java/Kotlin | `./gradlew test` or `mvn test` | `./gradlew check` or `mvn verify` | `build.gradle*` or `pom.xml` |
| C/C++ | `cmake --build . && ctest` | `clang-tidy` | `CMakeLists.txt` |

When a repo-native verifier (Section 1) is present, it takes precedence over the language fallback in this matrix.

## Section 3: Guard definition and guard-red detection

A **guard** is a command that must pass after every kept commit. Its job is to detect regressions introduced by a fix.

Exit code alone is not sufficient. Check both conditions:

**Guard red** — any of the following:
- Exit code non-zero
- Exit code 0 AND output contains any of:
  - `error:`
  - `Error:`
  - `FAILED`
  - `warning [error]`
  - `error[E` (Rust clippy errors)

**Guard green** — exit code 0 AND no error lines matched above.

Capture both stdout and stderr when evaluating guard output. A process that exits 0 while emitting errors to stderr is still guard red.

## Section 4: Verifier output delta computation

```
delta = previous_error_count - current_error_count
```

A positive delta means errors decreased (progress). Zero delta means no change. Negative delta means regressions were introduced.

Error count extraction per verifier:

| Verifier | Pattern to match |
|---|---|
| pytest | `^FAILED ` lines, or `N failed` in final summary |
| tsc | `error TS` lines |
| eslint | `\d+ errors` in summary line |
| cargo test | `^test .* FAILED` lines |
| go test | `^--- FAIL` lines |
| clippy | `^error\[` lines |
| ruff | `Found N errors` |

Extract counts with `git grep` or per-line scanning of captured output. If the count is unparseable for any reason, treat delta as 0 and trigger DISCARD — do not keep a commit whose improvement cannot be verified.

## Section 5: Multi-verifier mode

When multiple verifiers are detected (e.g., tests present alongside type checking):

- Run ALL verifiers per iteration
- Error count = sum of counts across all verifiers
- Guard = union of all guard commands (all must pass)
- Any single guard failure = guard red for that iteration

Order: run faster verifiers first (type checks, lints) before slower test suites. Report failures from all verifiers, not just the first.

## Section 6: Output directory

Each fix session creates a directory at:

```
fix/{YYMMDD}-{HHMM}-{slug}/
```

Where `{slug}` is a short kebab-case label derived from the primary error or target file.

Contents:

| File | Purpose |
|---|---|
| `fix-results.tsv` | Iteration log with columns: `iteration`, `category`, `target`, `delta`, `guard`, `status`, `description` |
| `summary.md` | What was fixed, what remains, and the session `fix_score` |
| `blocked.md` | Errors that required 3 or more attempts without resolution |

Inspect with:

```
bat -P -p -n fix/{YYMMDD}-{HHMM}-{slug}/fix-results.tsv
bat -P -p -n fix/{YYMMDD}-{HHMM}-{slug}/summary.md
```

---

## Section 7: Reviewer-as-verifier modes

The default modes (verifier-failure, findings, bug-spec) use repo-native test
and lint commands as verifiers. Three modes use a reviewer or specialist
panel as the verifier instead:

| Mode | Verifier source | Detection |
|------|----------------|-----------|
| `iterative-improve` | Named external reviewer agent (user-specified) | User names the reviewer at invocation; no auto-detection |
| `review-loop` | Eight specialist subagents dispatched per diff | Fixed roster: api-contract, data-migration, maintainability, performance, red-team, security, simplification, testing |
| `finder-fixer` | Next independent review | No verifier is run in-loop; each behavioral fix carries a regression pin so the next review can confirm |

When the verifier is a reviewer agent, the guard is the reviewer's verdict:
zero critical or major findings = green; any critical or major finding = red.
The delta computation (Section 4) does not apply — the reviewer returns
findings, not error counts. Instead, the decide matrix in `loop.md` uses
finding counts: blocking findings decreasing = progress (KEEP); blocking
findings unchanged or increasing = DISCARD or REWORK.

For `finder-fixer`, there is no in-loop verifier run. The verdict-per-finding
taxonomy (`fixed` / `rejected` / `deferred`) replaces the KEEP/REWORK/DISCARD
cycle. See `references/finder-fixer.md`.