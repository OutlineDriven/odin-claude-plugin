---
name: wontfix
description: 'Use when the user wants to elicit refused directions, generalize them, and close matching tracker items as not planned. Don''t use for closing duplicates, spam, or items closed for other reasons (completed, obsolete).'
disable-model-invocation: true
---

# Wontfix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to elicit refused directions, generalize and concretize them, and close matching tracker items as not planned. |
| Authority | Explicit human invocation only. Before any mutation the exact target set and its consequence are previewed and approved; the same approval gates the optional docs record. No credentials, paid actions, publishing, or deployment occur. |
| Side effect | Matching tracker items closed as not planned; optional refusal preserved in docs. |
| Done | Refused directions are documented and matching items are closed as not planned after user approval. |

## Inputs

Must be supplied by the user:

- The refused directions or designs, in the user's own words; rough phrasing is acceptable and is recorded verbatim.
- The GitHub repository in scope; the working repository is used when `gh repo view --json nameWithOwner` resolves it, otherwise an explicit `owner/repo` is required.
- Explicit approval of the exact closure set before any mutation.

Optional:

- A durable refusal record in the docs folder; without the request, no docs file is touched.
- Narrowing filters (labels, assignees, search terms) to bound enumeration.

## Procedure

1. Name the tracker in scope: run `gh repo view --json nameWithOwner`; on error, ask for `owner/repo` and rerun `gh repo view <owner>/<repo> --json nameWithOwner`. Stop on failure; nothing has been mutated.
2. Elicit refused directions: ask the user what will not be done. Record each statement verbatim. Never add, infer, or propose refusals the user did not state.
3. Generalize and concretize each verbatim refusal: the generalization is the refused class of work in one sentence; the concretization is the detectable matching signals (keywords, component or path names, label names, design choices). A refusal that resists either form is ambiguous.
4. Resolve every ambiguous refusal and confirm the completed refusal list with the user. The list is frozen only after this confirmation.
5. Enumerate the open tracker surface: `gh issue list --repo <owner>/<repo> --state open --json number,title,body,url,labels --limit 200` and `gh pr list --repo <owner>/<repo> --state open --json number,title,body,url,labels --limit 200`. When the returned count equals the limit, rerun with a higher `--limit` until the open set is fully covered. Stop and report the error if either enumeration fails; nothing has been mutated.
6. Match items to refusals: an item joins the closure set only when its title, body, or labels match a concretized signal of some refusal. For borderline candidates read the full item with `gh issue view <number> --repo <owner>/<repo> --json title,body,url,labels` or `gh pr view <number> --repo <owner>/<repo> --json title,body,url,labels`, and include it only on an explicit signal match. Record kind, number, title, URL, matched refusal, and matched signal for every included item; list excluded borderline items as not matched.
7. Preview and gate: present the exact closure set (number, kind, title, URL, matched refusal) with the consequence, issues close with reason "not planned"; pull requests close unmerged with the refusal as the closing comment, and the docs record plan when requested. Mutate only after the user explicitly approves this exact set; any later change to the set requires fresh approval.
8. Close each approved item, one at a time, recording every result:
   - Issue: `gh issue close <number> --repo <owner>/<repo> --reason "not planned" --comment "<generalization>"`.
   - Pull request: `gh pr close <number> --repo <owner>/<repo> --comment "<generalization> (closed as not planned)"`.
   A failed close is recorded and does not block the remaining approved items; failed items are never silently skipped.
9. Confirm every intended closure: `gh issue view <number> --repo <owner>/<repo> --json state,stateReason` must report `"state": "CLOSED"` with `"stateReason": "NOT_PLANNED"`, and `gh pr view <number> --repo <owner>/<repo> --json state` must report `"state": "CLOSED"`. An item still reporting open receives exactly one retry of its close command and one re-check; a second miss is reported as unconfirmed.
10. Write the optional docs record only when the user requested it and after the step 7 approval: append a dated section to `docs/refused-directions.md` (create the file when missing) listing each refusal verbatim, its generalization and concretization, and the closed item numbers with URLs. Rollback is deletion of the appended section; the rest of the file is untouched.
11. Report per Output. The done predicate holds only when every approved item is confirmed closed.

## Failure and recovery
- Tracker unreachable or unauthenticated: any failing `gh` command before step 8 stops the skill in a blocked state with the command and error reported verbatim; zero items mutated.
- Unresolvable repository: blocked until the user supplies `owner/repo`; never guessed.
- Ambiguous or unmatched refusal: returned to the user with the blocking question; matches are never guessed from inference. A refusal with zero matching items is a valid outcome, reported as such.
- Partial batch failure: already-confirmed closures stand because each was individually approved; remaining approved items are still attempted; unconfirmed and failed items are named exactly. Done is never claimed while any approved item is unconfirmed.
- Wrong item closed: recovery is an explicit reopen on user instruction only, `gh issue reopen <number> --repo <owner>/<repo>` or `gh pr reopen <number> --repo <owner>/<repo>`, recorded in the report.
- Docs write failure: closures are unaffected; report the filesystem error and the intended section content; never report a record that was not written.
- Errors are surfaced verbatim; the done predicate is never reported as holding when any approved item is unconfirmed.

## Output
- A refusal ledger: every verbatim refusal with its generalization, concretization, and matched items.
- A closure table: number, kind, title, URL, and result per item: confirmed closed as not planned (issues), confirmed closed (pull requests), unconfirmed, or failed with the error text.
- The docs record path when written, otherwise "not requested".
- A terminal classification: done (every approved item confirmed), partial (named unconfirmed or failed items), or blocked (named failure, zero mutations).
- Borderline items intentionally left open.

## Provenance

- Candidate: `curated:curated-ideas:curated-080`, origin `project-owned:user-curated-skill-ideas`, mechanism recorded in `project-owned:user-supplied-source-brief`.
- Pinned revision: none supplied. License: none supplied; project-owned.
- Adapted from a user-curated chat-log mechanism into this standalone GitHub tracker-hygiene workflow. The preserved mechanism: elicit refused directions, generalize and concretize them, close matching issues and pull requests as not planned, and optionally preserve the refusal record in docs. No third-party expression is copied.
