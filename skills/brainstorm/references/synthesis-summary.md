# Synthesis Summary

**Synthesis ≠ plan artifact.** The synthesis is NOT a preview, draft, or substitute for the requirements-only plan — it is the scope checkpoint that doc-write consumes as input. The ODIN spec outline itself is written in Phase 3 from the confirmed synthesis. Both stay scope-only — implementation detail is downstream (`/plan`'s job).

**Two-stage shape: internal draft, then chat-time scoping synthesis.** Stage 1 is an internal three-bucket draft (Stated / Inferred / Out of scope) the agent uses to think comprehensively about scope. Stage 2 is the scoping synthesis presented to the user — shaped like what two product collaborators would confirm before writing a PRD. The user only sees Stage 2.

The internal draft still informs the doc body via the routing below; it does not reach the user verbatim.

**Discipline: an internal-draft item may enter the ODIN spec outline only if it is represented in Stage 2.** If an Inferred or Out-of-scope item would change the doc but does not survive the Stage 2 keep tests, it is not yet user-confirmed scope. Either surface it in Stage 2 (as a trade-off, deferred item, or call-out) or leave it out of the doc until a later dialogue confirms it.

This content is loaded when Phase 2.5 fires — after Phase 2 (approaches chosen) and before Phase 3 (write the plan). The synthesis is the user's last opportunity to correct the agent's interpretation before the artifact lands.

Fires for **all tiers** including Lightweight. Skip Phase 2.5 entirely on the Phase 0.1b non-software (universal-brainstorming) route.

The skill is interactive by design — brainstorming requires dialogue. There is no non-interactive mode; if an automated workflow needs a plan without dialogue, write the artifact from context directly rather than invoking `/brainstorm`.

---

## Stage 1: internal three-bucket draft

The internal draft is structured in three labeled buckets. Items may appear in two buckets when meaningfully both — flag the inclusion-then-exclusion as Inferred.

- **Stated** — what the user said directly. Items here have explicit user-language anchors.
- **Inferred** — what the agent assumed to fill gaps. Scope boundaries the user never named, success criteria extrapolated from intent, technical assumptions. The Inferred bucket is the most actionable surface for correction.
- **Out of scope** — deliberately excluded items. Adjacent work the agent considered but decided not to include.

This draft is internal. Do not paste it verbatim into chat.

---

## Stage 2: the chat-time scoping synthesis

The scoping synthesis is what the user actually sees. It reflects the dialogue's substance back so the user can pattern-match — long enough to serve a multi-turn conversation, short enough to be high-impact only.

The scoping synthesis has up to four named sections, each **render-conditional** on having something to say. Empty sections are omitted.

1. **What we're building** (always present) — 1-3 sentences. The shape that emerged, forward-looking, plain words.
2. **Key trade-offs** (conditional) — 1-3 bullets, each with a brief why.
3. **What's not in scope** (conditional) — 1-3 bullets, or fold into a single sentence.
4. **Call outs** (conditional) — 0-3 bullets. Residual forks: post-dialogue consequences, silent agent inferences, or scope bets the user is seeing for the first time in pre-loaded contexts. **Not questions the agent could have asked during Phase 1.3 but didn't.**

Then the confirmation: *"Confirm and I'll write the requirements-only plan next, drawing on our dialogue and this synthesis. Or tell me what to change."*

### Path A vs Path B: the gate that fires the confirmation question

- **Path A** — no blocking questions fired AND tier is Lightweight: announce-mode. Emit "What we're building" prose only, then proceed to Phase 3 in the same turn.
- **Path B** — at least one blocking question fired, OR tier is Standard / Deep: full tier-aware scoping synthesis with confirmation gate.

**Why the tier guard exists.** Phase 0.2's fast path serves both tight one-liners and richly pre-loaded openings. Without the guard, a pre-loaded Standard/Deep opening would get a 1-sentence checkpoint for what may be 20+ items of scope.

### Keep tests per section

- **Trade-offs keep test:** would the user be surprised if this acknowledgment were absent?
- **Deferred keep test:** is a reasonable downstream reader likely to ask "why isn't X here?"
- **Call-outs keep test (affirmability test):** would the user need to read code to evaluate this? If yes, cut. If no, one of these must be true:
  - Real scope fork
  - Non-obvious scope inclusion
  - Non-obvious scope exclusion
  - Cheap-now-expensive-later correction
  - Non-obvious consequence of multi-turn answers

Cut anything that does not match.

### Total bullet budget across sections 2-4

The cap is heuristic. Typical bounds by tier, counting bullets across Trade-offs + Deferred + Call outs combined:

| Tier | Typical total | Hard ceiling |
|---|---|---|
| Lightweight | 0-1 | 2 |
| Standard | 2-4 | 5 |
| Deep — feature | 3-5 | 7 |
| Deep — product | 4-7 | 9 |

**Above the hard ceiling, re-cut at a higher level of abstraction.** A useful test: read the bullets aloud. If two or more sound like "and also" extensions of the same idea, they belong as one.

### Detail level: conversational, not documentary

Each bullet is **1 line ideally, 2 lines maximum**. The reference shape is what two collaborators would say to each other in conversation, not what a ODIN spec outline would say. If a bullet reads like a doc paragraph, it is wrong-shaped.

The "What we're building" prose obeys the same discipline: 1-3 sentences describing shape, not an enumeration of requirements.

### Anti-patterns

- Naming implementation detail in any bullet.
- Re-stating a Q&A turn verbatim.
- Re-stating the Phase 2 approach the user already picked.
- Padding a section to meet a bullet count.
- Pasting the internal three-bucket draft verbatim into chat.
- Floating questions adjacent to Stage 2.

### Worked example

For a notification-mute feature, Stage 2 might look like:

```
Based on our dialogue, here's the scope I'm proposing for the ODIN spec outline:

**What we're building:** Per-channel mute on notification rules, with a 24h preset for the support team's 3 AM ping problem. Mute lives on the rule itself and survives rule edits.

**Key trade-offs:**
- Per-channel over per-user — support team is not a single user
- Mute on the rule, not a separate entity — pause state survives edits

**What's not in scope:**
- Presence-based mute and quiet-hours schedules — deferred for later
- Cross-rule mute groups — would force a rule-grouping concept we do not have

**Call outs:**
- Rule-delete silently loses pause state — confirm no warning needed

Confirm and I'll write the requirements-only plan next, drawing on our dialogue and this synthesis. Or tell me what to change.
```

## Re-present after revision; write only on confirm

A revision is not a confirmation. After any user revision, integrate the change, re-present the revised scoping synthesis, and wait for explicit confirmation before writing the doc.

The loop is:
1. Present scoping synthesis → user responds.
2. User confirms → write the doc.
3. User revises → integrate, re-present, return to step 1.

Doc-write fires only on explicit confirm or after the soft-cut blocking question's "proceed" option.

## Soft-cut on circularity (not iteration count)

Track which scoping synthesis items the user touched per round. The soft-cut blocking question fires **only when the same item is revised twice**. New-item revisions across rounds proceed without limit.

When the soft-cut fires, use the blocking question tool with two options:

- `Proceed and write the requirements-only plan`
- `Hold off — keep discussing before the doc`

Fall back to a numbered list in chat only when no blocking tool exists or the call errors.

## Self-redirect

If the user response indicates they are in the wrong skill (e.g., "this is too small, just `/work` it" or "this needs more thought, let me brainstorm differently"):

- Stop `/brainstorm`.
- Suggest the alternative skill the user appears to want.
- Offer to load it in-session.
- Do not push back.

## Doc shape after confirmation

After confirmation, Phase 3 writes the plan. The internal draft does NOT carry into the artifact as a `## Synthesis` section. Only Stage 2-confirmed content enters the doc: "What we're building" becomes `### Summary`; trade-offs become `### Key Decisions`; deferred items become `### Scope Boundaries`; stated requirements become `### Requirements`.

| Stage 2 element | Where it goes in the doc |
|---|---|
| "What we're building" prose | `### Summary` |
| Stated / confirmed requirements | `### Requirements` and where relevant `### Problem Frame` |
| **Key trade-offs** bullets | `### Key Decisions` |
| **What's not in scope** bullets | `### Scope Boundaries` |
| **Call outs** that resolve during confirmation | `### Key Decisions` or `### Outstanding Questions` |

Internal-draft items that never surfaced in Stage 2 do not silently become doc sections.

No italic capture-context note. The doc's `### Summary` and `### Problem Frame` serve distinct purposes — see `references/brainstorm-sections.md`.
