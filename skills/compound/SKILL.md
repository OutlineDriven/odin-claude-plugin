---
name: compound
description: 'Use when the user asks to save a learning or closes a meaningful knowledge-work session. Saves at most three typed, approved knowledge records to docs/knowledge/ and confirms by naming retrieval tags. No remote, publish, deploy, or irreversible mutation.'
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

1. Scan docs/knowledge/ for existing records. Load each record and extract its frontmatter tags, type, and source. Done when: every existing record is loaded with its frontmatter.
2. Check for stale and conflicting entries: compare the extracted tags of each existing record against the candidate learnings. An entry is stale when its tags overlap with a new candidate and its content contradicts or supersedes the candidate. An entry conflicts when it shares tags but states the opposite. Flag each stale or conflicting entry by name with the overlap reason; do not delete or overwrite it. Done when: every stale or conflicting entry is flagged by name with its overlap reason.
3. Propose at most three specific learnings drawn from the session transcript. Classify each with a type (e.g., pattern, caveat, reference, decision, concept, fix, lesson). Reject a fourth or fifth as scope creep; propose none if the session yielded no durable learning. Done when: at most three learnings are proposed with types, or an honest none is proposed.
4. For each proposed learning:
   a. Check against the stale-knowledge inventory: if a duplicate or contradiction exists by shared tag, flag it explicitly rather than overwriting. Done when: the duplicate or contradiction is flagged or none exists.
   b. Assign retrieval tags, confidence level (high/medium/low), date (ISO 8601), and source context. Done when: tags, confidence, date, and source are assigned.
   c. Draft frontmatter: type, tags, confidence, date, source, Context (what triggered the learning), Implication (what changes as a result). Done when: frontmatter is drafted with all seven fields.
5. Present the proposed records to the user for approval. Include the stale/conflict flags so the user can decide whether to update, merge, or discard. Done when: the proposed records and flags are presented for approval.
6. On user approval: write each approved record to docs/knowledge/{slug}.md using the drafted frontmatter and a prose body derived from the session. If a record updates an existing entry, preserve the original entry's history line. Done when: every approved record is written with valid frontmatter and history preserved.
7. Confirm completion by naming the retrieval tags for each saved record. Done when: the retrieval tags for each saved record are named in the confirmation.

## Failure and recovery

| Failure class | Result |
|---|---|
| docs/knowledge/ is unreadable or missing | Block: skill cannot execute; report the path and ask the user to confirm the directory exists. |
| User rejects all proposed learnings | Non-converged: nothing is written; report "No knowledge records saved." |
| Write fails (disk error, permission) | Rollback: do not leave a partial record; report the error and the record that failed. |
| Duplicate tag detected, user unresponsive | Non-converged: do not write; confirm explicitly before proceeding. |

## Output

Markdown files written to docs/knowledge/ (or the configured directory), each with frontmatter (type, tags, confidence, date, source, Context, Implication), plus a terminal confirmation naming retrieval tags for each saved record.
