---
name: create-verification-skill
description: 'Use when asked to create a project-local executable verification skill by interviewing the repository, writing the harness, and proving it end to end. Not for remote or deployed verification — use the project’s remote-proof workflow.'
---

# Create verification skill

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Human invokes to create a project-local executable verification skill |
| Authority | Reversible-local. Write only named local artifacts under the project; rollback is deleting the created skill directory |
| Side effect | Writes and runs a verification harness inside the project; no remote, VCS, credential, or deployed mutation |
| Done | Verification skill proven end to end — the harness runs and passes against the live repository |

## Inputs

- The feature, behavior, or contract to verify. Must be supplied.
- The project root to write into. Defaults to the current working directory.
- The verification target (file, module, CLI command, or API surface). Must be supplied or discovered by repository interview.

## Procedure

1. Interview the repository: read the relevant source, tests, build config, and run commands to determine how the target feature is built, invoked, and observed. Done when: the build, run, and observe mechanism for the target feature is determined from the repository.
2. Define the verification contract: state the observable behavior, the inputs that exercise it, and the pass/fail condition as concrete assertions. Done when: the observable behavior, exercise inputs, and pass/fail assertions are stated.
3. Bound scope: name the exact files the verification skill will write (the skill directory and any harness script under it). Do not touch source under test, CI config, or unrelated paths. Done when: the exact write paths are named and source-under-test and CI config are excluded.
4. Write the verification skill: a project-local, self-contained skill that restates the contract, the run command, and the pass/fail condition so it executes without this skill. Done when: the verification skill is written and is self-contained.
5. Run the verification harness live against the repository. Capture the actual command output. Done when: the harness is run live and its actual output is captured.
6. Confirm the harness passes: every assertion holds against the real output. If any assertion fails, fix the harness, not the source under test, and re-run. Done when: every assertion holds against the real output, or a failing assertion is identified for harness correction.
7. Record the live proof: the exact command, its output, and the pass result inside the verification skill. Done when: the command, output, and pass result are recorded inside the verification skill.

## Failure and recovery
- Repository interview incomplete: if the build, run, or observe mechanism cannot be determined from the repository, stop and report what is missing. Do not invent a verification command.
- Harness assertion fails against live output: the harness is wrong, not the source under test. Correct the assertion or the run command and re-run. Never edit the source under test to make the harness pass.
- Harness command errors (wrong path, missing binary, permission denied): fix the harness invocation and re-run. If the command cannot run in this environment, stop and report the blocker.
- Partial result: if the harness is written but not yet proven, the done predicate does not hold. Report the verification skill as written-but-unproven and the remaining step.
- Rollback: delete the created skill directory. No source under test was modified, so no further recovery is needed.

## Output
A project-local executable verification skill directory containing the skill definition and harness, plus the recorded live proof (command, output, pass result). The terminal classification is proven or written-but-unproven.
