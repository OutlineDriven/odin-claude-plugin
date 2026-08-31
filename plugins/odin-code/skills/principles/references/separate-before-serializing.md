# Separate before serializing — procedure

The classification, primitive choice, and merge-point design behind the anchor.

1. Inventory every shared mutable location (variable, struct field, object property, memory cell) that two or more actors (threads, coroutines, processes, tasks, agents) can write.
2. Classify each:
   - Per-actor: state private to one actor → migrate it into that actor's ownership. No actor writes another's per-actor state.
   - Shared: state genuinely required by multiple actors → synchronization.
3. For shared state, choose the narrowest primitive that covers the write path: mutex, lock-free structure, channel, or atomic. Low contention → lock-free or channel; complex critical-section logic → mutex.
4. Design every merge point where an actor reads or receives state from another. Name the merge operation explicitly; never let it occur implicitly inside a critical section. If the merge combines per-actor deltas (a reducer), define the merge function before introducing synchronization and verify it is associative and free of write-write conflicts. Done when: every cross-actor read passes through a named merge.
5. Revert all changes via VCS if any step cannot be completed safely.

## Failure classes

- Undecouplable state: two actors cannot separate without breaking the required merge semantics. Stop; return the coupling points and the required merge. Do not introduce a lock that papers over the coupling.
- Missing primitive: the environment lacks the selected synchronization. Stop; report the missing primitive and the state it would protect.
- Deadlock risk: the merge point occurs inside a held lock and creates a cyclic wait. Revert; return the cycle with actor names and the merge point.
- Partial separation: some shared state separates, some does not. Return the separable set with per-actor layout and merge points; flag the remainder unresolved.
