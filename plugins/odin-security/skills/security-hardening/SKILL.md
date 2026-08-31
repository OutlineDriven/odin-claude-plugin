---
name: security-hardening
description: 'Use when handling untrusted input, auth/authz, data storage, or external integrations to add security controls during construction. Not for auditing a change set — use security-review. Not for verifying a named finding — use security-finding-verification.'
---

# Harden code security

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Handling untrusted input, auth/authz, data storage, external integrations, files/uploads/payment. |
| Authority | Reversible-local: adds security controls to code during construction; rollback restores prior state. |
| Side effect | Local-write: changes to code files only; no credential, deployment, or remote mutation. |
| Done | Security-relevant code passes the always-do checks and verification checklist. |

## Not for

- Auditing a diff or change set for vulnerabilities — use security-review.
- Verifying a named security allegation as true or false positive — use security-finding-verification.

## Inputs

- Codebase context: files or modules that will be modified, or the specific vulnerability class to address.
- Language/framework: optional but recommended when the hardening pattern is language-specific.
- Trust boundary location: optional; the skill will map it if not provided.

## Procedure

1. **Threat model before writing code.** Map trust boundaries (HTTP requests, form fields, file uploads, webhooks, third-party APIs, message queues, LLM output). Name high-value assets (credentials, PII, payment data, admin actions, money movement). Apply STRIDE to each boundary. Write abuse cases next to use cases; make each abuse case the first test. **Done when:** every trust boundary is named with its STRIDE threats and at least one abuse case per use case. If a feature's trust boundaries cannot be named, hardening for it is blocked.

2. **Classify the operation against the three tiers.**
   - Always Do (no human approval required): validate all external input at the system boundary; parameterize all database queries; encode output to prevent XSS; use HTTPS for all external communication; hash passwords with Argon2id; set CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers; use httpOnly/secure/sameSite cookies; run dependency audit (`pnpm audit`, `uvx pip-audit`, `cargo audit`, `govulncheck`) before every release.
   - Ask First (requires human approval): new authentication flows or auth logic changes; storing new categories of sensitive data; new external service integrations; changing CORS configuration; adding file upload handlers; modifying rate limiting; granting elevated permissions or roles.
   - Never Do: commit secrets or credentials to version control; log passwords, tokens, or full credit card numbers; trust client-side validation as a security boundary; disable security headers for convenience; pass user input to `eval`, `innerHTML`, `exec`, or template injection; store auth tokens in localStorage; expose stack traces or internal errors to users.
   Done when: every operation in scope is classified into exactly one tier.

3. **Implement controls.** Apply the appropriate always-do controls for the identified threat model. For injection: parameterize queries, encode output, validate and sanitize input at the boundary. For broken auth: enforce password hashing, session tokens in httpOnly cookies, CSRF tokens. For XSS: output encoding, CSP, framework auto-escaping. For SSRF: URL allowlist, no user-supplied URLs in server fetches. For data exposure: encryption at rest, field allowlists, generic errors. **Done when:** every always-do control for the identified threats is implemented.

4. **Verify against the checklist.** Confirm: dependency audit shows no critical or high vulnerabilities; no secrets in source code or git history; all user input validated at system boundaries; authentication and authorization checked on every protected endpoint; security headers present in responses; error responses do not expose internal details; rate limiting active on auth endpoints; server-side URL fetches validated against allowlist (no SSRF); LLM/model output validated and encoded before use (if AI features present). **Done when:** every checklist item passes or is explicitly waived with a stated reason.

5. **Rollback on failure.** If the checklist does not pass or the threat model cannot be completed, restore all changed files to their pre-invocation state. **Done when:** the working tree matches its pre-invocation state.

## Failure and recovery

- Blocked (threat-model incomplete): trust boundaries cannot be named for the feature. Stop. Do not add controls without a threat model.
- Non-converged (checklist): one or more always-do items cannot be satisfied. Do not declare done. Report which items failed and why.
- No-action (out-of-scope): the requested operation falls under Ask First without approval, or Never Do. Return a classification explaining which tier applies and what human approval would be required.
- Partial-result: some files pass the checklist and others do not. Report per-file status. Roll back files that fail.

## Output

Hardened source files with security controls applied, plus a verification report listing which checklist items passed and which remain open; if blocked, the classification and named failure class.
