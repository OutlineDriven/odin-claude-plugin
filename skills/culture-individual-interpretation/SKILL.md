---
name: culture-individual-interpretation
description: 'Use when one extracted Culture Index profile needs interpretation of strengths, challenges, pattern, energy, and actionable implications. Also handles Survey-vs-Job comparison when both graphs exist. Not for interview inference — use culture-interview-profile-prediction.'
---

# Culture individual interpretation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One extracted Culture Index profile needs strengths, challenges, pattern, energy, and actionable interpretation. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output: individual trait-distance interpretation, archetype, strengths, development areas, energy status, and recommendations. |
| Done | All traits are interpreted using the correct relative or absolute rule, leading traits and pattern are grounded, and Survey-versus-Job implications are addressed when available. |

## Inputs

Required: one extracted Culture Index profile in JSON format. Trait values are `[absolute, relative_to_arrow]` tuples; the relative value is used for A, B, C, D interpretation. The JSON contains a `survey` block and optionally a `job` block, each with `eu`, `arrow`, `a`, `b`, `c`, `d`, `logic`, `ingenuity`.

Optional: the Job behaviors block. When absent, Survey-versus-Job comparison and EU utilization are skipped.

The profile must be extracted data, not visual estimation. Visual estimation has a 20-30% error rate. If only a PDF is available, extract it to JSON first; do not fall back to vision for trait scores.

## Procedure

1. **Load the profile.** Read the extracted JSON. Confirm each primary trait (A, B, C, D) has both an absolute value and a relative-to-arrow value. Confirm `arrow` and `eu` are present for each available graph. Done when: this step’s stated action, evidence, and checks are complete.

2. **Record the arrow position.** The red arrow is the population mean (50th percentile). Its position on the 0-10 scale varies by EU: higher EU shifts it right, lower EU shifts it left. Record the arrow position for Survey and, if available, Job. Done when: this step’s stated action, evidence, and checks are complete.

3. **Calculate trait distances for A, B, C, D.** For each primary trait, use the relative-to-arrow value (distance from arrow), never the absolute value alone. Classify each distance: Done when: this step’s stated action, evidence, and checks are complete.
   - 0 to ±0.5: Normative (flexible, situational)
   - ±1 to ±1.5: Tendency (moderate, easier to modify)
   - ±2 to ±3: Pronounced (noticeable difference, ~84th percentile)
   - ±4+: Extreme (hardwired, compulsive, predictable, ~98th percentile)

   Every 2 centiles of distance equals 1 standard deviation.

4. **Identify leading dots.** Rank A, B, C, D by absolute distance from the arrow, most extreme first. The farthest dots drive behavior most strongly. Done when: this step’s stated action, evidence, and checks are complete.

5. **Identify the pattern/archetype.** Cross-reference the trait configuration against these patterns: Done when: this step’s stated action, evidence, and checks are complete.
   - Visionary/Architect: High A, Low C, Low D — big-picture, fast-paced, dislikes details
   - Rainmaker/Persuader: High A, High B, Low C — aggressive, charming, fast
   - Scholar/Specialist: Low B, High C, High D — introverted, patient, detail-oriented
   - Accommodator: Low A, High B, High C — team player, patient, people-focused
   - Influencer: Low A, High B, Low C, Low D — open, optimistic, people-oriented
   - Debater: Mid A, Mid-High B, Low C, High D — social, non-conforming, persuasive
   - Technical Expert: Low A, Low B, High C, Low D — accuracy-driven, private, skeptical
   - Craftsman: Low A, Low B, High C, High D — patient, precise executor
   - Socializer: Low A, High B, Low C, Low D — socially flamboyant, charismatic
   - Philosopher: Low A, Low B, High C, Low D — cerebral, idea-driven, independent
   - Administrator: High A, High B, Low C, Mid D — proactive, outgoing, organized

   If all four primary dots are near the arrow, identify as Chameleon (statistically average, less than 0.57% of population, maximum flexibility).

   The spread between traits matters as much as individual positions: wide patterns are more extreme and predictable; narrow patterns are more moderate and flexible. The relationship between traits matters more than any individual dot.

