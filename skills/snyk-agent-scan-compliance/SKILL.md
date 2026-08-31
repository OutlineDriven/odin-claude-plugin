---
name: snyk-agent-scan-compliance
description: 'Use when snyk-agent-scan reports W001, W011, or W012 on a skill or when skill authoring anticipates those alerts. Restructures the alerted skill files and re-scans until the scan is clean with every piece of information preserved. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

## Procedure

1. Bound scope before mutation: parse the scan output into (alert code, file) pairs. Only files named in that list are edited. If no scan output exists, produce one first with the scanner command in step 4; never fix from memory.
2. Fix one alert at a time, ordered W001, then W011, then W012, simplest first, which minimizes rework when one fix surfaces another.
3. Apply the restructuring rule for the alert code. Every rule preserves the original information by relocating or rephrasing it; deleting content to silence an alert is prohibited:
   - W001 (prompt injection via named MCP tool functions): replace each explicitly named tool function in body prose with a generic formulation naming the capability instead; tool names remain acceptable in the frontmatter `allowed-tools` field; only the body is restricted.
   - W011 (imperative external-content instructions): rewrite sentences that send the agent to fetch, check, or evaluate external content into passive availability statements that keep the URL and its purpose; remove "always" from instructions involving external resources; move tool invocations from prose checklists into code blocks; running a tool is fine, but its remote-sourced output must not be the sole trigger for acting.
   - W012 (external content fetched and executed at runtime): replace `@latest` with an exact pinned version, move install commands out of body prose into the alerted skill's frontmatter metadata install block, pin GitHub Actions to a major version verified to exist in the action's releases, and never pipe remote content into a shell.
4. Re-run the scanner after each individual fix: `SNYK_TOKEN=<token> snyk-agent-scan --skills <skill-directory>`. If the binary is absent, `uvx snyk-agent-scan` is a drop-in without installing. Compare alert counts: if the count did not drop, undo that edit and choose a different restructuring; never stack unverified changes.
5. Expect W011 fixes to surface hidden W012 alerts as URLs become prominent after restructuring; the re-scan in step 4 catches them; treat each surfaced alert as a new item in the queue.
6. Treat a likely false positive (URL in a reference-data table cell, official documentation link, frontmatter homepage link, "always" outside any external-resource sentence) the same as a confirmed alert: restructure with the passive-availability pattern. Do not override, suppress, or assume scanner error.
7. When the scan is clean, apply the pre-authoring checklist to the edited content so recurrence is prevented at authoring time: no sentence with the agent acting on a URL, no `@latest` in body install instructions, no MCP tool names in body prose, install commands in frontmatter, GitHub Actions versions real, tool invocations in code blocks, no "always" before external-resource instructions.

## Failure and recovery
- Scanner cannot run (missing binary or `SNYK_TOKEN`): recover a missing binary with the `uvx` drop-in; a missing token is a blocked run. Report the exact error and stop. No edit made in an unverified run may be claimed as fixed.
- A fix does not reduce the alert count: restore the pre-edit bytes and select a different restructuring; the failing edit must not survive.
- Alert count rises or oscillates across fixes: revert to the last state with the lowest verified count and stop the loop there.
- An alert cannot be cleared by restructuring without deleting information: stop editing, keep all verified fixes, and return the blocking file, alert code, and constraint. The done predicate is not claimed.
- Partial results: every alert whose fix was verified by a re-scan stays in place; the report carries the remainder.

## Output
A remediation report listing, per file: each alert (code, file), the restructuring applied, the scanner alert count before and after that fix, and the final result: a clean scan, or the exact remaining alerts with the blocking constraint. The report states whether the pre-authoring checklist passed for all edited content.

## Provenance

Adapted from `samber/cc-skills`, path `skills/snyk-agent-scan-compliance/SKILL.md`, revision `f9953962e135235137628ea92d06ea085688031f`, MIT license. Adaptation restructures the source into the ODIN 2.0 skill contract: the three reference pattern catalogs are folded into the procedure as inline rules; the remediation loop (one fix, re-scan, verify the count dropped), the false-positive restructuring rule, and the pre-authoring checklist are preserved from the source mechanism; source frontmatter metadata, tool allowlists, and contribution links are not carried over.
