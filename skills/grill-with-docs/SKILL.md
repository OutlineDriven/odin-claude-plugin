---
name: grill-with-docs
description: 'Use when a repository decision needs an interview plus durable terminology and decision records; interview the code domain model, then write each resolved term and decision into CONTEXT and ADR files. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Grill with docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository decision needs an interview plus durable terminology and decision records. |
| Authority | Write only to CONTEXT.md and ADR files in the working repository; reversible by deleting or reverting those local artifacts. |
| Side effect | CONTEXT and ADR updates during the interview. |
| Done | Frontier empty and no resolved term left unwritten. |

## Inputs

A repository working tree containing a decision to make. Optional: an existing CONTEXT.md and an ADR directory; both are created when absent.

## Procedure

1. Read the code domain model that the decision touches: entry points, types, and the modules on that surface. Bound the interview scope to this surface before any write. Done when: the stated action, evidence, and guard all hold.
2. Build the frontier: enumerate every unresolved term and open question the decision depends on. Done when: the stated action, evidence, and guard all hold.
3. For each frontier item, ask one question. Consult the code, then resolve the term or decision against evidence found in the repository. Done when: the stated action, evidence, and guard all hold.
4. As each item resolves, write the resolved term into CONTEXT.md and the resolved decision into a numbered ADR file. Done when: the stated action, evidence, and guard all hold.
5. Repeat until the frontier is empty. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- Unresolved term: leave it on the frontier, mark the corresponding CONTEXT or ADR entry as open, and stop rather than write an ungrounded definition.
- Partial result: committed CONTEXT and ADR entries stand; the remaining frontier is reported as open.
- Rollback: revert or delete the CONTEXT.md and ADR files written this session. No other artifacts are touched.

## Output
The output is an updated CONTEXT.md containing every resolved term, one numbered ADR file per resolved decision, and a report listing any frontier items left open.
