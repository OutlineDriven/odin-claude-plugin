# Inline procedures (workspace, docs, and ICM state)

These three domains are handled inline without a dedicated domain skill.

## Workspace

1. Discover scratch artifacts in scope:
   ```sh
   fd -t f -E '.git' -E 'target' -E '_build' \
     '(\.(tmp|bak|outline)|repomix-output)' .
   fd -t f /tmp -g '<session-prefix>-*' 2>/dev/null
   ```
2. Confirm each is truly scratch (not referenced by any open plan, task, or active diff).
3. Remove with `rip` (not `rm`). Report count and paths.

## Docs

1. Scan in-scope file(s) for: stale `TODO`/`FIXME` (git-blame date > 6 months), comments contradicting current code, commented-out code blocks, multi-paragraph docstrings on non-API-surface functions, overclaims about external contracts.
2. Show the current text + proposed change for each candidate. Edit only on confirmation or for purely cosmetic fixes (whitespace, spelling).
3. Overclaims: annotate with `<!-- VERIFY -->` and surface to the user rather than deleting.

## ICM state

Run `icm list --sort recent | head -30`; for each stale entry show the current content plus the proposed replacement before calling `icm update`. For decisions made in this session not yet captured, show the proposed `icm store` call before executing. Write only on explicit user confirmation per entry.
