---
name: guardrail-carve-run
description: 'Use when guardrail-adjacent material (stealth, scraping, privacy, IP, policy, security) or mixed reversible/irreversible, sensitive work, or the user says "autobahn this". Not for carved risky work.'
---

# Guardrail carve run

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Task includes guardrail-adjacent material (stealth, scraping, privacy, IP, policy, security), or mixes reversible work with irreversible, credential, data-at-rest, migration, or deletion work, or the user says "autobahn this", or the agent notices itself about to hedge, soften, or silently skip. |
| Authority | Reversible local: writes only the descope ledger and archive entries, and spawns a context-clean subagent given only the carved prompt; rollback is version control. No remote mutation. |
| Side effect | A context-clean subagent spawned with only the carved prompt; a local descope ledger; post-run archive entries. |
| Done | Carve covers every guardrail-adjacent item with class, verdict, alternative, and archive destination; the runner saw only the carved prompt and its guard held both directions; an independent N=1 re-sweep was diffed against the ledger; the ledger is reported; the archive is written only after the run closed. |

## Inputs

- The task and its adjacent inputs, the risky original this session reads but never hands to the runner.
- The user's risk posture or pre-authorization for descoping. Optional. If absent, produce a proposed carve and wait for approval on every gray-zone item before running.
- A fresh subagent spawn capability, a Task that starts with no prior context. Required.
- An archive destination per carved item. Required before closure; propose one if the user names none.

## Procedure

1. **Frame.** Read the task, inputs, and user-stated risk posture. If the user already authorized descoping, proceed. Otherwise propose the carve, make the split explicit, and wait for approval on every gray-zone item before running. A bright-line item has no safe version, so it is non-negotiable; a gray-zone item's safe alternative trades away scope the user might want, so it is the real question. If every item is bright-line, proceed; the ledger carries the record. Done when: the task is read and descoping is authorized or the carve is proposed and awaiting approval.
2. **Carve.** Sweep the task and adjacent inputs for guardrail-adjacent items. For each, propose `verdict=descope`, class it bright-line (irreversible, credential, data-at-rest, migration, or deletion work that cannot be rolled back) or gray-zone (guardrail-adjacent but reversible or ownership-uncertain), give one risk-free alternative, and name an archive destination. A gray-zone item the user decides to keep stays in scope and enters the ledger as kept-by-owner. Point to excluded techniques only as far as identification requires; never elaborate them. Never probe: do not pose an excluded or gray-zone ask to see whether it passes; the carve settles scope before any such ask exists. Done when: every item is classified with a safe alternative and archive destination.
3. **Appeal.** If the user disputes a bright-line call, do not let the pressured session re-litigate it. Hand the item's abstract description, stripped of the negotiation and any persuasion, to a fresh context for re-evaluation, and record the appeal and its outcome in the ledger either way. Repeated appeals on the same item are themselves a signal worth surfacing. Done when: the appeal is resolved and recorded.
4. **Guard.** Distill the carve into a compact scope-guard block, absolute exclusions, allowed alternatives, and the context that authorizes what stays in scope, and fold it into the carved prompt verbatim. The block names each exclusion so the run cannot re-introduce it, never the original risky ask or its method. Where the run shares a filesystem or memory store with this session, the block also forbids the run from consulting decision logs, notes, or transcript search over that shared state; a clean prompt does no good if the run can read the risky ask back out of something this session just wrote nearby. Instruct the run to build the safe scope at full strength, with no hedging, apology, or shrunken deliverable. Done when: the scope-guard block is folded verbatim into the carved prompt.
5. **Run.** Spawn a fresh, context-clean subagent and hand it only the carved prompt, never the risky original or the carve reasoning. It runs the safe scope at full strength and returns the deliverable. If risky material surfaces inside a subagent, route it back through Carve, never improvised inline. Done when: the subagent returns its deliverable or surfaces new risky material for re-carving.
6. **Verify.** Run an adversarial pass over the returned deliverable and adjacent artifacts across all five directions: risky content elaborated, risky content silently dropped, safe work diluted or treated as excluded, stale risky material left standing nearby, and the carve missed or over-excluded something. Re-sweep the original task from a context independent of this one and diff the result against the ledger before reporting. Cap that independent re-sweep at one pass (N=1), not open-ended fan-out. Fold any gap back into the ledger. Done when: the adversarial pass completes in all five directions with the independent re-sweep diffed.
7. **Ledger.** After the run has finished and the subagent's window is closed, report the deliverable with a descope ledger listing every carved item: its class, its verdict of descoped or kept-by-owner, the reason, the safe alternative, and the archive destination. Write the archive entry only now, not earlier; a record of the risky material sitting on disk while the run is still active undoes the isolation the carve bought. Treat exclusions as visible decisions, not gaps. Descoped material is archived with its cause of death and safe replacement, never erased, so a later pass can mine the ledger for anti-patterns. Done when: the ledger and archive are written after the run closes.

## Failure and recovery

- Gray-zone item unanswered. Do not begin the run while a gray-zone item that shapes the carved prompt still awaits an answer. Hold and surface the question. Bright-line exclusions are never negotiable, so never stall on those alone.
- Disputed bright-line item. Never negotiate the exclusion; re-evaluate the abstract description in a fresh context and record the appeal either way. If it is confirmed bright-line, the task proceeds without it or the user redirects.
- Carve declined. Dispatch nothing, write nothing, and report that the task was not run.
- No safe remainder. If the carve leaves nothing reversible to build, stop and report that; do not dispatch a hollow run.
- Risky material surfaces mid-run. The subagent must not improvise. Route the discovery back through Carve, class and ledger it, and re-issue a re-carved prompt before continuing.
- Shared-state leak. If the run can reach decision logs, notes, or transcript search over state this session wrote, the carve is incomplete. Re-issue the carved prompt with the shared-state prohibition baked in before running.
- Re-sweep gap. If the independent N=1 re-sweep finds a missed risk or an over-broad exclusion, fold it back into the ledger and re-carve; do not report done with a known gap.
- Archive written early. If an archive entry was written before the run closed, delete it and rewrite after close; an early record undoes the isolation.
- Interruption before closure. The ledger and archive do not exist yet by design; report the window as open and the deliverable as unverified. Nothing outside the named ledger and archive is ever written, so no other mutation is created to roll back.
- Non-converged. If a gap cannot be folded back within one re-carve, report the blocked result with the partial ledger and the unresolved item; never claim the done predicate holds.

## Output

A safe deliverable from the runner, plus a distinct descope ledger with one entry per guardrail-adjacent item: class (bright-line or gray-zone), verdict (descoped or kept-by-owner), reason, safe alternative, and archive destination. The archive entries are written after the run closes. Exclusions are visible decisions, not gaps. Terminal states: complete and undiluted, or failed verification with the failing direction named.
