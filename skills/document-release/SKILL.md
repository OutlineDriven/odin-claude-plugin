---
name: document-release
description: 'Use when the user runs /document-release to synchronize README, CLAUDE, and CHANGELOG with the current shipped state. Commits the updates locally with clobber protection and redaction. Not for PR-based doc sync — use docs-update; not for ADRs — use docs-and-adrs.'
---

# Document release

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /document-release |
| Authority | Reversible local: create local commits only; never push, publish, open, or update a PR/MR |
| Side effect | Committed README, CLAUDE, and CHANGELOG updates with clobber protection and redaction |
| Done | Release documentation is synchronized with current state and committed |

## Inputs

- A feature branch with shipped code (commits ahead of the base branch). Required.
- The base branch name. Derived from the remote default branch if not supplied.
- README, CLAUDE.md, CHANGELOG, and any other project documentation files. Discovered; optional per project.
- VERSION file. Optional; read if present.
- TODOS.md. Optional; read if present.

## Procedure

1. **Abort if on the base branch.** Determine the base branch from the remote default (`git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null`, falling back to `main`). If the current branch equals the base branch, stop: documentation release runs on a feature branch only. Done when: the current branch is confirmed as a feature branch.
2. **Gather the shipped diff.** Run `git diff <base>...HEAD --stat`, `git log <base>..HEAD --oneline`, and `git diff <base>...HEAD --name-only`. Classify changes into new features, changed behavior, removed functionality, and infrastructure. Done when: the diff is gathered and changes are classified.
3. **Discover documentation files.** List project markdown files, excluding `.git`, `node_modules`, and build directories. Record the set to audit. Done when: the documentation file set is recorded.
4. **Build a coverage map.** Extract new or changed public surface from the diff: exported functions, commands, CLI flags, config options, endpoints, skills, environment variables, feature flags. For each item, mark which Diataxis quadrants cover it: reference (what it is), how-to (how to use it), tutorial (step-by-step walkthrough), explanation (why it works). Items with zero coverage are critical gaps; reference-only items are common gaps. If any documentation file contains ASCII or Mermaid diagrams, extract entity names and flag any that were renamed, split, removed, or moved in the diff. Output the map. Done when: the coverage map is output with every public-surface item classified and diagram drift flagged.
5. **Audit each documentation file against the diff.** For each file, cross-reference its claims against the shipped diff:
   - README: features and capabilities, install and setup instructions, examples, troubleshooting steps.
   - ARCHITECTURE: diagrams and component descriptions, design rationale. Update only what the diff clearly contradicts.
   - CONTRIBUTING: setup commands, test tier descriptions, workflow descriptions. Walk through as a first-time contributor and flag anything that would fail or confuse.
   - CLAUDE.md: project structure section, listed commands and scripts, build and test instructions.
   - Any other markdown: determine its purpose and audience, cross-reference against the diff.
   Classify each needed update as auto-update (factual correction clearly warranted by the diff: adding a table item, updating a path, fixing a count, updating a structure tree) or ask (narrative change, section removal, security model change, rewrite over ~10 lines in one section, ambiguous relevance, adding an entirely new section). Done when: every documentation file is audited and each needed update is classified as auto-update or ask.
6. **Apply auto-updates.** Make clear factual corrections directly. For each modified file, output a one-line summary naming what specifically changed, not just the file name. Never auto-update README introduction or project positioning, ARCHITECTURE philosophy or design rationale, security model descriptions, and never remove an entire section from any document. Done when: every auto-update is applied and summarized.
7. **Ask about risky changes.** For each update classified as ask, present the specific documentation decision with a recommendation and a skip option that leaves the file as-is. Apply each approved change immediately after the answer. Done when: every ask-classified update is presented, applied, or skipped.
8. **Polish CHANGELOG voice without clobbering.** If CHANGELOG was not modified on this branch, skip this step. If it was:
   - Read the entire CHANGELOG first and understand what is already there.
   - Score each entry 0 to 3 on a sell test: one point for naming what changed (reference), one point for user impact (explanation), one point for a command, flag, or link showing how to use it (how-to). Entries scoring below 2 need rewording; entries scoring 3 are gold.
   - Lead with what the user can now do, not implementation details. Rewrite commit-message-style entries to user-forward voice. Move internal or contributor-only changes to a separate contributor subsection.
   - Clobber protection: never delete, reorder, replace, or regenerate entries. Never use a full-file overwrite on CHANGELOG. Use exact-match string edits only. If an entry looks wrong or incomplete, ask the user rather than silently fixing it.
   Done when: CHANGELOG voice is polished with no entries deleted, reordered, replaced, or regenerated.
