---
name: snyk-agent-scan-compliance
description: 'Use when snyk-agent-scan reports W001, W011, or W012 on a skill, or authoring anticipates those alerts. Restructures only alerted skill files, preserves their information, and verifies each fix by re-scan. Not for suppressing alerts, storing tokens, or unrelated cleanup.'
---

# Snyk agent scan compliance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | snyk-agent-scan reports W001, W011, or W012 on a skill, or skill authoring anticipates those alerts. |
| Authority | Reversible-local: writes only the alerted skill files inside the scanned skill directory. Rollback is discarding the working-tree change or restoring the file from version control before the next scan. |
| Side effect | Edits the alerted skill files and runs the snyk-agent-scan scanner; no other file, remote system, or dependency changes. |
| Done | Clean scan with information preserved; pre-authoring checklist prevents recurrence. |

## Inputs

- Required: the scan output listing each alert as a code (W001, W011, W012) with its file, or the skill directory to scan to produce one.
- Required: the alerted skill files, read in full before any edit.
- Optional: `SNYK_TOKEN`. The scanner requires it at runtime; it is supplied by the operator environment, never requested or stored by this workflow.
- Optional: the alerted skill's frontmatter conventions, needed when relocating install commands into its frontmatter.

## Refuse first

- Do not delete information, suppress alerts, or assume a reported false positive can be ignored.
- Do not edit files absent from the alert list or perform unrelated cleanup.
- Do not request, print, or store `SNYK_TOKEN`; use only the operator-provided environment value.

## Procedure

1. **Bound scope before mutation.** Parse the scan output into `(alert code, file)` pairs. Only files named in that list are edited. If no scan output exists, produce one first with the scanner command in step 4; never fix from memory.
   **Done when:** every queued item has one W001, W011, or W012 code and one exact file, with no unalerted file in edit scope.
2. **Order the queue.** Fix one alert at a time in this order: W001, W011, then W012. Starting with the simplest alert minimizes rework when one fix surfaces another.
   **Done when:** exactly one current alert is selected under the fixed W001-to-W011-to-W012 ordering.
3. **Apply the restructuring rule for the alert code.** Every rule preserves the original information by relocating or rephrasing it; deleting content to silence an alert is prohibited:
   - W001 (prompt injection via named MCP tool functions): replace each explicitly named tool function in body prose with a generic formulation naming the capability instead; tool names remain acceptable in the frontmatter `allowed-tools` field; only the body is restricted.
   - W011 (imperative external-content instructions): rewrite sentences that send the agent to fetch, check, or evaluate external content into passive availability statements that keep the URL and its purpose; remove `always` from instructions involving external resources; move tool invocations from prose checklists into code blocks; running a tool is fine, but its remote-sourced output must not be the sole trigger for acting.
   - W012 (external content fetched and executed at runtime): replace `@latest` with an exact pinned version, move install commands out of body prose into the alerted skill's frontmatter metadata install block, pin GitHub Actions to a major version verified to exist in the action's releases, and never pipe remote content into a shell.
   **Done when:** the selected alert's exact rule is applied without deleting information or changing unrelated content.
4. **Re-run the scanner after each fix.** Run `SNYK_TOKEN=<token> snyk-agent-scan --skills <skill-directory>`. If the binary is absent, run `uvx snyk-agent-scan` without installing it. Compare alert counts. If the count did not drop, undo that edit and choose a different restructuring; never stack unverified changes.
   **Done when:** the scan proves the total alert count dropped, or the candidate edit is fully restored before another approach.
5. **Queue surfaced alerts.** Expect W011 fixes to surface hidden W012 alerts as URLs become prominent after restructuring; the re-scan in step 4 catches them. Treat each surfaced alert as a new item in the ordered queue.
   **Done when:** every newly surfaced alert is represented once in the queue and no alert is silently discarded.
6. **Restructure likely false positives.** Treat a URL in a reference-data table cell, official documentation link, frontmatter homepage link, or `always` outside an external-resource sentence the same as a confirmed alert: use the passive-availability pattern. Do not override, suppress, or assume scanner error.
   **Done when:** each reported likely false positive is either cleared by information-preserving restructuring or remains an explicit blocker.
7. **Prevent recurrence.** When the scan is clean, apply the pre-authoring checklist to the edited content: no sentence with the agent acting on a URL, no `@latest` in body install instructions, no MCP tool names in body prose, install commands in frontmatter, GitHub Actions versions real, tool invocations in code blocks, and no `always` before external-resource instructions.
   **Done when:** the final scan is clean and every checklist condition passes across all edited content.

## Failure and recovery

### Scanner availability
- **Scanner cannot run:** recover a missing binary with the `uvx` drop-in. A missing `SNYK_TOKEN` is a blocked run; report the exact error and stop. No edit made in an unverified run may be claimed as fixed.

### Verification regression
- **Alert count does not drop:** restore the pre-edit bytes and select a different restructuring; the failing edit must not survive.
- **Alert count rises or oscillates:** revert to the last state with the lowest verified count and stop the loop there.

### Information-preservation limit
- **Alert cannot clear without deletion:** stop editing, keep all verified fixes, and return the blocking file, alert code, and constraint. Do not claim the done predicate.
- **Partial results:** keep each re-scan-verified fix and report the remainder.

## Output

**Output contract:** Return one per-file remediation report ordered by alert queue, listing code, restructuring, before-and-after counts, then final clean status or exact blockers, and finish with the pre-authoring checklist result.

## Provenance

Adapted from `samber/cc-skills`, path `skills/snyk-agent-scan-compliance/SKILL.md`, revision `f9953962e135235137628ea92d06ea085688031f`, MIT license. Adaptation restructures the source into the ODIN 2.0 skill contract: the three reference pattern catalogs are folded into the procedure as inline rules; the remediation loop (one fix, re-scan, verify the count dropped), the false-positive restructuring rule, and the pre-authoring checklist are preserved from the source mechanism; source frontmatter metadata, tool allowlists, and contribution links are not carried over.
