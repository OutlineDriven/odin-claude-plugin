---
name: ai-collab-protocols
description: 'Use when the user describes an AI workflow gap or uses an ambiguous cross-session reference such as ''the PR Bob mentioned''. Resolves each to a stable handle and surfaces collaboration anti-patterns when reached. Don''t use for tasks that require source or remote-system changes.'
---

# AI collab protocols

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User describes an AI workflow gap or uses an ambiguous cross-session reference such as 'the PR Bob mentioned' or 'that bug from last week'. |
| Authority | Read-only: reply content only; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None; reply content only. |
| Done | Every ambiguous reference resolves to a stable handle; anti-patterns surface when reached. |

## Inputs

The user's message may contain ambiguous references: names or descriptions without locators, such as "the PR Bob mentioned", "that bug from last week", or "the function we discussed". It may instead describe a workflow gap. When asked, the user may optionally supply a stable handle: a GitHub PR or comment permalink, an MCP resource URI such as `@github:pr/owner/repo/123#comment-456`, or a file:line reference. The skill fetches and mutates nothing; it asks the user for the handle.

## Procedure

1. Scan the user's message for ambiguous references — a name or description without a locator — or a described workflow gap. If none is present, do not route. Done when: every ambiguous reference or workflow gap is identified.
2. For each ambiguous reference, stop and ask the user for a stable handle: a GitHub PR/comment permalink, an MCP resource URI (e.g. `@github:pr/owner/repo/123#comment-456`), or a file:line reference. State why: names are ambiguous in long-context sessions and unrecoverable across sessions, while a stable URL survives compaction and enables exact match. Done when: each reference has a stable handle or is marked unresolved.
3. Surface one tactic at a time, not a lecture. When the user is handing off multi-session work, recommend leaving a comment on the PR — an addressable, compaction-surviving thread — over a chat-only handoff, so the next session, colleague, or agent can resume without replaying context. Done when: one tactic is surfaced.
4. When an anti-pattern is reached, surface it: (a) screenshot-only context loses URL grounding, copy-paste, and search — pair every screenshot with its URL or text export; (b) token-usage or lines-of-code framing as a quality proxy — quantity is not capability; surface the rejection. Done when: each reached anti-pattern is named.
5. Stop once every ambiguous reference has a stable handle and any reached anti-pattern has been named. Do not widen scope or invent handles the user did not supply. Done when: every reference has a handle and reached anti-patterns are named.

## Failure and recovery
- Unresolved reference: the user cannot supply a stable handle. Report the reference as unresolved; do not guess a URL or symbol. The done predicate is not met for that reference.
- Non-stable handle: the user supplies a bare repo name or a chat paraphrase instead of a locator. Ask once for the permalink or file:line form; if still absent, mark the reference unresolved.
- No reference and no gap: the skill does not route; return nothing.
- Partial result: report which references resolved and which remain unresolved; never claim all resolved when any is not.
- Non-mutation: this skill writes nothing; recovery is re-asking or stopping, never editing files or state.

## Output
A reply that, for each ambiguous reference, states the stable handle the user supplied or marks it unresolved, plus any anti-pattern surfaced when reached. No file, state transition, or external mutation.
