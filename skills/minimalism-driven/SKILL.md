---
name: minimalism-driven
description: 'Use when writing or restructuring code, before adding a helper, wrapper, config key, or dependency, or when the user asks for minimal code, DRY code, or no gold-plating. Produce the smallest complete implementation whose intent is obvious and whose scope equals the ask. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Minimalism driven

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or restructuring code; considering a helper, wrapper, config key, or dependency; or an explicit request for minimal code, DRY code, or no gold-plating. |
| Authority | Inspect relevant local code and make only reversible local edits needed by the ask. Do not mutate remote state, credentials, published artifacts, deployments, or unrelated files. |
| Side effect | Edit code within the requested scope; do not implement adjacent improvements. |
| Done | Every addition has a concrete reason, intent and failure behavior are obvious, and the resulting scope exactly matches the ask. |

## Inputs

Supply the requested behavior and the local code surface to change. Supply explicit constraints or acceptance criteria when they exist. Existing nearby implementations and call sites are required evidence for reuse decisions; no additional input is optional if its absence would require guessing behavior.

## Procedure

1. Bound the requested behavior, affected files, and acceptance criteria before editing. If any required behavior cannot be determined from the request or local code, stop rather than invent it.
2. Inspect the affected code and its relevant call sites for an existing implementation or convention that can satisfy the ask; reuse that before creating a second form.
3. Try deletion first, then modification of existing code. Add new code only when neither can produce the required behavior.
4. Before adding a helper, wrapper, config key, dependency, branch, or other surface, state its concrete necessity in one sentence. Omit it if removing it would leave the requested outcome unchanged.
5. Keep each retained addition sufficient rather than merely short: use clear names, handle required error paths, and encode or state assumptions where the code otherwise permits a silent gap.
6. Make only the bounded local edits. Do not build an adjacent improvement; report it separately only when it materially affects the requested work.
7. Verify the changed behavior using the narrowest available check that exercises it, then inspect the final change set. Success requires every addition to retain a concrete necessity, intent and failure behavior to remain obvious, and no change outside the ask.

## Failure and recovery
- **Missing contract:** If required behavior or acceptance criteria remain unknowable from the request and local evidence, make no speculative edit and return `blocked: missing contract` with the exact missing fact.
- **No safe minimal form:** If deletion, reuse, or modification cannot satisfy the ask without breaking required behavior, retain the smallest necessary addition and identify the constraint that requires it; if that constraint cannot be established, return `blocked: necessity unproven`.
- **Verification failure:** If the changed behavior fails its narrow check, restore the files changed by this procedure to their pre-edit contents or leave the failing edits clearly identified as a partial result, and return `non-converged: verification failed` with the failed check and observed result.
- **Scope expansion:** If completion would require unrelated files, remote mutation, credentials, publishing, deployment, or a dependency not authorized by the ask, do not perform that work and return `blocked: scope expansion required` with the exact boundary.

Never report the done predicate while a required check fails or evidence is missing.

## Output
Return the completed local code change and a concise report naming the behavior implemented, the files changed, the necessity of each new surface, the verification performed and its observed result, and any blocked adjacent work. On failure, return the exact blocked or non-converged classification defined above and preserve or restore the pre-edit state as specified.

## Provenance

Project-owned adaptation of `skills/minimalism-driven/SKILL.md` from the `odin-current` candidate `current:current-c:current:minimalism-driven`. No source revision or external license identifier was supplied. This version preserves the source mechanisms—reuse before addition, delete then edit before creating, one-sentence necessity, obvious intent and failure paths, and strict scope—while rewriting them into the ODIN 2.0 self-contained contract.
