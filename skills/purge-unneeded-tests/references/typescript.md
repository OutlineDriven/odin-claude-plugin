# TypeScript — jest/vitest deletion patterns

TypeScript with `strict: true` is a static-guarantee language. The compiler proves that interfaces have the fields they declare, that functions return their declared types (modulo `any`/`unknown`/casts), and that exhaustive matches handle every case. **Tests that assert these properties catch no bug the compiler does not** — delete them.

The carve-out: if the codebase uses `any`, `unknown`, or unchecked JSON parses, the static guarantee leaks and shape tests at the leak boundary become real-bug tests. Use Zod or io-ts at the boundary instead, then delete the shape tests.

## Delete

### Interface field presence

```ts
interface User {
  id: number;
  name: string;
}

it("user has id and name", () => {
  const u: User = { id: 1, name: "alice" };
  expect(u.id).toBe(1);
  expect(u.name).toBe("alice");
});
```

The compiler already proves `User` has `id: number` and `name: string`. The test is a tautology that verifies object literal assignment, not behavior.

### Constructor output assertion

```ts
class UserService {
  constructor(public repo: UserRepository, public logger: Logger) {}
}

it("constructor stores repo and logger", () => {
  const s = new UserService(mockRepo, mockLogger);
  expect(s.repo).toBe(mockRepo);
  expect(s.logger).toBe(mockLogger);
});
```

`public` parameter properties are a TS feature — the compiler proves the assignment. Delete.

### Identity passthrough / re-export

```ts
it("getUser returns the input id wrapped", () => {
  expect(wrapId(42)).toEqual({ id: 42 });
});
```

If `wrapId` does no validation or transformation worth testing, the test describes the type signature `(n: number) => { id: number }` — which the compiler already enforces.

### Mocked-everything test

```ts
it("service.getUser calls repo.findById", () => {
  const repo = { findById: vi.fn().mockResolvedValue({ id: 1 }) };
  const service = new UserService(repo);
  const result = await service.getUser(1);
  expect(repo.findById).toHaveBeenCalledWith(1);
  expect(result).toEqual({ id: 1 });
});
```

Asserting that the mock was called with what the test passed, returning the fixture the test set up. Zero real surface. Replace with a real-DB integration test or delete.

## Keep

### Runtime boundary validation (where TS strict leaks)

```ts
it("parseUserPayload rejects malformed JSON shape", () => {
  expect(() => parseUserPayload(JSON.parse('{"name": null}'))).toThrow();
});
```

`JSON.parse` returns `any` — the compiler cannot help here. The test verifies the runtime guard at the boundary. Keep.

### HTTP contract

```ts
it("POST /users returns 400 on missing email", async () => {
  const res = await request(app).post("/users").send({ name: "x" });
  expect(res.status).toBe(400);
});
```

Protocol contract — the type system does not check HTTP semantics. Keep.

### Discriminated-union exhaustiveness (when relying on runtime check)

```ts
it("handlePayment returns error for unknown method", () => {
  // @ts-expect-error — runtime check, not compile-time
  expect(handlePayment({ method: "crypto" })).toEqual({ ok: false });
});
```

If the union has a runtime fallback for forward-compat, the test verifies the fallback. Keep.

### Security invariant

```ts
it("admin endpoint requires auth", async () => {
  const res = await request(app).get("/admin");
  expect(res.status).toBe(401);
});
```

Always keep.
