---
name: property-test-failure-triage
description: 'Use when a generated or shrunk counterexample from a property-based test fails; classify whether the defect is in the implementation, the property statement, or the specification, and state the minimal repair action. Don''t use for tasks that require source or remote-system changes.'
---

# Property test failure triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A generated or shrunk counterexample exists and the user asks whether it reveals a code bug, an over-broad strategy, an incorrect property, or an unsettled specification. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output: investigate the failing input and contract, classify it, and recommend the minimal code, strategy, property, or specification action. |
| Done | The counterexample is classified with cited evidence and a concrete next action; ambiguity is surfaced for maintainer decision rather than mislabeled as a defect. |

## Inputs

- **Required**: the failing counterexample value (original or shrunk). If the user supplies a shrunk counterexample, also supply the original generated value when available.
- **Required**: the property-based test that produced the failure, accessible for reading.
- **Required**: the implementation code the property tests.
- **Optional**: the test framework and shrinker name.
- **Optional**: the specification or requirements document, when one exists.

## Procedure

1. Confirm the failing counterexample is non-empty and represents a concrete execution trace. If the counterexample is absent or is only a framework-generated failure with no concrete input, return `failure-input-missing`.
2. Identify the property-based test framework and shrinker in use from the test file or build configuration. If the test file cannot be read, return `test-file-unreadable`.
3. Read the complete property function and its surrounding test scaffold. Extract:
   - the property statement (the predicate that evaluated to false);
   - the generators or data sources used to produce the counterexample;
   - any custom shrink configuration.
   If the property cannot be extracted, return `property-unreadable`.
4. Read the implementation code under test. Build a minimal reproduction of the failure by substituting the counterexample into the code path the property exercises. If the implementation cannot be read, return `implementation-unreadable`.
5. Classify the failure using the following mutually exclusive categories, in precedence order:
   a. **Code Bug** — the implementation produces an incorrect result or side effect for the counterexample, and the property statement correctly describes the intended behavior. The minimal repair is a code change to the implementation.
   b. **Over-broad Property** — the property predicate rejects a value that the implementation is permitted to produce under the current specification. The minimal repair is to narrow the property to the set of values the implementation actually guarantees.
   c. **Incorrect Property** — the property predicate describes behavior the implementation does not claim to guarantee, or the predicate is logically wrong independent of the implementation. The minimal repair is to correct or remove the property.
   d. **Unsettled Specification** — neither the implementation nor the property can be declared wrong because the requirement itself is ambiguous, absent, or contested. The minimal repair is to resolve the specification with the maintainer before touching code or property.
6. For each category, surface the specific evidence:
   - For Code Bug: quote the exact implementation behavior for the counterexample, quote the property predicate, and state which implementation branch or operation produces the incorrect result.
   - For Over-broad Property: quote the relevant specification clause or implementation comment that permits the counterexample outcome.
   - For Incorrect Property: quote the property predicate and demonstrate the logical inconsistency with the implementation's documented contract.
   - For Unsettled Specification: name the absent or ambiguous requirement and state what must be decided before any code or property change is valid.
7. State the minimal repair action in one concrete imperative sentence. Do not add extra refactorings, style changes, or tests beyond the minimum required to make the property pass or correctly fail.
8. If evidence supports more than one category, report the ambiguity explicitly with the competing classifications and let the maintainer decide. Do not pick one classification to force a resolution.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `failure-input-missing` | No concrete counterexample value supplied | Report the missing input; stop. |
| `test-file-unreadable` | The property-based test file cannot be read | Report the unreadable path; stop. |
| `property-unreadable` | The property function body cannot be extracted | Report the unreadable path; stop. |
| `implementation-unreadable` | The implementation under test cannot be read | Report the unreadable path; stop. |
| `ambiguous-classification` | Evidence supports two or more mutually exclusive categories | Report each supported category with its evidence; stop without picking a winner. |

Partial-result rule: if classification succeeds but the minimal repair cannot be stated without speculation, return `minimal-repair-unknown` with the classification and evidence; stop.

Non-mutation rule: this skill never edits files, creates commits, or sends changes to any system.

## Output
A triage report containing:
- the classification category;
- the quoted evidence from the property, implementation, and specification;
- the minimal repair action as one concrete imperative sentence;
- any surfaced ambiguity with competing classifications;
- a boolean `is_defect` field: `true` for Code Bug, `false` for Over-broad Property, Incorrect Property, or Unsettled Specification.

## Provenance

Origin: Property-Based Testing skill suite, Trail of Bits (https://github.com/trailofbits/skills), revision d1f1575cff97816e5cc08af66cd2506099c681d3.
License: CC-BY-SA-4.0. Attribution preserved. Source link preserved. Modifications are clean-room adaptations of the published procedure patterns into ODIN 2.0 self-contained skill form; no third-party expression is copied verbatim. ShareAlike propagation applies to further adaptations.
