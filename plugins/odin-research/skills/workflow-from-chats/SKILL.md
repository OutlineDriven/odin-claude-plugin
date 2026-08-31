---
name: workflow-from-chats
description: 'Use when a user asks to mine recent chats for workflow preferences. Reads chat history, extracts recurring patterns, and returns an evidence-backed preference synthesis with proposed workflow artifacts. Don''t use for tasks that require source or remote-system changes.'
---

# Workflow from chats

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Mine recent chats for workflow preferences. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat-output: proposes workflow artifacts only; writes nothing. |
| Done | Report-returned: evidence-backed preference synthesis and proposed artifacts. |

## Inputs

- Required: chat history or a path from which chat history can be read.
- Optional: time window, topic filter, or named agent/session identifier to narrow the scope.

## Procedure

1. Confirm the chat history source and time window. Done when: source and window are confirmed, or the step has stopped on no readable chat source.
2. Enumerate chat sessions within the window, bounded by the supplied filter. Done when: sessions are enumerated within the filtered window.
3. Extract recurring intent patterns, explicit preference statements, tool-use frequencies, and rejected suggestions from each session. Done when: signals are extracted from each session.
4. Classify extracted signals into workflow categories: automation, prompting, tooling, routing, and escalation. Done when: every signal is classified into a workflow category.
5. Synthesize a preference profile from the classified signals. Flag low-confidence signals; exclude uncorroborated single-instance claims. Done when: preference profile is synthesized with confidence ratings.
6. Propose named workflow artifacts that satisfy high-confidence preferences. Each proposal names the trigger, inputs, steps, and done criterion. Done when: proposals are generated for high-confidence preferences, or the step returns the profile without proposals.
7. Return the preference profile and proposed artifacts as a structured report. Done when: report is returned.

## Failure and recovery

- No chat source: report failure with a specific error. Do not proceed.
- No extractable signals: return a report stating zero preferences found. Do not fabricate patterns.
- Partial synthesis: return the partial result with explicit gaps listed. Do not fill gaps.
- Proposal failure: return the preference profile without proposed artifacts. Do not invent artifacts.

## Output
A structured report with sections in order: extracted preference signals with source citations, synthesized preference profile with confidence ratings, and proposed workflow artifacts with trigger, inputs, steps, and done criterion.
