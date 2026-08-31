---
name: docs-update
description: 'Sync user-facing docs to code changes and open a linked PR. Also handles multi-repo documentation setups when a separate docs repository is configured. Not for ADRs or architectural rationale — use docs-and-adrs; not for Diataxis-style doc writing — use docs-writing.'
disable-model-invocation: true
---

# Docs update

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to update docs, review docs, handle documentation tasks, or analyze recent commits for documentation needs. |
| Authority | Human-only. Preview the proposed branch, the files to change, and the PR consequence to the human before creating a branch, pushing, or opening a PR. Do not publish or merge without explicit human invocation. |
| Side effect | Creates one documentation branch and opens one PR with user-facing documentation synced to code changes. Mutation is limited to documentation files. |
| Done | Docs accuracy reflects significant user-facing changes, matches existing style, and references the source commits. |

## Inputs

- A source repository with recent commits to review. Default timeframe is the last 24 hours; a user-specified timeframe overrides it.
- Optional: a separate documentation repository path when documentation lives apart from source code (multi-repo setup).
- Optional: testing mode (the user asks to "see what would change"), which previews without mutating.

## Procedure

1. Find the default branch and gather commits within the timeframe (default 24 hours, or user-specified). Examine each commit's diff to understand what was modified. Done when: every commit in the timeframe has its diff examined.
2. Filter for significant user-facing changes: new features or capabilities, API changes (new endpoints, parameters, return values), breaking changes, new configuration options, new CLI commands or flags, and changes to user-facing behavior. Skip internal refactoring, test-only changes, minor bug fixes, code typo corrections, and performance optimizations without user impact. Be conservative: when significance is doubtful, skip the update. Done when: the filtered set contains only significant user-facing changes.
3. Locate the documentation: check for a docs directory in the current repo (monorepo pattern), or a separate docs repository in the environment (multi-repo). Determine the platform from configuration files and directory structure (Mintlify, Docusaurus, GitBook, Fumadocs, or generic markdown); default to standard markdown syntax if the platform is unclear. Done when: the documentation location and platform are determined.
4. Read several existing documentation files to capture tone, voice, structure, code-example patterns, terminology, and formatting conventions, including any style guide or contribution documentation. Done when: tone, voice, structure, and formatting conventions are captured.
5. Map each significant code change to a documentation need (new content, modification, or addition to existing content). Prioritize user-facing changes over implementation details, match existing documentation verbosity, preserve existing accurate content, and stay strictly additive. Done when: each significant change has a mapped documentation need.
6. Generate the documentation changes matching the captured style: same tone and formality, same heading hierarchy, consistent terminology, matched code-block formatting (language tags, highlighting), and platform conventions (frontmatter, special syntax, custom components). Done when: generated changes match the captured style.
7. If testing mode was requested, output the preview summary described in Output and stop. Do not create a branch or PR. Done when: the preview is output and no mutation occurred.
8. Before any mutation, preview the proposed branch name, the documentation files to change, and the PR consequence to the human. On explicit approval, create a descriptive branch (for example `docs/auto-update-YYYYMMDD`), apply the documentation changes, and commit with a descriptive message listing the changes. Done when: the branch is created, changes applied, and committed with a descriptive message.
9. Push the branch and open a PR whose description links each documentation update to its triggering source commit (commit references or URLs from the source repository) and requests human review for accuracy and completeness. Do not merge the PR. Done when: the PR is open with each update linked to its source commit.

## Failure and recovery
- No significant changes found: report that no documentation updates are needed. Create no branch or PR.
- Documentation platform unclear: default to standard markdown syntax, note the assumption, and proceed.
- Proposed change conflicts with existing accurate content: preserve the existing content, note the conflict for human review, and do not overwrite.
- Human does not approve the preview: stop. Create no branch, push, or PR. No partial PR is opened.
- Multi-repo setup with missing or mismatched docs repository: report the blocker with the missing path. Do not guess or mutate the wrong repository.
- Blocked or non-converged result: return a report naming the failure class and what was tried, with no documentation branch or PR created. Never swallow the error or claim the done predicate holds.

## Output
A pushed documentation branch and one open PR linking each update to its source commit, or a testing-mode preview summary, or a no-op report that no significant user-facing changes were found.

## Provenance

- Origin: https://github.com/warpdotdev/oz-skills, revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765, file `.agents/skills/docs-update/SKILL.md`.
- License: MIT (Copyright 2026 Warp). This skill is outside the two Apache-2.0 subdirectories (`.agents/skills/mcp-builder/` and `.agents/skills/webapp-testing/`), so the repository-root MIT terms apply.
- Adaptation: clean-room adaptation to a human-only knowledge-sync workflow. Preserved mechanisms: filter commits for user-facing changes, preserve existing documentation voice and style, stay strictly additive, and open a PR linking documentation updates to source commits. Removed the Warp co-author line and automation-only framing; added human-preview-before-PR authority and explicit failure and recovery classes.
