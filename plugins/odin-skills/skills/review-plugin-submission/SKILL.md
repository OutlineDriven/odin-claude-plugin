---
name: review-plugin-submission
description: 'Use when asked to review a plugin for marketplace readiness through a read-only audit of every published quality gate. Returns a sectioned pass/fail report with a submission recommendation. Not for reviewing a PR or code diff — use review.'
---

# Review plugin submission

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Final marketplace-readiness review of an agent plugin. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; no file writes, no credential use, no remote calls beyond reads needed for the audit. |
| Done | Sectioned pass/fail report and submission recommendation returned in chat. |

## Inputs

- plugin_root (required): Absolute path to the plugin directory to audit.
- gate_rules_path (optional): Absolute path to a gate rules file that defines the named gates, each gate's pass condition, and the exact failure message for its fail path. When it is omitted, the audit runs the built-in default gates defined in step 1.

## Procedure

1. Read the gate rules file at `gate_rules_path`. When it is omitted, audit with the built-in default gates instead: manifest-present (step 2), manifest-complete (step 3), and file-valid (step 4a); these defaults define no allowlist entries. Parse every named gate (check, rule, or criterion block). Record each gate's pass condition and the exact failure message for its fail path. Also parse the rules file's allowlist section when present: each entry is a path prefix, and a file is allowlisted when its path relative to `plugin_root` starts with that prefix.
2. Reject with a failure report if `plugin_root/plugin.json` does not exist.
3. Reject with a failure report if `plugin_root/plugin.json` lacks `name`, `version`, and `description` fields.
4. Read every file under `plugin_root` that is reachable by traversing directories and following symlinks that resolve inside `plugin_root`, excluding binary blobs, node_modules, and hidden paths. Skip any symlink whose resolved target is outside `plugin_root`. For each file:
   a. Verify the file is syntactically valid for its declared format.
   b. Apply each applicable gate to the file's contents.
5. Evaluate each named gate across all examined files. A gate fails if any file violates its condition; a gate passes only when every file that is in-scope for that gate satisfies it.
6. Assemble a report with:
   - Summary: one line naming every failing gate and the overall recommendation (APPROVE, APPROVE WITH WARNINGS, or REJECT).
   - Gate results: for each named gate, the status (PASS / FAIL) and a one-line evidence summary.
   - Warnings: for each file that violates a gate condition but whose path matches an allowlist entry parsed in step 1, the file path and the matched allowlist entry; an allowlisted violation is a warning and does not fail the gate.
   - Recommendation: APPROVE (all gates pass), APPROVE WITH WARNINGS (all gates pass and allowlist triggered), or REJECT (one or more gates fail).

## Failure and recovery
- Missing manifest (`plugin_root/plugin.json` absent): report the absence as REJECT; stop.
- Incomplete manifest (missing required fields): report the missing fields as REJECT; stop.
- Parse error (unreadable or syntactically invalid file): report the file path and parse error; do not halt; continue evaluating remaining files.
- Gate violation (any file fails an applicable gate): mark that gate FAIL; do not halt; continue evaluating remaining gates.
- Partial-result rule: always produce a report. A report with any FAIL gate is a valid terminal output; do not fabricate a passing result.
- Non-mutation rule: no file write, no VCS change, no credential use, no remote call beyond reads needed for the audit.

## Output
A chat message containing the complete sectioned report. No file is written. The report is the sole artifact.
