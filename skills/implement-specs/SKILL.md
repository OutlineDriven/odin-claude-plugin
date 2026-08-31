---
name: implement-specs
description: 'Use when asked to implement an approved feature from PRODUCT.md and TECH.md, keeping specs and code aligned in the same PR as implementation evolves. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Implement specs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Product and tech specs are approved. |
| Authority | Reversible local: write only named local artifacts staged for the same PR; rollback is uncommitted staging. |
| Side effect | Implements feature and updates specs/tests in the same PR. Local target: code, specs, and tests staged for the surviving PR-shipping flow. |
| Done | Code matches current specs with tests and spec updates in one PR. |

## Inputs

- **Required:** paths to the approved product and tech spec files. Fail if either is absent.
- **Optional:** `PROJECT_LOG.md` for long-running features; `DECISIONS.md` for design rationale.

## Procedure

1. Validate spec files. Confirm the product spec and tech spec exist at the named paths. Stop and report if either is missing.
2. Read the product spec first. Treat it as the source of truth for user-facing behavior, UX, edge cases, and success criteria.
3. Read the tech spec. Treat it as the source of truth for architecture, module boundaries, sequencing, and implementation shape.
4. Plan implementation. Break the feature into concrete, executable steps that satisfy both specs.
5. Implement against specs. Write code and tests, keeping behavior aligned with the product spec and architecture aligned with the tech spec.
6. Update specs in the same PR. If implementation reveals that intended behavior or design should change, update the checked-in spec immediately rather than leaving it stale. Update the product spec when user-facing behavior or success criteria change; update the tech spec when architecture or validation strategy changes.
7. Verify completion. Confirm the code matches the current product and tech specs, tests pass, and all changes are staged together in the same PR.

## Failure and recovery
- **Missing spec:** stop and report the absent file before writing any code.
- **Spec drift:** if code diverges from a spec, either correct the code or update the spec to match the reality discovered during implementation. Do not leave them unsynchronized.
- **Partial work:** the done predicate requires complete implementation; partial progress is not success. Report what remains.
- **Test failure:** do not stage; resolve test failures before concluding the work.
- **Rollback:** uncommitted staged changes are the rollback surface; use `git checkout` on staged paths to restore.

## Output
Staged code, updated specs, and tests in one PR. Done when code matches current specs, tests pass, and everything is staged together.

## Provenance

Origin: `https://github.com/warpdotdev/common-skills` at revision `f589e224907eda566c13755529f59db563090d14`. License: MIT — Copyright (c) 2026 Denver Technologies, Inc. Permissive adaptation permitted with copyright notice retained. Adaptation: converted to ODIN 2.0 literal format; workflow mechanics rewritten in ODIN contract language; related-skills section and generic prose removed; mechanism preserved in the spec-to-implementation loop with same-PR staging.
