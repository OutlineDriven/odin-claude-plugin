# Dead fields, props, and members

A dead field is one that is *written* but never *read*, or *read* but only to forward to another field that is itself never used. Dead fields mislead readers, bloat memory layout, and survive every grep someone does looking for "where is this used."

## Detection pattern

For any field `Foo.x`:

1. `git --no-pager grep -nF '.x'` (or the appropriate selector for the language) — look for read sites.
2. `ast-grep run -p '<self-ref>.x' -l <lang>` — find self-references inside the type. The self-reference token is not universal; parameterize per language:

   | Language | Self-reference form |
   |---|---|
   | Python, Rust | `self.x` |
   | TypeScript, Java, Kotlin | `this.x` |
   | Go | named receiver (e.g. `s.x`) — the name is chosen per type, so grep the field name across the package instead of relying on one fixed pattern |

3. If the only references are *writes* (assignments, constructors), the field is dead.
4. Standing limit: frameworks that read fields reflectively (see Caveats) are invisible to both checks above — check the framework's marker before deleting.

## Per-language instances

| Language | Dead-field shape | Fix |
|---|---|---|
| Python | `@dataclass` field set only in `__post_init__` (e.g. a generated token), never read elsewhere | Delete the field, its assignment, and the generator call if otherwise unused |
| TypeScript | Optional interface prop set by legacy middleware, no read site (`legacyTenantId?: string`) | Delete the prop and the middleware that set it |
| Rust | Struct field only ever produced by `Default::default()`, no method reads it | Delete the field; `#[derive(Default)]` regenerates without it |
| Go | Struct field set at construction, no method on the receiver reads it | Delete the field and the construction-site assignment |
| Java | Field with a generated setter, no getter, no internal read — common after a deserialized-config change | Delete field + setter; add `@JsonIgnoreProperties(ignoreUnknown = true)` or drop the JSON key if deserialization complains |
| Kotlin | `data class` component never read outside the constructor, left behind by a library swap | Delete the parameter and every call site that supplied it |

## Caveats

- **Frameworks that read fields reflectively** — `serde`, Jackson, Gson, pydantic, attrs, Spring, Dagger, and Hilt (among others) read fields via derive macros, decorators, annotations, or DI wiring (`#[derive(Serialize)]`, `@JsonProperty`, `@Autowired`, `@Inject`) with no direct read site anywhere in source. This is a standing limit, not a checklist to exhaust: reflective, DI, and serialization reads are not resolvable by static analysis. Treat a field under such a marker as unprovable-dead by grep alone — require an explicit allowlist or scope exclusion before deleting it.
- **Tests** — a field read only by tests may indicate the field exists *for* the tests; `tests-purge-unneeded` handles that direction.
- **External consumers** — if the type crosses a process boundary (DTO, event payload), removing a field is a `refactor-break-compat` concern, not a cleanup-codebase concern.
