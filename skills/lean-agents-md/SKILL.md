---
name: lean-agents-md
description: 'Use when the user asks to create, update, maintain, or set up AGENTS.md or CLAUDE.md, or document repo agent conventions: produce a concise, command-backed, path-backed AGENTS.md under 100 lines with external references and commit attribution. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Lean AGENTS.md

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create, update, maintain, or set up AGENTS.md or CLAUDE.md, or document repo agent conventions |
| Authority | Reversible local write only to the named target file; rollback via `git checkout` on rejection |
| Side effect | Writes or updates AGENTS.md/CLAUDE.md; never rewrites referenced policy docs |
| Done | Concise, command-backed, path-backed AGENTS.md under 100 lines with external references and commit attribution |

## Inputs

- `repo_root` (required): the repository root directory path
- `target_file` (optional): path to the artifact, defaults to `<repo_root>/AGENTS.md`; falls back to `<repo_root>/CLAUDE.md` if AGENTS.md does not exist
- `owner` (optional): author name or alias for the commit attribution line; omit if not supplied

## Procedure

1. Resolve the target file path: if `target_file` is supplied, use it; else if `<repo_root>/AGENTS.md` exists, use it; else use `<repo_root>/CLAUDE.md`
2. Construct a glob query against `repo_root` for convention files: `.claude/`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/`, `.github/`, and any `<slug>.md` matching the repo name
3. Execute the glob query; execute `grep -r` for inline agent instructions in `<repo_root>` excluding `node_modules/`, `.git/`, and binary files
4. If the target file exists: read it and validate it meets the done predicate (has lines, has reference pointers, does not rewrite referenced docs); update it if invalid
5. If the target file does not exist or is invalid: scaffold a new file
6. For each convention topic found, write one section containing only the topic title and one pointer per line in the form `**Topic**: see <path-or-url>`; do not restate policy
7. Keep the total artifact at or under 100 lines; prefer bullet tables over prose
8. Add one commit attribution line at the bottom: `<!-- commit: <owner or "agent"> -->`
9. Show the diff and prompt the human for confirmation or rejection
10. On confirmation: write the file; on rejection: run `git checkout -- <target_file>` and return blocked

## Failure and recovery
- **Rejection**: human rejects the diff. Run `git checkout -- <target_file>` and return blocked with the rejection reason
- **No response**: human abandons the session. Return non-converged
- **Missing repo root**: return error before any mutation
- **Empty conventions**: scaffold a minimal file with a placeholder attribution line `<!-- commit: agent -->` and no convention sections; do not fabricate conventions

## Output
The written file at `target_file`, or blocked or non-converged if the human did not confirm

## Provenance

Origin: getsentry/skills (Apache-2.0); revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241; adaptation is clean-room: contract reconstructed from normalized candidate metadata; no third-party expression copied
