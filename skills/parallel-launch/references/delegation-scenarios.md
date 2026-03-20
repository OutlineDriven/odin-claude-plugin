# Delegation Scenarios

Reference for parallelism decisions in agent orchestration.

## When to Parallelize

- Independent concerns (no shared state, no ordering dependencies)
- Research across separate domains
- File-scoped work in different modules
- Multiple bugs with clearly different root causes

## When to Serialize

- Shared mutable state between tasks
- Results of task A inform task B
- Integration-sensitive changes (same file, same API surface)
- Multiple bugs that may share a root cause — investigate first

## Balancing Parallelism and Accuracy

- More agents does not equal better results — diminishing returns beyond true independence.
- Each parallel agent adds composition overhead (reconciling, deduplicating, resolving conflicts).
- Accuracy risks: conflicting assumptions, inconsistent conventions, merge conflicts.
- Mitigation: clear scoped objectives, defined output format, mandatory review gate.

## Delegation Decision Matrix

| Signal | Parallelize | Serialize |
|--------|-------------|-----------|
| Independent files/modules | Yes | -- |
| Shared state/files | -- | Yes |
| Research + implementation | Split: research parallel, impl serial | -- |
| Multiple bugs, different root causes | Yes | -- |
| Multiple bugs, possibly related | -- | Investigate first |
| >3 agents needed | Cap at 3-5, batch remainder | -- |
