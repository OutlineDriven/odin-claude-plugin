---
name: culture-interview-profile-prediction
description: 'Use when asked to predict Culture Index traits from an interview transcript before a survey exists. Returns per-trait predictions with confidence, supporting quotations, likely pattern, uncertainty areas, and caveats. Don''t use for tasks that require source or remote-system changes.'
---

# Culture interview profile prediction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An interview transcript needs a caveated, confidence-scored prediction of Culture Index traits before a survey exists. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Analyzes supplied transcript text only. |
| Side effect | Chat output: per-trait predictions, confidence levels, supporting quotations, likely pattern, uncertainty areas, and caveats. |
| Done | All six traits have evidence and confidence, weak evidence is labeled, and the output clearly distinguishes prediction from survey result. |

## Inputs

- **Required:** An interview transcript with interviewer questions and candidate responses distinguishable. Multiple interviews increase confidence.
- **Optional:** Timestamps or durations. Candidate name and interview metadata for the report header.

## Procedure

1. **Load the transcript.** Confirm interviewer questions and candidate responses are distinguishable. If they are not, stop and request a separated transcript.

2. **Initial read-through.** Note overall communication style, energy level, topics that engage the candidate, and default communication mode before detailed analysis.

3. **Analyze A (Autonomy).** Search the transcript for autonomy signals. High A: first-person ownership ("I decided", "I built"), takes personal credit, reframes or pushes back on questions, acted without being asked, assertive tone. Low A: collective language ("we decided", "our team"), deflects credit to team, asks for clarification, waited for direction, tentative tone. Record position (High / Low / Normative), confidence (High / Medium / Low), and 2-3 supporting quotes.

4. **Analyze B (Social).** Search for social signals. High B: builds rapport, asks about the interviewer, people-centric narratives, verbose responses, animated energy, asks about team and social activities. Low B: gets straight to business, task-centric descriptions, brief direct answers, reserved energy, asks about work and tools. Record position, confidence, and 2-3 quotes.

5. **Analyze C (Pace).** Search for pace signals. High C: pauses and thinks before answering, methodical sequential structure, asks for clarification on ambiguity, prefers stability, one topic at a time. Low C: rapid responses, topic-jumps and tangents, comfortable with unknowns, thrives with pivots, multi-threads. Record position, confidence, and 2-3 quotes.

6. **Analyze D (Conformity).** Search for conformity signals. High D: specific numbers and dates, references rules and best practices, structured answers following question format, mentions checking work and standards, follows structure. Low D: approximations and ranges, describes creative approaches, free-flowing interpretive answers, mentions outcomes and results, challenges premises. Record position, confidence, and 2-3 quotes.

7. **Analyze L (Logic) on the absolute 0-10 scale.** High L (8-10): data-driven analytical framing ("the numbers showed"), emotion-neutral on difficult topics, evidence-based decisions. Low L (0-2): values-driven emotional framing ("it felt right"), empathetic and emotional on difficult topics, intuition-based decisions. Record a 0-10 score estimate, confidence, and 1-2 quotes.

8. **Analyze I (Ingenuity) on the absolute 0-10 scale.** High I (7-10): novel problem-solving approaches, questions and challenges assumptions, original creative examples, mentions boredom with routine. Low I (0-2): proven methods, accepts and follows assumptions, standard textbook examples, describes comfort with routine. Record a 0-10 score estimate, confidence, and 1-2 quotes.

9. **Identify the likely pattern.** Cross-reference trait positions: High A + Low B + Low C + Low D → Architect/Visionary; High A + High B + Low C → Rainmaker/Persuader; Low A + Low B + High C + High D → Scholar/Specialist; Low A + High B + High C → Accommodator; Low A + Low B + Low C + High D → Technical Expert. Only name a pattern if confidence is sufficient; otherwise state "insufficient data for pattern identification."

10. **Flag uncertainty areas.** Document traits with only 1-2 data points, traits with inconsistent signals, topics not covered in the interview, and signs of "interview mode" performance.

11. **Generate the predicted profile** following the Output format. Every trait prediction must cite a specific quote, carry a confidence level, and distinguish prediction from survey result.

12. **Verify before finalizing.** Confirm every trait has a cited quote, every trait has a confidence level, uncertainties are flagged, caveats are stated, and no low-data trait is over-confident. Avoid over-interpreting single quotes, ignoring interview context, treating predictions as definitive, skipping low-confidence traits, assuming interview behavior matches daily behavior, or making claims without evidence.

## Failure and recovery
- **Indistinguishable speakers:** If interviewer and candidate cannot be separated in the transcript, stop and request a clarified transcript. Do not guess speaker attribution.
- **Insufficient transcript length:** If the transcript is too short to yield evidence for most traits, return partial predictions for traits with evidence, label all others "insufficient data," and state that the done predicate is not met.
- **Inconsistent signals:** When a trait shows contradictory evidence, record the conflict, lower confidence to Low, and note it as an uncertainty area rather than forcing a position.
- **No rollback needed:** This skill is read-only and produces chat output only. No state is mutated.

## Output
A predicted profile report with these sections:

- **Header:** Candidate name, analysis date, transcript source (interview type, duration, interviewers), overall confidence (High / Medium / Low).
- **Trait predictions table:** One row per trait (A, B, C, D, L, I) with predicted position or score, confidence (H/M/L), and a supporting quote.
- **Predicted pattern:** Pattern name if identifiable, with a 1-2 sentence description; otherwise "insufficient data for pattern identification."
- **Strongest signals:** The two clearest trait signals with quotes.
- **Uncertainty areas:** Traits or topics where more data is needed or signals were mixed.
- **Interview context notes:** Factors that may have affected behavior, signs of performance mode.
- **Caveats:** This is a prediction based on interview behavior, not a Culture Index survey result. Interview stress may affect natural behavior patterns. The actual survey will be administered after offer acceptance. Use for preliminary assessment only.

## Provenance

- **Origin:** Trail of Bits skills repository, `plugins/culture-index/skills/interpreting-culture-index/workflows/predict-from-interview.md`.
- **Revision:** d1f1575cff97816e5cc08af66cd2506099c681d3
- **Source:** https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3
- **License:** CC-BY-SA-4.0. Preserve Trail of Bits attribution and source link. Mark modifications. License adaptations ShareAlike. Claim no trademark rights. Never reuse trail-of-bits-mark.svg as branding.
- **Adaptation:** Clean-room adaptation. The transcript-based prediction workflow was extracted as a standalone skill with self-contained trait signal definitions, removing dependencies on the parent interpreting-culture-index skill's reference files and routing.
