# Tree-Clean Recovery

A worker that dies mid-task leaves a dirty tree. Inspect first (`git status`,
`git diff`) and revert **only** that worker's changes: discard its edits, remove
the stray files it created, leave any pre-existing uncommitted work untouched.
Never blanket-reset or `git clean` the whole tree; that destroys work outside
the task. Once the tree is back to the last good commit for the task's files,
re-dispatch fresh. Never resume a dead worker onto a dirty tree, and never build
the next task on uncommitted partial work.
