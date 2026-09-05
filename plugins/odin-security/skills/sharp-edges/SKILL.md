---
name: sharp-edges
description: 'Use when asked to audit a code surface for misuse resistance or security edge cases, including delegated specialist analysis with exploitability validation (mode: specialist).'
---

# Sharp edges

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks whether an API, configuration schema, cryptographic interface, authentication surface, or library design is misuse-resistant, secure by default, or contains footguns (mode: inline); or a user or orchestrator explicitly delegates an isolated, dedicated misuse-resistance analysis of APIs, configurations, or interfaces to a specialist agent (mode: specialist). |
| Authority | Read-only: writes nothing; no rollback needed. No remote mutation. |
| Side effect | A structured sharp-edge findings report in the conversation, or returned to the delegating caller. No other system state is changed. |
| Done | Mode inline: security-relevant choice points are checked across zero, empty, null, negative, default, type-confusion, and failure cases; each reported edge has category, severity, location, reproducible misuse, and a misuse-resistant recommendation. Mode specialist: the four analysis phases complete and every finding also carries an exploitability determination. |

## Inputs

- `mode`: `inline` (default) or `specialist`.
- Code surface: the code, API surface, configuration schema, cryptographic interface, or library design under review. Required.
- Target specification: the element or surface within the code that the user wants audited. Required.
- Mode `specialist` adds: target scope named explicitly by the caller (required; the scope is bounded by what the caller names and the skill refuses to expand it — the skill does not discover additional files or symbols); language context (optional; defaults to inferring from file extensions); severity floor (optional; defaults to all findings).

## Procedure

1. **Select the mode and identify the target.** `specialist` when a caller explicitly delegates a dedicated analysis; otherwise `inline`. If no target is provided, stop without findings. Mode `specialist`: record the caller-named targets and bound the scope; do not traverse directories, follow imports, or fetch remote content beyond what the caller explicitly names. Done when: the mode is fixed and the target is identified and bounded, or the absence is reported.
2. **Enumerate the attack surface.** Mode `inline`: enumerate every choice point in the target — parameters, return values, configuration keys, defaults, error paths, and state transitions. Mode `specialist` (Phase 1, misuse pattern surface): scan the named scope for the four misuse categories — authentication and session management anti-patterns (hardcoded credentials, weak or missing authentication checks, insecure session token generation, missing or broken authorization guards, overly permissive default ACLs); cryptographic API misuse (predictable random sources, weak cipher or hash selection, ECB mode on block ciphers, missing authenticated encryption, hardcoded keys or IVs, incorrect key length, lack of salt for password hashing); configuration anti-patterns (excessive privileges, debug mode in production, disabled security controls, default credentials in config, credential leakage in logs or environment, insecure protocol or port defaults); interface contract violations (missing null-checks on returned objects, unchecked array or buffer bounds, unvalidated external input passed to dangerous sinks, missing error handling on security-critical calls). Done when: every choice point is listed, or every misuse category is scanned across the named scope.
3. **Mode `inline`: evaluate the seven edge cases per choice point** — zero (0, false, equivalent), empty (empty string, empty collection, uninitialized state), null (null, None, nil, undefined, untyped zero value), negative (negative number or unvalidated signed integer), default (implementation-defined or unspecified default), type confusion (value of a different type than expected), failure (error, exception, or unavailable). Done when: every choice point is tested against all seven edge cases.
4. **Classify each concrete, reproducible misuse** as: input validation, cryptographic misuse, authentication/authorization bypass, resource exhaustion, insecure defaults, state machine violation, or other. Done when: every concrete misuse is classified.
5. **Assign severity**: critical (direct privilege escalation or data loss), high (information disclosure or degraded integrity), medium (availability impact or escalation path), or low (defense-in-depth violation or increased attack surface). Mode `specialist` may also assign Info, and assigns Critical only when a single misuse instance can be exploited without prerequisite conditions or additional context. Done when: every finding has a severity.
6. **Mode `specialist`: validate exploitability (Phase 3).** For each misuse, determine whether it is reachable from a realistic entry point without requiring an attacker to first introduce additional code or permissions; whether it has a pre-existing compensating control that reduces its practical impact; and whether it is latent (present but unreachable with the current call graph). Record the determination as Exploitable, Likely Exploitable, Unlikely Exploitable, Not Exploitable, or Latent. Done when: every misuse has an exploitability determination.
7. **Record and recommend.** For each finding, record the exact file and line number, a one-sentence reproducible misuse example, a one-sentence security impact, and a concrete, misuse-resistant recommendation. Mode `specialist` (Phase 4): the recommendation identifies the correct API, configuration, or pattern that eliminates or correctly mitigates the misuse, states the minimum change required, and does not widen the attack surface. Done when: every finding has all fields.
8. **Emit the report.** Sort findings by severity descending and return the structured findings report. Mode `specialist`: each entry also carries its exploitability determination, the report adds a summary line with total findings per severity level, and the report is returned to the caller with no filesystem writes, no VCS operations, and no remote calls. Done when: the report is emitted with findings sorted.

## Failure and recovery

- No target provided: stop without findings and state that the target was not specified. Mode `specialist` with no targets returns `error: no-targets` and stops.
- Unbounded scope (mode `specialist`): if the caller names a directory or glob, stop and ask for an explicit file list. Do not auto-expand.
- Unreadable target (mode `specialist`): if a named file cannot be read (permissions, encoding, binary), record it as "Unreadable: [filename]" in the report and continue with remaining targets.
- No security-relevant edge cases: return an empty findings report stating that no sharp edges were found; mode `specialist` returns the empty report with the note "No misuse patterns detected in the named scope."
- Missing source code: if the referenced code cannot be located, stop and state which target could not be examined.
- Partial report (mode `specialist`): if the analysis cannot complete all four phases for a target, report what was found up to the failure point and annotate the incomplete finding with "Phase N incomplete: [reason]."

## Output

A structured findings report with one entry per sharp edge (severity, category, location, misuse, impact, recommendation; mode `specialist` adds the exploitability determination and a per-severity totals line), sorted by severity descending; an empty findings array with a confirmation message when no edges are found.
