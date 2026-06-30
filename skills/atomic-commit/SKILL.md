---
name: atomic-commit
description: Split working-tree changes into one commit per logical change. Use when the user says "atomic commit", "commit my changes", "split this into commits", or has unrelated edits in the tree.
---
# Atomic Commit
Review staged + unstaged changes. Group by mechanism/file boundary.
Create one commit per logical change. Run repo-native type-checker and linter before each commit.
Do NOT bundle unrelated changes.
