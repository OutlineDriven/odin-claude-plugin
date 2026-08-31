---
name: waterfall-guide
description: 'Use when a user wants to lock greenfield architecture and interfaces early for coherent parallel execution. Produces locked architecture and interface contracts distributed to execution teams. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Waterfall guide

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to lock greenfield architecture and interfaces early for coherent parallel execution. |
| Authority | Reversible-local: write only named local architecture and interface contract files; rollback by deleting the produced artifacts. |
| Side effect | Local write of locked architecture and interface contracts used to coordinate parallel execution. |
| Done | Greenfield architecture and interface contracts are locked and distributed. |

## Inputs

- Project brief describing the system to build (required). Must name the product, its primary users, and the core capability.
- Constraints: technology stack, deployment target, team count, deadline, or external integrations (optional but recommended; absence means the skill works from the brief alone).
- Existing codebase or prior decisions to incorporate (optional; absence means greenfield). If supplied, the skill reads only the named paths and does not explore beyond them.

## Procedure

1. Receive the project brief and any constraints from the human. If the brief is missing or names no product, stop and request it rather than inferring scope.
2. Identify the core modules the system requires. For each module, name it, state its single responsibility, and list the data it owns. Do not invent modules the brief does not justify.
3. Define the interface contracts between modules. For each interface, specify: the caller and callee modules, the request shape (fields and types), the response shape (fields and types), the error semantics (error codes or categories and their meaning), and the versioning strategy (how the contract evolves without breaking callers).
4. Identify cross-cutting concerns: authentication, logging, configuration, error propagation. Assign each to exactly one owning module. Do not leave ownership ambiguous.
5. Write the architecture document. Structure: system overview (one paragraph naming the product and its purpose), module inventory (table: module name, responsibility, data owned), interface contracts (one subsection per interface with request, response, errors, versioning), cross-cutting ownership (table: concern, owning module), and open questions (list any decision the human must make before execution begins; mark each as blocking or non-blocking).
6. Present the architecture document to the human for review. Incorporate requested changes. Once the human confirms, lock the document and distribute it to all execution teams.

## Failure and recovery
- **Incomplete brief**: the human provides no product name or core capability. Result: stop at step 1 and request the missing information. Do not infer or fabricate scope.
- **Contradictory constraints**: the brief or constraints name incompatible technologies or impossible deadlines. Result: surface the contradiction in the open questions section and ask the human to resolve it before proceeding.
- **Ambiguous interface**: two modules could own the same data or responsibility. Result: list the ambiguity in open questions as a blocking item. Do not assign ownership arbitrarily.
- **Partial completion**: any step fails after earlier steps produced artifacts. Result: discard partial outputs. The locked architecture is all-or-nothing; partial results are not distributed.
- **Non-convergence**: the human requests changes that contradict the existing architecture without withdrawing the contradiction. Result: stop and state the conflict explicitly. Do not silently overwrite prior decisions.

## Output
A locked architecture document containing: system overview, module inventory, interface contracts with request/response/error/versioning details, cross-cutting ownership assignments, and an open-questions list. The document is distributed to all execution teams as the coordination contract for parallel work.

## Provenance

- Origin: curated:curated-ideas:curated-018 from project-owned:user-curated-skill-ideas (Planning, maps, and workflow synthesis section: "lock greenfield architecture and interfaces early enough for coherent parallel execution").
- Supplementary raw source: project-owned:user-supplied-source-brief (Korean chat log; architectural planning discussion context).
- Revision: not pinned (source is a living curated ideas document).
- License: project-owned (curated ideas artifact produced within the ODIN project).
- Adaptation: clean-room adaptation from the one-line curated brief into a complete procedural skill. No third-party expression copied.
