---
name: genealogical-proof
description: 'Use when a genealogical identity or relationship needs correlation, conflict analysis, and negative-search proof. Applies the Genealogical Proof Standard to classify the proposition as proved, disproved, likely, or possible. Not for non-genealogical identity proof.'
---

# Genealogical proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A genealogical identity or relationship needs correlation, conflict analysis, and negative-search proof. |
| Authority | Read-only genealogical source evaluation. Paid access or living-person data requires start approval: one harness ask/question call before the run starts. |
| Side effect | Genealogical proof note with correlation, conflict resolution, and classification. |
| Done | The identity proposition is classified proved, disproved, likely, or possible with a proof note. |
| Stop | Unresolved conflicts; blocked access; insufficient evidence. Bound: one proof question, approved repositories, date range, pass cap. |

## Inputs

- Identity or relationship proposition (required): the specific genealogical question to prove or disprove (for example, "John Smith born 1820 in Yorkshire is the son of William Smith and Mary Jones").
- Available source evidence (required): the records, documents, and transcripts provided for analysis.
- Constraints (required): date range bounding the search, repository bounds naming which archives or databases are in scope.

## Procedure

1. Extract and correlate identity markers from the provided sources. For each source, record the identity markers it carries: names (including variants and spellings), dates (birth, baptism, marriage, death, burial), places (birthplace, residence, event location), and relationships (parent-child, spouse, sibling). Correlate markers across sources: which sources agree, which differ, which are silent. Done when: every source's markers are extracted and the correlation matrix is recorded.
2. Rank sources by originality and proximity to the event. Primary sources (created at or near the time of the event by someone with direct knowledge) rank above derivative sources (transcriptions, indexes, compiled genealogies). Within primary sources, those created closest to the event date rank higher. Record the rank order with the justification for each source. Done when: every source is ranked with its originality class and proximity rationale.
3. Resolve conflicting evidence. Where sources disagree on a marker, weigh the conflict by source reliability: a primary record close to the event outweighs a derivative compiled decades later. Identify merging errors: records for two different people combined into one identity, or one person split into two. State the resolution for each conflict and the evidence that supports it. If a conflict cannot be resolved, name it as unresolved. Done when: every conflict is resolved or explicitly named as unresolved.
4. Perform negative-search proof. For each identity marker that the proposition depends on, confirm that expected records where the marker should appear have been searched and the marker is absent where it would contradict the proposition. Record which repositories were searched, which record types were checked, and what was found or not found. A negative search that was not performed is a gap, not proof. Done when: negative-search coverage is recorded for every load-bearing marker.
5. Classify the proposition against defined evidentiary thresholds:
   - Proved: all markers correlate, conflicts are resolved, negative-search confirms, and the evidence is sufficient to warrant no reasonable alternative.
   - Disproved: the evidence directly contradicts the proposition with a primary source.
   - Likely: the weight of evidence supports the proposition but one element remains unresolved or the negative search is incomplete.
   - Possible: the proposition is consistent with the evidence but the evidence is thin or largely derivative.
   Done when: the classification is assigned with its evidentiary justification.

## Failure and recovery

- Unresolved conflicts: conflicting evidence prevents a clear resolution. Terminal `stalled`; name the conflict and the sources involved. Do not force a classification.
- Blocked access: a required repository is inaccessible. Terminal `blocked`; name the repository and the marker it would confirm or refute.
- Insufficient evidence: the available sources do not support any classification above `possible`. Terminal `stalled`; report what evidence is missing and which classification it would enable.

## Output

A proof note detailing the source correlation, source ranking, conflict resolution, negative-search coverage, and the final classification (proved, disproved, likely, or possible) with its evidentiary justification. Terminal classification: `success` (proved or disproved), `stalled` (likely or possible with unresolved elements), or `blocked` (repository access denied).
