---
name: autolearn
description: 'Use when a verified non-trivial fix lands. Automatically captures a durable learning doc to docs/solutions/ or a CONCEPTS.md entry, or determines nothing qualifies. Also handles refresh when solution docs may have drifted. Not for unverified fixes.'
---

# Autolearn

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A non-trivial fix has been verified (observed working, not hoped working), or explicit autolearn or refresh invocation. |
| Authority | Reversible-local: write only the operating repo's docs/solutions/ and repo-root CONCEPTS.md. Rollback via git revert or file restore from history. No VCS push, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes or refreshes docs/solutions/ learning docs and CONCEPTS.md; stages only the surfaces this skill wrote or edited. |
| Done | A validated learning or concept entry exists, or an explicit determination that nothing qualifies. |

## Inputs

- The verified fix or solved problem, from conversation history or codebase. Must be supplied or derivable from context.
- Optional: `mode:refresh [scope]` to maintain existing docs; `mode:headless` for non-interactive operation.
- Optional: an injected auto-memory block (supplementary context, not primary evidence).

## Procedure

### 0. Route the mode

Strip `mode:` tokens from arguments before treating the remainder as context or scope.

- **Capture** (default): document one solved problem into docs/solutions/.
- Vocabulary capture: a durable, reusable project term surfaces; reconcile CONCEPTS.md.
- Memory handoff: a fact about the user, preferences, or cross-project context surfaces; do not write it into docs/solutions/ or CONCEPTS.md; surface it as a memory-handoff candidate for the memory system to capture.
- Refresh: maintain existing docs/solutions/ and CONCEPTS.md.
- Headless: overlays any mode; skip all questions, never pause, apply safe actions, mark uncertain as stale.

Fire automatically on a trigger phrase ("that worked", "it's fixed", "working now", "problem solved", "verified the fix", "tests pass now", "build succeeds", "that approach failed") or after a verified non-trivial fix. Auto-firing is permission to evaluate, not permission to fabricate.

One run can do all three repo-scoped actions: write a learning doc, reconcile a concept, and flag a memory-handoff candidate.

Done when: the mode is routed and `mode:` tokens are stripped from arguments.

### 1. Reject-by-default gate

A doc is earned, not assumed. Verify all three preconditions:

1. The problem is solved, not in progress. An abandoned attempt counts as solved once it is finished (branch dead, decision to stop made); its learning is the anti-pattern — what was tried, the specific reason it failed, and the condition under which it would be worth trying again.
2. The solution is verified: observed working, not hoped working.
3. It was non-trivial, not a typo or obvious one-liner.

Then apply the reject-by-default gate (all three filters in order):

1. **Would I forget this?** Skip baseline knowledge anyone in this codebase already carries.
2. **Already covered?** If an existing docs/solutions/ doc covers it, updating that doc beats spawning a second one. A duplicate is drift, not knowledge.
3. **Universal or local?** Scope-qualify the claim. Say when a quirk is repo-specific and when a truth is general. An unqualified claim is a future trap.

The gate governs CONCEPTS.md entries too: a term earns a slot only when its precise local meaning would otherwise be forgotten, it is not already defined there, and it is scope-qualified to this project rather than general programming or domain English.

If nothing clears the gate, say so in one line and exit. A clean "nothing worth capturing here" is a valid, correct result.

Done when: all three preconditions and all three gate filters are evaluated, with a pass or a one-line "nothing qualifies" exit.

### 2. Capture: research (parallel, read-only)

Scan any injected auto-memory block for entries related to the problem. If it is absent or empty, skip it. If relevant entries exist, carry them as a labeled supplementary context block. Memory is supplementary; when it conflicts with the codebase or conversation, prefer the codebase or conversation. Tag any memory-derived line that lands in the final doc with `(auto memory [claude])`.

Dispatch three subagents in parallel. Each returns text and writes nothing.

1. **Context Analyzer**: from the problem, decide the track (bug vs knowledge), the problem_type, the category directory, and a slug filename (`[sanitized-problem-slug].md`, no date suffix). Return a frontmatter skeleton and which track applies. Do not invent enum values or fields.
2. **Solution Extractor**: extract the substance from the conversation, folding in the auto-memory excerpt as supplementary evidence. Bug track: Problem, Symptoms, What Didn't Work, Solution (with code), Why This Works, Prevention. Knowledge track: Context, Guidance, Why This Matters, When to Apply, Examples.
3. **Related-Docs Finder**: grep docs/solutions/ (`title:`, `tags:`, `module:`, `component:` on extracted keywords; narrow to the candidate subdirectory when known), read only frontmatter of candidates, fully read only strong matches. Score overlap across problem statement, root cause, solution approach, referenced files, prevention rules: High (4-5 dimensions), Moderate (2-3), Low (0-1). Return links and the overlap verdict.

