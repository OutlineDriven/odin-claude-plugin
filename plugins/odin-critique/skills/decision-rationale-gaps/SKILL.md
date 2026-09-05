---
name: decision-rationale-gaps
description: 'Use when a current decision needs pressure-testing until the rationale is clear to a skeptic. Not for tasks requiring source or remote-system changes.'
---

# Press decision

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Right after a decision was made, especially one laid out without argument |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None (advisory); flags the decision for re-review on an unexplained gap |
| Done | Every closed gap traces to the user's own explanation; open gaps named specifically and carried forward as flags; rationale never supplied by the skill |

## Inputs

- Decision text: The decision statement to press. Required. Must be the decision that was made, not the reasoning behind it.
- **Context** (optional): Any surrounding context about what options were considered and which was picked.

## Procedure

1. **Restate neutrally**: State the decision without justification. Do not supply its reasoning or let the user borrow reasoning that was never given. Done when: the decision is restated without justification.
2. **Isolate the critic**: Hand only the decision, without any reasoning, to a fresh session that did not watch the decision get made. Do not pass the optional Context; it carries the reasoning the critic must not see. Instruct it to identify gaps: what a skeptical outsider would challenge, what is assumed but unstated, and what must be true for the choice to hold. Done when: the critic session receives only the decision and returns gap candidates.
3. **Return one gap**: Keep the critic's full response as the candidate pool for the whole press. Extract the single sharpest unresolved gap that no earlier round has extracted. Never batch gaps into a checklist. Each closed gap returns here for the next candidate. When no unextracted candidate remains, the gap loop ends at step 7. Done when: one gap is extracted, or the critic response is empty and the gap is named as unresolved-critic-response, or the pool is exhausted and the loop ends.
4. **Press the user**: Present the current question, the extracted gap or its narrowed form, and ask the user to explain it in their own words. The skill never supplies the rationale. Done when: the current question is presented to the user for their explanation.
5. **Judge the answer**:
   - If the answer actually resolves the gap: close it and return to step 3 to extract the next gap from the candidate pool.
   - If it restates the question, deflects, or leans on authority ("the agent suggested it"): do not accept it.

   Done when: the answer is judged as resolving or not resolving the gap.
6. **Narrow, don't repeat**: After a rejected answer, identify the exact part that remained vague and narrow the question to it. Return to step 4 and present the narrowed question for another answer. Narrow further each round; never widen back to a generic question. Done when: the question is narrowed to the exact vague part, not repeated, and is presented again for an answer.
7. **Stop**: Either every gap is explained or one is not. Both are valid endings. Done when: every gap is closed or at least one remains open.
8. **Flag unresolved gaps**: Name the specific assumption behind each gap that remains unexplained. If the user supplied the optional Context, use it only to name which assumption an open gap rests on, never to answer the gap. Do not force a resolution or let the user paper over it. Flag the decision for re-review: not a verdict it was wrong, only that it is not yet earned. Done when: each open gap names its unexplained assumption and is flagged for re-review.

**Nested-subagent fallback.** This skill runs in the main session, where step 2 can spawn a fresh critic session. Do not run it from inside a subagent, where spawning another subagent is blocked. If that happens, surface to the user that decision-rationale-gaps cannot run nested and let the main session handle it. As a last resort only, a degraded self-questioning fallback exists: rewrite the step 2 critic instructions as a fresh self-prompt with a hard mental separator from any prior reasoning about the decision, answer it, and walk steps 3 to 8 on the result. This is not a fresh session, so flag the result as degraded.

## Failure and recovery
- Unexplained gap: A gap that survives the narrowing rounds is a valid stopping state. Name the specific assumption without asserting that the decision was wrong.
- Rejected answer: Return the narrowest form of the vague part; do not repeat the question.
- Empty or unparseable critic response: State that pressing could not proceed and name the decision as having an unresolved-critic-response gap.
- Nested subagent blocks the critic spawn: surface to the user; use the degraded self-questioning fallback only as a last resort and flag the result degraded.

## Output
A decision-press report with sections in order: neutral restatement, per-gap state (closed with user explanation or open with unexplained assumption), gap counts, re-review flags for open gaps.
