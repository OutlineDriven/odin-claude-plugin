---
name: oauth2-flow-implementation
description: 'Use when asked to implement or debug OAuth 2.0/2.1 flows (authorization code+PKCE, client credentials, device flow, refresh rotation) or token validation and RFC compliance. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# OAuth 2.0 flow implementation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing or debugging OAuth 2.0/2.1 flows (authorization code+PKCE, client credentials, device flow, refresh rotation), token validation, or RFC 6749/6750/7636/8252/8628 compliance questions. |
| Authority | Write only inside the target project's authentication implementation directory. Rollback uses VCS. |
| Side effect | Writes authentication code and routes; stores tokens server-side. No credential provisioning, user account mutation, or infrastructure changes outside the auth implementation. |
| Done | Every security-checklist row satisfied and verified; raw tokens never logged or client-stored; no implicit flow or response_type=token. |

## Inputs

Required:
- Target authorization server URL and metadata endpoint
- OAuth flow type: `authorization_code` (with PKCE), `client_credentials`, `device_authorization`, or `refresh_rotation`
- Client identifier (`client_id`) and, for confidential clients, `client_secret`
- Redirect URI(s) registered at the authorization server
- Required scope(s)
- Target language or framework

Optional:
- Token endpoint URL (if not derivable from the server metadata endpoint)
- Existing partial implementation to extend

## Procedure

1. **Scope the target.** Confirm the target authorization server supports the chosen flow. Verify redirect URIs are pre-registered for `authorization_code`. If extending an existing implementation, read the current auth code to identify the seam before adding or changing anything. Done when: the server supports the flow and the implementation seam is identified.

2. **Validate inputs at their trust boundary.** Reject any redirect URI that is not an exact pre-registered value. Reject any `client_id` that does not match the registered client. Halt if the authorization server metadata endpoint returns a version below 2.0. These values arrive from the network or user input; treat them as untrusted. Done when: all inputs pass trust-boundary validation or are rejected with the violated rule.

3. **Bound the scope before mutation.** If the requested task scope would modify credential provisioning, user account management, or token storage in a live database, refuse. Only auth implementation code and its associated server-side token storage are in scope. Done when: scope is confirmed within auth implementation boundaries or refused.

4. **Generate the implementation.** For the chosen flow:
   - **authorization_code + PKCE**: generate `code_verifier` and `code_challenge` (S256 method), authorization URL construction, token exchange request, CSRF state handling, and server-side session binding. Include refresh token rotation with one-time use validation.
   - **client_credentials**: generate a token request using the client credentials grant, with no user context.
   - **device_authorization**: generate a device code polling loop with expiration handling and user-code display instructions.
   - **refresh_rotation**: generate a refresh token exchange that immediately invalidates the used refresh token and issues a new pair.
   - Do not add an implicit flow, a `response_type=token` branch, or client-side token storage.
   Done when: the implementation for the chosen flow is generated with no implicit flow or client-side token storage.

5. **Verify security requirements.** For every generated artifact, confirm:
   - `code_verifier` is cryptographically random, minimum 43 characters, generated fresh per authorization request.
   - `code_challenge` uses S256 method exclusively.
   - State parameter is present and validated on token exchange (authorization_code flow).
   - Refresh token is stored server-side; no token is written to a client-accessible location.
   - Raw access tokens and refresh tokens do not appear in any log statement or console output.
   - `response_type=token` or implicit grant code paths are absent from the generated output.
   Done when: every security-checklist row is confirmed pass or na for the generated artifacts.

6. **Commit the change.** Stage and commit with a message that names the flow type and RFC sections implemented. Do not push. Rollback path is `git checkout` of the staged files. Done when: the change is committed with flow type and RFC sections in the message, and no push occurs.

## Failure and recovery

- **Invalid inputs**: Halt immediately. Return the specific invalid field and the trust-boundary rule it violates. Do not proceed with guessed values.
- **Security checklist row fails**: Halt immediately. Name the failing row and the generated artifact or configuration that caused it. Do not mark the task done.
- **Dependency unavailable**: Block. Return the missing dependency and the package or endpoint required. Do not substitute a stub that passes tests without the real dependency.
- **Partial result**: If halted mid-procedure, leave staged changes uncommitted. Do not partially merge with working auth code that bypasses the failing check.
- **Non-converged**: If the security checklist cannot be satisfied for the chosen flow configuration, return the specific configuration conflict and the recommended alternative (for example, switching from implicit to authorization_code+PKCE).

## Output

Auth implementation code for the specified OAuth flow: authorization server routes or client helper functions, server-side token storage with no raw token in logs, and a security configuration summary listing each checklist item with pass/fail/na status.
