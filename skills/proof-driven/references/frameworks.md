# Property-Based Testing Frameworks by Language

| Language | Framework | Stateful Testing |
|----------|-----------|------------------|
| Rust | proptest | proptest stateful |
| Python | hypothesis | RuleBasedStateMachine |
| TypeScript | fast-check | fast-check model |
| Go | rapid | rapid check |
| Java | jqwik | jqwik stateful |
| Kotlin | Kotest property | kotest forAll |
| C++ | rapidcheck | rc::state |
| C# | FsCheck | FsCheck model |
| Haskell | QuickCheck / Hedgehog | QuickCheck monadic / Hedgehog state |
| Elixir | StreamData | StreamData stateful |

## Notes

- **Python**: HypoFuzz (v25.11.1) provides adaptive coverage-guided fuzzing as a complement to Hypothesis. Runs existing Hypothesis tests with coverage feedback.
- **Rust**: Bolero combines PBT + fuzzing with libFuzzer/AFL backends. proptest integrates with cargo-fuzz for hybrid testing.
- **Haskell**: Hedgehog provides integrated shrinking (superior to QuickCheck's type-based approach). Prefer Hedgehog for new projects.
- **Java**: jqwik integrates with JUnit 5 platform. Stateful testing via `@Property` + `ActionSequence`.
- **TypeScript**: fast-check supports model-based testing and async properties. Shrinking is integrated.
