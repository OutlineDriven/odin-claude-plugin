---
name: nodejs-service-foundations
description: 'Use when asked to set up or harden Node.js service foundations: env/secrets configuration, structured logging, error taxonomy, module system, native TypeScript. Not for dedicated shutdown implementation — use nodejs-graceful-shutdown.'
---

# Node.js service foundations

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Setting up or hardening Node.js service foundations: env/secrets configuration, structured logging, error taxonomy, module system, native TypeScript (type stripping). |
| Authority | Reversible local edits: write only named local artifacts (env schema, logger, error classes, tsconfig, package scripts); state the rollback path before each write. |
| Side effect | Writes service scaffolding files (env schema, logger module, error class definitions, tsconfig.json, package.json scripts). |
| Done | Service starts with validated env (invalid config fails fast), emits structured logs with secret redaction, throws typed coded errors, and runs under type stripping or tsc with no errors. |

## Inputs

- **Project root** (required): the directory containing or to receive `package.json`.
- **Env schema definition** (required): list of environment variable names and types, and whether each is required or optional with a default.
- **Secret field names** (required): list of env keys whose values must be redacted in log output.
- **Error code catalogue** (required): list of `{ code, message, httpStatus }` tuples for the service's domain errors.

## Procedure

1. **Bound scope.** Confirm the project root exists and contains or will contain a `package.json`. Record every file this procedure will create or overwrite. State the rollback path: `git checkout -- <files>` if the project is tracked, or delete the listed files if untracked. Done when: scope is bounded and rollback path is stated.

2. **Validate environment at startup.** Create an env schema module (e.g. `src/env.ts`) that reads `process.env` at import time. For each declared variable: parse the value against its type (string, number, boolean, URL); if required and missing or malformed, throw a descriptive error and exit with code 1 before any server binding. Export the frozen validated config object. Do not allow the service to start with invalid or missing configuration. Done when: env schema module validates all declared variables and fails fast on invalid config.

3. **Configure structured logging.** Create a logger module (e.g. `src/logger.ts`) using a structured JSON logger (pino or equivalent). Configure the log level from env, ISO-8601 timestamps, and a request-id correlation field. Implement a redaction serializer that replaces values of secret field names with `[REDACTED]` at every log level. Export a singleton logger instance. Done when: logger module emits structured JSON with secret redaction at every level.

4. **Define typed error classes.** Create an error module (e.g. `src/errors.ts`) exporting a base `ServiceError` class with fields `code: string`, `message: string`, `httpStatus: number`, and `cause?: Error`. For each entry in the error code catalogue, export a named subclass or factory. Ensure `instanceof ServiceError` works for error-handling middleware to map codes to HTTP responses. Done when: error module exports ServiceError base and all catalogue entries with instanceof working.

5. **Configure module system.** In `package.json`, set `"type": "module"` for ESM. If the project requires CJS interop, add an explicit `"exports"` field mapping entry points. Ensure `"engines"` declares the minimum Node.js version (>= 22.12 for native type stripping or >= 23.6 for `--experimental-strip-types`). Remove any `"type": "commonjs"` or ambiguous dual-package fields. Done when: package.json declares ESM with engines and no ambiguous dual-package fields.

6. **Set up native TypeScript type stripping.** Create `tsconfig.json` with `"compilerOptions": { "erasableSyntaxOnly": true, "verbatimModuleSyntax": true, "strict": true, "module": "nodenext", "moduleResolution": "nodenext", "target": "es2024" }`. Add `"scripts"` to `package.json`: `"start": "node --experimental-strip-types src/index.ts"`, `"build": "tsc"`, `"typecheck": "tsc --noEmit"`. This allows running `.ts` files directly without a build step while keeping `tsc` available for CI type checking. Done when: tsconfig.json and package.json scripts enable direct .ts execution with tsc available for CI.

7. **Enforce async patterns.** Every async entry point must have a top-level `try/catch` that logs the error via the structured logger and exits with code 1. Never allow unhandled promise rejections. Use `AbortController` for graceful shutdown: listen for `SIGTERM`/`SIGINT`, call `controller.abort()`, drain in-flight requests, then exit. Done when: every async entry point has try/catch with structured logging and AbortController shutdown wiring.

8. **Write package scripts.** Ensure `package.json` contains: `"start"` (run with type stripping), `"build"` (tsc compile), `"typecheck"` (tsc --noEmit), `"lint"` (Biome), `"test"` (node --test or vitest). Verify each script runs without error. Done when: all five scripts exist and each runs without error.

9. **Verify end state.** Run `node --experimental-strip-types src/index.ts` with valid env and confirm: server binds, startup log emits as structured JSON with secrets redacted. Run with a missing required env var and confirm: process exits with code 1 and a descriptive error before any server binding. Run `tsc --noEmit` and confirm: zero type errors. Done when: valid-env startup emits structured redacted JSON, invalid-env exits code 1 before binding, and `tsc --noEmit` reports zero errors.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| Invalid or missing env var | Env schema validation throws at import time | Process exits code 1 with descriptive message listing the missing/invalid vars. Do not start the server. |
| Logger redaction miss | Secret value appears unredacted in log output | Halt: the redaction serializer is misconfigured. Fix the field-name list before proceeding. |
| Type error on `tsc --noEmit` | Compiler emits diagnostics | Fix the type errors. Do not suppress with `@ts-ignore` or `any`. |
| Unhandled promise rejection | Node emits `unhandledRejection` event | Add the missing `try/catch` or `.catch()` at the identified call site. |
| Partial write on rollback | Some files written, others not | Use the recorded rollback path: `git checkout -- <written files>` or delete the listed untracked files. |

## Output

Local named files: src/env.ts (validated env schema), src/logger.ts (structured JSON logger with redaction), src/errors.ts (typed ServiceError base and subclasses), tsconfig.json (strict type-stripping config), package.json (ESM, engines, scripts). All reversible via the stated rollback path.
