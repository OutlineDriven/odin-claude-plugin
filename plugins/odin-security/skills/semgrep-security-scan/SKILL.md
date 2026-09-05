---
name: semgrep-security-scan
description: 'Use when a user asks for a Semgrep security scan or fast pattern-based scan of a codebase. Not for authoring or porting rules: use semgrep-rule-authoring.'
---

# Semgrep security scan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a Semgrep security audit or fast pattern-based scan of a codebase, including broad or important-only coverage. |
| Authority | Reversible local: writes only named local artifacts (scan outputs, temporary rule clones, merged SARIF, structured report); rollback is deleting those artifacts. No remote mutation. |
| Side effect | Creates local scan outputs, may clone approved rule sources, runs Semgrep, merges SARIF, and reports every temporary clone path. Preserves clones for human disposition; deletion is a human action. |
| Done | The approved plan and actual scan accounting agree; merged SARIF parses; findings are reported from the merged result; failed, skipped, unscoped, and zero-file scan units and every temporary clone path are disclosed; temporary clones are preserved. |

## Not for

- Authoring or porting Semgrep rules. Use semgrep-rule-authoring.

## Inputs

| Input | Required | Description |
|---|---|---|
| `target` | Yes | Root directory or file path to scan. Must be non-empty and accessible. |
| `ruleset` | No | Semgrep ruleset name, tag, or registry path (e.g. `p/security-audit`, `auto`, `owasp-top-ten`). Defaults to `p/security-audit`. |
| `coverage` | No | `broad` (full ruleset) or `important` (security-high/sev+rules only). Defaults to `broad`. |
| `exclude` | No | Semgrep `--exclude` glob patterns, comma-separated. |

## Procedure

1. **Validate inputs and plan scan units.** Confirm `target` is a non-empty accessible path. If `coverage` is `important`, set the ruleset filter to include only rules tagged `security-high` or severity `ERROR` or `WARNING`; otherwise use `ruleset` as provided. Enumerate the set of scan units: one unit per ruleset applied to the target scope. Record the expected unit count. This count is the accounting baseline. Done when: inputs are validated and the expected unit count is recorded.

2. **Clone rule sources.** If `ruleset` references a remote registry path, clone it to a temporary local path under `/tmp/semgrep-rules-<uuid>/`. Record every cloned path in `CLONE_PATHS`. Do not delete these directories; leave them intact for human disposition. Done when: all remote rulesets are cloned or clone failures are recorded.

3. **Run Semgrep per unit.** Invoke `semgrep --sarif --no-gitignore --max-target-bytes 0 --config <ruleset> <target>` with any `--exclude` patterns provided. The ruleset reaches the command through the `--config` argument, not as a positional. Capture stdout as `stdout_raw`, capture stderr, and record the exit code per unit. If the command fails, record the unit as `failed` with the exit code and stderr excerpt. Done when: every scan unit is executed and its output is captured.

4. **Classify, parse, and merge.** For each scan unit, record its status: `success` (produced valid SARIF), `zero-findings` (valid SARIF with no results), `malformed` (output not valid SARIF), `skipped` (Semgrep skipped the unit), `unscoped` (not scanned), or `failed` (non-zero exit). For every valid unit, parse the SARIF and extract `runs[].results`. Merge all results arrays into one SARIF document with a single run. Build the severity-sorted findings list from the merged results: severity, rule ID, message, file path, start line, end line. Sort by severity (ERROR before WARNING) then by file path. If no valid units produced parseable SARIF, set the merged SARIF to null. Done when: the merged SARIF is written or set to null, and the findings list is built.

5. **Reconcile and report.** Compare actual unit statuses against the expected unit count. Flag any unit that is unaccounted for as `unscoped`. Confirm the plan unit count matches the actual unit count; if not, disclose the discrepancy. Emit a structured report containing: total findings count, findings list, per-unit status summary, the full `CLONE_PATHS` list, and the path to the merged SARIF if produced. Preserve all clone paths; do not delete them. Done when: the report is emitted and clone preservation is confirmed.

## Failure and recovery

| Failure class | Condition | Response |
|---|---|---|
| `tool-not-found` | `semgrep` is not in PATH | Stop before any mutation. Report the missing tool. |
| `invalid-input` | `target` is empty, missing, or unreadable | Stop before any mutation. Report the invalid target with the specific reason. |
| `scan-failed` | Semgrep exits non-zero on a unit | Report unit as failed; continue with remaining units. Merge results from successful units; disclose failed units. |
| `malformed-output` | A unit's stdout is not valid SARIF | Exclude that unit from merge; continue. Record unit as malformed; merge only valid units; disclose in report. |
| `all-units-failed` | Zero units produced valid parseable SARIF | Report failure; merged SARIF is null. Do not claim success; report every unit status. |
| `clone-failed` | Rule source clone fails | Continue without that ruleset; flag as unscoped. Record clone path as failed; proceed with local ruleset only; disclose in report. |

Rollback rule: if step 2 clones a path and step 3 fails, the clone is preserved (not rolled back) because deletion is a human action. No other artifact is mutated.

Non-converged result when: merged SARIF is null (no valid output) or the plan unit count does not match the actual unit count and the discrepancy cannot be resolved by re-scanning.

## Output

A structured JSON report with `semgrep_version`, `target`, `ruleset`, `coverage`, `plan_units`, `actual_units`, `unit_statuses`, `findings_count`, `findings` (severity, rule_id, message, file, start_line, end_line), `clone_paths`, `merged_sarif_path`, and `exit_codes`. Findings derive only from real Semgrep output in the format Semgrep was actually invoked to produce.
