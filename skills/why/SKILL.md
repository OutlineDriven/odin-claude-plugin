---
name: why
description: 'Use when ''why does X work this way'', ''rationale for choosing Y'', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category in parallel, then returns a confidence-weighted cited narrative on decisions and tradeoffs. Don''t use for tasks that require source or remote-system changes.'
---

# Why

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks why something works this way or why an option was picked, or requests design rationale, a postmortem, or a data-backed threshold. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. Parallel investigator subagents and a synthesizer run read-only. |
| Side effect | Parallel investigator subagents and a synthesizer run read-only; the only output is the cited narrative in chat. |
| Done | Return a confidence-weighted cited narrative with direct findings, inferences, hypotheses, gaps, and sources. |
| Invocation | Model or human. Requests concerned only with current runtime behavior, rather than motivation or rationale, are outside this trigger. |

## Inputs

Establish:

- The exact decision, implementation, regression, incident, or threshold whose rationale is in question.
- The relevant component, owner, repository, service, product area, and approximate time range when known.
- Any candidate explanation supplied by the user; treat it as a hypothesis, not evidence.
- Which of these seven evidence categories are reachable through tools already available in the environment: **source control**, **issue tracker**, **long-form docs**, **real-time chat**, **infrastructure observability**, **error tracking**, and **product analytics warehouse**.

Availability means a read-only tool or authenticated MCP can actually query the category. Do not request new credentials, add an integration, or substitute a web search for an unavailable private source. Record every unavailable category explicitly.

Use this epistemic vocabulary throughout:

- **Direct finding:** the cited source explicitly states the claim, or the cited primary artifact directly records the event or measurement.
- **Inference:** the claim follows from cited findings but is not explicitly stated by a source. Show the reasoning bridge.
- **Hypothesis:** a plausible explanation that the evidence does not establish. State what evidence would confirm or falsify it.
- **High confidence:** explicit primary evidence or multiple independent, mutually consistent sources directly support the claim.
- **Medium confidence:** one credible direct source or several consistent indirect sources support the claim, with a material gap remaining.
- **Low confidence:** the claim rests on circumstantial evidence, an ambiguous recollection, or a single indirect source.

Confidence qualifies support, not importance. Chronology alone does not establish causation. Separate what happened from why it happened, distinguish contemporaneous evidence from hindsight, and prefer source-proximate records over later summaries while retaining material contradictions.

## Procedure

1. **Frame the investigation.** Restate the question as a neutral rationale question, define the likely decision window, and list the seven categories with status `available` or `unavailable` and the reason. Do not assume the user's candidate explanation is correct.

2. **Dispatch one parallel scout batch.** In one task batch, launch exactly one read-only investigator scout for each category marked available. Do not launch scouts for unavailable categories and do not combine two available categories under one scout. Give every scout the same question, entity/time scope, epistemic vocabulary, and this response schema:
   - category and query scope;
   - direct findings, each with a stable citation or permalink, source date, and short quoted or precisely paraphrased evidence;
   - inferences, each linked to the findings that support it and carrying High/Medium/Low confidence;
   - hypotheses, each carrying Low confidence unless direct evidence raises it, plus confirming or falsifying evidence;
   - contradictions and chronology;
   - null result or access gap;
   - sources consulted.

   Every scout is read-only. It must report a null result rather than filling silence with general knowledge.

3. **Apply the category playbook inside each scout.** These are complete source instructions, not pointers to external references:
   - **Source control:** inspect the relevant file history, blame/line provenance, commits, diffs, merge or pull-request discussion, tags, and nearby tests. Build a chronology from the first introduction through later reversions or fixes. Distinguish a commit message that states intent from code that merely demonstrates behavior; cite immutable commit, diff, or review links where available.
   - **Issue tracker:** search the scoped component, identifiers, symptoms, rejected alternatives, and decision window. Read the full issue and linked work rather than relying on titles. Extract explicit requirements, ownership, prioritization, acceptance criteria, duplicates, and close/reopen history; cite stable issue and comment links.
   - **Long-form docs:** search ADRs, RFCs, design docs, specifications, meeting notes, postmortems, and decision records. Capture status, author, date, alternatives, constraints, and whether the document was approved, superseded, or merely proposed. Cite a stable document or anchored section link and label retrospective explanations as hindsight.
   - **Real-time chat:** search the scoped terms and time window, then read enough thread context to distinguish a decision from brainstorming. Preserve timestamps, speakers or roles, explicit objections, reactions that materially indicate agreement, and links to artifacts. Cite stable message/thread permalinks; do not treat an unanswered suggestion as consensus.
   - **Infrastructure observability:** inspect read-only metrics, logs, traces, dashboards, deploy markers, capacity events, and alert history around the decision or incident. Record query/window, units, aggregation, baseline, and threshold. Use telemetry to establish operational conditions, not unstated human intent; cite stable snapshots or query/dashboard links when available.
   - **Error tracking:** inspect issue/event history, stack traces, affected releases, first/last seen, recurrence, environment, frequency, and links to fixes or regressions. Separate grouped-event evidence from root-cause claims and cite stable issue/event links without exposing sensitive payloads.
   - **Product analytics warehouse:** use read-only queries or saved analyses for the relevant event definition, population, segment, denominator, time window, experiment, funnel, or retention metric. Record the metric definition and query provenance, check whether instrumentation changed, and distinguish correlation from a product decision. Cite a stable saved query, notebook, dashboard, or result link when available.

