# Documentation Drift Issue Taxonomy

Use this table as the classification contract for `sync-docs`. Safe-fix is intentionally tiny. A finding may be HIGH certainty and still flag-only when the correct prose cannot be inferred mechanically.

## Default Ignore List

Exclude these paths from doc-drift / zero-coupling checks unless the user explicitly scopes them:

- `versioned_docs/` — snapshot docs; low coupling is expected.
- `fixtures/` and `tests/fixtures/` — examples used as test data.
- `generated/`, `dist/`, `build/`, `coverage/`, `vendor/` — produced artifacts.
- `node_modules/` — dependency content.
- `CHANGELOG.md` — append-only release history; do not classify as doc-drift. Still inspect it for missing `## [Unreleased]` and safe changelog insertion.
- `.git/`, `.cache/`, `.turbo/`, `.next/`, `.venv/` — workspace/internal state.

For related-doc discovery, start with `README.md`, root `*.md`, and `docs/**/*.md`; include ignored paths only on direct user request.

## Common Evidence Fields

Every issue carries:

```json
{
  "type": "version-mismatch",
  "severity": "HIGH|MEDIUM|LOW",
  "certainty": "HIGH|MEDIUM|LOW",
  "file": "README.md",
  "line": 12,
  "term": "1.2.0",
  "changedCode": "package.json",
  "safeFix": true,
  "reasonFlagOnly": null
}
```

Line is `?` only for whole-file drift where no exact stale line exists. Prefer exact `file:line` from `search`, `git grep -n`, codegraph output, or a read range.

## Taxonomy

| Issue | Certainty | Safe-fix | Detection recipe | Action |
|---|---:|---:|---|---|
| `version-mismatch` | HIGH when manifest and labeled doc semver disagree | Yes | Read manifest version; search docs for labeled semver (`version`, package badge, install snippet, `@x.y.z`). Confirm doc version is older/different and line context is clearly package/app version. | Replace that exact semver with manifest version. |
| `missing-unreleased-changelog` | HIGH when changed branch has user-visible commits and no `## [Unreleased]` | Yes | Read `CHANGELOG.md`; inspect branch commit subjects and changed files. User-visible prefixes: `feat`, `fix`, `perf`, `refactor`, `breaking`, public docs/API/config changes. | Insert `## [Unreleased]` below title and add concise evidence-backed bullet. |
| `removed-export` | HIGH with codegraph/LSP/ast-grep proof; MEDIUM with regex-only diff | No | For deleted/renamed symbols from changed files, verify current code has no public symbol by same name. Search docs for the old symbol. Codegraph: search symbol, callers/impact for live status. Fallback: compare exports at base vs HEAD with `git show <base>:<file>` + `ast-grep`/`git grep`. | Flag `file:line`; describe old symbol and changed source file. Do not rewrite docs by guessing replacement. |
| `changed-import-path` | HIGH if diff proves one-to-one rename and old import no longer exists; MEDIUM otherwise | No | Extract import strings from fenced code blocks and prose. Compare against changed path/module renames. Check old path with codegraph_files or `git grep -n` over source manifests/exports. | Flag old and candidate new path if exact. Do not auto-edit examples unless explicitly requested. |
| `stale-code-example` | MEDIUM by default; HIGH only when example references removed symbol/path | No | Parse fenced blocks. Search for changed filenames, imports, exported symbols, CLI flags, config keys, and package names. Re-read surrounding prose for intent. | Flag block start line and stale token; require manual semantic update. |
| `undocumented-public-export` | MEDIUM | No | From changed files, list public exports. Filter internal/private names (`_prefix`, test files, `internal/`, `private/`, `utils/`, `helpers/`) and entry points (`index`, `main`, `app`, `server`, `cli`, `bin`). Search live docs for word-bound symbol mentions. | Flag export file:line and missing doc mention. Do not add docs automatically. |
| `docs-describe-dead-code` | MEDIUM/HIGH depending on analyzer evidence | No | Codegraph callers/impact show symbol has no reachable callers or was removed; fallback `git grep -n <symbol>` only finds declaration and docs. Search docs for the symbol. | Flag doc line and code evidence. Human decides whether to delete docs or revive code. |
| `doc-drift` | LOW unless combined with stale symbols | No | For each live doc, compute code coupling by references to current filenames, imports, exported symbols, CLI flags, package names. Zero references + recent doc/code divergence implies drift. Ignore default snapshot/generated paths. | Flag whole doc with coupling summary; no line-specific edit. |
| `documents-wrapper` | MEDIUM | No | Codegraph callees/callers show documented symbol is a single-call passthrough/wrapper. Fallback: ast-grep body contains one direct return/call and no domain logic. | Flag as possible overdocumented wrapper; prose may need to describe underlying behavior. |
| `dead-doc` | LOW/MEDIUM | No | Markdown references only deleted files, removed commands, or old packages and has no current code coupling. Stronger when all referenced paths fail `git grep --files-with-matches` / codegraph_files. | Flag for deletion/rewrite review. |

