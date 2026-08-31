---
name: explore
description: 'Use when asked to explore the codebase to map structure, symbols, and dependencies. Emits a structured orientation report with architecture, pattern, tooling, dependency, and critical-file sections. Don''t use for tasks that require source or remote-system changes.'
---

# Explore

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "explore", "find where X is", "how does X work in the code", or "map the codebase" for repo-local orientation. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat-output structured orientation report; may dispatch Explore subagents. No state mutation. |
| Done | All 8 output sections emitted or applicability stated, scope declared, and dispatch/escalation rules followed. |

## Inputs

- Task text (supplied): the orientation question or concern to map.
- Repo working tree (supplied by environment): read-only access to the local checkout.
- Optional: specific files, directories, or concerns used to bound scope before dispatch.

## Procedure

1. **Scope.** Parse the task; identify the files, directories, and concerns in scope. State the scope explicitly before any dispatch or read.
2. **Dispatch decision.** For multi-file or uncertain tasks, dispatch Explore subagents instead of reading directly. Escalation: 1 subagent for a single-concern known scope; 3 subagents for multiple concerns or unknown scope; 5 subagents for a cross-module or architectural survey. Auto-skip (direct reads allowed) only for a single file under 50 LOC. Dispatch first; do not grep or glob a multi-file task before dispatching.
3. **Discovery with token-efficient flags.** File discovery: `fd -e <ext> --max-results 50`. Symbol search: `ast-grep run -p 'PATTERN' -l <lang> -C 1` or `git --no-pager grep -n -C 2 'pattern'`. Content preview: `bat -P -p -n -r START:END file` or read with offset/limit. Directory structure: `eza --tree --level=2`.
4. **Synthesis.** Emit all 8 output sections below. Omit a section only when genuinely not applicable and state why.
5. **Heavy-codebase escape hatch.** When scope exceeds 50 files, use a codebase-packing tool as an internal analysis aid only (never hand packed output to the user); search the packed output for targeted extraction. If no packing tool is available, narrow scope and state the narrowing.
6. **Tool restrictions.** Allowed (read-only): `eza`, `fd`, `ast-grep` (find-only), `git grep`, `rg`, `bat`, `tokei`, `Read`, `codebase_search`, and any available codebase-analysis or codebase-packing MCP tooling. Banned: `Edit`, `Write`, `mcp__edit__edit_file`, `git commit`, and any state-mutating bash command.
7. **Recursion guard.** Do not re-enter a router or orchestrator skill from within this leaf skill.

## Failure and recovery
- **Scope too large (> 50 files).** Apply the heavy-codebase escape hatch; if no packing tool is available, narrow scope, state the narrowing, and proceed with the reduced scope.
- **Empty or missing source.** For each affected section, state that it is not applicable and why rather than fabricate content.
- **Dispatch failure.** Return a partial result containing the sections that could be filled; never claim the done predicate holds when required sections are missing.
- **Banned mutating tool attempted.** Stop immediately, do not perform the mutation, and report the attempt. No rollback is needed because no mutation occurs.
- **Blocked / non-converged result.** Terminal classification stating which sections could not be filled and the concrete reason.

## Output
A structured orientation report with these 8 sections (omit a section only when not applicable, stating why):

### Task understanding

Brief restatement of the task and the identified scope boundaries.

### Architecture context

```
[Module/Layer Name]
- path/to/file.ts:L10-50 — [Purpose] — [Relevance]
- path/to/interface.ts — [Purpose] — [Relevance]
```

### Pattern context

```
[Pattern Category]
- path/to/reference.ts — [Pattern description] — [How to apply]
```

### Tooling context

```
- Build: [command] — [when to run]
- Test: [command] — [scope/coverage]
- Lint: [command] — [config location]
```

### Dependency map

```
Internal:
- module-a -> module-b (reason)

External:
- library-name@version — [usage context]
```

### Critical files summary

| Priority | File | Purpose | Action Hint |
|----------|------|---------|-------------|
| P0 | path/to/core.ts | Core logic | Modify |
| P1 | path/to/types.ts | Type definitions | Extend |
| P2 | path/to/utils.ts | Helpers | Reference |

### Constraints & considerations

- [Constraint 1]: [Impact on implementation]
- [Constraint 2]: [Impact on implementation]

### Recommended next steps

1. [First action with specific file reference]
2. [Second action with specific file reference]

## Provenance

Origin: odin-1.x-current-skill (`skills/explore/SKILL.md`). Revision: none pinned. License: project-owned. Clean-room adaptation preserving the dispatch/escalation tiers, token-efficient discovery flags, 8-section report contract, read-only tool restrictions, heavy-codebase escape hatch, and recursion guard.
