---
name: security-finding-verification
description: 'Use when a named security allegation is supplied, trace its data flow, run class-specific checks, assess exploitability, and issue a true-positive or false-positive verdict with full evidence. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Security finding verification

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A specific alleged security vulnerability needs a true-positive or false-positive verdict rather than new-bug discovery. |
| Authority | Reversible-local: write only named local artifacts; state the rollback path. |
| Side effect | Restated claim, threat model, complete source-to-sink evidence, class-specific checks, exploitability or PoC evidence where warranted, gate reviews, and verdict. |
| Done | Each supplied finding is independently traced, tested or proved at the appropriate depth, challenged adversarially, and labeled true positive or false positive with evidence. |

## Inputs

Must supply:
- The finding claim: vulnerability type, affected component, and any asset or call-site description.
- The relevant source code or artifact under evaluation.

Optional:
- Existing threat model for the affected component.
- Any prior triage notes or external report context.

## Procedure

1. **Restate the finding.** Summarize the alleged vulnerability: type, affected component, and attacker's position from the supplied claim. State whether the finding is in scope.

2. **Build the threat model.** Identify attacker position, required capabilities, and the complete attack path from entry point to asset.

3. **Trace the data flow.** Locate the source entry, identify all intermediate steps, find the sink, and confirm each step by reading the actual code. Mark any unconfirmable step as `unresolved`. Block the verdict on unresolved steps.

4. **Run class-specific checks.** Apply the OWASP Top 10 and relevant CWE checks for the alleged vulnerability class. For each check, record whether the finding passes or fails the check. Compare the observation with known false-positive shapes for that vulnerability class. Record the exact shape and why it does or does not apply.

   Class-specific checks by vulnerability type:
   - **Injection (SQL, command, XSS, LDAP, XML, Xpath, SMTP header, OS command):** Confirm unsanitized user-controlled input reaches a sensitive sink without context-appropriate escaping or validation.
   - **Path traversal:** Confirm user-controlled input reaches a filesystem operation without path sanitization or canonicalization.
   - **Authentication/authorization bypass:** Confirm a protection mechanism is absent or bypassed at the named call site.
   - **Sensitive data exposure:** Confirm secrets, keys, tokens, or credentials appear in plaintext in source code, logs, or network payloads.
   - **Cryptographic failure:** Confirm weak, broken, or misused crypto primitives at the named call site.
   - **Insecure design:** Confirm a missing architectural guard such as rate limiting, CSRF tokens, or session invalidation.
   - **Security misconfiguration:** Confirm a default, outdated, or permissive configuration at the named component.
   - **Integrity failure:** Confirm code or data is used without a cryptographic integrity check.
   - **Logging and monitoring failure:** Confirm an attack sequence reaches the named step without triggering an observable log event.
   - Any other class: define the relevant class-specific check explicitly before running it.

5. **Assess exploitability.** Determine whether the finding is: (a) reachable from the named attacker position, (b) sufficient to cause harm given the threat model, and (c) reproducible in the available environment. If all three hold and safe to demonstrate, construct a proof of concept. If not safe or not reproducible, provide structured reasoning instead of a live exploit.

6. **Conduct gate reviews.** At each step, verify the evidence is sufficient to support the next step. Stop and report the specific evidence gap if a gate check fails. Do not proceed past a gate with unverified assumptions.

7. **Issue the verdict.** For each finding: state `true positive` if the data flow is confirmed, class checks fail as described, and exploitability is established; state `false positive` if the data flow is broken, the pattern matches a known false-positive shape, the class checks pass, or exploitability cannot be established despite sufficient evidence. Include all evidence, the threat model, class-specific check results, and the adversarial challenge rationale in the verdict.

## Failure and recovery
- **Finding claim insufficient:** Stop and return `inconclusive` with the specific missing element.
- **Missing source code:** Stop and return `inconclusive — source code not available` for the affected component.
- **Unresolved data flow step:** Mark the step `unresolved` and return `inconclusive — unresolved data flow step` blocking the verdict.
- **Vulnerability class mismatch:** Return `out of scope — vulnerability class does not match the supplied finding`.
- **Insufficient evidence at any gate:** Stop, name the gate, and return the specific evidence gap.
- **Partial-result rule:** If multiple findings are supplied and some cannot be resolved, issue a verdict only for the findings with complete evidence; name the inconclusive findings explicitly.
- **No file mutation:** This skill produces chat output only. No rollback is needed.

## Output
A structured verdict in chat for each finding, containing:
- Classification: `true positive` or `false positive`.
- The complete source-to-sink data flow trace.
- Class-specific check results with pass/fail for each relevant check.
- Threat model used.
- Exploitability assessment and PoC if constructed.
- Adversarial challenge: the strongest argument against the verdict and the response to it.
- Severity and exploitability rating if true positive.
- Recommended remediation steps.

## Provenance

Adapted from Trail of Bits fp-check workflow (`fp-check`) under CC-BY-SA-4.0. Source: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3. Modifications: restructured procedure as a self-contained ODIN 2.0 skill, removed proprietary tooling assumptions, inlined reference content, and reduced to one workflow. Attribution preserved per license. No trademark rights claimed; trail-of-bits-mark.svg not used as branding.
