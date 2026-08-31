# Ecosystem advisory queries

Per-ecosystem advisory sources and query methods. Load the section for the detected ecosystem before step 4 of the procedure.

## npm

Run `npm audit --json` against the lockfile when present. When no lockfile exists, query the GitHub Advisory Database API for each direct dependency name and declared version range. Record advisory ID, severity, affected version ranges, and fixed version for each match.

Without a lockfile, transitive dependencies are not enumerated and are marked unassessable with reason `no-lockfile`.

## PyPI

Query the OSV API (`https://api.osv.dev/v1/query`) with the package name and resolved version. The request body is:

```json
{
  "package": { "name": "<package>", "ecosystem": "PyPI" },
  "version": "<resolved-version>"
}
```

When no lockfile exists, use the declared version constraint from `requirements.txt` or `pyproject.toml` as the version. Transitive dependencies are marked unassessable with reason `no-lockfile`.

Record advisory ID, severity, affected version ranges, and fixed version for each match.

## Go

Parse `go.mod` for direct dependencies (require blocks without `// indirect`) and their declared versions. When `go.sum` is present, confirm module integrity; `go.mod` carries the version.

Query the Go vulnerability database for each module. The database is served at `https://vuln.go.dev` and exposes JSON indexes:

- `https://vuln.go.dev/index/modules` lists every module with known vulnerabilities.
- `https://vuln.go.dev/ID/<vuln-id>.json` returns the full advisory for a specific vulnerability ID.
- `https://vuln.go.dev/<module-path>.json` returns all vulnerabilities for a module path.

For each direct dependency, fetch `https://vuln.go.dev/<module-path>.json`. If the response is a JSON array of vulnerability entries, check each entry's `affected` ranges against the declared version. Record advisory ID (`id`), severity (derived from `database_specific.severity` or the CVSS score), affected version ranges, and fixed version for each match.

When `go.sum` is absent, direct dependencies are assessed against their `go.mod` declared versions. Transitive dependencies (those with `// indirect` in `go.mod`) are marked unassessable with reason `no-lockfile` because their resolved versions cannot be confirmed without `go.sum`.

A `404` response for a module path means no known vulnerabilities: classify the dependency as assessed-clean.
