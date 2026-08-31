---
name: drift-detect
description: 'Use when the user says plan drift, asks whether the roadmap, plans, or docs still match the code, or is deciding what to rebuild when restarting a stalled project or cutting a release from stale plans. Returns a Reality Check Report with drift and gap analysis, cross-reference table, and prioritized reconstruction plan, every item evidence-cited. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Drift detect

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "plan drift", asks whether roadmap/plans/docs still match code, or decides what to rebuild when restarting a stalled project or cutting a release from stale plans |
| Authority | Reversible local: write only to optional `.outline/drift-detect/` evidence or reality-check artifacts; no doc, issue, PR, or code mutation |
| Side effect | Optional local artifact under `.outline/drift-detect/`; rollback is deleting that directory |
| Done | Reality Check Report returned with executive summary, drift analysis, gap analysis, cross-reference table, and prioritized reconstruction plan; every item evidence-cited |

## Inputs

- Target scope: whole repo, named plan file, named milestone, release branch, or feature area. Must be supplied.
- `--sources=github,docs,code`: comma list of sources to scan. If omitted, use all three. Omit a source only when unavailable or irrelevant.
- `--depth=quick|thorough`: `quick` samples active surfaces; `thorough` follows related docs, symbols, and history. Default: `thorough`.
- Optional output artifact: `.outline/drift-detect/reality-check-YYYYMMDD-HHMM.md` when the report is too long for chat.

## Procedure

1. **Scope the scan.** Restate the user's target. Resolve sources from flags; if none given, use all three. Create a scratch evidence bundle in memory or `.outline/drift-detect/evidence.json` only when needed for long synthesis. Keep it minimal: `{github, docs, code, signals, generatedAt}`.

2. **Collect GitHub reality** (`--sources=github`). Use `gh` JSON output; never scrape web HTML.

   ```bash
   gh issue list --state open --limit 200 --json number,title,labels,state,assignees,createdAt,updatedAt,milestone,url
   gh pr list --state open --limit 100 --json number,title,state,isDraft,labels,createdAt,updatedAt,mergeStateStatus,reviewDecision,changedFiles,additions,deletions,files,url
   gh api repos/{owner}/{repo}/milestones --paginate --jq '[.[] | {number,title,state,open_issues,closed_issues,due_on,updated_at,description}]'
   ```

   Extract: stale issues (`updatedAt` >90 days; high-priority stale = 60 days), issue categories from labels/title (`security`, `bug`, `feature`, `docs`, `infra`, `tech-debt`), PR risk (draft PRs >30 days, merge-conflicted, attached to promised milestones), overdue milestones (due date past with `open_issues > 0`; critical if >30 days overdue and release-labeled), already-done candidates (issue titles semantically matching implemented files/symbols from step 4). If `gh` is unavailable or unauthenticated, mark GitHub `unavailable` and continue with docs/code.

