---
name: automatic-cybernetic-flow-design
description: 'Use when the user wants to design sensors, actuators, feedback, delay, and oscillation for an interactive system, produce a cybernetic flow design document specifying each component. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Automatic cybernetic flow design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to design sensors, actuators, feedback, delay, and oscillation for an interactive system. |
| Authority | Write only the named local cybernetic flow design document; delete or overwrite that single file to roll back. |
| Side effect | A cybernetic flow design document specifying sensors, actuators, feedback, delay, and oscillation; no source code, runtime, or remote mutation. |
| Done | A cybernetic flow design for an interactive system is produced. |

## Inputs

The user must supply the interactive system description: what state it controls, what it observes, and what actions it can take. Optional inputs: known latency budgets, stability requirements, existing feedback paths, or constraints on sensors and actuators.

## Procedure

1. Require the user to name the interactive system and its primary control objective: the state it tries to hold or steer.
2. Enumerate sensors: list every observable signal the system can read to assess its current state relative to the objective. For each sensor, name the quantity measured and its source.
3. Enumerate actuators: list every action or output the system can produce to change state. For each actuator, name the effect and its range.
4. Design feedback paths: for each sensor, specify which actuator it drives, the comparison that generates the error signal, and the direction of correction.
5. Specify delay: for each feedback path, name the propagation delay between sensing and acting, and mark it as fixed, variable, or bounded with the bound.
6. Analyze oscillation: for each feedback path, state whether the loop gain and delay can produce oscillation, and specify the damping or limiting mechanism if so. If the risk cannot be determined, mark the path under-specified.
7. Compile the five components into a single design document with one section per component and a wiring diagram showing sensor → error → actuator → delay → oscillation for each loop. This skeleton is fixed.
8. Note where the system may switch loops, adjust gains, or reconfigure sensors at runtime without rebuilding the skeleton. This is the dynamic routing allowed inside the compiled structure.
9. Write the document to the named local file. Stop. Do not implement, deploy, or mutate source code.

## Failure and recovery
- Missing system description: stop and request it; write nothing.
- Unbounded delay or unspecified oscillation risk: mark the path under-specified in the document rather than inventing a value; request the missing bound from the user.
- Partial result: if some components cannot be specified, emit the document with completed sections and an explicit gap list; do not claim the done predicate holds for gaps.
- Rollback: delete or overwrite the single design document. No other artifact is touched.

## Output
A cybernetic flow design document containing one section each for sensors, actuators, feedback, delay, and oscillation, plus a wiring diagram and a dynamic-routing note. The document is the terminal artifact.

## Provenance

Origin: user-curated skill idea `automatic-cybernetic-flow-design` from `project-owned:user-curated-skill-ideas`, supplemented by raw source at `project-owned:user-supplied-source-brief`. Revision: none pinned. License: project-owned; clean-room adaptation of the user's brief. The one-line brief "generate sensors, actuators, feedback, delay, and oscillation for interactive systems" was expanded into a bounded, self-contained procedure with explicit failure and rollback rules. No third-party expression was copied.
