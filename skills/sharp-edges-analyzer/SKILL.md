---
name: sharp-edges-analyzer
description: 'Use when a user or orchestrator explicitly delegates a misuse-resistance analysis of APIs, configurations, or interfaces to a specialist agent, the agent completes four analysis phases and returns a findings report where every finding carries category, severity, source location, minimal misuse example, exploitability validation, and a concrete recommendation. Don''t use for tasks that require source or remote-system changes.'
---

# Sharp edges analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user or orchestrator explicitly delegates an isolated, dedicated misuse-resistance analysis of APIs, configurations, or interfaces to a specialist agent. |
| Authority | Read-only. No file creation, VCS mutation, credential issuance, paid action, published artifact mutation, deployment change, or remote mutation. |
| Side effect | A specialist-agent sharp-edge findings report returned to the caller via chat output. No other system state is changed. |
| Done | The four analysis phases complete and every finding includes category, severity, source location, minimal misuse, exploitability validation, and recommendation. |

## Inputs

- **Target scope** (required): the APIs, configuration files, or interfaces to analyze. Scope is bounded by what the caller names; the skill refuses to expand it.
- **Language context** (optional): the programming language(s) in scope. Defaults to inferring from file extensions.
- **Severity floor** (optional): minimum severity to report. Defaults to all findings.

The caller provides the scope explicitly; the skill does not discover additional files or symbols.

## Procedure

1. **Accept and bound scope.** Record the caller-named targets. Do not traverse directories, follow imports, or fetch remote content beyond what the caller explicitly names.

2. **Phase 1 — Misuse pattern surface.** Scan the named scope for the following misuse categories:
   - Authentication and session management anti-patterns (hardcoded credentials, weak or missing authentication checks, insecure session token generation, missing or broken authorization guards, overly permissive default ACLs).
   - Cryptographic API misuse (predictable random sources, weak cipher or hash selection, ECB mode on block ciphers, missing authenticated encryption, hardcoded keys or IVs, incorrect key length, lack of salt for password hashing).
   - Configuration anti-patterns (excessive privileges, debug mode in production, disabled security controls, default credentials in config, credential leakage in logs or environment, insecure protocol or port defaults).
   - Interface contract violations (missing null-checks on returned objects, unchecked array or buffer bounds, unvalidated external input passed to dangerous sinks, missing error handling on security-critical calls).

3. **Phase 2 — Severity assignment.** Assign each surfaced misuse to one of: Critical, High, Medium, Low, Info. Assign Critical only when a single misuse instance can be exploited without prerequisite conditions or additional context.

4. **Phase 3 — Exploitability validation.** For each misuse, determine:
   - Whether the misuse is reachable from a realistic entry point without requiring an attacker to first introduce additional code or permissions.
   - Whether the misuse has a pre-existing compensating control that reduces its practical impact.
   - Whether the misuse is latent (present but unreachable with the current call graph).
   Record the exploitability determination as: Exploitable, Likely Exploitable, Unlikely Exploitable, Not Exploitable, or Latent.

5. **Phase 4 — Recommendation formulation.** For every finding, produce one recommendation that:
   - Identifies the correct API, configuration, or pattern that eliminates or correctly mitigates the misuse.
   - States the minimum change required to resolve the issue.
   - Does not widen the attack surface.

6. **Assemble the report.** Structure the findings as a table with columns: Category | Severity | Location | Minimal Misuse Example | Exploitability | Recommendation. Sort by severity descending.

7. **Return the report.** Output the structured findings to the caller. Perform no writes to the filesystem, no VCS operations, and no remote calls.

## Failure and recovery
- **Unbounded scope:** If the caller names a directory or glob, stop and ask for an explicit file list. Do not auto-expand.
- **Unreadable target:** If a named file cannot be read (permissions, encoding, binary), record it as "Unreadable — [filename]" in the report and continue with remaining targets.
- **Empty scope:** If no targets are provided, return `error: no-targets` and stop.
- **No findings:** If Phase 1 surfaces zero misuses, return the empty report with the header row and a "No misuse patterns detected in the named scope." note.
- **Partial report:** If the analysis cannot complete all four phases for a target, report what was found up to the failure point and annotate the incomplete finding with "Phase N incomplete: [reason]."

No rollback is required for read-only operations. No state is written that requires cleanup.

## Output
A structured sharp-edge findings report in the caller's session. The report is the only artifact. It contains:
- A findings table with one row per misuse (category, severity, source location, minimal misuse example, exploitability determination, recommendation).
- A summary line: total findings per severity level.
- No file writes, no credential issuance, no VCS changes.

## Provenance

Origin: Trail of Bits `sharp-edges` tool, `plugins/sharp-edges/agents/sharp-edges-analyzer.md`, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`, `https://github.com/trailofbits/skills`.
License: CC-BY-SA-4.0. The source license requires: preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding.
Adaptation: Clean-room. The concepts of authentication anti-patterns, cryptographic API misuse, configuration hardening, and interface contract violations are derived from the source's functional description. The four-phase procedure, severity scale, and report schema are expressed in original wording. No source expression is copied.
