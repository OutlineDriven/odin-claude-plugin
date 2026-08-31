---
name: post-change-check-gate
description: 'Use when an artifact or skill has just changed and is about to be called done, committed, or handed off. Run and apply the relevant hygiene checks. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Post change check gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Right after creating or changing an artifact/skill, before calling it done, committing, or handing off |
| Authority | Reversible local: write only to the named artifact; rollback path: revert the artifact to pre-check state |
| Side effect | Applies findings to the artifact (or consciously defers with stated reason); never touches git |
| Done | Relevant checks actually ran (not eyeballed); artifact changed or every skipped check has a stated reason |

## Inputs

- `artifact_path` (required): path to the changed artifact or skill
- `check_results` (optional): outputs from any checks already run; if absent, checks are run inline

## Procedure

1. **Run checks inline.** Do not accept "looks fine" or "eyeballed" as proof. For each applicable hygiene concern (lint, type, test, format, link, security scan, or domain-specific validation), invoke the check and capture its concrete pass/fail/skip output.
2. **Log every result.** Record pass, fail, or skip with the specific check name and a one-line reason for skip.
3. **Apply fixes only to the artifact.** When a check fails, edit the artifact to fix the finding. Do not edit unrelated files.
4. **Record skip reasons.** If a check is skipped, write the reason explicitly into the check log before proceeding.
5. **Verify the check set passes.** Re-run checks until all relevant checks pass or every skip is documented. If a check cannot be made to pass, stop and leave the artifact in a documented deferred state; do not commit or hand off a dirty artifact.

## Failure and recovery
- **Check fails and fix fails or is unavailable:** Report the failure class and the specific finding. Stop. The artifact is not done, committed, or handed off.
- **Check cannot be run (tool unavailable, missing dependency):** Skip it with an explicit reason in the check log. The skill is not failed; the skip is recorded.
- **Artifact reverts:** If an edit corrupts the artifact, revert to the pre-check version. This is the rollback path for the reversible-local authority.
- Partial-result rule: if any check fails and cannot be resolved, the done predicate is not met regardless of other passing checks.

## Output
The artifact is changed with all check findings applied, or the check log records every skip with its reason. A concrete check-run report is emitted: artifact path, checks invoked, results per check, and any deferred items with stated reasons.

## Provenance

Origin: https://github.com/LilMGenius/paperthin (skills/depth/sip/SKILL.md). Revision: 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License: MIT — Copyright (c) 2026 LilMGenius. Permission is hereby granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. Adaptation: refined trigger predicate to the check-running verification gate with claim-gated conditional firing and mandatory skip-reporting as the distinguishing mechanism.
