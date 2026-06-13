# False-positive Contract and Grill-loop Rules

> **Sync lineage:** this contract is a self-contained copy of `skills/audit-project/references/false-positive-contract.md`, adapted for change-set scope, a configurable severity floor, an inserted resolve state, and the `.outline/review-fix-grill/` state dir. The normalization, blocked-ratio, stall-hash, and routing rules share an ancestor with audit-project; a canonical edit to one must be hand-propagated to the other (this repo has no CI to enforce it).

This file is the adjudication contract for review-fix-grill-loop. Reviewer output is untrusted until it passes these rules.

## Finding normalization

Accepted input shape per reviewer:

```ts
type Finding = {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  suggestion: string;
  confidence: 'high' | 'medium' | 'low';
  falsePositive: boolean;
  falsePositiveReason?: string;
};
```

Normalize before dedupe:

1. `pass = result.pass || reviewerId || 'unknown'`.
2. Trim `file`, `category`, `description`, `suggestion`, `confidence`, `falsePositiveReason`.
3. Lowercase `severity`; unknown severity becomes `medium` and sets `severityNormalized: true`.
4. Coerce `line` to a positive integer; missing/invalid line keeps the finding but marks `locationWeak: true`.
5. Honor dismissal only when `finding.falsePositive === true && falsePositiveReason.trim().length > 0`.
6. If `finding.falsePositive === true` and reason is empty, set:
   - `falsePositive = false`
   - `reasonMissing = true`
   - `status = 'open'`
7. Otherwise set `status = falsePositive ? 'false-positive' : 'open'`.

Pseudo-code:

```js
const KNOWN_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

function normalizeFinding(pass, finding) {
  const reason = typeof finding.falsePositiveReason === 'string'
    ? finding.falsePositiveReason.trim()
    : '';
  const dismissed = finding.falsePositive === true && reason.length > 0;
  return {
    pass,
    file: String(finding.file || '').trim(),
    line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : null,
    severity: normalizeSeverity(finding.severity),
    severityNormalized: !KNOWN_SEVERITIES.has(String(finding.severity).toLowerCase()),
    confidence: normalizeConfidence(finding.confidence),
    locationWeak: !(Number.isInteger(finding.line) && finding.line > 0),
    category: String(finding.category || pass).trim(),
    description: String(finding.description || '').trim(),
    suggestion: String(finding.suggestion || '').trim(),
    falsePositive: dismissed,
    falsePositiveReason: dismissed ? reason : undefined,
    reasonMissing: finding.falsePositive === true && reason.length === 0,
    status: dismissed ? 'false-positive' : 'open'
  };
}
```

