---
name: verification-before-completion
description: 'Requires fresh, actually-run evidence before any claim that a task is complete. Use when about to tell the user a task, feature, or fix is done, complete, finished, working, or ready, or about to report a DONE or passing status. Don''t use for tasks that require source or remote-system changes.'
---

# Verification before completion

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A done, fixed, passes, complete, or ready claim is imminent; a commit, PR, or next-task move is about to happen; or satisfaction is about to be expressed. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. Reads only what is required to classify the claim. |
| Side effect | Runs the narrow proving command or scenario; edits nothing; blocks the completion claim when the output contradicts it. |
| Done | Each claim carries fresh output from exactly one proving action, the claim wording matches the output, and failures are reported honestly. |

## Inputs

- **Fires on:** Explicit invocation, or a user utterance that contains a completion claim.
- **Must supply:** The specific claim being made; what would prove it; whether it has been run; the output of the check.
- **Optional:** The exact command or scenario run; the raw output read; any partial results.

## Procedure

1. **Name the proving action.** Identify what concrete action would prove the claim: a specific test, build, lint pass, input scenario, file read, or reproduction of the original failure. Name it precisely. "The three tests covering the retry path" is a named action; "the test suite" is not.

2. **Handle the no-check surface.** If the change has no checkable surface (comment-only, pure prose, a rename with no attached behavior), state that plainly and classify as UNVERIFIED-NO-SURFACE. Do not invent a check to run.

3. **Run it.** Execute the named action after the last relevant edit to the code. Do not run before the edit and claim the result as post-edit evidence.

4. **Read all of it.** Read the full output and the exit code. Do not read only a tail, a summary, or the last line. Treat the exit code as a fact to check.

5. **Classify.**
   - VERIFIED: The output confirms the claim at its stated scope.
   - PARTIAL: Evidence exists but does not cover the full scope of the claim; state exactly what passed and what was left unchecked.
   - UNVERIFIED: No check was run; state "not run" plainly.
   - FAILED: The output contradicts the claim; report the contradiction exactly.

6. **Report.** State the classification, the action that was run, what it showed, and the exact claim wording it does or does not support. Do not hedge; do not round up a partial result to "done."

## Failure and recovery
**unrun-check:** The check was not executed. Report UNVERIFIED. Do not substitute a hedge or a confidence statement.

**contradicted-claim:** The output shows failure, error, or unexpected state. Report FAILED with the exact output. Do not suppress it, qualify it, or claim success despite the output.

**timeout:** The proving action did not complete. Report TIMEOUT with the partial output present. Do not treat a partial run as a pass.

**stale-check:** A check was run, but the code changed after it. Treat as UNVERIFIED; re-run before the claim can be made.

**Partial-result rule:** A partial result is reported as partial. It is not rounded up. No retry is attempted unless the user explicitly requests one; this skill does not perform that action itself.

**Non-mutation rule:** This skill reads and classifies. It does not write, commit, open PRs, move tickets, or change any state outside its own output.

## Output
One of:
- `VERIFIED`: the claim carries fresh output that confirms it at its stated scope.
- `PARTIAL`: evidence exists but does not cover the full scope; the report states exactly what passed and what was left unchecked.
- `UNVERIFIED`: no check was run or the check surface does not exist; stated plainly.
- `FAILED`: the output contradicts the claim; the report shows the exact contradiction.
- `TIMEOUT`: the proving action did not complete; the report shows any partial output.

A terminal output line states the classification in all caps. When the classification is not VERIFIED, the line is followed by one sentence stating the reason in plain language.

## Provenance

- **current:verification-before-completion:** Source ODIN skill tree. In-tree origin; no external license applies.
- **source:superpowers-017:** github.com/obra/superpowers, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797. MIT License (copied_allowed: true; holder: Jesse Vincent; year: 2025). Absorbed into verification-before-completion under global exact-contract deduplication. Clean-room adaptation: the superpowers source supplied the same four-field contract; the ADAPT candidate is the authoritative version.
