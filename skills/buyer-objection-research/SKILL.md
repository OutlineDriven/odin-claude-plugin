---
name: buyer-objection-research
description: 'Use when Product copy needs buyer-objection evidence collected through approved outreach. Produces a copy recommendation grounded in anonymized exact language.'
---

# Buyer objection research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Product copy needs buyer-objection evidence collected through approved outreach. |
| Authority | Outreach requires start approval: make one harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. End the run on scope drift. |
| Side effect | Buyer-objection copy recommendation grounded in anonymized exact language. |
| Done | The evidence supports a copy recommendation or shows the concern disappeared. |
| Stop | interview cap; access blocked; scope drift. Bound: exact approved recipients in bounded batches, with a total interview cap. |

## Inputs

- **Approved recipients** (required): the exact list of buyers to contact, named before any outreach.
- **Interview cap** (required): the total number of interviews allowed across all batches.
- **Batch size** (required): the maximum recipients per batch.

## Procedure

1. Bound the outreach: freeze the exact approved recipients, batch size, and total interview cap before any contact. **Done when:** the recipient list, batch size, and cap are frozen and recorded.
2. For production outreach, make one harness ask/question call before the run starts. End the run immediately on scope drift — the approval covers the frozen scope only. **Done when:** start approval is collected or the run ends on scope drift.
3. Conduct interviews within the bound. Collect exact buyer language verbatim, anonymize identity, and preserve the objection phrasing. Stop at the interview cap without extending it. **Done when:** interviews are complete or the cap is reached.
4. Analyze collected objections: group by theme, identify recurring vs one-off concerns, and distinguish objections that block purchase from concerns that dissolved during the conversation. **Done when:** objections are themed and classified.
5. Synthesize a copy recommendation grounded in the anonymized exact language. Quote the recurring objection phrasing that the copy must address. If the evidence shows the concern disappeared, state that directly. **Done when:** the recommendation is produced or the evidence is declared inconclusive.

## Failure and recovery

- **Scope drift after approval:** end the run; the approval covered the original scope only. Terminal class: `blocked`.
- **Access blocked:** a recipient cannot be reached or a channel is denied. Report what blocked access and stop. Terminal class: `blocked`.
- **Interview cap reached:** stop at the cap without extending it. Terminal class: `capped`.
- **Inconclusive evidence:** the collected objections do not support a recommendation. Terminal class: `inconclusive`.

## Output

A buyer-objection copy recommendation grounded in anonymized exact language: the recurring objection themes, verbatim phrasing the copy must address, and the recommendation. Terminal classification: `supported` (evidence supports a recommendation), `inconclusive` (evidence does not support a recommendation), `capped` (interview cap reached before sufficient evidence), or `blocked` (access or scope drift stopped the run).
