---
name: buzzword-analysis
description: 'Use when the user wants the current jargon weather described without advocacy. Returns a jargon-landscape report that takes no side. Not for choosing a positioning move — use buzzword-hijack.'
---

# Buzzword analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a description of the current jargon weather without advocacy. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A jargon-weather report returned as chat output, taking no side. |
| Done | The current jargon landscape is described without taking a side. |

## Inputs

- The domain or field whose jargon is to be surveyed (a technology, market, or community). If none is named, ask once and stop until it is supplied.
- Optional: a time window or a set of specific terms to include. If omitted, survey the present landscape.
- No external data source is required; the report is synthesized from current usage knowledge. Mark any claim that rests on inference rather than verified currency.

## Procedure

1. Identify the domain the user named. If none is named, ask once and stop; do not fabricate a domain. **Done when:** the domain is identified or the user is asked for one.
2. Enumerate the jargon terms currently circulating in that domain, noting who uses each and what each is claimed to mean. **Done when:** the circulating terms are listed with users and claimed meanings.
3. For each term, separate its descriptive meaning from its rhetorical or marketing freight: what it denotes versus what adopting it signals. **Done when:** each term has its descriptive meaning separated from its signaling freight.
4. Classify each term's weather state as rising, peak, fading, or residual, based on observed usage trajectory. **Done when:** each term has a weather state or is labeled `unclear`.
5. Where a term's popular meaning has drifted from its technical origin, note the drift without correcting it. **Done when:** drift is noted where present.
6. Present the landscape as a weather report: which terms are hot, cooling, or stale, and what each is being used to sell or signal. **Done when:** the landscape is presented as a weather report.
7. Take no position on whether any term or its adoption is good or bad. Describe; do not advocate. **Done when:** the report takes no side on adoption.

## Failure and recovery
- **Unnamed domain:** ask once, stop, do not invent a domain.
- **Insufficient basis to classify a term's trajectory:** label it `unclear` rather than guessing a weather state.
- **A term cannot be separated from advocacy:** report that it functions primarily as advocacy and continue; do not force a neutral reading the evidence does not support.
- **Partial result:** return the terms that could be classified and explicitly list the ones that could not.
- **No mutation occurs on any failure;** the only output is the chat report.

## Output
A jargon-weather report in chat — a list of current terms, each with its descriptive meaning, its signaling or marketing freight, its weather state (rising, peak, fading, residual, or unclear), and any drift from technical origin — taking no side on adoption.

## Provenance

Origin: user-curated market-language research brief (project-owned:user-curated-skill-ideas, supplemented by project-owned:user-supplied-source-brief). Revision: none pinned. License: project-owned clean-room adaptation. Adaptation: the source one-line brief "describe the current jargon weather without advocacy" is expanded into a bounded read-only research procedure; no third-party expression is copied. This skill is distinct from buzzword-hijack, which chooses and executes a bounded positioning move rather than describing the landscape.
