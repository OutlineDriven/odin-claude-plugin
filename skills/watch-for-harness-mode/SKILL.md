---
name: watch-for-harness-mode
description: 'Use when a watch pattern has proven itself and the user wants to turn it into a reusable harness. Produces a standalone harness artifact that replays the proven watch behavior with configurable inputs. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Watch for harness mode

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A watch pattern has proven itself and the user wants to turn it into a reusable harness. |
| Authority | Reversible local write only: write only the named harness artifact file. No VCS commit, no remote call, no credential use, no published artifact. Rollback: delete or revert the harness artifact. |
| Side effect | One harness artifact as a reversible local state change. |
| Done | A reusable harness is created from the proven watch. |

## Inputs

- **Watch transcript** (required): the proven watch pattern: a session transcript, run log, artifact, or notes that document the watch's target, interval, evaluation logic, completion predicate, and observed success. |
- **Harness name** (required): a slug for the harness artifact file. |
- **Harness description** (optional): a one-sentence description of what the harness checks and when it succeeds. Defaults to "Reusable harness derived from a proven watch pattern." |
- **Default poll interval** (optional): the polling interval in seconds. Defaults to the interval observed in the watch transcript, or 60 if unspecified. |
- **Default deadline** (optional): the maximum polling duration in seconds. Defaults to the deadline observed in the watch transcript, or 300 if unspecified. |
- **Adoption confirmation** (required): the user explicitly confirms or declines to adopt the harness artifact. |

## Procedure

1. **Validate inputs.** Reject if the watch transcript is absent or contains no observable target, completion predicate, or evaluation logic. Stop if the harness name is absent or contains path-separator characters. Do not proceed on ambiguous inputs.
2. **Bound scope.** The harness artifact is the only write target. No VCS commit, no remote call, no credential use, no published artifact. If the harness name already exists as a file in the working directory, stop and report the collision.
3. **Extract the watch mechanism.** From the watch transcript, extract: (a) the target surface being watched, (b) the completion predicate that determined success, (c) the evaluation logic that applied the predicate, (d) the poll interval, and (e) the deadline. If any of (a), (b), or (c) are absent, stop and report the missing element.
4. **Synthesize the harness.** Write a harness artifact named `{harness-name}.md` (or the user's preferred extension) containing: the harness name, the extracted description or default, the extracted target, the extracted completion predicate, the extracted evaluation logic, configurable input fields for the target, completion predicate, poll interval, and deadline with their extracted defaults, and the adoption confirmation step.
5. **Present for adoption.** Show the harness artifact to the user. Ask for explicit confirmation or declination. Do not assume adoption.
6. **Confirm or withdraw.** If the user confirms: mark the harness as adopted and report success. If the user declines: delete the harness artifact and report withdrawal. If the user requests modifications: record the requested changes and stop. This skill produces an initial draft, not an iterative editor.

## Failure and recovery
**Missing watch mechanism.** The watch transcript does not contain a target, completion predicate, or evaluation logic. Partial extraction is not sufficient. Stop without writing an artifact.

**Harness name collision.** A file with the harness name already exists in the working directory. Stop without overwriting. Report the collision and the conflicting path.

**User declines.** The user explicitly declines to adopt the harness artifact. Delete the artifact. Report withdrawal as the terminal result. Do not retry, re-prompt, or represent this as a failure.

**User requests modifications.** The user asks for changes to the harness artifact after seeing it. Stop without modifying. The initial draft is the contract of this skill.

**Non-converged watch.** The watch transcript documents a failed or non-converged watch. Stop. Report that the watch pattern was not proven and a harness cannot be derived from it. Do not produce a harness from a non-converged watch.

## Output
One of:
- **Adopted:** the harness artifact exists and the user confirmed adoption. Includes the harness name and path.
- **Withdrawn:** the user declined. The harness artifact is deleted. No harness exists.
- **Blocked:** input validation failed or the watch transcript is insufficient. Includes the blocking reason.

## Provenance

Origin: `project-owned:user-curated-skill-ideas`, curated-ideas line 51. License: project-owned marker (clean-room adaptation). This skill is a clean-room adaptation of a user-curated harness-construction workflow that turns a proven watch pattern into a reusable artifact. The `babysit` skill (curated-ideas line 48) provides the watch mechanism foundation; this skill extracts the proven watch and synthesizes a harness from it, which is the distinct mechanism that justifies a separate skill.
