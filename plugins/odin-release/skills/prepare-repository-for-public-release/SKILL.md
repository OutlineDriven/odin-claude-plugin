---
name: prepare-repository-for-public-release
description: 'Use when asked to prepare a repository for public launch or open source it. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Prepare repository for public release

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to open source a project, prepare a repository for public launch, make an existing public project official, or establish release automation for that launch. |
| Authority | Reversible local: writes only named local artifacts (repository files, CI configs, documentation, packaging, release automation); rollback is version control. No remote mutation. Do not alter external visibility, remote state, credentials, or data-at-rest outside the repository. |
| Side effect | Prepare repository files, CI, documentation, packaging, and release automation; perform history and secret checks; stop before the external repository-visibility switch unless the human explicitly performs or authorizes it. |
| Done | A clean outsider clone can build, test, use, and contribute; secrets and confidential history are cleared through an appropriate fresh-repository decision; licensing and package metadata agree; CI and release automation are hardened; only the human-controlled visibility action remains. |

## Inputs

Required: the repository root, supplied by the current working directory or the human. Optional: organizational license policy and publishing accounts, supplied by the human when available.

## Procedure

1. Detect organizational profile. Read git remotes and recent committer emails to determine whether the project belongs to an organization with an existing open-source policy. If an organizational policy is supplied, apply it throughout. If none is supplied and none is detected, proceed with generic guidance. Done when: the organizational affiliation is determined (named organization with policy, named organization without policy, or independent) and the policy to apply throughout is recorded.

2. Audit for secrets before any other change. This step determines whether the repository can proceed to publication or requires a fresh-repository approach. Ask whether the project ever handled credentials, API keys, client data, or confidential material, including test fixtures from client engagements. Scan the full git history with a dedicated tool (`gitleaks git .` or `trufflehog git file://.`) rather than manual inspection. Check beyond the git tree: CI logs, release artifacts, issue history, PR history, and wikis all become public with the repository. Do not proceed past this step until the audit outcome is known. Done when: the secret scan tool ran against the full git history and returned a result (findings or clean), and the beyond-tree check is recorded, or the scan tool is unavailable and the stop is reported.

3. Decide on history approach. If secrets were found in history: recommend a fresh-repository approach: copy the current tree to a new repository, commit fresh, and archive the old repository privately. Reject the following rationalizations as not resolving the finding:
   - The credential was revoked. Revoked credentials still expose infrastructure names, internal URLs, and targeting patterns.
   - History will be rewritten with git-filter-repo. Rewrites miss forks, clones, caches, and CI artifacts.
   - It was only test data. Fixtures derived from client engagements or production systems are confidential regardless of labeling.
   If no secrets were found, proceed.
   Done when: the history approach is decided as fresh-repository (secrets found) or proceed (no secrets found), and if fresh-repository, each rejected rationalization is addressed so the user cannot fall back on it.

4. Run readiness check. Inspect the repository for presence indicators: README, LICENSE, CONTRIBUTING, SECURITY.md, CI configuration, tests, and semver tags. Identify tracked files that commonly contain secrets (environment files, credential stores, private key paths). Treat gaps as discussion prompts, not hard failures. A research prototype does not need the same readiness as a flagship library. Done when: each presence indicator is recorded as present or missing, and each tracked secret-candidate file is named so step 5 through 10 know what to fill.

5. Harden documentation.
   a. Confirm or draft a README that contains: what the project is and the problem it solves; how to install it (package manager, container, or build from source: a fresh-clone build must work using only what is in the repository); how to use it (at least one concrete, copy-pasteable example); how to contribute (inline or via CONTRIBUTING.md); and the license name.
   b. Add or confirm a SECURITY.md with vulnerability-reporting instructions (a contact address or GitHub private vulnerability reporting).
   c. Add a code of conduct when the project expects outside contributors.
   Done when: the README contains all five required sections, SECURITY.md exists with reporting instructions, and a code of conduct is present or the project does not expect outside contributors.

6. Finalize licensing. Choose a license in this order: apply the organizational policy if one was loaded in step 1; otherwise choose Apache 2.0 as the permissive default; AGPLv3 when private modification by competitors is a real concern; Creative Commons for non-code artifacts. Then: add a LICENSE file at the repository root with the full license text; set SPDX identifiers in all package manifests; state the license in the README; and verify all three agree. For copyright lines, use the current year only: `Copyright (c) 2026 Example Org <contact@example.org>`. When taking over an existing open-source project, preserve the existing license and add a new copyright line below it; do not relicense unless every copyright holder agrees. Done when: the LICENSE file, SPDX identifiers in every package manifest, and the README license statement all name the same license, and the copyright line uses the current year.

