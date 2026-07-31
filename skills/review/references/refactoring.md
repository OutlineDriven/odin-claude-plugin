# Refactor candidates

After a TDD cycle, while green, scan for:

- **Duplication** → extract function or class
- **Long methods** → break into private helpers; keep tests on the public interface
- **Shallow modules** → combine or deepen (see [deep modules](../../improve-architecture/references/deep-modules.md))
- **Feature envy** → move logic to where the data lives
- **Primitive obsession** → introduce value objects
- **Existing code the new code reveals as problematic** → tidy it under the same green bar
