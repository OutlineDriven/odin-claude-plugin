---
name: compile-3d-workflow
description: 'Use when the user asks for direction and a compilable 3D workflow from an interview. Produces a verified local artifact combining graph topology, ontology groups, and feedback loops. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Compile 3D workflow

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for direction and a compilable 3D workflow from an interview. |
| Authority | Reversible local write: produce and verify a local artifact file; prepare a tracker projection plan or payload; do not create, update, or bulk-mutate remote tracker items. |
| Side effect | Writes one local artifact file and optionally one local projection plan or payload file. No remote tracker mutation. Rollback is local file deletion. |
| Done | A compilable local 3D workflow artifact is produced and verified; any supported tracker projection is prepared as a plan or payload but not executed. |

## Inputs

- A direction interview with the user, supplying: the problem being solved, what success looks like, binding constraints, and what is explicitly out of scope. All four must be supplied; none are inferred.
- Optional: a request to project the workflow onto a tracker. If supplied, the tracker target is named but not contacted.

## Procedure

1. Conduct the direction interview. Ask the user for the problem, success criteria, binding constraints, and explicit out-of-scope. Record the answers verbatim. Done when: all four interview inputs are recorded verbatim or the missing input is named and the skill stops.
2. Compile the 3D workflow artifact from the interview answers, combining three dimensions:
   - **Graph topology**: a semi-deterministic DAG of tasks with named dependencies. The skeleton is fixed; routing inside it may change dynamically.
   - **Ontology groups**: named concept clusters that classify the work domains, each non-empty.
   - **Feedback loops**: cybernetic control cycles, each naming its sensor (what is measured), comparator (what is expected), and actuator (what action re-routes).
   Done when: the artifact combines all three dimensions from the interview answers.
3. Verify the artifact compiles: every task node has defined dependencies; every ontology group is non-empty and named; every feedback loop names its sensor, comparator, and actuator; the skeleton is fixed while internal routing may vary. Done when: every compile check passes or the specific defect is named and the skill stops.
4. If the user requested tracker projection, prepare a projection plan or payload mapping workflow nodes to tracker items. Write it to a local file. Do not create, update, or bulk-mutate any remote tracker item. Stop and hand the plan or payload to the human. Done when: the projection plan or payload is written locally and no remote tracker item was mutated.
5. Write the verified artifact to a local file. State the rollback path: delete the local artifact file and, if present, the projection file. No remote state was touched. Done when: the artifact file is written and the rollback path is stated.

## Failure and recovery
- **Interview incomplete**: if the user cannot supply the problem, success criteria, constraints, or scope, stop and report which inputs are missing. Do not infer or fabricate direction.
- **Artifact does not compile**: if any task node lacks dependencies, any ontology group is empty, or any feedback loop is missing its sensor, comparator, or actuator, report the specific defect and stop. Do not emit a partial artifact as complete.
- **Remote mutation attempted**: if any step would create, update, or bulk-mutate a remote tracker item, stop before execution. The projection is a plan or payload only; a human performs it.
- **Non-mutation rule**: no remote tracker item is created, updated, or bulk-mutated by this skill. Rollback is local file deletion; no remote state requires recovery.

## Output
Compilable local 3D workflow artifact file (graph topology, ontology groups, feedback loops, verified against compile checks), optionally a local tracker projection plan or payload file (not executed).
