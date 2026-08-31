# Drift taxonomy

Reference detail for the drift-detect procedure. Applied at step 6 (classify) and step 8 (emit).

## Drift types

| Type | Definition | Strong signals | Default severity |
|---|---|---|---|
| Plan drift | Stated plan/phase/milestone no longer matches implementation progress | overdue milestone with open issues; PLAN checkbox percent <30% after 90 days; completed phase lacks matching code | high |
| Documentation drift | Docs describe absent behavior or omit shipped behavior | README feature absent in code; docs import removed symbol; API docs mismatch endpoints/exports; doc has zero code coupling | high |
| Issue drift | Issue tracker diverges from reality | open issue already implemented; stale high-priority issue; duplicate theme cluster; draft PR open >30 days | medium/high |
| Scope drift | Intent expands faster than completion | growing feature backlog; many planned features with few code matches; new code surface not documented | medium |
| Release drift | Release promise or milestone no longer ship-ready | overdue milestone; critical/security issue open; no tests/CI for shipped critical behavior | critical/high |
| Architecture drift | Documented layer/boundary differs from actual wiring | no-op/passthrough wrapper for documented abstraction; orphan exported module for planned capability; code path bypasses stated layer | medium/high |
| Ownership drift | Planned area became risky because ownership/activity changed | high bug-fix churn, low recent owner activity, stale PRs/issues mapped to one area | high |

## Gap types

| Gap | Definition | Evidence examples | Severity rule |
|---|---|---|---|
| Implementation gap | documented feature has no matching code | `PLAN.md:42` says OAuth; no `auth/oauth`, no provider config, no route | high; critical if promised for release |
| Partial implementation gap | some code exists but named behavior is missing | login exists; password reset/session timeout/tests absent | medium/high |
| Test gap | implemented or promised behavior lacks tests or CI execution | no test script; no matching `*.test.*`; CI has build only | high for critical behavior, medium otherwise |
| Documentation gap | shipped user-facing feature lacks docs | route/export exists; README/API docs silent | medium/high if public API |
| Tracking gap | tracker lacks issue/PR for documented or implemented work | shipped feature no issue; issue not linked to milestone | low/medium |
| Release-readiness gap | release target lacks required blockers closed | milestone due; open security/bug labels; failing/no CI | critical/high |
| Cleanup gap | abandoned work remains after scope changed | orphan exports, dead feature flags, stale TODO clusters | low/medium |
| Ownership gap | area has no clear recent maintainer | one author owns 80% then inactive; high churn since | medium/high |

## Prioritization weighting

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

## Fuzzy cross-reference matching

Normalize before matching: lowercase; remove punctuation, hyphen, underscore, spaces; singularize trailing s; strip adjectives (robust, integrated, production-ready, comprehensive, scalable); map synonyms (auth=login=session=identity; api=route=endpoint=handler=controller; db=database=model=schema=migration).

Match status: aligned (doc and code match semantically; tests/docs adequate), partial (code covers some but not all), documented-only (doc/issue/milestone promises; no code evidence), implemented-only (code exposes behavior; no doc/issue/plan), stale/obsolete (refers to removed/dropped behavior), unknown (evidence insufficient).

Certainty: HIGH (exact doc line + exact code path/symbol/issue/PR/milestone), MEDIUM (semantic match + supporting path/history), LOW (broad keyword overlap or absence only).

## Native signal interpretation

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

## Synthesis rules

1. Completed checkboxes and phases are suspect until verified against code.
2. Open issues are not stale merely because old; stale requires inactivity plus no matching current implementation or ownership signal.
3. Public docs outrank internal docs for severity.
4. Release dates and milestones outrank backlog plans.
5. Security, correctness, and release blockers outrank documentation cleanup.
6. Pattern-level drift matters more than isolated drift: five stale priority issues are one high finding; one stale low-priority issue is backlog.
7. Do not produce a plan item that cannot be acted on without first naming a file, issue, milestone, or feature area.

## Report template

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
