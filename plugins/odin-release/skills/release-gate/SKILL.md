---
name: release-gate
description: 'Use when the user decides to ship a release as a signed tag or a redaction-gated PR. Modes: tag (default) and pr. Not for running workflow-owned steps by hand: use the CI/CD workflow.'
disable-model-invocation: true
---

# Release gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user decides to ship a release as a signed tag (tag mode) or a redaction-gated PR (pr mode). |
| Authority | Human-gated: in tag mode, pushes a versioned commit and signed tag and triggers the release workflow; in pr mode, creates and pushes a versioned branch and a redaction-gated PR. Every remote or irreversible action requires explicit human confirmation. No remote mutation without explicit human confirmation. |
| Side effect | Bumps the version, commits, writes release notes, and pushes a tag or branch; in pr mode, also creates a redaction-gated PR and may trigger a workflow. |
| Done | Version matches the tag or PR; release notes are house-style; the workflow is confirmed succeeded (not assumed); contributions are closed with credit; the iteration folder is retired. |

## Refusals

- Running workflow-owned steps by hand: rejected. The user must run that step through the project's CI/CD workflow.
- Releases without confirmation at each irreversible step: rejected. Q1 and Q2 are both required in tag mode; the PR preview confirmation is required in pr mode.
- Overwriting an existing version: rejected. Stop and report the conflict.

## Inputs

- Mode (required): `tag` (default) or `pr`.
- Version target (required): the semver or calendar version to release.
- Changelog or commit range (required): the set of changes since the last release.
- Workflow identifier (optional): CI/CD workflow name or dispatch trigger.
- Contributor list (optional): names or handles to credit in release notes.
- Iteration folder path (optional): working directory to retire after release.
- Existing open PR (optional, for `pr` mode): if present, its body is regenerated and Greptile comments are addressed.

## Procedure

