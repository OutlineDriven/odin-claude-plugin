# Property-based testing frameworks by language

**Grounded: 2026-08-26**

| Language | Framework | Stateful testing |
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
| Elixir | StreamData | — |

## Notes

- Python: HypoFuzz (v25.11.1) complements Hypothesis with adaptive, coverage-guided fuzzing. It runs existing Hypothesis tests with coverage feedback.
- Rust: Bolero combines property-based testing and fuzzing with libFuzzer/AFL backends. proptest integrates with cargo-fuzz for hybrid testing.
- Haskell: Hedgehog provides integrated shrinking, which is superior to QuickCheck's type-based approach. Prefer Hedgehog for new projects.
- Java: jqwik integrates with the JUnit platform and provides stateful testing via `@Property` + `ActionSequence`.
- TypeScript: fast-check supports model-based testing, async properties, and integrated shrinking.
