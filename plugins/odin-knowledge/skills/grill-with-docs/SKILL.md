---
name: grill-with-docs
description: 'Use when a repository decision needs an interview plus durable terminology and decision records. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Grill with docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository decision needs an interview plus durable terminology and decision records. |
| Authority | Reversible local: writes only CONTEXT.md and ADR files in the working repository; rollback is version control or undo. No remote mutation. |
| Side effect | CONTEXT and ADR updates during the interview. |
| Done | Frontier empty and no resolved term left unwritten. |

## Inputs

A repository working tree containing a decision to make. Optional: an existing CONTEXT.md and an ADR directory; both are created when absent.

## Procedure

1. Read the code domain model that the decision touches: entry points, types, and the modules on that surface. Bound the interview scope to this surface before any write. Done when: the entry points, types, and modules on the decision surface are read, and the interview scope is bounded to that surface with no write made.
2. Build the frontier: enumerate every unresolved term and open question the decision depends on. Done when: every unresolved term and open question the decision depends on is enumerated, and the frontier list is non-empty or the decision is confirmed to need no interview.
3. For each frontier item, ask one question. Consult the code, then resolve the term or decision against evidence found in the repository. Done when: each frontier item has a question asked, the code is consulted, and the term or decision is resolved against evidence found in the repository or marked unresolved.
4. As each item resolves, write the resolved term into CONTEXT.md and the resolved decision into a numbered ADR file. Done when: each resolved term is written into CONTEXT.md and each resolved decision is written into a numbered ADR file, and both files are confirmed on disk.
5. Repeat until the frontier is empty. Done when: the frontier list is empty, every item is resolved and written or marked open, and no unresolved item remains unrecorded.

## Failure and recovery
- Unresolved term: leave it on the frontier, mark the corresponding CONTEXT or ADR entry as open, and stop rather than write an ungrounded definition.
- Partial result: committed CONTEXT and ADR entries stand; the remaining frontier is reported as open.
- Rollback: revert or delete the CONTEXT.md and ADR files written this session. No other artifacts are touched.

## Output
The output is an updated CONTEXT.md containing every resolved term, one numbered ADR file per resolved decision, and a report listing any frontier items left open.
