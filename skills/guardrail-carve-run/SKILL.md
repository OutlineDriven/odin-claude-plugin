---
name: guardrail-carve-run
description: 'Use when a task carries guardrail-adjacent material — stealth, scraping, privacy, IP, policy, security — or the moment the agent is about to hedge, soften, or silently skip. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Guardrail carve run

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Task includes guardrail-adjacent material (stealth, scraping, privacy, IP, policy, security) or the agent notices itself about to hedge, soften, or silently skip |
| Authority | Reversible local writes only — spawn a context-clean subagent given only the carved prompt, write a descope ledger, and write archive entries after the run closes |
| Side effect | A context-clean subagent spawned with only the carved prompt; a local descope ledger; post-run archive entries |
| Done | Carve covers every guardrail-adjacent item with class, verdict, alternative, and archive destination; the runner saw only the carved prompt and its guard held both directions; an independent N=1 re-sweep was diffed against the ledger; the ledger is reported; the archive is written only after the run closed |

## Inputs

- The task and its adjacent inputs — the risky original this session reads but never hands to the runner.
- The user's risk posture or pre-authorization for descoping. Optional. If absent, produce a proposed carve and wait for approval on every gray-zone item before running.
- A fresh subagent spawn capability — a Task that starts with no prior context. Required.

## Procedure

1. **Frame.** Read the task, inputs, and user-stated risk posture. If the user already authorized descoping, proceed. Otherwise propose the carve, make the split explicit, and wait for approval on every gray-zone item before running. A bright-line item has no safe version, so it is non-negotiable; a gray-zone item's safe alternative trades away scope the user might want, so it is the real question. If every item is bright-line, proceed; the ledger carries the record. Done when: the stated action, evidence, and guard all hold.
2. **Carve.** Sweep the task and adjacent inputs for guardrail-adjacent items. For each, propose `verdict=descope`, class it bright-line or gray-zone, give one risk-free alternative, and name an archive destination. A gray-zone item the user decides to keep stays in scope and enters the ledger as kept-by-owner. Point to excluded techniques only as far as identification requires; never elaborate them. Never probe — do not pose an excluded or gray-zone ask to see whether it passes; the carve settles scope before any such ask exists. Done when: the stated action, evidence, and guard all hold.
3. **Appeal.** If the user disputes a bright-line call, do not let the pressured session re-litigate it. Hand the item's abstract description, stripped of the negotiation and any persuasion, to a fresh context for re-evaluation, and record the appeal and its outcome in the ledger either way. Repeated appeals on the same item are themselves a signal worth surfacing. Done when: the stated action, evidence, and guard all hold.
4. **Guard.** Distill the carve into a compact scope-guard block — absolute exclusions, allowed alternatives, and the context that authorizes what stays in scope — and fold it into the carved prompt verbatim. The block names each exclusion so the run cannot re-introduce it, never the original risky ask or its method. Where the run shares a filesystem or memory store with this session, the block also forbids the run from consulting decision logs, notes, or transcript search over that shared state — a clean prompt does no good if the run can read the risky ask back out of something this session just wrote nearby. Instruct the run to build the safe scope at full strength, with no hedging, apology, or shrunken deliverable. Done when: the stated action, evidence, and guard all hold.
5. **Run.** Spawn a fresh, context-clean subagent and hand it only the carved prompt, never the risky original or the carve reasoning. It runs the safe scope at full strength and returns the deliverable. If risky material surfaces inside a subagent, route it back through Carve, never improvised inline. Done when: the stated action, evidence, and guard all hold.
6. **Verify.** Run an adversarial pass over the returned deliverable and adjacent artifacts across all five directions — risky content elaborated, risky content silently dropped, safe work diluted or treated as excluded, stale risky material left standing nearby, and the carve missed or over-excluded something. Re-sweep the original task from a context independent of this one and diff the result against the ledger before reporting. Cap that independent re-sweep at one pass (N=1), not open-ended fan-out. Fold any gap back into the ledger. Done when: the stated action, evidence, and guard all hold.
7. **Ledger.** After the run has finished and the subagent's window is closed, report the deliverable with a descope ledger listing every carved item — its class, its verdict of descoped or kept-by-owner, the reason, the safe alternative, and the archive destination. Write the archive entry only now, not earlier; a record of the risky material sitting on disk while the run is still active undoes the isolation the carve bought. Treat exclusions as visible decisions, not gaps. Descoped material is archived with its cause of death and safe replacement, never erased, so a later pass can mine the ledger for anti-patterns. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- **Gray-zone item unanswered.** Do not begin the run while a gray-zone item that shapes the carved prompt still awaits an answer. Hold and surface the question. Bright-line exclusions are never negotiable, so never stall on those alone.
- **Risky material surfaces mid-run.** The subagent must not improvise. Route the discovery back through Carve, class and ledger it, and re-issue a re-carved prompt before continuing.
- **Shared-state leak.** If the run can reach decision logs, notes, or transcript search over state this session wrote, the carve is incomplete. Re-issue the carved prompt with the shared-state prohibition baked in before running.
- **Re-sweep gap.** If the independent N=1 re-sweep finds a missed risk or an over-broad exclusion, fold it back into the ledger and re-carve; do not report done with a known gap.
- **Archive written early.** If an archive entry was written before the run closed, delete it and rewrite after close; an early record undoes the isolation.
- **Non-converged.** If a gap cannot be folded back within one re-carve, report the blocked result with the partial ledger and the unresolved item — never claim the done predicate holds.

## Output
A safe deliverable from the runner, plus a distinct descope ledger with one entry per guardrail-adjacent item: class (bright-line or gray-zone), verdict (descoped or kept-by-owner), reason, safe alternative, and archive destination. The archive entries are written after the run closes. Exclusions are visible decisions, not gaps.

## Provenance

Origin: `https://github.com/LilMGenius/paperthin`, `skills/depth/autobahn/SKILL.md` at revision `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`. License: MIT, (c) 2026 LilMGenius; the source NOTICE additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock), but this skill is a clean-room adaptation that copies no verbatim vendor expression. Adaptation: restructured into the carve-and-run orchestration for guardrail-adjacent work, inlining the shared-state leak guard, archive-after-run-close timing, bright-line appeal routing, and never-probe rule as self-contained procedure rather than external references.