7. Harden CI and tests. Confirm the test suite exists and passes. Verify CI runs tests on every PR across the supported language-version and platform matrix. Enforce formatting and linting in CI so style debates never reach review. Respect existing tooling: do not replace working formatters, linters, or type checkers as part of open-sourcing; warn the maintainer if a tool lags current generations and let them decide; only add a missing category (no type checker, no formatter) when the ecosystem is absent entirely. Harden the CI workflows themselves: pin third-party actions to full commit SHAs; enable Dependabot for github-actions; set least-privilege `permissions:` blocks (start from `permissions: {}`); audit with `zizmor .github/workflows/` and lint with `actionlint`. Done when: the test suite passes, CI runs tests on every PR across the version and platform matrix, formatting and linting are enforced, third-party actions are pinned to SHAs, `permissions:` blocks are least-privilege, and `zizmor` and `actionlint` report clean or their findings are addressed.

8. Harden local repository settings. Add `.editorconfig` for whitespace consistency. Configure label conventions when more than one issue or PR needs them. Done when: `.editorconfig` exists and label conventions are documented or configured locally.

9. Harden release and versioning automation. Tag releases `vX.Y.Z` following semver; use `-rc.N` or `-pre.N` suffixes for pre-releases. Make releases CI-driven: a tag push triggers build, packaging, and upload with no manual steps. Publish packages under an organization-owned account, not a personal one. Use trusted publishing (OIDC) instead of long-lived tokens wherever the package index supports it. Done when: a tag push triggers the full release pipeline (build, package, upload) with no manual steps, and the publishing account is organization-owned using trusted publishing where the index supports it.

10. Apply language-specific packaging. Identify the project's languages from marker files: `pyproject.toml` or `setup.py` (Python), `CMakeLists.txt` or `Makefile` (C/C++), `Cargo.toml` (Rust), `go.mod` (Go), `package.json` (JavaScript/TypeScript), `Gemfile` or `*.gemspec` (Ruby). For the detected language, apply: reproducible builds from a fresh clone; CI-driven releases; trusted publishing or organization-owned accounts; license metadata in the package manifest. For all other ecosystems, apply these cross-cutting principles. Done when: each detected language has its marker file identified and the four packaging principles (reproducible build, CI-driven release, trusted or org-owned publishing, license metadata) are applied or recorded as not applicable with a reason.

11. Final review before visibility switch. From an outsider's perspective: clone into a clean directory and follow the README's build instructions verbatim; do they work with no tribal knowledge? Re-run the readiness check and confirm remaining gaps are deliberate choices stated to the user. Confirm the secrets audit (step 2) was completed and its outcome is documented. Done when: a clean-clone build following the README verbatim succeeds with no tribal knowledge, the readiness check re-runs with remaining gaps stated as deliberate, and the secrets audit outcome is documented.

12. Stop at the visibility switch. Do not alter repository visibility, external hosting settings, remote branch protection, DNS, CDN, or any other external state. Report that the visibility action remains and requires explicit human authorization. Include in the human handoff: apply branch protection on the default branch (block force pushes and require PRs), set required status checks so PRs cannot merge with failing tests, and enable Dependabot or Renovate for dependency and Actions updates with grouping and a cooldown window (for example, 7 days). Done when: no external state was altered and the report names the visibility switch as the remaining human-controlled action.

## Failure and recovery

- Secrets found in history: stop immediately after step 3 and return a blocked result naming the finding. Do not proceed to publication steps. Report the fresh-repository recommendation. The done predicate does not hold.
- Build or test failure during final review: report the failure verbatim and do not claim the done predicate holds. The outsider's build experience is the proof of success.
- Organizational policy conflict: stop and report the conflict. Do not override an organizational policy.
- Remote or external state error (CI, package index, hosting): report the error, do not retry against a different target, and return a blocked result.
- Readiness gaps: report the gaps as discussion prompts. Do not block publication for a research prototype that does not need production readiness signals.

A blocked result names the failure class, the finding or gap, and the exact action not completed.

## Output

On success, return a structured summary: list of files created or updated, the applied license and SPDX identifiers, the CI hardening actions taken, the release automation configuration, the detected language-specific packaging setup, the readiness gaps that remain with their rationale, and the confirmed outcome of the secrets audit. State that the visibility switch is the human-controlled next action. On blocked: return the failure class, finding or gap, and the action not completed.
