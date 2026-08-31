---
name: culture-interview-profile-prediction
description: 'Use when asked to predict Culture Index traits from an interview transcript before a survey exists. Also handles uncertain traits when evidence is sparse or contradictory. Not for interpreting completed survey results.'
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

- Required: An interview transcript with interviewer questions and candidate responses distinguishable. Multiple interviews increase confidence.
- Optional: Timestamps or durations. Candidate name and interview metadata for the report header.

## Procedure

1. **Load the transcript.** Confirm interviewer questions and candidate responses are distinguishable. If they are not, stop and request a separated transcript. Done when: this step's stated action, evidence, and checks are complete.

2. **Initial read-through.** Note overall communication style, energy level, topics that engage the candidate, and default communication mode before detailed analysis. Done when: this step's stated action, evidence, and checks are complete.

3. **Analyze A (Autonomy).** Search the transcript for autonomy signals. High A: first-person ownership ("I decided", "I built"), takes personal credit, reframes or pushes back on questions, acted without being asked, assertive tone. Low A: collective language ("we decided", "our team"), deflects credit to team, asks for clarification, waited for direction, tentative tone. Record position (High / Low / Normative), confidence (High / Medium / Low), and 2-3 supporting quotes. Done when: this step's stated action, evidence, and checks are complete.

4. **Analyze B (Social).** Search for social signals. High B: builds rapport, asks about the interviewer, people-centric narratives, verbose responses, animated energy, asks about team and social activities. Low B: gets straight to business, task-centric descriptions, brief direct answers, reserved energy, asks about work and tools. Record position, confidence, and 2-3 quotes. Done when: this step's stated action, evidence, and checks are complete.

5. **Analyze C (Pace).** Search for pace signals. High C: pauses and thinks before answering, methodical sequential structure, asks for clarification on ambiguity, prefers stability, one topic at a time. Low C: rapid responses, topic-jumps and tangents, comfortable with unknowns, thrives with pivots, handles multiple threads at once. Record position, confidence, and 2-3 quotes. Done when: this step's stated action, evidence, and checks are complete.

6. **Analyze D (Conformity).** Search for conformity signals. High D: specific numbers and dates, references rules and best practices, structured answers following question format, mentions checking work and standards, follows structure. Low D: approximations and ranges, describes creative approaches, free-flowing interpretive answers, mentions outcomes and results, challenges premises. Record position, confidence, and 2-3 quotes. Done when: this step's stated action, evidence, and checks are complete.

7. **Analyze L (Logic) on the absolute 0-10 scale.** High L (8-10): data-driven analytical framing ("the numbers showed"), emotion-neutral on difficult topics, evidence-based decisions. Low L (0-2): values-driven emotional framing ("it felt right"), empathetic and emotional on difficult topics, intuition-based decisions. Record a 0-10 score estimate, confidence, and 1-2 quotes. Done when: this step's stated action, evidence, and checks are complete.

8. **Analyze I (Ingenuity) on the absolute 0-10 scale.** High I (7-10): novel problem-solving approaches, questions and challenges assumptions, original creative examples, mentions boredom with routine. Low I (0-2): proven methods, accepts and follows assumptions, standard textbook examples, describes comfort with routine. Record a 0-10 score estimate, confidence, and 1-2 quotes. Done when: this step's stated action, evidence, and checks are complete.

9. **Identify the likely pattern.** Cross-reference trait positions: High A + Low B + Low C + Low D → Architect/Visionary; High A + High B + Low C → Rainmaker/Persuader; Low A + Low B + High C + High D → Scholar/Specialist; Low A + High B + High C → Accommodator; Low A + Low B + Low C + High D → Technical Expert. Only name a pattern if confidence is sufficient; otherwise state "insufficient data for pattern identification." Done when: this step's stated action, evidence, and checks are complete.

10. **Flag uncertainty areas.** Document traits with only 1-2 data points, traits with inconsistent signals, topics not covered in the interview, and signs of "interview mode" performance. Done when: this step's stated action, evidence, and checks are complete.

11. **Generate the predicted profile** following the Output contract. Done when: every trait has a cited quote and confidence level, uncertainty and caveats are explicit, no low-data trait is over-confident, and predictions are distinguished from survey results.

## Failure and recovery
- Indistinguishable speakers: If interviewer and candidate cannot be separated in the transcript, stop and request a clarified transcript. Do not guess speaker attribution.
- Insufficient transcript length: If the transcript is too short to yield evidence for most traits, return partial predictions for traits with evidence, label all others "insufficient data," and state that the done predicate is not met.
- Inconsistent signals: When a trait shows contradictory evidence, record the conflict, lower confidence to Low, and note it as an uncertainty area rather than forcing a position.
- No rollback needed: This skill is read-only and produces chat output only. No state is mutated.

## Output
Return, in order: candidate and transcript header; per-trait prediction table with confidence and supporting quotes; likely pattern or insufficient-data verdict; uncertainty areas; evidence summary; caveats distinguishing prediction from survey result.
