---
name: catchup
description: 'Use when the human returns after a gap, cannot follow the project, asks what happened or what a term means, or before deciding what to do next when their mental model is stale. Returns a screen-length briefing grounded in live project state that a person with zero retained context can act on. Don''t use for tasks that require source or remote-system changes.'
---

# Catchup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The human returns after a gap, says they can't follow the project, asks what happened or what a term means, or before deciding what to do next when their mental model is stale |
| Authority | Read-only; reads live project state and briefs, does not fix, rename, decide, or mutate anything |
| Side effect | None (read-only briefing); it briefs, it does not act |
| Done | Cold-read of the briefing requires no pre-gap memory or unglossed coined term to parse; needs-you items are each actionable without opening another file; every claim has a checkable source; fits on a screen with expansion offered rather than delivered |

## Inputs

The project working directory (inferred from the current repository when not supplied). The human's last touch point — their last message, judgment, or commit — if known; inferred from session history or the most recent commit when not explicitly supplied.

## Procedure

1. Read live state only: recent file mtimes, git log and diffs, plan and state docs, task boards, and re0-memo notes. Never brief from conversation memory alone — memory is what drifted.
2. Anchor on the human's last touch (their last message, judgment, or commit). Everything after that point is the delta; everything before it is assumed known and stays out.
3. Compose in decision order, not chronological order:
   - **Needs you** — decisions, judgments, or inputs only the human can give, each self-contained enough to act on without opening another file.
   - **Changed while you were away** — outcomes, not process. "The plan's scoring rule was replaced" beats "I ran three analysis passes."
   - **New words** — every term coined or repurposed since their last touch, one line each, with where it lives. Skip terms they already used themselves.
4. Gloss on first use: any project-specific term appearing in the briefing gets an inline plain-language aside at its first occurrence, even if a glossary section follows.
5. Keep the default short (a screen or less). End with drill-down offers per section, not with everything expanded.
6. Before finishing, verify the done predicate: cold-read the briefing for pre-gap memory dependence or unglossed coined terms; confirm each needs-you item is actionable without opening another file; confirm every claim has a checkable source (file, commit, or artifact path); confirm it fits on a screen with expansion offered rather than delivered.

## Failure and recovery
- **No live state found**: If the working directory has no readable git history, plan docs, or task artifacts, report that the project state is unreadable and name what was checked. Do not fabricate a briefing from memory.
- **Last touch point unidentifiable**: If the human's last message, judgment, or commit cannot be determined, state the assumption used (e.g., most recent commit) and proceed. Do not guess silently.
- **Claim without source**: If a claim cannot be traced to a file, commit, or artifact, drop it or mark it explicitly as unverified. Never present an ungrounded claim as fact.
- **Briefing exceeds a screen**: Trim to the needs-you items and one-line summaries of the changed and new-words sections; offer drill-down for the rest. Do not deliver the full expansion by default.
- Partial-result rule: A briefing covering only some sections is still useful if every included claim is source-grounded; state which sections were omitted and why.

## Output
A screen-length briefing with three sections in decision order — Needs you, Changed while you were away, New words — followed by drill-down offers per section. Every claim traces to a file, commit, or artifact path. Every project-specific term is glossed at first use. The briefing requires no pre-gap memory to parse.

## Provenance

Origin: https://github.com/LilMGenius/paperthin, skills/coil/catchup/SKILL.md. Pinned revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License: MIT (c) 2026 LilMGenius; NOTICE additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. Clean-room adaptation: the foundry does not copy verbatim vendor material; the procedure, rules, and verification steps are re-expressed as a self-contained ODIN 2.0 skill preserving the source mechanisms (state-grounded claims, last-touch anchoring, first-use glosses, screen-length default, decision-order composition, read-only authority).
