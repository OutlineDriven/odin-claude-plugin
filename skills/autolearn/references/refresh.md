# Refresh — maintain `docs/solutions/` against the current code

Read this for `autolearn mode:refresh [scope]`. It maintains existing learnings as the code evolves: their individual accuracy and the design of the set as a whole. Create mode writes one new doc; refresh mode keeps the old ones honest.

## Maintenance model — five outcomes

Classify every candidate doc into exactly one:

| Outcome | Meaning | Default action |
|---------|---------|----------------|
| **Keep** | Still accurate and useful | No edit. Report reviewed-and-trustworthy. |
| **Update** | Core solution correct, references drifted | Evidence-backed in-place edits |
| **Consolidate** | Two+ docs overlap heavily, both correct | Merge unique content into the canonical doc, delete the subsumed one |
| **Replace** | Old guidance is now misleading, better answer known | Write a trustworthy successor, then delete the old |
| **Delete** | No longer useful, applicable, or distinct | Delete the file |

## Core rules

1. **Evidence informs judgment.** Engineering judgment, not a mechanical scorecard.
2. **Prefer no-write Keep.** Don't edit a doc just to leave a review breadcrumb.
3. **Match docs to reality, not the reverse.** Code changed → the doc matches the code.
4. **Be decisive.** Ask only when the right action is genuinely ambiguous.
5. **No low-value churn.** No typo fixes, prose polish, cosmetic edits.
6. **Delete, don't archive.** No `_archived/`. Git history preserves every deleted file. If `docs/solutions/_archived/` exists, flag it in the report as a legacy artifact to clean up.

## Scope and route

Find every `.md` under `docs/solutions/`, excluding `README.md` and anything under `_archived/`.

A `[scope]` hint narrows it — try in order, stop at first hit: (1) subdirectory name, (2) frontmatter `module`/`component`/`tags` match, (3) filename partial match, (4) content keyword. No match → report the miss and exit (don't widen to everything). No scope hint → process everything. No candidate docs at all → report it and point the user at create mode.

Pick the lightest interaction path:

| Scope | When | Style |
|-------|------|-------|
| **Focused** | 1–2 files, or a named doc | Investigate, then recommend |
| **Batch** | up to ~8 mostly-independent docs | Investigate, then grouped recommendations |
| **Broad** | 9+, ambiguous, or repo-wide sweep | Triage first (inventory frontmatter, cluster by area, spot-check whether referenced files still exist), then investigate in batches |

## Phase 1 — investigate each doc

Read it, cross-reference claims against the current codebase, form a recommendation. Per doc, check:

- **References** — file paths, symbols, modules: still exist or moved?
- **Solution** — does the fix still match how the code works today?
- **Code examples** — do snippets reflect the current implementation?
- **Related docs** — cross-referenced learnings still present and consistent?
- **Auto memory** (if an auto-memory block is injected) — entries in the same domain? Tag memory-sourced signals `(auto memory [claude])`.
- **Overlap** — another in-scope doc covering the same domain? Record both paths, which dimensions overlap, which is broader/more current.

**Update vs Replace boundary:** references moved but the approach is still correct → Update. The recommended solution conflicts with current code, or the architecture changed → Replace. **If you're rewriting the Solution section, it's Replace, not Update.**

Judgment: contradiction with current code is a strong Replace signal. Age alone is not a stale signal — a 2-year-old doc that still matches code is fine. Check for a successor before deleting.

Subagents here are **read-only** investigators: return file path, evidence, recommended action, confidence, open questions. Run in parallel only for genuinely independent docs. These investigation subagents never write. Deletes, commits, and frontmatter metadata stay with the orchestrator. The one writing subagent is the Replace successor-drafter below — and even there the orchestrator validates the result, deletes the old file, and commits.

## Phase 1.5 — document-set analysis

Step back and judge the set as a whole:

- **Overlap** — for docs sharing module/component/tags/domain, compare problem statement, solution shape, referenced files, prevention rules, root cause. High overlap across 3+ dimensions → strong Consolidate signal.
- **Supersession** — older narrow precursor vs newer canonical doc → the older is a consolidation candidate.
- **Retrieval-value test** — before keeping two docs separate: "six months from now, does having these separate help discoverability, or just create drift risk?" Separate docs earn their keep only for genuinely different sub-problems someone would search independently.
- **Cross-doc conflict** — outright contradictions between docs actively confuse readers; more urgent than individual staleness. Flag for immediate resolution.

## Phase 2 — execute per action

### Keep
No edit. Summarize why it remains trustworthy.

### Update
In-place edits only when the solution is still substantively correct: rename a moved path/symbol, fix stale links, refresh implementation notes after a directory move, correct drifted frontmatter values. **Not** Update territory: typo/style-only edits, or cases where the old fix is now an anti-pattern or the troubleshooting path materially changed — those are Replace.

### Consolidate
Orchestrator handles it directly (docs are already read). Per cluster: confirm the canonical doc (broader, more current); extract unique content from the subsumed doc(s) (edge cases, extra prevention rules, alternative debugging paths); merge it into the canonical doc where it logically belongs (inline a bullet, or add a labeled section for a substantial sub-topic); repoint any cross-references to the canonical doc; delete the subsumed doc. 3+ overlapping docs → process pairwise. Reverse case also counts: a doc that grew to cover several genuinely independent problems can be recommended for a split.

### Replace
Process one at a time. Each successor is written by a subagent to protect the main context. Pass the subagent the old doc's full content, an investigation-evidence summary (what changed, what the code does now, why the old guidance misleads), the target path + category, and the contents of `references/schema.md` + `assets/solution-template.md` (don't let it invent fields, enums, or section order from memory). Then run `python3 scripts/validate-frontmatter.py <new-path>` until exit 0. After it completes, the orchestrator deletes the old file. `supersedes: [old-filename]` in the successor's frontmatter is optional — git history and the commit already record it.

