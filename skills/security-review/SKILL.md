---
name: security-review
description: 'Use when asked to run an adversarial security audit using STRIDE, OWASP, supply-chain checks, secrets scans, and auth analysis when changes touch auth, input parsing, dependencies, network input and output, or pre-release. Produce a severity-graded report with critical/high findings blocking merge. Don''t use for tasks that require source or remote-system changes.'
---

# Security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Changes touch auth, input parsing, dependencies, network I/O, or pre-release of public-facing service |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Produces a security-audit report with findings; no code edits; secret scanning reads and never mutates credentials |
| Done | Audit report with STRIDE findings, OWASP walkthrough, severity contract (critical/high block merge) |

## Inputs

- **Change set**: diff, commit range, or file list under audit. Required.
- **Ecosystem context**: language family, framework, dependency manager. Optional; inferred from repo if absent.
- **Scope hint**: specific concern (auth, crypto, injection, supply-chain). Optional; full STRIDE/OWASP walk when absent.

## Procedure

1. **Bound scope**: identify every file in the change set. Map each to a trust boundary (external input, internal service, data store, credential surface).
2. **STRIDE walk**: for each component touching a trust boundary, apply the six-question template:
   - **Spoofing**: Who is the principal? How is identity proven? Can the credential be forged, replayed, or stolen? Is MFA/mutual-auth enforced?
   - **Tampering**: What inputs cross the trust boundary? Are they validated against an explicit schema? Are messages integrity-protected?
   - **Repudiation**: Are security-relevant actions logged with actor + timestamp + outcome? Are logs append-only/tamper-evident?
   - **Information Disclosure**: What data is returned in error paths, logs, telemetry? Are PII/secrets ever serialized? Are timing side-channels addressed?
   - **Denial of Service**: Are inputs bounded (size, count, depth)? Is parsing resource-limited? Are external calls rate-limited?
   - **Elevation of Privilege**: What privilege does the new code execute under? Is least privilege honored? Can input alter privilege?
3. **OWASP Top 10 walkthrough**:
   - Broken Access Control: trace authorization policy.
   - Cryptographic Failures: grep for weak primitives (MD5, SHA1, DES, Math.random).
   - Injection: check unparameterized queries, shell concat, template eval.
   - Insecure Design: cross-check STRIDE findings.
   - Security Misconfiguration: TLS, CORS, CSP, cookie flags, debug toggles.
   - Vulnerable Components: run ecosystem CVE scanner.
   - Auth Failures: token TTL, refresh, session fixation, MFA.
   - Integrity Failures: lockfile pinned, signature-verified artifacts.
   - Logging Failures: audit log coverage, alert on auth-fail.
   - SSRF: egress allowlist, SSRF guard on URL inputs.
4. **Supply-chain scan**: run per-ecosystem CVE scanner and secrets/history scanner from the dep-audit-tooling matrix.
5. **Severity grading**: assign each finding Critical/High/Medium/Low/Informational. Critical and high block merge.
6. **Compile report**: structured findings with severity, location, description, remediation owner.

## Failure and recovery
- **Incomplete change set**: report what was audited and what was skipped; do not widen scope.
- **Tool unavailable**: note the missing scanner; proceed with manual review; flag as gap in report.
- **Ambiguous trust boundary**: document the ambiguity; flag for human review; do not assume safety.
- **Scope creep**: stop at the declared boundary; file separate findings for out-of-scope concerns.

## Output
Structured audit report containing:
- Executive summary with finding counts by severity.
- STRIDE findings table (threat class, component, severity, description, remediation owner).
- OWASP walkthrough with pass/fail per category.
- Supply-chain scan results (CVE count, secrets found, SBOM status).
- Merge gate decision: block (critical/high present) or pass.

## Provenance

- Origin: odin-current (project-owned).
- Source: skills/security-review/SKILL.md.
- License: project-owned; no third-party expression.
- Adaptation: restructured from current skill body to ODIN 2.0 authoring contract format.
