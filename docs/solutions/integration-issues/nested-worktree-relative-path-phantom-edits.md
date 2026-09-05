---
title: "Phantom edits from relative path resolution in a nested git worktree"
date: 2026-09-05
category: integration-issues
module: git-worktree
problem_type: integration_issue
component: tool-path-resolution
severity: high
symptoms:
  - "Edit tool rejected a target with a hash error that quoted another branch's content and date"
  - "Later edits reported success with snapshots holding content the operator never read"
  - "The intended change never appeared in the worktree file"
  - "A commit showed an empty diff for the file the edit claimed to change"
  - "The edit landed verbatim in the parent checkout at unintended lines"
root_cause: scope_issue
resolution_type: workflow_improvement
tags: [git-worktree, edit-tool, path-resolution, cwd, phantom-edit, jailed-index]
---

# Phantom edits from relative path resolution in a nested git worktree

## Problem

A session operated on a git worktree at `.outline/worktree/prompt-stack` nested inside a jailed
parent submodule at `/home/alpha/.claude/claude`. Bash calls carried the worktree as an explicit
`cwd` or used `git -C`. Edit-tool calls used relative paths. The two tool families resolved paths
against different roots, so an edit addressed at `docs/specs/install-proof.md` landed in the parent
checkout, which held a different branch.

## Symptoms

- A hash-rejection error quoted `2026-09-01` and `feat/skill-foundry-2.0-source`, content from the
  parent branch, although every read the operator made came from the worktree branch
  `feat/prompt-stack-2.1`.
- Two edits after the rejection reported success with snapshots of the parent's content.
- The note never appeared in the worktree file.
- The next commit carried an empty diff for that file because the worktree copy was untouched.
- An inspection found the note verbatim in the parent checkout.

## What didn't work

- Trusting relative paths in edit calls while bash calls used a `cwd` parameter. The bash `cwd`
  does not move the session root that the edit tool resolves against.
- `git restore` in the parent. The parent's index is jailed and read-only, so the command fails.
- Treating a success snapshot as proof the worktree changed. The snapshot proves only that some
  file changed on some tree.

## Solution

1. Verify the contamination: `git -C /home/alpha/.claude/claude diff -- <path>` shows the stray
   edit with its content.
2. Restore the parent from its own HEAD, bypassing the jailed index:
   `git -C /home/alpha/.claude/claude show HEAD:<path> > <absolute-parent-path>`.
3. Land the intended edit in the worktree with an absolute path, or write the file through a
   script that carries the absolute path.
4. Prove both trees: parent `git status --porcelain` is empty, and the worktree commit contains
   the change.

## Why this works

`git show HEAD:<path> > <path>` reads from the object database and writes through the working
tree, so the jailed index never participates. Absolute paths remove the session root from the
resolution, so the edit tool and bash agree on the target tree.

## Prevention

In a nested-worktree layout, every edit-tool call carries an absolute worktree path whenever bash
calls use a `cwd` parameter. After any edit whose snapshot content mismatches the operator's own
prior reads, such as a different date, branch, or hash, diff both trees before trusting the edit.
This repo keeps worktrees under `.outline/worktree/<name>`, so the prefix check is mechanical.
