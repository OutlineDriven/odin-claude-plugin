---
name: automatic-cybernetic-flow-design
description: 'Use when the user wants a cybernetic flow design document for an interactive system. Specifies sensors, actuators, feedback paths, delays, and oscillation risk, and writes the design to a named local file. Not for implementing or deploying the system.'
---

# Automatic cybernetic flow design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a cybernetic flow design document specifying sensors, actuators, feedback paths, delays, and oscillation risk for an interactive system. |
| Authority | Write only the single named local design document; delete or overwrite that file to roll back. Do not implement, deploy, or mutate source code. |
| Side effect | A cybernetic flow design document at the named local path. No source code, runtime, or remote mutation. |
| Done | A design document with sections for sensors, actuators, feedback, delay, oscillation, a wiring diagram, and a dynamic-routing note, written to the named local file. |

## Inputs

Required:
- The interactive system description: what state it controls, what it observes, and what actions it can take.
- The primary control objective: the state the system tries to hold or steer.
- Observable signals (sensors) and available actions (actuators).
- Per-path delay classifications: fixed, variable, or bounded with the bound.
- The named local output file path.

Optional:
- Known latency budgets, stability requirements, existing feedback paths, or constraints on sensors and actuators.
- Gain and timing data for oscillation analysis. If absent, the path is marked under-specified.

## Procedure

1. Intake and validate the system description and control objective. Confirm the system is named, the control objective is stated, and the output file path is supplied. Done when: the system, control objective, and output file path are confirmed.

2. Enumerate sensors and actuators. For each sensor, name the quantity measured and its source. For each actuator, name the effect and its range. State the count of each. Done when: every sensor and actuator is listed with its quantity, source or effect, and range.

3. Map feedback paths. For each path, specify which sensor(s) drive which actuator(s), the comparison that generates the error signal, and the direction of correction. Allow many-to-one and coordinated relationships; a single sensor may drive multiple actuators and multiple sensors may converge on one actuator. Done when: every feedback path names its sensors, actuators, error comparison, and correction direction.

4. Analyze oscillation risk. For each feedback path, state whether the loop gain and delay can produce oscillation, using supplied or derived gain and timing data. Specify the damping or limiting mechanism if oscillation is possible. If gain or timing data is absent, mark the path under-specified and request the missing data from the user. Done when: every feedback path has its oscillation risk stated with a damping mechanism or an under-specified marker.

5. Compile the design document and write it to the named local file. The document has one section per component (sensors, actuators, feedback, delay, oscillation), a wiring diagram showing sensor to error to actuator to delay to oscillation for each loop, and a dynamic-routing note recording where the system may switch loops, adjust gains, or reconfigure sensors at runtime. Done when: the document is written to the named local file with all sections, the wiring diagram, and the dynamic-routing note.

## Failure and recovery

- Missing system description: stop and request it; write nothing.
- Unbounded delay: mark the path under-specified in the document rather than inventing a bound; request the missing classification from the user.
- Under-specified oscillation risk: mark the path under-specified; request the gain or timing data. Do not invent a stability claim.
- Output file not named: stop and request the output path; write nothing.
- Partial result: if some components cannot be specified, emit the document with completed sections and an explicit gap list; do not claim the done predicate holds for gaps.
- Rollback: delete or overwrite the single design document. No other artifact is touched.

## Output

A cybernetic flow design document at the named local path, ordered: sensors, actuators, feedback, delay, oscillation, wiring diagram, dynamic-routing note. The document is the terminal artifact.
