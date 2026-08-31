---
name: deps-upgrade
description: 'Use when dependency upgrades need tiered batches for CVEs, a major release, forced compatibility, scheduled hygiene, or a pre-release lockfile audit. Not for cadence-driven sweeps — use dependency-sweeper; not for PR queue triage — use dependency-pr-queue-triage.'
---

# Deps upgrade

## Contract

| Field | Bound contract |
|---|---|
| Trigger | CVE remediation, major upstream release, compatibility-forced sweep, scheduled dependency hygiene, or pre-release lockfile audit. |
| Authority | Reversible local writes only: manifests, lockfiles, and compatibility code in the current repository, recorded as concern-atomic local commits, plus a temporary lockfile snapshot outside the tree for the pre/post audit. No push, publish, deploy, credential, paid, or remote mutation. Rollback path is version control: revert the campaign commits or reset to the recorded pre-campaign HEAD. |
| Side effect | Updates local manifests, lockfiles, and compatibility code; creates concern-atomic local commits. No feature work, no refactors beyond compatibility code, no silent lockfile drift. |
| Done | Selected upgrades are locked, tested at the required depth, migration guidance applied for majors, license/SBOM churn checked, and the final vulnerability scan is recorded. |

## Inputs

Must be supplied: a working repository with VCS history; toolchains for each in-scope ecosystem; and operator scope directives: which ecosystems and paths are in scope, the highest tier allowed (patch, minor, or major), and any package allowlist/blocklist. Optional: pinned target versions for specific majors, a CVE scanner choice (defaults to the ecosystem canonical scanner below), and freeze-window or deadline constraints that cap the tier ceiling. Before the first mutation, verify each required tool exists (`command -v`) and run the full test suite on the clean tree as the baseline; missing tools or a red baseline stop the run before anything changes.

## Procedure

1. **Gate (no mutation yet)**: stop without changing anything if any holds: active feature branch with high churn; pre-release freeze window; mid-incident; the task is an API-break-driven refactor rather than a dependency upgrade. Report which gate tripped. Done when: all gates pass or the tripped gate is reported without mutation.
2. **Bound scope**: fix from the operator directives the ecosystem list, path scope, tier ceiling, and allowlist/blocklist. Never widen during the run; findings outside scope become report items, not work. Done when: all scope fields are frozen.
3. **Baseline**: record the pre-campaign HEAD SHA and snapshot every lockfile to a temporary directory; this snapshot is the audit baseline and the rollback anchor. Done when: the HEAD and every lockfile snapshot are recorded.
4. **Inventory**: enumerate manifests and lockfiles across the in-scope ecosystems. Canonical names are often extensionless (`go.mod`, `Gemfile`, `pom.xml`), so filter on filenames, not extensions; `fd` takes one glob per call, so anchor on canonical filenames with one regex:

   ```sh
   fd -t f '^(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.(toml|lock)|pyproject\.toml|poetry\.lock|requirements.*\.txt|Pipfile\.lock|go\.(mod|sum)|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|libs\.versions\.toml|gradle\.lockfile|Gemfile(\.lock)?|.*\.gemspec|.*\.opam|dune-project|opam\.locked|mix\.(exs|lock)|composer\.(json|lock))$'
   ```

   Add ecosystem-specific names the project uses beyond this list (`Pipfile`, `Brewfile`, `flake.nix`, `shard.yml`, `pubspec.yaml`). Done when: every in-scope manifest and lockfile is inventoried.
5. **Scan outdated** with the per-family commands and capture each report (read reports and later CHANGELOGs with `bat -P -p -n`, never `cat`):

   | Family | Outdated scan | Upgrade command | Lockfile |
   |---|---|---|---|
   | Rust | `cargo outdated`, `cargo audit` | `cargo update`, `cargo upgrade` | `Cargo.lock` |
   | Python (Poetry) | `poetry show --outdated` | `poetry update`, `poetry add <pkg>@latest` | `poetry.lock` |
   | Python (pip-tools) | `pip list --outdated`, `pip-audit` | `pip-compile --upgrade`, `pip-sync` | `requirements.txt` |
   | JavaScript/TypeScript (pnpm) | `pnpm outdated`, `pnpm audit` | `pnpm update`, `pnpm up --latest` | `pnpm-lock.yaml` |
   | JavaScript/TypeScript (npm) | `npm outdated`, `npm audit` | `npm update`, `ncu -u` | `package-lock.json` |
   | Go | `go list -u -m all`, `govulncheck` | `go get -u <pkg>@latest`, `go mod tidy` | `go.sum` |
   | Java/Kotlin (Gradle) | `gradle dependencyUpdates` | edit `libs.versions.toml`, `gradle dependencies --refresh-dependencies` | `gradle.lockfile` |
   | Java/Kotlin (Maven) | `mvn versions:display-dependency-updates` | `mvn versions:use-latest-releases` | `pom.xml` |
   | OCaml | `opam list --upgradable` | `opam upgrade <pkg>`, `opam pin <pkg>.<ver>` | `*.opam.locked` |

   A family whose scan tool is missing is excluded from scope and reported. Tooling mandates for the whole run: `fd` (not `find`), `difft` (not `diff`), `bat -P -p -n` (not `cat`), `git grep -n -F` (not plain `grep`). Done when: each included family has a captured outdated and advisory report, and exclusions are recorded.
