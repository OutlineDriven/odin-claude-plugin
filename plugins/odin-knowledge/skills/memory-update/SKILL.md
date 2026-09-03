---
name: memory-update
description: 'Use when the user explicitly says to save something to memory or scan this session for memories. Derives evidence-backed proposals, confirms each with the user, and writes validated memory files with read-back. Not for auditing memory — use memory-clean.'
disable-model-invocation: true
---

# Memory update

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly says to save something to memory or scan this session for memories. |
| Authority | Human-only. Before changing durable memory data, require explicit invocation, show each proposed target and consequence, and obtain explicit confirmation for each proposal. |
| Side effect | Create or revise only confirmed `<type>_<slug>.md` files and their one-line `MEMORY.md` index entries inside the resolved `$MEMORY_DIR`; do not delete, audit, sanitize, or merge unrelated memories. |
| Done | Every confirmed memory and index entry is written, read back, and shown to have valid YAML frontmatter; rejected and unconfirmed proposals remain unwritten. |

## Inputs

Required: the user's explicit invocation and either a direct statement to remember or readable session-history JSONL files containing candidate evidence. For each write, require the user's confirmation of the previewed memory, target path, and index change. Optional: `MEMORY_DIR`, `SESSION_HISTORY_GLOB`, and `MEMORY_UPDATE_SKILL_SCRIPTS` environment overrides. The scripts directory defaults to the installed skill's `scripts` directory; `$MEMORY_DIR` and the session glob otherwise resolve from the current working directory.

A memory type must be `feedback`, `project`, `user`, or `reference`. Its filename is `<type>_<slug>.md`, where the slug contains only lowercase letters, digits, and hyphens and is at most 40 characters. Frontmatter must contain nonempty `name`, `description`, and `type` keys, and `type` must match the filename. A `feedback` or `project` body must also contain `**Why:**` and `**How to apply:**`. Each `MEMORY.md` entry must be one line of at most 150 characters.

## Procedure

1. Resolve the scripts directory, then run `resolve-paths.sh memory_dir` and `resolve-paths.sh session_history_glob`. Treat environment values and resolved paths as untrusted: stop on resolver failure, reject paths outside the resolved memory directory, and do not create a missing default memory directory. Done when: both paths resolve safely or the run stops with the failing key.
2. If the invocation states exactly what to remember, derive one proposal from that statement. Otherwise run `scan-session.sh "$SESSION_HISTORY_GLOB"`; use its deterministic `type`, `slug`, `evidence_turn_ids`, `draft_body`, and `draft_index_entry` fields as proposals. Stop if no history matches or the scanner fails. Done when: at least one proposal exists or the run stops with the scan result.
3. For every proposal, verify the cited turn exists and supports the claim. Exclude code patterns, fix recipes, Git history, ephemeral task state, and any claim not grounded in a cited transcript turn or the user's explicit statement. Never fill scanner placeholders or missing rationale by invention. Done when: every retained proposal is evidence-backed and every rejected proposal has a reason.
4. Normalize and validate the type, slug, required frontmatter, required body sections, and index-length limit. Preview the evidence, complete draft, exact target path, and exact `MEMORY.md` consequence. Ask the user to accept, reject, or edit each proposal, and make no write until that proposal receives explicit confirmation. Done when: every proposal has a preview and a user decision.
5. Before a confirmed write, search existing files under `$MEMORY_DIR` for the draft's identifying phrase and inspect likely matches. If a near-duplicate exists, show it and obtain a new explicit choice to revise that file or create the proposed file; never merge implicitly. Done when: duplicate risk is cleared or the explicit revise-or-create choice is recorded.
6. Revalidate the confirmed or edited draft. Write only the approved `<type>_<slug>.md` target, then append or update exactly one corresponding `MEMORY.md` entry. Do not alter any other memory or index line. Done when: the target file and exactly one index entry are written.
7. Read back every changed file. Parse the frontmatter as YAML and verify the required keys, matching type, filename form, body sections, and index line and length. Report the changed paths and line counts only after every confirmed write passes. Done when: every changed file passes read-back validation.

## Failure and recovery

- Resolution or scan failure: make no changes and return `blocked` with the failing key or command and its diagnostic.
- Missing or contradictory evidence: omit that proposal; if no grounded proposal remains, make no changes and return `blocked: no evidence-backed memory candidate`.
- Invalid draft or unsafe target: make no changes for that proposal and return `blocked` with the violated constraint; do not widen the target or repair content by invention.
- Missing confirmation or unresolved duplicate: leave that proposal unwritten and return `blocked: confirmation required` or `blocked: duplicate choice required`.
- Partial write or failed read-back: stop further writes, restore each file changed by this invocation to its captured pre-write content, remove only a newly created target from this invocation, and return `blocked` naming the failed file and whether rollback succeeded. Never report done while rollback or verification is incomplete.

## Output

Return the accepted, rejected, and blocked proposal classifications; for each successful write, return its evidence turn IDs or explicit user statement, memory path, index entry, and read-back line count. The terminal result is `done` only when all confirmed writes pass YAML and content verification; otherwise it is `blocked` with the exact failure and recovery state.
