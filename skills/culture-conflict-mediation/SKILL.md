---
name: culture-conflict-mediation
description: 'Use when two colleagues’ working friction needs trait-based explanation, accommodations, process changes, and escalation boundaries. Also handles manager-report friction when both profiles exist. Not for performance adjudication — use the organization’s formal process.'
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

Required: two colleagues' Culture Index profiles, each with A/B/C/D trait positions relative to the arrow, archetype/pattern, and EU survey and job values. Required: their working relationship type (peers, manager→report, report→manager, cross-functional, close collaborators, or occasional interaction). Optional: observed friction examples and current date.

## Procedure

1. Load both profiles. For each person record name, role, archetype, A/B/C/D positions relative to the arrow, and EU survey/job values. Done when: this step’s stated action, evidence, and checks are complete.
2. Map trait differences. For each trait A through D, calculate the gap between the two positions and note whether they fall on the same side of the arrow. Traits on opposite sides with large gaps carry the highest friction risk. Done when: this step’s stated action, evidence, and checks are complete.
3. Identify the primary friction source by matching the largest cross-arrow gaps to known patterns: High A vs Low A (independence vs collaboration), High A vs High A (power struggle), High B vs Low B (social energy mismatch), High C vs Low C (pace mismatch), High D vs Low D (detail orientation), High D vs High D (perfectionism clash). Done when: this step’s stated action, evidence, and checks are complete.
4. Map reciprocal perspectives. For each person, derive how their trait positions likely make them perceive the other: High A sees Low A as indecisive, slow, passive; Low A sees High A as aggressive, selfish, dismissive; High B sees Low B as cold, unfriendly, disconnected; Low B sees High B as chatty, distracting, inefficient; High C sees Low C as chaotic, impatient, disruptive; Low C sees High C as slow, resistant, inflexible; High D sees Low D as sloppy, unreliable, careless; Low D sees High D as rigid, nitpicky, controlling. Produce both directions. Done when: this step’s stated action, evidence, and checks are complete.
5. Assess relationship structure. Peers must find middle ground; in a manager→report pair the manager adapts first because they hold more power; a report→manager mismatch may require environment change if severe; cross-functional priorities compound trait friction; close collaborators accumulate daily friction faster; occasional interaction may permit limiting contact. Done when: this step’s stated action, evidence, and checks are complete.
6. Generate reciprocal accommodations specific to the identified friction pair. For High A vs Low A: clarify decision rights, give Low A explicit input time before decisions, Low A understands High A's autonomy is not personal, define consultation points before independent action. For High B vs Low B: acknowledge different social needs, High B reduces social expectations from Low B, Low B commits to brief check-ins, schedule bounded social interaction. For High C vs Low C: acknowledge pace difference as legitimate, Low C gives advance notice of urgent requests, High C accepts some urgency is real and builds buffer time, set deadlines with High C's processing time in mind. For High D vs Low D: acknowledge different detail orientations, High D accepts "good enough" for some work, Low D uses systems to catch critical details, define quality standards per deliverable type. For High A vs High A: clear domain ownership, explicit agreement on shared decisions, regular alignment to prevent divergence, leadership defines who owns what. Done when: this step’s stated action, evidence, and checks are complete.
7. Design process changes keyed to the friction source: pace mismatch → define response time expectations and meeting cadence; decision friction → RACI or decision rights matrix; communication style → agree on preferred channels and formats; detail orientation → define quality gates and checklists; social needs → protected focus time vs collaboration time. Done when: this step’s stated action, evidence, and checks are complete.
8. Identify what will not change. CI traits are hardwired; name each person's trait-driven behavior that will persist. The goal is accommodation, not transformation. Done when: this step’s stated action, evidence, and checks are complete.
9. Check energy levels. Compare each person's EU survey against EU job to compute utilization. If either is in stress or frustration, flag that energy drain may intensify natural friction and address workload or role adjustment as part of mediation. Done when: this step’s stated action, evidence, and checks are complete.
10. Compile the mediation report with: profile comparison table, primary friction source with one-to-two sentence explanation, reciprocal perceptions, person-specific accommodations for each party, process changes, hardwired behaviors that will not change, energy status, a conversation guide framing the discussion as different valid working styles (avoid labeling either style wrong, expecting fundamental change, or assuming one must adapt more unless manager-report), success indicators, and escalation criteria. Done when: this step’s stated action, evidence, and checks are complete.

## Failure and recovery
- Non-trait conflict: if the conflict involves values, ethics, harassment, or performance issues, CI does not explain it. Exclude these from trait-based mediation and escalate them to the appropriate channel. Do not over-attribute conflict to traits.
- Missing profile data: if either person's A/B/C/D positions or EU values are absent, stop and request them. Do not infer trait positions.
- Unwilling party: if either party is unwilling to accommodate, note this as an escalation criterion rather than forcing a recommendation.
- Declining energy: if EU utilization continues declining after mediation, escalate beyond CI-based intervention.
- Partial results: return whatever trait-gap analysis is complete and explicitly mark missing sections. Never claim the done predicate holds when inputs are incomplete or the conflict is non-trait-based.

## Output
A markdown mediation report containing: a profile comparison table (A/B/C/D positions and gaps for both persons), the identified primary friction pattern with explanation, reciprocal perception lists for each person, person-specific accommodation lists, process change recommendations, hardwired behaviors that will not change, EU energy status, a conversation guide, success indicators, and escalation criteria.

## Provenance

Origin: Trail of Bits skills repository, `plugins/culture-index/skills/interpreting-culture-index/workflows/mediate-conflict.md`, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`. License: CC-BY-SA-4.0; source link https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3. Preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. This skill is a clean-room adaptation of the mediation workflow; trait-gap mapping, friction patterns, reciprocal accommodations, process interventions, hardwired-trait acknowledgment, energy checking, and escalation boundaries are preserved as mechanism.
