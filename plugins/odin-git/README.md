# ODIN Git

ODIN workflows for commits, branches, pull requests, review feedback, and issue tracking.

46 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-git@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-git@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-git/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-git:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| agent-transcript | Use when a redacted, trimmed agent transcript must be appended to a GitHub PR or issue body, with human approval and preview. |
| atomic-issues-prs | Use when the user says "atomic PRs" or requests one issue or PR per logical change. |
| can-i-help | Use when the user asks "where to help", "contribution opportunities", or "find a good first issue". |
| capture-isolated-patch | Use when a candidate change must be produced without touching the working tree. |
| close-done | Use when the user wants to batch-close resolved or outdated tracker items. |
| commit | Use when asked to commit changes, create a typed branch, format history for a changelog, or rewrite messages of HEAD or an unpushed range. |
| commit-push | Use when asked to commit and push to a feature branch off the default branch, with no pull request. |
| commit-push-current | Use when a human explicitly asks to commit and push to the checked-out branch, with no branch creation and no pull request. |
| commit-push-main | Use when a human explicitly asks to commit and push directly to the default branch, with no feature branch and no pull request. |
| commit-push-pr | Use when asked to commit, push a feature branch, and open or update a pull request with gh in one pass. |
| create-branch | Use when the user asks to create a new branch or start work on one. |
| create-pull-request | Use when asked to create or update a PR, revise its description, or link issue references to its body. |
| finish-branch-menu | Use when implementation is complete, the test suite is green, and an integration decision is needed for a development branch or worktree. |
| fix-p0-issues | Use when the user asks to fix P0s, address critical issues, or work on priorities from the weekly product briefing. |
| gate-and-merge | Use when landing a queue of open PRs: gate each PR, sweep its review feedback to root cause, then merge, repair, hold, or close it. |
| gh-review-requests | Use when the user asks to find PRs to review or check the team review queue. |
| git-branchless | Use when asked for multi-commit stack edits, rebases, fixups, or stacked-PR publishing with branchless git idioms. |
| git-cleanup | Use when the user explicitly invokes branch or worktree cleanup for a repo with accumulated local branches. |
| git-guardrails | Use when a repository needs a guard against force-push, forced reset, clean, branch deletion, working-tree discard, stash drop, reflog expire, or gc prune. |
| git-history-analysis | Use when the user asks about recent engineering work, what the team is working on, planning or roadmap material, or an explicitly requested Slack summary. |
| git-workflow-and-versioning | Use when the user asks for release, version bump, changelog, or branch workflow beyond a single commit. |
| github-backlog-triage | Use when the user invokes backlog triage for a GitHub repo's open issues and PRs. |
| github-bug-report-triage | Use when evaluating whether a bug issue has sufficient detail and identifying missing reporter information. |
| github-issue-dedupe | Use when finding duplicate GitHub issues or checking for similar issues against a target issue. |
| interactive-drop-selector | Use when the user explicitly asks to choose which issues or pull requests to close interactively. |
| issue-intake | Use when filing an approved task spec as a GitHub issue with a local archive and optional worktree implementer. |
| issue-now | Use when a human asks to compare one closed or stale tracker issue with current reality and mark it done or update it. |
| issue-triage | Use when a human invokes triage on a new configured Slack issue report. |
| land-contribution | Use when a maintainer or collaborator explicitly asks to review and land one external pull request. |
| make-pr-easy-to-review | Use when a human explicitly asks to reshape or annotate one pull request for review. |
| new-branch-and-pr | Use when a human explicitly asks to ship work through a clean branch and pull request. |
| post-daily-new-issues | Use when a human explicitly requests the daily on-call issue digest from a named issue tracker for a configured Slack channel. |
| post-merge-cleanup | Use when a landed merge, release, or completed change needs its cleanup surface reconciled. |
| propose-issue | Use when the user asks to propose an issue, file or open a bug report, or turn a reported defect into a tracked issue. |
| publish-branch | Use when asked to publish the checked-out branch: commit and push it whatever branch it is, the default branch included. |
| repo-health-triage | Use when a scheduled or watcher tick requests a repository-health pass. |
| resolve | Use when addressing review feedback: analyze mode classifies comment validity, reception mode applies accepted items with tests and drafts pushback. |
| resolve-merge-conflicts | Use when a merge, rebase, cherry-pick, or stash pop stops on conflicts. |
| resolve-pr-feedback | Use when handling GitHub PR review feedback: autonomous fix-and-resolve, interactive per-comment walkthrough, or read-only severity summary. |
| review-and-ship | Use when a human directly requests review and publication of an existing diff or delegated work. |
| setup-gitignore | Use when the user says set up gitignore, fix gitignore, or untracked files keep appearing. |
| setup-pre-commit | Use when installing or repairing a repo-local pre-commit hook from the project gates, or when a repo needs package-manager-native commit-time checks. |
| setup-repo-skills | Use when the user wants one-time repository setup for tracker, triage labels, and domain conventions. |
| watch-and-repair-pr | Use when a human explicitly invokes a watcher cycle for an open pull request that must be watched until mergeable or blocked. |
| wontfix | Use when the user wants to elicit refused directions, generalize them, and close matching tracker items as not planned. |
| worktree | Use when work needs an isolated git worktree: new work, an existing ref, a gated feature workspace with baseline tests, or a manifest-tracked loop run. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