Wait for all three before assembling.

Done when: all three subagents return and their results are assembled for the write step.

### 3. Capture: assemble and write

1. **Overlap gate**: High (4-5) → update the existing doc, keep its path and frontmatter, add `last_updated: YYYY-MM-DD`. Moderate (2-3) → create normally; note as a refresh/consolidation candidate. Low or none → create normally. Done when: the overlap gate decision is made.
2. Read `assets/solution-template.md`; assemble the doc with the track's section structure. Done when: the doc is assembled with the correct track structure.
3. Frontmatter per the Solution schema section; apply the YAML-safety quoting rule to array items. Done when: frontmatter follows the Solution schema with YAML-safe quoting.
4. `mkdir -p docs/solutions/<category>/`, write `docs/solutions/<category>/<slug>.md`. Done when: the doc file is written to the correct category directory.
5. Validate: `python3 scripts/validate-frontmatter.py <path>`. Exit 0 = parser-safe; exit 1 names the offending field. Quote, re-write, re-run until 0. Done when: the validator exits 0.
6. Read the file back to confirm it landed as intended. Done when: the file is read back and confirmed correct.
7. **Concept reconciliation** (optional, when warranted): if the run surfaced a durable project term that clears the gate, reconcile CONCEPTS.md per step 5. Done when: concept reconciliation is performed or skipped.

### 4. Refresh check (selective, not automatic)

Suggest refresh with a narrow scope only when the new fix contradicts or supersedes an older doc, the work was a refactor/migration/rename/dependency-bump that likely invalidated references, or the Related-Docs Finder surfaced strong refresh candidates or moderate overlap. Otherwise do not. Capture the new learning first; refresh is targeted maintenance after.

Done when: a refresh recommendation is made or explicitly skipped.

### 5. Vocabulary capture: CONCEPTS.md

CONCEPTS.md at the operating repo root is the shared-vocabulary glossary. It holds words with a precise meaning in this codebase, with one definition per concept. Other knowledge-capture processes may also write to this shared surface; always follow the one-definition-per-concept discipline.

1. Locate the file: `fd -g 'CONCEPTS.md' --max-depth 2`. Absent and a term clears the gate → create it. Absent and nothing clears → write nothing; never scaffold an empty file. Done when: the file is located or its absence is handled.
2. Search for the term and its synonyms: `git grep -ni '<term>' CONCEPTS.md`. A hit means the concept exists — refresh on drift, never add a second entry. Done when: the term is searched and existing entries are identified.
3. New term → add one entry: a one-sentence definition of what it means here and what distinguishes it from neighbors; a second paragraph only for non-obvious behavioral rules. Retire synonyms as an `*Avoid:*` aliases line. No file paths, dates, owners, or version-specific claims. The file stands on its own. Done when: the new entry is written with its definition and alias line.
4. Read the file back to confirm the merge landed and created no duplicate heading. Done when: the file is read back with no duplicate headings.

### 6. Refresh: maintain existing docs

Find every `.md` under `docs/solutions/`, excluding `README.md` and anything under `_archived/`. A `[scope]` hint narrows it — try in order, stop at first hit: (1) subdirectory name, (2) frontmatter `module`/`component`/`tags` match, (3) filename partial match, (4) content keyword. No match → report the miss and exit. No scope hint → process everything.

Classify every candidate doc into exactly one outcome:

| Outcome | When | Action |
|---------|------|--------|
| Keep | Still accurate and useful | No edit. Report reviewed-and-trustworthy. |
| Update | Core solution correct, references drifted | Evidence-backed in-place edits. |
| Consolidate | Two or more docs overlap heavily, both correct | Merge unique content into the canonical doc, delete the subsumed one. |
| Replace | Old guidance is now misleading, better answer known | Write a trustworthy successor, then delete the old. |
| Delete | No longer useful, applicable, or distinct | Delete the file. |

Core rules: evidence informs judgment, not a mechanical scorecard; prefer no-write Keep; match docs to reality, not the reverse; be decisive; no low-value churn (no typo fixes, prose polish, cosmetic edits); delete, don't archive (no `_archived/`, git history preserves everything).

