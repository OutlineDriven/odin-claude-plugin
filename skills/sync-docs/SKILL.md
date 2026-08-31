---
name: sync-docs
description: 'Detect docs-vs-code drift from a diff and correct safe issues. Use when the user says sync docs or update changelog after a behavioral change. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Sync docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'sync docs' or 'update changelog' after a behavioral change. |
| Authority | Reversible local writes only. Edit named local doc files and write a fix ledger. Rollback reverts the edited files to their pre-edit content. |
| Side effect | Applies only safe fixes (version bump plus CHANGELOG Unreleased entry) and writes a fix ledger with before/after evidence. |
| Done | Safe fixes are applied or explicitly unavailable, and all residual drift is flagged with file:line evidence and reasons. |

## Inputs

- **Mode**: `report` (default) or `apply`. `apply` still edits only safe-fix issues.
- **Scope**: `recent` (changed files from current branch or last few commits), `before-pr` (branch diff against PR base), or `all` (all tracked code and docs).
- **Base**: explicit base ref preferred. If absent, resolve the default branch, then fall back to `HEAD~5` for `recent`.

## Procedure

1. **Pick scope and base.** Refuse ambiguous review scope when the user expects PR readiness.

   ```bash
   # before-pr: whole branch against the remote default branch
   remote_head=$(git symbolic-ref --short refs/remotes/origin/HEAD || printf origin/main)
   base=${remote_head#origin/}
   git diff --name-status "origin/$base"...HEAD

   # recent: fallback when default-branch diff fails
   git diff --name-status HEAD~5..HEAD

   # all: tracked docs and code inventory
   git ls-files
   ```

   In ODIN tool mode, use `bash` only for git commands; use `find`, `search`, `read`, `lsp`, `ast_grep`, and `edit` for everything else.

2. **Compute changed code.** Keep only source/config/package files that can change docs. Exclude pure docs, vendored/generated paths, lockfiles unless version docs mention package manager output, and deleted files that were never public.

   Output shape per file:

   ```json
   {"status":"M|A|D|R","oldPath":"src/old.ts","path":"src/new.ts","basename":"client","modulePath":"src/new","kind":"source|manifest|config|cli"}
   ```

3. **Extract coupling terms.** For each changed code file derive:

   - Filename stem: `client`, `auth-server`.
   - Full path and path without extension: `src/auth/client.ts`, `src/auth/client`.
   - Import strings from the diff: `from "pkg/auth"`, `require("pkg/auth")`, dynamic imports.
   - Exported/public symbols via codegraph when indexed, or via language syntax fallback:

     ```bash
     ast-grep --pattern 'export function $NAME($$$)' --lang ts <file>
     ast-grep --pattern 'export class $NAME { $$$ }' --lang ts <file>
     ast-grep --pattern 'pub fn $NAME($$$)' --lang rust <file>
     git grep -nE '^(export |pub |def |class |func )' -- <file>
     ```

4. **Discover related docs.** Search live doc surfaces: `README.md`, `CHANGELOG.md`, `docs/**/*.md`, `*.md` at repo root. For each coupling term search docs and record `doc`, `line`, `term`, `referenceType` (`filename`, `full-path`, `import`, `symbol`, `url-path`, `version`).

   ```bash
   git grep -n -- '*.md' README.md CHANGELOG.md docs/ -- '<term>'
   git grep -nE 'from ["'"''][^"'"'']+["'"'']|require\(["'"''][^"'"'']+["'"'']\)' -- '*.md'
   ```

   ODIN tool equivalent: `search` each escaped term across `README.md`, `CHANGELOG.md`, `docs/**/*.md`, then `read` surrounding lines.

5. **Classify issues.** Severity taxonomy:

   - **HIGH**: manifest version mismatch with exact current version; deleted/renamed public export still documented with symbol proof; changed import path in fenced example where the old path no longer resolves.
   - **MEDIUM**: stale code example that mentions a changed file/symbol but needs semantic review; undocumented public export after entry-point/internal filtering; docs describing codegraph-reported dead code.
   - **LOW**: doc-drift from zero code-coupling or weak filename-only coupling; broad stale prose suspicion.

   Ignore patterns: generated docs unless explicitly in scope, vendored docs, changelog append-only entries (intentionally low code coupling), versioned snapshots unless in scope.

6. **Apply safe fixes only** (in `apply` mode):

   - **Version bump**: replace stale semver strings in docs with the manifest version when the line clearly labels a version (`version`, package badge, install snippet with `@x.y.z`). Avoid broad numeric replacement. Replacement value must come from the manifest; matched line must be version-labeled.
   - **CHANGELOG `## [Unreleased]` entry**: insert a minimal bullet under the existing section, or create the section at the top if absent. Use commit messages or changed-file summaries; do not invent product claims. Entry must cite commit/file evidence and land under `## [Unreleased]`.

   Do not auto-edit removed exports, import paths, examples, undocumented exports, dead-code docs, or doc-drift prose. Those require human intent.

