---
name: docs-update
description: 'Use when documentation has drifted from code changes and the user asks to synchronize them, selecting a local commit or reviewable PR. Filters user-facing commits, maps coverage gaps across Diataxis categories, protects CHANGELOG, and delivers scoped commits or PRs. Not for ADRs or architectural rationale — use docs-and-adrs; not for writing an isolated document from a settled brief — use docs-writing.'
disable-model-invocation: true
---

# Docs update

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to synchronize documentation with code changes and selects a local commit or a reviewable PR. |
| Authority | Human-only. The requested delivery selects the mode; it does not approve base-branch commits, version changes, unresolved narrative edits, or remote effects that have not been previewed. |
| Side effect | Updates documentation from one bounded code-change set, then creates either local commit(s) or reviewable PR(s). |
| Done | Every selected source commit and changed public surface is accounted for, documentation is internally consistent and redacted, and the requested delivery exists with links to its source commits. |

## Inputs

- Delivery: `local commit` or `reviewable PR`. If the request does not select one, ask before mutation.
- Source change set: a user-supplied commit or time range; otherwise commits ahead of the base branch when present, falling back to the last 24 hours.
- Repositories: the source repository and, when documentation lives separately, the documentation repository and its remote target.
- Documentation: discovered project documentation, including README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md, CHANGELOG, VERSION, and TODOS files when present.

## Procedure

1. **Bind delivery and repositories.** Resolve the requested delivery, source repository, documentation repository, base branch, current branch, and source change set. In local mode, abort without mutation when the current branch is the base branch; local documentation commits always require a feature branch, even when repository policy would permit a base-branch commit. In PR mode, identify the documentation repository's remote, base, and proposed head branch without creating or pushing it. Done when: delivery, repositories, branches, and commit range are explicit.
2. **Filter commits.** Inspect every commit and its diff in the source change set. Keep user-facing features, API changes, changed behavior, removals, configuration, commands, flags, endpoints, environment variables, and feature flags. Exclude refactors, test-only changes, typo-only fixes, and performance or infrastructure changes with no user impact. Classify doubtful significance conservatively and record why it was excluded. Done when: every source commit is kept or excluded with a reason.
3. **Detect platform and style.** Discover all relevant documentation while excluding dependency, VCS, and build directories. Detect Mintlify, Docusaurus, GitBook, Fumadocs, or generic Markdown from configuration and structure. Read the project style guide and representative files to capture voice, terminology, heading structure, frontmatter, components, and code-example conventions. Use standard Markdown only when no platform signal exists. Done when: the documentation set, platform, and local style are known.
4. **Build the coverage map.** Extract each changed public surface from the kept diffs. Map its current coverage across Diataxis reference, how-to, tutorial, and explanation; mark zero-coverage and reference-only gaps. Inspect ASCII, Mermaid, and other maintained diagrams for renamed, moved, split, or removed entities and edges. Map each gap or drift item to a specific documentation change. Done when: every public-surface item has a coverage result and every affected diagram has a drift result.
5. **Audit and classify.** Check every discovered document against the kept diffs and its purpose. Include setup, examples, troubleshooting, commands, project structure, workflows, component descriptions, cross-references, and navigation. Classify each needed edit:
   - Auto-update: a bounded factual correction directly proved by the diff, such as a path, count, table item, command, flag, structure tree, or stale link.
   - Ask: positioning or narrative, design rationale, security model, a section removal, a new section, a rewrite over roughly ten lines in one section, or any ambiguous claim.
   Present each ask with one recommendation and a skip option. Apply only the approved choice; leave skipped text unchanged. Done when: every needed edit is auto-update, approved, or explicitly skipped.
6. **Apply synchronized edits.** Match the detected platform and style, preserve accurate content, and update diagrams with their surrounding claims. Keep terminology, examples, navigation, and repeated facts consistent across documents. Report a one-line factual summary for each changed file. Done when: all approved edits are applied and no changed claim conflicts with another document.
7. **Protect CHANGELOG.** If the selected diff does not require a CHANGELOG edit, leave it unchanged. Otherwise read the whole file before editing. Score affected entries from 0 to 3: changed fact, user impact, and usage command/flag/link. Reword entries below 2 toward user impact, and separate contributor-only details when the existing structure permits it. Preserve every existing entry and its order; use narrow exact-match edits, never regenerate or overwrite the file. Ask when an entry appears incorrect or incomplete. Done when: required wording is clear without deleting, reordering, replacing, or regenerating entries.
8. **Reconcile the document set.** Verify feature lists, commands, components, project structure, versions, and cross-references agree across documents. Confirm each document is reachable from README or CLAUDE.md and report unreachable files. Auto-fix proved factual inconsistencies; route narrative contradictions through the ask classification. Done when: cross-document facts agree and discoverability gaps are reported.
9. **Reconcile deferred work and versioning.** If a TODOS file exists, move only clearly completed items to its completed section with version and date. Ask whether to update, complete, or leave items whose referenced files changed substantially. Surface meaningful TODO, FIXME, HACK, and XXX comments introduced by the source changes and ask whether to record them. If VERSION exists, inspect its branch diff and its agreement with CHANGELOG. Ask before every bump, offering patch, minor, and skip as applicable; recommend skip for documentation-only changes. Done when: deferred work is reconciled or skipped and no version changed without explicit approval.
10. **Scan before delivery.** Scan every modified documentation file for API keys, tokens, passwords, private URLs, internal hostnames, and PII, including email addresses outside legitimate attribution context. Remove or mask findings without retaining secret-shaped placeholders. If redaction would distort the documentation, leave that file uncommitted and ask. Done when: every file selected for delivery passes the secret and PII scan.
11. **Prepare commits.** If no documentation changed, report that the documentation is current and stop. Otherwise stage modified documentation files by explicit path and create descriptive documentation commit(s). In a multi-repository setup, commit only files belonging to each repository and retain links from every documentation update to the triggering source commit URL or repository-qualified commit. Done when: each repository has a scoped commit and every update is traceable to source.
12. **Deliver at the only fork.**
   - Local commit: leave the scoped commit(s) in their repositories. Do not push, publish, or create or update a PR/MR.
   - Reviewable PR: preview the documentation repository, remote, base branch, head branch, files, commit summary, source-commit links, and the consequence that the branch will be pushed and a PR opened. After explicit approval of that preview, create or use the proposed head branch, push it, and open one reviewable PR per documentation repository. Request human review; do not merge.
   Done when: the selected local commit(s) exist without remote effects, or the approved PR target(s) are open and link every update to its source commits.

## Failure and recovery

- Delivery missing: ask the user to choose local commit or reviewable PR; do not mutate.
- Local mode on the base branch: abort before mutation and name the required feature branch.
- Missing or mismatched documentation repository: report the expected repository or path; do not guess or edit another repository.
- No significant user-facing change: report the excluded commits and stop without a commit or PR.
- Ambiguous or narrative edit: leave it unchanged until the user approves a choice; skipping is valid.
- CHANGELOG clobber risk: stop that edit and preserve the existing entries and order.
- Secret or PII remains: exclude the affected file from delivery and identify the required redaction decision.
- PR preview not approved: keep work local and create no remote effect.
- Partial result: deliver only files that passed audit, approval, consistency, clobber protection, and redaction; list every unchanged or blocked file.

## Output

- A coverage map with Diataxis gaps and diagram drift.
- A per-file health summary: Updated, Current, Polished, Skipped, or Blocked, with one factual line each.
- Either scoped local documentation commit(s) with no push, or reviewable PR URL(s) whose descriptions link each update to its repository-qualified source commit.
