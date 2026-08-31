# Delegation scenarios

Reference for parallelism decisions in agent orchestration.

## When to parallelize

- Independent concerns (no shared state, no ordering dependencies)
- Research across separate domains
- File-scoped work in different modules
- Multiple bugs with clearly different root causes

## When to serialize

- Shared mutable state between tasks
- Results of task A inform task B
- Integration-sensitive changes (same file, same API surface)
- Multiple bugs that may share a root cause: investigate first

## Balancing parallelism and accuracy

- More agents do not guarantee better results; returns diminish beyond true independence.
- Each parallel agent adds composition overhead: reconciling, deduplicating, and resolving conflicts.
- Accuracy risks: conflicting assumptions, inconsistent conventions, and merge conflicts.
- Mitigation: clear scoped objectives, defined output format, and a mandatory review gate.

## Delegation decision matrix

| Signal | Parallelize | Serialize |
|--------|-------------|-----------|
| Independent files/modules | Yes | -- |
| Shared state/files | -- | Yes |
| Research + implementation | Split: research parallel, impl serial | -- |
| Multiple bugs, different root causes | Yes | -- |
| Multiple bugs, possibly related | -- | Investigate first |
| >3 agents needed | Cap at 3-5, batch remainder | -- |
