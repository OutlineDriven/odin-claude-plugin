---
name: refactor-break-compat
description: 'Use when modernizing APIs, removing compat shims, killing feature flags, or rewriting a subsystem cleanly. Deletes old paths and rewrites every caller to the new contract with zero legacy residue. Not for additive refactors that must preserve the old path.'
disable-model-invocation: true
---

# Breaking refactors

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Modernizing APIs, removing compat shims, killing feature flags, rewriting a subsystem cleanly. |
| Authority | Human-only-external-or-irreversible: require explicit human invocation; preview target and consequence before any irreversible deletion. |
| Side effect | Deletes compat/adapter/flag code and rewrites every caller and test wholesale; local-delete-unrecoverable. |
| Done | Zero-residue grep, all callers on new contract, tests green on new behavior (exit 0). |

## Refusals

- Additive refactors that keep the old path: rejected. This skill demolishes the old path. Use a regular refactor if the old path must survive.
- Shipping the intermediate state (half old, half new): rejected. Finish or revert to the version-control baseline.
- Widening scope beyond the demolition manifest: rejected. Do not widen scope to resolve a finding.

## Inputs

- Old API surface (required): the compat shims, legacy adapters, feature flags, version gates, and backward-compatible interfaces to demolish.
- New API surface (required): the target contract every caller must adopt.
- Scope (optional): file or module boundaries; when omitted, the blast-radius map determines scope.

## Procedure

1. Map the blast radius. Enumerate every file, module, and caller of the old shape using `ast-grep` or `rg`. This is the demolition manifest. **Done when**: the demolition manifest is complete.
2. Delete the old path. Remove compat layers, adapters, legacy branches, and every flag that fed them. No commenting out. Delete. **Done when**: the old path is deleted from every file in the manifest.
3. Rewrite every caller to the new contract. Migrate all references from step 1. After each batch, run the strongest static enumerator the project has (compiler or typechecker, including opt-in: `mypy`, `pyright`, `tsc --checkJs`, Sorbet). Never sufficient alone: no static pass sees reflective, dynamically dispatched, string-constructed, or generated references, nor code excluded from the build. Enumerate those by hand and name them in the report. **Done when**: every caller in the manifest is on the new contract and the static enumerator passes.
4. Rewrite tests to the new truth. Update assertions to the new behavior. Delete tests whose entire purpose was the old behavior. Add tests for the new contract where coverage is now thin. **Done when**: tests assert the new behavior and the old-behavior tests are deleted.
5. Exterminate ghosts. Grep for string references, config keys, env vars, doc links, error messages, and import paths naming the old API. Zero survivors. **Done when**: the grep returns nothing.
6. Strip dead weight. Remove imports, packages, dependencies, types, and dead files that only the old path needed. **Done when**: no dead weight from the old path remains.
7. Verify zero residue. A search for every old symbol, flag, and format name returns nothing. If it returns anything, return to step 3. **Done when**: the zero-residue search returns nothing.

## Failure and recovery

- Residue remains: old references survive in code, tests, docs, or config after step 7. Return to step 3; do not widen scope beyond the demolition manifest.
- Build or tests broken: migration incomplete, callers or assertions not yet on the new shape. Fix forward if within scope; if scope is exhausted, report the exact blockers and stop.
- Migration stalled: codebase is half old, half new. Finish or revert to version-control baseline; never ship the intermediate state.

Partial results are never reported as success. If any failure class triggers, the done predicate does not hold.

## Output

A migration report with blast-radius manifest, deleted artifacts list, caller-migration checklist, test-rewrite summary, zero-residue verification result, and final exit code (0 = clean demolition, 1 = residue, 2 = broken build, 3 = stalled migration), ordered as listed.