## Detection Recipes

### Changed code from diff

```bash
# Preferred PR scope
base=main
git diff --name-status "origin/$base"...HEAD

# Recent fallback
git diff --name-status HEAD~5..HEAD

# Include renames with old and new paths
git diff --name-status --find-renames "origin/$base"...HEAD
```

Treat `R old new` as both a removed old path and a changed new path. Related docs mentioning `old` are likely stale; docs mentioning `new` are coupled.

### Related docs by filenames/imports/symbols

For each changed code path derive:

- `basename`: `src/auth/client.ts` → `client`.
- `modulePath`: `src/auth/client`.
- import specifiers from changed lines.
- exported symbol names.

Fallback search:

```bash
git grep -n -- '<basename>' README.md CHANGELOG.md docs/ '*.md'
git grep -n -- '<modulePath>' README.md CHANGELOG.md docs/ '*.md'
git grep -nE 'from ["'"''][^"'"'']+["'"'']|require\(["'"''][^"'"'']+["'"'']\)' -- README.md docs/ '*.md'
```

Prefer ODIN `search` when operating inside the harness; the command lines are portable fallback recipes for a shell-only environment.

### Public export extraction fallback

Use codegraph when indexed. If not indexed, use syntax-aware extraction first, then regex fallback:

```bash
ast-grep --pattern 'export function $NAME($$$)' --lang ts src
ast-grep --pattern 'export class $NAME { $$$ }' --lang ts src
ast-grep --pattern 'export const $NAME = $VALUE' --lang ts src
ast-grep --pattern 'pub fn $NAME($$$)' --lang rust src
git grep -nE 'export (function|class|const|let|var)|export \{|module\.exports|pub (fn|struct|enum|trait)|^def |^class ' -- ':!node_modules' ':!generated'
```

Filter before reporting undocumented exports:

- private underscore names: `_internal`.
- test/spec files.
- `internal/`, `private/`, `utils/`, `helpers/` directories.
- entry-point aggregators: `index`, `main`, `app`, `server`, `cli`, `bin`.
- framework-loaded configs unless docs explicitly promise config API.

### Version mismatch

Sources of truth:

- `package.json`: `.version`.
- `Cargo.toml`: `[package].version`.
- `pyproject.toml`: `[project].version`.
- `setup.cfg`: `metadata.version` (MEDIUM if dynamic elsewhere).

Doc matches safe to edit only when line context labels it as product/package version:

```bash
git grep -nE '(version|Version|@)[[:space:]:="'"'']*[0-9]+\.[0-9]+\.[0-9]+' -- README.md docs/ '*.md'
```

Unsafe version-looking values: years, dates, protocol versions, API versions (`v1`), port numbers, dependency examples, Docker image tags for third-party images.

### CHANGELOG `## [Unreleased]`

Safe edit requirements:

1. `CHANGELOG.md` exists or user asked to update changelog.
2. Branch has user-visible code changes.
3. Entry is evidence-backed: commit subject or changed-file behavior; no marketing claims.
4. Insertion point is under `## [Unreleased]`; if missing, create it below the title.

Minimal insertion shape:

```markdown
## [Unreleased]

- Updated docs for `<changed surface>` after `<file>` changed.
```

Prefer existing subsections if present:

```markdown
### Added
### Changed
### Fixed
### Removed
```

Do not edit historical release sections.

## Safe-fix Boundary

Safe-fix:

1. `version-mismatch` exact semver replacement from manifest.
2. `missing-unreleased-changelog` insertion under `## [Unreleased]`.

Flag-only:

- removed/renamed exports.
- import path changes.
- stale code examples.
- undocumented public exports.
- docs describing dead code or wrappers.
- doc-drift / dead-doc suspicion.
- any version match without clear version label.
- changelog prose that would require product judgment.

If a fix is not in the safe-fix set, it must have `safeFix: false` and a non-empty `reasonFlagOnly`.

## Severity and Certainty

Severity describes user impact; certainty describes evidence quality.

- **HIGH severity**: docs point to removed public API, wrong install version, or changelog lacks required release surface.
- **MEDIUM severity**: examples/import paths/symbols probably stale but need semantic rewrite.
- **LOW severity**: weak coupling, missing mention, or maintenance suggestion.

- **HIGH certainty**: codegraph/LSP/AST/diff proves mismatch and doc line is exact.
- **MEDIUM certainty**: syntax-aware or manifest evidence exists, but intent remains ambiguous.
- **LOW certainty**: heuristic coupling only.

Never auto-fix based on LOW certainty. Never auto-fix flag-only categories even at HIGH certainty.
