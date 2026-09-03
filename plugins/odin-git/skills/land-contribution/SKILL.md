---
name: land-contribution
description: 'Use when a maintainer or collaborator explicitly asks to review and land one external pull request. Don''t use for internal pull requests or landing without preserving contributor authorship.'
disable-model-invocation: true
---

# Land contribution

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A maintainer or collaborator explicitly asks to review and land one external pull request. |
| Authority | Human-only external operation: inspect first, then preview the exact repository, pull request, landing branch, reviews, comments, and close or merge consequences before using credentials or mutating the remote. |
| Side effect | For an accepted contribution, create or update only `land/pr-<n>`, preserve the contributor's commits and authorship, add maintainer changes as separate commits, submit approval, land the result, and post a credit-bearing close comment. For a declined contribution, post thesis-tied reasons and retain the contributor branch. |
| Done | Remote state confirms preserved authorship, separately attributed maintainer edits, approval before closure, a credit comment on closure, an explanation of any rename to the author, or a decline whose stated reasons are tied to the contribution's thesis and whose branch remains intact. |

## Inputs

Required: repository identity, pull-request number, authenticated maintainer or collaborator access, and the repository's observable acceptance criteria and available checks. The pull request supplies its author, branch, commits, discussion, title, description, and changed files. An intended replacement title is optional; if supplied or discovered to be necessary, its reason must also be available before mutation.

## Procedure

1. Resolve the repository and pull request, verify that the request concerns an external contribution, and record the pull request number, author, source branch, head revision, commit authorship, thesis stated by its title and description, discussion, diff, and check status. Do not mutate remote state while establishing this baseline. Done when: the baseline is recorded and the contribution is confirmed external.

2. Derive review criteria from the contribution's thesis and the repository's observable contract. Review the behavior and evidence without relying on a named reviewer, bot, or unavailable integration. Treat unavailable review automation as reduced evidence, not as permission to reject or accept automatically; continue with direct inspection and available checks, and identify any evidence that remains unavailable. Done when: review criteria are derived and direct inspection is complete with unavailable evidence identified.

3. Classify the contribution as accepted, repairable without changing its thesis, declined, or blocked. Tie every material finding to the thesis, repository contract, changed behavior, or missing proof. Stop as blocked if authorship, authority, target revision, or required evidence cannot be established; do not widen the task or invent evidence. Done when: one classification is assigned with every finding tied to its basis.

4. Before any remote mutation, present one preview naming the repository, pull request, pinned head revision, classification, intended `land/pr-<n>` branch, commits to preserve, proposed maintainer edits, any title rename and its explanation, the approval action, landing action, close comment, and branch-retention consequence. Proceed only under the user's explicit invocation and within that preview. Done when: the preview is presented and the user explicitly approves it.

5. If declined, do not rewrite, delete, or close the contributor branch. Post the thesis-tied reasons without unrelated style demands, include what evidence would change the decision when known, and close the pull request only if closure was included in the preview. Ensure the close comment names and credits the contributor. Done when: thesis-tied reasons are posted, the contributor branch is retained, and the close comment credits the contributor.

6. If accepted or repairable, create `land/pr-<n>` from the pinned pull-request head so every contributor commit and its author metadata remain unchanged. Never squash, amend, re-author, or fold maintainer work into those commits. Done when: `land/pr-<n>` is created from the pinned head with all contributor commits and authorship preserved.

7. Apply only the maintainer edits needed to satisfy the stated thesis and acceptance criteria, each in separate maintainer-authored commits. Reassess the resulting branch against the same criteria. If the repair would replace or materially broaden the thesis, stop and return blocked rather than taking ownership of a different contribution. Done when: maintainer edits are applied as separate commits and the branch reassesses against the same criteria.

8. If the title must change, explain the old title, new title, and thesis-based reason to the author before renaming it. Do not silently rename the contribution. Done when: the rename is explained to the author before it is applied, or no rename is needed.

9. Run or inspect the available checks that cover the changed behavior and record their exact outcomes. If a required check is unavailable or fails, do not approve or land; return blocked with the preserved branch and the observed failure. Done when: all available checks are run or inspected with exact outcomes recorded, or a blocking failure is returned.

10. Re-read the remote pull request and confirm its head still matches the pinned revision. On drift, stop before approval or landing, report both revisions, and require a fresh review of the new head. Done when: the remote head matches the pinned revision, or drift is reported and the skill stops.

11. Submit an approval review before any action that closes the accepted pull request. Confirm the approval is visible remotely; inability to self-approve or platform rejection degrades to blocked and must not be represented as approval. Done when: the approval is visible remotely, or a blocking rejection is returned.

12. Land the accepted `land/pr-<n>` result through the repository's normal pull-request operation without altering contributor authorship. Confirm the landed revision and remote closure state, then post or verify a close comment that names and credits the contributor and distinguishes their commits from maintainer edits. Done when: the landed revision and closure state are confirmed and the credit comment is posted or verified.

13. Read back the remote branch, review, landing, closure, and comment state. Report success only when every applicable Done predicate is directly confirmed. Done when: every applicable Done predicate is confirmed by remote read-back.

## Failure and recovery
- Authority or identity failure: Make no remote mutation when repository, pull request, contributor, credentials, or maintainer authority cannot be established; return `blocked` with the missing fact.
- Head drift: Make no approval or landing mutation after the reviewed head changes; retain all branches and return `blocked` with the reviewed and current revisions.
- Evidence failure: Preserve any landing branch, withhold approval and landing, and return `blocked` with each failed or unavailable required check and any usable partial review findings.
- Authorship risk: Stop before any squash, amendment, re-authoring, or history rewrite; retain the contributor and landing branches and return `blocked` naming the threatened commits.
- Remote partial failure: Do not repeat an operation until its remote state has been read back. Keep confirmed operations, report the exact unconfirmed operation, and resume only from the first absent state; never claim the Done predicate from a local response alone.
- Approval unavailable: If the platform forbids the acting maintainer from approving or rejects the review, do not close or land the accepted pull request; return `blocked` with the platform response.
- Decline: Return `declined` only after thesis-tied reasons and contributor credit are visible and the contributor branch is confirmed retained. A decline is a terminal classification, not a failed landing.

No failure permits deleting the contributor branch, rewriting contributor commits, silently renaming the pull request, widening the contribution's thesis, swallowing a remote error, or reporting an unconfirmed operation as complete.

## Output

Return one terminal record containing the repository and pull-request number; contributor; reviewed head revision; thesis; classification (`landed`, `declined`, or `blocked`); findings and check outcomes; previewed and confirmed remote operations; `land/pr-<n>` revision when created; contributor commits and authorship confirmation; separate maintainer commits; approval reference; landed revision and closure state; credit-comment reference; rename explanation when applicable; retained branches; and any exact blocking failure. `landed` and `declined` require remote read-back evidence for every applicable Done predicate.