Investigate each doc: read it, cross-reference claims against current codebase. Check references (file paths, symbols, modules — still exist or moved?), solution (does the fix still match how the code works today?), code examples (do snippets reflect current implementation?), related docs (cross-referenced learnings still present and consistent?), overlap (another in-scope doc covering the same domain?). Update vs Replace boundary: references moved but approach still correct → Update; recommended solution conflicts with current code or architecture changed → Replace; if rewriting the Solution section, it is Replace, not Update. Age alone is not a stale signal. Check for a successor before deleting.

Document-set analysis: step back and judge the set as a whole. High overlap across 3+ dimensions → strong Consolidate signal. Older narrow precursor vs newer canonical doc → consolidation candidate. Retrieval-value test: does keeping these separate help discoverability or just create drift risk? Cross-doc contradictions are more urgent than individual staleness.

Execute per action:
- Keep: no edit, summarize why it remains trustworthy.
- Update: in-place edits only when solution is still substantively correct. Not Update territory: typo/style-only edits, or old fix is now an anti-pattern → Replace.
- Consolidate: confirm canonical doc (broader, more current); extract unique content from subsumed doc(s); merge into canonical; repoint cross-references; delete subsumed. Three or more overlapping → process pairwise.
- Replace: process one at a time. Write a successor, validate with `scripts/validate-frontmatter.py` until exit 0, then delete the old file. Evidence insufficient → mark stale in place: add `status: stale`, `stale_reason`, `stale_date: YYYY-MM-DD`.
- Delete: only when referenced code/workflow is gone, problem domain no longer exists, and inbound links absent or unambiguously decorative. Before unlinking, grep repo markdown for citations. Decorative → delete fine, clean up citation; substantive → Replace signal; mixed/unclear → stale-mark. A late-discovered citation that is anything but unambiguously decorative stops the Delete.

Headless variant: skip all questions, never pause. Process every in-scope doc. Attempt all safe actions. Uncertain → mark `status: stale`. A write that fails is recorded as Recommended, not retried. Emit a report split into Applied and Recommended.

Report:
```
Refresh Summary
===============
Scanned: N docs

Kept: X   Updated: Y   Consolidated: C   Replaced: Z   Deleted: W   Marked stale: S
```
Then per file: path, classification, evidence, action taken or recommended.

After refreshing, check whether the repo's documentation would lead an agent to discover and search `docs/solutions/`. If not, surface a discoverability recommendation in the report. Do not edit instruction files.

Done when: every in-scope doc is classified and acted on, and the refresh report is emitted.

### 7. Commit

One learning per commit. Stage only the surfaces this skill wrote or edited (a solution doc, CONCEPTS.md, or both). Never stage other dirty files. Commit and publish by the operating repo's normal flow. Skip the commit if nothing was modified.

Done when: the commit is made with only this skill's surfaces staged, or skipped when nothing was modified.

## Failure and recovery
- Nothing qualifies: if no fix clears the reject-by-default gate, state "nothing worth capturing here" in one line and exit. This is a valid result, not a failure.
- Validation failure: `scripts/validate-frontmatter.py` exits 1 naming the offending field. Quote the value, re-write the file, re-run until exit 0. Do not declare success while validation fails.
- Overlap collision: High overlap with an existing doc → update the existing doc, do not create a duplicate. Creating a duplicate when an update was warranted is drift, not knowledge.
- Insufficient evidence for Replace: mark the doc stale in place (`status: stale`, `stale_reason`, `stale_date`) rather than guessing a successor.
- Late-discovered citation blocks Delete: reclassify to stale-mark or Replace; do not delete.
- Partial-result rule: if a write fails during refresh, record it as Recommended, do not retry into a mess.
- Rollback: all writes are to local files under version control. Revert the commit or restore the file from git history.

## Output
One validated learning doc at `docs/solutions/<category>/<slug>.md` (or updated existing doc), optionally a CONCEPTS.md entry and a memory-handoff candidate, or a one-line "nothing qualifies" determination — in refresh mode, a report classifying every scanned doc into Keep/Update/Consolidate/Replace/Delete/stale with applied and recommended actions.

## Solution schema

Canonical frontmatter contract for `docs/solutions/` learning docs. The validator (`scripts/validate-frontmatter.py`) only catches silent YAML corruption; the field and enum rules below remain binding.

