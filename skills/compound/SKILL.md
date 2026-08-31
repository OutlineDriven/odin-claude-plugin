---
name: compound
description: 'Use when the user asks to save a learning or closes a meaningful knowledge-work session. Saves at most three typed, approved, frontmatter-enriched knowledge records to docs/knowledge/ and confirms by naming retrieval tags. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Knowledge compound

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to save what was learned or closes a meaningful knowledge-work session. |
| Authority | Reversible local write: may append or update docs/knowledge/{slug}.md records; never silently delete stale entries. |
| Side effect | Writes typed docs/knowledge/{slug}.md records and may update, but never silently delete, stale entries. |
| Done | At most three specific typed learnings or an honest none are proposed; duplicates and contradictions are checked; the user approves; saved frontmatter records type, retrieval tags, confidence, date, and source with Context and Implication; confirmation names retrieval tags. |

## Inputs

- **Session transcript** (required): the accumulated context of the current session, from which learnings are extracted.
- **docs/knowledge/ directory** (required): the existing knowledge record store; must exist and be readable.

## Procedure

1. Scan docs/knowledge/ for existing records. Load each record and extract its frontmatter tags, type, and source.
2. Check for stale and conflicting entries: compare the extracted tags of each existing record against the candidate learnings. An entry is stale when its tags overlap with a new candidate and its content contradicts or supersedes the candidate. An entry conflicts when it shares tags but states the opposite. Flag each stale or conflicting entry by name with the overlap reason; do not delete or overwrite it.
3. Propose at most three specific learnings drawn from the session transcript. Classify each with a type (e.g., pattern, caveat, reference, decision, concept, fix, lesson). Reject a fourth or fifth as scope creep; propose none if the session yielded no durable learning.
4. For each proposed learning:
   a. Check against the stale-knowledge inventory: if a duplicate or contradiction exists by shared tag, flag it explicitly rather than overwriting.
   b. Assign retrieval tags, confidence level (high/medium/low), date (ISO 8601), and source context.
   c. Draft frontmatter: type, tags, confidence, date, source, Context (what triggered the learning), Implication (what changes as a result).
5. Present the proposed records to the user for approval. Include the stale/conflict flags so the user can decide whether to update, merge, or discard.
6. On user approval: write each approved record to docs/knowledge/{slug}.md using the drafted frontmatter and a prose body derived from the session. If a record updates an existing entry, preserve the original entry's history line.
7. Confirm completion by naming the retrieval tags for each saved record.

## Failure and recovery
| Failure class | Result |
|---|---|
| docs/knowledge/ is unreadable or missing | Block: skill cannot execute; report the path and ask the user to confirm the directory exists. |
| User rejects all proposed learnings | Non-converged: nothing is written; report "No knowledge records saved." |
| Write fails (disk error, permission) | Rollback: do not leave a partial record; report the error and the record that failed. |
| Duplicate tag detected, user unresponsive | Non-converged: do not write; confirm explicitly before proceeding. |

## Output
One or more Markdown files written to docs/knowledge/ (or the directory configured for the skill), each with valid frontmatter containing: type, tags, confidence, date, source, Context, Implication. A terminal confirmation message names the retrieval tags for each saved record.

## Provenance

- Origin: https://github.com/EveryInc/compound-knowledge-plugin
- Revision: 766942e9eaee5204adbfe180f1d0651ffecf2575
- License: MIT — Copyright (c) 2026 Every, Inc. Include the copyright and permission notice in copies or substantial portions; mechanism rewrites recorded in the root provenance ledger are permitted.
- Adaptation: clean-room rewrite of the compounding mechanism with the stale-knowledge checking logic folded inline per the inventory MERGE row. The original stale-knowledge-checker.md agent prompt is not retained as a separate file; its tag-overlap and contradiction-detection logic is restated as Procedure step 2. No third-party expression copied directly.
