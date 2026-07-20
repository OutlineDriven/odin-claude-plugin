# Redundant wrappers — inline, then delete

A redundant wrapper is a function whose body adds no semantic value over its underlying call. Common patterns:

- Renaming the call without changing arguments
- Single-line passthrough with no transformation, validation, or error mapping
- "Convenience" wrapper that just rearranges arguments cosmetically
- Adapter between two equivalent local interfaces (when both are yours)

The fix is always the same: inline the wrapper at all call sites, then delete the wrapper definition. If the wrapper has 1-2 callers, this is a small, mechanical change. If the wrapper has 50 callers, the wrapper might be earning its keep as a cohesion point — pause and consider before inlining.

## Detection pattern

The shape to search for: a function or method whose entire body is one call, forwarding the arguments it received, with no added logic. `ast-grep` pattern syntax is not portable across languages — a pattern written for one language's grammar will not parse, let alone match, in another. Each pattern below omits the visibility modifier, so it catches exported and private wrappers alike; prepend `pub` / `export` / `public` to narrow the sweep to exported ones.

| Language | `ast-grep` seed pattern | Also run |
|---|---|---|
| Python | `def $NAME($$$PARAMS) $$$RT: return $INNER($$$ARGS)` | — |
| TypeScript | `function $NAME($$$PARAMS) $$$RT { return $INNER($$$ARGS); }` | — |
| Rust | `fn $NAME($$$PARAMS) $$$RT { $INNER($$$ARGS) }` | — |
| Kotlin | `fun $NAME($$$PARAMS) $$$RT = $INNER($$$ARGS)` | block body: `fun $NAME($$$PARAMS): $RET { return $INNER($$$ARGS) }`, and again without `: $RET` |
| Go | `func ($$$RECV) $NAME($$$PARAMS) $$$RET { return $INNER($$$ARGS) }` | plain function: drop `($$$RECV)` · void: drop `return` |
| Java | `$RET $NAME($$$PARAMS) { return $RECV.$INNER($$$ARGS); }` | bare call: `return $INNER($$$ARGS);` · void: drop `return` |

These are seeds, not exhaustive detectors. Three things bound what a single run proves:

- **`$$$RT` in the return-type position absorbs the annotation.** In Python, TypeScript, Rust, and Kotlin expression bodies, one run matches the annotated and unannotated forms — `def f(id):` and `def f(id) -> User:`, `fn f(x) {` and `fn f(x) -> T {`. Hardcoding `-> $RET` silently skips every wrapper that omits the return type, including the usual Rust unit form written without `-> ()`. The shortcut does not extend to a Kotlin *block* body, where the annotated and unannotated forms need separate runs.
- **Go and Java need the extra runs, on different axes.** Go splits on the *declaration*: a method carries a receiver (`func (s *Store) Get(...)`), a different grammar node from a plain function, so neither form finds the other's shape. Java splits on the *call*: `return repo.findById(id)` is a qualified invocation that a bare `$INNER($$$ARGS)` will not match. In both, a void wrapper forwards without `return` and needs its own run. The Python, TypeScript, Rust, and Kotlin seeds match bare and receiver-forwarded bodies alike as written.
- **Proof that the arguments are unchanged** — a typed parameter list (`id: int`) and its untyped call site (`id`) are different text, so one reused metavariable can't assert identity the way it can within a single side. Treat a structural match (single-call body) as a candidate, and confirm by eye that the call forwards what it received.

## Per-language instances

| Language | Wrapper shape | Keep when |
|---|---|---|
| Python | `def get_user(id): return repo.get(id)` | Validates, maps errors, logs/traces, or `repo` is what tests would otherwise have to mock directly |
| TypeScript | `function fetchData(url) { return api.get(url); }` | `api` is the test seam; production code depends on the swappable `fetchData` name instead of the global `api` |
| Rust | `fn validate(x: &Input) -> Result<(), E> { x.validate() }` | Exists for trait-object dispatch, `&dyn` ergonomics, or to keep `Input` out of a public API |
| Go | `func (s *Store) Get(id int64) (*User, error) { return queryUser(s.db, id) }` | `queryUser` is unexported; `Store.Get` is the only sanctioned entry point |
| Java | `class UserService { User findById(long id) { return repo.findById(id); } }` | `UserService` is a DI boundary (`@Service`, a Dagger module), or its other methods add real behavior |
| Kotlin | `class UserService(val repo: Repo) { fun findById(id: Long) = repo.findById(id) }` | Same as Java — DI boundary, or the rest of the class earns its keep |

## When to keep a wrapper

A wrapper earns its keep when it does any of:

- **Removes coupling** — callers depend on the wrapper's signature, not the underlying library; switching the library is a one-place change.
- **Adds validation, error mapping, instrumentation, or retry logic** — even a small error-remapping step is real work the wrapper does: `except RepoError as e: raise UserNotFound(...) from e` (Python), `if err != nil { return nil, fmt.Errorf("...: %w", err) }` (Go), `.map_err(UserError::from)` (Rust), `try { ... } catch (RepoError e) { throw new UserNotFound(e); }` (C-family).
- **Bridges a real boundary** — process, network, async/sync seam, FFI, untrusted input.
- **Provides a stable seam for testing** — the wrapper is the mock point for tests that need to stub the underlying call.
- **Names a non-obvious operation** — `findUserByEmail` over `db.query("SELECT ... WHERE email = ?", email)` adds semantic value; `isRateLimited` over a bare `redis.incr(key) > threshold` does the same. The name *is* the abstraction.

If the wrapper does none of these, it is dead weight. Inline and delete.
