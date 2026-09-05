---
name: oauth2-flow-implementation
description: 'Use when asked to implement, debug, validate, or explain an OAuth 2.1 flow: auth code with PKCE, client credentials, device, or refresh. Also for a failing token exchange. Not for irreversible work.'
---

# OAuth 2.0 flow implementation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing, debugging, or validating an OAuth 2.0/2.1 flow (authorization code+PKCE, client credentials, device flow, refresh rotation), token validation, or RFC compliance. Also fires when explaining why a token exchange fails or a flow rejects a request. |
| Authority | Reversible local: writes only inside the target project's authentication implementation directory; rollback is version control. No remote mutation except the user-gated live token exchange test required to verify the flow end to end. Covers auth flows, secret handling, and test-driven token exchange. |
| Side effect | Writes authentication code, routes, and test files. Stores tokens server-side. No credential provisioning, user account mutation, or infrastructure changes outside the auth implementation. |
| Done | Authentication code written and verified through a successful end-to-end token exchange or rotation against the real authorization server, with all secrets redacted and no implicit flow or response_type=token. |

## Inputs

Required:
- Target authorization server metadata URL
- OAuth flow type: `authorization_code` (with PKCE), `client_credentials`, `device_authorization`, or `refresh_rotation`
- Client identifier (`client_id`) and, for confidential clients, `client_secret`
- Redirect URI(s) registered at the authorization server
- Required scope(s)
- Target language or framework

Optional:
- Token endpoint URL (if not derivable from the server metadata endpoint)
- Existing partial implementation to extend or debug
- A failing token exchange request and response to diagnose

## Procedure

1. **Fetch authorization server metadata.** Request the metadata endpoint to determine flow constraints: PKCE support, supported grant types, token endpoint auth methods, and supported scopes. If the metadata endpoint is unreachable or returns a version below 2.0, halt. Done when: the server metadata is fetched and the chosen flow is confirmed supported.

2. **Validate inputs at their trust boundary.** Reject any redirect URI that is not an exact pre-registered value. Reject any `client_id` that does not match the registered client. If extending or debugging an existing implementation, read the current auth code to identify the seam and the failing path before changing anything. Done when: all inputs pass trust-boundary validation or are rejected with the violated rule.

3. **Bound the scope before mutation.** If the requested task would modify credential provisioning, user account management, or token storage in a live database, refuse. Only auth implementation code and its associated server-side token storage are in scope. Done when: scope is confirmed within auth implementation boundaries or refused.

4. **Generate or repair the implementation.** For the chosen flow:
   - authorization_code + PKCE: generate `code_verifier` and `code_challenge` (S256 method), authorization URL construction, token exchange request, CSRF state handling, and server-side session binding. Include refresh token rotation with one-time use validation.
   - client_credentials: generate a token request using the client credentials grant, with no user context.
   - device_authorization: generate a device code polling loop with expiration handling and user-code display instructions.
   - refresh_rotation: generate a refresh token exchange that immediately invalidates the used refresh token and issues a new pair.
   - Do not add an implicit flow, a `response_type=token` branch, or client-side token storage.
   Done when: the implementation for the chosen flow is generated or repaired with no implicit flow or client-side token storage.

5. **Implement secret redaction.** Add explicit redaction to every log statement, console output, and error message that could expose a raw access token, refresh token, authorization code, or client secret. Redact by replacing the sensitive value with a fixed marker, not by omitting the log line. Done when: no raw token or secret can appear in any log or console output from the generated code.

6. **Test end-to-end token exchange against the real authorization server.** Preview the authorization server, the chosen flow, and the consequence that a live exchange issues tokens, consumes authorization codes, and invalidates refresh tokens on rotation. After explicit human approval, execute the implementation against the actual authorization server to verify the full flow:
   - authorization_code + PKCE: complete the authorization request, receive the code, exchange it for tokens, and validate the returned access token.
   - client_credentials: request and receive a token using client credentials.
   - device_authorization: initiate the device flow, poll the token endpoint, and receive a token (or confirm the polling loop handles pending and expired states correctly).
   - refresh_rotation: exchange a refresh token for a new pair and confirm the old refresh token is invalidated.
   If approval is withheld, halt without contacting the authorization server. If the server does not support the requested flow, if client credentials are invalid, or if the token exchange fails, halt with the specific error from the server response. Done when: the live test is approved and a successful end-to-end token exchange or rotation completes against the real authorization server.

7. **Verify security requirements.** For every generated artifact, confirm:
   - `code_verifier` is cryptographically random, minimum 43 characters, generated fresh per authorization request.
   - `code_challenge` uses S256 method exclusively.
   - State parameter is present and validated on token exchange (authorization_code flow).
   - Refresh token is stored server-side; no token is written to a client-accessible location.
   - Raw access tokens and refresh tokens do not appear in any log statement or console output.
   - `response_type=token` or implicit grant code paths are absent from the generated output.
   Done when: every security-checklist row is confirmed pass or na for the generated artifacts.

## Failure and recovery

- **Auth server does not support the requested flow**: halt. Return the metadata field that excludes the flow and the recommended alternative (for example, switching from implicit to authorization_code+PKCE).
- Invalid client credentials: halt. Return the server's error response. Do not retry with guessed credentials.
- Token exchange failure: halt. Return the HTTP status, error code, and error description from the server response. If debugging an existing implementation, identify the specific request field or header that caused the rejection.
- Live token-exchange test declined: halt. Do not contact the authorization server. Do not mark the task done.
- Security checklist row fails: halt. Name the failing row and the generated artifact that caused it. Do not mark the task done.
- Dependency unavailable: block. Return the missing dependency and the package or endpoint required. Do not substitute a stub that passes without the real dependency.
- Partial result: if halted mid-procedure, leave changes uncommitted. Do not partially merge with working auth code that bypasses the failing check.

## Output

Auth implementation code for the specified OAuth flow: authorization server routes or client helper functions, server-side token storage with no raw token in logs, test files demonstrating a successful end-to-end token exchange or rotation, and a security configuration summary listing each checklist item with pass/fail/na status.
