---
name: security-hardening
description: 'Use when handling untrusted input, auth/authz, data storage, or external integrations. Result: security controls verified against the always-do checklist. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Harden code security

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Handling untrusted input, auth/authz, data storage, external integrations, files/uploads/payment |
| Authority | Reversible-local: adds security controls to code during construction; rollback restores prior state |
| Side effect | Local-write: changes to code files only; no credential, deployment, or remote mutation |
| Done | Security-relevant code passes the always-do checks and verification checklist |

## Inputs

- **Codebase context**: files or modules that will be modified, or the specific vulnerability class to address
- **Language/framework**: optional but recommended when the hardening pattern is language-specific
- **Trust boundary location**: optional; the skill will map it if not provided

## Procedure

1. **Threat model before writing code.** Spend five minutes as the attacker:
   a. Map trust boundaries: HTTP requests, form fields, file uploads, webhooks, third-party APIs, message queues, and LLM output.
   b. Name high-value assets: credentials, PII, payment data, admin actions, money movement.
   c. Apply STRIDE to each boundary: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.
   d. Write abuse cases next to use cases; make each abuse case the first test.
   If a feature's trust boundaries cannot be named, hardening for it is blocked.

2. **Classify the operation against the three tiers.**
   - **Always Do** (no human approval required): validate all external input at the system boundary; parameterize all database queries; encode output to prevent XSS; use HTTPS for all external communication; hash passwords with Argon2id; set CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers; use httpOnly/secure/sameSite cookies; run dependency audit (`pnpm audit`, `uvx pip-audit`, `cargo audit`, `govulncheck`) before every release.
   - **Ask First** (requires human approval): new authentication flows or auth logic changes; storing new categories of sensitive data; new external service integrations; changing CORS configuration; adding file upload handlers; modifying rate limiting; granting elevated permissions or roles.
   - **Never Do**: commit secrets or credentials to version control; log passwords, tokens, or full credit card numbers; trust client-side validation as a security boundary; disable security headers for convenience; pass user input to `eval`, `innerHTML`, `exec`, or template injection; store auth tokens in localStorage; expose stack traces or internal errors to users.

3. **Implement controls.** Apply the appropriate always-do controls for the identified threat model. For injection: parameterize queries, encode output, validate and sanitize input at the boundary. For broken auth: enforce password hashing, session tokens in httpOnly cookies, CSRF tokens. For XSS: output encoding, CSP, framework auto-escaping. For SSRF: URL allowlist, no user-supplied URLs in server fetches. For data exposure: encryption at rest, field allowlists, generic errors.

4. **Verify against the checklist.** Confirm all always-do items are satisfied before declaring done:
   - Dependency audit shows no critical or high vulnerabilities
   - No secrets in source code or git history
   - All user input validated at system boundaries
   - Authentication and authorization checked on every protected endpoint
   - Security headers present in responses
   - Error responses do not expose internal details
   - Rate limiting active on auth endpoints
   - Server-side URL fetches validated against allowlist (no SSRF)
   - LLM/model output validated and encoded before use (if AI features present)

5. **Rollback on failure.** If the checklist does not pass or the threat model cannot be completed, restore all changed files to their pre-invocation state.

## Failure and recovery
- **Blocked (threat-model)**: Trust boundaries cannot be named for the feature. Stop. Do not add controls without a threat model.
- **Non-converged (checklist)**: One or more always-do items cannot be satisfied. Do not declare done. Report which items failed and why.
- **No-action (out-of-scope)**: The requested operation falls under Ask First without approval, or Never Do. Return a classification explaining which tier applies and what human approval would be required.
- **Partial-result rule**: If some files pass the checklist and others do not, report per-file status. Roll back files that fail.
- **Rollback rule**: On any non-converged result, restore every changed file to its pre-invocation state.

## Output
Hardened source files with security controls applied, plus a verification report listing which checklist items passed and which (if any) remain open. If blocked, return the classification and the named failure class.

## Provenance

Origin: odin-current (`current:current-c:current:security-hardening`). Source path: `skills/security-hardening/SKILL.md`. No external revision or license. Adaptation: threat-model-first process adapted from OWASP; STRIDE table adapted from Microsoft SDL; always-do / ask-first / never-do tier system original to ODIN. MIT-licensed material from addyosmani/agent-skills (`source:source-addy:addy-security-and-hardening`, revision `d2c37ef`, MIT) absorbed via global exact-contract deduplication; no third-party expression copied.
