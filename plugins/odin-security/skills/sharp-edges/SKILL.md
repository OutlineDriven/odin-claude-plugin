---
name: sharp-edges
description: 'Use when asked to audit a code surface for security-relevant edge cases. Returns a structured findings report. Not for delegated specialist analysis — use sharp-edges-analyzer.'
---

# Sharp edges

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks whether an API, configuration schema, cryptographic interface, authentication surface, or library design is misuse-resistant, secure by default, or contains footguns. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A structured sharp-edge findings report in the conversation. |
| Done | Security-relevant choice points are checked across zero, empty, null, negative, default, type-confusion, and failure cases; each reported edge has category, severity, location, reproducible misuse, and a misuse-resistant recommendation. |

## Not for

- Delegated specialist-agent analysis with exploitability validation — use sharp-edges-analyzer.

## Inputs

- Code surface: the code, API surface, configuration schema, cryptographic interface, or library design under review. Required.
- Target specification: the element or surface within the code that the user wants audited. Required.

## Procedure

1. Identify the surface the user wants audited as the **target**. If no target is provided, stop without findings. **Done when:** the target is identified or the absence is reported.
2. Enumerate every choice point in the target: parameters, return values, configuration keys, defaults, error paths, and state transitions. **Done when:** every choice point is listed.
3. For each choice point, evaluate edge cases: **zero** (0, false, equivalent), **empty** (empty string, empty collection, uninitialized state), **null** (null, None, nil, undefined, untyped zero value), **negative** (negative number or unvalidated signed integer), **default** (implementation-defined or unspecified default), **type confusion** (value of a different type than expected), **failure** (error, exception, or unavailable). **Done when:** every choice point is tested against all seven edge cases.
4. For each edge case that produces concrete, reproducible misuse, create a finding. Classify as: input validation, cryptographic misuse, authentication/authorization bypass, resource exhaustion, insecure defaults, state machine violation, or other. **Done when:** every concrete misuse is classified.
5. Assign severity: **critical** (direct privilege escalation or data loss), **high** (information disclosure or degraded integrity), **medium** (availability impact or escalation path), or **low** (defense-in-depth violation or increased attack surface). **Done when:** every finding has a severity.
6. For each finding, record: the exact file and line number, a one-sentence reproducible misuse example, a one-sentence security impact, and a concrete, misuse-resistant recommendation. **Done when:** every finding has all four fields.
7. Sort findings by severity descending. Return the structured findings report. **Done when:** the report is emitted with findings sorted.

## Failure and recovery

- No target provided: stop without findings and state that the target was not specified.
- No security-relevant edge cases: return an empty findings report stating that no sharp edges were found.
- Missing source code: if the referenced code cannot be located, stop and state which target could not be examined.

## Output

A structured findings report with one entry per sharp edge (severity, category, location, misuse, impact, recommendation), sorted by severity descending; an empty findings array with a confirmation message when no edges are found.
