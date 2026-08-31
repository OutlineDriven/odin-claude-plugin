---
name: what-did-i-get-done
description: 'Use when a user asks what was completed in a named date or commit range. Reads git log and returns a concise dated status report. Don''t use for tasks that require source or remote-system changes.'
---

# What did I get done

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly asks to summarize completed work in a named range |
| Authority | Read-only: read git log only; no file write, credential use, remote mutation, or deployment change |
| Side effect | Chat output only; no file, VCS, credential, paid, published, or remote mutation |
| Done | Concise dated status update returned as chat text |

## Inputs

- Range identifier (required): a date range, commit range, branch name, or label the user specifies.
- Session git root (derived): `git -C <session_cwd> rev-parse --show-toplevel` to locate the repo root. Required; abort if git is not inside a repository.
- All other inputs are derived from the range and repo root.

## Procedure

1. Locate the repository root using `git -C <session_cwd> rev-parse --show-toplevel`. Done when: repo root is located, or the step has aborted with "Not a git repository."
2. Run `git -C <repo_root> log --oneline --date=short --format="%h %ad %s" <range>` where `<range>` is the user's range identifier. If the range is empty or unrecognized by git, report the empty result and stop. Done when: commit log is produced or empty result is reported.
3. Run `git -C <repo_root> shortlog -sne <range>` to capture author and commit counts. Omit if the command fails. Done when: author counts are captured or omitted on failure.
4. Produce a concise status report that includes: the date or range label, the number of commits, each commit on its own line as `<short-hash> <date> <subject>`, and author counts from shortlog if available. Done when: status report is produced.
5. Return the report as chat text only. Do not write any file. Done when: report is returned as chat text.

## Failure and recovery
| Failure class | Result |
|---|---|
| Not a git repository | Abort: report "Not a git repository." |
| Git range not recognized | Report empty result for that range; stop. |
| Git command fails | Abort: report the git error verbatim. |
| No commits in range | Report "No commits found in range." |

Partial-result rule: if some steps succeed, return what was gathered; stop on the first failure. Rollback: none needed. No mutation occurs.

## Output
Chat text containing a concise dated status update: the range label, commit count, per-commit lines (`<hash> <date> <subject>`), and author summary if available.
