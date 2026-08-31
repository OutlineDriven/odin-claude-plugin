---
name: github-gh-cli-operations
description: 'Use when a prompt contains a github.com URL or any git/GitHub operation request; resolve or create GitHub objects through gh and watch PR CI to completion. Don''t use for GitHub web UI operations or operations outside gh and git.'
disable-model-invocation: true
---

# GitHub CLI operations

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Any prompt containing a github.com URL (issue, PR, commit, compare, Actions run, release, discussion, repo), or any git/GitHub operation request. A pasted github.com URL alone is sufficient even with no GitHub-specific keywords. |
| Authority | Human-only. Require explicit human invocation. Preview the target and consequence before publishing, remote mutation, history rewriting, or irreversible deletion. |
| Side effect | Creates or modifies branches, commits, PRs, issues, and releases via gh/git; may rewrite local history. |
| Done | The referenced GitHub object is resolved or created through gh (never the web UI), every unfamiliar gh command was validated with `gh help <command>` first, and any opened PR has CI watched via `gh pr checks --watch` with failures addressed. |

## Inputs

- A github.com URL or a git/GitHub operation request. The URL form needs no accompanying keywords.
- Optional: target base/head branches, PR title and body, release tag, or issue body when the operation creates an object.

## Procedure

1. If the prompt includes a github.com URL, treat the URL alone as sufficient reason to act and translate it into the relevant gh/git workflow before anything else.
2. Use the gh CLI for every GitHub operation; never suggest or use the GitHub web interface.
3. Before running an unfamiliar gh command, validate it with `gh help <command>` and use the confirmed syntax.
4. Open PRs with explicit base and head and a body file: `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`. Use `--body-file` (a temporary file) rather than `--body` to avoid newline escaping issues.
5. Write PR bodies as short plain prose. Add no subsections or headings such as `## Summary` or `## Testing`, and no testing section. Add a longer description only for architecture changes that need extra context.
6. After opening a PR, watch CI to completion with `gh pr checks <num> --watch 2>&1` and proactively fix any failures.
7. For an interactive rebase: run `git rebase -i <base>`, verify with `git log --oneline -n 10`, and on conflict resolve the file, `git add <file>`, then `git rebase --continue`; abort anytime with `git rebase --abort`.
8. For merge conflict resolution: find conflicts with `git status`, inspect with `git diff`, resolve every marker, `git add <resolved-file>`, then `git merge --continue` (or `git rebase --continue`); confirm a clean state with `git status`.
9. For branch cleanup: list with `git branch --merged main`, delete locally with `git branch -d <branch>`, delete remotely with `git push origin --delete <branch>`, then `git fetch --prune`.
10. Never alter git signing key configuration (`user.signingkey`) or signing mode. If signing is already enabled and correctly configured, create signed commits with the existing setup; otherwise proceed without signing.
11. Never add AI co-authorship attribution (e.g. `Co-Authored-By: Claude`) to commits or PR bodies.

## Failure and recovery
- Unfamiliar gh command: stop and confirm syntax with `gh help <command>` before running; never guess flags.
- Rebase or merge conflict: resolve markers, stage the resolved file, and continue; abort with `git rebase --abort` or `git merge --abort` if the conflict cannot be resolved within scope.
- CI failure on an opened PR: read `gh pr checks <num> --watch 2>&1` output, fix the failing check, and re-watch; do not declare done while CI is failing or incomplete.
- Signing misconfiguration: do not change signing settings; proceed without signing and report that signing was skipped.
- Partial result: a PR opened but CI not yet watched is not done; the done predicate requires CI watched to completion with failures addressed.

## Output
The referenced GitHub object is resolved or created through gh, unfamiliar commands were validated, and for any opened PR the CI watch completed with failures addressed. Commits and PR bodies carry no AI attribution and signing settings are unchanged.

## Provenance

Origin: mcollina/skills, revision 856efd268ae85482d882f3d0bed869fd020b5c06, file skills/octocat/SKILL.md. License: MIT; notice retained, mechanism adapted. Adapted to the odin-run module with a human-only authority boundary, a contract table, failure/recovery classes, and provenance; the gh-first, URL-trigger, command-validation, PR-body, CI-watch, signing, and attribution mechanisms are preserved.
