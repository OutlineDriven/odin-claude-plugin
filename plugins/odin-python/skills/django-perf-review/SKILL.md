---
name: django-perf-review
description: 'Use when reviewing Django performance, N+1 queries, or queryset behavior. Returns validated ORM findings with severity-matched impact and concrete rewrites. Not for authorization or IDOR review — use django-access-review. No source or remote-system changes.'
---

# Django performance review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review Django performance, find N+1 queries, optimize Django, or check queryset performance. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Fixes are reported, never applied. |
| Side effect | Chat output only: reports validated Django performance issues. |
| Done | Report with validated N+1/ORM/queryset issues; severity matches impact; zero false positives. |

## Inputs

Required: read access to the Django codebase under review (models, managers, querysets, views, DRF viewsets/serializers, signals, template tags).
Optional: the specific app or module paths to bound scope; a running app or test suite for query-count confirmation; Django settings/INSTALLED_APPS for app discovery.

## Procedure

1. Bound scope to the app or module paths the user named. If none named, ask once for the scope before scanning. Do not edit files. **Done when:** scope is named and bounded.
2. Enumerate ORM call sites: scan models, managers, views, DRF viewsets, serializers, signals, and template tags for queryset construction and relation access (`.filter`, `.get`, `.exclude`, `.select_related`, `.prefetch_related`, `.values`, `.values_list`, `.annotate`, `.aggregate`, `.iterator`, `.exists`, `.count`, `.only`, `.defer`, `__` lookups, reverse managers, `.related_model` access). **Done when:** ORM call sites are enumerated.
3. Trace relation access per row: for each queryset, follow foreign-key, one-to-one, many-to-many, and reverse relations accessed inside loops, templates, serializer nested fields, or per-instance property access. Flag a relation access that runs one query per row when the relation is not loaded on that code path via `select_related` or `prefetch_related`. **Done when:** per-row relation access is traced.
4. Detect queryset misuse: querysets evaluated more than once on the same path, `len(qs)`/`list(qs)` before iteration, slicing after evaluation, `.only()`/`.defer()` that still triggers deferred-field loads. For `.count()` where `.exists()` would suffice, and for missing `.iterator()` on large result sets, require evidence of the result size before flagging: a query-plan row estimate, a `.count()` call result, a logged result count, or a user-confirmed cardinality. A `.count()` or missing `.iterator()` finding without result-size evidence is a candidate, not a validated finding. **Done when:** queryset misuse candidates are identified, with result-size evidence attached to every `.count()` and `.iterator()` flag.
5. Detect unbounded reads: list/index views without pagination, admin actions without queryset scoping. For unindexed filter or order fields, require query-plan or data-cardinality evidence before flagging: an `EXPLAIN` output showing a sequential scan, a measured row count on the filtered column, or a user-confirmed table size. An unindexed-field finding without plan or cardinality evidence is a candidate, not a validated finding. **Done when:** unbounded reads are identified, with plan or cardinality evidence attached to every unindexed-field flag.
6. Validate every finding against the actual code path: cite file, line, the queryset expression, the relation access, and the per-row query it triggers. Confirm the relation is not already prefetched or selected on that exact path. A finding without a confirmed access path is not reported as validated. **Done when:** every reported finding has a confirmed access path.
7. Classify severity by impact and query-count growth: N+1 in a list/index/hot path is high (O(n) queries per request); per-request single-row access is medium; rare/admin-only path is low. State the growth as queries per request or per row. **Done when:** severity states query growth and path impact.
8. For each validated finding, give the concrete fix with the exact queryset rewrite: `select_related` for FK/one-to-one, `prefetch_related` or `Prefetch` for many-to-many/reverse, pagination, `.iterator()`, `.only()`, or a migration adding the index. Show the before and after queryset. **Done when:** each finding has an exact queryset rewrite.
9. Return the report. Do not apply fixes, run migrations, or modify the codebase. **Done when:** the report is returned without applying fixes.
## Failure and recovery
- Ambiguous relation (generic FK, polymorphic, dynamic model class): mark unvalidated; do not report as a confirmed N+1. State the missing evidence (which model/relation cannot be resolved statically).
- Cannot determine evaluation context (template vs view vs signal vs cached property): mark as a candidate, not validated; require the user to confirm the access path before promoting it.
- No Django models or querysets found in scope: return an empty report stating the scope contained no Django ORM code. Do not invent findings.
- Partial result: report only validated findings in the main list; list unvalidated candidates separately with their blocker. Never merge unvalidated candidates into the validated set.
- Non-mutation: no files are changed, so rollback is not applicable. If a scan error occurs, stop and report the error and the partial findings already validated.

## Output
Return a report with one entry per validated issue: file, line, queryset expression, triggered query pattern, severity, query-count growth, and the concrete fix with the rewritten queryset. List unvalidated candidates separately with their blocker. Include an explicit empty-validated-findings statement when none are confirmed.
