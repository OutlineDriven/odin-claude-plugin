---
name: cursor-sdk
description: 'Use when asked to build against @cursor/sdk or migrate from its REST API. Produce a disposed, awaited, guarded, correctly authenticated SDK integration. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Cursor SDK

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Build against @cursor/sdk or migrate from its REST API. |
| Authority | Reversible local: write only integration code in the working tree; rollback by discarding uncommitted writes or `git checkout` on the touched files. |
| Side effect | Produces integration code. |
| Done | Disposed, awaited, guarded, correctly authenticated SDK integration. |

## Inputs

Required: the target integration surface — either a new @cursor/sdk build or an existing REST API call site to migrate.
Optional: existing REST client code to replace, preferred runtime (Node or Bun), and MCP server endpoints to expose to the agent.

## Procedure

1. Bound scope: list the files that will be written or modified and state the rollback path (discard uncommitted writes or `git checkout` the touched files) before mutating anything. Done when: the file set and rollback path are stated before any mutation.
2. Choose the runtime: @cursor/sdk runs on Node or Bun. Pick one and use its native fetch and async disposal; do not mix runtimes within one integration. Done when: one runtime is chosen and used consistently.
3. Authenticate correctly: load the Cursor API key from the environment at startup, never hardcode it. Stop before constructing the client if the key is missing or empty. Done when: the API key is loaded from the environment or the run stops with the missing variable named.
4. Construct the client and agent: instantiate the SDK client with the authenticated key, then build the agent with the model, tools, and instructions the integration needs. Done when: the client and agent are constructed with the authenticated key.
5. Guard every resource: wrap the client and any stream, file handle, or MCP connection in a scope that disposes them on exit. Use `using`/`await using` or try/finally so disposal runs on both success and error paths. Done when: every resource is wrapped in a disposal scope covering success and error paths.
6. Await every async operation: await client calls, stream consumption, and MCP tool invocations. Never fire-and-forget an SDK promise; an unawaited rejection becomes an unhandled rejection. Done when: every SDK promise is awaited.
7. Handle errors at the boundary: catch SDK and transport errors where the integration calls into the SDK, classify them (auth, rate-limit, network, model), and surface a typed error to the caller. Retry only transient errors with bounded backoff; never retry auth errors. Done when: boundary errors are caught, classified, and surfaced as typed errors with bounded retry for transient classes only.
8. Consume streams to completion: iterate a streaming response until it ends, forward tokens to the consumer, and close the stream in the finally block. Done when: every stream is iterated to completion and closed in finally.
9. Wire MCP servers explicitly: register each MCP server with the agent, declare its tools, and dispose the server connection in the same scope as the client. Done when: every MCP server is registered, declared, and disposed in the client scope.
10. Migrate REST call sites: replace each REST HTTP call with the equivalent SDK method, preserving request parameters and response handling; remove the REST client dependency only after no call site remains. Done when: every REST call site is replaced and the REST dependency is removed.
11. Verify end-to-end: run the integration against the real SDK with the authenticated key, exercise each tool and stream path, and confirm disposal and awaiting hold under both success and error. Done when: end-to-end verification confirms disposal, awaiting, guarding, and authentication under success and error paths.

## Failure and recovery
- Missing or empty API key: stop before constructing the client and report the missing environment variable. No client code is written for that path.
- Unawaited promise detected: treat as a defect, not a warning; add the await or restructure into a disposed scope. Do not ship an integration with a floating promise.
- Resource leak (stream, MCP connection, or client not disposed): wrap the resource in a disposal scope; if a scope cannot be added, stop and report the unguarded resource.
- REST migration leaves a dangling call site: the migration is incomplete; do not remove the REST dependency until every call site is converted and verified.
- SDK or transport error during verification: classify and surface the typed error; do not swallow it or pretend the done predicate holds. Retry only transient errors with bounded backoff.
- Non-converged: if verification cannot confirm disposal, awaiting, guarding, and correct authentication, return the incomplete integration with the failing check named.

## Output
Integration code with an authenticated @cursor/sdk client and agent, all resources disposed, all async operations awaited, errors typed at the boundary, and REST call sites replaced when migrating; plus the end-to-end verification result.

## Provenance

Origin: cursor/plugins repository, path cursor-sdk/skills/cursor-sdk/. Pinned revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest. Adapted clean-room from the seven source references (advanced, auth, error-handling, mcp, patterns, runtime-choice, streaming) into this self-contained procedure; no third-party expression copied.
