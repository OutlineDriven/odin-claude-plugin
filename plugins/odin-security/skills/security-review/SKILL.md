---
name: security-review
description: 'Use when changes touch auth, input parsing, dependencies, network I/O, or pre-release of a public-facing service. Runs a STRIDE walk, OWASP Top 10 walkthrough, and supply-chain scan, and blocks merge on critical or high findings. Not for adding security controls during construction — use security-hardening; not for verifying one named finding — use security-finding-verification.'
---

# Security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Changes touch auth, input parsing, dependencies, network I/O, or pre-release of public-facing service. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Produces a security-audit report with findings; no code edits; secret scanning reads and never mutates credentials. |
| Done | Audit report with STRIDE findings, OWASP walkthrough, severity contract (critical/high block merge). |

## Not for

- Adding security controls during construction — use security-hardening.
- Verifying a named security allegation as true or false positive — use security-finding-verification.

## Inputs

- Change set: diff, commit range, or file list under audit. Required.
- Ecosystem context: language family, framework, dependency manager. Optional; inferred from repo if absent.
- Scope hint: specific concern (auth, crypto, injection, supply-chain). Optional; full STRIDE/OWASP walk when absent.

## Procedure

1. **Bound scope.** Identify every file in the change set. Map each to a trust boundary (external input, internal service, data store, credential surface). **Done when:** every file is mapped to a trust boundary.
2. **STRIDE walk.** For each component touching a trust boundary, apply the six-question template:
   - Spoofing: Who is the principal? How is identity proven? Can the credential be forged, replayed, or stolen? Is MFA/mutual-auth enforced?
   - Tampering: What inputs cross the trust boundary? Are they validated against an explicit schema? Are messages integrity-protected?
   - Repudiation: Are security-relevant actions logged with actor + timestamp + outcome? Are logs append-only/tamper-evident?
   - Information Disclosure: What data is returned in error paths, logs, telemetry? Are PII/secrets ever serialized? Are timing side-channels addressed?
   - Denial of Service: Are inputs bounded (size, count, depth)? Is parsing resource-limited? Are external calls rate-limited?
   - Elevation of Privilege: What privilege does the new code execute under? Is least privilege honored? Can input alter privilege?
   Done when: every trust-boundary component has all six STRIDE questions answered.
3. **OWASP Top 10 walkthrough.** Trace authorization policy (Broken Access Control); grep for weak primitives MD5, SHA1, DES, Math.random (Cryptographic Failures); check unparameterized queries, shell concat, template eval (Injection); cross-check STRIDE findings (Insecure Design); check TLS, CORS, CSP, cookie flags, debug toggles (Security Misconfiguration); run ecosystem CVE scanner (Vulnerable Components); check token TTL, refresh, session fixation, MFA (Auth Failures); check lockfile pinned, signature-verified artifacts (Integrity Failures); check audit log coverage, alert on auth-fail (Logging Failures); check egress allowlist, SSRF guard on URL inputs (SSRF). **Done when:** every OWASP category has a pass/fail verdict.
4. **Supply-chain scan.** Run per-ecosystem CVE scanner and secrets/history scanner from the dep-audit-tooling matrix. **Done when:** CVE count, secrets found, and SBOM status are recorded.
5. **Severity grading.** Assign each finding Critical/High/Medium/Low/Informational. Critical and high block merge. **Done when:** every finding has a severity.
6. **Compile report.** Structured findings with severity, location, description, remediation owner. **Done when:** the report is compiled with all findings.

## Failure and recovery

- Incomplete change set: report what was audited and what was skipped; do not widen scope.
- Tool unavailable: note the missing scanner; proceed with manual review; flag as gap in report.
- Ambiguous trust boundary: document the ambiguity; flag for human review; do not assume safety.
- Scope creep: stop at the declared boundary; file separate findings for out-of-scope concerns.

## Output

A structured audit report with executive summary (finding counts by severity), STRIDE findings table (threat class, component, severity, description, remediation owner), OWASP walkthrough (pass/fail per category), supply-chain scan results (CVE count, secrets found, SBOM status), and merge gate decision (block if critical/high present, else pass).
