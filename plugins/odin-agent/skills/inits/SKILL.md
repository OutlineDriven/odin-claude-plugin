---
name: inits
description: 'Use when onboarding to a repository, capturing costly conventions, constraints, or rationale, or improving AGENTS.md. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Inits

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit human invocation for repository onboarding or for creating or improving `AGENTS.md` to capture conventions, constraints, or rationale. |
| Authority | Reversible local: writes only the repository's `AGENTS.md`; rollback is restoring the pre-edit content or deleting the file if newly created. No remote mutation. |
| Side effect | Create or update `AGENTS.md` from repository files actually read, and identify descriptive lines for deletion; never fabricate a rule, constraint, rationale, or source. |
| Done | `AGENTS.md` exists and every retained instruction is prescriptive, non-derivable from the repository itself, and grounded in a file actually read or marked human-supplied. |

## Inputs

Required: the repository root and explicit human invocation. If the intended `AGENTS.md` location is not the repository root, the target path must be supplied. Optional: conventions, constraints, or rationale supplied by the human; treat these as candidate instructions and distinguish them from repository-grounded evidence.

## Procedure

1. Resolve the repository root and the single target `AGENTS.md`; reject a target outside that repository and make no mutation. Done when: the repository root and target path are resolved, or an out-of-repository target is rejected with no mutation.
2. Read the existing target when present, then inspect only repository files relevant to its candidate instructions, such as build and test configuration, manifests, automation, architecture boundaries, and nearby documentation. Record which files were actually read. Done when: the existing target is read or confirmed absent, and the relevant repository files are inspected with their paths recorded.
3. Admit a candidate only when it tells a future agent what it must do, must not do, or must preserve. Reject repository descriptions, inventories, generated facts, and commands or settings that a future agent can derive directly by reading the repository. Done when: every candidate is admitted or rejected with the admission-gate reason recorded.
4. For each admitted instruction, identify evidence in a file actually read or mark it as human-supplied. Preserve rationale only when the evidence or human input establishes it; do not infer missing policy from common practice or invent evidence. Done when: every admitted instruction has grounded evidence or a human-supplied tag, with no inferred policy.
5. Review the existing target line by line. Preserve grounded, non-derivable prescriptions; propose removal of descriptive, stale, duplicated, or directly derivable lines, naming the reason for each proposed removal. Done when: every existing line is preserved or proposed for removal with a named reason.
6. Write the smallest coherent `AGENTS.md` that applies the accepted removals and contains only the admitted instructions. Keep each rule operational by stating its condition and required action or prohibition. Done when: the target file is written containing only admitted instructions in operational form.
7. Re-read the resulting target and verify every instruction against the admission gate and its recorded evidence. If any instruction lacks grounding or is derivable from repository files, remove it before declaring success. Done when: every instruction in the written file passes the admission gate and is grounded in recorded evidence.
8. Report the target path, evidence files read, applied additions or changes, and removals. The rollback path is restoration of the target's pre-write contents, or removal of the newly created target when none existed. Done when: the report is emitted with target path, evidence files, changes, removals, and rollback path.

## Failure and recovery
- Invalid or ambiguous target: Make no mutation and return `blocked` with the unresolved repository root or target path.
- Insufficient evidence: Omit the unsupported candidate. If no instruction survives, leave an existing target unchanged, do not create an empty target, and return `blocked: no grounded, non-derivable rules`.
- Unsafe scope expansion: Stop before changing any file other than the resolved target and return `blocked` with the out-of-scope change required.
- Write or verification failure: Restore the pre-write target contents when possible and return `blocked` with the failed operation and whether rollback succeeded. If rollback fails, report the exact partial state; never claim the done predicate.

A partial draft is not success. Return it only as a partial result with unsupported candidates and unapplied removals identified.

## Output
On success, the concrete artifact is the resolved `AGENTS.md`, accompanied by a report listing evidence files actually read, human-supplied rules, applied additions or changes, applied removals with reasons, and the rollback path. Otherwise, output the exact `blocked` classification and any partial-state or rollback details required above.
