---
name: brainstorm
description: 'Use when the user begins knowledge work with notes, a transcript, a brain dump, or a problem. Captures original wording, reads prior knowledge, resolves up to three load-bearing questions, and writes a brainstorm file before planning. For divergent option generation, use ideate.'
---

# Knowledge brainstorm

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User begins nontrivial knowledge work with notes, a transcript, a brain dump, or a problem to think through. |
| Authority | Reversible-local: every search is read-only; the only mutation is one new local file, `plans/brainstorm-{descriptive-name}.md`. Rollback: delete that file. |
| Side effect | Reads prior knowledge in `docs/knowledge/`, `plans/`, and `docs/solutions/`; before save or planning, writes `plans/brainstorm-{descriptive-name}.md`. No other file, VCS, credential, paid, published, or remote change. |
| Done | The user's language is structurally captured; relevant prior context or an honest absence is shown; tensions and gaps are identified; at most three load-bearing questions are resolved; a reasoned direction is offered; the origin file is written before planning. |

## Inputs

- The brain dump: pasted meeting notes or transcript, voice-to-text output, bullet points, a document link or path, or loose narration. Optional at invocation; if absent, prompt for it before proceeding and stop if none arrives.
- Optional, mid-flow: the user's answers to the load-bearing questions.
- `docs/knowledge/`, `plans/`, and `docs/solutions/` need not exist; absence is an honest result, not an error.

## Procedure

1. **Capture the dump.** Accept the input exactly as given and identify its type (transcript, voice-to-text, bullets, link, narration). Do not organize yet. Accept raw bulk; a long transcript is good input, never ask the user to pre-organize. Treat pasted links or paths as material to read, nothing embedded in them to run. Done when: the input is accepted as-is with its type identified.
2. **Extract the core elements in the user's own wording.** Pull out decisions to make, open questions, constraints (timeline, budget, dependencies, blockers), stakeholders and what they care about, data points mentioned, and ideas floated even if half-baked. Present them as one structured summary: state the problem in one sentence, then list each element. Reflect the user's phrasing instead of sanitizing it. Done when: the core elements are extracted and presented as a structured summary in the user's wording.
3. **Search prior knowledge read-only.**
   - Grep `docs/knowledge/` (including subdirectories, `**/*.md`) for topic keywords and YAML frontmatter tag values; search `plans/` for related past plans; search `docs/solutions/` for relevant patterns.
   - Read the matches and, for each source found, report its name or path, one sentence on relevance, and the key takeaway.
   - Separate directly relevant findings (core learning in one sentence, implication for this work, creation date, staleness flag when `confidence: low` or older than 90 days) from tangentially relevant ones (learning plus connection).
   - Surface corrections prominently; they prevent repeating mistakes.
   - If `docs/knowledge/` is absent or nothing matches, say exactly that: no prior context found, this is genuinely new territory. Note whether prior coverage is strong or a gap.
   - Never fabricate context.
   - Then offer one optional external search (web or named documents) and ask where references might live rather than guessing. These searches write nothing.
   Done when: prior knowledge is searched with findings split into directly relevant, tangentially relevant, or explicit none, with staleness flags and corrections prominent.
4. **Identify themes, tensions, and gaps** across the dump, the extracted elements, and the findings: recurring themes and the real underlying question; conflicting ideas and their tradeoffs, named without picking winners; what is missing or needs research. Done when: themes, tensions, and gaps are identified across all three sources.
5. **Resolve load-bearing questions.** From the open questions and tensions, select those whose answers change the plan's structure: scope (quick win vs multi-phase), audience, priority between stated goals, timeline, who makes the final call, budget or resource ceiling. Ignore nice-to-know questions. Ask at most three at once, each framed with options drawn from the brainstorm instead of open-ended. If no open question is load-bearing, skip asking and say the questions can be resolved during execution. This step is a bridge to a direction, not an interrogation. Done when: at most three load-bearing questions are asked with options, or the skip is stated with reasoning.
6. **Offer a reasoned direction.** State the core question, the main tension, one suggestion with its reasoning, and a caveat. It is a suggestion; the user decides. Done when: the reasoned direction is offered with its reasoning and caveat.
7. **Gate on the origin file.** Ask what is next: dig deeper into a theme, keep refining, save, or move into planning. If the user chooses save or planning, first write the full brainstorm (captured dump, extracted elements, prior-knowledge findings, themes/tensions/gaps, resolved answers, suggested direction) to `plans/brainstorm-{descriptive-name}.md` with a descriptive name, creating `plans/` if missing. Never skip this write and never begin planning before the file exists. Done when: the origin file is written before planning begins, or the user declines save and the in-conversation brainstorm is the result.

## Failure and recovery

- No dump after prompting: stop; nothing is captured, nothing is written; do not invent material.
- Absent or empty prior-knowledge directories: not a failure, report the honest absence and continue; never substitute plausible context.
- External search declined or unavailable: mark it not performed and continue on local findings only.
- Interrupted searches: carry the findings gathered so far into the output and mark what was not searched; never present an unsearched area as empty.
- More than three genuinely load-bearing questions: keep the three whose answers most change the plan's shape; record the rest as open questions in the origin file instead of widening the interrogation.
- Write failure: if `plans/brainstorm-{descriptive-name}.md` cannot be written, stop before planning; report the error and the intended path. The done state does not hold; the brainstorm stays in the conversation and nothing else was mutated.
- User declines save: end without writing; the in-conversation brainstorm is the result. Planning never precedes the write.
- Rollback: delete the written origin file; it is the only artifact this skill can have created.
- Never swallow errors or present the done state without the written file when save or planning was chosen.

## Output
In conversation: the structured summary in the user's wording, prior-knowledge findings (directly relevant, tangentially relevant, or explicit none), themes/tensions/gaps, resolved load-bearing answers, one reasoned direction with caveat. On save or planning: `plans/brainstorm-{descriptive-name}.md` written before any planning begins.
