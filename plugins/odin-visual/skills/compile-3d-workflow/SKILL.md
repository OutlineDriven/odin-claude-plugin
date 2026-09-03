---
name: compile-3d-workflow
description: 'Use when the user asks for direction and a compilable 3D workflow from an interview. Produces a validated local artifact file combining a DAG topology, ontology groups, and closed control loops. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Compile 3D workflow

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for direction and a compilable 3D workflow from an interview. |
| Authority | Reversible local write: produce and validate a local artifact file. No remote mutation. Rollback is local file deletion. |
| Side effect | Writes one local 3D workflow artifact file. |
| Done | A validated local 3D workflow artifact file exists and passes every structural check. |

## Inputs

- A direction interview with the user, supplying: the problem being solved, what success looks like, binding constraints, and what is explicitly out of scope. All four required; none inferred.
- The output file path for the workflow artifact. Required.

## Artifact schema

The workflow artifact is a YAML file with this structure:

```yaml
problem: <string>
success_criteria: <string>
constraints: [<string>, ...]
out_of_scope: [<string>, ...]
topology:
  nodes:
    - id: <string>
      task: <string>
      depends_on: [<node_id>, ...]
ontology:
  groups:
    - name: <string>
      members: [<node_id>, ...]
feedback_loops:
  - name: <string>
    sensor: <string>
    comparator: <string>
    actuator: <string>
```

Every node id referenced in `depends_on` must exist in `nodes`. Every node id in ontology group `members` must exist in `nodes`. Every feedback loop must name a sensor, comparator, and actuator as non-empty strings.

## Procedure

1. Conduct the direction interview. Ask the user for the problem, success criteria, binding constraints, and explicit out-of-scope. Record the answers verbatim. Done when: all four interview inputs are recorded verbatim, or the missing input is named and the skill stops.
2. Author the workflow artifact from the interview answers. Build the three dimensions:
   - Topology: a DAG of tasks. Each node has an id, a task description, and a depends_on list naming the node ids it waits on. No cycles. No node depends on itself. Every depends_on entry must reference an existing node id.
   - Ontology groups: named concept clusters classifying the work domains. Each group names its member node ids. Every group is non-empty. Every member must exist in the topology.
   - Feedback loops: cybernetic control cycles. Each loop names its sensor (what is measured), comparator (what is expected), and actuator (what action re-routes). All three are non-empty strings.
   Done when: the artifact combines all three dimensions from the interview answers.
3. Validate the artifact against the schema. Check every rule:
   - Every node has a unique id and a non-empty task.
   - Every depends_on entry references an existing node id.
   - No cycle exists in the dependency graph (topological sort succeeds).
   - Every ontology group is non-empty and every member references an existing node id.
   - Every feedback loop names a non-empty sensor, comparator, and actuator.
   Done when: every check passes, or the specific defect is named and the skill stops.
4. Write the validated artifact to the output file path as YAML. State the rollback path: delete the local artifact file. No remote state was touched. Done when: the artifact file is written and the rollback path is stated.

## Failure and recovery

- Interview incomplete: if the user cannot supply the problem, success criteria, constraints, or scope, stop and report which inputs are missing. Do not infer or fabricate direction.
- Schema validation failure: if any node lacks dependencies, any ontology group is empty, any feedback loop is missing its sensor, comparator, or actuator, any depends_on entry references a non-existent node, or a cycle exists in the dependency graph, report the specific defect and stop. Do not emit a partial artifact as complete.
- Partial-result rule: a partially written artifact file is not a compiled workflow. Delete it and report the rollback.

## Output

A validated local 3D workflow artifact file (YAML) containing the DAG topology, ontology groups, and feedback loops, with every structural check passing.
