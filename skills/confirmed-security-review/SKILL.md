---
name: confirmed-security-review
description: 'Use when the user asks for a security review, vulnerability audit, OWASP review, or review of injection, XSS, authentication, authorization, or cryptography issues. Returns a report of HIGH-confidence vulnerabilities only, each with attacker-controlled input confirmed, or a cleared report. Don''t use for tasks that require source or remote-system changes.'
---

# Confirmed security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a security review, vulnerability audit, OWASP review, or review of injection, XSS, authentication, authorization, or cryptography issues. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Reports findings in chat only. |
| Side effect | Chat output reporting high-confidence security vulnerabilities. |
| Done | Report with HIGH-confidence findings only, each with attacker-controlled input confirmed, or a cleared report stating no high-confidence vulnerabilities were identified. |

## Inputs

The file, diff, or code component to review must be supplied by the user. A specific concern area (injection, XSS, auth, crypto, etc.) is optional and narrows the review focus. The entire reachable codebase is in research scope for confidence-building; reporting scope is limited to the supplied target.

## Procedure

1. Bound scope: report only on the specific file, diff, or code the user supplied. Use the entire reachable codebase as research scope to build confidence before flagging anything.
2. Detect context from the supplied target: code type (API routes, frontend/templates, file handling, crypto/secrets, serialization, external requests, business workflows, config/headers/CORS, CI/CD dependencies, error handling, logging) and language/framework from file extensions and imports.
3. For each potential issue, research the data flow before flagging: where the input actually comes from; whether it is configured at deployment (server-controlled) or arrives from user input (attacker-controlled); whether validation, sanitization, or allowlisting exists upstream; and what framework protections apply.
4. Classify confidence for each candidate:
   - HIGH: vulnerable pattern plus attacker-controlled input confirmed — report with severity.
   - MEDIUM: vulnerable pattern, input source unclear — note as "Needs verification", do not report as a finding.
   - LOW: theoretical, best-practice, or defense-in-depth — do not report.
5. Do not flag: test files (unless explicitly reviewing test security), dead or commented code, documentation strings, patterns using constants or server-controlled configuration, and code paths that require prior authentication to reach (note the auth requirement instead of flagging).
6. Treat as server-controlled and safe unless user input reaches them: framework settings (`django.conf.settings.*`), environment variables (`os.environ`), config files, framework constants, and hardcoded internal values. A URL, path, or redirect target sourced from settings or config is not an SSRF, path-traversal, or open-redirect finding.
7. Do not flag framework-mitigated patterns unless the unsafe variant is present: auto-escaped template output (Django `{{ variable }}`, React `{variable}`, Vue `{{ variable }}`) and ORM parameterized queries (`cursor.execute("...%s", (input,))`, `Model.objects.filter(id=input)`) are safe. Flag only `|safe`, `{% autoescape off %}`, `mark_safe(user_input)`, `dangerouslySetInnerHTML={{__html: userInput}}`, `v-html="userInput"`, `.raw()`, `.extra()`, or `RawSQL()` with string interpolation or user input.
8. Confirm exploitability for each candidate before reporting. Attacker-controlled sources include request params/body/headers, unsigned cookies, URL path segments, file upload content and names, database content from other users, and WebSocket messages. Confirm the framework does not mitigate it and that no upstream validation or sanitization library (DOMPurify, bleach, etc.) neutralizes the input.
9. Always flag unconditionally when present: `eval`/`exec` on user input, unsafe deserialization (`pickle.loads`, `yaml.load` without `safe_load`, PHP `unserialize`, Java `ObjectInputStream`), `shell=True` with user input, `child_process.exec` with user input, `innerHTML`/`dangerouslySetInnerHTML`/`v-html` with user input, SQL built by string interpolation or template literals with user input, `os.system` with user input, and hardcoded secrets, API keys, AWS secret keys, or private keys.
10. Assign severity to each HIGH-confidence finding: Critical (direct exploit, severe impact, no auth required — RCE, SQL injection to data, auth bypass, hardcoded secrets); High (exploitable with conditions, significant impact — stored XSS, SSRF to metadata, IDOR to sensitive data); Medium (specific conditions required, moderate impact — reflected XSS, CSRF on state-changing actions, path traversal); Low (defense-in-depth, minimal direct impact — missing headers, verbose errors, weak algorithms in non-critical context).
11. Report HIGH-confidence findings only. Skip theoretical issues and anything that cannot be confirmed exploitable after research.

## Failure and recovery
- Insufficient context to confirm attacker control: classify the candidate MEDIUM, note it as "Needs verification" with the open question, and do not report it as a HIGH-confidence finding. Never promote a candidate to HIGH without confirmed attacker-controlled input.
- No high-confidence findings: return a cleared report stating "No high-confidence vulnerabilities identified." Do not fabricate findings to fill the report.
- Read-only authority: never mutate files, configuration, credentials, or remote state. If remediation requires mutation, state the fix recommendation in the report only.
- Supplied target unreachable or unreadable: report exactly what was inaccessible and stop. Do not widen scope, guess at unreachable code, or report findings without evidence.
- Pattern match without data-flow research: stop and complete the research in step 3 before flagging. Reporting on pattern matching alone is a failure of the contract.

## Output
A markdown report titled `## Security Review: [File/Component Name]` with:
- A Summary block: findings count broken down by severity, overall risk level, and confidence (High or Mixed).
- One Findings entry per HIGH-confidence issue: `[VULN-NNN] [Vulnerability Type] (Severity)`, with Location (`file:line`), Confidence (High), Issue, Impact, an Evidence code snippet of the vulnerable code, and Fix.
- A Needs Verification section for MEDIUM candidates: `[VERIFY-NNN] [Potential Issue]`, Location, and the Question that must be answered.
- If no HIGH-confidence vulnerabilities are found, the report states: "No high-confidence vulnerabilities identified."

## Provenance

Origin: getsentry/skills, revision c2f99a5b04b4cd992ec3022d7c2c3e23e938d241. The source `skills/security-review/SKILL.md` is Apache-2.0; OWASP-derived reference, language, and infrastructure guides in that skill are CC BY-SA 4.0 (OWASP Cheat Sheet Series). This skill is a clean-room adaptation: it retains the distinguishing mechanism — the attacker-confirmed HIGH-confidence reporting bar with research-before-flagging — and omits the external reference, language, and infrastructure files. No third-party expression is copied; the procedure and confidence contract are re-derived from the mechanism.
