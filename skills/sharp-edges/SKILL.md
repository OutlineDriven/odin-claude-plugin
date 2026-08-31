---
name: sharp-edges
description: 'Use when asked to audit a code surface for security-relevant edge cases. Returns a structured findings report. Don''t use for tasks that require source or remote-system changes.'
---

# Sharp edges

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks whether an API, configuration schema, cryptographic interface, authentication surface, or library design is misuse-resistant, secure by default, or contains footguns. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A structured sharp-edge findings report in the conversation. No file write, no version control change, no credential exposure, no external mutation. |
| Done | Security-relevant choice points are checked across zero, empty, null, negative, default, type-confusion, and failure cases; each reported edge has category, severity, location, reproducible misuse, and a misuse-resistant recommendation. |

## Inputs

- **Code surface**: the code, API surface, configuration schema, cryptographic interface, or library design under review. Required.
- **Target specification**: the element or surface within the code that the user wants audited. Required.

## Procedure

1. Identify the surface the user wants audited as the **target**.
2. If no target is provided, stop without findings.
3. Enumerate every choice point in the target: parameters, return values, configuration keys, defaults, error paths, and state transitions.
4. For each choice point, evaluate the following edge cases:
   - **Zero**: the value is 0, `false`, or equivalent.
   - **Empty**: the value is an empty string, empty collection, or uninitialized state.
   - **Null**: the value is `null`, `None`, `nil`, `undefined`, or untyped zero value.
   - **Negative**: the value is a negative number or unvalidated signed integer.
   - **Default**: the value takes its implementation-defined or unspecified default.
   - **Type confusion**: the value is a value of a different type than the parameter expects.
   - **Failure**: the operation returns an error, throws an exception, or is unavailable.
5. For each edge case that produces concrete, reproducible misuse, create a finding. Classify it as one of: input validation, cryptographic misuse, authentication/authorization bypass, resource exhaustion, insecure defaults, state machine violation, or other.
6. Assign severity: **critical** (direct privilege escalation or data loss), **high** (information disclosure or degraded integrity), **medium** (availability impact or escalation path), or **low** (defense-in-depth violation or increased attack surface).
7. For each finding, record: the exact file and line number, a one-sentence reproducible misuse example, a one-sentence security impact, and a concrete, misuse-resistant recommendation.
8. Sort findings by severity descending.
9. Return the structured findings report.

## Failure and recovery
- **No target provided**: stop without findings and state that the target was not specified.
- **Target has no security-relevant edge cases**: return an empty findings report stating that no sharp edges were found in the target.
- **Missing source code**: if the referenced code cannot be located, stop and state which target could not be examined.

## Output
A structured findings report containing, for each identified sharp edge:

- `severity`: one of critical, high, medium, low.
- `category`: one of input validation, cryptographic misuse, authentication/authorization bypass, resource exhaustion, insecure defaults, state machine violation, other.
- `location`: file path and line number.
- `misuse`: a reproducible one-sentence example of how the edge case causes harm.
- `impact`: a one-sentence description of the security consequence.
- `recommendation`: a concrete, actionable, misuse-resistant mitigation.

Sorted by severity descending. If no sharp edges are found, return an empty findings array with a confirmation message.

## Provenance

Clean-room adaptation. Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0. This adaptation preserves Trail of Bits attribution and the source link, marks the text as modified, and remains under CC-BY-SA-4.0 ShareAlike. It claims no Trail of Bits trademark rights and does not reuse `trail-of-bits-mark.svg` as branding.
