---
name: post-change-check-gate
description: 'Use when an artifact or skill has just changed and is about to be called done, committed, or handed off. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Post change check gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Right after creating or changing an artifact/skill, before calling it done, committing, or handing off |
| Authority | Reversible local: writes only the named artifact; rollback is revert to pre-check state. No remote mutation. |
| Side effect | Applies findings to the artifact, or defers each with a stated reason; never touches git |
| Done | Relevant checks actually ran (not eyeballed); artifact changed or every skipped check has a stated reason |

## Inputs

- `artifact_path` (required): path to the changed artifact or skill
- `check_results` (optional): outputs from any checks already run; if absent, checks are run inline

## Procedure

1. **Run checks inline.** Do not accept "looks fine" or "eyeballed" as proof. For each applicable hygiene concern (lint, type, test, format, link, security scan, or domain-specific validation), invoke the check and capture its concrete pass/fail/skip output. Done when: every applicable check is invoked with concrete output captured.
2. **Log every result.** Record pass, fail, or skip with the specific check name and a one-line reason for skip. Done when: every check result is logged with name and outcome.
3. **Apply fixes only to the artifact.** When a check fails, edit the artifact to fix the finding. Do not edit unrelated files. Done when: every failed check's finding is fixed in the artifact or deferred with a reason.
4. **Record skip reasons.** If a check is skipped, write the reason explicitly into the check log before proceeding. Done when: every skipped check has an explicit reason in the log.
5. **Verify the check set passes.** Re-run checks until all relevant checks pass or every skip is documented. If a check cannot be made to pass, stop and leave the artifact in a documented deferred state; do not commit or hand off a dirty artifact. Done when: all relevant checks pass or every skip is documented and the artifact is in a clean or documented-deferred state.

## Failure and recovery
- Check fails and fix fails or is unavailable: Report the failure class and the specific finding. Stop. The artifact is not done, committed, or handed off.
- Check cannot be run (tool unavailable, missing dependency): Skip it with an explicit reason in the check log. The skill is not failed; the skip is recorded.
- Artifact reverts: If an edit corrupts the artifact, revert to the pre-check version. This is the rollback path for the reversible-local authority.
- Partial-result rule: if any check fails and cannot be resolved, the done predicate is not met regardless of other passing checks.

## Output
The artifact with all check findings applied, or the check log recording every skip with its reason, plus a concrete check-run report naming artifact path, checks invoked, results per check, and any deferred items with stated reasons.
