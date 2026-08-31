---
name: automatic-cybernetic-flow-design
description: 'Use when the user wants a closed-loop control flow designed. Covers sensors, actuators, feedback loops, delay, and oscillation for an interactive system. Produces a cybernetic flow design document specifying each component. Not for remote, credential, publish, deploy, or irreversible changes.'
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

The user must describe the interactive system: what state it controls, what it observes, and what actions it can take. Optional inputs include known latency budgets, stability requirements, existing feedback paths, or constraints on sensors and actuators.

## Procedure

1. Require the user to name the interactive system and its primary control objective: the state it tries to hold or steer. Done when: the system and its control objective are named.
2. Enumerate sensors: list every observable signal the system can read to assess its current state relative to the objective. For each sensor, name the quantity measured and its source. Done when: every sensor is listed with its quantity and source.
3. Enumerate actuators: list every action or output the system can produce to change state. For each actuator, name the effect and its range. Done when: every actuator is listed with its effect and range.
4. Design feedback paths: for each sensor, specify which actuator it drives, the comparison that generates the error signal, and the direction of correction. Done when: every sensor is paired with its actuator, error comparison, and correction direction.
5. Specify delay: for each feedback path, name the propagation delay between sensing and acting, and mark it as fixed, variable, or bounded with the bound. Done when: every feedback path has its delay specified and classified.
6. Analyze oscillation: for each feedback path, state whether the loop gain and delay can produce oscillation, and specify the damping or limiting mechanism if so. If the risk cannot be determined, mark the path under-specified. Done when: every feedback path has its oscillation risk stated with a damping mechanism or an under-specified marker.
7. Compile these five components into a single design document with one section per component and a wiring diagram showing sensor → error → actuator → delay → oscillation for each loop. This skeleton is fixed. Done when: the document has one section per component and a wiring diagram per loop.
8. Record where the system may switch loops, adjust gains, or reconfigure sensors at runtime without rebuilding the skeleton. This is the dynamic routing allowed inside the compiled structure. Done when: the dynamic routing note is recorded.
9. Write the document to the named local file. Stop. Do not implement, deploy, or mutate source code. Done when: the document is written to the named local file and no source code is mutated.

## Failure and recovery
- Missing system description: stop and request it; write nothing.
- Unbounded delay or unspecified oscillation risk: mark the path under-specified in the document rather than inventing a value; request the missing bound from the user.
- Partial result: if some components cannot be specified, emit the document with completed sections and an explicit gap list; do not claim the done predicate holds for gaps.
- Rollback: delete or overwrite the single design document. No other artifact is touched.

## Output
A cybernetic flow design document ordered: sensors, actuators, feedback, delay, oscillation, wiring diagram, dynamic-routing note — the document is the terminal artifact.
