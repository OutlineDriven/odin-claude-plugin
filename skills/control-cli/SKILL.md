---
name: control-cli
description: 'Use when asked to reproduce, profile, or verify CLI/TUI behavior. Produces a deterministic transcript or profile proof with session cleanup. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Control CLI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reproduce, profile, or verify CLI/TUI behavior. |
| Authority | May spawn local terminal sessions under a PTY and write only temporary transcript or profile artifacts under a system temp directory. No source, VCS, credential, paid, published, deployed, or remote mutation. Rollback: terminate the PTY process and remove its runtime scratch. |
| Side effect | Runs temporary terminal sessions and captures evidence. |
| Done | A deterministic transcript or profile proof artifact exists and the live PTY session is terminated with its runtime scratch removed. |

## Inputs

- The CLI/TUI binary or command to exercise (must be supplied).
- The exact reproduction steps, profile target, or verification scenario (must be supplied).
- Optional: expected output, timeout, and environment variables.

## Procedure

1. Create a fresh temp session directory under the system temp path; it holds the captured artifact and PTY/tmux runtime scratch. Record it for cleanup.
2. Spawn the target CLI/TUI under a PTY, or a tmux session attached to a PTY, so interactive behavior is observable. Apply one action per observation: send one input, then capture the full terminal render before sending the next.
3. For reproduction: drive the supplied steps in order, appending the terminal state after each action to the transcript artifact.
4. For profiling: run the target under the chosen profiler, capturing timing or allocation output into the profile artifact.
5. For verification: exercise the scenario, compare the observed output against the expected output when supplied, and record the pass or fail classification in the transcript artifact.
6. Terminate the PTY process, or detach and kill the tmux session.
7. Remove the PTY/tmux runtime scratch (pipes and sockets); the captured transcript or profile artifact file remains as the retained proof.

## Failure and recovery
- PTY spawn failure or binary not found: record the error in the transcript, do not invent output, and return blocked with the spawn error.
- Timeout: terminate the PTY process, append the partial transcript up to the timeout, and return blocked with the timeout boundary.
- Non-deterministic output: run a second capture, record the observed variance, mark the proof non-deterministic, and return blocked rather than asserting a false pass.
- Any failure: terminate the PTY or tmux process and remove its runtime scratch before returning; if no artifact was captured, delete the whole temp session directory. Never swallow errors or claim the done predicate holds when the proof is missing or inconclusive.

## Output
A transcript or profile artifact containing the captured terminal evidence, plus a terminal classification: reproduced, profiled, verified-pass, verified-fail, blocked, or non-deterministic. The live PTY session is terminated and its runtime scratch removed before return.

## Provenance

Origin: cursor/plugins, path cursor-team-kit/skills/control-cli/SKILL.md, revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest per the pinned source audit. Clean-room adaptation: the PTY/tmux one-action-per-observation evidence-harness mechanism is preserved; expression is rewritten.
