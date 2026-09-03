---
name: culture-conflict-mediation
description: 'Use when two colleagues'' working friction needs trait-based explanation, accommodations, process changes, and escalation boundaries. Also handles manager-report friction when both profiles exist. Not for performance adjudication — use the organization''s formal process.'
---

# Culture conflict mediation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Two colleagues' working friction needs trait-based explanation, accommodations, process changes, and escalation boundaries. |
| Authority | Read-only. Produces chat output only; no file, VCS, credential, or remote mutation. |
| Side effect | A trait-gap map, reciprocal perspectives, person-specific accommodations, process changes, conversation guide, and escalation criteria returned in chat. |
| Done | The primary trait-based friction is grounded, both parties receive concrete accommodations, hardwired differences are respected, and non-trait conflicts are excluded or escalated. |

## Inputs

Required: two colleagues' Culture Index profiles, each with A/B/C/D trait positions relative to the arrow, archetype/pattern, and EU survey and job values. Required: their working relationship type (peers, manager to report, report to manager, cross-functional, close collaborators, or occasional interaction). Optional: observed friction examples and current date.

## Procedure

1. Load both profiles. For each person record name, role, archetype, A/B/C/D positions relative to the arrow, and EU survey/job values. Done when: both profiles are recorded with all four trait positions and EU values, or a missing field is named and the stop is reported.
2. Map trait differences. For each trait A through D, calculate the gap between the two positions and note whether they fall on the same side of the arrow. Traits on opposite sides with large gaps carry the highest friction risk. Done when: all four traits A through D have a computed gap and a same-side or opposite-side determination.
3. Identify the primary friction source by matching the largest cross-arrow gaps to known patterns: High A vs Low A (independence vs collaboration), High A vs High A (power struggle), High B vs Low B (social energy mismatch), High C vs Low C (pace mismatch), High D vs Low D (detail orientation), High D vs High D (perfectionism clash). Done when: one friction pattern is named as primary, backed by the specific trait gap from step 2 that produced it.
4. Map reciprocal perspectives. For each person, derive how their trait positions likely make them perceive the other: High A sees Low A as indecisive, slow, passive; Low A sees High A as aggressive, selfish, dismissive; High B sees Low B as cold, unfriendly, disconnected; Low B sees High B as chatty, distracting, inefficient; High C sees Low C as chaotic, impatient, disruptive; Low C sees High C as slow, resistant, inflexible; High D sees Low D as sloppy, unreliable, careless; Low D sees High D as rigid, nitpicky, controlling. Produce both directions. Done when: each person has a perspective list derived from their own trait positions, and both directions are present.
5. Assess relationship structure. Peers must find middle ground; in a manager to report pair the manager adapts first because they hold more power; a report to manager mismatch may require environment change if severe; cross-functional priorities compound trait friction; close collaborators accumulate daily friction faster; occasional interaction may permit limiting contact. Done when: the relationship type is named and the power dynamic it creates is stated, so step 6 knows who adapts first.
6. Generate reciprocal accommodations specific to the identified friction pair. For High A vs Low A: clarify decision rights, give Low A explicit input time before decisions, Low A understands High A's autonomy is not personal, define consultation points before independent action. For High B vs Low B: acknowledge different social needs, High B reduces social expectations from Low B, Low B commits to brief check-ins, schedule bounded social interaction. For High C vs Low C: acknowledge pace difference as legitimate, Low C gives advance notice of urgent requests, High C accepts some urgency is real and builds buffer time, set deadlines with High C's processing time in mind. For High D vs Low D: acknowledge different detail orientations, High D accepts "good enough" thresholds, Low D agrees to minimum quality gates, define what "done" means for shared work. Done when: each person has at least one accommodation keyed to the primary friction pattern from step 3, and the accommodations are reciprocal rather than one-sided unless the relationship structure from step 5 dictates otherwise.
7. Design process changes keyed to the friction source: pace mismatch → define response time expectations and meeting cadence; decision friction → RACI or decision rights matrix; communication style → agree on preferred channels and formats; detail orientation → define quality gates and checklists; social needs → protected focus time vs collaboration time. Done when: at least one process change is proposed for the primary friction source, and each change names the specific friction pattern it addresses.
8. Identify what will not change. CI traits are hardwired; name each person's trait-driven behavior that will persist. The goal is accommodation, not transformation. Done when: each person has at least one hardwired behavior named, and the list distinguishes traits from choices so the mediation does not aim at transformation.
9. Check energy levels. Compare each person's EU survey against EU job to compute utilization. If either is in stress or frustration, flag that energy drain may intensify natural friction and address workload or role adjustment as part of mediation. Done when: both persons have a utilization classification (engaged, stress, or frustration), and any stress or frustration state is flagged as a friction intensifier.
10. Compile the mediation report with: profile comparison table, primary friction source with one-to-two sentence explanation, reciprocal perceptions, person-specific accommodations for each party, process changes, hardwired behaviors that will not change, energy status, a conversation guide framing the discussion as different valid working styles (avoid labeling either style wrong, expecting fundamental change, or assuming one must adapt more unless manager-report), success indicators, and escalation criteria. Done when: the report contains all eleven sections, and the conversation guide frames the friction as different valid styles without labeling either party wrong.

## Failure and recovery

- Non-trait conflict: if the conflict involves values, ethics, harassment, or performance issues, CI does not explain it. Exclude these from trait-based mediation and escalate them to the appropriate channel. Do not over-attribute conflict to traits.
- Missing profile data: if either person's A/B/C/D positions or EU values are absent, stop and request them. Do not infer trait positions.
- Unwilling party: if either party is unwilling to accommodate, note this as an escalation criterion rather than forcing a recommendation.
- Declining energy: if EU utilization continues declining after mediation, escalate beyond CI-based intervention.
- Partial results: return whatever trait-gap analysis is complete and explicitly mark missing sections. Never claim the done predicate holds when inputs are incomplete or the conflict is non-trait-based.

## Output

A markdown mediation report containing: a profile comparison table (A/B/C/D positions and gaps for both persons), the identified primary friction pattern with explanation, reciprocal perception lists for each person, person-specific accommodation lists, process change recommendations, hardwired behaviors that will not change, EU energy status, a conversation guide, success indicators, and escalation criteria.
