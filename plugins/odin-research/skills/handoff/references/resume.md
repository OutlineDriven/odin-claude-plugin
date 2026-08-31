# Resume or fresh

Treat `.handoff/continuity/notes.md`, `graph.md`, and `death-point.md` as one continuity set. There is no per-session child directory and no "newest filename" selection.

Resume the set only when all of these conditions hold:

- `death-point.md`, `notes.md`, and `graph.md` exist, are readable, and are non-empty.
- The repository identity recorded in all three files matches the current repository.
- The death-point status is `active` or `interrupted`, not `completed`.
- The recorded goal and next action still describe unfinished work in the current tree.

Start fresh when the set is absent, completed, corrupt, stale, incomplete, or belongs to another project. Preserve the rejected files and report the reason.

When only a valid minimal `death-point.md` exists, start fresh instead of resuming. Carry its available goal, repository identity, session handle, timestamp, and next action into the new notes before rebuilding the graph from current evidence. This is the crash-before-first-notes recovery path.
