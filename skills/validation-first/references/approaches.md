# State Machine Approaches by Language

| Language | Mechanism | Invariant Enforcement |
|----------|-----------|----------------------|
| Rust | enum + match (exhaustive), typestate via PhantomData | Compile-time via types + exhaustive patterns |
| TypeScript | Discriminated unions, XState v5 | Guards + Zod validation at transitions |
| Python | enum + dataclass, transitions / python-statemachine | Dataclass validation + explicit checks |
| Kotlin | sealed class + when (exhaustive) | require()/check() at transitions |
| Go | iota constants + switch | Explicit validation functions |
| Java 21+ | sealed interfaces + switch (exhaustive) | Records + validation at construction |
| C++ | std::variant + std::visit | static_assert + concepts |
| C# | sealed classes + pattern matching | FluentValidation at transitions |
| Swift | enum + switch (exhaustive) | guard statements at transitions |
| Elixir | GenStateMachine / :gen_statem | Guards + pattern matching on state |
