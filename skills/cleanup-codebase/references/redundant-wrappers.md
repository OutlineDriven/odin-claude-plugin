# Redundant wrappers — inline, then delete

A redundant wrapper is a function whose body adds no semantic value over its underlying call. Common patterns:

- Renaming the call without changing arguments
- Single-line passthrough with no transformation, validation, or error mapping
- "Convenience" wrapper that just rearranges arguments cosmetically
- Adapter between two equivalent local interfaces (when both are yours)

The fix is always the same: inline the wrapper at all call sites, then delete the wrapper definition. If the wrapper has 1-2 callers, this is a small, mechanical change. If the wrapper has 50 callers, the wrapper might be earning its keep as a cohesion point — pause and consider before inlining.

## Detection pattern

```
fd -e <ext> | xargs ast-grep run -p '
fn $NAME($$$ARGS) -> $RET {
    $INNER($$$ARGS)
}
' -l <lang>
```

Adjust the metavariables — looking for functions whose body is a single call forwarding the same arguments.

## Examples by language

### Python — passthrough rename

```python
def get_user(id: int) -> User:
    return repo.get(id)
```

If `repo.get` already takes an `int` and returns a `User`, this wrapper renames `repo.get` to `get_user` and adds nothing. Inline `repo.get(id)` at every call site, delete `get_user`.

**Keep** if the wrapper does any of:
- Validation (`if id < 0: raise ...`)
- Error mapping (`except RepoError as e: raise UserNotFound(...) from e`)
- Logging / tracing
- Mock seam for tests where the test mocks `get_user`, not `repo`

### TypeScript — argument-rearrange wrapper

```ts
function fetchData(url: string): Promise<Response> {
    return api.get(url);
}
```

Identical to `api.get` modulo name. Inline calls to `api.get(url)`, delete `fetchData`.

**Keep** if `api` is the test seam — the wrapper exists so production code depends on `fetchData` (replaceable) instead of the global `api`. That is a real boundary; the wrapper earns its keep.

### Rust — passthrough function with same signature

```rust
pub fn validate(input: &Input) -> Result<(), ValidationError> {
    input.validate()
}
```

`Input::validate` is already a method with the same signature. The free function is ceremony. Inline `input.validate()` at call sites; delete the free function.

**Keep** if the free function exists for trait-object dispatch, `&dyn` ergonomics, or to avoid leaking the `Input` type into a public API — those are real boundaries.

### Kotlin — single-line forwarding

```kotlin
class UserService(private val repo: UserRepository) {
    fun findById(id: Long): User? = repo.findById(id)
}
```

If `UserService` adds no other behavior beyond forwarding to `repo`, the service is the wrapper — inline at consumer sites and delete `UserService`.

**Keep** if `UserService` is a DI boundary (Spring `@Service`, Dagger module), or if it has other methods that *do* add behavior — partial-wrapper-ness is fine if the rest of the class earns its keep.

### Go — passthrough method on struct

```go
type UserStore struct {
    db *sql.DB
}

func (s *UserStore) Get(ctx context.Context, id int64) (*User, error) {
    return queryUser(ctx, s.db, id)
}
```

If `queryUser` is exported and used directly elsewhere, `UserStore.Get` is wrapping for cosmetic reasons. Either commit to the wrapper (make `queryUser` package-private) or delete the wrapper and call `queryUser` directly.

## When to *keep* a wrapper

A wrapper earns its keep when it does any of:

- **Removes coupling** — callers depend on the wrapper's signature, not the underlying library; switching the library is a one-place change.
- **Adds validation, error mapping, instrumentation, or retry logic** — even a tiny `try { ... } catch (Foo) { throw Bar }` is real work the wrapper does.
- **Bridges a real boundary** — process, network, async/sync seam, FFI, untrusted input.
- **Provides a stable seam for testing** — the wrapper is the mock point for tests that need to stub the underlying call.
- **Names a non-obvious operation** — `findUserByEmail` over `db.query("SELECT ... WHERE email = ?", email)` adds semantic value; the name *is* the abstraction.

If the wrapper does none of these, it is dead weight. Inline and delete.
