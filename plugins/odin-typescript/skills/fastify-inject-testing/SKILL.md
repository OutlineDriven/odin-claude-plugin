---
name: fastify-inject-testing
description: 'Use when asked to test Fastify applications without network sockets. Not for building the app: use fastify-schema-first-service.'
---

# Fastify inject testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Testing Fastify applications without network sockets: auth, validation errors, uploads, streams, plugins, hooks. |
| Authority | Reversible local: write only test files under the project test tree and run node:test suites. Roll back by deleting the added test files and reverting test-only config; never mutate application source, credentials, or remote state. |
| Side effect | Writes test files; runs node:test suites. |
| Done | Integration tests exercise routes via inject() with no listener, covering auth, validation failure, and at least one stream/upload path, passing in parallel. |

## Inputs

- A Fastify application factory (e.g. `buildApp()` or `buildTestApp(options)`) that returns a ready `FastifyInstance` without calling `listen()`. Required.
- Route definitions under test (path, method, schema, auth). Required.
- Optional: a test database URL (`TEST_DATABASE_URL`) or mocked dependency factories for isolation.
- Optional: fixture files for upload tests (e.g. `./test/fixtures/test.pdf`).

## Procedure

1. Build a reusable test app factory that constructs `Fastify({ logger: false, ...options })`, registers the real plugins and routes, calls `await app.ready()`, and returns `{ app, inject: app.inject.bind(app) }`. Never call `app.listen()`; `inject()` simulates HTTP without a network socket.

```typescript
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

export async function buildTestApp(options = {}): Promise<{
  app: FastifyInstance;
  inject: FastifyInstance['inject'];
}> {
  const app = Fastify({ logger: false, ...options });
  app.register(import('../src/plugins/database.js'), {
    connectionString: process.env.TEST_DATABASE_URL,
  });
  app.register(import('../src/routes/index.js'));
  await app.ready();
  return { app, inject: app.inject.bind(app) };
}
```

Done when: the factory returns `{ app, inject }` without calling `listen()`.

2. In each `describe` block, create a fresh app instance in `before` and close it in `after` so suites are isolated and can run in parallel.

```typescript
import { describe, it, before, after } from 'node:test';

let app;
before(async () => { app = await buildApp(); await app.ready(); });
after(async () => { await app.close(); });
```

Done when: each `describe` block creates and closes its own app instance.

3. Exercise routes via `app.inject({ method, url, payload, headers, query })` and assert on `response.statusCode`, `response.headers`, `response.json()`, and `response.rawPayload`. Cover at minimum: an authenticated route, a validation failure, and one stream or upload path. Done when: at minimum an authenticated route, a validation failure, and one stream/upload path are exercised.

4. Test authentication by injecting without credentials (expect `401`) and with an `authorization: Bearer <token>` header obtained from a login inject call.

```typescript
const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
const token = login.json().token;
const ok = await app.inject({ method: 'GET', url: '/profile', headers: { authorization: `Bearer ${token}` } });
t.assert.equal(ok.statusCode, 200);
```

Done when: the 401-without-credentials and 200-with-token cases are asserted.

5. Test validation failure by sending a payload that violates the route JSON schema and assert `statusCode === 400` with the field name in `body.message`.

```typescript
const res = await app.inject({ method: 'POST', url: '/users', payload: { name: 'John', email: 'not-an-email' } });
t.assert.equal(res.statusCode, 400);
t.assert.ok(res.json().message.includes('email'));
```

Done when: `statusCode === 400` is asserted with the field name in `body.message`.

6. Test file uploads by building a `form-data` instance with `createReadStream` and passing `payload: form` plus `headers: form.getHeaders()`.

```typescript
import { createReadStream } from 'node:fs';
import FormData from 'form-data';
const form = new FormData();
form.append('file', createReadStream('./test/fixtures/test.pdf'));
const res = await app.inject({ method: 'POST', url: '/upload', payload: form, headers: form.getHeaders() });
t.assert.equal(res.statusCode, 200);
```

Done when: the form-data upload returns the expected status.

7. Test streaming responses by injecting the streaming route and asserting `statusCode === 200` and `response.rawPayload.length > 0`. Done when: `statusCode === 200` and `rawPayload.length > 0` are asserted.

8. Mock external dependencies with `node:test` `mock.fn()` and decorate the app (`app.decorate('db', mockDb)`) before registering routes, then assert call counts via `app.db.users.findAll.mock.calls.length`. Done when: `mock.fn` is used and call counts are asserted.

9. Test plugins in isolation by registering only the plugin under test on a bare `Fastify()` instance and asserting decorators (`app.hasDecorator('cache')`) and behavior directly. Done when: the plugin is registered on a bare instance and decorators/behavior are asserted.

10. Test hooks by injecting a route and asserting side-effect headers (`response.headers['x-request-id']`) or captured log lines from a custom logger stream. Done when: side-effect headers or captured log lines are asserted.

11. For database integration, wrap each test in a transaction begun in `beforeEach` and rolled back in `afterEach` so tests stay isolated and parallel-safe.

```typescript
beforeEach(async () => { transaction = await app.db.beginTransaction(); app.db.setTransaction(transaction); });
afterEach(async () => { await transaction.rollback(); });
```

Done when: each test begins and rolls back a transaction.

12. Run the suite with `node --test` (add `--experimental-test-coverage` or `--watch` as needed). Each `describe` block uses its own app instance so suites pass in parallel. Done when: the suite passes under `node --test` with suites running in parallel.

## Failure and recovery
- `app.ready()` rejects: the factory or a plugin failed to boot. Do not call `listen()` as a workaround; fix the plugin registration or provide the missing option. Roll back by removing the added test file.
- Validation test returns non-400: the route schema does not reject the input as expected. Stop and correct the test payload or the schema; never relax an assertion to make it pass.
- Auth test returns 200 without credentials: the route is not guarded. Report the gap; do not add credentials to the unauthenticated case.
- Upload/stream test fails because the fixture is missing: state the missing fixture path as a blocker; do not invent fixture bytes.
- Parallel suites share state: ensure each `describe` builds and closes its own app instance; never share a module-level app across suites.
- Partial result rule: if some paths pass and others fail, report which mechanism classes passed and which failed; do not claim the done predicate holds while any required path (auth, validation failure, stream/upload) is unverified.
- Non-mutation rule: never edit application source to make a test pass. The only writable targets are test files and test-only config; recovery is deleting them.

## Output
A node:test suite that boots Fastify via `inject()` with no listener, covering authenticated routes, validation failures, and at least one stream or upload path, plus any plugin, hook, mock, or transaction-isolation cases requested. The suite passes under `node --test` with suites running in parallel. Terminal classification: done when every required path is exercised and green; otherwise a per-path failure report naming the unverified mechanism class.
