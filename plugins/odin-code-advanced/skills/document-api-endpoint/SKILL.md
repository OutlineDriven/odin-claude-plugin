---
name: document-api-endpoint
description: 'Use when reconciling an API endpoint''s generated OpenAPI schema and declared response types with its actual runtime response. Adds or fixes schema decorators, reuses canonical types, migrates legacy path definitions, and validates the spec locally. Not for general API documentation: use docs-and-adrs.'
---

# Document and type an API endpoint

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to document, type, or fix OpenAPI schema for an endpoint whose generated spec drifts from its runtime response. |
| Authority | Reversible local writes to the endpoint class and API documentation files for that one path; all changes are VCS-tracked, revert to recover. |
| Side effect | Updates or adds OpenAPI schema annotations and response types for one endpoint path. |
| Done | Endpoint has accurate schema annotations, typed responses matching runtime, and passing local schema validation. |

## Inputs

- The endpoint route and HTTP method(s) to document, plus the serving class or handler (required).
- The runtime response shape: confirmed via a live request, a tool that calls the endpoint, or a test that exercises the path and captures the response (required).
- Optional: a request to promote the endpoint from a private or experimental status to public.

## Procedure

1. Confirm the endpoint's actual runtime response shape. Use a live request, an MCP or test tool that calls the endpoint, or a capturing test. Record the response keys, value types, and nesting. Done when: the serving class and its actual return shape are confirmed.
2. Add or update OpenAPI schema annotations on the endpoint. Apply the framework's schema decorator or annotation mechanism (e.g., `@extend_schema`, `@OpenApiResponse`, `ProducesResponseType`) with operation ID, parameters, response codes, and examples. Reuse the project's existing parameter and example registries where they exist. Done when: the endpoint carries schema annotations with operation ID, parameters, responses, and examples.
3. Reconcile declared response types against the runtime response. Compare every key and type in the declared response type against the confirmed runtime shape. Correct the declared type to match runtime: counts returned as floats instead of integers, IDs declared as one type but emitted as another, nested types with the wrong field count. Reuse the canonical response type instead of re-declaring a copy; use optional-field mixins or partial schemas where the framework supports them. If the payload is proxied from another service and no clean canonical type exists, type it as a broad structure (`dict[str, Any]` or equivalent) and confirm the shape from the owning service. Done when: every declared type matches the runtime response and no duplicate type copies remain.
4. Infer the response type from the producing code where possible. Do not use `cast` or `# type: ignore` to force alignment; refactor the producing code so the type is inferred. Done when: the response type is inferred from producing code with no forced casts or ignores.
5. If a legacy schema definition (a hand-written JSON or YAML file for the path) exists, migrate every method on that path in one change: delete the legacy file and remove its reference from the top-level spec. Most generators do not merge hand-written and decorator-driven methods on the same path, so once any method uses schema annotations, all legacy methods on that path vanish from the generated spec. Done when: every method on the path is migrated and the legacy file and its reference are removed.
6. Validate the generated OpenAPI specification locally. Run the project's schema generation command, the example validation command, the endpoint-specific test, and the lint or pre-commit check on the changed paths. Done when: all validation commands pass.

## Failure and recovery

- Runtime response cannot be obtained: the live request, tool, or test could not confirm the actual response shape. Stop. Report the blocker. Do not guess the response shape or align types against an assumed shape.
- Declared type drifts from runtime: correct the declared type to match runtime or refactor the producing code. Never paper over the drift with `cast` or `# type: ignore`.
- Partial legacy migration: if not every method on a path is migrated in one change, the unmigrated legacy methods vanish from the generated spec. Roll back the path change and migrate all methods together.
- Validation failure: do not claim the done predicate holds. Report the failing check and the offending diff; keep the change uncommitted or revert it.
- Rollback: all changes are VCS-tracked local artifacts; revert the commit or hunks to recover.

## Output

The endpoint with correct schema annotations, typed responses matching runtime, and (when applicable) public status, plus a report naming changed paths, validation results, and any downstream schema regeneration dependency.
