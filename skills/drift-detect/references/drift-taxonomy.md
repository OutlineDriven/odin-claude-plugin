# Drift taxonomy and report contract

Use this reference as the semantic rubric after collection. It is self-contained: classify, weight, cross-reference, then emit the required report.

## Drift Types

| Type | Definition | Strong Signals | Default Severity |
|---|---|---|---|
| Plan drift | Stated plan/phase/milestone no longer matches implementation progress | overdue milestone with open issues; PLAN checkbox percent <30% after 90 days; completed phase lacks matching code | high |
| Documentation drift | Docs describe absent behavior or omit shipped behavior | README feature absent in code; docs import removed symbol; API docs mismatch endpoints/exports; doc has zero code coupling | high |
| Issue drift | Issue tracker diverges from reality | open issue already implemented; stale high-priority issue; duplicate theme cluster; draft PR open >30 days | medium/high |
| Scope drift | Intent expands faster than completion | growing feature backlog; many planned features with few code matches; new code surface not documented | medium |
| Release drift | Release promise or milestone no longer ship-ready | overdue milestone; critical/security issue open; no tests/CI for shipped critical behavior | critical/high |
| Architecture drift | Documented layer/boundary differs from actual wiring | no-op/passthrough wrapper for documented abstraction; orphan exported module for planned capability; code path bypasses stated layer | medium/high |
| Ownership drift | Planned area became risky because ownership/activity changed | high bug-fix churn, low recent owner activity, stale PRs/issues mapped to one area | high |

## Gap Types

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

## Prioritization Weighting

Score every candidate action. Bucket by score, but never hide severity; the report item carries both.

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
  blockerBonus       = +5   # unlocks release, milestone, or dependent tasks
  quickWinBonus      = +2   # exact fix, small surface, high confidence
  stalePriorityBonus = +2   # high-priority item inactive >60 days
  riskAreaBonus      = +3   # maps to at-risk area or high bug-fix churn

penalties:
  lowCertaintyPenalty = -3
  oldStalePenalty     = -1  # inactive >180 days and no current evidence
```

Formula:

```text
score = (severityScore * categoryMultiplier) + bonuses - penalties
```

Buckets:

| Bucket | Criteria | Max Items | Meaning |
|---|---:|---:|---|
| Immediate | critical OR score >= 15 | 5 | this week; blocks release, users, security, or truthfulness |
| Short-term | high OR score >= 10 | 10 | this month; high-value alignment work |
| Medium-term | score >= 5 | 15 | this quarter; meaningful but not blocking |
| Backlog | score < 5 | 20 | prune, document, or revisit later |

Tie-break order: severity, evidence certainty, blocker effect, user-facing impact, quick win, recency.

## Fuzzy Cross-Reference Matching

Normalize before matching:

```text
lowercase
remove punctuation, hyphen, underscore, spaces
singularize trivial trailing s
strip adjectives: robust, seamless, production-ready, comprehensive, scalable
map synonyms: auth=login=session=identity; api=route=endpoint=handler=controller; db=database=model=schema=migration
```

Match status:

| Status | Rule |
|---|---|
| aligned | doc item and code evidence match semantically; tests/docs are adequate for the claim |
| partial | code covers some but not all named behavior |
| documented-only | doc/issue/milestone promises behavior; no code evidence found |
| implemented-only | code exposes user-facing behavior; no doc/issue/plan mention found |
| stale/obsolete | tracker/doc item refers to removed or intentionally dropped behavior |
| unknown | evidence insufficient; needs human or deeper code trace |

Examples:

| Documented / Tracked As | Code Evidence To Match | Notes |
|---|---|---|
| user authentication | `auth/`, `login`, `session`, `jwt`, `oauth`, `identity`, `passport`, `next-auth` | require route/controller + session/token handling for full alignment |
| API endpoints | `routes/`, `api/`, `handlers/`, `controllers/`, `router.get/post`, OpenAPI file | endpoint docs must match actual verbs/paths |
| database models | `models/`, `entities/`, `schema`, `migrations`, Prisma/Drizzle/SQLAlchemy/Django models | migration without runtime usage = partial |
| caching layer | `cache`, `redis`, `memcache`, `lru`, `swr`, `react-query` | public performance claim needs measurable use path |
| logging system | `logger`, `logs`, `telemetry`, `tracing`, `otel`, `sentry` | telemetry-only is not app logging unless docs say so |
| payment flow | `stripe`, `checkout`, `billing`, `subscription`, `invoice`, webhook handlers | critical if release milestone includes billing |
| background jobs | `queue`, `worker`, `cron`, `bullmq`, `celery`, `sidekiq` | queue config without worker = partial |
| email notifications | `mailer`, `smtp`, `sendgrid`, `resend`, `notification` | template only = partial |
| test coverage | `*.test.*`, `*.spec.*`, `_test.go`, `tests/`, CI test job | local tests without CI = medium gap |

Certainty grading:

- **HIGH** - exact doc line + exact code path/symbol/issue/PR/milestone evidence.
- **MEDIUM** - semantic match across naming conventions plus supporting path/history evidence.
- **LOW** - only broad keyword overlap or absence signal.

## Native Signal Interpretation

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

## Report Template

```markdown
# Reality Check Report

