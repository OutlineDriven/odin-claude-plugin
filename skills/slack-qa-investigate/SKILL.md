---
name: slack-qa-investigate
description: 'Investigate repository questions with sourced evidence. Use when asked for a research-backed answer requiring codebase and documentation investigation without making file changes. Don''t use for tasks that require source or remote-system changes.'
---

# Slack QA investigate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Research-backed answer requiring codebase and documentation investigation without making file changes |
| Authority | Read-only: no file creation, editing, deletion, VCS mutation, install, or any state-changing command |
| Side effect | None: a sourced answer only; no file changes |
| Done | Answer cites specific files/lines, distinguishes code/docs/inference, acknowledges uncertainty, and refuses write requests |

## Inputs

- **Question or claim** (required): the user's question or assertion to investigate.
- **Repository context** (optional): working directory, branch, or specific files the user points to.

## Procedure

1. Clarify scope: restate the question and identify what would constitute a complete answer before searching.
2. Search broadly: use grep, file glob, and semantic search across the codebase to locate relevant source files, configs, tests, and documentation.
3. Read deeply: examine the actual code, config, and doc content, not just file names. When a file references another file, URL, or external doc, follow that reference and read it.
4. Trace connections: follow imports, function calls, type references, and cross-file links. If a doc references an external API or library, fetch those docs via web search or URL read.
5. Synthesize: combine findings into a clear answer. Cite every file path and line range that supports a claim. Label each claim as one of: **code** (observed in source), **docs** (stated in documentation), or **inference** (derived but not directly observed).
6. Refuse write requests: if the user asks for code changes, file edits, diffs, or patches, decline and state that this skill is read-only. Offer to investigate or explain the code instead.

## Failure and recovery
- **Out-of-scope question**: if the question is unrelated to the repository or requires external action, state the boundary and offer what investigation can cover.
- **No evidence found**: if search and tracing yield nothing relevant, report the searches attempted and the absence of evidence. Do not guess.
- **Ambiguous evidence**: if sources conflict, present each source with its path and line range, state the conflict explicitly, and label the uncertainty.
- **Write request**: refuse immediately. Do not produce diffs, patches, or code snippets intended as changes.
- Partial results are returned with explicit gaps labeled. The done predicate is not claimed when evidence is missing or uncertain.

## Output
A sourced answer containing:
- File paths and line ranges for every cited claim.
- Explicit labels: code, docs, or inference per claim.
- Acknowledged uncertainty where evidence is absent or conflicting.
- Refusal statement if the user requested file changes.

## Provenance

Adapted from warpdotdev/oz-skills `.agents/skills/slack-qa-investigate/SKILL.md` at revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765. Licensed MIT (Copyright 2026 Warp). Clean-room adaptation for the odin-research module: restructured into Contract/Procedure/Failure/Output sections, consolidated prohibitions into authority binding, removed motivational prose.
