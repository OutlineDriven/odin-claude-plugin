---
name: verification-skill
description: 'Use when asked to create a project-local executable verification skill, or to repair one whose commands, paths, or assertions have drifted from the project. Writes only inside the verification-skill directory and proves the harness against the live repository. Not for remote or deployed verification, use the project s remote-proof workflow.'
---

# Verification skill

A verification skill is a project-local, self-contained artifact that states one observable
contract, the command that exercises it, and the pass condition. It executes without this skill.

Creating one and repairing one are two modes of the same artifact's lifecycle. Both write only
inside the verification-skill directory, and both hold the same rule: when the harness disagrees
with the repository, the harness is wrong.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create a project-local executable verification skill, or repair drift in an existing one |
| Authority | Reversible local writes inside the named verification-skill directory only. Never the source under test, CI config, credentials, remote state, or a deployed target |
| Side effect | Writes and runs a verification harness inside the project. Opens at most one pull request, and only on explicit approval |
| Done | Create: the harness runs and passes against the live repository. Repair: one honest classification of clean, changed, or blocked |

## Mode selection

Create when no verification skill exists for the target contract. Repair when one exists and its
commands, paths, or assertions no longer match the project. A repair that would have to rewrite the
contract itself is a create, so say so and start over rather than editing around the mismatch.

## Inputs

Create needs the feature, behavior, or contract to verify, and the verification target: a file,
module, CLI command, or API surface. It discovers the target by repository interview when one is
not supplied. Repair needs the verification-skill directory and the concrete drift evidence, which
is the mismatch between the skill and current project state: a failing check, a stale command, an
outdated path, or a changed contract. Both default the project root to the working directory. A
pull request requires explicit approval; without it, edits stay local.

## Procedure, create

1. Interview the repository. Read the relevant source, tests, build config, and run commands to
   determine how the target is built, invoked, and observed. Done when: the build, run, and observe
   mechanism is determined from the repository rather than assumed.
2. Define the verification contract. State the observable behavior, the inputs that exercise it, and
   the pass condition as concrete assertions. Done when: all three are stated.
3. Bound the scope. Name the exact files to write, which is the skill directory and any harness
   script under it. Source under test, CI config, and unrelated paths are excluded. Done when: the
   write paths are named and the exclusions hold.
4. Write the skill so it restates the contract, the run command, and the pass condition and executes
   on its own. Done when: the skill is written and self-contained.
5. Run the harness live against the repository and capture the actual output. Done when: real output
   is captured, never predicted.
6. Confirm every assertion holds against that output. When one fails, correct the harness or the run
   command and re-run. Never edit the source under test to make an assertion pass. Done when: every
   assertion holds, or the failing assertion is named for correction.
7. Record the proof inside the skill: the exact command, its output, and the pass result. Done when:
   all three are recorded.

## Procedure, repair

1. Enumerate every file in the verification-skill directory. Done when: the file list is complete.
2. Compare each file against the drift evidence and record the exact lines, commands, paths, or
   assertions that no longer match. Done when: every mismatch has a recorded location.
3. List every file that will change, all inside the directory. Done when: the change list is stated
   and nothing out of scope is queued.
4. Name the rollback path, which is version control or the pre-edit working tree. Done when: it is
   named before the first write.
5. Edit only inside the directory to eliminate the recorded drift: current commands for stale ones,
   real paths for outdated ones, and assertions aligned to the actual contract. Done when: every
   mismatch is corrected or classified blocked.
6. Re-run the skill against the project. When it cannot execute, validate by comparing the changed
   files against current project state. Done when: the re-run passes, or manual validation confirms
   the fix, or neither holds and the reason is recorded.
7. Classify once: clean when no drift was found and nothing was edited, changed when drift was
   repaired inside the directory, blocked when repair would need wider scope or missing
   information. Done when: exactly one classification is recorded.
8. Open one pull request containing only directory edits, and only when the outcome is changed and
   approval was given. Done when: the pull request exists, or none was requested.

## Failure and recovery

An incomplete repository interview stops the run: when the build, run, or observe mechanism cannot
be determined, report what is missing rather than inventing a command. An assertion that fails
against live output means the harness is wrong, so correct the assertion or the invocation and
re-run, never the source under test. A harness command that errors on a wrong path, a missing
binary, or a permission denial gets its invocation fixed and re-run; when it cannot run in this
environment at all, report the blocker.

Drift that cannot be repaired without editing outside the directory is blocked, and scope does not
widen to reach it. Drift evidence that identifies nothing concrete is clean, reported as no
actionable drift. A harness written but not yet proven is written-but-unproven, with the remaining
step named; partial repair is changed for what landed plus blocked for what did not.

Rollback is deleting the created directory, or discarding local changes to an existing one. No
source under test is modified in either mode, so nothing further is needed.

## Output

For create: the verification-skill directory with its definition and harness, the recorded live
proof of command, output, and pass result, and the classification proven or written-but-unproven.
For repair: the classification of clean, changed, or blocked, the files edited, the drift repaired,
any drift remaining, and the pull request URL when one was opened.
