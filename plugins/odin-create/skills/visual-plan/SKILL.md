---
name: visual-plan
description: 'Use when the user wants an implementation plan built and visualized for a goal. Researches the repository and writes a self-contained HTML plan page ending in an observable acceptance checklist. Not for prose plan documents; use plan.'
---

# Visual plan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an implementation plan built and visualized for a goal |
| Authority | Reversible local write only: the single plan page in the diagrams directory; rollback is deleting that page |
| Side effect | Writes the plan page to the diagrams directory; opens it in a browser |
| Done | Nine mandated sections present, ending in an observable acceptance checklist |

## Inputs

The goal statement is required from the invocation; if it is missing or too vague to bound a scope, stop and ask for it. Everything else is researched read-only from the user's repository: entry points, existing patterns, affected modules, public APIs, tests, config/schema/data model, similar features, and constraints from README, CHANGELOG, and docs.

## Procedure

1. Bound scope before any mutation: restate what will change and what is intentionally out. Research and composition are read-only; the only mutations in this skill are creating the diagrams directory if it is missing and the single final page write. **Done when:** scope is bounded with in/out stated.
2. Research the repository for the goal: entry points, existing patterns, affected modules, public APIs, tests, config/schema/data model, similar features, and constraints from README/CHANGELOG/docs. Stop rather than invent evidence the repo does not provide; record evidence gaps in the page instead of fabricating APIs, paths, or behavior. **Done when:** every research dimension is gathered or recorded as an evidence gap.
3. Compose a self-contained HTML page with no remote assets: inline styles, collapsible detail sections, and diagrams as Mermaid with an inlined renderer or hybrid cards. Use exactly these nine sections in order: Goal and scope; Current state; Proposed design; Implementation sequence; File map; Interface/contracts; Risk and decision matrix; Test plan; Acceptance checklist. Let overview and architecture dominate; keep file, test, and reference detail compact or collapsed. **Done when:** the page has all nine sections in order.
4. Choose the target path in the diagrams directory, the directory the user named, else `~/.agent/diagrams/`, with the file named for the goal. If that directory does not exist, create only it. Never probe writability with zero-byte, scratch, or placeholder files and never create-then-delete anything: the final write in step 5 is the writability proof. **Done when:** the target path is chosen and the directory exists.
5. Write the complete page in one operation to the final path. Never write a partial, empty, or placeholder page, and never fall back to another location. **Done when:** the complete page is written to the final path.
6. Open the written page in the user's default browser. **Done when:** the page is opened or the open failure is reported.

## Failure and recovery
- Unbounded goal or missing research evidence: stop, report what is missing, write nothing.
- Write blocker (directory creation fails, permission denied, quota, read-only filesystem): report the exact error and stop. The filesystem is left as found: no probe files, no scratch paths, no cleanup deletions, no fallback location.
- Incomplete or incorrect page at the target from this run: replace it with one complete write or delete that single page as rollback; never leave it and claim done.
- Browser open fails: report it; the done predicate is the written page, not the open.

## Output
The final page path, confirmation of the nine sections in order ending with the acceptance checklist, and the browser-open result; otherwise `blocked-input` with what is missing, or `write-blocker` with the exact error.
