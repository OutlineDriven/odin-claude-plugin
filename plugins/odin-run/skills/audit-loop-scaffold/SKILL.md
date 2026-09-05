---
name: audit-loop-scaffold
description: 'Use when loop scaffold files have drifted from their provenance-pinned templates. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Audit loop scaffold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Loop scaffold files have drifted from their templates or from each other |
| Authority | Reversible local: writes only the four named auto-fixable files; rollback is restoring retained pre-write content. No remote mutation. Retains pre-write content (including the absence state for newly created files) and rolls back on verification failure. |
| Side effect | Rewrites only STATE.md, gate.yaml, loop-budget.md, loop-run-log.md from templates; reports every other drifted file |
| Done | Scaffold files match their templates or drift is reported with its exact file; nothing outside the fixed set was written |

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
4. Back up pre-write state for the four auto-fixable files. For each name (STATE.md, gate.yaml, loop-budget.md, loop-run-log.md): if the target file exists, record its content and hash; if it does not exist, record its absence. This backup is the rollback source. Done when: pre-write state for all four auto-fixable files is recorded, including absence states.
5. Converge the four files to template content. For each auto-fixable name:
   a. Compute the target path as `loop_dir/<name>`.
   b. If the target does not exist or its hash differs from the template hash, write the template content to the target path.
   c. Record the write in the action log with before/after hashes (before hash is null for newly created files).
   Done when: every auto-fixable file matches its template or is written from it, and before/after hashes are recorded.
6. For every other file in `loop_dir` not in the auto-fixable set: compute the file hash. If the hash matches none of the four template hashes, record the file path and hash in the drift report. Done when: every non-auto-fixable drifted file is in the drift report.
7. Verify every written auto-fixable file matches its template byte-for-byte by re-reading and comparing hashes. If any verification fails, roll back every file written in step 5 to its pre-write content from the step 4 backup: restore existing files to their recorded content, and delete files that were newly created (whose pre-write state was absence). Fail with `auto_fix_verify_failed`. Done when: every written file matches its template byte-for-byte.
8. Assert: every auto-fixable file matches its template; every other drifted file is in the drift report. If the assertion fails, fail with `non_converged`. Done when: the assertion holds.
9. Return the complete drift report. Done when: the drift report is returned.

## Failure and recovery

| Class | Partial-result rule | Rollback |
|---|---|---|
| loop_dir_unavailable | return `blocked`; no writes performed | n/a |
| template_unavailable | return `blocked`; no writes performed | n/a |
| auto_fix_verify_failed | return `non_converged`; include the failing file | restore each written file to its step 4 backup state: existing files to recorded content, newly created files deleted |
| non_converged | return `non_converged`; include the full action log and drift report | restore all auto-fixable files to their step 4 backup state |

On any failure, the result reports exactly what was attempted, what succeeded, and what must be done manually.

## Output

```
{
  "status": "converged" | "non_converged" | "blocked",
  "loop_dir": "<resolved absolute path>",
  "auto_fixed": [
    {
      "file": "STATE.md" | "gate.yaml" | "loop-budget.md" | "loop-run-log.md",
      "before_hash": "<hex or null>",
      "after_hash": "<hex>"
    }
  ],
  "drift_reported": [
    {
      "file": "<relative path>",
      "hash": "<hex>"
    }
  ],
  "failure": "<failure class or null>",
  "failing_files": ["<file name>"],
  "action_log": [
    {
      "file": "STATE.md" | "gate.yaml" | "loop-budget.md" | "loop-run-log.md",
      "before_hash": "<hex or null>",
      "after_hash": "<hex or null>"
    }
  ],
  "converged": true | false
}
```
