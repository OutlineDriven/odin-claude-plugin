---
name: performance-optimization
description: 'Optimize application performance by measuring before and after every change. Use when performance requirements exist, users report slowness, Core Web Vitals are below thresholds, a regression is suspected, or profiling reveals bottlenecks. Produces measurably improved bottlenecks with green tests and no regressions. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Performance optimization

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Performance requirements exist, users report slowness, Core Web Vitals are below thresholds, a regression is suspected, or profiling reveals bottlenecks. |
| Authority | Reversible local writes to the codebase only. Rollback is the prior git state. |
| Side effect | Optimized code; may add monitoring or regression tests. |
| Done | The identified bottleneck is measurably improved, tests remain green, and no new regressions are introduced. |

## Inputs

Required: a performance symptom and the codebase under optimization. Optional: existing measurements, profiling evidence, performance budgets, or Core Web Vitals targets.

## Procedure

1. **Establish baseline.** Measure the bottleneck with profiling tools or timing data before touching any code. Record the specific metric, the tool or method used, and the measured value. If baseline cannot be established, stop and report blocked.

2. **Identify the specific bottleneck.** Use the symptom to determine the profiling target: frontend performance (Lighthouse, DevTools Performance tab, web-vitals RUM), backend latency (APM, query logging, EXPLAIN ANALYZE), bundle analysis, or heap profiling. Do not assume the cause. The query plan is the measurement for database queries; the trace is the measurement for frontend jank.

3. **Fix the identified bottleneck only.** Apply one targeted change. Code it completely before measuring again. Common fixes: N+1 queries -> single query with join or include; unbounded pagination -> limit and offset; missing index -> CREATE INDEX with composite key shaped to the query; connection pool exhaustion -> size pool to database ceiling; large bundle -> code splitting or lazy loading; unoptimized images -> responsive srcset, lazy loading, modern format; unnecessary re-renders -> React.memo, useMemo, stable references; missing caching -> cache expensive reads with stated TTL and key design.

4. **Re-measure under identical conditions.** Use the same tool, same conditions, same measurement method as the baseline. One change at a time. If the improvement falls within measurement noise, revert.

5. **Keep or revert strictly.** Past threshold and tests green: keep. Within noise or tests red: revert immediately. Neutral is a revert. An optimization that wins by dropping needed work is a revert.

6. **Guard the metric.** Add a synthetic CI performance budget or a field monitor (RUM p75) for the primary metric. This prevents the fix from regressing unseen.

## Failure and recovery
**Baseline unavailable.** Measurement tools are unavailable or the codebase cannot be profiled. Result: blocked. Do not proceed without baseline evidence.

**No bottleneck found.** Profiling reveals no measurable code-level bottleneck. Result: report uncertainty and whether environmental or statistical noise is suspected.

**Fix produces no measurable gain.** Improvement is within noise range of the baseline. Result: revert. Never keep a neutral change.

**Correctness regression.** Tests fail or behavior changes after the fix. Result: revert immediately. Correctness gates the metric.

**Fix exceeds available authority.** The bottleneck requires unavailable credentials, remote mutation, or infrastructure changes outside local write scope. Result: document the requirement for a future attempt. Do not widen scope.

Partial-result rule: reverted code leaves no trace. Keep a ledger entry (baseline, fix applied, before/after measurement, verdict) so discarded ideas are not re-profiled.

## Output
Optimized code with before/after measurements in the commit message. Ledger entry for each attempt (kept and reverted) documenting the hypothesis, baseline, result, and verdict. The commit message states the metric name, baseline value, result value, and the tool used to measure.

## Provenance

Origin: addyosmani/agent-skills `skills/performance-optimization/SKILL.md` at commit `d2c37ef6225dd8726cdd369a8030307f48592d26`. License: MIT — Copyright (c) 2025 Addy Osmani. Permission is hereby granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. Adaptation: authored as a semantic-minimum self-contained ODIN 2.0 skill retaining the measure-identify-fix-verify-guard workflow, Core Web Vitals targets, bottleneck tables, and code pattern exemplars. Trigger translated to explicit-model-invocation. Done predicate bound to check-set-passes. Authority translated to reversible-local. Support anchor and template references removed; no runtime dependency or inter-skill pointer added.
