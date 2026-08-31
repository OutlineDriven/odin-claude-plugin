---
name: principle-prove-it-works
description: 'Use when asked to prove completion before claiming done. Produces visible, rerunnable evidence against real behavior. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle: prove it works

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Prove completion before claiming done. |
| Authority | Reversible local: write only named local artifacts; rollback by deleting them. |
| Side effect | Runs verification against the real artifact. |
| Done | Visible proof against real behavior exists. |

## Inputs

- **Claim**: what was built, fixed, or changed. Required.
- **Artifact**: the real file, service, binary, or endpoint that embodies the claim. Required.
- **Verification command**: the command or action that exercises the artifact. Required.

## Procedure

1. State the claim in one sentence: what observable behavior should hold.
2. Identify the real artifact — not a mock, stub, or test double — that embodies the claim.
3. Determine the minimal verification command that exercises the artifact against the claim: a test, a smoke run, a curl, a build, a type-check, or a direct invocation.
4. Execute the verification command against the real artifact. Capture stdout, stderr, exit code, and timestamp.
5. Inspect the captured output. If the output confirms the claim, proceed. If it contradicts the claim, stop and report the failure — do not widen scope or re-run hoping for a different result.
6. Record the verification evidence: the command run, the captured output, and the timestamp. Store as a named local artifact.
7. State the result: proven or not proven, with the evidence artifact path.

## Failure and recovery
- **Verification fails**: report the failure with the captured output. Do not claim done. Do not re-run hoping for a different result.
- **Artifact missing**: stop. Report which artifact is absent. Do not substitute a mock or test double.
- **Non-convergent verification**: if the verification command produces nondeterministic output across repeated runs, report the nondeterminism. Do not widen scope to force convergence.
- **Rollback**: delete any local evidence artifacts written during a failed run.

## Output
A named local evidence artifact containing: the claim, the verification command, the captured output (stdout, stderr, exit code), and the timestamp. If verification fails, a failure report with the same structure.

## Provenance

Adapted from Lauren Tan (poteto) pstack/skills/principle-prove-it-works/SKILL.md at revision 68836ddaf5697224520f1847d90cdb90ca8babaa. Licensed under MIT per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25. Clean-room adaptation: procedure rewritten for ODIN 2.0 self-contained execution.
