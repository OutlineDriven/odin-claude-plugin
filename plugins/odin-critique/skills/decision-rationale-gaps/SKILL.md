---
name: decision-rationale-gaps
description: 'Use when a current decision needs pressure-testing until the rationale is clear to a skeptic. The result states the decision in plain terms or names the exact gap that prevents a defensible explanation. Don''t use for tasks that require source or remote-system changes.'
---

# Press decision

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Right after a decision was made, especially one laid out without argument |
| Authority | Advisory, read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | None (advisory); flags the decision for re-review on an unexplained gap |
| Done | Every closed gap traces to the user's own explanation; open gaps named specifically and carried forward as flags; rationale never supplied by the skill |

## Inputs

- Decision text: The decision statement to press. Required. Must be the decision that was made, not the reasoning behind it.
- **Context** (optional): Any surrounding context about what options were considered and which was picked.

## Procedure

1. **Restate neutrally**: State the decision without justification. Do not supply its reasoning or let the user borrow reasoning that was never given. Done when: the decision is restated without justification.
2. **Isolate the critic**: Hand only the decision, without any reasoning, to a fresh session that did not watch the decision get made. Instruct it to identify gaps: what a skeptical outsider would challenge, what is assumed but unstated, and what must be true for the choice to hold. Done when: the critic session receives only the decision and returns gap candidates.
3. **Return one gap**: Extract the single sharpest unresolved gap from the critic's response. Never batch gaps into a checklist. Done when: one gap is extracted, or the critic response is empty and the gap is named as unresolved-critic-response.
4. **Press the user**: Present the gap and ask the user to explain it in their own words. The skill never supplies the rationale. Done when: the gap is presented to the user for their explanation.
5. **Judge the answer**:
   - If the answer actually resolves the gap: close it and move to the next gap.
   - If it restates the question, deflects, or leans on authority ("the agent suggested it"): do not accept it.

   Done when: the answer is judged as resolving or not resolving the gap.
6. **Narrow, don't repeat**: After a rejected answer, identify the exact part that remained vague and ask about it. Narrow further each round; never widen back to a generic question. Done when: the question is narrowed to the exact vague part, not repeated.
7. **Stop**: Either every gap is explained or one is not. Both are valid endings. Done when: every gap is closed or at least one remains open.
8. **Flag unresolved gaps**: Name the specific assumption behind each gap that remains unexplained. Do not force a resolution or let the user paper over it. Flag the decision for re-review — not a verdict it was wrong, only that it is not yet earned. Done when: each open gap names its unexplained assumption and is flagged for re-review.

## Failure and recovery
- Unexplained gap: A gap that survives the narrowing rounds is a valid stopping state. Name the specific assumption without asserting that the decision was wrong.
- Rejected answer: Return the narrowest form of the vague part; do not repeat the question.
- Empty or unparseable critic response: State that pressing could not proceed and name the decision as having an unresolved-critic-response gap.

## Output
A decision-press report with sections in order: neutral restatement, per-gap state (closed with user explanation or open with unexplained assumption), gap counts, re-review flags for open gaps.
