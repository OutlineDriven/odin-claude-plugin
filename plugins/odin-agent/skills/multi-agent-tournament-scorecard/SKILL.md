---
name: multi-agent-tournament-scorecard
description: 'Use when agent strategies need a reproducible finite tournament under a frozen evaluation protocol. Produces a scorecard with move records, scores, and hidden-identity validation. Not for open-ended or infinite matchups — use a continuous benchmark for those.'
---

# Multi-agent tournament scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Agent strategies need a reproducible finite tournament under a frozen evaluation protocol. |
| Authority | Read-only evaluation: run the frozen protocol and record results; do not mutate source, remote state, or credentials. |
| Side effect | A reproducible tournament scorecard persisted as a run record. |
| Done | The fixed matrix completes with saved move records, scores, and hidden-identity validation. |

## Inputs

- Matchup matrix (required): the explicit finite set of agent pairings and rounds, frozen before the tournament begins.
- Evaluation protocol (required): the frozen rules that govern each matchup — move validation, scoring, and identity disclosure.
- Agent strategies (required): the strategies under test, each identified and version-pinned.

## Procedure

1. Bind the declared matchup matrix and freeze it before any run. Done when: the matrix is recorded in writing and no matchup has been executed yet.
2. Execute the tournament inside the bound: run each matchup in the frozen matrix, record every move, and compute scores per the evaluation protocol. Done when: every matchup in the matrix has a recorded outcome or a non-success terminal applies.
3. Stop at the first of: matrix complete (success), a non-success terminal (incomplete matchup, invalid run, blocked), or budget exhausted. Budget exhaustion is never success unless it was the predeclared success predicate. Done when: exactly one terminal class is selected and recorded.
4. Validate hidden-identity assignments: confirm each assignment is consistent across the matrix and no identity leaked before disclosure. Done when: every identity assignment is verified or the mismatch is named.
5. Persist the result: write the run record to `.outline/loops/<slug>/<run_id>/` when durable, and emit `receipt.json` before returning. Done when: the receipt file exists and contains every required field.

## Failure and recovery

- Incomplete matchup: a matchup in the matrix did not finish. Terminal `incomplete`. Name the matchup and the stopping reason.
- Invalid run: the evaluation protocol was violated during a matchup. Terminal `invalid`. Name the violation and the affected matchup.
- Budget exhausted before matrix completes: terminal `exhausted`. Report the matchups completed and the remainder. Do not claim success.
- Hidden-identity mismatch: an identity assignment is inconsistent or leaked. Terminal `blocked`. Name the mismatch; do not publish the scorecard.

## Output

A tournament scorecard: terminal class (success, capped, stalled, blocked, exhausted, pending), completed matchups, move records, scores, identity validation, and the receipt path — ordered by the procedure steps that produced them.
