---
name: workflow-from-chats
description: 'Use when a user asks to mine recent chats for workflow preferences, this skill reads chat history, extracts recurring patterns, and returns an evidence-backed preference synthesis with proposed workflow artifacts. Don''t use for tasks that require source or remote-system changes.'
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

1. Confirm the chat history source and time window. Reject if no readable chat source is supplied.
2. Enumerate chat sessions within the window, bounded by the supplied filter.
3. Extract recurring intent patterns, explicit preference statements, tool-use frequencies, and rejected suggestions from each session.
4. Classify extracted signals into workflow categories: automation, prompting, tooling, routing, and escalation.
5. Synthesize a preference profile from the classified signals. Flag low-confidence signals; exclude uncorroborated single-instance claims.
6. Propose named workflow artifacts that satisfy high-confidence preferences. Each proposal names the trigger, inputs, steps, and done criterion.
7. Return the preference profile and proposed artifacts as a structured report.

## Failure and recovery
- **No chat source**: report failure with a specific error. Do not proceed.
- **No extractable signals**: return a report stating zero preferences found. Do not fabricate patterns.
- **Partial synthesis**: return the partial result with explicit gaps listed. Do not fill gaps.
- **Proposal failure**: return the preference profile without proposed artifacts. Do not invent artifacts.

## Output
A structured report containing:
- Extracted preference signals with source citations.
- Synthesized preference profile with confidence ratings.
- Proposed workflow artifacts with trigger, inputs, steps, and done criterion.

## Provenance

Origin: cursor/plugins, revision 68836ddaf5697224520f1847d90cdb90ca8babaa, path cursor-team-kit/skills/workflow-from-chats/SKILL.md.
License: MIT. Adaptation: clean-room implementation from MIT-licensed source. Trigger narrowed to chat-mining preference research. Authority remains read-only. Side effect reduced to propose-only. Module assigned to odin-research by roster ruling.