### Two tracks

`problem_type` picks the track. The track decides which extra fields are required.

| Track | problem_types | What it is |
|-------|---------------|------------|
| Bug | `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error` | Defects and failures that were diagnosed and fixed |
| Knowledge | `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`, `architecture_pattern`, `design_pattern`, `tooling_decision`, `convention` | Practices, patterns, conventions, decisions, workflow improvements. Prefer the narrowest value; `best_practice` is the fallback. |

### Required fields (both tracks)

- `title`: clear problem/topic title (string).
- `date`: `YYYY-MM-DD`.
- `category`: the `docs/solutions/` subdirectory (see Category map).
- `module`: module or area affected (string).
- `problem_type`: one enum value from the tracks table; determines the track.
- `component`: component or subsystem involved (free-form string). Keep it consistent within a repo so frontmatter search works.
- `severity`: one of `critical`, `high`, `medium`, `low`.

### Bug-track required fields

- `symptoms`: array, 1-5 observable symptoms (errors, broken behavior).
- `root_cause`: one of: `missing_association`, `missing_include`, `missing_index`, `wrong_api`, `scope_issue`, `thread_violation`, `async_timing`, `memory_leak`, `config_error`, `logic_error`, `test_isolation`, `missing_validation`, `missing_permission`, `missing_workflow_step`, `inadequate_documentation`, `missing_tooling`, `incomplete_setup`.
- `resolution_type`: one of: `code_fix`, `migration`, `config_change`, `test_fix`, `dependency_update`, `environment_setup`, `workflow_improvement`, `documentation_update`, `tooling_addition`, `seed_data_update`.

### Knowledge-track fields

No required fields beyond the shared core. All optional:

- `applies_when`: array (≤5), conditions where the guidance applies.
- `symptoms`: array (≤5), the gap or friction that prompted the guidance.
- `root_cause`: from the bug-track enum, if there is a specific one.
- `resolution_type`: from the bug-track enum, if a change was applied.

### Optional fields (both tracks)

- `related_components`: array of other components involved.
- `tags`: array (≤8) of search keywords, lowercase and hyphen-separated.

### Category map (problem_type → directory)

| problem_type | directory |
|---|---|
| `build_error` | `docs/solutions/build-errors/` |
| `test_failure` | `docs/solutions/test-failures/` |
| `runtime_error` | `docs/solutions/runtime-errors/` |
| `performance_issue` | `docs/solutions/performance-issues/` |
| `database_issue` | `docs/solutions/database-issues/` |
| `security_issue` | `docs/solutions/security-issues/` |
| `ui_bug` | `docs/solutions/ui-bugs/` |
| `integration_issue` | `docs/solutions/integration-issues/` |
| `logic_error` | `docs/solutions/logic-errors/` |
| `developer_experience` | `docs/solutions/developer-experience/` |
| `workflow_issue` | `docs/solutions/workflow-issues/` |
| `best_practice` | `docs/solutions/best-practices/` |
| `documentation_gap` | `docs/solutions/documentation-gaps/` |
| `architecture_pattern` | `docs/solutions/architecture-patterns/` |
| `design_pattern` | `docs/solutions/design-patterns/` |
| `tooling_decision` | `docs/solutions/tooling-decisions/` |
| `convention` | `docs/solutions/conventions/` |

Filename: `[sanitized-problem-slug].md` — no date suffix (the `date` field carries that).

### Validation rules

1. Determine the track from `problem_type`.
2. All shared required fields present.
3. Bug-track docs also carry `symptoms`, `root_cause`, `resolution_type`.
4. Knowledge-track docs need no extra required fields.
5. Enum fields match allowed values exactly.
6. Array fields respect min/max item counts.
7. `date` matches `YYYY-MM-DD`.

### YAML safety (array items)

Strict YAML parsers misread array items that start with a reserved indicator as unquoted scalars. For any array-of-strings field (`symptoms`, `applies_when`, `tags`, `related_components`), wrap the value in double quotes when it starts with any of: `` ` `` `[` `]` `{` `}` `,` `*` `&` `!` `|` `>` `%` `@` `?`. Also quote when the value contains `": "`. Scalar fields (`title:`, `module:`) have a separate failure mode — an unquoted ` #` truncates at the comment, an unquoted `: ` reframes as a mapping. `scripts/validate-frontmatter.py` catches those; quote and re-run until it exits 0.
