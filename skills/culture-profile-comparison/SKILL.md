---
name: culture-profile-comparison
description: 'Use when two or more Culture Index profiles need explicit compatibility, friction, communication, and complementary-strength comparison. Returns a relative-trait comparison that documents both risks and complementary value. Don''t use for tasks that require source or remote-system changes.'
---

# Culture profile comparison

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Two or more Culture Index profiles need explicit compatibility, friction, communication, and complementary-strength comparison. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Profiles are supplied as data; nothing is written or extracted. |
| Side effect | Chat output only: relative trait comparison, similarities, oppositions, friction points, complementary strengths, communication recommendations, and collaboration forecast. |
| Done | Profiles are compared by distance from each arrow except absolute L/I, and both risks and complementary value are documented. |

## Inputs

Required: two or more Culture Index profiles, each supplying name, pattern/archetype, arrow position, the signed distance from the arrow for primary traits A (Autonomy), B (Social), C (Pace), D (Conformity), and the absolute values for L (Logic) and I (Ingenuity). EU values are optional but strengthen the collaboration forecast.

Trait key (distances are relative to each person's own arrow unless noted):
- A — Autonomy: mental initiative and inner self-confidence. High = self-starter, competitive, future-focused; Low = supportive, collaborative, needs direction before acting.
- B — Social: need for interaction and persuasion. High = verbal processor, relational, energized by people; Low = task-focused, solitary, processes internally.
- C — Pace/Patience: urgency and rate of motion; force multiplier on other traits. High = steady, focused, needs advance notice; Low = urgent, multifocused, thrives on variety and deadlines.
- D — Conformity: detail, rules, structure; confidence rooted in mastery. High = accurate, needs SOPs, finisher; Low = flexible, conceptual, starts but needs others to finish.
- L — Logic (absolute, directly comparable): 0-2 emotional/heartfelt; 3-7 balanced head and heart; 8-10 rational, compartmentalized, can read cold.
- I — Ingenuity (absolute, directly comparable): 0-2 practical/grounded (most common); 3-6 occasional inspiration; 7-10 inventive, detached from reality.

## Procedure

1. Load every supplied profile. For each person record name, pattern/archetype, arrow position, the signed distance from the arrow for A, B, C, D, the absolute L and I, and EU when present.
2. Build a comparison table with one row per trait. For A, B, C, D record each person's signed distance from their own arrow and the side (high/low). For L and I record the absolute values. Compare DISTANCES from the arrow, never the raw 0-10 numbers, except L and I which are compared by absolute value.
3. Mark each primary trait Same (both on the same side of their arrows) or Opposite (opposite sides). Never call a trait "good" or "bad"; there is no superior profile.
4. For Same traits, state the shared implication: shared understanding and communication style, plus the shared blind spot both miss.
5. For Opposite traits, state the friction risk and the complementary opportunity it creates when managed.
6. Assess major friction points per pair using the opposition combinations: High A vs Low A (independence expectations clash — high A gives direction, respects low A's collaborative need); High B vs Low B (social needs mismatch — high B allows low B alone time, low B tolerates some small talk); High C vs Low C (pace mismatch — low C respects high C's focus time, high C accepts some urgency); High D vs Low D (detail clash — high D accepts "good enough," low D follows through on commitments). Document the specific friction for this pair, not the generic table.
7. Assess communication compatibility from the oppositions: High A may steamroll a Low A who will not push back; High B needs verbal processing while Low B prefers written; High C needs advance notice while Low C creates urgency; High D wants specifics while Low D gives the big picture.
8. Compare L and I directly by absolute value. Logic: both high (8-10) = rational discussions, may seem cold to others; both low (0-2) = emotional connection, may escalate together; one high one low = the high-L may dismiss the low-L's concerns. Ingenuity: both high (7-10) = creative brainstorming, may lack grounding; both low (0-2) = practical focus, may miss innovative solutions; one high one low = high I may frustrate low I with abstract ideas.
9. Identify complementary strengths where opposites create value: name what each person brings and the gap neither would cover alone (e.g., high A starts, high D finishes; high B builds relationships, low B does deep work).
10. If one person leads the other, assess the leadership dynamic: high A leading low A works if high A provides direction; low A leading high A risks the high A not respecting or taking over; high D leading low D may feel micromanaged; low D leading high D may feel unsupported. Omit this section when no reporting relationship exists.
11. Compile the comparison summary: quick view (pattern, primary driver, Logic, Ingenuity per person), trait comparison table with Same/Opposite alignment, similarities, differences, friction points with mitigations, complementary strengths, communication recommendations per person, and a one-line collaboration forecast (Natural fit / Workable with effort / High friction / Complementary opposites).

## Failure and recovery
- Missing trait data: stop and request the missing arrow position or trait distance. Never estimate a distance visually or infer it; visual estimation carries a 20-30% error rate and invalidates the comparison.
- Absolute-value comparison used for A/B/C/D: that row is invalid. Re-derive it from each person's signed distance from their own arrow before continuing.
- Fewer than two profiles: a comparison requires at least two; report that the input is insufficient and request a second profile.
- Ambiguous arrow position: request clarification rather than guessing where the arrow lands, because every distance depends on it.
- Partial result rule: emit the traits that could be compared correctly and explicitly flag any trait that could not, rather than silently omitting it or pretending the done predicate holds.

## Output
A profile comparison report containing: a quick-view table per person (pattern, primary driver, Logic, Ingenuity); a trait comparison table with signed distances and Same/Opposite alignment for A, B, C, D and absolute values for L, I; similarities with implications; differences with friction risks and opportunities; named friction points with mitigations; complementary strengths; per-person communication recommendations; and a one-line collaboration forecast. No file is written; the report is returned in chat.

## Provenance

Adapted from the Trail of Bits "interpreting-culture-index" compare-profiles workflow (source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3, file /plugins/culture-index/skills/interpreting-culture-index/workflows/compare-profiles.md) and its primary-traits and secondary-traits references. Licensed CC-BY-SA-4.0; Trail of Bits attribution and source link preserved, modifications marked, adaptations licensed ShareAlike. No trademark rights claimed; trail-of-bits-mark.svg is not reused as branding. Adaptation restates the comparison mechanism (distance-from-arrow comparison with the L/I absolute exception, friction/communication/complementary-strength analysis, and the no-absolute-comparison rule) as a self-contained procedure without copying third-party expression.
