---
name: fastify-schema-first-service
description: 'Use when building or extending a Fastify application: routes, plugins, hooks, database wiring. Not for testing: use fastify-inject-testing. Not for hardening: use fastify-production-hardening.'
---

# Fastify schema first service

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building or extending a Fastify application: routes, plugins, JSON Schema validation/serialization, hooks/lifecycle, decorators, content types, database wiring. |
| Authority | Reversible local: writes only Fastify application code; rollback is version control. No deployment, credential, or remote mutation. |
| Side effect | Writes Fastify application code: route handlers, plugins, schemas, hooks, decorators, content-type parsers, and database wiring. |
| Done | Routes carry request+response schemas, validation errors are schema-shaped, decorators/hooks respect encapsulation, app boots with plugins in dependency order. |

## Inputs

Required: the Fastify application entry point or the module to extend, and the target Node.js/Fastify version baseline.

Optional: existing route/plugin/schema files to modify, database adapter choice, TypeScript preference (type stripping vs compiled), and content-type requirements beyond JSON and text/plain.

## Procedure

1. **Bound scope.** Identify the entry point (`app.ts`/`server.ts`) and the files to add or change. Do not touch deployment config, credentials, or unrelated modules. Done when: the entry point and files to change are identified; deployment config, credentials, and unrelated modules are excluded.

2. **Define schemas first.** For every route, define JSON Schema for the request parts that exist (`params`, `querystring`, `headers`, `body`) and for the response (`response` keyed by status code). Prefer TypeBox (`@sinclair/typebox`) so TypeScript types derive from the same schema via `Static<typeof Schema>`. Register reusable schemas with `app.addSchema({ $id, ... })` and reference them with `$ref: '<id>#'`. Done when: every route has JSON Schema for existing request parts and response, with reusable schemas registered via `addSchema`.

3. **Register routes with schemas.** Use shorthand methods (`app.get`, `app.post`) or `app.route` with the full options object. Attach the schema object to each route. Type route handlers with generics (`app.post<{ Body, Params, Querystring, Reply }>`). Organize routes by feature in separate files exporting a default plugin function. Done when: every route is registered with its schema object and typed handler.

4. **Wire plugins in dependency order.** Register plugins with `app.register`. Each `register` creates an encapsulated context: decorators and hooks inside a plugin are invisible to siblings. Use `fastify-plugin` (`fp`) to break encapsulation when a decorator or hook must reach the parent. Declare `dependencies` and `name` in `fp` metadata so load order is explicit. Use `.after()` or sequential `register` calls when one plugin must be ready before the next. Use `@fastify/autoload` to load plugin and route directories automatically. Done when: plugins are registered with explicit dependencies and names; autoload is used where applicable.

5. **Add hooks at the correct lifecycle stage.** Fastify executes hooks in order: `onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`. Add `onRequest` for auth and request-id setup, `preValidation` for body normalization before schema validation, `preHandler` for authorization and data loading after validation, `preSerialization` to transform the payload before stringification, `onSend` to mutate the serialized response, `onResponse` for logging and metrics after the reply is sent. Stop hook execution by calling `reply.code(n).send(...)` and returning. Scope hooks to a plugin context so they apply only to that plugin's routes. Done when: hooks are placed at the correct lifecycle stage and scoped to their plugin context.

6. **Decorate with encapsulation.** Use `app.decorate` (instance), `app.decorateRequest`, and `app.decorateReply` for custom properties and methods. Initialize request/reply decorators inside `onRequest` hooks (object decorators need a `null` default then assignment in the hook). Extend Fastify types via `declare module 'fastify'` declaration merging. Guard plugin dependencies with `fastify.hasDecorator('name')` and throw if missing. Done when: decorators are initialized correctly and types are extended via declaration merging.

7. **Shape validation and error responses.** Fastify validates request parts against the route schema before the handler runs; validation failures carry `error.validation`. Install a custom `app.setErrorHandler` that checks `error.validation`, returns a 400 with `statusCode`, `error`, `message`, and `details: error.validation`. Use `@fastify/error` (`createError`) for typed errors with `statusCode` and `code`. Register `@fastify/sensible` for standard HTTP reply helpers (`reply.notFound`, `reply.badRequest`, etc.). Set `app.setNotFoundHandler` for a consistent 404 shape. Define error response schemas with `$id` and `$ref` them in route `response` blocks. Done when: `setErrorHandler` checks `error.validation` and returns a shaped 400; error response schemas are defined.

8. **Configure content-type parsers.** Fastify ships parsers for `application/json` and `text/plain`. Add custom parsers with `app.addContentTypeParser(type, { parseAs }, handler)`. For multipart uploads, register `@fastify/multipart` with explicit `limits` (field size, file size, file count, parts) and `throwFileSizeLimit: true` so over-limit uploads error instead of truncating silently. For streams, return the payload stream directly from the parser. Done when: custom parsers are added with explicit limits; multipart uses `throwFileSizeLimit: true`.

9. **Wire databases as plugins.** Use official `@fastify/postgres`, `@fastify/mysql`, `@fastify/mongodb`, or `@fastify/redis` adapters. Register the adapter inside an `fp` plugin, decorate the instance with the connection, and add an `onClose` hook to close it. Wrap data access in a repository module decorated on the instance. Acquire pooled connections per request and release them in `finally`. Wrap multi-statement writes in `BEGIN`/`COMMIT` with `ROLLBACK` on error. Done when: the adapter is registered in an `fp` plugin, the instance is decorated, `onClose` closes it, and multi-statement writes use transactions.

10. **Verify boot.** Call `await app.ready()` (or `await app.listen(...)`) and confirm plugins resolve in dependency order, decorators exist where routes expect them, and a schema-violating request returns the shaped 400 error. Done when: `app.ready()` resolves, plugins are in dependency order, decorators exist, and a schema-violating request returns the shaped 400.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| Encapsulation leak | A decorator or hook is `undefined` in a route outside the registering plugin | Wrap the plugin in `fastify-plugin` (`fp`) so it propagates to the parent, or move the route inside the plugin's `register` scope. |
| Plugin load-order error | A plugin throws because a dependency decorator is missing | Declare `dependencies: ['<name>']` in `fp` metadata and register the dependency first, or chain with `.after()`. |
| Validation error shape mismatch | A route returns an unstructured error instead of the schema-shaped 400 | Confirm `app.setErrorHandler` checks `error.validation` and that the route's `response` block includes the error status code schema. |
| Silent multipart truncation | An upload over the size limit is silently truncated | Set `throwFileSizeLimit: true` and explicit `limits` on `@fastify/multipart`. |
| Serialization strips fields | Response fields are missing from output | Add the field to the `response` schema; `fast-json-stringify` only emits properties declared in the schema. |

Partial-result rule: if a step cannot complete, stop and report the failing step and the files changed so far. Do not widen scope or invent schema fields, plugin names, or decorator shapes not supplied as input. Roll back only by reverting the local files written; no remote or deployed state is touched.

## Output
Fastify application code: schema-bearing routes, encapsulated plugins in dependency order, lifecycle hooks at the correct stage, typed decorators with declaration-merged types, shaped validation and error handlers, configured content-type parsers, and database wiring via official adapters. The application boots with `app.ready()` and a schema-violating request returns a shaped 400.
