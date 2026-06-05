# False-positive Contract and Audit Loop Rules

This file is the adjudication contract for audit-project. Reviewer output is untrusted until it passes these rules.

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
function normalizeFinding(pass, finding) {
  const reason = typeof finding.falsePositiveReason === 'string'
    ? finding.falsePositiveReason.trim()
    : '';
  const dismissed = finding.falsePositive === true && reason.length > 0;
  return {
    pass,
    file: String(finding.file || '').trim(),
    line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : 1,
    severity: normalizeSeverity(finding.severity),
    category: String(finding.category || pass).trim(),
    description: String(finding.description || '').trim(),
    suggestion: String(finding.suggestion || '').trim(),
    confidence: normalizeConfidence(finding.confidence),
    falsePositive: dismissed,
    falsePositiveReason: dismissed ? reason : undefined,
    reasonMissing: finding.falsePositive === true && reason.length === 0,
    status: dismissed ? 'false-positive' : 'open'
  };
}
```

## Consolidation algorithm

1. Flatten every reviewer result into normalized findings.
2. Drop only structurally empty rows: no file AND no description. Keep weak-location rows, but they cannot be auto-fixed.
3. Deduplicate by exact key: `pass:file:line:description`.
4. Preserve the first occurrence; append later duplicate provenance into `duplicates[]` if useful.
5. Sort by severity order, then file, then line:
   - `critical = 0`
   - `high = 1`
   - `medium = 2`
   - `low = 3`
6. Counts are open-only: dismissed false positives do not count toward critical/high gates.
7. Write `.outline/audit/queue.json` atomically after consolidation.

Pseudo-code:

```js
function consolidate(agentResults) {
  const rows = [];
  for (const result of agentResults) {
    const pass = result.pass || result.reviewer || 'unknown';
    for (const finding of Array.isArray(result.findings) ? result.findings : []) {
      const normalized = normalizeFinding(pass, finding);
      if (!normalized.file && !normalized.description) continue;
      normalized.id = `${pass}:${normalized.file}:${normalized.line}:${normalized.description}`;
      rows.push(normalized);
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.pass}:${row.file}:${row.line}:${row.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  deduped.sort((a, b) =>
    severityRank(a.severity) - severityRank(b.severity) ||
    a.file.localeCompare(b.file) ||
    a.line - b.line
  );

  return addCountsAndBlockSignal(deduped);
}
```

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
| `override-and-accept-dismissals` | User has manually inspected enough findings and accepts the risk. | Keep dismissals; continue to normal zero-check / fix loop. Record the override in queue decisions. |
| `abort` | User wants manual inspection before automation proceeds. | Stop with queue intact; no fixes applied after the blocked result. |

Never silently choose `override-and-accept-dismissals`.

## Low-finding extraction to TECHNICAL_DEBT

LOW findings are useful but must not stall the critical/high correction loop.

Extraction rules:

1. After consolidation, copy open LOW findings to `.outline/audit/queue.json.lowDebt`.
2. Create or update `TECHNICAL_DEBT.md` in the audited repo only when the audit mode permits writing debt output or LOW findings need a visible queue.
3. Use this format:

```md
# Technical Debt

Last updated: YYYY-MM-DD

## From audit-project

- [ ] `path/to/file.ext:42` [low][category][confidence] Description. Suggested fix: ...
```

4. Do not include exploitable security details in public issue bodies. A LOW security-hardening item may be listed generically; sensitive exploit paths stay in `.outline/audit/queue.json`.
5. LOW findings do not count in `openCriticalHigh`.

## Queue state schema

Minimal state under `.outline/audit/queue.json`:

```json
{
  "scope": { "type": "path|recent|domain", "value": "." },
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
  "maxIterations": 5,
  "rawResults": [],
  "items": [],
  "lowDebt": [],
  "counts": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "falsePositive": { "dismissed": 0, "total": 0, "ratio": 0, "blocked": false, "blockReason": null },
  "hashHistory": [],
  "verification": [],
  "decisions": [],
  "updatedAt": "ISO-8601"
}
```

## Fix-loop state machine

```text
CONSOLIDATED
  ├─ blocked false-positive ratio -> ASK_BLOCKED
  ├─ open critical/high == 0      -> CLEAN
  └─ open critical/high > 0       -> FIX_BATCH

ASK_BLOCKED
  ├─ treat-all-as-open            -> CONSOLIDATED
  ├─ override-and-accept          -> CONSOLIDATED
  └─ abort                        -> STOP_QUEUE_INTACT

FIX_BATCH
  ├─ verifier green               -> TARGETED_REVIEW
  └─ verifier red                 -> GIT_RESTORE_BATCH -> CONSOLIDATED

TARGETED_REVIEW
  └─ consolidate changed-file results -> CONSOLIDATED

CONSOLIDATED at iteration boundary
  ├─ hash repeated twice          -> ASK_ITERATION_STALL
  ├─ iteration >= max             -> ASK_ITERATION
  └─ critical/high remain         -> ASK_ITERATION
```

## Per-iteration decision gate

At every iteration boundary with open critical/high findings, show current queue counts, changed files, last verification status, and queue path. Then call `ask` with exactly one selected option:

| Option | Recommended When | Effect |
|---|---|---|
| `continue-fixing` | Verifier is green, hash did not stall, iteration < max, remaining findings are actionable. | Run next batch. |
| `create-issues-for-rest` | Remaining work is valid but larger than this session, or needs owner scheduling. | Stop loop; create internal/private issues where safe; do not publicize exploitable security details. |
| `move-remainder-to-TECHNICAL_DEBT` | Remaining findings are medium/low or explicitly accepted risk; not recommended for critical/high unless user accepts. | Append remaining findings to `TECHNICAL_DEBT.md`, mark queue deferred. |
| `leave-in-queue` | User wants resume later or manual inspection. | Stop with `.outline/audit/queue.json` intact. |

If the same open critical/high hash appears in two consecutive iterations, mark `stalled: true`; do not recommend `continue-fixing` unless the user supplies a new fix strategy.

Hash input:

```text
sorted(open critical/high findings).map(
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

Severity is reviewer-proposed but consolidation may require escalation or downgrade before fixes:

- Escalate to `critical` if exploitability, data loss, production outage, credential exposure, or irreversible destructive migration is credible.
- Escalate to `high` if a bug/regression is likely on normal inputs or a missing test covers a just-fixed critical/high invariant.
- Downgrade to `medium` if the issue is maintainability-only with no current failure path.
- Downgrade to `low` if it is style, naming, or future cleanup.
- Never downgrade an exploitable security finding into public debt output.
