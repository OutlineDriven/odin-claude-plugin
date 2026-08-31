---
name: environment-contract-audit
description: 'Use when environment-dependent code, templates, or deployment configuration changes, or when runtime configuration is missing. Produces a bidirectionally reconciled environment-variable contract.'
---

# Environment contract audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Environment-dependent code, templates, or deployment configuration changes, or runtime configuration is missing. |
| Authority | Read-only local inspection. Approval required only for production secret, credential, or remote configuration mutation: make one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Bidirectionally reconciled environment-variable contract. |
| Done | Every referenced variable is supplied and documented at the correct required/optional and public/secret scope. |
| Stop | exact blocker; unsafe exposure. Bound: declared code, templates, runtime config, and deployment-config surfaces. |

## Inputs

- Declared surfaces (required): the code, templates, runtime config files, and deployment config to audit. Named by the user or inferred from the change diff.
- Supply sources (required): env files, CI secret definitions, deployment manifests, and any other location that provides variable values.

## Procedure

1. Enumerate every environment variable referenced across the declared surfaces. Split each into required vs optional and public vs secret. **Done when:** the full variable inventory is compiled with scope annotations.
2. For each variable, check the supply side (env files, CI secrets, deployment config) and the consumption side (code reads, template interpolations). Bidirectionally reconcile: flag variables consumed but not supplied, supplied but not consumed, and scope mismatches (a secret consumed where a public value is expected, or vice versa). **Done when:** every variable has a supply-side and consumption-side status recorded.
3. For each mismatch, determine the correct resolution: add the missing supply, remove the dead reference, correct the scope, or document the intentional override. Do not mutate production secrets, credentials, or remote config without the start approval. **Done when:** every mismatch has a named resolution.
4. Produce the reconciled contract: a table listing each variable with its name, required/optional scope, public/secret scope, supply source, consumption sites, and resolution status. **Done when:** the contract table is complete and every variable is accounted for.

## Failure and recovery

- Exact blocker: a variable's supply or consumption cannot be determined from the declared surfaces. Stop and report the blocker; do not guess a resolution.
- Unsafe exposure: a secret or credential would be placed in a public scope or a location that leaks it. Stop before the exposure; report the risk and the correct secret scope.

## Output

A bidirectionally reconciled environment-variable contract: a table of every referenced variable with required/optional scope, public/secret scope, supply source, consumption sites, and resolution status. Terminal classification: `reconciled` (every variable supplied and documented at correct scope), `partial` (some mismatches remain with named resolutions), `blocked` (an exact blocker prevents reconciliation), or `unsafe-exposure` (a secret would be exposed; stopped before mutation).
