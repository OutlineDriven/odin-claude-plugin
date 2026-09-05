---
name: nodejs-service-foundations
description: 'Use when asked to set up or harden Node.js service foundations: env validation, logging, typed errors, type stripping, and shutdown wiring. Not for dedicated shutdown: use nodejs-graceful-shutdown.'
---

# Node.js service foundations

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Setting up or hardening Node.js service foundations: env or secrets configuration, structured logging with redaction, typed error taxonomy, module system, native TypeScript type stripping. |
| Authority | Reversible local: writes only named local artifacts (env schema, logger, error classes, tsconfig, package scripts) and may install the dependencies they need; rollback is version control. No remote mutation. |
| Side effect | Writes service scaffolding files and installs declared dependencies. |
| Done | The service validates startup env (invalid config fails fast), emits structured logs with secret redaction, throws typed coded errors with working instanceof checks and HTTP status mapping, and runs under type stripping or tsc with no errors. |

## Inputs

- Project root (required): the directory containing or to receive `package.json`.
- Environment variables (required): list of env variable names and types, and whether each is required or optional with a default.
- Secret field names (required): list of env keys whose values must be redacted in log output.
- Error catalogue (required): list of `{ code, message, httpStatus }` tuples for the service's domain errors.
- Logger dependency (required): the structured logger the service uses or will use (e.g., pino). Stated as an input, not discovered mid-procedure.

## Procedure

1. **Validate environment at startup.** Create an env schema module (e.g., `src/env.ts`) that reads `process.env` at import time. For each declared variable: parse the value against its type (string, number, boolean, URL); if required and missing or malformed, throw a descriptive error and exit with code 1 before any server binding. Export the frozen validated config object. Do not allow the service to start with invalid or missing configuration. Done when: the env schema module validates all declared variables and fails fast on invalid config.

2. **Configure structured logging with redaction.** Create a logger module (e.g., `src/logger.ts`) using the stated logger dependency. Configure the log level from env, ISO-8601 timestamps, and a request-id correlation field. Implement a redaction serializer that replaces values of every secret field name with `[REDACTED]` at every log level. Export a singleton logger instance. Done when: the logger module emits structured JSON with secret redaction at every log level.

3. **Define a typed-error catalogue with instanceof and HTTP mapping.** Create an error module (e.g., `src/errors.ts`) exporting a base `ServiceError` class with fields `code: string`, `message: string`, `httpStatus: number`, and `cause?: Error`. For each entry in the error catalogue, export a named subclass or factory. Ensure `instanceof ServiceError` works for error-handling middleware to map codes to HTTP responses. Done when: the error module exports `ServiceError` base and all catalogue entries, `instanceof ServiceError` returns true for every subclass instance, and every catalogue code maps to its declared HTTP status.

4. **Wire AbortController signal, drain, and exit.** In the service entry point, create an `AbortController`. Listen for `SIGTERM` and `SIGINT`: call `controller.abort()`, pass the signal to in-flight operations, drain active requests, then exit with code 0 on clean drain or non-zero on timeout. This wires the shutdown spine without implementing the full shutdown handler (that is the job of `nodejs-graceful-shutdown` when a dedicated implementation is needed). Done when: the entry point creates an AbortController, wires both signals to `controller.abort()`, and exits after drain.

5. **Verify startup logs, one invalid-env case, and tsc.** Run the service with valid env and confirm: server binds, startup log emits as structured JSON with secrets redacted. Run with a missing required env var and confirm: process exits with code 1 and a descriptive error before any server binding. Run `tsc --noEmit` and confirm: zero type errors. Verify the typed-error catalogue: instantiate one subclass, confirm `instanceof ServiceError` returns true, and confirm its `httpStatus` matches the catalogue entry. Verify redaction: log a record containing a secret field name and confirm the output shows `[REDACTED]`. Done when: valid-env startup emits structured redacted JSON, invalid-env exits code 1 before binding, `tsc --noEmit` reports zero errors, the instanceof check passes, the HTTP mapping is correct, and the redaction test passes.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| Missing dependency | The stated logger or a required package is not installed | Install it using the project's package manager. If installation fails, stop and report the missing dependency. |
| Invalid or missing env var | Env schema validation throws at import time | Process exits code 1 with descriptive message listing the missing or invalid vars. Do not start the server. |
| Unredacted log | Secret value appears unredacted in log output | Halt: the redaction serializer is misconfigured. Fix the field-name list before proceeding. |
| Unmapped error | A catalogue entry has no matching subclass or HTTP status | Add the missing subclass or factory. Every catalogue entry must have a working instanceof check and HTTP mapping. |
| Type error on tsc --noEmit | Compiler emits diagnostics | Fix the type errors. Do not suppress with `@ts-ignore` or `any`. |
| Partial write on rollback | Some files written, others not | Use the recorded rollback path: `git checkout -- <written files>` or delete the listed untracked files. |

## Output

Local named files: `src/env.ts` (validated env schema), `src/logger.ts` (structured JSON logger with redaction), `src/errors.ts` (typed `ServiceError` base and subclasses with instanceof and HTTP mapping), `tsconfig.json` (strict type-stripping config), `package.json` (ESM, engines, scripts). All reversible via the stated rollback path. The Done proof covers startup logs, invalid-env failure, tsc, instanceof, HTTP mapping, and redaction.
