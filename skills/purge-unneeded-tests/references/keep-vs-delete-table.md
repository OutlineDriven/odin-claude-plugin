# Keep vs Delete — language-agnostic decision rubric

The discriminator is always: **what real bug, in the production code, would this test catch?** If you cannot name one, the test does not earn its keep.

## Decision table

**Critical scoping rule** — the compiler proves *types and layouts*, not *semantic mapping*. A constructor that takes `(id, name)` and assigns `self.id = id; self.name = name` is direct pass-through and the compiler covers it. A constructor that *validates*, *normalizes*, *defaults*, *transforms*, or *deserializes* runs real logic — the test of that logic is a real-bug test no matter how trivial the result type looks. Read every "Delete" row below as **conditional on the operation being direct, no-logic pass-through**.

| Test pattern | Static-typed lang (Rust/TS-strict/Kotlin/Java/C++/OCaml) | Dynamic lang (Python/JS/Ruby) |
|---|---|---|
| Constructor that *only* assigns parameters to fields, no logic | **Delete** — compiler proves the assignment shape; if no validation/transform/default, no behavior to test | **Keep** — boundary shape test, runtime can drift silently |
| Constructor that validates, normalizes, defaults, or transforms | **Keep** — testing the *logic*, not the shape | **Keep** |
| Identity passthrough (`f(x) == x` for `f` claimed identity, no transform) | **Delete** — function is dead code or test describes signature | **Delete** — same reason; test the transform if `f` transforms |
| Function returns the type its signature claims (no logic) | **Delete** — compiler enforces | **Keep at I/O boundaries**; otherwise consider `mypy`/`pyright` strict mode |
| Mock returns fixture, assert returns fixture | **Delete** — testing the mock | **Delete** — same |
| `#[derive(Default)]` / generated default behavior | **Delete** — derived code is compiler-tested | N/A |
| **Hand-written** custom `Default` / factory with non-obvious logic | **Keep** — testing the logic | **Keep** |
| Direct field-copy assembly (`Foo { id: src.id, name: src.name }`) with no logic | **Delete** — compiler proves layout | **Keep if dynamic field manipulation is plausible** |
| Assembly with logic — mapping, filtering, defaulting fields | **Keep** — testing the logic | **Keep** |
| Deserialization / parsing — `from_str`, `serde`, `Zod`, `pydantic` | **Keep** — runtime boundary, type system does not check input | **Keep** |
| Re-export forwarding (`pub use foo::bar`) | **Delete** — module system enforces | **Delete** — typically trivial |
| ─── boundary contracts ─── | | |
| Parser/deserializer rejects malformed input | **Keep** — runtime boundary | **Keep** |
| Error-variant semantics (which input produces which error) | **Keep** — semantic, not structural | **Keep** |
| HTTP status codes / response shape | **Keep** — protocol contract | **Keep** |
| Authz/authn enforcement (401/403 paths) | **Keep — security invariant** | **Keep — security invariant** |
| Input validation (length, format, range) | **Keep** — boundary | **Keep** |
| Rate limiting / throttling | **Keep** | **Keep** |
| Real DB transaction commit + rollback | **Keep** — real-I/O integration | **Keep** |
| File I/O — paths, permissions, atomic writes | **Keep** — real-I/O integration | **Keep** |
| Network call retries, timeouts, partial failures | **Keep** — error semantics | **Keep** |
| Concurrency — channel close, deadlock, race | **Keep** — type system does not prove semantics | **Keep** |
| `unsafe` block contract | **Keep — proudly** — exactly where compiler stops helping | N/A |
| Property-based test (random inputs validate invariant) | **Keep — high signal** | **Keep — high signal** |
| Mutation-testing-validated test (kills mutants) | **Keep — proven load-bearing** | **Keep — proven load-bearing** |

## Tiebreakers

When the table is ambiguous:

1. **Can you inject a bug that the test catches?** If yes, keep. If no, delete.
2. **Does the test fail when you change the production code in a wrong way?** If only when you change the test, delete.
3. **Is the test the only thing covering this behavior?** If yes, lean toward keep — but lean toward writing a *better* test that catches more.
4. **Is the test in a security-sensitive path?** Keep, even if redundant. Defense in depth has a real cost-benefit.

## Anti-patterns to recognize and delete

- **Tautology tests** — `assert isinstance(x, MyClass)` immediately after `x = MyClass()`
- **Implementation tests** — asserting which private methods got called, not what the public behavior produced
- **Coverage-driven tests** — written to hit a coverage line, not to catch a bug
- **Snapshot tests of trivial output** — approval tests of `str(obj)` or rendered HTML where any deliberate change requires updating the snapshot anyway
- **"Just in case" tests** — written without a named failure mode they would catch
