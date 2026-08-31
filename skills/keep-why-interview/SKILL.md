---
name: keep-why-interview
description: 'Use when asked to capture departing knowledge into project topic files through structured two-phase interview: narration-first elicitation, then targeted gap closure, with privacy filter and Source = interview. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

- **Required**: Human subject (departing maintainer or domain expert), a location to write topic-file entries (project memory/knowledge file or directory), and the topic scope for the interview.
- **Optional**: Existing topic file(s) to append to or extend.
- **Required**: The interview is a live conversation; the model facilitates and captures synthesized knowledge in real time.

## Procedure

1. **Open the interview.**
   State the purpose: capture tacit knowledge and decision rationale for future maintainers. Confirm scope and topic boundaries with the human subject.

2. **Phase 1 — Narration-first elicitation.**
   Ask open-ended questions that surface why rather than what:
   - What decisions are you most concerned will not survive your departure?
   - What have you chosen not to do, and why?
   - What patterns, shortcuts, or assumptions exist that are not obvious from the code?
   - What would you do differently if you were starting today?
   Let the subject narrate before moving to specifics. Do not accept implementation details as answers to why questions.

3. **Phase 2 — Targeted gap closure.**
   For each knowledge gap the narration did not close, ask a precise closing question:
   - What is the reason for this decision?
   - What alternatives were considered and rejected?
   - What is the risk if this is changed?
   If a subject cannot articulate a reason, explicitly mark the entry as OPEN — do not fabricate a rationale.

4. **Handle tacit knowledge.**
   If a topic resists direct articulation, use analogy, example, or counterfactual framing to close it. Do not infer a rationale from code inspection alone.

5. **Synthesize into topic-file entries.**
   Write each captured topic as a structured entry with these fields:
   - **Topic**: the subject name
   - **Why**: the decision rationale or context (not implementation)
   - **Alternatives considered**: what was rejected and why, or OPEN if unknown
   - **Open gaps**: any unresolved questions, explicitly marked OPEN
   - **Source**: `interview`
   Each entry must be self-contained: a reader 12 months from now must understand the decision without access to the interview subject.

6. **Apply the privacy filter.**
   - Omit session narrative, anecdotes, and personal context.
   - Do not include the subject's name, role, emotional state, or identifying details.
   - Do not verbatim-transcribe raw answers; synthesize into third-person knowledge statements.
   - Do not record what was not said — mark gaps as OPEN.

7. **Write to the local topic file.**
   Append or update entries in the project's topic/knowledge file. If no topic file exists, create one under the project's memory directory. Do not write outside the project directory.

8. **Handle interruption.**
   If the interview ends before all topics are closed, record which topics remain open. Do not claim a gap is closed when it was not answered. Do not discard partial results.

## Failure and recovery
- **Gaps remain open**: explicitly mark each with OPEN; do not fabricate rationale.
- **No topic file or writable location**: stop and report; do not write to ad-hoc locations.
- **Privacy filter breach**: discard the breached content and re-synthesize without personal details.
- **Interview ends mid-session**: retain synthesized entries written so far; surface open topics; do not claim completeness.
- **No rollback needed**: entries are additive; deleting a newly written entry is the rollback action.

## Output
Synthesized topic-file entries appended to the project's local knowledge file(s). Each entry contains: Topic, Why, Alternatives considered (or OPEN), Open gaps (or absent), and Source: interview. No session narrative, no personal details, no verbatim transcription.

## Provenance

Origin: https://github.com/oliver-zehentleitner/keep-the-why — MIT license (Copyright (c) 2026 Oliver Zehentleitner; retain copyright notice and permission notice in all copies or substantial portions). Pinned at revision c01597a506efa24652d7ecb9e18b6a8ccc97b175. Adaptation: procedure rewritten as a self-contained odin-research skill; interview-playbook mechanisms distilled into two-phase elicitation (narration-first, then targeted closure) bound to odin's topic-file schema. Clean-room derivation from MIT-licensed source.
