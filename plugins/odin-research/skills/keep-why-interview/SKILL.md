---
name: keep-why-interview
description: 'Use when departing knowledge must enter project topic files through a narration-first interview, targeted gap closure, privacy filtering, and Source = interview. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why interview

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Maintainer knowledge is about to become unavailable (leaving, retiring, team change) or user requests a knowledge-transfer interview. |
| Authority | Reversible local: write only synthesized topic-file entries; no session narrative, no personal details, no verbatim transcription of raw material. |
| Side effect | Synthesized topic-file entries written to local project knowledge file(s) with Source = interview; entries are self-contained without private context. |
| Done | All code-unexplainable gaps either answered or explicitly marked OPEN; tacit-knowledge subjects get narration-first flow; entries self-contained without private context; no invented rationale. |

## Inputs

- Required: A human subject (departing maintainer or domain expert), a location for topic-file entries (project memory/knowledge file or directory), and the interview's topic scope.
- Optional: Existing topic file(s) to append to or extend.
- Required: The interview must be a live conversation; the model facilitates and captures synthesized knowledge in real time.

## Procedure

1. **Open the interview.**
   Explain the purpose: capture tacit knowledge and decision rationale for future maintainers. Confirm the scope and topic boundaries with the human subject. Done when: scope and topic boundaries are confirmed by the subject.

2. **Phase 1 — Narration-first elicitation.**
   Ask open-ended questions that surface why rather than what:
   - What decisions are you most concerned will not survive your departure?
   - What have you chosen not to do, and why?
   - What patterns, shortcuts, or assumptions exist that are not obvious from the code?
   - What would you do differently if you were starting today?
   Let the subject narrate before moving to specifics. Do not accept implementation details as answers to why questions. Done when: the subject has narrated across the scope and why-questions are answered or gaps are identified for Phase 2.

3. **Phase 2 — Targeted gap closure.**
   For each knowledge gap the narration did not close, ask a precise closing question:
   - What is the reason for this decision?
   - What alternatives were considered and rejected?
   - What is the risk if this is changed?
   If a subject cannot articulate a reason, explicitly mark the entry as OPEN — do not fabricate a rationale. Done when: every narration gap has been asked or marked OPEN.

4. **Handle tacit knowledge.**
   If a topic resists direct articulation, use an analogy, example, or counterfactual to close it. Do not infer a rationale from code inspection alone. Done when: every tacit-knowledge topic is closed via analogy/example or marked OPEN.

5. **Synthesize into topic-file entries.**
   Write each captured topic as a structured entry with these fields:
   - Topic: the subject name
   - Why: the decision rationale or context (not implementation)
   - Alternatives considered: what was rejected and why, or OPEN if unknown
   - Open gaps: any unresolved questions, explicitly marked OPEN
   - Source: `interview`
   Each entry must be self-contained: a reader 12 months from now must understand the decision without access to the interview subject. Done when: every captured topic is a structured entry with all fields.

6. **Apply the privacy filter.**
   - Omit session narrative, anecdotes, and personal context.
   - Do not include the subject's name, role, emotional state, or identifying details.
   - Do not verbatim-transcribe raw answers; synthesize into third-person knowledge statements.
   - Do not record what was not said — mark gaps as OPEN.
   Done when: every entry is free of personal details, session narrative, and verbatim transcription.

7. **Write to the local topic file.**
   Append or update entries in the project's topic/knowledge file. If no topic file exists, create one under the project's memory directory. Do not write outside the project directory. Done when: entries are written to the project's local topic file(s).

8. **Handle interruption.**
   If the interview ends before all topics are closed, record which topics remain open. Do not claim a gap is closed when it was not answered. Do not discard partial results. Done when: open topics are recorded and partial results are retained.

## Failure and recovery
- Gaps remain open: explicitly mark each with OPEN; do not fabricate rationale.
- No topic file or writable location: stop and report; do not write to ad-hoc locations.
- Privacy filter breach: discard the breached content and re-synthesize without personal details.
- Interview ends mid-session: retain synthesized entries written so far; surface open topics; do not claim completeness.
- No rollback needed: entries are additive; deleting a newly written entry is the rollback action.

## Output

Synthesized topic-file entries appended to the project's local knowledge file(s), each containing Topic, Why, Alternatives considered (or OPEN), Open gaps (or absent), and Source: interview — no session narrative, no personal details, no verbatim transcription.
