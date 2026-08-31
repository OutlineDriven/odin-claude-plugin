---
name: culture-interview-debrief
description: 'Use when a predicted Culture Index profile needs comparison with role requirements, team composition, and manager profile to inform a hiring decision. Maps trait matches and confidence to numeric scores, produces a recommendation on a defined ladder, and names verification areas. Not for transcript prediction — use culture-interview-profile-prediction.'
---

# Culture interview debrief

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A predicted Culture Index profile needs comparison with role requirements, team composition, and manager profile during an interview debrief. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Produces chat output only. |
| Side effect | Confidence-weighted role, team, manager, and red-flag assessment with scored dimensions, recommendation, and verification areas, returned in chat. |
| Done | Predicted-versus-required traits, confidence, red flags, scored dimensions with numeric values, a recommendation on the defined ladder, and survey follow-ups are explicit without treating predictions as facts. |

## Inputs

Required:
- Predicted Culture Index profile from interview transcript analysis: traits A (Autonomy), B (Social Ability), C (Pace/Patience), D (Conformity) each as High/Low/Norm; L (Logic) and I (Ingenuity) each as 0-10; predicted pattern name; per-trait confidence (High/Medium/Low) with key evidence quotes; interview source type, duration, and date.
- Role context: position title and either a hiring profile (target traits, target pattern, role red flags) or answers to the role-fit questions (macro or micro; people or problems; repetition level; process adherence).

Optional:
- Team composition: current team member profiles or a Gas/Brake/Glue count (Gas = High A, Brake = High D, Glue = High B).
- Hiring manager profile: manager trait positions for A, B, C, D.

Predictions are preliminary; the actual Culture Index survey is administered after offer acceptance. Do not request or treat actual survey results as input.

## Procedure

1. Load the predicted profile. Record each trait (A, B, C, D as High/Low/Norm; L, I as 0-10), the predicted pattern, per-trait confidence, and the interview source and date. If any trait or its confidence is missing, mark it unknown and exclude it from scoring. Done when: the predicted profile is loaded with all available traits and confidence recorded.

2. Load role requirements. If a hiring profile exists, extract target traits, target pattern, and role red flags. Otherwise derive required trait directions from the role-fit answers: macro -> A High, micro -> A Low; people -> B High, problems -> B Low; high repetition -> C High, low repetition -> C Low; strict process -> D High, flexible process -> D Low. Record the target pattern and list traits that would struggle in the role. Done when: role requirements are loaded with target traits and red flags.

3. Compare predicted versus required for each trait. Classify each as Y (strong match: same direction, similar magnitude), ~ (acceptable: within tolerance), or N (mismatch: opposite direction or extreme gap). Note any concern per trait. Done when: every available trait has a Y, ~, or N classification with any concern noted.

4. Check predicted traits against role red flags. For each red flag, record whether the prediction hits it and severity (High/Medium/Low). Count total hits. Done when: every red flag is checked with hit status and severity.

5. Assess team fit if team data is available. Count current Gas (High A), Brake (High D), and Glue (High B). Mark whether the candidate would add needed Gas, Brake, Glue, or perspective diversity. List friction risks where candidate traits oppose team member traits. Done when: team fit is assessed or recorded as omitted.

6. Assess manager fit if the manager profile is available. Compare manager versus predicted candidate positions for A, B, C, D and record the gap per trait. List predicted working-relationship alignment and friction points. Done when: manager fit is assessed or recorded as omitted.

7. Calculate the weighted dimension score. Map each trait's match classification to a numeric value: Y -> 3, ~ -> 2, N -> 0. Map each trait's confidence to a weight: High -> 1.0, Medium -> 0.67, Low -> 0.33. For each dimension (role fit, team fit, red-flag impact, manager fit), compute the dimension score as the average of (match_value x confidence_weight) across the traits in that dimension, yielding a 0-3 scale. For red-flag impact, invert: no hit -> 3, Low-severity hit -> 2, Medium-severity hit -> 1, High-severity hit -> 0, weighted by the trait confidence the hit rests on. Omit any dimension lacking its input rather than scoring it as zero. Compute the overall score as the average of the available dimension scores. Done when: every available dimension has a 0-3 numeric score and the overall score is computed.

8. Map the overall score to a recommendation on this ladder:
   - Overall >= 2.5 and no High-severity red-flag hit: Proceed — extend offer, plan for survey verification.
   - Overall >= 2.0 and < 2.5, or overall >= 2.5 with a High-severity red-flag hit: Proceed with awareness — extend offer, prepare onboarding adjustments, flag the red-flag area for survey verification.
   - Overall >= 1.5 and < 2.0: Discuss — review concerns with the hiring team before deciding.
   - Overall < 1.5: Pause — additional interviews or reconsider the candidate.
   Any High-severity red-flag hit caps the recommendation at Proceed with awareness regardless of score. Done when: a recommendation is assigned with the triggering threshold cited.

9. Compile the debrief. Include predicted profile summary with confidence; fit assessment for each available dimension with its numeric score; red flags with hit count and severity; the overall score and the recommendation with a one-to-two sentence rationale; areas to verify with the actual survey (lower-confidence traits, role-critical traits, borderline predictions); onboarding considerations if hired; and caveats: predictions are not facts, interview behavior may differ from natural behavior, the actual survey follows offer acceptance, predictions should inform not determine hiring, Culture Index predicts drives not capabilities, and technical skills, experience, and cultural interview still matter. Done when: the debrief is compiled with all sections.

## Failure and recovery

- Missing predicted profile: stop and request it. Do not invent traits, confidence, or evidence.
- Missing role context: stop and request either a hiring profile or role-fit answers. Do not infer role requirements without input.
- Missing optional team or manager data: proceed, omitting that dimension from scoring and the report. State which dimensions were omitted and why.
- Contradictory evidence within the prediction: flag the contradiction in the report and lower confidence for the affected trait rather than silently picking one side.
- Partial result rule: return the dimensions that could be assessed with their numeric scores and the omitted dimensions explicitly listed. Never present an omitted dimension as assessed.
- Non-mutation: no files, records, offers, or survey invitations are created or modified. The report is chat output only.

## Output

A chat debrief report containing: predicted profile summary with per-trait confidence; predicted-versus-required comparison with Y / ~ / N match classification; red-flag check with hit count and severity; team fit (if data available) with Gas/Brake/Glue contribution and friction risks; manager fit (if data available) with trait gaps and working-relationship points; per-dimension numeric scores on the 0-3 scale with the match-to-numeric mapping shown; the overall score; a recommendation on the Proceed / Proceed with Awareness / Discuss / Pause ladder with the triggering threshold cited and a rationale; areas to verify with the actual survey; onboarding considerations; and prediction-limitation caveats.
