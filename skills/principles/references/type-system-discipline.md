# Type system discipline — procedure

The five modeling moves and the compiler loop behind the anchor.

1. Enumerate every domain value, state, and operation as a named entity with its valid companions and exclusions.
2. Mutually exclusive entities → **sum type** (tagged union, discriminated union, sealed trait): holding one variant excludes the others at the type level.
3. Structurally identical but semantically distinct entities → **branded type** (newtype, opaque alias, nominal wrapper): the compiler rejects cross-domain interchange.
4. Fixed known values → **literal union** or **enum**: the compiler rejects any value outside the set.
5. Data structures: product types (structs, records) for coexisting properties; sum types from step 2 for mutually exclusive properties. Signatures: each parameter type accepts exactly the values the function handles; return types encode outcomes as a sum.
6. Exhaustiveness: every consumer of a sum type handles all variants — pattern match without wildcard, compiler flag, or exhaustive switch, so unhandled variants fail to compile.
7. Invalid-state probe: construct a literal example of an invalid domain state and confirm the type system makes it unrepresentable. If the compiler accepts it, return to step 2 or 5 and tighten.
8. Compiler loop: rejects valid code → widen the affected type; accepts invalid code → narrow it; rerun in both directions. Done when: valid code compiles and every probed invalid state is unrepresentable.

## Residue and failure

- States that cannot be made static (cross-field constraints requiring runtime validation): document the remaining runtime guard explicitly in the code; the report names it. The type model is complete to the degree the language allows.
- Ambiguous domain semantics: stop; report the ambiguous entities and ask for clarification. Do not guess.
- Non-convergence after one tighten/loosen round: report which state cannot be made unrepresentable and why; leave existing types unchanged.
- Rollback: revert the changed type-definition file to its prior content or restore from VCS.
