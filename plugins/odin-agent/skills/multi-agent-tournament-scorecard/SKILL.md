---
name: multi-agent-tournament-scorecard
description: 'Use when agent strategies need a reproducible finite tournament under a frozen evaluation protocol. Not for open-ended or infinite matchups: use a continuous benchmark.'
---

# Multi-agent tournament scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Agent strategies need a reproducible finite tournament under a frozen evaluation protocol. |
| Authority | Reversible local writes only. Run records and receipts under `.outline/loops/`; rollback is deletion. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A reproducible tournament scorecard persisted as a run record. |
| Done | The run ends at exactly one declared terminal class with a persisted run record and `receipt.json`: on `success`, the complete matrix with move records, scores, and hidden-identity validation; on `stalled`, the named matchup and stopping reason; on `blocked`, the named violation or mismatch and no published scorecard; on `exhausted`, the completed matchups and the remainder, with no success claim. |

## Inputs

- Matchup matrix (required): the explicit finite set of agent pairings and rounds, frozen before the tournament begins.
- Evaluation protocol (required): the frozen rules that govern each matchup: move validation, scoring, and identity disclosure.
- Agent strategies (required): the strategies under test, each identified and version-pinned.

## Procedure

1. Bind the declared matchup matrix and freeze it before any run. Done when: the matrix is recorded in writing and no matchup has been executed yet.
2. Execute the tournament inside the bound: run each matchup in the frozen matrix, record every move, and compute scores per the evaluation protocol. Done when: every matchup in the matrix has a recorded outcome or a non-success terminal applies.
3. Validate hidden-identity assignments: confirm each assignment is consistent across the matrix and no identity leaked before disclosure. Done when: every identity assignment is verified or the mismatch is named.
4. Select the terminal class, exactly one: `success` only when the matrix is complete and step 3 verified every identity; otherwise `stalled` for an incomplete matchup, `blocked` for an invalid run or a hidden-identity mismatch, `exhausted` for budget exhaustion before the matrix completes. Budget exhaustion is never success. Done when: exactly one terminal class is selected and recorded.
5. Persist the result: write the run record to `.outline/loops/<slug>/<run_id>/` when durable, and emit `receipt.json` before returning. Done when: the receipt file exists and contains every required field.

## Failure and recovery

- Incomplete matchup: a matchup in the matrix did not finish. Terminal `stalled`. Name the matchup and the stopping reason.
- Invalid run: the evaluation protocol was violated during a matchup. Terminal `blocked`. Name the violation and the affected matchup.
- Budget exhausted before matrix completes: terminal `exhausted`. Report the matchups completed and the remainder. Do not claim success.
- Hidden-identity mismatch: an identity assignment is inconsistent or leaked. Terminal `blocked`. Name the mismatch; do not publish the scorecard.

## Output

A tournament scorecard: terminal class (success, stalled, blocked, exhausted), completed matchups, move records, scores, identity validation, and the receipt path, ordered by the procedure steps that produced them.
