---
name: drift-detect
description: 'Use when roadmap, plans, or docs may have drifted from code, or when restarting a stalled project. Not for PR doc sync: use docs-update.'
---

# Drift detect

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "plan drift", asks whether roadmap/plans/docs still match code, or decides what to rebuild when restarting a stalled project or cutting a release from stale plans |
| Authority | Reversible local: writes only optional `.outline/drift-detect/` evidence or reality-check artifacts; rollback is version control or undo. No remote mutation. No doc, issue, PR, or code mutation. |
| Side effect | Optional local artifact under `.outline/drift-detect/`; rollback is deleting that directory |
| Done | Reality Check Report returned with executive summary, drift analysis, gap analysis, cross-reference table, and prioritized reconstruction plan; every item evidence-cited |

## Inputs

- Target scope: whole repo, named plan file, named milestone, release branch, or feature area. Must be supplied.
- `--sources=github,docs,code`: comma list of sources to scan. If omitted, use all three. Omit a source only when unavailable or irrelevant.
- `--depth=quick|thorough`: `quick` samples active surfaces; `thorough` follows related docs, symbols, and history. Default: `thorough`.
- Optional output artifact: `.outline/drift-detect/reality-check-YYYYMMDD-HHMM.md` when the report is too long for chat.

## Procedure

1. **Scope the scan.** Restate the user's target. Resolve sources from flags; if none given, use all three. Create a scratch evidence bundle in memory or `.outline/drift-detect/evidence.json` only when needed for long synthesis. Keep it minimal: `{github, docs, code, signals, generatedAt}`. Done when: the target is restated, sources are resolved, and the evidence bundle is initialized.
2. **Collect GitHub reality** (`--sources=github`). Use `gh` JSON output; never scrape web HTML.

   ```bash
   gh issue list --state open --limit 200 --json number,title,labels,state,assignees,createdAt,updatedAt,milestone,url
   gh pr list --state open --limit 100 --json number,title,state,isDraft,labels,createdAt,updatedAt,mergeStateStatus,reviewDecision,changedFiles,additions,deletions,files,url
   gh api repos/{owner}/{repo}/milestones --paginate --jq '[.[] | {number,title,state,open_issues,closed_issues,due_on,updated_at,description}]'
   ```

   Extract: stale issues (`updatedAt` >90 days; high-priority stale = 60 days), issue categories from labels/title (`security`, `bug`, `feature`, `docs`, `infra`, `tech-debt`), PR risk (draft PRs >30 days, merge-conflicted, attached to promised milestones), overdue milestones (due date past with `open_issues > 0`; critical if >30 days overdue and release-labeled), already-done candidates (issue titles semantically matching implemented files/symbols from step 4). If `gh` is unavailable or unauthenticated, mark GitHub `unavailable` and continue with docs/code. Done when: GitHub reality is collected or marked unavailable.