7. **Flag the rest.** Emit a compact report sorted by severity then file path:

   ```text
   HIGH docs/api.md:42 removed-export `createClient` no current public symbol; changed in src/client.ts
   MEDIUM README.md:88 stale-code-example imports old path `pkg/client`; verify replacement `pkg/auth/client`
   LOW docs/legacy.md:? doc-drift zero code-coupling; no live filename/import/symbol references
   ```

8. **Return fix ledger.** For every edit record `file`, `line`, `type`, `before`, `after`, and evidence source. For every flag-only item record `reasonFlagOnly`.

### Detection recipes

When the repo is indexed, use the codegraph MCP for symbol truth:

- `codegraph_search`: locate changed public symbols by name.
- `codegraph_callers` / `codegraph_callees`: determine whether docs describe dead wrappers or removed API surfaces.
- `codegraph_impact`: judge blast radius before calling an export undocumented.
- `codegraph_files`: confirm entry points and module layout.

Fallback when not indexed:

```bash
git grep -nE 'export (function|class|const|let|var)|export \{|module\.exports|pub (fn|struct|enum|trait)|^def |^class ' -- ':!node_modules' ':!generated'
ast-grep --pattern 'import $X from $Y' --lang ts src
ast-grep --pattern 'from $M import $$$N' --lang python .
```

Per-ecosystem manifest version fields and changelog evidence commands:

- **Node/npm**: `node -p 'require("./package.json").version'`; changelog at `CHANGELOG.md`.
- **Python**: `python -c 'import tomllib; print(tomllib.load(open("pyproject.toml","rb"))["project"]["version"])'`; or `__version__` in `__init__.py`.
- **Rust/Cargo**: `cargo metadata --no-deps --format-version 1 | jq '.packages[0].version'`; changelog at `CHANGELOG.md`.
- **Go**: `grep -m1 'version' go.mod` or module path version suffix.
- **Ruby**: `grep VERSION lib/*/version.rb`.

Read the relevant recipe when the change touches a manifest and docs mention a version, or when gathering changelog evidence in `apply` mode.

### Anti-patterns

- **Regex-only confidence on public API removal**: require codegraph, LSP, ast-grep, or exact diff evidence before HIGH.
- **Mass replacing version-looking numbers**: examples, ports, years, protocol versions, and dates are not package versions.
- **Fixing examples by guess**: changed import path is usually flag-only unless the diff explicitly contains a one-to-one rename.
- **Treating CHANGELOG as drift**: append-only history has intentionally low code coupling.
- **Reporting generated/versioned docs as stale**: they are snapshots unless explicitly in scope.

## Failure and recovery
| Failure class | Response |
|---|---|
| No diff or empty scope | Stop. Report the resolved base and scope; do not fabricate drift. |
| Ambiguous base ref | Stop. List candidate refs and ask the user. |
| Manifest parse failure | Skip the version-bump safe fix for that manifest; flag the file as MEDIUM with reason. |
| Post-edit read mismatch | Revert the edit; reclassify the issue as flag-only with `reasonFlagOnly`. |
| Codegraph unavailable | Use syntax fallback; downgrade confidence to MEDIUM for symbol-dependent claims. |

Partial results rule: if some coupling terms resolve and others do not, report resolved issues and flag unresolved terms. Never widen scope to compensate for missing evidence.

Rollback: revert any edited file to its pre-edit content. The fix ledger records before/after for every edit.

## Output
```json
{
  "opCell": "correct",
  "scope": "recent|all|before-pr",
  "base": "origin/main",
  "changedCode": [{"status":"M","path":"src/client.ts"}],
  "relatedDocs": [{"doc":"README.md","line":42,"term":"createClient","referenceType":"symbol"}],
  "fixesApplied": [{"type":"version-mismatch","file":"README.md","line":12,"before":"1.2.0","after":"1.3.0"}],
  "flagged": [{"type":"stale-code-example","severity":"MEDIUM","file":"docs/api.md","line":88,"reasonFlagOnly":"example intent cannot be inferred safely"}]
}
```

Completion means safe fixes are applied or explicitly unavailable, and all remaining drift is flagged. A clean report with no edits is valid only after the diff-to-doc mapping and taxonomy pass ran.

## Provenance

Origin: current ODIN skill tree, candidate `current:current-d:current:sync-docs`. No pinned revision; adapted from the existing `skills/sync-docs/SKILL.md` body. Project-owned; no third-party expression copied. License: project-owned.
