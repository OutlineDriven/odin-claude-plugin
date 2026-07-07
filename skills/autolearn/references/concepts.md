# `CONCEPTS.md` — entry schema and reconciliation rules

Read this in Mode 4 (Concepts capture) and when refreshing `CONCEPTS.md`. It defines the entry shape and the one-definition-per-concept reconciliation/refresh loop. The file lives at the **operating repo root** — one glossary, one writer (autolearn). Create it only when a term actually clears the gate; never scaffold an empty file.

## What earns a slot — the reject-by-default gate, applied to vocabulary

A term earns an entry only if it clears all three filters in order — the same gate that governs a learning doc:

1. **Would I forget its precise local meaning?** Define only words whose meaning *here* is precise enough that a new engineer needs it spelled out to follow code, tickets, or conversation. General programming vocabulary (cache, queue, job, session) and everyday domain English never qualify, however heavily used.
2. **Already defined?** Search `CONCEPTS.md` for the term and its synonyms before adding. If it is already there, this is not a new entry — refresh on drift, never duplicate. One definition per concept.
3. **Scope-qualified to this project?** The bar is "specific to this codebase," not "a generic CS term." An unqualified import of general vocabulary is noise.

Nothing clears the gate → write nothing. A clean "no durable term here" is correct.

## Per entry — the shape

- **Definition is one sentence:** what the term means in this domain and what distinguishes it from its neighbors. Not a tutorial.
- **Second paragraph only for non-obvious behavioral rules** — lifecycle, ownership invariants, cancellation/transition semantics. Never to elaborate the definition itself.
- **Retired synonyms → an aliases line** directly under the definition: `*Avoid:* OldName, otherword`. When the team uses several words for one concept, pick the best and retire the rest — the glossary is the agreed vocabulary, not a record of every word ever used.

## The file stands on its own

Each entry teaches its concept to a reader with no codebase, no PR history, no chat. This rules out:

- Implementation specifics — file paths, class/function names, table names, library calls.
- Status fields, dates, owners on entries.
- Current-config values that will change — specific thresholds, counts, enum values. State the behavior, not the number.
- Links to PRs, issues, channels, milestones; version-specific claims ("currently X, migrating to Y").

Cross-references between entries *within* the file are fine — they resolve internally. If an entry leans on another **project-specific** term to make sense, that sibling term must also be defined here (an undefined project-specific sibling is itself a candidate).

## Organization

Cluster concepts by domain relationship — entities with their states, processes with their stages — so structure is visible without effort. A flat list is fine while the file is small; reshape as it grows. When relationships carry load-bearing meaning (ownership, cardinality, cross-entry lifecycle), capture them in a short `## Relationships` section near the top; skip it when entries stand alone.

**Flagged ambiguities (tail of file):** when two terms were used interchangeably and the team settled a distinction, record it as a one-line note — *"'account' had been used for both Customer and User — these are distinct."* This tail is the audit trail for settled opinions.

## Reconciliation — idempotent merge, one definition per concept

Reconcile; never append blindly.

1. Locate the file: `fd -g 'CONCEPTS.md' --max-depth 2`. Absent + a term clears the gate → create it; absent + nothing clears → do nothing.
2. Search for the term and its synonyms: `git grep -ni '<term>' CONCEPTS.md`. A hit means the concept exists — go to refresh, do not add a second entry.
3. New term → add one entry in the right cluster, per the schema above.
4. **Read the file back** to confirm the merge landed and created no duplicate or near-duplicate heading.

## Refresh — keep definitions matched to reality

In `mode:refresh [scope]`, maintain `CONCEPTS.md` alongside `docs/solutions/`. Per in-scope concept, re-derive the meaning against current code and pick one outcome:

| Outcome | When | Action |
|---------|------|--------|
| **Keep** | Definition still matches the code | No edit. Prefer no-write. |
| **Refresh** | Meaning drifted; the term still exists | Rewrite the definition to current reality. |
| **Consolidate** | Two entries name the same concept | Merge into the better name, retire the other as an alias. |
| **Delete** | The concept's domain is gone from the code | Remove the entry. Age alone is never a reason. |

Match the glossary to the code, not the reverse. No cosmetic churn — typo and prose-polish edits are not refreshes. Headless: skip questions, apply safe refreshes/deletes, leave genuinely ambiguous concepts untouched and report them.
