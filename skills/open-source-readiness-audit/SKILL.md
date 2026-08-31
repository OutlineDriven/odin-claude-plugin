---
name: open-source-readiness-audit
description: 'Use when the user asks whether a repository is ready for public release or wants a gap assessment. Returns a prioritized report covering secrets, docs, licensing, CI, packaging, and release gaps. Not for choosing or applying a license — use open-source-license-selection.'
---

# Open source readiness audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks whether a repository is ready for public release or wants a gap assessment without yet asking the agent to prepare or publish it. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Inspect history, repository files, CI, documentation, licensing, packaging, release automation, and settings, then return a prioritized readiness report without changing visibility. |
| Done | The report records secret-history risk, outsider build and use readiness, license consistency, CI and supply-chain posture, packaging and release gaps, and which omissions are deliberate. |

## Inputs

- **Repository path** (required): the local checkout to audit.
- **Language or ecosystem hint** (optional): skip detection from marker files if supplied.

## Procedure

1. **Secrets audit — highest priority, do first.** Scan the full git history for secrets using `gitleaks git .` or `trufflehog git file://.` if available; otherwise inspect recent commits manually for credential patterns. Check beyond the git tree: GitHub Actions logs and artifacts, old releases, issue and PR history, and the repository wiki all become public with the repository. If secrets are found, flag as critical blocker and recommend a fresh repository (copy the current tree, commit, archive the old repository privately). Reject these rationalizations:
   - *"The key was revoked, so the history is fine."* Revoked credentials still leak infrastructure names, internal URLs, and patterns attackers use for targeting.
   - *"We'll rewrite history with git-filter-repo."* Rewrites miss forks, clones, caches, and CI artifacts; the fresh-repository approach does not.
   - *"It's only test data."* Fixtures derived from client engagements or production systems are confidential regardless of how they are labeled.
   Done when: the full git history and beyond-tree surfaces are scanned for secrets with findings classified.

2. **Documentation completeness.** Confirm the README explains what the project is and what problem it solves, how to install it (a fresh-clone build must work using only what is in the repository), how to use it with at least one concrete copy-pasteable example, how to contribute, and the license. Check for `SECURITY.md` with vulnerability-reporting instructions. Check for API documentation linked from the README. Check for a code of conduct if the project expects outside contributors. Done when: documentation completeness is assessed across all six checks.

3. **License verification.** Confirm a `LICENSE` file exists. Verify SPDX identifiers are set in package metadata. Verify the license is stated in the README. Confirm all three agree. No license means not open source regardless of visibility. Done when: license consistency across LICENSE file, package metadata, and README is verified.

4. **CI and test posture.** Confirm the test suite exists and passes on the default branch. Verify CI runs tests on every PR across the supported language-version and platform matrix. Check that formatting and linting are enforced in CI. Check for a coverage gate. Check that third-party actions are pinned to full commit SHAs. Check that Dependabot or Renovate is enabled for `github-actions`. Verify least-privilege `permissions:` blocks in workflows. Done when: CI and test posture is assessed across all six checks.

5. **Repository settings.** Check for branch protection on the default branch (no force pushes, PRs required). Check for required status checks. Check for Dependabot or Renovate for dependency updates with grouped updates and a cooldown window. Check for `.editorconfig`. Check for label conventions if multiple issues or PRs exist. Done when: repository settings are assessed across all five checks.

6. **Release and versioning.** Check for semver tags (`vX.Y.Z`). Verify releases are CI-driven (tag push triggers build, packaging, and upload). Check that packages are published under an organization-owned account with trusted publishing (OIDC) where supported. Done when: release and versioning posture is assessed across all three checks.

7. **Language-specific packaging.** Identify the project's languages from marker files (`pyproject.toml`, `Cargo.toml`, `go.mod`, `package.json`, `Gemfile`, `CMakeLists.txt`, `Makefile`). Verify language-specific packaging, publishing metadata, and quality tooling are in place. For unknown ecosystems, verify reproducible builds from a fresh clone, CI-driven releases, and license metadata in the package manifest. Done when: language-specific packaging is assessed for all identified languages.

8. **Compile the report.** Organize findings by severity:
   - **Critical**: secrets in history, missing license, broken build.
   - **High**: missing SECURITY.md, no CI, no branch protection, no test suite.
   - **Medium**: missing CONTRIBUTING, no coverage gate, unpinned actions, no `.editorconfig`.
   - **Low**: missing code of conduct, no label conventions, no API docs.
   Mark each gap as blocker, recommended, or deliberate omission. State which omissions are intentional choices for this project's scope. Done when: the report is compiled with every finding classified by severity and intentionality.

## Failure and recovery

- **Repository inaccessible**: stop immediately, report the path error, do not proceed with other checks.
- **Secret scanning tools unavailable**: note the limitation, recommend manual review or tool installation, continue with remaining checks.
- **Check cannot be completed** (missing access, missing tooling, ambiguous state): mark as "not verified" rather than assuming pass or fail.
- **Partial results**: always return the report with whatever was completed; never suppress findings because other checks are incomplete.

## Output

One prioritized readiness report: secret-history risk, outsider build/use readiness, license consistency, CI/supply-chain posture, packaging/release gaps, deliberate omissions vs genuine gaps, recommended next steps by severity, in that order.