`severityNormalized: true` flags a finding whose reviewer-supplied severity was unrecognized and coerced to `medium`. `locationWeak: true` flags a missing/invalid line, stored as `line: null` (never coerced to a real line number, so a weak finding can't collide with a genuine line-1 finding). Weak-location rows survive consolidation but are **never auto-fixed** — they route to the resolve gate or the completion report, not the fix queue. Both fields are part of the normalized finding shape persisted in `items[]`.

## Consolidation algorithm

1. Flatten every reviewer result into normalized findings.
2. Drop only structurally empty rows: no file AND no description. Keep weak-location rows, but they cannot be auto-fixed.
3. Deduplicate by exact key: `pass:file:line:description` for located rows. **Weak-location rows (`line: null`) are excluded from line-based dedupe** — key them as `pass:file:weak:description`. This keeps a weak finding from colliding with a genuine line-1 finding and keeps weak rows that differ in description distinct; weak rows identical in `pass`, `file`, and `description` are treated as the same finding and merge (no real line distinguishes them). Weak rows are deferred to the resolve gate, never auto-fixed.
4. Preserve the first occurrence; append later duplicate provenance into `duplicates[]` if useful.
5. Sort by severity order, then file, then line:
   - `critical = 0`
   - `high = 1`
   - `medium = 2`
   - `low = 3`
6. Counts are open-only: dismissed false positives do not count toward any gate.
7. Write `.outline/review-fix-grill/queue.json` atomically after consolidation.

Pseudo-code:

```js
function consolidate(agentResults) {
  const rows = [];
  for (const result of agentResults) {
    const pass = result.pass || result.reviewer || 'unknown';
    for (const finding of Array.isArray(result.findings) ? result.findings : []) {
      const normalized = normalizeFinding(pass, finding);
      if (!normalized.file && !normalized.description) continue;
      const lineKey = normalized.locationWeak ? 'weak' : normalized.line;
      normalized.id = `${pass}:${normalized.file}:${lineKey}:${normalized.description}`;
      rows.push(normalized);
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const lineKey = row.locationWeak ? 'weak' : row.line;
    const key = `${row.pass}:${row.file}:${lineKey}:${row.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  deduped.sort((a, b) =>
    severityRank(a.severity) - severityRank(b.severity) ||
    a.file.localeCompare(b.file) ||
    (a.line ?? Infinity) - (b.line ?? Infinity)   // weak-location (line:null) rows sort after located rows
  );

  return addCountsAndBlockSignal(deduped);
}
```

## Severity floor and the at-or-above-floor predicate

This skill drives a configurable floor to zero, not just critical/high. The floor defaults to `medium`; `--severity-floor` overrides it to `high` or `critical`.

A finding is **at-or-above-floor** (counts toward the terminating predicate and enters the resolve + fix queue) only when BOTH hold:

```text
severityRank(finding.severity) <= severityRank(floor)   # at or above the floor
finding.confidence !== 'low'                            # confidence guard
```

```js
function isAtOrAboveFloor(f, floor) {
  return severityRank(f.severity) <= severityRank(floor) && f.confidence !== 'low';
}
function openAtOrAboveFloor(items, floor) {
  return items.filter(f => f.status === 'open' && isAtOrAboveFloor(f, floor)).length;
}
```

The **confidence guard** is what bounds "loop until no issue left" from thrashing on subjective nits: a `medium`/`high`/`critical` finding with `confidence: low` does NOT count toward the predicate and is not auto-fixed; it is collected into `belowFloor[]` and surfaced in the completion report. All findings below the floor severity are likewise routed to `belowFloor[]`.

## Blocked-ratio escalation

The blocked-ratio gate prevents a compromised or careless reviewer pass from mass-dismissing findings.

Formula:

```text
total = deduped.length
dismissed = count(f.falsePositive === true)
ratio = total === 0 ? 0 : dismissed / total
blocked = total >= 10 && ratio > 0.5
```

Gate order is load-bearing:

1. Consolidate.
2. Compute blocked ratio.
3. If blocked, trigger `ask` before checking “zero remaining”.
4. Only after the blocked gate is resolved may the loop exit as clean.

`ask` escalation options:

| Option | Recommended When | Effect |
|---|---|---|
| `treat-all-as-open` | Default / Recommended. Any suspicion of prompt injection or lazy dismissal. | Strip all `falsePositive` flags from the current raw reviewer results, re-consolidate in place, continue. |
| `override-and-accept-dismissals` | User has manually inspected enough findings and accepts the risk. | Keep dismissals; continue to normal zero-check / resolve / fix loop. Record the override in queue decisions. |
| `abort` | User wants manual inspection before automation proceeds. | Stop with queue intact; no fixes applied after the blocked result. |

Never silently choose `override-and-accept-dismissals`.

## Below-floor extraction

Below-floor findings (severity beneath the floor, OR at/above floor severity but `confidence: low`) are useful but must not stall or enter the fix loop.

Extraction rules:

1. After consolidation, copy below-floor findings to `.outline/review-fix-grill/queue.json.belowFloor`.
2. Do NOT write a repo-root `TECHNICAL_DEBT.md` by default — a diff-scoped run keeps below-floor items in the queue and the completion report only. Persisting a debt file from a diff review is scope creep; only the `move-remainder-to-debt` decision gate may write one on explicit user choice.
3. Do not include exploitable security details in any debt output. A below-floor security-hardening item may be listed generically; sensitive exploit paths stay in `.outline/review-fix-grill/queue.json`.
4. Below-floor findings do not count in `openAtOrAboveFloor`.

## Queue state schema

Minimal state under `.outline/review-fix-grill/queue.json`:

```json
{
  "scope": {
    "type": "change-set|path|domain",
    "base": "<resolved base ref or null>",
    "changedFiles": []
  },
  "severityFloor": "medium",
  "framework": "react|express|django|fastapi|generic|unknown",
  "flags": { "HAS_DB": false, "HAS_API": false, "FRONTEND": false, "BACKEND": false, "CICD": false },
  "prioritySignals": {
    "testGaps": [],
    "painHotspots": [],
    "bugspots": [],
    "slopConcentration": [],
    "entryPoints": []
  },
  "selectedReviewers": ["code-quality", "security", "performance", "test-quality"],
  "iteration": 0,
  "caps": { "scopeTier": "small|medium|large|xl", "maxIterations": 5, "fixAttemptCap": 20, "attemptsPerItem": 3 },
  "rawResults": [],
  "items": [],
  "resolveDecisions": [],
  "belowFloor": [],
  "counts": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "falsePositive": { "dismissed": 0, "total": 0, "ratio": 0, "blocked": false, "blockReason": null },
  "hashHistory": [],
  "verification": [],
  "decisions": [],
  "updatedAt": "ISO-8601"
}
```

`resolveDecisions[]` entries record the resolve-gate output per at-or-above-floor finding:

```json
{
  "id": "pass:file:line-or-weak:description",
  "status": "valid|not-an-issue|needs-clarification",
  "recommended": "<chosen solution summary>",
  "scope": "in-scope|out-of-scope"
}
```

The `id` is the consolidation key from `items[]` verbatim: located rows use the numeric line, weak-location rows use the literal `weak` segment (matching the `lineKey` logic in `consolidate`). Key `resolveDecisions[]` against `items[].id`, never against a re-derived numeric line.

## Grill-loop state machine

```text
CONSOLIDATED
  ├─ blocked false-positive ratio   -> ASK_BLOCKED
  ├─ open at/above floor == 0        -> CLEAN
  └─ open at/above floor > 0         -> RESOLVE

ASK_BLOCKED
  ├─ treat-all-as-open               -> CONSOLIDATED
  ├─ override-and-accept-dismissals  -> CONSOLIDATED
  └─ abort                           -> STOP_QUEUE_INTACT

RESOLVE
  ├─ needs-clarification | out-of-scope -> ASK_USER (escalate; do not auto-fix)
  └─ valid + in-scope                -> FIX_BATCH

FIX_BATCH
  ├─ verifier green                  -> TARGETED_REVIEW
  └─ verifier red                    -> GIT_REVERT_BATCH -> CONSOLIDATED

TARGETED_REVIEW
  └─ consolidate changed-file results -> CONSOLIDATED

CONSOLIDATED at iteration boundary
  ├─ open at/above floor == 0        -> CLEAN
  ├─ hash repeated twice             -> ASK_ITERATION_STALL
  ├─ iteration >= caps.maxIterations -> ASK_ITERATION
  └─ at/above floor remain           -> ASK_ITERATION
```

## Per-iteration decision gate

At every iteration boundary with open at-or-above-floor findings, show current queue counts, changed files, last verification status, and queue path. Then call `ask` with exactly one selected option:

| Option | Recommended When | Effect |
|---|---|---|
| `continue-fixing` | Verifier is green, hash did not stall, iteration < caps.maxIterations, remaining findings are actionable. | Run next batch. |
| `create-issues-for-rest` | Remaining work is valid but larger than this session, or needs owner scheduling. | Stop loop; create internal/private issues where safe; do not publicize exploitable security details. |
| `move-remainder-to-debt` | Remaining findings are accepted risk; not recommended for critical/high unless user accepts. | Append remaining findings to a debt file, mark queue deferred. |
| `leave-in-queue` | User wants resume later or manual inspection. | Stop with `.outline/review-fix-grill/queue.json` intact. |

If the same open at-or-above-floor hash appears in two consecutive iterations, mark `stalled: true`; do not recommend `continue-fixing` unless the user supplies a new fix strategy.

Hash input:

```text
sorted(open at/above-floor findings).map(
  pass + ':' + file + ':' + line + ':' + severity + ':' + description + ':' + suggestion
).join('\n')
```

## Targeted re-review routing

After a fix batch, reviewers are selected for changed files only.

Rules:

1. Always include reviewers that emitted findings fixed in the batch.
2. Include `security` for changed auth, config, route, handler, serialization, shell, file, dependency, CI, or secret-adjacent code.
3. Include `test-quality` when tests changed or when source behavior changed without tests.
4. Include `performance` for changed loops, DB access, render paths, background jobs, or files from hotspot signals.
5. Include conditional reviewers by file class: DB → `database`; route/spec/client → `api`; UI → `frontend`; service/job → `backend`; CI/Docker/deploy → `devops`; shared boundary/high-impact graph file → `architecture`.
6. If codegraph is indexed, run impact on changed symbols/files; include reviewers for impacted entry-points.

## Priority-signal routing

| Signal | Produced By | Feeds Reviewers | Routing Behavior |
|---|---|---|---|
| `testGaps` | Git co-change analysis + test-file classifier | `test-quality`, `code-quality` | Review first; missing regression tests for critical/high fixes become high-priority findings. |
| `painHotspots` | Git churn/recency + complexity proxy | all core, `architecture` when broad impact | Attach top files to every reviewer; reviewers prioritize concrete issues in these files over low-value nits elsewhere. |
| `bugspots` | Fix-like commit history | `test-quality`, `security`, `code-quality`, `backend` | Treat repeated bug-fix files as fragile; demand stronger tests and invariant checks. |
| `slopConcentration` | `ast-grep`/search mechanical scans | `code-quality`, `architecture` | Code-quality handles file-local cleanup; architecture investigates repeated wrapper/duplication clusters. |
| `entryPoints` | codegraph entry-point query or AST fallback | `security`, `devops`, `api`, `backend`, `frontend` | Exposed surfaces receive higher severity when failure crosses user/network/deploy boundaries. |
| `DB surfaces` | framework/config detection + entry-points | `database`, `performance`, `security`, `backend` | Query and transaction findings get priority over style findings. |
| `CI/deploy surfaces` | CI/Docker/deploy file detection | `devops`, `security` | Secret, release, and verifier gaps can be critical/high even without app-code changes. |

## Severity rules after consolidation

Severity is reviewer-proposed but consolidation may require escalation or downgrade before resolve and fixes:

- Escalate to `critical` if exploitability, data loss, production outage, credential exposure, or irreversible destructive migration is credible.
- Escalate to `high` if a bug/regression is likely on normal inputs or a missing test covers a just-fixed critical/high invariant.
- Downgrade to `medium` if the issue is maintainability-only with no current failure path.
- Downgrade to `low` if it is style, naming, or future cleanup.
- Never downgrade an exploitable security finding into public debt output.