9. **Check cross-doc consistency and discoverability.** Verify the README feature list matches what CLAUDE.md describes, ARCHITECTURE components match CONTRIBUTING structure, and the CHANGELOG latest version matches VERSION if present. Confirm every documentation file is reachable from README or CLAUDE.md; flag any unreachable file. Auto-fix clear factual inconsistencies such as a version mismatch or stale cross-reference; ask about narrative contradictions. Done when: cross-doc consistency is verified and unreachable files are flagged.
10. **Clean up TODOS.** If TODOS.md does not exist, skip. Cross-reference open TODO items against the diff; move items clearly completed by the changes to a completed section with the version and date, being conservative and marking only items with clear evidence in the diff. For TODO items referencing significantly changed files, ask whether to update, complete, or leave them. Scan the diff for TODO, FIXME, HACK, and XXX comments representing meaningful deferred work and ask whether each should be captured in TODOS.md. Done when: TODOS.md is updated or skipped, and deferred-work comments are surfaced.
11. **VERSION bump.** If VERSION does not exist, skip silently. Check whether VERSION was already modified on this branch (`git diff <base>...HEAD -- VERSION`). If it was not bumped, ask whether to bump patch, minor, or skip; recommend skip for docs-only changes. If it was already bumped, check whether the CHANGELOG entry for that version covers the full scope of changes on the branch; if significant changes are uncovered, ask whether to bump again or fold them into the existing entry. Never bump VERSION without asking. Done when: VERSION is bumped, skipped, or confirmed as already bumped.
12. **Redaction scan.** Before committing, scan every modified documentation file for secrets and personally identifying information: API keys, tokens, passwords, private URLs, email addresses outside attribution context, and internal hostnames. If any are found, remove or mask them before committing. Do not commit a placeholder that still encodes the secret. Done when: no secrets or PII remain in any modified documentation file.
13. **Commit.** Run `git status`. If no documentation files were modified by any previous step, output that all documentation is up to date and stop without committing. Otherwise stage modified documentation files by name, never `git add -A` or `git add .`. Create a single local commit with a docs: message naming the release. Do not push. Done when: the commit is created with named files or the no-changes report is output.

## Failure and recovery
- **On the base branch:** stop immediately; no mutation. Tell the user to run from a feature branch.
- **No documentation files modified:** not a failure. Report that all documentation is up to date and stop without committing.
- **CHANGELOG clobber attempt:** if any step would delete, reorder, replace, or regenerate an existing CHANGELOG entry, stop that edit. CHANGELOG entries are the source of truth written from the actual diff and commit history; this skill polishes wording only. Recover by using an exact-match string edit on the wording, or by asking the user if the entry itself looks wrong.
- **Secret or PII found in documentation:** do not commit the leaking content. Remove or mask it first. If masking would distort the documentation, ask the user before committing.
- **Ambiguous or narrative update:** do not auto-apply. Ask the user with a skip option. A skipped update is not a failure; record it in the output.
- **VERSION bump attempted without asking:** never. The bump is blocked until the user chooses.
- **Partial result:** commit only the files that passed audit, clobber protection, and redaction. Files with unresolved asks are left unmodified and listed in the output. Never commit a file that failed redaction.
- **Blocked:** report the blocker, what was tried, and the exact files left unmodified.

## Output
A local commit with synchronized documentation, a health summary listing each file as Updated/Current/Polished/Skipped with a one-line detail, and a coverage map with gaps flagged — no push, no PR or MR update.
