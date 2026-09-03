---
name: review-reception-protocol
description: 'Use when asked to receive code review feedback: clarify every item, implement accepted items locally with tests, draft technical pushback for questionable items, and stop before any GitHub reply or remote mutation. Not for posting replies — use resolve-pr-feedback.'
---

# Review reception protocol

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Receiving code review comment, suggestion, or objection, before acting on any of it |
| Authority | reversible-local: write only local files (source files, test files, drafts); do not post GitHub replies, trigger CI, open issues, or otherwise mutate any remote system |
| Side effect | Clarify every feedback item. Implement accepted items locally, one at a time, each with its own test. Draft factual technical pushback for questionable items. Stop before posting any GitHub reply or performing any remote mutation |
| Done | Every feedback item is classified: clarified or implemented locally with its own test, or answered by a drafted pushback; no GitHub reply or remote mutation is posted |

## Inputs

- Feedback: the raw code review comment(s), PR thread, or inline suggestion. Required.
- Code under review: the relevant source files. Required.
- PR or issue thread: the full review context. Optional; use when available.

## Procedure

1. **Extract every distinct feedback item** from the review. Do not combine, rephrase, or infer unstated items.
2. **Clarify each item before acting on it**. Resolve the precise intent behind each suggestion from context or by asking the user. Stop if the item cannot be resolved to a concrete, implementable statement.
3. **Classify each clarified item**:
   - *Accepted*: the suggestion aligns with the codebase and the user's intent.
   - *Questionable*: the suggestion is technically incorrect, out of scope, or conflicts with design intent.
4. **Apply accepted items one at a time**:
   a. Apply the change to the relevant source file.
   b. Write or update a test that covers the change.
   c. Verify the test passes before moving to the next item.
5. **Draft factual pushback for questionable items**. Write a concise, technically grounded reply in a local draft file. State the specific reason the suggestion is not accepted, such as a design conflict, incorrect assumption, or scope mismatch. Do not post it.
6. **Stop**. Do not post any GitHub reply, open any issue, trigger any CI pipeline, or otherwise mutate any remote system.

## Failure and recovery
- Unresolvable feedback: stop and report which item cannot be clarified to a concrete statement. Do not implement it.
- User rejects accepted item: skip that item; continue with the remaining items.
- Implementation blocked: report the specific technical obstacle; do not widen scope.
- Test fails: fix the implementation, not the test. If the test is wrong, report it and stop.
- Remote mutation attempted: refuse; log the blocked action.
- Non-converged result: any failure that is not resolved produces a report listing unresolved items and blocked actions. The done predicate does not hold.

## Output
A local report listing every feedback item, its classification (accepted or questionable), the actions taken for each accepted item, and the location of any drafted pushback. No remote state is changed.
