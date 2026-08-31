---
name: culture-burnout-detection
description: 'Use when Survey and Job Culture Index profiles need analysis for stress, burnout, disengagement, or flight-risk signals. Also handles frustration when Job energy falls below Survey energy. Not for clinical diagnosis — use a qualified clinician.'
---

# Culture burnout detection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Survey and Job Culture Index profiles need analysis for stress, frustration, burnout, disengagement, or flight-risk signals. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: energy utilization, arrow and trait movement, polarizing shifts, risk level, likely stress sources, and interventions. |
| Done | Energy utilization and every trait movement are calculated, material shifts are flagged, uncertainty is stated, and actionable nonclinical recommendations are produced. |

## Inputs

Two Culture Index charts for one person are required: the Survey graph (who they are, hardwired) and the Job graph (who they are trying to be at work, adaptive). For each chart, supply: arrow position (tenths), every trait value A B C D L I (integer 0-10), and the EU value (integer). Trait values may be given as `[absolute, relative-to-arrow]` tuples; use the relative value for interpretation. State how long the current Job behavior has been sustained if known; mark it unknown otherwise. This skill never extracts values from a PDF by visual estimation and never substitutes a single chart for the pair.

## Procedure

1. Load both charts. Record arrow position, all trait values (A, B, C, D, L, I), and EU for Survey and for Job. Stop if either chart is missing. Done when: this step’s stated action, evidence, and checks are complete.
2. Calculate energy utilization: `Utilization = (Job EU / Survey EU) × 100`. Classify: 70-130% Healthy (sustainable), >130% STRESS (overutilization, burnout risk), <70% FRUSTRATION (underutilization, flight risk). For >130%, distinguish good stress (self-induced, caring deeply) from bad stress (too much work or too much behavior modification); both still carry burnout risk after 3-6 months. For <70%, the work does not fit their traits and flight risk rises if unaddressed. Done when: this step’s stated action, evidence, and checks are complete.
3. Compare arrow movement Survey to Job. Arrow shifts right = STRESS (pushing harder than natural). Arrow shifts left = FRUSTRATION (pulling back, disengaging). Unchanged = stable. Done when: this step’s stated action, evidence, and checks are complete.
4. Analyze each trait's movement Survey to Job and record the signed change. Interpret raising versus dropping: A raising = needs to drive/lead more (self-induced or required); A dropping = being held back (ask who or what is blocking). B raising = role requires more relationship building; B dropping = role isolates them (demotivating if naturally high B). C raising = more focus/patience required than comfortable; C dropping = more urgency/variety required than comfortable. D raising = expected to be more perfectionist/accountable; D dropping = role allows more flexibility. L raising = trying to be more emotional/open; L dropping = compartmentalizing emotions at work. I raising = trying to be more inventive (traditional approach not working); I dropping = focusing on practical execution. Done when: this step’s stated action, evidence, and checks are complete.
5. Identify polarizing shifts: any trait dot that moves from one side of the norm to the other. Record the trait, the side it moved from and to, and severity (moderate or severe). A polarizing shift is drastic behavior modification and is almost certainly not sustainable. Done when: this step’s stated action, evidence, and checks are complete.
6. Check for the opposite-pattern warning: when Job behaviors show the opposite of Survey traits across the board (all dots flipped to the opposite side). This is an imminent flight-risk signal; something must change or the person will leave. Done when: this step’s stated action, evidence, and checks are complete.
7. Check D specifically as the most common stress indicator: D raised significantly = expected to be more perfectionist/accountable than natural; D polarizing low to high = the most common source of unsustainable stress. Done when: this step’s stated action, evidence, and checks are complete.
8. Identify likely stress sources. Job behaviors reflect perception of what the role requires. Sources are their leader (manager expectations and communication), the work itself (actual responsibilities), and coworkers. Ask why they perceive they need to behave this way. Done when: this step’s stated action, evidence, and checks are complete.
9. Assess the 3-6 month risk. If behavior modification has continued 3-6+ months, expect burnout, stress, disengagement, low morale, and mailing it in (70% effort when capable of 100%). Use the known duration if supplied; otherwise state the duration as unknown and note the risk horizon is conditional on sustained modification. Done when: this step’s stated action, evidence, and checks are complete.
10. Assign risk level: LOW, MODERATE, HIGH, or CRITICAL, based on utilization band, arrow movement, number and severity of polarizing shifts, the opposite-pattern warning, and sustained duration. Done when: this step’s stated action, evidence, and checks are complete.
11. Produce the report in the Output format. Recommendations must be actionable and nonclinical. Avoid these mistakes: ignoring small EU differences (even 10-15% over 130% matters), focusing only on EU (trait movement matters too), dismissing good stress (self-induced stress still causes burnout), using stale data (Job behaviors should be resurveyed every 6 months), and recommending solutions before understanding the source. Done when: this step’s stated action, evidence, and checks are complete.

## Failure and recovery
- Missing chart: If either Survey or Job graph is absent, stop. Report which chart is missing and that burnout detection requires both. Do not infer the missing chart or fall back to a single-chart interpretation.
- Invalid trait values: If any trait value is not an integer 0-10, arrow position is not in tenths, or EU is not an integer, stop and report the offending field. Do not coerce or estimate.
- Visual-estimation refusal: Never extract trait values from a PDF by visual estimation (20-30% error rate). If only a PDF is available and no extracted values are supplied, stop and request extracted values.
- Division by zero: If Survey EU is 0, utilization cannot be calculated. Report this and stop; do not substitute a placeholder percentage.
- Partial-result rule: A partial report with some traits analyzed but others blocked is not a valid done state. Either every trait movement is calculated or the run is blocked with the specific blocker named.
- Non-mutation: This skill writes nothing to disk, VCS, credentials, or any remote system. A blocked run leaves no side effect beyond the chat message naming the blocker.

## Output
Return, in order: subject and evidence limits; energy utilization; material trait movements; stress, frustration, burnout, disengagement, and flight-risk signals; current impact; nonclinical workplace recommendations; timeline; explicit uncertainties.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, file /plugins/culture-index/skills/interpreting-culture-index/workflows/detect-burnout.md. License CC-BY-SA-4.0. Preserve Trail of Bits attribution and the source link. This is an adaptation: modifications are marked, adaptations are licensed ShareAlike under CC-BY-SA-4.0, no trademark rights are claimed, and trail-of-bits-mark.svg is never reused as branding. The two-chart temporal comparison, energy-utilization thresholds, arrow-movement signals, per-trait raising/dropping interpretation, polarizing-shift and opposite-pattern warnings, stress-source categories, 3-6 month risk horizon, D-trait stress check, and the report template are preserved from the source workflow.
