# Refresh: maintain `docs/solutions/` against the current code

Owner. autolearn/SKILL.md section 6 inlines the refresh loop. Do not recopy.

Read this for `autolearn mode:refresh [scope]`. Classify every candidate doc into exactly one outcome:

| Outcome | Meaning | Default action |
|---------|---------|----------------|
| **Keep** | Still accurate and useful | No edit. Report reviewed-and-trustworthy. |
| **Update** | Core solution correct, references drifted | Evidence-backed in-place edits |
| **Consolidate** | Two+ docs overlap heavily, both correct | Merge unique content into the canonical doc, delete the subsumed one |
| **Replace** | Old guidance is now misleading, better answer known | Write a trustworthy successor, then delete the old |
| **Delete** | No longer useful, applicable, or distinct | Delete the file |

## Execution notes

- No candidate docs at all → report it and point the user at create mode.
- Pick the lightest interaction path: Focused (1-2 files) → investigate, then recommend; Batch (up to ~8 mostly-independent docs) → grouped recommendations; Broad (9+, ambiguous, or repo-wide) → triage first (inventory frontmatter, cluster by area, spot-check whether referenced files still exist), then investigate in batches.
- Investigators are read-only subagents: return path, evidence, recommended action, confidence, open questions; never write. Deletes, commits, and frontmatter metadata stay with the orchestrator. The one writing subagent is the Replace successor-drafter; even there the orchestrator validates the result, deletes the old file, and commits.
- Tag memory-sourced findings `(auto memory [claude])`.
- Consolidate reverse case: a doc that grew to cover several genuinely independent problems is a split candidate.
- Replace successor-drafter input: the old doc's full content, an investigation-evidence summary (what changed, what the code does now, why the old guidance misleads), the target path + category, and the contents of `references/schema.md` + `assets/solution-template.md` (never invented from memory). `supersedes: [old-filename]` in the successor is optional.

## Interactive questions

Most Updates and Consolidations apply directly without asking. Ask only when: the right action is genuinely ambiguous; about to Delete without all auto-delete criteria met; about to Consolidate with no clear-cut canonical; about to Replace. One question at a time, prefer multiple choice, lead with the recommended option.

## Commit

One concern per commit, ODIN `Op:` trailer in the body.
