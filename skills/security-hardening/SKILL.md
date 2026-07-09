---
name: security-hardening
description: Harden code against vulnerabilities as you build it. Use when handling untrusted input, authentication or authorization, data storage, or external integrations.
---

# Security and Hardening

## Overview

Security-first development. Three standing constraints: treat every external input as hostile until validated, keep every secret out of code and logs, and check authorization on every protected action. Security is a property of each line that touches user data, authentication, or external systems, built in during construction rather than retrofitted afterward.

## When to Use

- Building anything that accepts user input
- Implementing authentication or authorization
- Storing or transmitting sensitive data
- Integrating with external APIs or services
- Adding file uploads, webhooks, or callbacks
- Handling payment or PII data

## Process: Threat Model First

A control added without a threat model is a guess. Before hardening, spend five minutes as the attacker:

1. **Map the trust boundaries.** Where does untrusted data cross into the system? HTTP requests, form fields, file uploads, webhooks, third-party APIs, message queues, and **LLM output**. Every boundary is attack surface.
2. **Name the assets.** What is worth stealing or breaking? Credentials, PII, payment data, admin actions, money movement.
3. **Run STRIDE over each boundary**: a lens, not a ceremony:

| Threat | Ask | Typical mitigation |
|---|---|---|
| **S**poofing | Can someone impersonate a user/service? | Authentication, signature verification |
| **T**ampering | Can data be altered in transit or at rest? | Integrity checks, parameterized queries, HTTPS |
| **R**epudiation | Can an action be denied later? | Audit logging of security events |
| **I**nformation disclosure | Can data leak? | Encryption, field allowlists, generic errors |
| **D**enial of service | Can it be overwhelmed? | Rate limiting, input size caps, timeouts |
| **E**levation of privilege | Can a user gain rights they shouldn't? | Authorization checks, least privilege |

4. **Write abuse cases next to use cases.** For each feature, ask "how would I misuse this?" Then make that the first test.

If you cannot name a feature's trust boundaries, you cannot secure it. This is OWASP **A04: Insecure Design**; design flaws, not code typos, drive most breaches.

## The Three-Tier Boundary System

### Always Do (No Exceptions)

- **Validate all external input** at the system boundary (API routes, form handlers)
- **Parameterize all database queries**: never concatenate user input into SQL
- **Encode output** to prevent XSS (use framework auto-escaping; do not bypass it)
- **Use HTTPS** for all external communication
- **Hash passwords** with bcrypt/scrypt/argon2 (never store plaintext)
- **Set security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **Use httpOnly, secure, sameSite cookies** for sessions
- **Run the dependency audit** (`npm audit`, `pip-audit`, `cargo audit`, `govulncheck`, or equivalent) before every release

### Ask First (Requires Human Approval)

- Adding new authentication flows or changing auth logic
- Storing new categories of sensitive data (PII, payment info)
- Adding new external service integrations
- Changing CORS configuration
- Adding file upload handlers
- Modifying rate limiting or throttling
- Granting elevated permissions or roles

### Never Do

- **Never commit secrets** to version control (API keys, passwords, tokens)
- **Never log sensitive data** (passwords, tokens, full credit card numbers)
- **Never trust client-side validation** as a security boundary
- **Never disable security headers** for convenience
- **Never feed user data to dynamic execution or raw markup** (`eval`, `innerHTML`, `exec`, template injection)
- **Never store sessions in client-accessible storage** (auth tokens in localStorage)
- **Never expose stack traces** or internal error details to users

## Reference materials

Read on demand; the threat model and the boundary tiers above decide which.

- `references/owasp-patterns.md`: per-vulnerability prevention code for injection, broken auth, XSS, access control, misconfiguration, data exposure, and SSRF, in two language families.
- `references/input-validation.md`: schema validation at the trust boundary (zod, pydantic) and file-upload safety.
- `references/dependency-audit.md`: triage tree for audit findings, plus supply-chain hygiene beyond what a CVE scan catches.
- `references/operational-controls.md`: rate limiting and secrets management, including rotation after an exposure.
- `references/llm-security.md`: OWASP LLM Top 10 mitigations and treating model output as untrusted input.
- `references/security-checklist.md`: the OWASP 2021 ordering as a quick-reference table, the detailed review checklists, and pre-commit verification steps.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is an internal tool, security doesn't matter" | Internal tools get compromised. Attackers target the weakest link. |
| "We'll add security later" | Retrofitting security costs far more than building it in. Add it now. |
| "No one would try to exploit this" | Automated scanners will find it. Security by obscurity is not security. |
| "The framework handles security" | Frameworks provide tools, not guarantees. You still have to use them correctly. |
| "It's just a prototype" | Prototypes become production. Security habits from day one. |
| "Threat modeling is overkill here" | Five minutes of "how would I attack this?" prevents the design flaws no control can patch later. |
| "It's just LLM output, it's only text" | That "text" can be a SQL statement, a script tag, or a shell command. Treat it like any untrusted input. |

## Red Flags

- User input passed directly to database queries, shell commands, or HTML rendering
- Secrets in source code or commit history
- API endpoints without authentication or authorization checks
- Missing CORS configuration or wildcard (`*`) origins
- No rate limiting on authentication endpoints
- Stack traces or internal errors exposed to users
- Dependencies with known critical vulnerabilities
- Server fetches user-supplied URLs without an allowlist (SSRF)
- LLM/model output passed into a query, the DOM, a shell, or `eval`
- Secrets, PII, or the full system prompt placed inside an LLM context window

## Verification

After implementing security-relevant code:

- [ ] Dependency audit shows no critical or high vulnerabilities
- [ ] No secrets in source code or git history
- [ ] All user input validated at system boundaries
- [ ] Authentication and authorization checked on every protected endpoint
- [ ] Security headers present in response (check with browser DevTools)
- [ ] Error responses don't expose internal details
- [ ] Rate limiting active on auth endpoints
- [ ] Server-side URL fetches validated against an allowlist (no SSRF)
- [ ] LLM/model output validated and encoded before use (if AI features present)
