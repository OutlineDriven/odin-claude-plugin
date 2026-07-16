# Native Detection Recipes

## Manifest versions

Read manifests directly and compare against doc mentions:

- JavaScript/TypeScript: `package.json` `version`.
- Rust: `Cargo.toml` `package.version`.
- Python: `pyproject.toml` `project.version`, fallback `setup.cfg` / `setup.py` only as MEDIUM.
- Go: module version is usually tag-derived; do not auto-fix unless a manifest line gives an exact version.

Search docs for labeled semver:

```bash
git grep -nE '(version|v|@)[[:space:]:="'"'']*[0-9]+\.[0-9]+\.[0-9]+' -- '*.md'
```

## CHANGELOG evidence

Use commits only as evidence, not as prose authority:

```bash
git --no-pager log --oneline --no-merges "origin/$base"..HEAD
git diff --name-only "origin/$base"...HEAD
```

If `CHANGELOG.md` has no `## [Unreleased]`, create one immediately below the title. If it exists, insert under an appropriate subsection only when the subsection already exists; otherwise add a plain bullet under `## [Unreleased]`.
