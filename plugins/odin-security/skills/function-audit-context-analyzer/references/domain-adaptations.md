# Domain adaptations

Branch-specific orientation for step 7 of the SKILL.md procedure. The shared
spine (read the function, walk callees, cite lines, write the fixed format)
stays in SKILL.md; this file carries what changes per target domain.

## Smart contracts

The entry point is an external or public function. Actors are caller, owner,
relayer, oracle, and other protocols. Persistent state is storage slots. A
black box is an address whose code is not in the project. Record calldata
sent and outcomes not excluded (revert, hostile return value, re-entry before
state writes land). Watch for `unchecked` blocks and assembly that suspend
guarantees.

## C or C++ source

Bounds, lifetimes, and integer width carry the invariants. Record pointer
ownership and lifetime. Note which calls are behind `#ifdef`.

## Decompiled binaries or firmware

Function boundaries are themselves a finding. Say which entry points were
identified, how, and what was left unattributed. Go top-down from task entry
points. Most callees are black boxes and that is normal.

## Web services

Logic and authorization carry more weight than memory safety. The trust
boundary is usually a middleware chain, so record where the check actually
lives and whether every registered route gets it. Concurrency over the same
row without a transaction is coupling that belongs in shared state.
