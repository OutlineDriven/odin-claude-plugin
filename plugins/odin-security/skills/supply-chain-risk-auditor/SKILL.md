---
name: supply-chain-risk-auditor
description: 'Use when assessing npm, PyPI, or Go dependency supply-chain risk. Produces deterministic findings.json and report.md with lockfile-aware advisories, three-state coverage, and separate remediation guidance. Don''t use for remote or irreversible changes.'
---

# Supply chain risk auditor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to assess third-party package or dependency supply-chain risk for a project using npm, PyPI, or Go manifests, with lockfile-wide advisory coverage where supported. |
| Authority | Reversible-local: writes only the named local artifacts (`findings.json`, `report.md`) outside the audited repository. Delete both files to roll back. |
| Side effect | Never installs, builds, imports, or executes the audited project or dependencies and never reads dependency source; performs network metadata queries and writes deterministic findings.json plus report.md outside the audited repository by default. |
| Done | The deterministic collector measured at least one criterion and the report contains direct-dependency risk findings, supported lockfile-wide version-matched advisories, three-state assessed-clean/assessed-flagged/unassessable coverage, exact measured data, and clearly separated remediation judgment without treating unavailable data as risk or absence as safety. |

## Inputs

1. **Project path** (required): directory containing a manifest file (`package.json`, `requirements.txt` / `pyproject.toml`, or `go.mod`).
2. **Lockfile** (optional): if present (`package-lock.json`, `poetry.lock`, `Pipfile.lock`, `go.sum`), the auditor resolves transitive dependencies and matches advisories to exact resolved versions.
3. **Output directory** (required): directory where `findings.json` and `report.md` are written. Defaults to a directory adjacent to the audited project.

## Refusal

- Missing manifest: return `findings.json` with an empty dependencies array and all counts zero; `report.md` states no recognized manifest was found.
- Network failure or rate limit: mark affected queries as unassessable; return partial results for completed queries. Never retry with widened scope.
- Malformed advisory response: mark the affected dependency as unassessable; do not guess vulnerability status.
- Any step would require execution: stop and mark the dependency as unassessable. The procedure never installs, builds, imports, or executes the audited project or its dependencies. It never reads dependency source code.

## Procedure

1. **Identify the ecosystem** from the manifest file type. If no recognized manifest exists, mark all dependencies as unassessable and proceed to step 7. Done when: the ecosystem is identified or all dependencies are marked unassessable.
2. **Parse the manifest** to extract direct dependencies with their declared version constraints. Done when: direct dependencies are enumerated.
3. **If a lockfile is present**, parse it to resolve exact versions and enumerate transitive dependencies. Done when: exact versions and transitive dependencies are enumerated, or no lockfile is confirmed absent.
4. **For each dependency, query the ecosystem advisory source.** Load `references/ecosystem-queries.md` and apply the query method for the detected ecosystem (npm, PyPI, or Go). Record advisory ID, severity, affected version ranges, and fixed version for each match. Done when: every dependency has been queried.
5. **Assess each direct dependency into one of three states:**
   - **assessed-clean**: advisory query succeeded and returned no matching vulnerabilities for the resolved version.
   - **assessed-flagged**: advisory query returned one or more matching vulnerabilities.
   - **unassessable**: advisory source was unreachable, rate-limited, returned malformed data, or the dependency has no resolved version.
   Done when: every direct dependency has a state.
6. **Compile `findings.json`** with the structure: `{ dependencies: [{ name, version, ecosystem, direct, state, advisories }], summary: { total, assessed_clean, assessed_flagged, unassessable } }`. Done when: `findings.json` is written.
7. **Generate `report.md`** containing: direct-dependency risk findings with per-dependency state and advisory detail, lockfile-wide version-matched advisories for transitive dependencies (if the lockfile was available), coverage summary with counts for each of the three states, and remediation recommendations prioritized by severity and clearly separated from measured findings. Done when: `report.md` is written.

## Failure modes

- Rollback: delete `findings.json` and `report.md` from the output directory.

## Output

`findings.json` (structured JSON with per-dependency risk assessment, advisory matches, and coverage summary) and `report.md` (human-readable report with direct-dependency findings, lockfile-wide advisories, three-state coverage, and separated remediation guidance).
