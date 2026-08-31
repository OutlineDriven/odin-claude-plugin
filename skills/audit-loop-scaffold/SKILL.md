---
name: audit-loop-scaffold
description: 'Use when loop scaffold files have drifted from templates or each other. Rewrites only the auto-fixable set (STATE.md, gate.yaml, loop-budget.md, loop-run-log.md) from templates and reports other drift. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Audit loop scaffold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | loop scaffold files have drifted from their templates or from each other |
| Authority | write only the fixed auto-fixable set; rollback if verification fails |
| Side effect | rewrites only STATE.md, gate.yaml, loop-budget.md, loop-run-log.md from templates; reports every other drifted file |
| Done | scaffold files match their templates or drift is reported with its exact file; nothing outside the fixed set was written |

## Inputs

| Input | Required | Description |
|---|---|---|
| loop_dir | yes | path to the loop directory containing scaffold files |
| templates | yes | STATE.md.template, gate.yaml.template, loop-budget.md.template, loop-run-log.md.template from the loop-engineering provenance |

Templates must be sourced from cobusgreyling/loop-engineering at revision d03dcb92. No other skill, module, AGENTS file, or planning artifact is required.

## Procedure

1. Resolve `loop_dir` to an absolute path. Fail with `loop_dir_unavailable` if it does not exist or is not a directory. Done when: `loop_dir` resolves to an existing directory.
2. Read the four template files into memory. Fail with `template_unavailable` if any template cannot be read. Done when: all four templates are in memory.
3. List every file in `loop_dir` at depth 1 (direct children only). Done when: the direct-child file list is complete.
4. For each auto-fixable name (STATE.md, gate.yaml, loop-budget.md, loop-run-log.md):
   a. Compute the target path as `loop_dir/<name>`.
   b. Compute the file hash of the current target if it exists.
   c. If the target does not exist or its hash differs from the template hash, write the template content to the target path.
   d. Record the write in the action log with before/after hashes.
   Done when: every auto-fixable file matches its template or is written from it.
5. For every other file in `loop_dir` not in the auto-fixable set:
   a. Compute the file hash.
   b. If the hash matches none of the four template hashes, record the file path and hash in the drift report.
   Done when: every non-auto-fixable drifted file is in the drift report.
6. Verify every written auto-fixable file matches its template byte-for-byte by re-reading and comparing hashes. If any verification fails, roll back every file written in step 4 to its pre-write content and fail with `auto_fix_verify_failed`. Done when: every written file matches its template byte-for-byte.
7. Assert: every auto-fixable file matches its template; every other drifted file is in the drift report. If the assertion fails, fail with `non_converged`. Done when: the assertion holds.
8. Return the complete drift report. Done when: the drift report is returned.

## Failure and recovery
| Class | Partial-result rule | Rollback |
|---|---|---|
| loop_dir_unavailable | return `blocked`; no writes performed | n/a |
| template_unavailable | return `blocked`; no writes performed | n/a |
| auto_fix_verify_failed | return `non_converged`; include the failing file | rollback every file written in step 4 to its pre-write content |
| non_converged | return `non_converged`; include the full action log and drift report | rollback all auto-fixable writes |

On any failure, the result reports exactly what was attempted, what succeeded, and what must be done manually.

## Output
```
{
  "status": "converged" | "non_converged" | "blocked",
  "loop_dir": <resolved absolute path>,
  "auto_fixed": [
    {
      "file": "STATE.md" | "gate.yaml" | "loop-budget.md" | "loop-run-log.md",
      "before_hash": <hex or null>,
      "after_hash": <hex>
    }
  ],
  "drift_reported": [
    {
      "file": <relative path>,
      "hash": <hex>
    }
  ],
  "auto_fix_failures": [],  // populated only on auto_fix_verify_failed
  "converged": <boolean>
}
```

## Provenance

Origin: cobusgreyling/loop-engineering (MIT). Revision: d03dcb92cc1e0efb59789a2557131c6ad5897ccc. Adaptation: self-contained ODIN 2.0 skill implementing template-driven drift reconciliation for the fixed auto-fixable set, with all other drift reported rather than auto-written. Clean-room implementation against loop-sync/src/sync.ts and the four template files (STATE.md.template, gate.yaml.template, loop-budget.md.template, loop-run-log.md.template). No third-party expression copied.