3. **Collect documentation intent** (`--sources=docs`). Use `find` for doc file names, then `read` only candidate files/sections.

   Candidate files: `README*`, `PLAN*`, `ROADMAP*`, `TODO*`, `CHANGELOG*`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING*`, `docs/**`, `documentation/**`, `.github/ISSUE_TEMPLATE/**`, `.github/PULL_REQUEST_TEMPLATE*`.

   For each document, record: headings naming goals/phases/release targets/features/non-goals; checkbox state (total, checked, unchecked, completion percent = checked/total); completion claims (`complete`, `done`, `shipped`, `ready`, `implemented`, `v1`, `release`); feature list items under Features/Roadmap/Plan/API sections (strip marketing adjectives before matching); stale-doc hints (no git change in 180+ days, old version numbers, removed symbol references, examples importing nonexistent paths). If no docs exist, classify as a documentation gap, not drift.

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
   - **doc-drift with zero coupling**: doc files whose recent changes do not co-change with related source. Docs with repeated doc-only commits and no matching source commits for referenced terms are MEDIUM; exact removed symbol references are HIGH.
   - **at-risk areas**: directories with high bug-fix churn and stale/low ownership. Mark HIGH when a planned feature maps to an area with high bug-fix density and no recent owner activity.
   - **stale docs**: docs older than 180 days describing active or changed code paths.
   - **orphan exports / dead starts**: exported symbols or public endpoints not called/imported. Orphan + documented feature = HIGH drift; orphan without docs = LOW cleanup signal.
   - **test gap**: implementation exists for documented critical behavior but no matching test file, no test script, or CI never runs tests.

5. **Normalize evidence.** Build a compact bundle, not a transcript dump. Every array item carries `{source, evidence, confidence}`. Evidence must be citeable: `README.md:42`, `issue #17`, `src/auth/session.ts`, `.github/workflows/test.yml`, or a command result.

6. **Classify drift and gaps using the taxonomy below.** Apply drift types, gap types, prioritization weighting, fuzzy cross-reference matching, native signal interpretation, and synthesis rules.

7. **Synthesize the report.** Delegate one synthesis pass to a semantic analyst role. The role receives the evidence bundle and the taxonomy, then emits the report. Never hardcode model names. Never name or invoke a skill as a dependency.

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

8. **Emit the Reality Check Report** using the report template below.

### Drift taxonomy

**Drift Types:**

| Type | Definition | Strong Signals | Default Severity |
|---|---|---|---|
| Plan drift | Stated plan/phase/milestone no longer matches implementation progress | overdue milestone with open issues; PLAN checkbox percent <30% after 90 days; completed phase lacks matching code | high |
| Documentation drift | Docs describe absent behavior or omit shipped behavior | README feature absent in code; docs import removed symbol; API docs mismatch endpoints/exports; doc has zero code coupling | high |
| Issue drift | Issue tracker diverges from reality | open issue already implemented; stale high-priority issue; duplicate theme cluster; draft PR open >30 days | medium/high |
| Scope drift | Intent expands faster than completion | growing feature backlog; many planned features with few code matches; new code surface not documented | medium |
| Release drift | Release promise or milestone no longer ship-ready | overdue milestone; critical/security issue open; no tests/CI for shipped critical behavior | critical/high |
| Architecture drift | Documented layer/boundary differs from actual wiring | no-op/passthrough wrapper for documented abstraction; orphan exported module for planned capability; code path bypasses stated layer | medium/high |
| Ownership drift | Planned area became risky because ownership/activity changed | high bug-fix churn, low recent owner activity, stale PRs/issues mapped to one area | high |

**Gap Types:**

| Gap | Definition | Evidence Examples | Severity Rule |
|---|---|---|---|
| Implementation gap | documented feature has no matching code | `PLAN.md:42` says OAuth; no `auth/oauth`, no provider config, no route | high; critical if promised for release |
| Partial implementation gap | some code exists but named behavior is missing | login exists; password reset/session timeout/tests absent | medium/high |
| Test gap | implemented or promised behavior lacks tests or CI execution | no test script; no matching `*.test.*`; CI has build only | high for critical behavior, medium otherwise |
| Documentation gap | shipped user-facing feature lacks docs | route/export exists; README/API docs silent | medium/high if public API |
| Tracking gap | tracker lacks issue/PR for documented or implemented work | shipped feature no issue; issue not linked to milestone | low/medium |
| Release-readiness gap | release target lacks required blockers closed | milestone due; open security/bug labels; failing/no CI | critical/high |
| Cleanup gap | abandoned work remains after scope changed | orphan exports, dead feature flags, stale TODO clusters | low/medium |
| Ownership gap | area has no clear recent maintainer | one author owns 80% then inactive; high churn since | medium/high |

**Prioritization Weighting:**

```text
severityScore:
  critical = 15
  high     = 10
  medium   = 5
  low      = 2

categoryMultiplier:
  security       = 2.0
  release        = 1.8
  bug            = 1.5
  infrastructure = 1.3
  tests          = 1.25
  feature        = 1.0
  documentation  = 0.8
  cleanup        = 0.65

bonuses:
  blockerBonus       = +5
  quickWinBonus      = +2
  stalePriorityBonus = +2
  riskAreaBonus      = +3

penalties:
  lowCertaintyPenalty = -3
  oldStalePenalty     = -1

score = (severityScore * categoryMultiplier) + bonuses - penalties
```

Buckets: Immediate (critical OR score >= 15, max 5), Short-term (high OR score >= 10, max 10), Medium-term (score >= 5, max 15), Backlog (score < 5, max 20). Tie-break: severity, evidence certainty, blocker effect, user-facing impact, quick win, recency.

**Fuzzy Cross-Reference Matching:**

Normalize before matching: lowercase; remove punctuation, hyphen, underscore, spaces; singularize trailing s; strip adjectives (robust, seamless, production-ready, comprehensive, scalable); map synonyms (auth=login=session=identity; api=route=endpoint=handler=controller; db=database=model=schema=migration).

Match status: aligned (doc and code match semantically; tests/docs adequate), partial (code covers some but not all), documented-only (doc/issue/milestone promises; no code evidence), implemented-only (code exposes behavior; no doc/issue/plan), stale/obsolete (refers to removed/dropped behavior), unknown (evidence insufficient).

Certainty: HIGH (exact doc line + exact code path/symbol/issue/PR/milestone), MEDIUM (semantic match + supporting path/history), LOW (broad keyword overlap or absence only).

**Native Signal Interpretation:**

| Signal | Interpretation | Severity |
|---|---|---|
| doc-drift zero coupling + active code area | doc likely stale relative to implementation | high if public docs; medium if internal |
| stale doc removed-symbol reference | exact documentation drift | high |
| orphan export + documented plan item | started but unwired feature, or dropped scope not cleaned | high |
| orphan export with no doc/plan mention | cleanup only | low |
| no-op wrapper + documented architecture boundary | abstraction promised but not realized | medium |
| always-true/always-false condition in feature path | documented conditional behavior likely broken | high |
| high bug-fix churn + stale owner + planned feature | risky drift zone | high |
| no tests + implemented critical feature | quality/release gap | high/critical |
| no CI + release milestone | release-readiness gap | high/critical |

**Synthesis Rules:**

1. Completed checkboxes and phases are suspect until verified against code.
2. Open issues are not stale merely because old; stale requires inactivity plus no matching current implementation or ownership signal.
3. Public docs outrank internal docs for severity.
4. Release dates and milestones outrank backlog plans.
5. Security, correctness, and release blockers outrank documentation cleanup.
6. Pattern-level drift matters more than isolated drift: five stale priority issues are one high finding; one stale low-priority issue is backlog.
7. Do not produce a plan item that cannot be acted on without first naming a file, issue, milestone, or feature area.

### Report template

```markdown
# Reality check report

Generated: {timestamp}
Scope: {scope}
Sources: {github/docs/code availability summary}
Depth: {quick|thorough}

### Executive summary

{2-3 sentences: current alignment state, largest drift vector, biggest unblocker.}

**Key Numbers:**
- Drift Areas: {n}
- Critical Gaps: {n}
- High Gaps: {n}
- Work Items: {n}
- Features Aligned: {n}
- Unknown / Unavailable Sources: {n}

### Drift analysis

### {Drift title}
**Type:** {plan/documentation/issue/scope/release/architecture/ownership}
**Severity:** {critical/high/medium/low}
**Certainty:** {HIGH/MEDIUM/LOW}
**Description:** {what is diverging and why it matters}
**Evidence:** {issue # / PR # / milestone / doc line / file path / symbol / command result}
**Recommendation:** {specific correction: close/reopen/update/test/implement/delete/defer}

### Gap analysis

### {Gap title}
**Category:** {implementation/tests/docs/tracking/release/cleanup/ownership}
**Severity:** {critical/high/medium/low}
**Certainty:** {HIGH/MEDIUM/LOW}
**Impact:** {why this blocks or risks the project}
**Evidence:** {specific source}
**Recommendation:** {specific action}

### Cross-reference table

| Documented / Tracked Item | Implementation Evidence | Status | Certainty | Evidence |
|---|---|---|---|---|
| {item} | {evidence} | {status} | {certainty} | {sources} |

### Prioritized reconstruction plan

### Immediate (this week)
1. **{Action title}**
   - **Severity:** {critical/high}
   - **Why now:** {blocker or truthfulness reason}
   - **Evidence:** {specific source}
   - **Done when:** {observable completion criterion}

### Short-term (this month)
1. **{Action title}**
   - **Severity:** {high/medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

### Medium-term (this quarter)
1. **{Action title}**
   - **Severity:** {medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

### Backlog
1. **{Action title}**
   - **Severity:** {low/medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

### Quick wins

Only include actions with HIGH certainty and small blast radius.

### Unknowns / unavailable sources

- {source} unavailable because {reason}; effect on certainty: {impact}.
```

## Failure and recovery
- **gh unavailable or unauthenticated**: mark GitHub `unavailable`, continue with docs/code. Never invent issue state.
- **No docs exist**: classify as documentation gap, not drift. Continue with GitHub/code.
- **Codegraph not indexed**: fall back to `ast-grep` and `git grep`. Mark code evidence certainty as MEDIUM or LOW.
- **Shallow clone**: git history signals are unreliable; mark native signals as LOW certainty and list under Unknowns.
- **All sources unavailable**: stop and report which sources failed and why. Do not emit a report with fabricated evidence.
- **Synthesis produces a finding without evidence**: reject the finding. Every drift/gap/plan item must cite concrete evidence or it does not appear in the report.
- **No mutation during scan**: if any step would mutate docs, issues, PRs, or code, stop that step. The scan is read-only except for the optional `.outline/drift-detect/` artifact. Rollback: delete `.outline/drift-detect/`.

## Output
A Reality Check Report with: Executive Summary (2-3 sentences plus key numbers), Drift Analysis (type, severity, certainty, description, evidence, recommendation per finding), Gap Analysis (category, severity, certainty, impact, evidence, recommendation per finding), Cross-Reference Table (documented item, implementation evidence, status, certainty, evidence), Prioritized Reconstruction Plan (Immediate/Short-term/Medium-term/Backlog buckets, each item with severity and evidence), Quick Wins (only HIGH certainty, small blast radius), and Unknowns/Unavailable Sources. Every item evidence-cited. Optionally written to `.outline/drift-detect/reality-check-YYYYMMDD-HHMM.md` when too long for chat.

## Provenance

Origin: ODIN 1.x current skill `skills/drift-detect/SKILL.md`. Revision: not pinned (current). License: project-owned. Adaptation: inlined the `references/drift-taxonomy.md` rubric (drift types, gap types, prioritization weighting, fuzzy cross-reference matching, native signal interpretation, synthesis rules, report template) into the procedure so the skill is self-contained with no external file dependency. Moved from odin-code to odin-research because the trigger is detecting plan/roadmap/docs drift from code and the end state is an evidence-gathering report, not code implementation or review.
