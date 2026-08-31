---
name: semgrep-security-scan
description: 'Use when a user asks for a Semgrep security audit or fast pattern-based scan of a codebase. Runs Semgrep, merges SARIF, and reports every finding with severity, file, and line. Not for authoring rules — use semgrep-rule-authoring.'
---

# Semgrep security scan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a Semgrep security audit or fast pattern-based scan of a codebase, including broad or important-only coverage. |
| Authority | Reversible local: writes only named local artifacts (scan outputs, temporary rule clones, merged SARIF). Rollback is deletion of those artifacts. |
| Side effect | Creates local scan outputs, may clone approved rule sources, runs Semgrep, post-filters and merges SARIF, and reports every temporary clone path; preserves those clones and stops before deletion, which a human performs. |
| Done | The approved plan and actual scan accounting agree; merged SARIF parses; findings are reported from the merged result; failed, skipped, unscoped, and zero-file scan units and every temporary clone path are disclosed; temporary clones are preserved for human disposition. |

## Not for

- Authoring or porting Semgrep rules — use semgrep-rule-authoring or semgrep-rule-variant-creator.

## Inputs

| Input | Required | Description |
|---|---|---|
| `target` | Yes | Root directory or file path to scan. Must be non-empty and accessible. |
| `ruleset` | No | Semgrep ruleset name, tag, or registry path (e.g. `p/security-audit`, `auto`, `owasp-top-ten`). Defaults to `p/security-audit`. |
| `coverage` | No | `broad` (full ruleset) or `important` (security-high/sev+rules only). Defaults to `broad`. |
| `exclude` | No | Semgrep `--exclude` glob patterns, comma-separated. Optional. |

## Procedure

1. **Validate inputs.** Confirm `target` is a non-empty accessible path. If `coverage` is `important`, set `ruleset` filter to include only rules tagged with `security-high` or severity `ERROR` or `WARNING`; otherwise use `ruleset` as provided. **Done when:** inputs are validated or `invalid-input` is reported.

2. **Plan scan.** Enumerate the set of scan units: one unit per ruleset being applied to each target scope. Record the expected unit count. This count is the accounting baseline. **Done when:** the expected unit count is recorded.

3. **Clone rule sources (if applicable).** If `ruleset` references a remote registry path, clone it to a temporary local path under `/tmp/semgrep-rules-<uuid>/`. Record every cloned path in `CLONE_PATHS`. Do not delete these directories; leave them intact for human disposition. **Done when:** all remote rulesets are cloned or clone failures are recorded.

4. **Run Semgrep.** Invoke `semgrep --json --no-gitignore --max-target-bytes 0 <ruleset> <target>` with any `--exclude` patterns provided. Capture stdout as `stdout_raw`. Capture stderr. Record exit code. If the command fails, record the unit as `failed` with the exit code and stderr excerpt. **Done when:** every scan unit is executed and its output is captured.

5. **Collect unit results.** For each scan unit, record whether it produced output (`success`), produced no findings (`zero-findings`), produced malformed output (`malformed`), was skipped by Semgrep (`skipped`), or was not scoped (`unscoped`). Maintain a per-unit status map. **Done when:** every unit has a status in the map.

6. **Merge SARIF.** Parse every `stdout_raw` as JSON. If any unit produced malformed output, record the unit as `malformed` and proceed with valid units. For each valid unit, extract the SARIF `runs[].results` array and merge into a single `results` array, preserving all `properties`, `message`, `level`, `locations`, and `rulesMetadata` fields. Write the merged SARIF to `MERGED_SARIF`. If no valid units produced parseable JSON, set `MERGED_SARIF` to null. **Done when:** `MERGED_SARIF` is written or set to null.

7. **Build findings report.** If `MERGED_SARIF` is not null, parse it and extract one finding per result: severity, rule ID, message, file path, start line, and end line. Sort by severity (ERROR before WARNING) then by file path. If `MERGED_SARIF` is null, report zero findings. **Done when:** the findings list is built and sorted.

8. **Accounting reconciliation.** Compare actual unit statuses against the expected unit count. Flag any unit that is unaccounted for as `unscoped`. Confirm the approved plan unit count matches actual unit count; if not, disclose the discrepancy. **Done when:** the plan and actual counts are reconciled or the discrepancy is disclosed.

9. **Report.** Emit a structured report containing: total findings count, findings list, per-unit status summary (failed/skipped/unscoped/zero-findings/malformed), the full `CLONE_PATHS` list, and the path to `MERGED_SARIF` if it was produced. The report is the skill output. **Done when:** the report is emitted.

10. **Preserve clones.** Do not delete any path listed in `CLONE_PATHS`. The skill ends here; deletion is a human action. **Done when:** clone preservation is confirmed.

## Failure and recovery

| Failure class | Condition | Partial-result rule | Recovery |
|---|---|---|---|
| `tool-not-found` | `semgrep` is not in PATH | Stop before any mutation | Report the missing tool; do not proceed. |
| `invalid-input` | `target` is empty, missing, or unreadable | Stop before any mutation | Report the invalid target with the specific reason. |
| `scan-failed` | Semgrep exits non-zero on a unit | Report unit as failed; continue with remaining units | Merge results from successful units; disclose failed units in report. |
| `malformed-output` | A unit's stdout is not valid JSON/SARIF | Exclude that unit from merge; continue | Record unit as malformed; merge only valid units; disclose in report. |
| `all-units-failed` | Zero units produced valid parseable output | Report failure; `MERGED_SARIF` is null | Do not claim success; report every unit status; skill is not done. |
| `clone-failed` | Rule source clone fails | Continue without that ruleset; flag as unscoped | Record clone path as failed; proceed with local ruleset only; disclose in report. |

Rollback rule: if step 3 clones a path and step 4 fails, the clone is preserved (not rolled back) because deletion is a human action. No other artifact is mutated.

Non-converged result when: merged SARIF is null (no valid output) OR the plan unit count does not match the actual unit count AND the discrepancy cannot be resolved by re-scanning.

## Output

A structured JSON report with semgrep_version, target, ruleset, coverage, plan_units, actual_units, unit_statuses, findings_count, findings (severity, rule_id, message, file, start_line, end_line), clone_paths, merged_sarif_path, and exit_codes.

## Provenance

Origin: Trail of Bits Semgrep skill — https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/static-analysis/skills/semgrep/SKILL.md
Pinned revision: `d1f1575cff97816e5cc08af66cd2506099c681d3`
License: CC-BY-SA-4.0
Adaptation: Adapted from the Trail of Bits Semgrep skill for ODIN 2.0. The original rulesets and Semgrep engine are used as-is from their respective upstream sources. Trail of Bits attribution and source links are preserved. Modifications are marked as ODIN-specific automation and configuration. Adaptations are ShareAlike under CC-BY-SA-4.0. No trademark rights are claimed. The `trail-of-bits-mark.svg` is not used as branding.