6. **Interpret L (Logic) and I (Ingenuity) using absolute values.** These are the exception to the relative rule and can be compared directly between people: Done when: this step’s stated action, evidence, and checks are complete.
   - Logic: 0-2 Low (emotional, sensitive, passionate); 3-7 Normative (balanced head and heart); 8-10 High (rational, logical, compartmentalized)
   - Ingenuity: 0-2 Low (practical, grounded — most common score); 3-6 Occasional (moments of inspiration); 7-10 High (inventive, eccentric, detached from reality)

7. **Summarize 2-3 strengths from leading traits:** Done when: this step’s stated action, evidence, and checks are complete.
   - High A: initiative, self-confidence, strategic thinking
   - High B: relationship building, influence, verbal communication
   - High C: patience, focus, consistency, methodical approach
   - High D: precision, reliability, quality control, accountability
   - Low A: team orientation, service mindset, execution
   - Low B: focus, analytical depth, independence
   - Low C: urgency, multitasking, adaptability
   - Low D: flexibility, big-picture thinking, risk tolerance

8. **Identify 2-3 challenges from leading traits:** Done when: this step’s stated action, evidence, and checks are complete.
   - High A: difficulty with people, impatience, "me first" tendency
   - High B: may prioritize relationships over results, needs social interaction
   - High C: may resist change, slow to pivot, needs advance notice
   - High D: may be inflexible, perfectionist, struggle to delegate
   - Low A: may lack initiative, need clear direction, conflict avoidant
   - Low B: may seem cold or disengaged, prefers solitude
   - Low C: may create unnecessary urgency, interrupt others, prone to errors
   - Low D: may miss details, inconsistent follow-through, forgetful

9. **Compare Survey vs Job (if both graphs available).** Survey (top graph) is hardwired traits — who you ARE. Job (bottom graph) is adaptive behaviors — who you are TRYING TO BE. Large differences indicate behavior modification that drains energy and causes burnout if sustained 3-6+ months. Check: Done when: this step’s stated action, evidence, and checks are complete.
   - Which dots moved significantly between graphs?
   - Did the arrow shift? (Stress or frustration signal)
   - Did any dots flip to the opposite side? (Flight risk signal)
   - Calculate EU utilization: `(Job EU / Survey EU) × 100`
     - 70-130%: Healthy (sustainable)
     - >130%: Stress (burnout risk)
     - <70%: Frustration (flight risk)

10. **Compile the report.** Structure: name and archetype, trait table (position, distance, interpretation for each of A/B/C/D/L/I), leading traits ranked by distance, 2-3 strengths, 2-3 development areas, energy status (Survey EU, Job EU, utilization percentage and label), Survey-vs-Job comparison table if available, and 2-3 actionable recommendations. Done when: A/B/C/D use arrow-relative distances, L/I use absolute values, no trait is judged good or bad, the full pattern and available graph comparison are covered, EU utilization is calculated when possible, and Culture Index is framed as one data point.

## Failure and recovery
- **No extracted JSON available (only PDF):** Stop. Instruct the user to extract the PDF to JSON first. Do not fall back to visual estimation for trait scores. Vision may verify that extracted values look reasonable but must never extract trait scores.
- **Missing arrow or EU:** Report which fields are missing. Without the arrow, A/B/C/D distances cannot be calculated; interpret only L and I (absolute) and state that primary trait distances are unavailable.
- **Missing Job block:** Skip Survey-vs-Job comparison and EU utilization. Note "single survey only — no utilization comparison available." The interpretation is still complete for the Survey graph.
- **EU 0-10 (avoidant response):** Flag for review. The survey may not have been completed properly. Do not interpret as a valid energy level.
- **Partial result rule:** Return what can be validly interpreted and explicitly state what is missing or unverifiable. Never pretend the done predicate holds when data is incomplete.

## Output
A chat report containing: the named archetype, a trait table with position, distance, and interpretation for A, B, C, D, L, I, ranked leading traits, 2-3 strengths, 2-3 development areas, energy status with EU utilization percentage and label (when both graphs available), Survey-vs-Job comparison (when available), and 2-3 actionable recommendations. All A/B/C/D interpretations are relative to the arrow; L and I are absolute. No trait is labeled good or bad. Culture Index is stated as one data point.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, file /plugins/culture-index/skills/interpreting-culture-index/workflows/interpret-individual.md. License: CC-BY-SA-4.0. Preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Adapted from the individual interpretation workflow: domain reference content (primary traits, secondary traits, patterns-archetypes, anti-patterns) inlined to make the procedure self-contained; extraction-script and multi-workflow routing removed as out of scope for single-profile interpretation.
