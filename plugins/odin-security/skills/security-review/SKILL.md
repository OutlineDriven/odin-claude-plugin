---
name: security-review
description: 'Use when changes touch auth, parsing, dependencies, network, or pre-release, or a diff or baseline needs regression review. Modes: full, differential. Not for adding controls: use security-hardening.'
---

# Security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Changes touch auth, input parsing, dependencies, network I/O, or pre-release of a public-facing service; or a PR, commit, diff, or baseline is supplied for security regressions, blast radius, changed-code test gaps, or adversarial review of what changed. |
| Authority | Reversible local. Write set: one review report file. Rollback: delete the report file. No remote mutation. |
| Side effect | A security-audit report; differential mode reads Git history for blame and regression checks and always writes the report file. No code edits; secret scanning reads and never mutates credentials. |
| Done | Full mode: audit report with STRIDE findings, OWASP walkthrough, supply-chain results, and severity contract (critical and high block merge). Differential mode: every in-scope change risk-classified at the declared depth, with evidence-backed findings, test gaps, blast radius, historical context, exploit paths where warranted, limitations, and a recommendation. |

## Not for

- Adding security controls during construction: use security-hardening.
- Verifying a named security allegation as true or false positive: use security-finding-verification.

## Inputs

- Mode: full or differential; default full. Differential applies when a PR, commit, diff, or baseline is supplied for regressions, blast radius, gaps, or adversarial review. Differential needs a baseline to compare; greenfield code with no baseline, documentation-only changes, and formatting-only changes use full mode.
- Change set: diff, commit range, or file list under audit. Required for full mode.
- Baseline: differential comparison reference; defaults to the merge base or parent commit. Optional.
- Depth: full depth applies unless the user explicitly requests quick triage and accepts the residual risk. Optional.
- Ecosystem context: language family, framework, dependency manager. Optional; inferred from repo if absent.
- Scope hint: specific concern (auth, crypto, injection, supply-chain). Optional; full STRIDE/OWASP walk when absent.

## Procedure

Prioritize risk and use evidence. Focus on auth, crypto, external calls, value transfer, and validation removal. Back every finding with evidence, line numbers, and attack scenarios. Classify by risk, not size; a small diff can carry a critical regression. Familiarity is not coverage; build explicit baseline context. Git history is never skipped. Blast radius is calculated, not guessed. Missing tests elevate severity. Refactors are HIGH until proven LOW. In differential mode the report file is always written.

1. **Bound scope.** Identify every file in the change set and map each to a trust boundary (external input, internal service, data store, credential surface). Mode differential: extract the change set from the target (`git diff <base>..<head> --stat`, `git log <base>..<head> --oneline`, `git diff <base>..<head> --name-only`, or `gh pr view <number> --json files,additions,deletions`) and risk-score each changed file: HIGH for auth, crypto, external calls, value transfer, validation removal; MEDIUM for business logic, state changes, new public APIs; LOW for comments, tests, UI, logging. **Done when:** every file is mapped to a trust boundary and, in differential mode, every changed file carries a risk score.
2. **Baseline context.** Mode differential: before mutation analysis, capture system-wide invariants, trust boundaries and privilege levels, validation patterns, call graphs for critical functions, state flows, and external trust assumptions; store the record for cross-reference, then return to the head commit. Read both versions of each changed file and record BEFORE, AFTER, behavioral CHANGE, and SECURITY implication per diff region. Git-blame removed code (`git log -S "removed_code" --all --oneline`, `git blame <baseline> -- file`): removed code from "fix", "security", or "CVE" commits is CRITICAL; recently added then removed is HIGH; code added, removed for security, and re-added is a REGRESSION (`git log -S "added_code" --all -p`). **Done when:** baseline context is stored, removed code is blamed with red flags classified, regressions are checked, and every diff region has the four-field record.
3. **STRIDE walk.** Mode full: for each component touching a trust boundary, apply the six-question template:
   - Spoofing: Who is the principal? How is identity proven? Can the credential be forged, replayed, or stolen? Is MFA/mutual-auth enforced?
   - Tampering: What inputs cross the trust boundary? Are they validated against an explicit schema? Are messages integrity-protected?
   - Repudiation: Are security-relevant actions logged with actor + timestamp + outcome? Are logs append-only/tamper-evident?
   - Information Disclosure: What data is returned in error paths, logs, telemetry? Are PII/secrets ever serialized? Are timing side-channels addressed?
   - Denial of Service: Are inputs bounded (size, count, depth)? Is parsing resource-limited? Are external calls rate-limited?
   - Elevation of Privilege: What privilege does the new code execute under? Is least privilege honored? Can input alter privilege?
   Mode differential: the walk is skipped; trust-boundary coverage comes from the baseline context and risk scores. **Done when:** full mode answers all six STRIDE questions per trust-boundary component; differential mode records trust coverage from baseline context.
