# Dead fields, props, and members

A dead field is one that is *written* but never *read*, or *read* but only to forward to another field that is itself never used. Dead fields mislead readers, bloat memory layout, and survive every grep someone does looking for "where is this used."

## Detection pattern

For any field `Foo.x`:

1. `git --no-pager grep -nF '.x'` (or appropriate selector for the language) — look for read sites
2. `ast-grep run -p 'self.x' -l <lang>` — find self-references inside the type
3. If the only references are *writes* (assignments, constructors), the field is dead
4. Special-case: serialization libraries may *read* via reflection — check for `#[derive(Serialize)]`, `@JsonProperty`, etc., before deleting

## Examples by language

### Python — dataclass field never read

```python
@dataclass
class UserSession:
    user_id: int
    created_at: datetime
    last_seen: datetime
    legacy_session_token: str  # set in __post_init__, never read

    def __post_init__(self):
        self.legacy_session_token = generate_token()  # only write
```

`legacy_session_token` is written and then ignored. Delete the field, the assignment, and the `generate_token()` call if it is otherwise unused.

### TypeScript — interface prop with no consumer

```ts
interface UserContext {
  user: User;
  permissions: Permission[];
  legacyTenantId?: string;  // optional, set by old middleware, never read by new code
}
```

The optional prop signals migration debt. Grep `legacyTenantId` — if no read sites remain, delete the prop and the middleware that sets it.

### Rust — struct field only set by `Default::default()`

```rust
#[derive(Default)]
struct Config {
    timeout_ms: u64,
    max_retries: u32,
    legacy_compat_mode: bool,  // never read; introduced for a flag that's gone
}
```

If `legacy_compat_mode` is never read, delete the field. `#[derive(Default)]` regenerates without it; existing `Config::default()` calls keep working.

### Kotlin — data class component with no read site

```kotlin
data class OrderEvent(
    val orderId: String,
    val timestamp: Instant,
    val correlationId: String,
    val deprecatedTraceId: String? = null,  // never read in new code paths
)
```

`deprecatedTraceId` lingered after a tracing library swap. Delete the parameter and the call sites that supplied it.

### Java — class field with private setter, no getter, no internal read

```java
public class UserPreferences {
    private boolean useLegacyTheme;  // written by deserialization, never read

    public void setUseLegacyTheme(boolean v) { this.useLegacyTheme = v; }
}
```

Setter exists, no getter, no internal use. Often a leftover from a Jackson-deserialized config. Delete field + setter; if Jackson complains about unknown property, ignore via `@JsonIgnoreProperties(ignoreUnknown = true)` or remove the corresponding JSON key.

## Caveats

- **Reflection / serialization** — fields read by `serde`, `Jackson`, `Gson`, `pydantic`, `attrs`, etc. via attributes/decorators may have no direct read site in code. Check derive/decorator/annotation lists before deleting.
- **DI frameworks** — Spring, Dagger, Hilt may read fields via `@Autowired`/`@Inject`. Look for framework-level wiring.
- **Tests** — a field read only by tests may indicate the field exists *for* the tests; `purge-unneeded-tests` handles that direction.
- **External consumers** — if the type crosses a process boundary (DTO, event payload), removing a field is a `refactor-break-bw-compat` concern, not a cleanup-codebase concern.
