---
name: django-access-review
description: 'Use when reviewing Django or DRF access control, IDOR, authorization, permissions, or tenant isolation. Returns validated findings with evidence, impact, and enforcing fixes. Not for Django query performance — use django-perf-review. No source or remote-system changes.'
---

# Django access control & IDOR review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to review Django access control, IDOR, authorization, permissions, or tenant isolation |
| Authority | Read-only: no file, VCS, credential, or remote mutation. Investigate source via read/grep/glob only |
| Side effect | Reports access-control vulnerabilities as chat output; changes nothing |
| Done | Validated IDOR/authz findings with evidence, impact, and fix suggestions returned |

## Inputs

Required: a Django or Django REST Framework codebase reachable as filesystem paths.

Optional: a specific component, endpoint, or model to scope the review. Without a scope, review the whole codebase and state which endpoints were and were not covered.

## Procedure

Investigate rather than pattern-match. Every codebase enforces authorization differently; understand this implementation before judging it.

1. **Map the authorization model.** Before judging any endpoint, determine where permission checks live (decorators, middleware, base classes, DRF `permission_classes`, custom mixins), how queries are scoped (custom managers, `get_queryset()` overrides, middleware-set context), and what the ownership model is (single user, organization/tenant, hierarchical, role-based). Use grep/glob over `*.py` to find `permission_classes`, `@login_required`, `@permission_required`, base view classes, managers, `get_queryset`, and ownership fields (`owner`, `user_id`, `organization`, `tenant`). Do not proceed to findings until the model is understood. **Done when:** the authorization model and ownership rules are understood.

2. **Map the attack surface.** Identify models that hold user data and carry ownership fields or are addressed by ID in URLs, request bodies, or query params. For each, list the exposed operations: list, retrieve, create, update, delete, and custom actions. **Done when:** models and exposed operations are mapped.

3. **Ask the core question per endpoint.** For each endpoint handling user data: "If I am User A and I know the ID of User B's resource, can I access, modify, or delete it?" Trace the data flow: (a) where the resource ID enters (URL path, query param, request body); (b) where that ID fetches data (the ORM query or DB call); (c) what checks exist between entry and fetch — is the query scoped to the current user, is there an explicit ownership check, is there an object-level permission, does a base class/mixin/manager enforce access. If no check is visible, check parent classes, middleware, managers, and URL-level decorators before concluding a gap. **Done when:** each endpoint has an end-to-end authorization trace.

4. **Trace specific flows end to end.** Pick concrete endpoints and follow them from URL to query to response. Investigate gap indicators rather than auto-flagging them: `get_queryset()` returning `.all()` or filtering without the user; direct `Model.objects.get(pk=pk)` without ownership in the query; IDs taken from the request body for sensitive operations; permission classes that check authentication but not ownership; missing `has_object_permission()` with an unscoped queryset. Verify likely-safe patterns instead of trusting them: a `get_queryset()` filtering by `request.user` or org, a custom `has_object_permission()`, a scoping base class, an auto-filtering manager. **Done when:** concrete flows are traced and apparent safeguards verified.

5. **Report only confirmed findings.** Assign confidence: HIGH — flow traced and no check confirmed to exist (report with evidence); MEDIUM — a check may exist but could not be confirmed (note for manual verification); LOW — theoretical and likely mitigated (do not report). For each finding give location (`path:line`), the question investigated, the traced steps, a code snippet showing the gap, the impact, and a suggested fix. **Done when:** only confirmed findings remain, with confidence and evidence.

6. **Fixes must enforce, not document.** A suggested fix must include actual code that validates permission before proceeding and raises an exception or returns an error on unauthorized access — making unauthorized access impossible, not discouraged. A comment or docstring is never an acceptable fix. If the right enforcement mechanism cannot be determined, state that explicitly rather than substituting documentation. **Done when:** every suggested fix enforces permission in code or states why no mechanism can be chosen.
## Failure and recovery
- Authorization model not determinable: if the codebase's permission or scoping mechanism cannot be understood from source, stop. Report which components could not be modeled and do not fabricate findings for them.
- Unconfirmed check: a check that may exist but cannot be traced is MEDIUM, not HIGH. Never report an unconfirmed gap as confirmed.
- Scope not covered: list endpoints or flows not reviewed under "Areas Not Reviewed" rather than implying full coverage.
- Non-mutation: this skill reads source only. If investigation requires running code or mutating state, stop and report the blocker; do not widen authority.

## Output
A markdown report with: a brief description of the codebase's authorization model; findings each tagged with an ID, severity, confidence, location, the question investigated, traced steps, evidence snippet, impact, and an enforcing suggested fix; a "Needs Manual Verification" section for MEDIUM items; and an "Areas Not Reviewed" section listing uncovered endpoints or flows.
