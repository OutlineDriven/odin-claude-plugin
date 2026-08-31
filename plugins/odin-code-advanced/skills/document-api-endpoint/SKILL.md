---
name: document-api-endpoint
description: 'Use when documenting or fixing OpenAPI docs for a Sentry endpoint via @extend_schema decorators, TypedDict responses, and spec validation. Not for general API documentation — use docs-and-adrs.'
---

# Document and type a Sentry API endpoint

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to document, type, or fix OpenAPI docs for a Sentry endpoint, add @extend_schema, or promote an endpoint |
| Authority | Write only the endpoint class, its response types, and the api-docs files for that one path; all changes are VCS-tracked, revert to recover |
| Side effect | Updates or adds OpenAPI documentation and response types for one endpoint path |
| Done | Endpoint has correct @extend_schema, TypedDict responses, and generated docs pass validation |

## Inputs

- The endpoint route and HTTP method(s) to document, plus the endpoint class that serves it.
- Optional: a request to promote the endpoint from PRIVATE/EXPERIMENTAL to PUBLIC.
- A live Sentry API token is needed to confirm runtime response shape; supply it or confirm the behavior via the MCP tool that calls the endpoint.

## Procedure

1. Identify the endpoint class serving the route and confirm what it actually returns. The fastest confirmation is the MCP tool that calls it or a live request with a real token. Done when: the endpoint class and its actual return shape are confirmed.
2. Add class-level `@extend_schema(tags=[...])` using the closest existing `OPENAPI_TAGS` entry. Done when: the class carries a tag-matched `@extend_schema` decorator.
3. Add method-level `@extend_schema(operation_id=..., parameters=[...], responses={...}, examples=...)`; reuse `src/sentry/apidocs/parameters.py` and `examples/*.py`, and set `owner = ApiOwner.<TEAM>`. Done when: the method carries `@extend_schema` with operation_id, parameters, responses, examples, and owner.
4. Compare the declared types against the runtime response. Hit the live endpoint and diff keys and types against the TypedDict. Correct the declared type to match runtime, including counts returned as floats instead of integers, IDs declared `int` but emitted as strings, and nested types that declare the wrong number of fields. Done when: every declared type matches the runtime response shape.
5. Reuse the canonical response type instead of re-declaring a copy in a `*_types.py`. Use the `XxxResponseOptional(TypedDict, total=False)` mixin where the main class declares required fields. `T | None` means the key is always present and the value may be null; `NotRequired[T]` means the key is set only under a condition such as an `expand` query param. If no clean canonical type exists (a payload proxied from another service like vroom/profiling), type it `dict[str, Any]` and confirm the shape from the owning service's repo, not the serializer. Done when: no duplicate response type copies remain and canonical types are reused.
6. Infer the response type from the producing code. Do not use `cast` or `# type: ignore`; refactor the producing code so the type is inferred rather than forced. Done when: the response type is inferred from producing code with no `cast` or `# type: ignore`.
7. If a legacy `api-docs/paths/**/*.json` covers the path, migrate every method on that path in one commit: delete the legacy JSON file and remove its `$ref` from `api-docs/openapi.json`. drf-spectacular's `APPEND_PATHS` does not merge HTTP methods, so once any method on a path uses `@extend_schema`, all legacy methods on that path vanish from the generated spec. Done when: every method on the path is migrated and the legacy JSON file and its `$ref` are removed.
8. To promote to PUBLIC, run the workflow above, then on the concrete endpoint only (leave siblings PRIVATE): bump `publish_status[<METHOD>]` to `PUBLIC` and set `owner = ApiOwner.<TEAM>`; remove the method from `API_OWNERSHIP_ALLOWLIST_DONT_MODIFY` in the same change as the flip. If the endpoint is redundant or being renamed, delete or deprecate the old version in its own change first, then stack the publish on top. Note in the PR if scopes widen (e.g. `event:read` to `event:{admin,read,write}`); that is documentation-only, regenerated from `permission_classes`. The change reaches the `@sentry/api` SDK / MCP only after `sentry-api-schema` regenerates downstream. Done when: `publish_status` is `PUBLIC`, ownership is set, and the allowlist entry is removed in the same change.
9. Validate: `make build-api-docs`, `pnpm run validate-api-examples`, `.venv/bin/pytest -q --reuse-db tests/apidocs/endpoints/<area>/test_<name>.py`, and `.venv/bin/prek run -q --files <changed paths>`. Done when: all four validation commands pass.

## Failure and recovery
- Declared type drifts from runtime: correct the declared type to match runtime or refactor the producing code; never paper over the drift with `cast` or `# type: ignore`.
- Partial legacy migration: if not every method on a path is migrated in one commit, the unmigrated legacy methods vanish from the generated spec. Roll back the path change and migrate all methods together in one commit.
- Validation failure: do not claim the done predicate holds. Report the failing check and the offending diff; keep the change uncommitted or revert it.
- Rollback: all changes are VCS-tracked local artifacts; revert the commit or hunks to recover.

## Output
The endpoint with correct `@extend_schema` decorators, TypedDict responses, and (when applicable) PUBLIC status, plus a report naming changed paths, validation results, and any downstream `sentry-api-schema` regeneration dependency.
