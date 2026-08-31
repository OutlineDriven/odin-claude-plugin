---
name: sharp-edges-analyzer
description: 'Use when a specialist agent must analyze APIs, configurations, or interfaces for misuse resistance. Returns findings with category, severity, exploitability, and recommendation. Not for a quick inline audit — use sharp-edges.'
---

# Sharp edges analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user or orchestrator explicitly delegates an isolated, dedicated misuse-resistance analysis of APIs, configurations, or interfaces to a specialist agent. |
| Authority | Read-only. No file creation, VCS mutation, credential issuance, paid action, published artifact mutation, deployment change, or remote mutation. |
| Side effect | A specialist-agent sharp-edge findings report returned to the caller via chat output. No other system state is changed. |
| Done | The four analysis phases complete and every finding includes category, severity, source location, minimal misuse, exploitability validation, and recommendation. |

## Not for

- A quick inline audit of a code surface — use sharp-edges.

## Inputs

- Target scope (required): the APIs, configuration files, or interfaces to analyze. Scope is bounded by what the caller names; the skill refuses to expand it.
- Language context (optional): the programming language(s) in scope. Defaults to inferring from file extensions.
- Severity floor (optional): minimum severity to report. Defaults to all findings.

The caller provides the scope explicitly; the skill does not discover additional files or symbols.

## Procedure

1. **Accept and bound scope.** Record the caller-named targets. Do not traverse directories, follow imports, or fetch remote content beyond what the caller explicitly names. **Done when:** the target set is recorded and bounded.

2. **Phase 1 — Misuse pattern surface.** Scan the named scope for the following misuse categories:
   - Authentication and session management anti-patterns (hardcoded credentials, weak or missing authentication checks, insecure session token generation, missing or broken authorization guards, overly permissive default ACLs).
   - Cryptographic API misuse (predictable random sources, weak cipher or hash selection, ECB mode on block ciphers, missing authenticated encryption, hardcoded keys or IVs, incorrect key length, lack of salt for password hashing).
   - Configuration anti-patterns (excessive privileges, debug mode in production, disabled security controls, default credentials in config, credential leakage in logs or environment, insecure protocol or port defaults).
   - Interface contract violations (missing null-checks on returned objects, unchecked array or buffer bounds, unvalidated external input passed to dangerous sinks, missing error handling on security-critical calls).
   Done when: every misuse category is scanned across the named scope.

3. **Phase 2 — Severity assignment.** Assign each surfaced misuse to one of: Critical, High, Medium, Low, Info. Assign Critical only when a single misuse instance can be exploited without prerequisite conditions or additional context. **Done when:** every surfaced misuse has a severity.

4. **Phase 3 — Exploitability validation.** For each misuse, determine whether it is reachable from a realistic entry point without requiring an attacker to first introduce additional code or permissions; whether it has a pre-existing compensating control that reduces its practical impact; and whether it is latent (present but unreachable with the current call graph). Record the exploitability determination as: Exploitable, Likely Exploitable, Unlikely Exploitable, Not Exploitable, or Latent. **Done when:** every misuse has an exploitability determination.

5. **Phase 4 — Recommendation formulation.** For every finding, produce one recommendation that identifies the correct API, configuration, or pattern that eliminates or correctly mitigates the misuse; states the minimum change required to resolve the issue; and does not widen the attack surface. **Done when:** every finding has a recommendation.

6. **Assemble the report.** Structure the findings as a table with columns: Category | Severity | Location | Minimal Misuse Example | Exploitability | Recommendation. Sort by severity descending. **Done when:** the report is assembled with findings sorted.

7. **Return the report.** Output the structured findings to the caller. Perform no writes to the filesystem, no VCS operations, and no remote calls. **Done when:** the report is returned to the caller.

## Failure and recovery

- Unbounded scope: if the caller names a directory or glob, stop and ask for an explicit file list. Do not auto-expand.
- Unreadable target: if a named file cannot be read (permissions, encoding, binary), record it as "Unreadable — [filename]" in the report and continue with remaining targets.
- Empty scope: if no targets are provided, return `error: no-targets` and stop.
- No findings: if Phase 1 surfaces zero misuses, return the empty report with the header row and a "No misuse patterns detected in the named scope." note.
- Partial report: if the analysis cannot complete all four phases for a target, report what was found up to the failure point and annotate the incomplete finding with "Phase N incomplete: [reason]."

No rollback is required for read-only operations. No state is written that requires cleanup.

## Output

A structured sharp-edge findings report in the caller's session: a findings table with one row per misuse (category, severity, source location, minimal misuse example, exploitability determination, recommendation) sorted by severity descending, plus a summary line with total findings per severity level; no file writes, no credential issuance, no VCS changes.
