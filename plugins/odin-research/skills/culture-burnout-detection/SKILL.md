---
name: culture-burnout-detection
description: 'Use when Survey and Job Culture Index profiles need analysis for stress, burnout, disengagement, or flight-risk signals. Calculates energy utilization, trait shifts, and a defined risk level from the paired charts, with nonclinical recommendations. Not for clinical diagnosis — use a qualified clinician.'
---

# Culture burnout detection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Survey and Job Culture Index profiles need analysis for stress, frustration, burnout, disengagement, or flight-risk signals. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: energy utilization, arrow and trait movement, polarizing shifts, risk level, likely stress sources, and interventions. |
| Done | Energy utilization and every trait movement are calculated, material shifts are flagged, a risk level is assigned by the defined rules, uncertainty is stated, and actionable nonclinical recommendations are produced. |

## Inputs

Two Culture Index charts for one person are required: the Survey graph (who they are, hardwired) and the Job graph (who they are trying to be at work, adaptive). For each chart, supply: arrow position (tenths), every trait value A B C D L I (integer 0-10), and the EU value (integer). Trait values may be given as `[absolute, relative-to-arrow]` tuples; use the relative value for interpretation. State how long the current Job behavior has been sustained if known; mark it unknown otherwise. This skill never extracts values from a PDF by visual estimation and never substitutes a single chart for the pair.

## Procedure

1. Load both charts. Record arrow position, all trait values (A, B, C, D, L, I), and EU for Survey and for Job. Stop if either chart is missing. Done when: both charts are loaded with all values recorded.
2. Calculate energy utilization: `Utilization = (Job EU / Survey EU) x 100`. Classify the utilization band: 70-130% Healthy (sustainable), above 130% STRESS (overutilization, burnout risk), below 70% FRUSTRATION (underutilization, flight risk). For above 130%, distinguish good stress (self-induced, caring deeply) from bad stress (too much work or too much behavior modification); both still carry burnout risk after 3-6 months. For below 70%, the work does not fit their traits and flight risk rises if unaddressed. Done when: utilization is calculated and the band is classified.
3. Compare arrow movement Survey to Job. Arrow shifts right = STRESS (pushing harder than natural). Arrow shifts left = FRUSTRATION (pulling back, disengaging). Unchanged = stable. Done when: arrow direction is recorded.
4. Analyze each trait's movement Survey to Job and record the signed change. Interpret raising versus dropping: A raising = needs to drive/lead more (self-induced or required); A dropping = being held back (ask who or what is blocking). B raising = role requires more relationship building; B dropping = role isolates them (demotivating if naturally high B). C raising = more focus/patience required than comfortable; C dropping = more urgency/variety required than comfortable. D raising = expected to be more perfectionist/accountable; D dropping = role allows more flexibility. L raising = trying to be more emotional/open; L dropping = compartmentalizing emotions at work. I raising = trying to be more inventive (traditional approach not working); I dropping = forced into traditional approach when naturally inventive. Done when: every trait's signed change and interpretation is recorded.
5. Identify polarizing shifts: any trait dot that moves from one side of the norm to the other. Record the trait, the side it moved from and to, and severity (moderate for a one-side-to-norm shift, severe for a full side-to-opposite-side flip). A polarizing shift is drastic behavior modification and is almost certainly not sustainable. Done when: all polarizing shifts are recorded with severity.
6. Check for the opposite-pattern warning: when Job behaviors show the opposite of Survey traits across the board (all dots flipped to the opposite side). This is an imminent flight-risk signal; something must change or the person will leave. Done when: the opposite-pattern check is recorded as present or absent.
7. Check D specifically as the most common stress indicator: D raised significantly = expected to be more perfectionist/accountable than natural; D polarizing low to high = the most common source of unsustainable stress. Done when: the D check is recorded.
8. Assign risk level using these rules. Evaluate the five inputs in order and assign the highest level any rule triggers:
   - CRITICAL: opposite-pattern warning is present, OR utilization is above 160% or below 50%, OR two or more severe polarizing shifts are present.
   - HIGH: utilization is above 130% or below 70% AND at least one severe polarizing shift is present, OR utilization is above 130% or below 70% AND the behavior has been sustained 3-6 months or longer, OR three or more moderate polarizing shifts are present.
   - MODERATE: utilization is above 130% or below 70% with no polarizing shifts, OR utilization is in the Healthy band (70-130%) AND one or two moderate polarizing shifts are present, OR arrow movement is STRESS or FRUSTRATION with no polarizing shifts.
   - LOW: utilization is in the Healthy band (70-130%), arrow is stable, no polarizing shifts, and no opposite-pattern warning.
   Done when: a risk level is assigned with the triggering rule cited.
9. Identify likely stress sources. Job behaviors reflect perception of what the role requires. Sources are their leader (manager expectations and communication), the work itself (actual responsibilities), and coworkers. Ask why they perceive they need to behave this way. Done when: stress sources are identified from the trait evidence.
10. Produce the report in the Output format. Recommendations must be actionable and nonclinical, tied to the risk level. Avoid these mistakes: ignoring small EU differences (even 10-15% over 130% matters), focusing only on EU (trait movement matters too), dismissing good stress (self-induced stress still causes burnout), using stale data (Job behaviors should be resurveyed every 6 months), and recommending solutions before understanding the source. Done when: the report is produced with recommendations tied to the risk level.

## Failure and recovery

- Missing chart: If either Survey or Job graph is absent, stop. Report which chart is missing and that burnout detection requires both. Do not infer the missing chart or fall back to a single-chart interpretation.
- Invalid trait values: If any trait value is not an integer 0-10, arrow position is not in tenths, or EU is not an integer, stop and report the offending field. Do not coerce or estimate.
- Visual-estimation refusal: Never extract trait values from a PDF by visual estimation (20-30% error rate). If only a PDF is available and no extracted values are supplied, stop and request extracted values.
- Division by zero: If Survey EU is 0, utilization cannot be calculated. Report this and stop; do not substitute a placeholder percentage.
- Partial-result rule: A partial report with some traits analyzed but others blocked is not a valid done state. Either every trait movement is calculated or the run is blocked with the specific blocker named.
- Non-mutation: This skill writes nothing to disk, VCS, credentials, or any remote system. A blocked run leaves no side effect beyond the chat message naming the blocker.

## Output

Return, in order: subject and evidence limits; energy utilization with band; arrow movement direction; material trait movements with interpretations; polarizing shifts with severity; opposite-pattern warning status; D-specific check; the assigned risk level with the triggering rule; likely stress sources; nonclinical workplace recommendations tied to the risk level; timeline (known duration or unknown); explicit uncertainties.