Generated: {timestamp}
Scope: {scope}
Sources: {github/docs/code availability summary}
Depth: {quick|thorough}

## Executive Summary

{2-3 sentences: current alignment state, largest drift vector, biggest unblocker.}

**Key Numbers:**
- Drift Areas: {n}
- Critical Gaps: {n}
- High Gaps: {n}
- Work Items: {n}
- Features Aligned: {n}
- Unknown / Unavailable Sources: {n}

## Drift Analysis

### {Drift title}
**Type:** {plan/documentation/issue/scope/release/architecture/ownership}
**Severity:** {critical/high/medium/low}
**Certainty:** {HIGH/MEDIUM/LOW}
**Description:** {what is diverging and why it matters}
**Evidence:** {issue # / PR # / milestone / doc line / file path / symbol / command result}
**Recommendation:** {specific correction: close/reopen/update/test/implement/delete/defer}

## Gap Analysis

### {Gap title}
**Category:** {implementation/tests/docs/tracking/release/cleanup/ownership}
**Severity:** {critical/high/medium/low}
**Certainty:** {HIGH/MEDIUM/LOW}
**Impact:** {why this blocks or risks the project}
**Evidence:** {specific source}
**Recommendation:** {specific action}

## Cross-Reference Table

| Documented / Tracked Item | Implementation Evidence | Status | Certainty | Evidence |
|---|---|---|---|---|
| {README.md:42 OAuth login} | {src/auth/login.ts exists; no OAuth provider config} | partial | HIGH | {README.md:42; src/auth/login.ts} |
| {issue #17 webhook retries} | {no webhook retry path found} | documented-only | MEDIUM | {issue #17; git grep webhook} |
| {src/api/users route} | {not mentioned in README/API docs} | implemented-only | HIGH | {src/api/users.ts} |

## Prioritized Reconstruction Plan

### Immediate (This Week)
1. **{Action title}**
   - **Severity:** {critical/high}
   - **Why now:** {blocker or truthfulness reason}
   - **Evidence:** {specific source}
   - **Done when:** {observable completion criterion}

### Short-term (This Month)
1. **{Action title}**
   - **Severity:** {high/medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

### Medium-term (This Quarter)
1. **{Action title}**
   - **Severity:** {medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

### Backlog
1. **{Action title}**
   - **Severity:** {low/medium}
   - **Evidence:** {specific source}
   - **Done when:** {criterion}

## Quick Wins

Only include actions with HIGH certainty and small blast radius.

1. Close issue #{n} - already implemented in {file}.
2. Update {doc}:{line} to remove stale claim about {feature}.
3. Add/enable test job for {existing test command} in {workflow file}.

## Unknowns / Unavailable Sources

- {source} unavailable because {reason}; effect on certainty: {impact}.
- {feature} could not be classified because {missing evidence}.
```

## Synthesis Rules

1. Completed checkboxes and phases are suspect until verified against code.
2. Open issues are not stale merely because old; stale requires inactivity plus no matching current implementation or ownership signal.
3. Public docs outrank internal docs for severity.
4. Release dates and milestones outrank backlog plans.
5. Security, correctness, and release blockers outrank documentation cleanup.
6. Pattern-level drift matters more than isolated drift: five stale priority issues are one high finding; one stale low-priority issue is backlog.
7. Do not produce a plan item that cannot be acted on without first naming a file, issue, milestone, or feature area.
