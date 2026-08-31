---
name: culture-team-composition-analysis
description: 'Use when multiple Culture Index profiles need Gas/Brake/Glue balance, gap, friction, and hiring analysis. Returns a team roster, balance assessment, gaps, friction pairs, and hiring recommendations. Not for pairwise profile comparison — use culture-profile-comparison.'
---

# Culture team composition analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Multiple Culture Index profiles need Gas/Brake/Glue balance, gap, friction, and hiring analysis. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only — team roster, Gas/Brake/Glue counts, balance assessment, gaps, friction pairs, strengths, watch areas, and hiring recommendations. |
| Done | Every member is categorized, team balance is evaluated against current needs, and concrete gaps and mitigations are identified. |

## Inputs

For each team member, supply the name, pattern/archetype, trait distances from the arrow for A (Autonomy), B (Social Ability), C (Pace/Patience), and D (Conformity), and EU values (Survey and Job). Right of the arrow is high; left is low.

Supply the current business season before analysis: high-growth/turnaround, consolidation/stability, culture building, complex operations, innovation/R&D, or compliance-heavy. Team function context (sales, engineering, customer success, operations, marketing, finance, HR, executive) is optional but improves function-fit assessment.

## Procedure

1. Load every team member's profile: name, pattern/archetype, A/B/C/D distances from the arrow, and EU Survey and Job values. Reject any profile missing trait distances; do not infer them. Done when: every member is loaded with trait distances and EU values, or rejected with the missing field named.
2. Categorize each member into a primary and secondary Gas/Brake/Glue role using distance from the arrow, never absolute values: Gas = High A (right of arrow), Brake = High D (right of arrow), Glue = High B (right of arrow). Build a roster table of Name, Pattern, Primary Role, Secondary Role. Done when: every member has a primary and secondary role assigned from arrow distance.
3. Count Gas, Brake, and Glue members and assess balance against the supplied business season: high-growth/turnaround prioritizes Gas; consolidation/stability and compliance-heavy prioritize Brake; culture building prioritizes Glue; complex operations needs Brake plus Glue; innovation/R&D needs Gas plus Low D. Map symptoms to gaps: stagnation or no decisive action means too little Gas; quality erosion, mistakes, or compliance issues means too little Brake; morale problems or no fun means too little Glue; chaos, recklessness, or burnout means too much Gas; paralysis, perfectionism, or cannot ship means too much Brake; all talk, groupthink, or avoiding hard decisions means too much Glue. Done when: Gas/Brake/Glue counts are stated and balance is assessed against the business season with symptom-to-gap mapping.
4. Review C (Pace/Patience) distribution across the team: mostly Low C is fast-moving and urgent with risk of unnecessary chaos; mostly High C is steady and patient but may resist change; mixed C is healthy tension. Flag whether the distribution supports urgent pivots, which need some Low C, or sustained focus, which need some High C. Done when: C distribution is classified and its support for pivots or sustained focus is flagged.
5. Review team-wide A versus B balance: A greater than B is task-focused and results-driven but may neglect relationships; B greater than A is people-focused and harmonious but may avoid tough decisions; mixed is healthy tension. Done when: A-vs-B balance is classified with its risk noted.
6. Flag friction pairs from trait-distance mismatches and name the specific member pairs: High A versus Low A is independence versus collaboration; High B versus Low B is social-needs mismatch; High C versus Low C is pace and urgency mismatch; High D versus Low D is detail-orientation clash; High A versus High A is power struggles; High D versus High D is perfectionist clash. Record a mitigation for each pair. Done when: every friction pair is named with the specific members and a mitigation.
7. For each gap, specify an ideal hire profile by trait distance from the arrow with a reason for each of A, B, C, and D. Skip the hiring section when no gap exists; do not fabricate a gap. Done when: each gap has an ideal hire profile with per-trait reasons, or the hiring section is omitted because no gap exists.
8. Compile the team report with these sections: Team Roster, Balance Assessment with counts, Current Gaps with impact, Potential Friction Points with named pairs and mitigation, Hiring Recommendations if gaps exist, Team Strengths, and Watch Areas. Done when: the report contains all sections in order.

## Failure and recovery
- Missing profile data: a member lacks trait distances or EU values. Stop and request the missing fields. Do not categorize a member from incomplete data.
- Missing business season: balance cannot be assessed without a current-season target. Stop and request it before proceeding.
- Ambiguous role: a member qualifies for two primary roles. Assign the role with the larger distance from the arrow as primary and the other as secondary, and record the ambiguity in Watch Areas.
- No gaps identified: still return roster, balance assessment, friction pairs, strengths, and watch areas. Omit the hiring section rather than inventing a gap.
- Partial result: return only fully categorized members and list every excluded member with the missing field. Never claim the done predicate holds while any supplied member remains uncategorized.

## Output
A team composition analysis report in chat text with sections in procedure order: team roster, balance assessment, current gaps, friction points, hiring recommendations, team strengths, watch areas.

## Provenance

Adapted from Trail of Bits skills, https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, workflow analyze-team.md and reference team-composition.md. Licensed CC-BY-SA-4.0; preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Clean-room adaptation: the Gas/Brake/Glue balance model and the trait-distance-from-arrow procedure are re-expressed; no third-party prose is copied.
