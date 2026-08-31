---
name: validation-first-driven
description: 'Defines state machines, invariants, and temporal properties. Use when building protocols, workflows, concurrent systems, or lifecycle-heavy state. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Validation-first development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work builds protocols, workflows, concurrent systems, or lifecycle-heavy state, or needs temporal properties or a state machine. |
| Authority | Reversible local: no file, VCS, credential, paid, published, deployed, or remote mutation outside the stated target. |
| Side effect | Writes the model and spec plus implementation assertions and tests; may create a TLA+/Alloy spec for high-risk designs. |
| Done | The state space is explicit, transitions are total, invariants are checked, and each temporal property maps to an assertion, test, or model-checker run. |

## Inputs

- Requirements or design document. Required.
- Current codebase. Optional.
- Support files: approaches, examples, formal-tools, event-sourcing reference notes. Optional; the skill is self-contained without them.

## Procedure

1. **Identify scope.** Confirm the work involves explicit states, transitions, temporal properties, or lifecycle-heavy state. If it is a stateless endpoint, pure data transformation, simple CRUD without lifecycle, configuration parse, or stateless batch process, stop and return the work unaltered.

2. **Capture states and transitions.** Extract all named states, state variables, actions, guards, and side effects from the requirements. Identify every temporal property: "always eventually", "never", "until", "leads-to".

3. **Choose mechanism level.**

   | Level | Mechanism | Strength | Use when |
   |-------|-----------|----------|----------|
   | Typestate | Generic type params, phantom data | Invalid transitions unrepresentable | Protocol APIs, builder patterns, Rust FFI |
   | Statecharts | Nested states, parallel regions | Complex workflows, entry/exit actions | Game state, multi-modal UI, XState |
   | Flat FSM | Enum + match/switch | Simple, auditable | Order lifecycle, connection management |
   | Actor model | Independent entities, message passing | Concurrent state | Distributed systems, Erlang/Elixir, XState v5 |

   Default: use the strongest mechanism the language supports. Typestate in Rust, sealed classes in Kotlin, discriminated unions in TypeScript.

4. **Write state machine specification.** Use this template:

   ```
   STATE MACHINE: <Name>
     STATES: S1 | S2 | S3
     VARIABLES: var1: type, var2: type
     INIT: var1 = val, state = S1
     ACTION name(args): PRE: guard -> POST: new_state, effects
     INVARIANT: condition_that_always_holds
   ```

5. **Define validation level.** Rank each invariant by enforcement strength:

   ```
   Type system (strongest) > State machine > Contract > Runtime check (weakest)
   ```

6. **Encode compile-time properties in types.** Use typestate, sealed classes, or discriminated unions to make invalid states unrepresentable. Encode every invariant the type system can express.

7. **Layer state machine modeling.** For properties types cannot express, define a state machine with explicit states and transitions. For high-risk designs, write a TLA+ or Alloy spec and run the model checker.

8. **Check every transition.** Verify invariants hold after each action. Confirm exhaustive matching on all states. Block on any invariant violation.

9. **Write assertions and tests.** Map each temporal property to an assertion, a test, or a model-checker run. Every transition must have a test. Every invariant must have a verification point.

10. **Implement.** Mirror the specification exactly: one state type, one transition function, one invariant check per concern. Keep state and behavior together.

## Failure and recovery
- **Wrong-scope work** — Return the work unaltered. Do not apply state machine modeling to stateless work.
- **Checker unavailable** — Return exit code 11 and a blocked verdict. Do not proceed without verification.
- **Specification syntax or type error** — Return exit code 12 and the first error location. Block implementation.
- **Invariant violation** — Return exit code 13 and the violating state or transition. Block implementation. Do not mask or suppress.
- **Test failure** — Return exit code 14 and the failing test. Block if tests are required.
- **Implementation not matching spec** — Return exit code 15 and the mismatched function or type. Block finalization.
- **Partial result** — Return the highest verification gate that passed with its exit code and evidence. Do not claim the done predicate holds if any blocking gate failed.
- **Non-converged** — If the state space is undecidable or the model checker does not terminate, stop and report the open temporal properties with no coverage.

## Output
- State machine specification document (pseudocode or formal notation).
- Verified implementation with assertions for every transition and invariant.
- Test suite covering all states and transitions.
- Optional: TLA+ or Alloy model for high-risk temporal properties.
- Exit code: 0 (all gates pass) or the blocking gate code.

## Provenance

Origin: current-odin-skill-tree. License: null. Adaptation: clean-room derivation from the current-odin-skill-tree body under `skills/validation-first-driven/SKILL.md` to the skill-foundry contract template. State machine taxonomy, validation levels, anti-patterns, constitutional rules, and validation gates carried from the source body. Support file references inlined as summary anchors. No third-party expression copied.
