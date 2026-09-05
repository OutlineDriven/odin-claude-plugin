---
name: influence-and-negotiation
description: 'Use when an agreement-seeking interaction arises, including mid-conversation moments the model detects.'
---

# Influence and negotiation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An agreement-seeking interaction arises, including mid-conversation 'they just said X' moments the model detects. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | May dispatch read-only web research sub-agents to gather context on counterparties, organizations, or domain facts. Writes nothing itself. |
| Done | Prepared mandate and mutual-gains agenda (MAP), live response scripts for an active negotiation, or a retrospective debrief with pathology analysis delivered. |

## Inputs

- Situation description (required): what is being negotiated, who the parties are, and the current state of the interaction.
- Counterparty profile (optional): known interests, constraints, communication style, power position, and relationship history.
- The negotiator's position (optional): BATNA, reservation point, target outcome, and constraints. If absent, the skill infers a reasonable starting position from the situation description.
- Interaction transcript or notes (optional): for mid-conversation moments or retrospective debriefs, the actual exchange so far.
- Mode (optional): one of `prepare`, `live`, or `debrief`. If absent, the skill selects based on whether an interaction is upcoming, in progress, or concluded.

## Procedure

1. **Classify mode.** If the user supplies a transcript or describes an active exchange, set mode to `live`. If the user describes a concluded interaction, set mode to `debrief`. Otherwise set mode to `prepare`. Done when: the mode and the input feature that selected it (transcript, active exchange, or concluded interaction) are both recorded.

2. **Map the Mandascan five points.** For every party, identify and record:
   - Interests: underlying needs, not stated positions.
   - Alternatives: best alternative to negotiated agreement (BATNA) and walk-away threshold.
   - Legitimacy: objective criteria, precedent, or norms each side can cite.
   - Commitment: what each party can credibly promise and enforce.
   - Communication: channel, tone, and relationship quality between parties.
   If evidence is missing for a point, mark it as unknown rather than inventing it. Done when: all five Mandascan points are recorded for every party, with missing evidence marked unknown.

3. **Identify the axis of agreement.** Determine the single dimension along which the parties' interests most overlap or where the largest joint gain exists. State it explicitly. Done when: the dimension of greatest overlap or joint gain is stated explicitly.

4. **Draw the influence-not-manipulation line.** Every tactic proposed must pass this test: would the tactic remain effective if the counterparty understood it was being used? If yes, include it. If no, discard it. Persuasion through shared value, legitimate framing, and transparent reasoning is in scope. Deception, coercion, exploitation of cognitive biases for asymmetric gain, and information asymmetry maintained by concealment are out of scope. Done when: every proposed tactic has passed or failed the transparency test, with out-of-scope tactics discarded.

5. **Execute mode-specific procedure:**

   **prepare**. Build a mandate and mutual-gains agenda:
   a. Draft the mandate: the opening position, target outcome, reservation point, and the objective criteria supporting each.
   b. Construct the MAP (Mutual-gains Agenda Protocol): a list of issues ordered by joint-gain potential, with proposed trades and package deals.
   c. Script the opening statement: a concise framing that names shared interests and invites collaborative problem-solving.
   d. Anticipate the top three objections or moves the counterparty is likely to make. For each, prepare a response that reframes toward joint value.
   e. If the situation involves multiple parties or internal team dynamics, note coalition structure and team roles.

   **live**. Provide real-time response scripts:
   a. Analyze the latest counterparty statement for its underlying interest, implicit concession, or anchoring move.
   b. Classify the move: anchor, concession signal, objection, reframing, stalling, or power play.
   c. Draft a response script (2-4 sentences) that addresses the move, advances the position, and maintains the influence-not-manipulation line.
   d. Flag any moment where the counterparty has implicitly conceded or revealed a new interest. Name it explicitly.
   e. If the exchange has reached a decision point, state whether to close, package-trade, or pause.

   **debrief**. Conduct a retrospective with pathology analysis:
   a. Reconstruct the negotiation timeline: key moves, turning points, and final outcome.
   b. Score each Mandascan point: was it accurately assessed beforehand? Where was the assessment wrong?
   c. Identify pathologies: anchoring bias, reactive devaluation, escalating commitment, mythical fixed pie, premature closure, or loss of face.
   d. For each pathology found, name the moment it occurred, what it cost, and what an alternative response would have been.
   e. Extract transferable lessons: what to prepare differently, what tactic worked, and what to avoid. Done when: the artifact for the selected mode exists, every applicable sub-step has a written entry, a skipped conditional sub-step names why it did not apply, and missing evidence is marked unknown rather than filled in.

6. **Back-brief.** Before delivering the output, verify that every recommendation traces to a Mandascan point or an observed move. Remove any recommendation that cannot be grounded in evidence from the inputs. Done when: every recommendation traces to a Mandascan point or observed move, and ungrounded recommendations are removed.

7. **Dispatch research if needed.** If a counterparty profile, organizational context, or domain fact is material but missing, dispatch a read-only web research sub-agent to gather it. Integrate findings into the Mandascan map. If research returns nothing useful, proceed with what is available and note the gap. Done when: research is either dispatched and integrated or the gap is noted and the skill proceeds with available information.

## Failure and recovery
- Insufficient information: if the situation description is too vague to map even one Mandascan point, ask the user for clarification on the specific missing points rather than proceeding with an empty map.
- Mode ambiguity: if the interaction state is unclear (upcoming but with partial transcript), default to `prepare` and note that live scripts can be requested when the interaction begins.
- Research failure: if web research sub-agents return no useful results, proceed with available information and explicitly flag which Mandascan points lack external grounding.
- Manipulation boundary: if the user requests a tactic that fails the influence-not-manipulation test, decline the specific tactic, explain why it crosses the line, and offer a transparent alternative that achieves the same objective.
- Non-convergence: if the parties' positions are irreconcilable based on the Mandascan analysis, state that no agreement zone exists and recommend strengthening the BATNA instead.
- Authority is read-only throughout. No failure class permits writing files, making commitments on the user's behalf, or contacting counterparties.

## Output
One of three artifacts, determined by mode:

- prepare: A structured report containing the Mandascan five-point map for all parties, the identified axis of agreement, the mandate (opening/target/reservation), the MAP with package trades, the opening statement script, and the top-three objection responses.
- live: A response script for the latest counterparty move, with move classification, implicit concession flags, and a recommendation on next action (close, package-trade, or pause).
- debrief: A retrospective report with the negotiation timeline, Mandascan assessment accuracy scores, identified pathologies with moment-level attribution, cost analysis per pathology, and transferable lessons.
