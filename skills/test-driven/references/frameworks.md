# Test Frameworks by Language

| Language | Unit | Property | Coverage | Mutation |
|----------|------|----------|----------|----------|
| Rust | `cargo test` | proptest | cargo-tarpaulin | cargo-mutants |
| Python | pytest | hypothesis | pytest-cov | mutmut |
| TypeScript | vitest | fast-check | v8/istanbul | stryker |
| Go | `go test` | rapid | `go test -cover` | go-mutesting |
| Java | JUnit 5 | jqwik | jacoco | PIT |
| Kotlin | Kotest | kotest-prop | kover | PIT |
| C++ | GoogleTest | rapidcheck | gcov/llvm-cov | mull |
| C# | xUnit | FsCheck | coverlet | stryker-net |
| Swift | Swift Testing | swift-property-based | llvm-cov | - |
| Elixir | ExUnit | StreamData | mix test --cover | - |

## Notes

- **Python**: HypoFuzz (v25.11.1) provides adaptive fuzzing as a complement to Hypothesis -- coverage-guided property testing.
- **Rust**: proptest supports stateful testing. Bolero combines PBT + fuzzing with libFuzzer/AFL backends.
- **TypeScript**: vitest includes built-in coverage via v8. fast-check supports model-based testing.
- **Java/Kotlin**: PIT (pitest) is the standard mutation testing tool for JVM. jqwik integrates with JUnit 5.
- **C++**: mull requires LLVM. rapidcheck integrates with GoogleTest and Catch2.
- **Go**: go-mutesting is community-maintained. rapid is the primary PBT library.
