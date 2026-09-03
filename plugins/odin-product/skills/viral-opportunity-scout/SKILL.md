---
name: viral-opportunity-scout
description: 'Use when asked to find distribution opportunities for a template, tool, or artifact. Classifies the artifact, queries known directories and aggregator platforms, filters for active communities, scores reach and fit, and compiles a ranked report with submission rationales. Not for content creation or campaign management.'
---

# Viral opportunity scout

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to find where a template, tool, or artifact can be distributed through viral, niche, or high-impact channels. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Emits a chat report. No external state, credential use, or artifact mutation. |
| Done | A ranked report of distribution opportunities with reach, fit, and submission rationale for each channel. |

## Not for

- Content creation, campaign management, or paid placement execution.

## Inputs

- `artifact` (required): the template, tool, or artifact to scout. Supply as text description or verbatim content.
- `target_audience` (optional): comma-separated audience descriptors. Narrows channel mapping.
- `channels` (optional): restrict scouting to specific channel families: `community`, `platform`, `editorial`, `aggregator`, `offline`, or `social`. Scouts all families when omitted.

## Procedure

1. Classify the artifact. If the user supplied a type, use it. Otherwise infer from content: executable code, CLI, or API is `tool`; fill-in fields or placeholders is `template`; short copy-pasteable code is `snippet`; packaged code with imports and public API is `library`; prose or structured documentation is `article`; slide format is `deck`; audio or video content is `video`; tabular or structured data is `dataset`; agent workflow, harness, or scaffold is `agent-harness`; none of the above is `unknown`. **Done when:** the artifact type is determined.
2. Query known directories and aggregator platforms. For each channel family in scope, check the platforms below. Use web search or URL read to verify each platform is live and public.
   - Community: GitHub topics, Reddit subreddits, Discord community directories, Stack Overflow tags.
   - Platform: npm, PyPI, crates.io, RubyGems, Go module indexes, VS Code marketplace, JetBrains marketplace.
   - Editorial: Hacker News, Product Hunt, Dev.to, Hashnode, Medium publications, Substack.
   - Aggregator: awesome-* lists on GitHub, alternative-to pages, slash-page directories.
   - Social: X/Twitter communities, LinkedIn groups, Mastodon instances.
   - Offline: conferences, meetups, hackathons (via event directories).
   **Done when:** every channel family in scope has been queried and each candidate platform is confirmed live or skipped.
3. Filter for active communities. For each candidate platform, confirm it has recent activity (posts or submissions within the last 90 days) and public submission access (no invite-only or closed communities). Skip platforms that fail either check. **Done when:** every candidate is validated or skipped with a named reason.
4. Score each validated channel on two axes:
   - `reach` (1 to 5): estimated monthly audience or visitor count. 5 = 100k+ monthly, 4 = 10k to 100k, 3 = 1k to 10k, 2 = 100 to 1k, 1 = under 100.
   - `fit` (1 to 5): alignment between the artifact type and the channel's typical content. 5 = exact match (e.g., npm package on npm), 4 = strong match, 3 = plausible, 2 = stretch, 1 = poor fit.
   Compute `priority = reach * fit` (range 1 to 25). Record `entry_barrier` (low, medium, high) and a one-sentence submission rationale. **Done when:** every validated channel has reach, fit, priority, entry_barrier, and rationale.
5. Compile the ranked report. Sort channels by priority descending. Present the top three as primary recommendations and the remainder as secondary. For each, state: channel name, type, reach, fit, priority score, entry_barrier, and submission rationale. **Done when:** the report is compiled and delivered.

## Failure and recovery

- No artifact supplied: stop. Report the failure and do not produce a partial report.
- No viable channels found: return a non-converged result with the artifact classification and a statement that no matching channels were validated. The done predicate is not satisfied.
- Partial validation: include only validated channels in the report. Do not infer or fabricate unvalidated opportunities. Flag any channel family where validation was skipped.

## Output

A structured scout report with artifact summary, channel opportunities grouped by family (each with reach, fit, priority score, entry_barrier, submission rationale), primary recommendations (top three by priority), secondary opportunities, and notes on skipped families.
