---
name: principle-sequence-verifiable-units
description: 'Use when asked to sequence multi-step implementation work by verifying each unit before committing it to the sequence. Ensures failures are isolated and localized to their unit, preventing invalid state from propagating. Don''t use for tasks that require source or remote-system changes.'
---

# Principle sequence verifiable units

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Sequence multi-step implementation work. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Shapes commits and execution order. |
| Done | Failures localize and sequence reads as an argument. |

## Inputs

- **Work sequence**: A multi-step implementation task decomposed into named units, each with a specification and an expected verification check. Required.
- **Dependency graph**: Explicit or inferrable ordering constraints between units. Optional; if absent, infer from cited file ownership and call-graph topology.
- **Verification check per unit**: A runnable command or observable condition that proves the unit's end state. Required per unit.

## Procedure

1. **Validate input.** Confirm the work decomposes into two or more distinct units. Reject single-step work with: "single-step work does not require sequencing; execute inline." Confirm every unit carries a named verification check.

2. **Map dependencies.** For each unit, list the files it reads, writes, or modifies. Build a dependency graph. Detect cycles and reject with the cycle path named.

3. **Identify parallelizable units.** A unit is parallelizable when no other unit in the sequence reads or depends on its outputs. Group maximum parallel sets.

4. **Order by dependency depth.** Rank units by shortest-path distance from any root. Units at the same depth may execute in parallel within their group.

5. **Define failure report schema.** Before executing any unit, establish the per-unit failure report shape: unit name, check command, observed output, expected output, and the git-worktree diff of changes the unit produced.

6. **Execute each unit, verifying before commit.**

   a. Take the next unit in dependency order.

   b. Execute the unit against its specification.

   c. Run the unit's verification check.

   d. Record the check result: command invoked, stdout/stderr, exit code, and wall-clock time.

   e. If the check fails, stop the sequence. Produce a failure report: unit name, check that failed, observed versus expected output, and the diff the unit produced. Halt. Do not continue to subsequent units.

   f. If the check passes, record the unit as verified and move to the next unit.

7. **Commit on full pass.** When every unit in the sequence passes its check, commit the sequence in dependency order. Produce a verification summary: all units listed, each check result, and total elapsed time.

## Failure and recovery
- **Non-converged blocker**: Input does not decompose into verifiable units, carries no verification checks, or contains a dependency cycle. Stop. Report the blocker with the exact input defect.

- **Partial-result failure**: A unit's verification check fails. Stop the sequence immediately. Do not continue to subsequent units. Report the failing unit, the failing check, and the diff the unit produced. Do not emit a success summary for the sequence.

- **Check-error failure**: A verification check crashes, times out, or produces malformed output. Treat as a partial-result failure of the unit that owned the check.

## Output
- **Success**: Verification summary listing every unit, its check command, pass/fail result, and elapsed time. Sequence is committed in dependency order.

- **Failure**: Failure report naming the first unit to fail, the verification check that failed, observed output versus expected output, and the diff the failing unit produced. Sequence halts; no partial sequence is committed.

## Provenance

Origin: pstack/skills/principle-sequence-verifiable-units from cursor/plugins (https://github.com/cursor/plugins), subtree ref 68836ddaf5697224520f1847d90cdb90ca8babaa. MIT license, Copyright 2026 Lauren Tan. Clean-room adaptation: Per-unit-check sequencing principle for execution governance; odin-run module routing; ODIN frontmatter schema, contract table, and section order applied.
