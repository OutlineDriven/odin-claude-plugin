# Type Patterns by Language

| Language | Refined Types | State Machines |
|----------|--------------|----------------|
| Rust | newtypes, PhantomData | typestate pattern (generic params) |
| TypeScript | branded types, template literals | discriminated unions |
| Python | NewType, Annotated, Literal | enum + dataclass |
| Kotlin | @JvmInline value class | sealed class/interface |
| Go | named types, generics | interface + struct |
| Java 21+ | records, sealed classes | sealed + pattern match |
| C++ | strong typedef, concepts | variant + visit |
| C# | records, nullable refs | sealed + pattern |
| Swift | struct + protocol | enum + associated values |
| Scala 3 | opaque types | match types, ADTs |

## Language-Specific Validation Gates

| Language | Check Command | Hole Markers | Escape Hatches to Audit |
|----------|--------------|--------------|------------------------|
| Rust | `cargo check` | `todo!()`, `unimplemented!()` | `unsafe`, `as` casts |
| TypeScript | `npx tsc --noEmit --strict` | `any`, `unknown` casts, `// @ts-ignore` | `as any`, `as unknown` |
| Python | `pyright --strict` | `...` (ellipsis body), `pass`, `# type: ignore` | `cast()`, `Any` |
| Kotlin | `./gradlew compileKotlin` | `TODO()`, `NotImplementedError` | `!!`, unscoped `lateinit` |
| Go | `go build ./...` | `panic("not implemented")` | type assertions without ok check |
| Java 21+ | `./gradlew compileJava` | `throw new UnsupportedOperationException()` | raw types, unchecked casts |
| C++ | `cmake --build .` | `static_assert(false)`, `throw` stubs | `reinterpret_cast`, C-style casts |
| C# | `dotnet build` | `throw new NotImplementedException()` | `null!`, suppression `!` |
| Swift | `swift build` | `fatalError("not implemented")` | `as!` force casts |
| Scala 3 | `sbt compile` | `???` | `asInstanceOf` |

All commands use `$CHECK_CMD` variable -- override with project-specific build command when detected.

## Notes

- **Rust**: PhantomData enables zero-cost typestate. Newtypes with private fields enforce validation at construction.
- **TypeScript**: Branded types (`string & { readonly [Brand]: typeof Brand }`) provide nominal-like safety in a structural system. Zod v4 bridges runtime validation to static types.
- **Python**: `NewType` is lightweight but encapsulation-dependent. `Annotated[int, Gt(0)]` with beartype provides runtime-checked refinements.
- **Kotlin**: `@JvmInline value class` wraps primitives at zero allocation cost. Sealed hierarchies enforce exhaustive matching.
- **Scala 3**: Opaque types are true zero-cost abstractions (unlike newtype wrappers in Scala 2).
