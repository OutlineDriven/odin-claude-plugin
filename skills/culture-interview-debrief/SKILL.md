---
name: culture-interview-debrief
description: 'Use when a predicted Culture Index profile needs comparison with role requirements, team composition, and manager profile. Also handles missing team or manager data when gaps are explicit. Not for transcript prediction — use culture-interview-profile-prediction.'
---

# Culture interview debrief

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A predicted Culture Index profile needs comparison with role requirements, team composition, and manager profile during an interview debrief. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Produces chat output only. |
| Side effect | Confidence-weighted role, team, manager, and red-flag assessment with recommendation and verification areas, returned in chat. |
| Done | Predicted-versus-required traits, confidence, red flags, fit dimensions, and survey follow-ups are explicit without treating predictions as facts. |

## Inputs

Required:
- Predicted Culture Index profile from interview transcript analysis: traits A (Autonomy), B (Social Ability), C (Pace/Patience), D (Conformity) each as High/Low/Norm; L (Logic) and I (Ingenuity) each as 0–10; predicted pattern name; per-trait confidence (High/Medium/Low) with key evidence quotes; interview source type, duration, and date.
- Role context: position title and either a hiring profile (target traits, target pattern, role red flags) or answers to the role-fit questions (macro or micro; people or problems; repetition level; process adherence).

Optional:
- Team composition: current team member profiles or a Gas/Brake/Glue count (Gas = High A, Brake = High D, Glue = High B).
- Hiring manager profile: manager trait positions for A, B, C, D.

Predictions are preliminary; the actual Culture Index survey is administered after offer acceptance. Do not request or treat actual survey results as input.

## Procedure

1. Load the predicted profile. Record each trait (A, B, C, D as High/Low/Norm; L, I as 0–10), the predicted pattern, per-trait confidence, and the interview source and date. If any trait or its confidence is missing, mark it unknown and exclude it from weighted scoring. Done when: this step’s stated action, evidence, and checks are complete.

2. Load role requirements. If a hiring profile exists, extract target traits, target pattern, and role red flags. Otherwise derive required trait directions from the role-fit answers: macro → A High, micro → A Low; people → B High, problems → B Low; high repetition → C High, low repetition → C Low; strict process → D High, flexible process → D Low. Record the target pattern and list traits that would struggle in the role. Done when: this step’s stated action, evidence, and checks are complete.

3. Compare predicted versus required for each trait. Classify each as Y (strong match: same direction, similar magnitude), ~ (acceptable: within tolerance), or N (mismatch: opposite direction or extreme gap). Note any concern per trait. Done when: this step’s stated action, evidence, and checks are complete.

4. Check predicted traits against role red flags. For each red flag, record whether the prediction hits it and severity (High/Medium/Low). Count total hits. Done when: this step’s stated action, evidence, and checks are complete.

5. Assess team fit if team data is available. Count current Gas (High A), Brake (High D), and Glue (High B). Mark whether the candidate would add needed Gas, Brake, Glue, or perspective diversity. List friction risks where candidate traits oppose team member traits. Done when: this step’s stated action, evidence, and checks are complete.

6. Assess manager fit if the manager profile is available. Compare manager versus predicted candidate positions for A, B, C, D and record the gap per trait. List predicted working-relationship alignment and friction points. Done when: this step’s stated action, evidence, and checks are complete.

7. Weight confidence. For each dimension (role fit, team fit, red-flag hits, manager fit) rate the assessment Strong/Moderate/Weak and multiply by the dimension confidence (High → 3, Medium → 2, Low → 1) to get a weighted score. Apply caveats: low-confidence traits may change significantly when the actual survey is administered; medium-confidence traits are directionally correct but magnitude uncertain; high-confidence traits are likely accurate but interview stress may have affected them. Omit any dimension lacking its input rather than scoring it as zero. Done when: this step’s stated action, evidence, and checks are complete.

8. Generate a recommendation from the weighted assessment: Strong fit, high confidence → Proceed (extend offer, plan for survey); Strong fit, low confidence → Proceed with note (extend offer, flag traits to verify); Moderate fit → Proceed with awareness (extend offer, prepare onboarding adjustments); Weak fit with concerns → Discuss (review concerns with hiring team); Red-flag hits → Pause (additional interviews or reconsider). Done when: this step’s stated action, evidence, and checks are complete.

9. Compile the debrief. Include predicted profile summary with confidence; fit assessment for each available dimension; red flags; the recommendation with a one-to-two sentence rationale; areas to verify with the actual survey (lower-confidence traits, role-critical traits, borderline predictions); onboarding considerations if hired; and caveats: predictions are not facts, interview behavior may differ from natural behavior, the actual survey follows offer acceptance, predictions should inform not determine hiring, Culture Index predicts drives not capabilities, and technical skills, experience, and cultural interview still matter. Done when: this step’s stated action, evidence, and checks are complete.

## Failure and recovery
- Missing predicted profile: stop and request it. Do not invent traits, confidence, or evidence.
- Missing role context: stop and request either a hiring profile or role-fit answers. Do not infer role requirements without input.
- Missing optional team or manager data: proceed, omitting that dimension from scoring and the report. State which dimensions were omitted and why.
- Contradictory evidence within the prediction: flag the contradiction in the report and lower confidence for the affected trait rather than silently picking one side.
- Partial result rule: return the dimensions that could be assessed with their confidence and the omitted dimensions explicitly listed. Never present an omitted dimension as assessed.
- Non-mutation: no files, records, offers, or survey invitations are created or modified. The report is chat output only.

## Output
A chat debrief report containing: predicted profile summary with per-trait confidence; predicted-versus-required comparison with Y / ~ / N match classification; red-flag check with hit count and severity; team fit (if data available) with Gas/Brake/Glue contribution and friction risks; manager fit (if data available) with trait gaps and working-relationship points; confidence-weighted scores per dimension; a recommendation on the Proceed / Proceed with Note / Proceed with Awareness / Discuss / Pause ladder with rationale; areas to verify with the actual survey; onboarding considerations; and prediction-limitation caveats.

## Provenance

Adapted from Trail of Bits skills (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3), file plugins/culture-index/skills/interpreting-culture-index/workflows/interview-debrief.md. Licensed CC-BY-SA-4.0: preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Modifications: procedure and report structure re-expressed as a self-contained ODIN skill.