6. **Categorize**: bin every candidate as **patch**, **minor**, or **major** against the tier ceiling; candidates above the ceiling are reported only. Done when: every candidate has a tier and in-scope or report-only disposition.
7. **Patch batch**: bump all patches at once; confirm the diff is lockfile-only; run the full test suite; commit everything including the lockfile diffs as `chore(deps): patch sweep`. Floating ranges that skip the lockfile commit create non-reproducible builds; the lockfile diff is always committed. Done when: the patch batch is committed with a green full suite or reverted.
8. **Minor batch**: bump minors together; read each minor's CHANGELOG; run a smoke test (minors can shift behavior); commit as `chore(deps): minor sweep`. Done when: the minor batch is committed with changelogs reviewed and smoke test green, or reverted.
9. **Major, one per commit**. For each major bump, before writing any code:
   - Read the upstream `CHANGELOG.md` / `MIGRATION.md` / release notes; a major bump without primary-source review is forbidden.
   - Identify removed, renamed, behavior-changed, and default-changed APIs.
   - Check for an upstream-supplied codemod or migration tool and prefer it.
   - Search direct usage of each changed API with `git grep -n -F '<symbol>'` and `ast-grep -p '<pattern>'`.
   - Verify the peer-dependency and runtime-version compatibility matrix.
   - Verify the license has not changed in a blocking direction.
   - Verify the SBOM diff will match the expected dependency-tree change.

   Then apply the migration guidance (codemod or manual edits, confined to compatibility code), run the full suite plus adversarial tests with deprecation warnings enabled as errors, validate any hot path with `hyperfine` against the previous commit, and commit `chore(deps)!: bump <pkg> <old>→<new>`. Never disable deprecation or audit signals to make a gate pass; a warning that cannot be fixed now is recorded as follow-up debt. Done when: each major is one green commit with migration, compatibility, license, SBOM, and performance evidence.
10. **Lockfile audit**: compare the pre- and post-campaign snapshots with `difft` (never `diff`; lockfiles are machine-generated and coarser diffs misread them). Check transitive churn: surface dependencies can look clean while a transitive bump carries the CVE fix, or a new transitive CVE. Done when: expected and unexpected transitive churn are recorded.
11. **Re-scan**: run the CVE scanner again post-upgrade (`cargo audit`, `pip-audit`, `pnpm audit` / `npm audit`, `govulncheck`, per family). Read the output and record it; auto-fix flags that bypass reading (`npm audit fix --force`) are forbidden. Done when: every included family has recorded post-upgrade scan results.
12. **Stop at the boundary**: a major whose migration requires API-break propagation across the codebase beyond compatibility code is not started: it is reported. New CVEs surfaced by the re-scan are recorded, not remediated, inside this campaign. Done when: boundary-crossing majors and newly surfaced CVEs are report items, not campaign work.

## Failure and recovery
- **Gate refusal** (step 1): no mutation; report the tripped gate and stop.
- **Red baseline** (inputs validation): no mutation; report the pre-existing failures and stop; upgrade results would not be attributable.
- **Test failure in the patch or minor batch**: restore the last green state (`git revert` the batch commit if committed, otherwise `git restore` the touched paths), then re-run the batch one package at a time to isolate the offender, or drop that package and record it. Never leave a partial bin failing or uncommitted.
- **Major bump failure**: revert the major's commit and record the blocked package with its migration blockers. A missing upstream migration guide or a failing codemod is the same outcome: revert and record; do not improvise an unreviewed migration.
- **Missing tooling**: a family without its scan or upgrade tool is excluded and reported; a missing CVE scanner is fatal: the done predicate requires the final scan, so the run is `blocked`, never `done` with the scan skipped.
- **Partial-result rule**: every committed bin is a green, self-consistent state, so recovery always lands on a bin boundary; operator work outside campaign commits is never discarded.
- **Blocked result**: report `blocked` with the failing gate, the SHA reverted to, and the remaining unprocessed candidates.

## Output
A terminal `done` or `blocked` upgrade report with sections in order: concern-atomic commits, per-package tiers and versions, checks per bin, major migration notes, license and SBOM churn, lockfile audit, post-upgrade CVE scans, follow-up items.

## Provenance

Origin: ODIN project-owned `odin-1.x-current-skill`, path `skills/deps-upgrade/SKILL.md`; no pinned upstream revision. License: project-owned. Adapted to the ODIN 2.0 literal format (section order, authority translation, semantic minimum); the retained mechanism is manifest/lockfile dependency upgrade under per-tier gates with CVE re-scan.
