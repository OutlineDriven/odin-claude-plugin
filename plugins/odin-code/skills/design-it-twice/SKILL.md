---
name: design-it-twice
description: 'Use when asked to design a module interface, seam, or testable boundary. Not for UI direction picking: use design. No source or remote-system changes.'
---

# Design it twice

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Design a module interface, seam, or testable boundary. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Design guidance only. |
| Side effect | None. No artifacts are written; output is a design comparison and recommendation in chat. |
| Done | The design uses explicit deep-module vocabulary and deliberately placed seams. |

## Inputs

- A module, cluster, or boundary to design, named by the user or identified from context. Required.
- The codebase's primary language and any second language family the project owns. Optional, but needed for cross-language interface sketches.
- Existing callers and dependencies of the target. Optional; improves constraint framing.

## Procedure

Use these terms exactly. Do not substitute "component," "service," "API," or "boundary."

- Module: anything with an interface and an implementation: a function, class, package, crate, or tier-spanning slice.
- Interface: everything a caller must know to use the module correctly: type signature, invariants, ordering constraints, error modes, required configuration, and performance characteristics.
- Implementation: the body of code inside a module.
- Depth: power at the interface: the amount of behaviour a caller can exercise per unit of interface they must learn. Deep = much behaviour behind a small interface; shallow = interface nearly as complex as implementation.
- Seam: a place where behaviour can be altered without editing in that place. The location at which a module's interface lives; choosing where to put the seam is a design decision separate from the implementation.
- Adapter: a concrete thing that satisfies an interface at a seam; describes role, not substance.
- Leverage: what callers get from depth: more capability per unit of interface learned.
- Locality: what maintainers get from depth: change, bugs, and verification concentrate in one place rather than spreading across callers.

Before designing, classify the target's dependencies. The category determines how the deepened module is tested across its seam.

1. **In-process**: pure computation, in-memory state, no I/O. Always deepenable; merge the modules and test through the new interface directly. No adapter needed.
2. **Local-substitutable**: dependencies with local test stand-ins (PGLite, in-memory filesystem, Testcontainers). Deepenable when the stand-in exists; the seam stays internal.
3. **Remote but owned**: owned services across a network boundary. Define a port at the seam; inject the transport as an adapter. In-memory adapter in tests, HTTP/gRPC/queue adapter in production.
4. **True external**: third-party services the team does not control. Take the dependency as an injected port; tests provide a mock adapter.

Seam discipline: one adapter means a hypothetical seam; two adapters mean a real one. Do not introduce a port unless at least two adapters are justified.

1. **Frame the problem space.** Write a user-facing explanation of the chosen target: the constraints any new interface must satisfy, the dependencies it relies on and which category each falls into, and a rough illustrative code sketch that makes the constraints concrete, not a proposal. Use the codebase's primary language; for polyglot projects, sketch in each owned language family. Show this to the user. **Done when:** the framing states constraints, per-dependency categories, and a concrete sketch shown to the user.

2. **Spawn three or more parallel alternative designs.** Each must produce a radically different interface for the module. Give each a separate technical brief: file paths, coupling details, dependency category, and what sits behind the seam. Give each a distinct design constraint:
   - Minimize the interface: one to three entry points maximum, maximise leverage per entry point.
   - Maximise flexibility: support many use cases and extension.
   - Optimise for the most common caller: make the default case trivial.
   - Design around ports and adapters for cross-seam dependencies, when applicable.

   Each design outputs: (a) the interface, types, methods, params, invariants, ordering, error modes, expressed in the codebase's language; (b) a usage example showing how callers use it; (c) what the implementation hides behind the seam; (d) dependency strategy and adapters; (e) trade-offs, where leverage is high, where it is thin. **Done when:** three or more designs are produced, each radically different and carrying all five output fields.

3. **Present and compare.** Present the designs sequentially so the user can absorb each one, then compare them in prose. Contrast by depth (power at the interface), locality (where change concentrates), and seam placement. **Done when:** designs are presented sequentially and compared by depth, locality, and seam placement.

4. **Recommend.** Give an opinionated recommendation that names the strongest design and explains why. If elements from different designs would combine well, propose a hybrid. Be decisive: deliver a strong read, not a menu. **Done when:** one recommendation names the strongest design or a hybrid with its reason.

## Failure and recovery
- **Ambiguous target.** If the user does not name a module or boundary to design, stop and ask which target to design. Do not invent a target.
- **Unclassifiable dependencies.** If a dependency category cannot be determined from available context, state which category is unknown and design conservatively: treat an unknown external dependency as true-external with an injected port.
- **Convergent designs.** If the parallel designs are not radically different, re-dispatch with sharper, more divergent constraints. A menu of near-identical designs fails the done predicate.
- **Non-mutation.** This skill writes nothing. If any step would require editing a file, stop; the output is design guidance only.

## Output
A design comparison in chat: problem-space framing, three or more radically different interface designs, a prose comparison by depth, locality, and seam placement, and one opinionated recommendation: ordered frame → diverge → compare → recommend, with no files written.
