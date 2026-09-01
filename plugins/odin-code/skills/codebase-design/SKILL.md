---
name: codebase-design
description: 'Use when designing or improving a module interface, locating a seam, or increasing testability; the chosen module ends up with a small interface that hides complexity and is testable through seams. Not for system-level architecture decisions — use architect.'
---

# Codebase design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Designing or improving a module interface, locating a seam, increasing testability, or needing shared deep-module vocabulary. |
| Authority | Reversible-local: recommendations go to chat; local restructuring edits only the named module's files, rolled back by reverting the uncommitted edits (version-control checkout or manual revert). No remote, credential, paid, published, or deployed mutation. |
| Side effect | Chat design recommendations plus optional local edits confined to the named module; no remote mutation. |
| Done | The chosen module presents a small coherent interface, hides implementation complexity, concentrates change locally, and is testable through explicit seams. |

## Inputs

- Required: one named target module (a function, class, package, crate, or tier-spanning slice) with readable source and enough of its callers and tests to judge what they must know.
- Optional: intended adapters, candidate seam locations, and the target language, which is inferred from the source when not stated.

## Procedure

1. **Bound the scope.** Name exactly one target module and confirm its source is readable; a name matching nothing is an unbounded-target stop, not a guess. Read the interface surface, the implementation, and the callers and tests crossing them. If depth cannot be judged inside this scope, stop and name the missing evidence. Done when: one module is named, its source is read, and its callers and tests are surveyed.
2. **Fix the vocabulary.** Use these terms exactly; do not substitute near-synonyms.
   - Module: anything with an interface and an implementation, scale-agnostic from a single function to a tier-spanning slice. _Avoid_: "unit," "component," "service."
   - Interface: everything a caller must know: type signature, invariants, ordering constraints, error modes, required configuration, performance characteristics. _Avoid_: "API," "signature"; they name only the type-level surface.
   - Implementation: the body inside the module. A small adapter can hold a large implementation (a Postgres or JPA repository) and a large adapter a small one (an in-memory fake); say "adapter" when the seam is the topic, "implementation" otherwise.
   - Seam (Michael Feathers): a place where behaviour can be altered without editing in that place; it is where the module's interface lives. _Avoid_: "boundary"; it is overloaded with DDD's bounded context.
   - Adapter: a concrete thing that satisfies an interface at a seam; it names the role, not the substance.
   - Depth: the behaviour a caller or test can exercise per unit of interface it must learn. Deep means large behaviour behind a small interface; shallow means the interface is nearly as complex as the implementation.
   - Leverage: what callers get from depth: capability per unit of interface learned, one implementation paying back across N call sites and M tests.
   - Locality: what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place; fix once, fixed everywhere.
   Done when: the vocabulary is fixed and no near-synonym substitution remains.
3. **Classify depth by leverage, not line ratio.** Depth is a property of the interface, not the implementation: internal parts, including internal seams used only by the module's own tests, are not interface, and a module has exactly one interface. A single method that handles a hard problem well is deeper than ten methods that each forward to another layer. Done when: a deep/shallow classification is stated with leverage evidence.
4. **Run the deletion test.** Imagine deleting the module: if the complexity vanishes, it was a pass-through hiding nothing; if the complexity reappears across N callers, it is earning its keep. Done when: the deletion test produces a pass-through or earning-its-keep verdict.
5. **Narrow the interface.** Ask in order: can methods be reduced? can parameters be simplified? can more complexity be hidden inside? Prefer the form that gives callers leverage and maintainers locality. Done when: the interface is at its narrowest form that preserves caller-visible behavior.
6. **Place seams by variation.** The external seam carries the interface; internal seams stay private to the implementation and its tests. Introduce a seam only when something actually varies across it: one adapter means a hypothetical seam, two adapters mean a real one. Done when: every seam is placed where variation actually crosses it.
7. **Check the test surface.** Callers and tests cross the same seam; a test that must reach past the interface means the module is the wrong shape. Restructure by accepting dependencies instead of constructing them (`process_order(order, gateway)` with an injected gateway is testable; an internal `StripeGateway()` construction is not), returning results instead of mutating (`calculate_discount(cart) -> Discount` is testable; mutating `cart.total` in place is not), and keeping the surface small: fewer methods mean fewer tests, fewer parameters mean simpler setup. Done when: callers and tests cross the same seam without reaching past the interface.
8. **Anchor terms in the target language.** See `references/language-anchors.md` for the per-language module, interface, seam, and adapter mappings (Rust, Go, OCaml, Java/Kotlin). Done when: the vocabulary is anchored in the target language's constructs.
9. **Reject these framings wherever they appear.** Depth measured as a ratio of implementation lines to interface lines rewards padding the implementation: use depth-as-leverage. "Interface" narrowed to the language keyword or a class's public methods is too narrow: the interface is every fact a caller must know. Done when: both rejected framings are checked and neither is present in the analysis.
10. **Deliver, then edit.** Emit the recommendation in the fixed vocabulary; when restructuring is in scope, apply local edits confined to the bounded module while every caller and test keeps crossing the same seam. Done when: the recommendation is delivered and any local edits are applied within the bounded module.

## Failure and recovery
- Unbounded target. The module cannot be isolated, its source is unreadable, or judging depth needs callers outside the scope: stop before any edit, report which evidence is missing, and ask for a narrower target. Do not widen scope or invent structure.
- Pass-through verdict. The deletion test shows the module hides nothing: report it as shallow and name the callers that would absorb its complexity. This is a valid finding, not a silent rewrite.
- Breaking or failed edit. An edit does not apply or breaks a caller or test: revert the uncommitted edits to the touched files (version-control checkout or manual revert) so no partial restructuring remains; recommendations already delivered stand.
- Non-converged interface. The interface cannot be narrowed without changing caller-visible behaviour beyond the bounded scope: report the blocked state and the specific conflict. Never claim done while the done predicate fails to hold and never swallow the error.

## Output
Design recommendation in the fixed vocabulary: interface and implementation → external and internal seams → deep/shallow verdict with deletion-test result → interface-narrowing steps → seam placement → testability restructure → applied local edits with rollback point.