1. Confirm the mode and release intent. Ask the user to choose `tag` (signed tag and push) or `pr` (redaction-gated PR). If not, stop. Done when: mode and intent are confirmed.
2. Read the current version from the project manifest. Compute the next version from the user-supplied target. Done when: the next version is computed.
3. Draft the release notes from the changelog or commit range. Format to house style: version header, date, categorized changes, contributor credits. Done when: the release notes draft is written.
4. Mode `pr`: detect the base branch and probe mergeability. Identify the base from the remote default and record it as `$BASE`. Run `git merge-tree --write-tree HEAD origin/$BASE` to detect clean or conflicting merges. If a PR already exists, use `gh pr view --json mergeStateStatus` to get the same answer. Stop and show conflicts. Done when: the base branch and mergeability are known.
5. Mode `pr`: run the test suites under an evidence ledger. Record `{command, exit, working-tree fingerprint, log path}` per lane. Cite that record later instead of re-running when the content has not changed. Done when: every lane has a record.
6. Mode `pr`: triage every test failure. Classify each against the branch diff: in-branch if the failing test or the code it exercises was changed; pre-existing if neither was touched. Default to in-branch when ambiguous. Stop on in-branch failures. For pre-existing failures, present the choice (fix now, log a P0 TODO, blame-and-assign, or skip) and act on the answer. Done when: every failure is classified and in-branch failures are stopped or pre-existing failures are resolved.
7. Mode `pr`: audit test coverage of the diff and plan completion. Trace every changed codepath and user flow; mark gaps with a quality score. If a plan file is present, extract every actionable item and verify each against the diff. Report completion, deferred items, and scope drift. Done when: the coverage and plan audit are complete.
8. Mode `pr`: run the pre-landing review. Engineering review is the only shipping gate: it must be clean or globally skipped within 7 days, else run an adversarial review with a critical pass (SQL and data safety, LLM output trust boundary) and an informational pass. Run a Claude adversarial pass and a Codex adversarial challenge; diffs over 200 lines also get a Codex structured review. Frontend changes get a lite design check. CEO and design reviews are informational. Done when: the engineering review is clean or skipped.
9. Mode `pr`: address Greptile comments when a PR already exists. Fetch the PR's Greptile review comments. For each, fix (tag `FIXED`), mark false positive with evidence (tag `FALSE POSITIVE`), or note it was already fixed with the commit SHA (tag `ALREADY FIXED`). If any fix was applied, re-run the tests. Omit the Greptile section when no PR exists yet. Done when: every Greptile comment is dispositioned or the section is omitted.
10. Mode `pr`: classify version state and bump. Classify against the base: FRESH does the bump; ALREADY_BUMPED skips the bump but checks for queue drift; DRIFT_STALE_PKG repairs the manifest to match VERSION; DRIFT_UNEXPECTED stops for manual reconciliation. Decide the bump level from the diff. Write VERSION, the manifest, and existing npm lockfiles. Done when: the version is bumped or the state is reconciled.
11. Mode `pr`: write the CHANGELOG and update TODOS.md. Enumerate every commit and map each to at least one bullet under `## [X.Y.Z.W] - YYYY-MM-DD` with Added / Changed / Fixed / Removed sections. Cross-reference TODOS.md against the diff and move completed items. Done when: the CHANGELOG entry is written and TODOS.md is updated or its failure noted.
12. Show the user the preview and ask for Q1. In tag mode: the draft release notes, the version bump, and the commit message. In pr mode: the branch, the base-merge plan, the new version, the CHANGELOG, the planned commits, the tag name, and the intended PR title. Wait for explicit confirmation before any commit or tag. Done when: Q1 is confirmed.
13. On Q1: commit. Mode `tag`: bump the version in the project manifest and commit with a clean message. Mode `pr`: merge `origin/$BASE` with `--no-edit` if step 4 reported divergence (auto-resolve only simple conflicts: VERSION, schema, CHANGELOG ordering; stop on complex conflicts), then commit the diff in bisectable chunks ordered infrastructure, then models and services, then controllers and views. The final commit holds VERSION, CHANGELOG, and TODOS.md. Squash WIP checkpoint commits into their logical commit first. Done when: the version is bumped and the commit is created.
14. Mode `tag`: create a signed tag, show the tag name, target commit, and push destination, and ask Q2. On Q2: push the signed tag. Done when: the tag is pushed.
15. Mode `pr`: run the verification gate. Check the evidence ledger: every test lane must have a fresh record (within 24h) whose command and working-tree fingerprint match, allowing only metadata paths. No fresh evidence, no done claim. Done when: every lane has a fresh matching record.
16. Mode `pr`: push the branch. Propose the push and wait for human confirmation. Push the branch to the remote. Done when: the branch is pushed.
17. Mode `pr`: sync documentation. Dispatch the documentation-sync step in a fresh context; it updates docs, commits, pushes, and returns a section for the PR body. If the subagent fails, note it and proceed. Done when: the documentation section is returned or the failure is noted.
18. Mode `pr`: create the redaction-gated PR. Compose the body from fresh results. Scan the title and body with the redaction engine before sending: a HIGH credential finding blocks with exit 3, no skip; MEDIUM findings require per-finding confirmation. The PR title must start with `v<NEW_VERSION>`. Done when: the PR is created or a HIGH finding blocks.
19. If a workflow identifier was supplied, trigger the release workflow and confirm it succeeded. Do not assume success. Done when: the workflow is confirmed succeeded or the failure is reported.
20. Close any open contributions or iteration items referenced in the changelog. Credit contributors by name in the release notes. Done when: contributions are closed and contributors are credited.
21. If an iteration folder was supplied, retire it (move or archive) and confirm. Done when: the folder is retired or no folder was supplied.
22. Report the final state: version, tag or PR, commit hash, workflow status, notes location, and retired iteration folder. Done when: the final report is delivered.

## Failure and recovery

- User declines Q1 or Q2: stop immediately. No version bump, commit, tag, push, or PR occurs. Report the declined confirmation and leave all state unchanged.
- Version already exists: stop. Report the conflict. Do not overwrite.
- Complex merge conflict (pr mode): stop and show the conflicts; do not auto-resolve ambiguous hunks.
- In-branch test failure (pr mode): stop. The developer fixes their own broken tests before shipping.
- DRIFT_UNEXPECTED version state (pr mode): stop for manual reconciliation.
- Redaction HIGH finding in the PR body or title: block with exit 3. Rotate the credential and redact before creating or editing the PR; no skip.
- Subagent failure (coverage audit, documentation sync, plan completion): fall back to running the step inline or proceed without its section. Never block the ship on a subagent failure.
- Verification gate without fresh evidence (pr mode): no done claim. Re-run the affected lane to produce a fresh record.
- Commit, tag, or push fails: stop after the failed push. Report the error and the partial state. The user decides whether to retry or revert locally.
- Workflow fails or times out: report the failure. Do not mark the release as succeeded.
- Scope creep detected (request touches steps owned by the CI/CD workflow, deployment pipeline, or publishing platform): refuse and report which step is workflow-owned.

Partial results are never reported as success. If any step after Q1 fails, the release is incomplete and the output states exactly which steps succeeded and which did not.

## Output

A release report with the version released, the tag or PR reference, the commit hash and message, the release notes path, the workflow run identifier and final status, the credited contributors, the retired iteration folder path, and done-predicate confirmation or the exact list of failed checks.
