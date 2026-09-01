---
name: verification-before-completion
description: 'Use when about to report a task, feature, or fix as done, complete, finished, working, or ready, or before a commit, PR, or next-task move. Runs the narrow proving action and classifies the claim VERIFIED, PARTIAL, UNVERIFIED, FAILED, or TIMEOUT. Not for fact-checking assertions — use verify-both-ways; not for measuring a claim — use verify-this.'
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

- Fires on: Explicit invocation, or a user utterance that contains a completion claim.
- Must supply: The specific claim being made; what would prove it; whether it has been run; the output of the check.
- Optional: The exact command or scenario run; the raw output read; any partial results.

## Procedure

1. **Name the proving action.** Identify the precise action that would prove the claim: a specific test, build, lint pass, input scenario, file read, or reproduction of the original failure. "The three tests covering the retry path" is precise; "the test suite" is not. **Done when:** one precise proving action is named.
2. **Handle the no-check surface.** If the change has no checkable surface (comment-only, pure prose, a rename with no attached behavior), state that plainly and classify as UNVERIFIED-NO-SURFACE. Do not invent a check to run. **Done when:** the surface is classified as checkable or UNVERIFIED-NO-SURFACE.
3. **Run it.** Execute the named action after the last relevant edit to the code. Do not run before the edit and claim the result as post-edit evidence. **Done when:** the proving action has been executed after the last edit.
4. **Read all of it.** Read the full output and the exit code. Do not read only a tail, a summary, or the last line. Treat the exit code as a fact to check. **Done when:** the full output and exit code are read.
5. **Classify.** VERIFIED if the output confirms the claim at its stated scope; PARTIAL if evidence exists but does not cover the full scope (state what passed and what was left unchecked); UNVERIFIED if no check was run (state "not run" plainly); FAILED if the output contradicts the claim (report the contradiction exactly). **Done when:** one classification is assigned with its justification.
6. **Report.** State the classification, the action that was run, what it showed, and the exact claim wording it does or does not support. Do not hedge; do not round up a partial result to "done." **Done when:** the report states the classification, action, output, and claim wording.

## Failure and recovery
unrun-check: The check was not executed. Report UNVERIFIED. Do not substitute a hedge or a confidence statement.

contradicted-claim: The output shows failure, error, or unexpected state. Report FAILED with the exact output. Do not suppress it, qualify it, or claim success despite the output.

timeout: The proving action did not complete. Report TIMEOUT with the partial output present. Do not treat a partial run as a pass.

stale-check: A check was run, but the code changed after it. Treat as UNVERIFIED; re-run before the claim can be made.

Partial-result rule: A partial result is reported as partial. It is not rounded up. No retry is attempted unless the user explicitly requests one; this skill does not perform that action itself.

Non-mutation rule: This skill reads and classifies. It does not write, commit, open PRs, move tickets, or change any state outside its own output.

## Output
One terminal classification (VERIFIED, PARTIAL, UNVERIFIED, FAILED, or TIMEOUT) with the action run, what it showed, and the claim wording it supports or contradicts; non-VERIFIED classifications followed by one sentence stating the reason.
