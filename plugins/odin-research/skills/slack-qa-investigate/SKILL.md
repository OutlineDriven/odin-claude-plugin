---
name: slack-qa-investigate
description: 'Use when asked for a research-backed answer requiring codebase and documentation investigation, or when answering requires reading many files or conducting a wide survey. Investigates repository questions with sourced evidence, spawning parallel research subagents when the scope is wide. Not for file edits, diffs, or patches; use fix. Not for remote-system changes.'
---

# Slack QA investigate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Research-backed answer requiring codebase and documentation investigation without making file changes, or answering requires reading many files or a wide survey. |
| Authority | Read-only: no file creation, editing, deletion, VCS mutation, install, or any state-changing command. |
| Side effect | May spawn local research subagents for wide surveys. Deliverable is a sourced answer only; no file changes. |
| Done | Answer cites specific files/lines, distinguishes code/docs/inference, acknowledges uncertainty, and refuses write requests. |

## Inputs

- Question or claim (required): the user's question or assertion to investigate.
- Repository context (optional): working directory, branch, or specific files the user points to.
- Survey scope (optional): if the question requires reading many files or a wide survey, identify the file regions, directories, or URLs that likely contain the answer before spawning subagents.

## Procedure

1. State the read-only boundary and refuse any write request. If the user asks for code changes, file edits, diffs, or patches, decline and offer to investigate instead. **Done when:** the user understands the skill is read-only or the request is declined.
2. Clarify scope: restate the question and identify what would constitute a complete answer before searching. **Done when:** the scope and success criteria are agreed.
3. Search broadly: use grep, file glob, and semantic search across the codebase to locate relevant source files, configs, tests, and documentation. **Done when:** the candidate files are listed.
4. If the scope is wide (many files, multiple directories, or cross-cutting concerns), spawn local research subagents to read the identified sources in parallel. Each subagent returns a cited summary and evidence paths. Bound scope before spawning; do not widen mid-survey. **Done when:** every subagent has returned or failed.
5. Read deeply: examine actual code, config, and doc content, not just file names. Follow references to other files, URLs, or external docs. **Done when:** the relevant content has been read and summarized.
6. Trace connections: follow imports, function calls, type references, and cross-file links. Fetch external API or library docs via web search or URL read. **Done when:** the connection graph is documented.
7. Synthesize: combine findings into a clear answer. Cite file paths and line ranges for every claim. Label each claim as **code** (observed in source), **docs** (stated in documentation), or **inference** (derived but not directly observed). Flag caveats explicitly: conditions, unknowns, or limits on the answer. **Done when:** the answer is synthesized with citations, labels, and caveats.
8. Re-state the refusal if the user later asks for code changes, file edits, diffs, or patches. **Done when:** the final answer is delivered and any write request is declined.

## Failure and recovery

- Out-of-scope question: if the question is unrelated to the repository or requires external action, state the boundary and offer what investigation can cover.
- No evidence found: if search and tracing yield nothing relevant, report the searches attempted and the absence of evidence. Do not guess.
- Ambiguous evidence: if sources conflict, present each source with its path and line range, state the conflict explicitly, and label the uncertainty.
- Subagent returns no findings: return a partial answer with empty evidence paths and a caveat stating the gap. Do not fabricate evidence.
- Source inaccessible: return the answer without that source; name the inaccessible path in the caveats.
- Scope widens mid-survey: stop. Report the widened scope as a caveat. Do not expand the answer beyond the original question.
- Write request: refuse immediately. Do not produce diffs, patches, or code snippets intended as changes.
- Partial results are returned with explicit gaps labeled. The done predicate is not claimed when evidence is missing or uncertain.

## Output

A sourced answer with file paths and line ranges for every cited claim, `code`/`docs`/`inference` labels, explicit caveats, and a refusal statement if the user requested file changes.
