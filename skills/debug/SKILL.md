---
name: debug
description: 'Use when the user runs /debug with a bug, identify the root cause and verify a minimal fix. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Debug

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /debug with a bug. |
| Authority | Reversible local: write only the evidence ledger and one minimal source fix, both VCS-tracked. |
| Side effect | A local evidence ledger and a single committed fix; no other artifact is mutated. |
| Done | The root cause is identified and a minimal fix is verified. |

## Inputs

- A bug description (required): the observed behavior, the expected behavior, and a reproduction command or failing test.
- Affected file or module (optional): narrows the initial read set.
- Prior context (optional): earlier hypotheses or fixes already ruled out.

## Procedure

1. Open the evidence ledger and record the first entry: symptom, observed versus expected, and the reproduction command.
2. Run the reproduction command. If the failure does not reproduce, record the attempt and stop.
3. State one root-cause hypothesis in the ledger before reading or changing any source.
4. Bound the read set to the smallest file set that could satisfy the hypothesis. Read only those files.
5. Apply the minimal source change that satisfies the hypothesis. Do not refactor, rename, or widen the change.
6. Re-run the reproduction. If it still fails, record the new observation, revise the hypothesis, and repeat from step 3. Stop when the reproduction passes.
7. Run the project's existing test suite for the touched file or module. If an unrelated test regresses, record it and stop without widening the fix.
8. Commit the fix as one local commit whose message names the root cause and whose body carries the ledger entries.
9. Rollback path: the only mutation is one local commit; reverting it restores prior state.

## Failure and recovery
- Unreproducible bug: record the commands tried, mutate nothing, and return blocked.
- Hypothesis exhausted with no verified fix: return non-converged with the ledger; revert any uncommitted change before returning.
- Fix passes reproduction but regresses an unrelated test: record the regressing test, do not widen the fix, and return blocked naming that test.
- Rollback: revert the single fix commit; no artifact outside that commit was mutated.

## Output
A single committed minimal fix and an evidence ledger naming the root cause, the hypothesis chain, and the verifying reproduction.

## Provenance

Origin https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, MIT license, Copyright (c) 2026 Garry Tan. Clean-room adaptation: the evidence-ledger investigation procedure was re-derived from the source contract; no third-party expression was copied. Two source candidates (investigate/SKILL.md and openclaw/skills/gstack-openclaw-investigate/SKILL.md) shared an identical trigger, authority, side-effect, and done contract and were merged into this one skill.
