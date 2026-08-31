---
name: dataflow-diagram
description: 'Use when asked to visualize data movement, ETL or ELT, lineage, transformations, custody, governance, stores, sources, or consumers. Produces a typed dataflow JSON spec and one self-contained interactive HTML artifact with a hash-bound receipt and truthful visual-review status.'
---

# Dataflow diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize data movement, ETL or ELT, lineage, transformation stages, custody, governance, stores, sources, or consumers. |
| Authority | Reversible local: write only the named local artifacts below and delete them to roll back. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes a typed dataflow JSON specification and one self-contained interactive HTML artifact, with optional bounded visual-evidence sidecars. |
| Done | The diagram represents the requested movement and custody facts without inferred causality, validates against both schemas, passes all showcase and atomic-delivery checks, and has a hash-bound receipt plus truthful visual-review status. |

## Inputs

The user must supply the data contracts and movement facts to depict: sources, stores, consumers, transformation stages, custody owners, and the flows between them. Optional inputs are governance labels, lineage annotations, and a request for visual-evidence sidecars. Do not infer a flow, stage, custody assignment, or causal relationship the user did not state; ask for the missing fact rather than inventing it.

## Procedure

1. Bound scope before mutation: confirm the requested movement and custody facts, and list the exact local files to write (the dataflow JSON specification and one self-contained interactive HTML artifact, plus any requested visual-evidence sidecars). Write nothing else. Done when: the file set is listed and confirmed before any mutation.
2. Model the dataflow as stages, nodes, flows, and semantic kinds using only the user-supplied facts. Record each node's kind (source, store, transformation, consumer, governance checkpoint) and each flow's source, target, and custody owner as stated. Add no flow, stage, or causal edge the user did not provide. Done when: the model contains only user-supplied facts with no inferred edges.
3. Serialize the model into the typed dataflow JSON specification. Validate it strictly against the dataflow schema and the common schema: every required field present, every semantic kind from the allowed set, every flow resolvable to declared nodes, and no extra or unknown fields accepted. Done when: the JSON specification validates strictly against both schemas.
4. Render one self-contained interactive HTML artifact from the validated specification. The artifact must load with no external network or runtime dependency, render the stages and flows with their semantic kinds and custody owners, and let a reader traverse the movement interactively. Done when: the HTML artifact loads with no external dependency and renders all stages and flows interactively.
5. Run the showcase check (the artifact renders the full requested movement and custody facts) and the atomic-delivery check (the JSON specification and the HTML artifact are each complete and usable on their own). If either fails, fix the artifact or specification and re-run; do not declare done on a partial pass. Done when: both the showcase and atomic-delivery checks pass.
6. Capture a hash-bound receipt: record the SHA-256 of the delivered JSON specification and HTML artifact, and the schema versions validated against. Record a truthful visual-review status stating whether a human visually confirmed the rendered artifact, was not yet reviewed, or reviewed and found defects; never mark unreviewed output as confirmed. Done when: the receipt records both hashes, schema versions, and a truthful visual-review status.
7. If visual-evidence sidecars were requested, produce only the bounded set asked for (for example, a screenshot or rendered snapshot of the artifact) and name them in the receipt. Do not generate unrequested sidecars. Done when: requested sidecars are produced and named in the receipt, or no sidecars are produced when none were requested.

## Failure and recovery
- Schema validation failure: the specification does not validate against the dataflow schema or the common schema. Do not write the HTML artifact. Report the failing field and rule, correct the specification against the user-supplied facts, and re-validate. Never relax strict validation to force a pass.
- Inferred-causality violation: a flow, stage, custody assignment, or causal edge was added that the user did not state. Remove the inference, re-validate, and re-render. If the user's facts are genuinely insufficient, stop and report the missing fact rather than filling it in.
- Showcase or atomic-delivery check failure: the artifact does not render the full requested movement, or one deliverable is incomplete. Fix and re-run both checks; a partial pass is not done.
- Visual-review defect: a human reviewed the rendered artifact and found defects. Record the defect truthfully in the visual-review status, fix the specification or artifact, re-render, and re-validate; do not mark a defective artifact as confirmed.
- Rollback: every effect is a local write of the named artifacts. To roll back, delete the written JSON specification, HTML artifact, and any visual-evidence sidecars; no other state is touched.
- Blocked result: if a required user fact cannot be obtained or a check cannot pass without inference, stop and return the exact blocked state with the failing check and the missing input, rather than pretending the done predicate holds.

## Output
A typed dataflow JSON specification, one self-contained interactive HTML artifact, any requested bounded visual-evidence sidecars, and a hash-bound receipt listing the delivered file hashes, the schema versions validated against, and a truthful visual-review status. The terminal classification is done only when the done predicate holds; otherwise it is blocked with the named failing check.
