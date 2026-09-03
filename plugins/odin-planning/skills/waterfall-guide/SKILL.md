---
name: waterfall-guide
description: 'Use when a user wants to lock greenfield architecture and interfaces early for coherent parallel execution. Produces a locked architecture document with module inventory, interface contracts, cross-cutting ownership, and open questions, distributed to execution teams as the coordination contract.'
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

1. Receive the project brief and any constraints from the human. If the brief is missing or names no product, stop and request it rather than inferring scope. Done when: brief is received and names a product and core capability, or the step has stopped requesting the missing information.
2. Identify the core modules the system requires. For each module, name it, state its single responsibility, and list the data it owns. Do not invent modules the brief does not justify. Done when: every module is named with its responsibility and owned data.
3. Define the interface contracts between modules. For each interface, specify caller and callee modules, request shape (fields and types), response shape (fields and types), error semantics (error codes or categories and their meaning), and versioning strategy (how the contract evolves without breaking callers). Done when: every inter-module interface is specified with all five elements.
4. Identify cross-cutting concerns from the module inventory: for each module, check whether its single responsibility naturally encompasses authentication, logging, configuration, or error propagation. Assign each concern to the module whose responsibility most closely encompasses it. If no module's responsibility encompasses a concern, list it as a blocking open question in step 5 rather than forcing an assignment. Do not leave an assigned concern's ownership ambiguous. Done when: every derivable cross-cutting concern has exactly one owning module, and every non-derivable concern is listed as a blocking open question.
5. Write the architecture document with: system overview (one paragraph naming the product and its purpose), module inventory (table with module name, responsibility, and data owned), interface contracts (one subsection per interface with request, response, errors, and versioning), cross-cutting ownership (table with concern and owning module), and open questions (every decision the human must make before execution begins, marked as blocking or non-blocking). Done when: architecture document is written with all five sections.
6. Present the architecture document to the human for review. Incorporate requested changes. Once the human confirms, lock the document and distribute it to all execution teams. Done when: document is locked and distributed.

## Failure and recovery
- Incomplete brief: the human provides no product name or core capability. Stop at step 1 and request the missing information. Do not infer or fabricate scope.
- Contradictory constraints: the brief or constraints name incompatible technologies or impossible deadlines. Surface the contradiction in the open questions section and ask the human to resolve it before proceeding.
- Ambiguous interface: two modules could own the same data or responsibility. List the ambiguity in open questions as a blocking item. Do not assign ownership arbitrarily.
- Partial completion: any step fails after earlier steps produced artifacts. Discard partial outputs. The locked architecture is all-or-nothing; partial results are not distributed.
- Non-convergence: the human requests changes that contradict the existing architecture without withdrawing the contradiction. Stop and state the conflict explicitly. Do not silently overwrite prior decisions.

## Output
A locked architecture document with sections in order: system overview, module inventory, interface contracts, cross-cutting ownership, open questions. Distributed to all execution teams as the coordination contract for parallel work.
