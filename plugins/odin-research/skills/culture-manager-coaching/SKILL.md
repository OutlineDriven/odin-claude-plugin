---
name: culture-manager-coaching
description: 'Use when a manager needs profile-specific communication, one-on-one, motivation, and energy guidance for a direct report. Returns trait-gap adjustments, tailored cadence, and energy-risk actions. Not for general pair or team compatibility analysis.'
---

# Culture manager coaching

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A manager needs profile-specific communication, one-on-one, motivation, and energy guidance for a direct report. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. All output is chat text. |
| Side effect | Chat output only: a trait-gap map, communication adjustments, one-on-one design, motivators, energy concerns, watch areas, and avoidances. |
| Done | Major trait gaps have concrete manager adjustments, cadence and format are tailored, and energy risks are addressed. |

## Inputs

Required:
- Manager Culture Index profile: archetype/pattern and, for each trait, the position relative to that profile's red arrow (the population mean). For A, B, C, D supply the relative (dot-minus-arrow) value, not the raw 0-10 score. For L (Logic) and I (Ingenuity) supply the absolute value, since only those two compare directly between people.
- Direct report Culture Index profile: same fields as the manager.
- Energy Units (EU) for both people: Survey EU and Job EU, when both graphs are available.

Optional:
- Names and dates for the compiled guide.
- Known role context for the direct report.

If a profile is missing the arrow position, stop and request it. Never substitute a raw absolute trait value for a relative one, and never visually estimate trait values.

## Procedure

1. **Load both profiles.** Record each person's archetype and each trait's position relative to their own arrow. State positions as distance-from-arrow (e.g. "+3 centiles", "on arrow", "opposite side"), never as bare raw scores. L and I are the exception: use their absolute values. Done when: both profiles are recorded with archetype and per-trait distance-from-arrow.

2. **Calculate trait gaps.** For A, B, C, D, compute the gap between manager and direct report and assign friction risk:
   - Same side of arrow, similar distance: Low friction.
   - Same side of arrow, different distance: Medium friction.
   - Opposite sides of arrow: High friction potential.

   Done when: each A/B/C/D gap has a friction-risk assignment.

3. **Identify primary friction points.** Flag the largest gaps (opposite sides of arrow or >3 centile difference). Map each to the conflict it produces:
   - High A vs Low A: manager expects initiative; report waits for direction. Low A vs High A: manager collaborates; report acts independently.
   - High B vs Low B: manager wants connection; report wants to work. Low B vs High B: manager skips rapport; report needs relationship first.
   - High C vs Low C: manager methodical; report impatient. Low C vs High C: manager creates urgency; report resists rush.
   - High D vs Low D: manager detail-focused; report big-picture. Low D vs High D: manager flexible; report needs structure.

   Done when: each large gap maps to a named conflict pattern.

4. **Generate communication adjustments** for the direct report's trait positions:
   - High A: bullet points focused on ROI, not paragraphs; give outcomes not step-by-step; ask questions to get buy-in; allow autonomy; be direct and confident.
   - Low A: provide specific direction before expecting action; give frameworks for novel decisions; offer specific praise ("Great job on X"); probe for concerns since silence is not agreement; do not misread helpfulness as ambition.
   - High B: allow time for rapport before tasks; verbal praise and public recognition matter; include in social activities; do not isolate with extended solo work; the first statement is not their final position (verbal processor).
   - Low B: minimize unnecessary check-ins; prefer async communication over meetings; private recognition not public praise; thoughtful gestures over verbal affirmation; do not mistake quiet for disengagement.
   - High C: send agendas in advance; one topic per meeting; protect focus time (28-min recovery from interruptions); give advance notice of changes; give structured, sequential instructions.
   - Low C: put deadlines in subject lines; keep busy with variety; expect interruptions and plan for them; use their urgency productively; do not be surprised by over-commitment.
   - High D: frame feedback as process improvement not personal criticism; provide training/learning opportunities; do not break trust (long memories); build SOPs for new responsibilities; recognize attention to quality.
   - Low D: give creative problems to solve; provide options not mandates; build systems to catch their gaps; focus on the three things that matter most; accept 80% completion and assign finishers.

   Done when: the direct report's trait positions each have a concrete communication adjustment.

