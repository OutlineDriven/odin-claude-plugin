---
name: buzzword-analysis
description: 'Use when the user wants the current jargon weather of a domain described without advocacy. Surveys circulating terms, their signaling freight, and their usage trajectory from verifiable external sources. Not for choosing a positioning move — use buzzword-hijack.'
---

# Buzzword analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a description of the current jargon weather without advocacy. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. Web searches and public-source reads are the only outward operations. |
| Side effect | A jargon-weather report returned as chat output, taking no side. |
| Done | The current jargon landscape is described from verifiable external sources, each term has a weather state or an explicit unclear label, and the report takes no side. |

## Inputs

- The domain or field whose jargon is to be surveyed (a technology, market, or community). If none is named, ask once and stop until it is supplied.
- Optional: a time window or a set of specific terms to include. If omitted, survey the present landscape.
- Optional: specific sources to consult (search engines, industry publications, community forums). If omitted, select public sources that show recent usage.

## Procedure

1. Identify the domain the user named. If none is named, ask once and stop; do not fabricate a domain. Done when: the domain is identified or the user is asked for one.
2. Search verifiable external sources for terms currently circulating in that domain. Use web search, public forums, industry publications, and vendor documentation. Record which source each term was found in and the date of the evidence. A term claimed from model knowledge without a source is marked unverified. Done when: circulating terms are listed with their sources and evidence dates.
3. For each term, separate its descriptive meaning from its rhetorical or marketing freight: what it denotes versus what adopting it signals. Done when: each term has its descriptive meaning separated from its signaling freight.
4. Classify each term's weather state as rising, peak, fading, or residual, based on the usage trajectory the sources show. When the sources do not support a trajectory call, label the term unclear rather than guessing. Done when: each term has a weather state or an unclear label with the reason.
5. Where a term's popular meaning has drifted from its technical origin, note the drift without correcting it. Done when: drift is noted where present.
6. Present the landscape as a weather report: which terms are hot, cooling, or stale, and what each is being used to sell or signal. Done when: the landscape is presented as a weather report.
7. Take no position on whether any term or its adoption is good or bad. Describe; do not advocate. Done when: the report takes no side on adoption.

## Failure and recovery

- Unnamed domain: ask once, stop, do not invent a domain.
- Insufficient basis to classify a term's trajectory: label it unclear rather than guessing a weather state.
- A term cannot be separated from advocacy: report that it functions primarily as advocacy and continue; do not force a neutral reading the evidence does not support.
- No verifiable source found for a term: mark it unverified and exclude it from trajectory classification, or drop it entirely. Never present a model-knowledge claim as sourced.
- Partial result: return the terms that could be classified and explicitly list the ones that could not.
- No mutation occurs on any failure; the only output is the chat report.

## Output

A jargon-weather report in chat — a list of current terms, each with its descriptive meaning, its signaling or marketing freight, its weather state (rising, peak, fading, residual, or unclear), any drift from technical origin, and the source and date of the evidence — taking no side on adoption.
