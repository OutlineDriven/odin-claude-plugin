# Contract Libraries by Language

| Language | Library/Approach | Style |
|----------|-----------------|-------|
| Python | deal / beartype (O(1) runtime) | @deal.pre, @deal.post, validator annotations |
| Rust | assert! + debug_assert! + newtypes | type-driven contracts |
| TypeScript | Zod v4 + invariant / Effect-TS | z.refine(), invariant() |
| Kotlin | Native | require(), check(), contract {} |
| Java | Guava Preconditions / Bean Validation | checkArgument(), @Valid |
| C# | FluentValidation / Guard clauses | Guard.Against.*() |
| Go | Explicit checks + fmt.Errorf | convention-based |
| C++ | GSL Expects/Ensures | Expects(x > 0) |
| Swift | precondition() / guard | precondition(x > 0) |
| Scala | require() / ensuring() | require(x > 0) |

## Notes

- **C++26 contracts** (P2900R14, Feb 2025): Standardizing `[[pre]]`, `[[post]]`, `[[assert]]` with enforce/observe/quick-enforce/ignore semantics. GSL remains the bridge until compiler adoption.
- **Zod v4** (Aug 2025): 14x faster parsing, z.templateLiteral(), @zod/mini for lightweight validation. Primary choice for TypeScript boundary contracts.
- **beartype** (Python): O(1) runtime type checking via random sampling. Complements deal for performance-sensitive code.
- **Effect-TS**: Provides branded types + Schema validation as an alternative to Zod for TypeScript contract enforcement.
- **Kotlin**: `contract {}` provides compiler hints (smart casts after checks). `require()` = preconditions, `check()` = invariants.
