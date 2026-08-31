---
name: viral-opportunity-scout
description: 'Use when asked to find where a template or artifact can travel through viral, niche, or high-impact channels. Produces a ranked report of distribution opportunities organized by channel type. Don''t use for tasks that require source or remote-system changes.'
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
- `channels` — optional. Restrict scouting to specific channel families: `community`, `platform`, `editorial`, `aggregator`, `offline`, or `social`. Scouting all channels when omitted.

## Procedure

1. **Classify the artifact.** If `artifact_type` is supplied, use it. Otherwise infer the type from artifact content using the following priority:
   - Contains executable code, CLI, or API surface → `tool`
   - Contains fill-in fields, variables, or structured placeholders → `template`
   - Short, copy-pasteable code → `snippet`
   - Packaged code with imports and public API → `library`
   - Prose or structured documentation → `article`
   - Slide format → `deck`
   - Audio or video content → `video`
   - Tabular or structured data → `dataset`
   - Agent workflow, harness, or scaffold → `agent-harness`
   - None of the above → `unknown`

2. **Map channels.** Build the candidate channel set from the following families, filtered by the `channels` input. Include all families when `channels` is omitted.

   | Artifact type | Primary channels | Secondary channels |
   |---|---|---|
   | `tool` | community (HN, Reddit, Lobsters), platform (GitHub-trending, Product Hunt, dev.to), aggregator (dev.to, Hashnode, Hacker News) | social (Twitter/X dev threads), offline (conferences, podcasts) |
   | `template` | community (Reddit), platform (Notion templates, Gumroad, Product Hunt) | editorial (newsletters, blog posts) |
   | `snippet` | community (Stack Overflow, Reddit), aggregator (dev.to, Hashnode) | social (Twitter/X), platform (GitHub Gists) |
   | `library` | community (HN, Reddit, Lobsters), aggregator (dev.to, Hashnode) | platform (GitHub, crate registries, PyPI) |
   | `article` | editorial (newsletters, Medium, Substack), aggregator (dev.to, Hashnode) | community (HN), social (Twitter/X) |
   | `deck` | platform (Notion, SlideShare), community (Reddit) | editorial (YouTube, podcast mentions) |
   | `video` | social (YouTube, Twitter/X), editorial (podcasts) | community (Reddit) |
   | `dataset` | community (HN, Reddit), platform (Kaggle, Hugging Face) | aggregator (GitHub, dev.to) |
   | `agent-harness` | community (HN, Reddit, specialized Discord), aggregator (dev.to) | platform (GitHub, agent marketplace) |
   | `unknown` | community, platform, editorial | all |

3. **Validate channel existence.** For each candidate channel, confirm it is a live, public, active community or platform. Skip channels that no longer exist or are invite-only without credentials. This is a discovery step; no account creation.

4. **Score each channel.** For each validated channel, assess:
   - `reach`: estimated audience size or monthly visitors.
   - `fit`: alignment between the artifact and channel topic or audience.
   - `entry_barrier`: how easy it is to publish or submit (no account required → low, application review → medium, paid placement → high).
   - `engagement_tone`: typical interaction style (e.g., technical discussion, casual sharing, formal review).

5. **Build the scout report.** Organize findings by channel family. For each opportunity include: channel name, type, reach, fit, entry_barrier, engagement_tone, and a one-sentence placement or submission rationale.

6. **Prioritize.** Rank opportunities by `reach × fit`, highest first. Present the top three as primary recommendations and the remainder as secondary.

## Failure and recovery
- **No artifact supplied**: stop. Report the failure and do not produce a partial report. The done predicate is not satisfied.
- **No viable channels found**: return `non-converged` with the classification and a statement that no matching channels were validated. The done predicate is not satisfied.
- **Partial validation**: include only validated channels in the report. Do not infer or fabricate unvalidated opportunities. Flag any channel family where validation was skipped.

## Output
A structured scout report containing:

- **Artifact summary**: artifact type, target audience, and a brief description.
- **Channel opportunities**: grouped by family, each with reach, fit, entry_barrier, engagement_tone, and rationale.
- **Primary recommendations**: top three ranked by reach × fit.
- **Secondary opportunities**: remaining validated channels.
- **Notes**: any relevant context, timing considerations, or channel-specific constraints.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (curated-082) and `project-owned:user-supplied-source-brief`.
Adaptation: rewritten into a bounded, read-only scouting contract with enumerated channel families, scored by reach and fit, and structured report output. No third-party expression copied; all guidance is ODIN-owned synthesis.