3. **Collect documentation intent** (`--sources=docs`). Use `find` for doc file names, then `read` only candidate files/sections.

   Candidate files: `README*`, `PLAN*`, `ROADMAP*`, `TODO*`, `CHANGELOG*`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING*`, `docs/**`, `documentation/**`, `.github/ISSUE_TEMPLATE/**`, `.github/PULL_REQUEST_TEMPLATE*`.

   For each document, record: headings naming goals/phases/release targets/features/non-goals; checkbox state (total, checked, unchecked, completion percent = checked/total); completion claims (`complete`, `done`, `shipped`, `ready`, `implemented`, `v1`, `release`); feature list items under Features/Roadmap/Plan/API sections (strip marketing adjectives before matching); stale-doc hints (no git change in 180+ days, old version numbers, removed symbol references, examples importing nonexistent paths). If no docs exist, classify as a documentation gap, not drift. Done when: documentation intent is collected or classified as a documentation gap.

4. **Collect code reality** (`--sources=code`). Prefer indexed codegraph when available; otherwise use `ast-grep` and `git grep` fallback.

   Framework sniff: read `package.json` (Node: react, next, vue, angular, express, fastify, nestjs, hono, jest, vitest, mocha, playwright, cypress), `pyproject.toml`/`requirements*.txt`/`setup.cfg` (Python: django, flask, fastapi, pytest, unittest), `Cargo.toml` (Rust: bins, workspaces, tests, benches, axum, actix, rocket), `go.mod` (Go: gin, echo, chi, `_test.go`). Check `.github/workflows/**`, `.gitlab-ci.yml`, `circle.yml`, `Jenkinsfile`, `buildkite/**` for CI.

   Symbol/dependency reality: if codegraph indexed, use explore/search/callers/callees/impact. Fallback:

   ```bash
   ast-grep --pattern 'export $X' --lang ts src
   ast-grep --pattern 'def $NAME($$$ARGS): $$$BODY' --lang python .
   ast-grep --pattern 'func $NAME($$$ARGS) $$$BODY' --lang go .
   git grep -nE '\b(auth|login|session|payment|route|controller|handler|model|migration|schema)\b' -- ':!node_modules' ':!dist' ':!build'
   ```

   Native drift signals to collect:
   - doc-drift with zero coupling: doc files whose recent changes do not co-change with related source. Docs with repeated doc-only commits and no matching source commits for referenced terms are MEDIUM; exact removed symbol references are HIGH.
   - at-risk areas: directories with high bug-fix churn and stale/low ownership. Mark HIGH when a planned feature maps to an area with high bug-fix density and no recent owner activity.
   - stale docs: docs older than 180 days describing active or changed code paths.
   - orphan exports / dead starts: exported symbols or public endpoints not called/imported. Orphan + documented feature = HIGH drift; orphan without docs = LOW cleanup signal.
   - test gap: implementation exists for documented critical behavior but no matching test file, no test script, or CI never runs tests.

   Done when: code reality is collected with framework sniff, symbol/dependency reality, and native drift signals.

5. **Normalize evidence.** Build a compact bundle rather than dumping transcripts. Every array item carries `{source, evidence, confidence}`. Evidence must be citeable: `README.md:42`, `issue #17`, `src/auth/session.ts`, `.github/workflows/test.yml`, or a command result. Done when: the evidence bundle is compact, citeable, and confidence-tagged.
6. **Classify drift and gaps.** Apply drift types, gap types, prioritization weighting, fuzzy cross-reference matching, native signal interpretation, and synthesis rules from `references/drift-taxonomy.md`. Done when: every evidence item is classified as a drift type or gap type with severity, certainty, and recommendation.
7. **Synthesize the report.** Delegate one synthesis pass to a semantic analyst role. Give the role the evidence bundle and taxonomy; it then emits the report. Never hardcode model names. Never name or invoke a skill as a dependency.

   Prompt shape:

   ```text
   Act as the semantic analyst for a plan-vs-reality drift scan.
   Input: structured evidence from GitHub, docs, code, and native signals.
   Task: produce a Reality Check Report.
   Rules:
   - Be specific. Each finding includes Evidence.
   - Verify each completed checkbox/phase against code evidence.
   - Verify each open issue as active, stale, already implemented, duplicate, or blocked.
   - Cross-reference documented features to implemented features using fuzzy/semantic matching.
   - Classify drift and gaps using the taxonomy.
   - Produce Immediate / Short-term / Medium-term / Backlog plan buckets.
   - No generic advice; every plan item has severity and evidence.
   ```

   Done when: the synthesis pass emits the report with every finding evidence-cited.
8. **Emit the Reality Check Report** using the report template in `references/drift-taxonomy.md`. Done when: the report is emitted with executive summary, drift analysis, gap analysis, cross-reference table, prioritized reconstruction plan, quick wins, and unknowns.

## Failure and recovery
- gh unavailable or unauthenticated: mark GitHub `unavailable`, continue with docs/code. Never invent issue state.
- No docs exist: classify as documentation gap, not drift. Continue with GitHub/code.
- Codegraph not indexed: fall back to `ast-grep` and `git grep`. Mark code evidence certainty as MEDIUM or LOW.
- Shallow clone: git history signals are unreliable; mark native signals as LOW certainty and list under Unknowns.
- All sources unavailable: stop and report which sources failed and why. Do not emit a report with fabricated evidence.
- Synthesis produces a finding without evidence: reject the finding. Every drift/gap/plan item must cite concrete evidence or it does not appear in the report.
- No mutation during scan: if any step would mutate docs, issues, PRs, or code, stop that step. The scan is read-only except for the optional `.outline/drift-detect/` artifact. Rollback: delete `.outline/drift-detect/`.

## Output
A Reality Check Report with executive summary, drift analysis, gap analysis, cross-reference table, prioritized reconstruction plan, quick wins, and unknowns, every item evidence-cited, optionally written to `.outline/drift-detect/reality-check-YYYYMMDD-HHMM.md` when too long for chat.
