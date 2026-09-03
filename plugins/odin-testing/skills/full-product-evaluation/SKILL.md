---
name: full-product-evaluation
description: 'Use when a complete product, rather than one component, needs production-like acceptance evidence against its documented acceptance criteria. Traverses the capability inventory, records per-capability evidence, and stops at declared success, non-success, or bound. Not for single-component evaluation or evaluation without documented criteria.'
---

# Full-product evaluation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A complete product needs production-like acceptance evidence against documented acceptance criteria. |
| Authority | Reversible local with production ask: approval required for production action. One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Full-product acceptance evaluation. |
| Done | Every in-scope capability meets its documented acceptance criteria. |
| Stop | Blocked handoff; budget exhausted; non-success. Bound: documented capability inventory and pass cap. |

## Inputs

- Capability inventory (required): the complete list of product capabilities to evaluate, each with its acceptance criteria. Named before the run starts.
- Documented acceptance criteria (required): per-capability pass conditions that are observable and testable, not aspirational.
- Production-like environment (required): the environment where the evaluation runs, matching production configuration closely enough that results transfer.

## Procedure

1. Bind the capability inventory and acceptance criteria. Freeze both before any evaluation. Confirm every capability has documented, observable acceptance criteria. If any capability lacks criteria, stop and request them. Done when: the inventory and criteria are frozen and every capability has testable criteria.
2. Collect start approval if production action is needed. One harness ask/question call using the A1 sealed_fields list. End the run on scope drift. Done when: approval is collected or confirmed absent.
3. Traverse the capabilities in the production-like environment. Evaluate each capability in dependency order: foundational capabilities first, then capabilities that depend on them. For each capability, exercise the user-facing path that triggers it and observe the result. Done when: every capability in the inventory has been traversed or a terminal class applies.
4. Record evidence per criterion. For each capability, capture the observed result against each acceptance criterion: the input used, the output observed, the pass or fail verdict, and the evidence artifact (screenshot, log, HTTP response, command output). Isolate failures: when a capability fails, determine whether the failure is in that capability or in a dependency. If a dependency failed, mark the dependent capability as `blocked-by-dependency` and name the blocking capability. Done when: every capability has a per-criterion evidence record with a pass, fail, or blocked-by-dependency verdict.
5. Stop at outcome.success (every capability meets its criteria), any outcome.non_success, or outcome.bound. Done when: a terminal class is reached and recorded.
6. Persist per profiles.persistence.P1 (durable_location `.outline/loops/full-product-evaluation/<run_id>/` when durable). Emit `receipt.json` before return. Done when: the receipt is written with every K11 field and the per-capability evidence record.

## Failure and recovery

- Blocked handoff: a dependency or precondition is missing. Emit a blocked receipt naming the missing item and the capabilities it blocks.
- Budget exhausted: emit an exhausted receipt; budget exhaustion is never success unless it is the predeclared success predicate.
- Non-success: one or more capabilities fail their criteria. Emit a non-success receipt naming the failed capabilities, their failed criteria, and the observed evidence. Do not present a failed capability as passing.
- Dependency failure isolation: when a capability fails because its dependency failed, mark it `blocked-by-dependency` rather than `failed`. Report the blocking capability and the chain.

## Output

An immutable K11 receipt with every K11 field, recording the terminal class (success, capped, stalled, blocked, exhausted, or pending) and the per-capability evidence record: capability name, criteria, observed result, verdict (pass, fail, blocked-by-dependency), and evidence artifact path.
