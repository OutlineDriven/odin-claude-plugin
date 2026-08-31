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

- **Decision text**: The decision statement to press. Required. Must be the decision that was made, not the reasoning behind it.
- **Context** (optional): Any surrounding context about what options were considered and which was picked.

## Procedure

1. **Restate neutrally**: State the decision as made, without justification. Do not supply the reasoning behind it and do not let the user borrow reasoning that was never given.
2. **Isolate the critic**: Hand the decision — not any reasoning — to a fresh session that never watched the decision get made. Instruct it to press for gaps: what a skeptical outsider would challenge, what is assumed but unstated, what would have to be true for the choice to hold.
3. **Return one gap**: Extract the single sharpest unresolved gap from the critic's response. Never batch gaps into a checklist.
4. **Press the user**: Present the gap and ask the user to explain it in their own words. The skill never supplies the rationale.
5. **Judge the answer**:
   - If the answer actually resolves the gap: close it and move to the next gap.
   - If it restates the question, deflects, or leans on authority ("the agent suggested it"): do not accept it.
6. **Narrow, don't repeat**: On a rejected answer, identify the exact part that stayed vague and ask that. Narrow further each round; never widen back to a generic question.
7. **Stop**: Either every gap is explained or one is not. Both are valid endings.
8. **Flag unresolved gaps**: Name the specific assumption behind each gap that remains unexplained. Do not force a resolution or let the user paper over it. Flag the decision for re-review — not a verdict it was wrong, only that it is not yet earned.

## Failure and recovery
- **Unexplained gap**: A gap that survives the narrowing rounds is a valid stopping state. Name the specific assumption; do not assert the decision was wrong.
- **Rejected answer**: Return the narrowest form of the vague part; do not repeat the same question.
- **Empty or unparseable critic response**: State that the pressing could not proceed and name the decision as having an unresolved-critic-response gap.

## Output
A decision-press report:
- The neutral restatement of the decision.
- Per-gap: state ("closed" or "open"), the user's explanation for each closed gap.
- Per open gap: the named assumption that remains unexplained.
- Closed-gap count and open-gap count.
- For each open gap: "flagged for re-review" — not a verdict the decision was wrong.

## Provenance

Origin: https://github.com/LilMGenius/paperthin (MIT, (c) 2026 LilMGenius). Revision: 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. Path: skills/depth/feynman/SKILL.md.

License: MIT. Adaptation: clean-room. Material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) is vendor-verbatim in the paperthin source and is not directly copied; the foundry adapts the paperthin feynman teaching technique as a decision-pressing workflow, preserving: the isolated-critic sub-session requirement, the narrow-don't-repeat instruction class, the single-gap-at-a-time return rule, and the never-supply-rationale invariant. The ODIN skill narrows scope to post-decision advisory critique, sets authority to read-only advisory, removes teaching-role framing, and targets ODIN run-flow quality gates.