**Evidence insufficient to write a trustworthy successor** → mark stale in place instead: add `status: stale`, `stale_reason: [what you found]`, `stale_date: YYYY-MM-DD`. Report what's missing.

### Delete
Only when the referenced code/workflow is gone and the problem domain no longer exists, or the doc is fully redundant with no unique content to merge, with no successor evidence. **Age is never a reason.** Auto-delete only when all three hold: implementation gone (or fully superseded), problem domain gone, inbound links absent or unambiguously decorative.

Before unlinking, grep the repo's markdown for citations of the file. Classify each: decorative ("see also") → Delete fine, clean up the citation in the same commit; substantive (cited doc relied on for content not stated inline) → Replace signal; mixed/unclear → stale-mark. A late-discovered citation that is anything but unambiguously decorative stops the Delete: reclassify (headless stale-marks; interactive asks).

## Headless variant

- Skip all questions; never pause.
- Process every in-scope doc. Attempt all safe actions (Keep, Update, Consolidate, auto-Delete, evidence-backed Replace).
- **Uncertain → mark `status: stale`** (`stale_reason`, `stale_date`), don't guess.
- A write that fails is recorded as **Recommended**, not retried into a mess.
- Always emit a report split into **Applied** (writes that landed) and **Recommended** (actions a human must apply or re-run interactively).

## Interactive questions

Most Updates and Consolidations apply directly without asking. Ask only when: the right action is genuinely ambiguous; about to Delete without all auto-delete criteria met; about to Consolidate with no clear-cut canonical; about to Replace. One question at a time, prefer multiple choice, lead with the recommended option.

## Report

```text
Refresh Summary
===============
Scanned: N docs

Kept: X   Updated: Y   Consolidated: C   Replaced: Z   Deleted: W   Marked stale: S
```

Then per file processed: path, classification, evidence (tag memory-sourced findings `(auto memory [claude])`), action taken or recommended. Headless splits into Applied / Recommended.

## Discoverability

A learning store nobody searches is dead weight. After refreshing, check whether the repo's `AGENTS.md`/`CLAUDE.md` would lead an agent to discover and search `docs/solutions/` — that a searchable store exists, its category/frontmatter structure, and when to search it. If the spirit is already met, do nothing. If not, draft the smallest addition (a line in an existing section beats a new heading). Interactive: show it and ask. Headless: don't edit instruction files — surface a "Discoverability recommendation" line in the report instead.

## Commit

One concern per commit, ODIN `Op:` trailer in the body:

- **Update a drifted doc** → `Op: correct` + `Restores:` citing what fell out of sync (`ref:<commit> | spec:<invariant>`).
- **Consolidate / Replace / Delete** (a capability of the doc set is removed) → `Op: purge` + `Removes:` citing what was removed (`path:<ref> | surface:<name>`). A Replace that nets a successor is judgment: trailer it `correct` (restoring accuracy) if the successor covers the same surface, `purge` if a doc genuinely went away.

Stage only refresh-modified files, never other dirty files. Commit message summarizes what was refreshed, matches the repo's existing style. Skip the commit if nothing was modified.
