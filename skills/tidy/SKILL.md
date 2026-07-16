---
name: tidy
description: Dispatch compress operations. Use when the user says "tidy" or names a file, diff, memory, workspace, git stack, or doc to tidy.
---

# Tidy: ODIN's compress-operations dispatcher

Compress first. Before adding complexity, reduce coupling. Before changing behavior,
improve structure. This skill detects *what* needs tidying from context and routes
to the right domain skill. Domain procedures live in those domain skills; this skill
owns only scope detection, dispatch, and the output contract. Tidy's deletions are
compress-class (behavior-preserving: dead/redundant/structural); a request to remove
a live capability is purge. Route it out to `refactor-break-compat`; never tidy inline.

---

## Scope detection

Inspect context in priority order and dispatch to the first matching domain:

| Signal | Domain | Dispatch to |
|---|---|---|
| File path(s), active diff, or `cargo`/`dune` target named | **Code** | `cleanup-codebase` skill |
| `memory/` directory, `MEMORY.md`, or memory file(s) named | **Memory** | `memory-clean` then `memory-update` skills |
| `.outline/`, `/tmp` scratch, `*.tmp`, `*.bak`, repomix packs | **Workspace** | `references/inline-procedures.md` |
| `git sl`, commit stack, commit message(s) named | **Git** | `git-branchless` skill + `commit` skill |
| Docs, comments, ADRs, READMEs, plan files named | **Docs** | `references/inline-procedures.md` |
| User explicitly says "tidy ICM" or names an ICM topic | **ICM state** | `references/inline-procedures.md` |
| "remove/drop/kill a live capability", compat-shim or feature-flag teardown named | **Purge** | `refactor-break-compat` skill |
| No clear signal | none | Ask: "What are we tidying: code, memory, workspace, git, docs, or ICM?" |

---

## Inline procedures (workspace, docs, and ICM state)

These three domains have no dedicated domain skill; their step-by-step
procedures live in `references/inline-procedures.md`. Read the Workspace
section when the scope-detection table matched Workspace, the Docs section
when it matched Docs, and the ICM state section when it matched ICM state.

---

## Output contract

After completing each domain, emit exactly:

```
Tidy — <domain>
  Removed:   N  (up to 5 paths/names; "…and M more" if larger)
  Fixed:     N
  Proposed:  N  (awaiting confirmation)
  Skipped:   N  (<one-phrase reason>)
  Next:      <one sentence, e.g. "Run build to verify" or "Nothing else in scope">
```

If nothing needed tidying: `Tidy — <domain>: nothing to do.`

---

## Constitutional rules

1. **Atomic commits**: tidy commits are always separate from behavior commits. No exceptions. Use `git move --fixup` when embedding alongside active work.
2. **Scope discipline**: tidy only the explicit target or the currently active file/system. No opportunistic sweeps.
3. **Confirm before delete**: show evidence; never silently remove memories, commits, or files.
4. **Compress-class only**: tidying is behavior-preserving net-deletion (dead/redundant) or net-simplification; introducing a new pattern, or removing a live capability (that is purge; dispatch out), is a separate task.
5. **Verify after**: after code or git tidy, run repo-native verification (build + tests + linter).
6. **ODIN baseline wins**: if any rule here conflicts with `~/.claude/claude/system-prompt-baseline.md`, the baseline wins.
