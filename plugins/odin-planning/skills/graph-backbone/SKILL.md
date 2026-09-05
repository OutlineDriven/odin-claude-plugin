---
name: graph-backbone
description: 'Use when defining, revising, or gate-replanning the project structural backbone in project-root graph.yaml. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Graph backbone

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Define, revise, or replan the project structural backbone in project-root `graph.yaml`. |
| Authority | Reversible local: writes only project-root `graph.yaml`; rollback is restoring the checkpointed prior bytes. Does not execute graph nodes. No remote mutation. No VCS mutation. |
| Side effect | Create `graph.yaml`, append a topology revision, or change only gate-authorized focus nodes within the current revision. No other repository file may change. |
| Done | `graph.yaml` uses schema `odin.graph/v1`; contains only valid declared node and edge types; retains immutable topology within each revision and untouched additive metadata; and limits every focus replan to its authorizing gate. |

## Inputs

- Supply the project root and one operation: create a backbone, create a topology revision, or replan focus nodes under a declared gate.
- Supply a unique non-empty revision identifier and the complete proposed node and edge sets for creation or topology change.
- Supply the declared gate and its exact permitted focus-node IDs for a focus replan.
- Supply the project's existing append-only transition-ledger representation for a topology change when `graph.yaml` does not already make that representation unambiguous.
- Treat an existing project-root `graph.yaml` as required input for revision or replanning and optional input for creation.

## Procedure

1. Resolve the project root, bind the write set to its single `graph.yaml`, and checkpoint the file byte-for-byte; record absence as the creation checkpoint. Permit no other write target. Outside this procedure, permit only the designated read-only status consumer to read the file; no other workflow may read or write it, and no code-changing workflow may depend on it. Done when: the project root resolves to an absolute path, the checkpoint bytes are recorded or absence noted, and no write target outside graph.yaml is open.
2. Classify the requested operation before mutation. Any node addition, removal, identifier change, type change, or edge addition, removal, endpoint change, or type change is a topology change. A focus replan may alter only an existing gate's focus-node data. Done when: the operation is labeled create, topology-change, or focus-replan, and every proposed change is classified as topology or non-topology before any mutation.
3. Read `references/graph-schema.md`, then parse the existing file when present. Require `schema`, `revision`, `nodes`, and `edges`; require schema `odin.graph/v1`; require a non-empty revision; require unique non-empty node IDs and non-empty labels; and require every edge endpoint to name an existing node. Reject an unknown schema version, node type, edge type, duplicate node ID, or dangling edge. Done when: the schema reference is loaded, the existing file parses or its absence is confirmed, and every required field, node ID, edge endpoint, and type is validated or rejected with a named violation.
4. Accept exactly the node types `Invariant`, `Surface`, `Store`, `Hazard`, and `Decision`, and exactly the edge types `constrains`, `reads`, `writes`, and `fails-when`. Preserve every unknown top-level and per-record field without interpreting, normalizing, reordering, or deleting it. Done when: every node type is one of the five accepted types, every edge type is one of the four accepted types, and every unknown field is preserved unchanged in the parsed structure.
5. For creation or topology change, statically compile the complete proposed graph against Step 3 and Step 4. Freeze and display the exact revision, nodes, and edges for human approval before writing. Do not infer approval from the initial request or proceed without approval of that frozen backbone. Done when: the proposed graph compiles against the schema without violation, the frozen revision, nodes, and edges are displayed, and the human has approved or withheld approval of that exact set.
6. For a topology change, assign the approved topology a new revision and append its transition through the file's established append-only ledger representation; never rewrite or remove an earlier transition. If that representation is absent or ambiguous, stop before mutation rather than inventing one. Done when: the approved topology carries a new revision identifier, its transition is appended to the ledger, and no earlier transition was rewritten or removed.
7. For a gate replan, retain the current revision, nodes, edges, and transition ledger byte-for-byte. Confirm the named gate exists and authorizes every changed focus-node ID, then alter only that gate's existing focus-node data. Stop if the gate or its focus representation is missing or ambiguous. Done when: the revision, nodes, edges, and ledger are byte-identical to the checkpoint, the named gate is confirmed to exist, and every changed focus-node ID is listed in that gate authorization.
8. Serialize the candidate deterministically. Replay the same classified operation from the checkpoint and require the second serialization to be byte-identical to the first before writing. Done when: the second serialization is byte-identical to the first, or the run stops with nondeterministic-replay and the checkpoint is restored.
9. Write only `graph.yaml`, read it back, and repeat the complete schema, topology-immutability, metadata-preservation, ledger, gate-scope, and deterministic-replay checks. The graph may control subsequent plan sequence, but this procedure neither executes that plan nor authorizes mutation beyond `graph.yaml`. Done when: the written file reads back through every schema, topology-immutability, metadata-preservation, ledger, gate-scope, and deterministic-replay check without violation, and no file other than graph.yaml was written.

## Failure and recovery
Return `invalid-input` for missing operation inputs, `schema-rejected` for any closed-schema or graph-integrity violation, `approval-withheld` when the frozen backbone is not approved, `gate-violation` for an absent gate or out-of-gate focus change, `ledger-undefined` for an absent or ambiguous revision ledger, and `nondeterministic-replay` when replay differs.

Before the write, every failure leaves the repository unchanged. After a write or read-back failure, restore the checkpoint bytes exactly, or remove `graph.yaml` if this run created it, then return `write-verification-failed`. Never leave a partial revision, widen the write set, invent metadata or evidence, swallow an error, or report the done predicate.

Each failure result names the class, operation, failing check, observed evidence, and recovery performed. If exact restoration cannot be verified, return `blocked` with the remaining local difference.

## Output
On success, return the complete project-root `graph.yaml` and a `created`, `revision-appended`, or `focus-replanned` result containing the revision, approved write set, gate when applicable, validation results, replay digest, and rollback checkpoint identity.
