---
name: open-source-readiness-audit
description: 'Use when the user asks whether a repository is ready for public release or wants a gap assessment. Not for choosing or applying a license: use open-source-license-selection.'
---

# Open source readiness audit

Determine if a repository is ready for public release via a read-only gap assessment.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks whether a repository is ready for public release or wants a gap assessment without yet asking the agent to prepare or publish it. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Optional read-only remote API queries when a GitHub URL is supplied. |
| Side effect | Inspect local history, files, CI, documentation, licensing, and packaging; optionally query remote repository settings. Return a prioritized readiness report. |
| Done | The report records secret-history risk, documentation completeness, license consistency, CI and packaging posture, and which remote or execution-dependent checks were explicitly skipped. |

## Inputs

- Repository path (required): the local checkout to audit.
- GitHub repository URL (optional): when supplied, remote checks (branch protection, release history) are performed. When omitted, remote checks are skipped.
- Language or ecosystem hint (optional): skip detection from marker files if supplied.

## Procedure

1. **Scan local git history for secrets.** Scan the full local git history for secrets using `gitleaks git .` or `trufflehog git file://.` if available; otherwise inspect recent commits manually for credential patterns. If no GitHub URL was supplied, explicitly omit remote logs, Actions artifacts, old releases, issue and PR history, and the repository wiki; these are not reachable from a local checkout alone. If secrets are found, flag as critical blocker and recommend a fresh repository (copy the current tree, commit, archive the old repository privately). Done when: the local git history is scanned for secrets with findings classified, and remote-only surfaces are either checked (when a URL was supplied) or explicitly noted as skipped.

2. **Evaluate documentation completeness.** Confirm the README explains what the project is and what problem it solves, how to install it (check that a fresh-clone build instruction exists using only what is in the repository, do not execute the build), how to use it with at least one concrete copy-pasteable example, how to contribute, and the license. Check for `SECURITY.md` with vulnerability-reporting instructions. Check for API documentation linked from the README. Check for a code of conduct if the project expects outside contributors. Done when: documentation completeness is assessed across all checks, with the build instruction verified by reading rather than execution.

3. **Verify license consistency.** Confirm a `LICENSE` file exists. Verify SPDX identifiers are set in package metadata. Verify the license is stated in the README. Confirm all three agree. No license means not open source regardless of visibility. Done when: license consistency across LICENSE file, package metadata, and README is verified.

4. **Assess local CI/CD configuration and packaging metadata.** Confirm the test suite exists and inspect CI configuration for test runs on every PR across the supported language-version and platform matrix. Check that formatting and linting are enforced in CI. Check for a coverage gate. Check that third-party actions are pinned to full commit SHAs. Check that Dependabot or Renovate is enabled for `github-actions`. Verify least-privilege `permissions:` blocks in workflows. Identify the project's languages from marker files (`pyproject.toml`, `Cargo.toml`, `go.mod`, `package.json`, `Gemfile`, `CMakeLists.txt`, `Makefile`) and verify language-specific packaging and publishing metadata. Done when: CI/CD configuration and packaging metadata are assessed for all identified languages.

5. **Remote checks (only if a GitHub URL was supplied).** Query repository settings: check for branch protection on the default branch (no force pushes, PRs required), required status checks, and Dependabot or Renovate for dependency updates. Check release history for semver tags and CI-driven releases. If no GitHub URL was supplied, skip these checks and note them as explicitly skipped in the report. Done when: remote checks are performed or noted as skipped.

6. **Compile the report.** Organize findings by severity:
   - Critical: secrets in history, missing license.
   - High: missing SECURITY.md, no CI, no branch protection (when remote was checked), no test suite.
   - Medium: missing CONTRIBUTING, no coverage gate, unpinned actions, no `.editorconfig`.
   - Low: missing code of conduct, no label conventions, no API docs.
   Mark each gap as blocker, recommended, or deliberate omission. State which omissions are intentional choices for this project's scope. Note which remote or execution-dependent checks were explicitly skipped. Done when: the report is compiled with every finding classified by severity and intentionality, and skipped checks are named.

## Failure and recovery

- Repository inaccessible: stop immediately, report the path error, do not proceed with other checks.
- Secret scanning tools unavailable: note the limitation, recommend manual review or tool installation, continue with remaining checks.
- **Check cannot be completed** (missing access, missing tooling, ambiguous state): mark as "not verified" rather than assuming pass or fail.
- Partial results: always return the report with whatever was completed; never suppress findings because other checks are incomplete.

## Output

One prioritized readiness report: secret-history risk, outsider build/use readiness, license consistency, CI/supply-chain posture, packaging/release gaps, deliberate omissions vs genuine gaps, which remote or execution-dependent checks were skipped, recommended next steps by severity, in that order.
