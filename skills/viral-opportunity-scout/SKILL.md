---
name: viral-opportunity-scout
description: 'Use when asked to find where a template or artifact can travel through viral, niche, or high-impact channels. Produces a ranked report of distribution opportunities organized by channel type.'
---

# Viral opportunity scout

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to find where a template or artifact can travel through viral, niche, or high-impact channels. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Emits a chat report. No external state, credential use, or artifact mutation. |
| Done | Opportunities for viral, niche, or high-impact distribution are identified and reported. |

## Inputs

- `artifact` — required. The template, tool, or artifact to scout. Supply as text description or verbatim content.
- `artifact_type` — optional. Classifies the artifact: `tool`, `template`, `snippet`, `library`, `article`, `deck`, `video`, `dataset`, `agent-harness`, or `unknown`. Inferred from content if omitted.
- `target_audience` — optional. Comma-separated audience descriptors. Narrows channel mapping.
- `channels` — optional. Restrict scouting to specific channel families: `community`, `platform`, `editorial`, `aggregator`, `offline`, or `social`. Scouts all channels when omitted.

## Procedure

1. **Classify the artifact.** If `artifact_type` is supplied, use it. Otherwise infer the type from artifact content: executable code/CLI/API → `tool`; fill-in fields/variables/placeholders → `template`; short copy-pasteable code → `snippet`; packaged code with imports and public API → `library`; prose or structured documentation → `article`; slide format → `deck`; audio/video content → `video`; tabular/structured data → `dataset`; agent workflow/harness/scaffold → `agent-harness`; none of the above → `unknown`. **Done when:** the artifact type is determined.
2. **Map channels.** Build the candidate channel set from the channel families, filtered by the `channels` input. Include all families when `channels` is omitted. **Done when:** the candidate channel set is built for the artifact type.
3. **Validate channel existence.** For each candidate channel, confirm it is a live, public, active community or platform. Skip channels that no longer exist or are invite-only without credentials. This is a discovery step; no account creation. **Done when:** every candidate channel is validated or skipped.
4. **Score each channel.** For each validated channel, assess `reach` (estimated audience size or monthly visitors), `fit` (alignment between artifact and channel audience), `entry_barrier` (no account → low, application review → medium, paid placement → high), and `engagement_tone` (typical interaction style). **Done when:** every validated channel has all four scores.
5. **Build the scout report.** Organize findings by channel family. For each opportunity include: channel name, type, reach, fit, entry_barrier, engagement_tone, and a one-sentence placement or submission rationale. **Done when:** every opportunity is documented with all fields.
6. **Prioritize.** Rank opportunities by `reach × fit`, highest first. Present the top three as primary recommendations and the remainder as secondary. **Done when:** opportunities are ranked and top three are identified.

## Failure and recovery
- **No artifact supplied**: stop. Report the failure and do not produce a partial report. The done predicate is not satisfied.
- **No viable channels found**: return `non-converged` with the classification and a statement that no matching channels were validated. The done predicate is not satisfied.
- **Partial validation**: include only validated channels in the report. Do not infer or fabricate unvalidated opportunities. Flag any channel family where validation was skipped.

## Output
A structured scout report with artifact summary, channel opportunities grouped by family (each with reach, fit, entry_barrier, engagement_tone, rationale), primary recommendations (top three by reach × fit), secondary opportunities, and notes.
