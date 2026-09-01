---
name: to-tickets
description: 'Use when a settled plan needs implementation tickets published as blocker-linked slices, tracer bullets, or expand-contract sequencing, and a human invokes the publication. Publishes GitHub issues or local ticket files and writes their URLs back into the plan. Not for implementation — use work; not for unsupervised publication.'
disable-model-invocation: true
---

# To tickets

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A settled plan needs implementation tickets, tracer bullets, or expand-contract sequencing published, and a human invokes the publication. |
| Authority | Requires explicit human invocation. Before anything is published, present the complete ticket draft, the exact targets (every GitHub issue to be created or local file to be written), and the consequence of publishing; proceed only on the human's approval. |
| Side effect | Creates GitHub issues or local ticket files at the single resolved storage scheme, and writes the issue URLs or file paths back into the source plan's Delivery section. Limited to the approved draft's tickets and that Delivery section; no other remote or local mutation. |
| Done | Every approved ticket is published and linked in the plan's Delivery section, each ticket declares its blockers, the vertical end-to-end path comes first, and a per-ticket blocked-by report is produced. Complete only when every approved ticket is published and linked; otherwise blocked with the exact remainder. |

## Inputs

Required:

- The settled source plan, by file location. A plan is settled when the route is decided and implementation has not begun; if it is not settled, stop before drafting. Full text is accepted only when the human explicitly declines Delivery write-back at the approval gate; without a file location, write-back cannot proceed and the done predicate cannot hold.
- The human's approval at the approval gate in the procedure.

Optional:

- A parent issue reference, used only in the GitHub issue body.
- A feature slug for the local file layout, taken from the plan when one is present and supplied by the human otherwise.

## Refusals

- Will not draft from an unsettled plan.
- Will not publish before the human approves the complete draft, exact targets, and consequence.
- Will not implement the tickets or mutate anything beyond the approved ticket set and the source plan's Delivery section.
- Will not invent storage when the repository answers it.

## Procedure

1. Confirm the plan is settled: the route is decided and implementation has not begun. If not, stop, publish nothing, and name what is undecided. Record the plan file location for write-back. If the plan was supplied as full text and write-back is expected, stop and ask for the file location; if the human explicitly declines write-back, proceed without it but note that the done predicate cannot hold without Delivery links. Done when: the plan is confirmed settled and the file location is recorded or write-back is explicitly declined.
2. Draft tickets as vertical slices. Cut each slice as a narrow but complete path through every layer it needs, make each completed slice demoable or verifiable on its own, and size each slice to fit one fresh context window. Put prefactoring first: make the change easy, then make the easy change. Done when: every ticket is a bounded, independently verifiable vertical slice.
3. Assign blocked-by edges and sequence wide refactors. Give every ticket its blocked-by list: the tickets that must finish before it can start. A ticket with no blockers starts immediately. Identify the executable frontier: the smallest set of tickets whose blockers are all external to this decomposition. Confirm the blocker graph is acyclic; if a ticket blocks itself directly or transitively, return non-converged with the cycle. Sequence a wide refactor (one mechanical change whose blast radius fans across the codebase so no vertical slice can land green) as expand, migrate, then contract: add the new form beside the old, move call sites in batches sized by blast radius with CI green between batches, then delete the old form in a final ticket blocked by every migrate ticket. When a migrate batch cannot stay green alone, keep the sequence but add a shared integration ticket that every batch blocks, with green promised only at that final ticket. Done when: every ticket declares its blockers, the frontier is identified, the graph is acyclic, and each wide refactor has an expand-migrate-contract dependency chain with an integration ticket where required.
4. Present the full draft as a numbered list showing each ticket's title, blocked-by list, and delivered behavior. Ask whether the granularity is right, whether each blocking edge genuinely gates its ticket, and whether any ticket should merge with another or split further. Iterate until the human approves. Publish nothing before approval. Done when: the human approves the complete draft, exact targets, and consequence.
5. Resolve one storage scheme from the repository; never ask when the repository answers it. If a GitHub remote is present, publish one issue per ticket in dependency order, blockers first, so each edge references a real identifier. Use native blocking or sub-issue links when GitHub provides them; otherwise add a `Blocked by` section. Apply `ready-for-agent` only when the repository already defines that label. If no GitHub remote is present, write one file per ticket at `.outline/to-tickets/<feature-slug>/<NN>-<slug>.md`, numbered from `01` in dependency order, blockers first; never combine tickets into one file. Fill each ticket body from the matching storage branch in `references/ticket-templates.md`. Then write the published issue URLs or file paths back into the source plan's Delivery section so the plan links every published ticket; if the plan has no Delivery section, add one at the end. Report the identifier or path of every published ticket, its blocked-by edges, and the plan location updated. Done when: every approved ticket is published in dependency order to the resolved storage, the plan's Delivery section links every real published identifier or path, and the report accounts for every approved ticket.

## Failure and recovery

- Unsettled plan: stop before drafting; publish nothing; return what is undecided.
- Approval withheld: publishing stays blocked until the human approves; no file or remote mutation has occurred; return the last presented draft with the open questions.
- Publish rejected mid-order: if the remote rejects or cannot create an issue, stop at that ticket in dependency order. Issues already created stay published; remote mutation is not rolled back. Write back only identifiers that really exist, list the failed ticket and every ticket still unpublishable behind it, and leave the storage decision for any retry to the human.
- Write-back fails: if the plan cannot be edited, return blocked with the complete list of published identifiers and paths; the done predicate does not hold until the plan links them.
- Cyclic blocker graph: if no ticket is unblocked (a ticket blocks itself, directly or transitively), return non-converged with the cycle so the human can break the cycle in the plan before retrying; publish nothing.
- Blocked result: return blocked with the stop reason, the draft state, and the exact published-or-unpublished status of every ticket. Never swallow a publishing error or claim the done predicate while any ticket is unpublished or unlinked.

## Output
The published ticket set ordered blockers-first, the source plan's Delivery links, and a per-ticket blocked-by report. Terminal classification is published-complete only when every approved ticket is published and linked; otherwise blocked with the exact remainder.