5. **Design the one-on-one.** Tailor frequency, duration, and format to the direct report:
   - Frequency: Low A → more frequent (weekly); High A → less frequent (bi-weekly or as needed); High C → consistent schedule, same time/day; Low C → flexible timing, short check-ins.
   - Duration: High B → allow buffer for rapport; Low B → keep focused and efficient; High C → single-topic, predictable length; Low C → can be shorter, faster-paced.
   - Format: High D → structured agenda, action items; Low D → flexible, allow tangents; High B → start with personal connection; Low B → start with business.
   - Produce a sample agenda: opening by B trait, agenda structure by C/D traits, feedback approach by A trait, closing/action items by D trait.

   Done when: frequency, duration, format, and a sample agenda are tailored to the direct report.

6. **Identify motivators** by the direct report's trait positions:
   - High A: autonomy, ROI, winning → give ownership, variable comp. Low A: clear direction, team success → specific praise, stable comp.
   - High B: acceptance, inclusion → verbal praise, team activities. Low B: privacy, focus time → leave alone, private recognition.
   - High C: stability, predictability → consistent routines, advance notice. Low C: variety, deadlines → keep busy, clear deadlines.
   - High D: knowledge, trust → training, recognition for quality. Low D: freedom, options → creative problems, flexibility.

   Done when: each trait position has a named motivator with implementation.

7. **Flag energy concerns.** When both Survey and Job EU are available, compute utilization = Job EU / Survey EU × 100%:
   - 70-130%: Healthy — maintain current approach.
   - Below 70%: Frustration — address mismatch, discuss role engagement.
   - Above 130%: Stress — the direct report is overextending.
   Survey traits are hardwired (top graph); Job behaviors are adaptive (bottom graph). A large Survey-vs-Job difference means behavior modification that drains energy and predicts burnout if sustained 3-6+ months. Done when: EU utilization is computed and classified, or energy is marked unassessable.

8. **Compile the coaching guide** with these sections: key trait gaps (trait, gap, adjustment needed); communication style adjustments; one-on-one recommendations (frequency, duration, format, opening, feedback); primary motivators with implementation; watch areas; energy status (EU utilization, status, action); things to avoid. Done when: the guide contains all eight sections in order.

9. **Check for anti-patterns** before returning. Change the environment rather than expecting the person to change. Do not project the coach's own motivators onto them, use one-size-fits-all one-on-ones, ignore EU signals (low utilization predicts disengagement and flight risk), treat gaps as problems rather than complementary strengths, or forget that the coach's own profile biases how the person is perceived. Done when: no anti-pattern remains — environment-not-person, no projected motivators, no one-size-fits-all, EU signals addressed, gaps framed as complementary.

## Failure and recovery
- Missing arrow position: A profile lacks the red-arrow reference for A, B, C, D. Stop. Request the arrow position. Do not fall back to raw absolute values or visual estimation; both produce 20-30% error and invalidate the gap calculation.
- Incomplete profile: Only one profile supplied, or a trait position is absent. Return the partial analysis for the available traits and state exactly which trait gaps, communication adjustments, or energy checks could not be produced. Do not fabricate the missing profile.
- No EU data: Survey or Job EU is unavailable. Skip the energy step and report that energy status could not be assessed, rather than inventing a utilization figure.
- Non-converged result: If major trait gaps lack a concrete adjustment, cadence/format is not tailored, or energy risks are unaddressed when EU data exists, the done predicate is not met. Return the blocked guide with the specific missing elements named.
- Rollback: This skill is read-only and mutates nothing. Recovery is re-running with corrected or completed inputs.

## Output
A coaching guide in chat text with sections in procedure order: trait-gap map, communication adjustments, one-on-one design, motivators, energy status, watch areas, avoidances.
