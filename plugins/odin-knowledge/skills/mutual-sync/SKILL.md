---
name: mutual-sync
description: 'Use when the user and agent may hold different pictures of current state after a gap, sync request, or exposed stale claim. Produces an evidence-backed ledger of agreed facts, corrected beliefs, and open assumptions. Not for persistence — use memory-update.'
---

# Mutual sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for a mutual sync, sync-up, shared-context check, or catch-up, or the conversation exposes a stale user claim or refuted agent assumption. |
| Authority | Read-only: inspect only topic-relevant conversation, files, search results, version-control status, and recent history; do not mutate files, version control, credentials, paid services, publications, deployments, or remote state. |
| Side effect | Write only an in-chat shared-context ledger and, after confirmation, offer a separate persistence action without performing it here. |
| Done | The user confirms a ledger containing Agreed facts, Corrected beliefs, and Open assumptions. |

## Inputs

A named topic is optional when the current task or contested claims identify the scope. The conversation supplies the parties' existing claims. The repository or other accessible local evidence must be available for claims about in-repository state. User testimony is required only for intent or external state that cannot be inspected.

## Procedure

1. Classify the entry situation without asking: pre-work after a new task or gap, mid-session repair after a disputed claim, or cold re-entry with no usable working model. Seed the claim set from task prerequisites for pre-work, from contested claims for repair, or from live local state for cold re-entry. Done when: the entry situation is classified and the initial claim set is seeded.
2. Bound the sync to the named or inferable topic. If a bare invocation has no inferable topic, present one blocking single-select question with two or three candidate scopes and stop until one is selected. Done when: the topic is bounded or the blocking question is presented.
3. Ground each in-repository claim with targeted file reads and searches; do not scan the whole repository. Inspect read-only version-control status and the latest 15 commit summaries to detect a dirty tree or movement since the last shared point. For cold re-entry, also inspect topic-relevant open changes, task state, in-flight branches, and newly introduced project terms. Done when: every in-repository claim has `file:line` evidence or is marked `[unverified]`.
4. Present the agent's model as short numbered claims. Attach `file:line` evidence to each verified repository claim and `[unverified]` to every claim not established by inspected evidence. Never ask the user for a fact available through a targeted read or search. Done when: every claim is presented with its evidence label.
5. Ask no more than three targeted questions when the user is the likely authority for intent, deployments, sibling repositories, other sessions, or recent decisions. Use a bounded choice when the known options are complete and an open question only when the answer must be narrative. Done when: every user-only question is asked or the user has answered.
6. Arbitrate repository-verifiable claims by inspected code and history, correcting stale user beliefs and wrong agent assumptions on equal terms with `file:line` evidence. Treat user statements about intent or inaccessible external state as `[user-attested]`, not independently verified. If a claim remains disputed after evidence is shown, record the dissent and its owner rather than forcing consensus. Done when: every claim is arbitrated and disputes are recorded with owners.
7. Emit an in-chat markdown ledger with exactly three sections: **Agreed facts**, listing each claim with `file:line` or `[user-attested]`; **Corrected beliefs**, naming who held each prior belief and what the evidence established; and **Open assumptions**, listing every unverified or disputed item with its owner. Done when: the ledger contains all three sections and every claim appears under exactly one.
8. Present one blocking choice: `Shared context confirmed (Recommended)` or `Corrections needed`. If corrections are supplied, update the claim set, repeat grounding only for affected claims, re-emit the complete ledger, and ask for confirmation again. Do not begin substantive work while the ledger is unconfirmed. Done when: the user selects `Shared context confirmed` or corrections are supplied for another round.
9. After confirmation, offer persistence once. This read-only procedure neither writes a persistence artifact nor performs the separate persistence action. Done when: the persistence offer is made or the procedure ends.

## Failure and recovery

- Unresolved scope: return `blocked — scope not selected` with the proposed scopes; inspect nothing beyond evidence needed to propose them.
- Missing or inaccessible evidence: retain the claim under Open assumptions with its owner and the exact unavailable source; never convert absence of evidence into a fact.
- Disputed evidence: preserve both the evidenced claim and the dissent under Open assumptions; do not widen the search or force agreement.
- Corrections do not converge: after each correction, recheck only affected claims. If the same dispute repeats without new evidence, return `non-converged — shared context not confirmed` with the latest complete ledger.
- Read-only boundary risk: stop before any mutation and return `blocked — requested action exceeds read-only authority`, identifying the proposed target and action.

A partial or unconfirmed ledger is diagnostic output only and does not satisfy Done. No rollback is needed because this procedure makes no mutation.

## Output

One in-chat markdown ledger with Agreed facts, Corrected beliefs, and Open assumptions, followed by either `confirmed — shared context established`, `blocked — <reason>`, or `non-converged — shared context not confirmed`. Evidence labels remain attached to every claim.
