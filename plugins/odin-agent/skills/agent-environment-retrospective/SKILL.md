---
name: agent-environment-retrospective
description: 'Use when a completed session needs an agent-environment retrospective: a severity-ranked list of environment improvement candidates, each backed by session evidence. Not for an engineering retrospective from telemetry — use engineering-retrospective.'
---

# Agent-environment retrospective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A completed session needs an agent-environment retrospective. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output: severity-ranked environment improvement candidates. |
| Done | Every candidate names evidence and the friction it removes. |

## Inputs

- Session artifact (required): the completed session transcript or state record. Must contain observable agent-environment interaction.
- Environment context (optional): the agent's working environment at session time. Use only if supplied; do not infer it.

## Procedure

1. **Gather inputs.** Receive the session artifact and any supplied environment context.
2. **Identify friction.** Scan the session artifact for patterns where the agent's environment created friction: tool failures, slow retries, missing context, state loss, repeated navigation, or unclear feedback.
3. **Classify candidates.** Assign each friction point a type: `tool-failure`, `slow-retry`, `missing-context`, `state-loss`, `navigation-overhead`, or `unclear-feedback`.
4. **Rank by severity.** Order candidates: high (blocks progress) → medium (degrades efficiency) → low (minor friction). When severity ties, prefer candidates with stronger evidence.
5. **Validate evidence.** For each candidate, confirm the named evidence appears in the session artifact. Candidates without traceable evidence are omitted.
6. **Return report.** Output the severity-ranked candidate report.

## Failure and recovery
- No session artifact: return an empty report stating "No session artifact supplied."
- No friction observed: return a report stating "No environment friction detected." with zero candidates. Do not fabricate candidates.
- Ambiguous evidence: downgrade the candidate to unconfirmed severity rather than guess. Include the ambiguity in the evidence field.

## Output
A severity-ranked markdown report. Each candidate entry contains:

- `type`: friction type
- `evidence`: verbatim session evidence
- `severity`: `high`, `medium`, or `low`
- `friction_removed`: what eliminating this friction would achieve