4. **Collect the batch without erasing nulls.** Build a seven-row evidence ledger. For each category record `available with evidence`, `available but no relevant evidence`, `unavailable`, or `failed read`, plus its citations or exact gap. This null accounting is required even when another category appears decisive.

5. **Run one read-only synthesizer.** Supply the synthesizer only the framed question, the seven-row ledger, and the scouts' cited packets. Instruct it to:
   - answer the question directly before narrating the search;
   - preserve the Direct finding / Inference / Hypothesis labels and High/Medium/Low confidence;
   - merge duplicate evidence without dropping citations;
   - reconcile chronology and surface contradictions rather than choosing silently;
   - distinguish original rationale, later rationalization, observed outcome, and current constraint;
   - state which alternatives were considered or explicitly say none were found;
   - account for every category and every material gap;
   - end with a **Preserve / Change / Avoid / Risk** handoff grounded only in the evidence packet.

6. **Verify the synthesis before returning it.** Check that every direct finding resolves to a supplied citation, every inference names its supporting findings, every hypothesis is visibly non-factual, all seven categories appear in source coverage, and no confidence label exceeds its evidence. Remove unsupported claims; never backfill them from model memory.

## Failure and recovery

- **No read access for a category:** mark it `unavailable` with the reason and continue the single batch with the remaining available categories. Never request credentials or mutate configuration.
- **Available scout returns no evidence:** retain `available but no relevant evidence` as a meaningful null. Do not convert it into support for or against the explanation.
- **A read fails:** record `failed read`, the attempted scope, and the observed failure. Continue with other category results; do not launch a replacement scout that would violate the one-scout-per-available-category batch.
- **Evidence conflicts:** present each supported account with its date, provenance, and confidence. Prefer neither recency nor seniority by default; explain which primary evidence would resolve the conflict.
- **Citation is missing or unstable:** downgrade the statement to an explicitly unsupported hypothesis or omit it. Do not present an uncited recollection as a direct finding.
- **The synthesizer drops labels, citations, null accounting, or the handoff:** rerun the read-only synthesis over the same evidence packet with the missing output field named. Do not repeat source collection or invent evidence.
- **No category yields relevant evidence:** return an insufficient-evidence narrative with all seven null/gap entries and the most useful next read-only evidence to locate. Do not manufacture a rationale.
- **A source contains secrets or unnecessary personal data:** omit or minimally redact that material while retaining a stable citation and enough non-sensitive context to support the claim.

## Output

Return only a cited narrative in chat with this structure:

1. **Answer**: the best-supported rationale in one short paragraph with an overall High/Medium/Low confidence label.
2. **What the evidence says**: Direct findings first, then Inferences, then Hypotheses; each item carries its own confidence and citations.
3. **Decision chronology and alternatives**: contemporaneous rationale, later changes or outcomes, rejected options, and contradictions.
4. **Source coverage and gaps**: all seven categories with evidence/null/unavailable/failed status and the material unanswered questions.
5. **Handoff**: **Preserve**, **Change**, **Avoid**, and **Risk**, each tied to cited evidence or explicitly marked as an inference.
6. **Sources**: deduplicated stable links with source category and date where known.

Do not write files or modify any source. A response without confidence labels, citations, explicit gaps, seven-category null accounting, and the Preserve/Change/Avoid/Risk handoff is not done.

## Provenance

Adapted from the current ODIN skill tree, `skills/why/SKILL.md`. The original epistemics framework, investigator and synthesizer protocols, and source playbooks are incorporated inline so this skill has no external support path or peer-skill runtime dependency. The module remains `odin-research`; the trigger, read-only authority, chat-only side effect, invocation policy, and successful end state remain unchanged.