4. **OWASP Top 10 walkthrough.** Mode full: trace authorization policy (Broken Access Control); grep for weak primitives MD5, SHA1, DES, Math.random (Cryptographic Failures); check unparameterized queries, shell concat, template eval (Injection); cross-check STRIDE findings (Insecure Design); check TLS, CORS, CSP, cookie flags, debug toggles (Security Misconfiguration); run ecosystem CVE scanner (Vulnerable Components); check token TTL, refresh, session fixation, MFA (Auth Failures); check lockfile pinned, signature-verified artifacts (Integrity Failures); check audit log coverage, alert on auth-fail (Logging Failures); check egress allowlist, SSRF guard on URL inputs (SSRF). **Done when:** every OWASP category has a pass/fail verdict.
5. **Supply-chain scan.** Mode full: run the per-ecosystem CVE scanner and secrets/history scanner from the dep-audit-tooling matrix. **Done when:** CVE count, secrets found, and SBOM status are recorded.
6. **Test coverage analysis.** Mode differential: separate production-code changes from test changes; search for covering tests per changed function; apply risk elevation: new function with no tests raises MEDIUM to HIGH, modified validation with unchanged tests is HIGH, complex logic over 20 lines with no tests is HIGH. **Done when:** production and test changes are separated, covering tests are located per changed function, and risk elevation is applied.
7. **Blast radius analysis.** Mode differential: count callers per modified function (adapted to the language) and classify: 1 to 5 LOW, 6 to 20 MEDIUM, 21 to 50 HIGH, 50+ CRITICAL; combine risk score and blast class into a priority bucket, with deep analysis for high-risk high-blast changes and standard analysis for the rest. Escalate to adversarial analysis regardless of requested depth when removed code comes from "security", "CVE", or "fix" commits, access control modifiers are removed, validation is removed without replacement, external calls are added without checks, or high blast radius combines with a HIGH risk change. **Done when:** every modified function has a caller count, blast classification, and priority bucket, and escalations are marked.
8. **Deep context and adversarial analysis.** Mode differential, HIGH RISK changes only: map entry conditions, state reads and writes, external calls, return values, and side effects; trace internal calls recursively and external calls across trust boundaries, checking reentrancy; identify invariants the change must preserve and run a Five-Whys root-cause (why changed, why the original existed, why it might break, why this approach, why it could fail in production); find repeated validation patterns and flag removals that break defense-in-depth. Run the five-step adversarial method inline or delegate it to a subagent: attacker model (who, what access, where they interact); concrete attack vectors (entry point, attack sequence, proof of accessibility verified in code, never assumed); exploitability rating (EASY, MEDIUM, HARD); complete exploit scenario with exact commands, file:line references, and quantified impact, never "could cause issues"; baseline cross-reference (violated invariant, broken trust boundary, bypassed validation, regressed fix). **Done when:** every HIGH RISK change has the deep-context map, Five-Whys, and all five adversarial steps with accessibility verified.
9. **Severity grading.** Assign each finding Critical/High/Medium/Low/Informational. Critical and high block merge. **Done when:** every finding has a severity.
10. **Compile report.** Mode full: structured findings with severity, location, description, remediation owner. Mode differential: write the report file with the sections in § Output; no verbal-only delivery. **Done when:** the report carries all findings and every section for its mode.

## Failure and recovery

- Incomplete change set: report what was audited and what was skipped; do not widen scope.
- Tool unavailable: note the missing scanner; proceed with manual review; flag as gap in report.
- Ambiguous trust boundary: document the ambiguity; flag for human review; do not assume safety.
- Scope creep: stop at the declared boundary; file separate findings for out-of-scope concerns.
- Missing baseline or unreadable diff (differential): stop; report the exact target or baseline that could not be resolved; do not invent a baseline.
- No Git history (differential): regression and historical-context analysis cannot complete; record the limitation, lower confidence, and do not fabricate blame output.
- Scope exceeds declared depth (differential): analyze the HIGH RISK subset at full depth, surface-scan MEDIUM, exclude LOW; record coverage percentage and confidence; never claim full analysis when scope-limited.
- Delegated adversarial phase does not converge (differential): keep findings that reached concrete impact, mark the rest non-converged with the blocker, and do not inflate severity.
- Evidence-less finding: discard it; every finding cites specific line numbers and commits; vague warnings are not findings.
- Partial result: the report states what was analyzed, what was excluded, and the confidence level; the done predicate holds only for the in-scope subset actually analyzed.

## Output

Mode full: a structured audit report with executive summary (finding counts by severity), STRIDE findings table (threat class, component, severity, description, remediation owner), OWASP walkthrough (pass/fail per category), supply-chain scan results (CVE count, secrets found, SBOM status), and merge gate decision (block if critical/high present, else pass).

Mode differential: a markdown report file with sections in this order: Executive Summary (severity distribution, overall risk, recommendation, key metrics), What Changed (commit range, per-file table with status word: PASS clean, WARN non-blocking finding, FAIL blocking critical or high finding), Critical Findings (per HIGH/CRITICAL issue with file:line, blast radius, historical context, attack scenario, fix), Test Coverage Analysis, Blast Radius Analysis, Historical Context, Recommendations (immediate, before production, technical debt), Analysis Methodology (strategy, coverage, limitations, confidence), Appendices. Severity words: Critical, High, Medium, Low.
