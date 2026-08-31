---
name: buyer-objection-research
description: 'Use when product copy needs buyer-objection evidence collected through approved outreach. Conducts structured interviews via approved channels with consent, then synthesizes a copy recommendation grounded in anonymized exact language. Not for unsolicited outreach or survey design.'
---

# Buyer objection research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Product copy needs buyer-objection evidence collected through approved outreach. |
| Authority | Outreach requires start approval: one harness ask/question call before any contact. Prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. End the run on scope drift. |
| Side effect | Buyer-objection copy recommendation grounded in anonymized exact language. |
| Done | The evidence supports a copy recommendation, or the concern disappeared, or a non-success terminal applies. |
| Stop | Scope drift; access blocked; interview cap reached; inconclusive evidence. Bound: exact approved recipients in bounded batches, with a total interview cap. |

## Inputs

- Approved recipients (required): the exact list of buyers to contact, named before any outreach.
- Interview cap (required): the total number of interviews allowed across all batches.
- Batch size (required): the maximum recipients per batch.
- Approved channels (required): the communication channels permitted for outreach (email, phone, scheduled video call). Named before any contact.

## Procedure

1. Freeze the recipient list, batch size, interview cap, and approved channels before any contact. Record them in writing. Done when: all four are named and frozen.
2. Secure start approval with one harness ask/question call. State the frozen scope: recipients, channels, cap, and batch size. End the run immediately on scope drift. The approval covers the frozen scope only. Done when: approval is collected or the run ends on scope drift.
3. Conduct structured interviews within the bound. For each batch:
   - Contact recipients only through the approved channels. Do not use a channel outside the frozen list.
   - Obtain explicit consent before recording or transcribing. State the purpose: collecting buyer objections to improve product copy. Offer a no-recording option where only notes are taken.
   - Follow the interview protocol: open with the product context, ask what nearly stopped them from buying, probe specific objections with follow-up questions, close by asking if the concern dissolved after purchase.
   - Collect exact buyer language verbatim. Anonymize identity (remove names, companies, titles). Preserve the objection phrasing.
   - Stop at the interview cap without extending it.
   Done when: interviews are complete, the cap is reached, or access is blocked.
4. Analyze collected objections. Group by theme. Identify recurring versus one-off concerns. Distinguish objections that block purchase from concerns that dissolved during the conversation. Done when: objections are themed and classified.
5. Synthesize a copy recommendation grounded in the anonymized exact language. Quote the recurring objection phrasing that the copy must address. If the evidence shows the concern disappeared, state that directly. Done when: the recommendation is produced or the evidence is declared inconclusive.

## Failure and recovery

- Scope drift after approval: end the run; the approval covered the original scope only. Terminal class: `blocked`.
- Access blocked: a recipient cannot be reached or a channel is denied. Report what blocked access and stop. Terminal class: `blocked`.
- Interview cap reached with sufficient evidence: if the collected objections support a recommendation despite the cap, classify as `supported`, not `capped`. The cap limits outreach, not the analysis.
- Interview cap reached without sufficient evidence: stop at the cap without extending it. Terminal class: `capped`.
- Inconclusive evidence: the collected objections do not support a recommendation. Terminal class: `inconclusive`.
- Consent refused: a recipient declines recording or participation. Mark that recipient as unreachable; do not infer objections from refusal.

## Output

A buyer-objection copy recommendation grounded in anonymized exact language: the recurring objection themes, verbatim phrasing the copy must address, and the recommendation. Terminal classification: `supported` (evidence supports a recommendation), `inconclusive` (evidence does not support a recommendation), `capped` (interview cap reached before sufficient evidence), or `blocked` (access or scope drift stopped the run).
