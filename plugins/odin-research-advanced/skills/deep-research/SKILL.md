---
name: deep-research
description: 'Use when the user asks to research a topic and produce a thorough sourced report. Produces a prose-first cited Markdown report with key findings, recommendations, and risks. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Deep research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to research a topic and produce a thorough sourced report. |
| Authority | Reversible local writes only: creates ./research/{type}-{topic}-{date}.md and spawns 3-20 read-only sub-agents. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes ./research/{type}-{topic}-{date}.md; optionally exports a PDF beside it. Sub-agents perform read-only web search and page fetch. |
| Done | A prose-first cited Markdown report exists at the output path, containing key findings, strategic recommendations, and risks/uncertainties, with every claim cited. |

## Inputs

- Topic and research type, supplied by the user or inferred from the prompt. Research types: market, domain, technical, competitive, product, academic, person/org, financial, legal, trend, community. If none fit, infer a type and design a matching axis breakdown.
- Specific questions or goals the research must answer (optional for well-scoped prompts; required for vague prompts).
- Geographic, time, or segment constraints (optional).
- Output path override (optional; default ./research/{type}-{topic}-{YYYY-MM-DD}.md).
- PDF export request (optional).
- Web access is required; if unavailable, halt.

## Procedure

1. Get today's date with `date +%Y-%m-%d`; use it for date-filtered searches and recency references throughout. Done when: today's date is obtained and used for date-filtered searches.
2. Scope. If the prompt is specific and well-scoped (topic, type, and goals clear), infer the research type, state assumptions explicitly in the report header, and proceed. If vague or ambiguous, ask the user one question at a time with 2-4 options: what type, what specific questions or goals, and any geographic/time/segment constraints. Check whether a report on this topic already exists in the output directory; if found, ask whether to extend or start fresh. Set the output path ./research/{type}-{topic}-{YYYY-MM-DD}.md (lowercase, hyphens) and write the report header now (topic, type, goals, date, assumptions, methodology note). Done when: the output path is set and the report header is written with topic, type, goals, date, assumptions, and methodology note.
3. Core research: parallel fan-out. Spawn 3-20 sub-agents in a single message, one per research axis for the chosen type. Each sub-agent searches its axis on the web, fetches the sources it cites, writes findings as prose paragraphs with inline citations (not bullet lists), and returns URL, accessed date, and a confidence level per claim. Each sub-agent tags every source as Primary (official docs, filings, peer-reviewed), Established (major publications, analyst firms), or Low (blogs, forums, single opinions) and flags Low-tier sources prominently. Sub-agents do not wait for each other. Append each sub-agent's findings to the output file under the matching section heading immediately as it completes. Never batch. Done when: every core-research sub-agent's findings are appended to the output file immediately as completed.
4. Competitive/landscape analysis: parallel fan-out. Spawn 3-5 sub-agents covering the landscape axes for the chosen type with the same citation discipline. Append results immediately. Done when: every landscape sub-agent's findings are appended immediately.
5. Deep dive: parallel fan-out. Spawn sub-agents covering the deep-dive axes for the chosen type. Append results immediately. Done when: every deep-dive sub-agent's findings are appended immediately.
6. Outline refinement (deep mode only, selected when the user says "thorough", "exhaustive", or "comprehensive"). After steps 3-5, review whether evidence warrants restructuring: did findings contradict the initial scope, did an important angle emerge, are any sections underpowered or overloaded. If yes, adapt the outline, run 2-3 targeted gap-fill searches time-boxed to 5 minutes, and record what changed in the methodology note. Skip in quick mode (narrow, time-sensitive: run steps 2 auto-scope, 3, 7) and standard mode (steps 2-7). Done when: the outline is refined with gap-fill searches run and changes recorded, or the step is skipped per mode.
7. Synthesis. Read the full output file and write the synthesis section: Key Findings (5 critical insights as prose paragraphs, each with a source reference), Strategic Recommendations (3-5 ranked by impact, each with rationale and evidence), Risks and Uncertainties (data gaps, low-confidence claims, unresolvable source conflicts, domain/market risks to monitor), and Next Steps (follow-up research, whether the initial request is fulfilled or needs another scope loop, decisions this research enables). Use extended reasoning here: reconciling conflicting multi-source data and ranking recommendations requires deep inference. Keep the fact/synthesis distinction throughout: "According to [Source], X" for sourced claims; "This suggests Y" for analysis. Done when: the synthesis section contains Key Findings, Strategic Recommendations, Risks and Uncertainties, and Next Steps with the fact/synthesis distinction maintained.
8. Critique pass (deep mode only). Red-team the synthesis: what is missing, what could be wrong, what alternative explanations exist, what biases might be present. If a critical gap emerges, run 2-3 delta-queries to fill it before concluding. Done when: the synthesis is red-teamed with delta-queries run for critical gaps, or the step is skipped per mode.
9. PDF export (optional, only if the user requests it). Try pandoc first (`pandoc report.md -o report.pdf`), then md-to-pdf (`md-to-pdf report.md`); check availability with `which` before choosing. If neither is available, tell the user which to install. Done when: the PDF is exported or the user is told which converter to install, or the step is skipped when no PDF was requested.

## Failure and recovery
- No web access: halt immediately and tell the user; do not produce a report.
- Unsourced assertion: a claim without a source URL is a guess, not a finding; remove it or find a source. Never fabricate a citation; if a source does not exist, write "No sources found for X" and flag the gap.
- Critical claim (market size, growth rate, competitive positioning) from a single source: label it confidence:Low or find a second independent source. Do not assert it as established.
- Source conflict: flag it explicitly rather than silently picking one; record it in Risks and Uncertainties if unresolvable.
- Sub-agent returns no findings for its axis: write "No sources found for X" under that section; do not leave it empty or guess.
- Partial result: the output file always reflects whatever has been written so far (write-as-you-go), so a halt mid-run leaves a partial cited report, not a blank file. Rollback is unnecessary; the only mutation is the local report file and optional PDF, both reversible by deletion.

## Output
A prose-first cited Markdown report at ./research/{type}-{topic}-{YYYY-MM-DD}.md (at least 80% prose; bullets only for true lists) with sections for scoped findings by axis, Key Findings, Strategic Recommendations, Risks and Uncertainties, and Next Steps. Every claim carries a source URL; critical claims carry 2+ sources or a confidence:Low label. Optionally a PDF beside the Markdown when requested and a converter is available.
