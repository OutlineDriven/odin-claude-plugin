---
name: keep-why-setup-wizard
description: 'Use when a project''s first activation or a missing personal config block triggers setup; the wizard writes valid config blocks into entry-point files and surfaces any update-check failure once. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why setup wizard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | First activation in a project (missing project config block) OR missing personal block (must run same turn, even mid-other-topic) OR per-session timer elapsed (update check, context staleness check) OR legacy block missing newer fields (silent documented-default backfill: capture-confirmation→confirm-when-unsure, source-reference→never, context-schema→0.2.0). |
| Authority | Reversible local write: write only named local entry-point files; rollback by restoring prior file content from version control or backup. |
| Side effect | Writes pointer and config blocks into entry-point files; asks wizard questions; surfaces update-check failure once and offers disable; personal missing confirmation-flow is asked (no silent default) because no prior behavior exists to preserve. |
| Done | Both blocks present and valid; timers evaluated opportunistically each activation (elapsed-time comparison, no OS cron); a present-but-invalid, duplicated-with-conflict, or ambiguous setting is never treated as missing — options named and asked; failed update check surfaced exactly once. |

## Inputs

- **Entry-point file path** (required): the project file where config blocks are written.
- **Project identity** (required for first activation): project name or identifier supplied by the user.
- **Personal preferences** (required when personal block is missing): user answers to wizard questions — no silent defaults because no prior behavior exists to preserve.

## Procedure

1. **Detect trigger condition.** Read the entry-point file. Determine which trigger fired:
   - Missing project config block → project wizard.
   - Missing personal block → personal wizard (must run same turn, even mid-other-topic).
   - Per-session timer elapsed → update check and context staleness check.
   - Legacy block missing newer fields → silent documented-default backfill.
   Done when: one trigger condition is identified from the four classes.

2. **Handle legacy field backfill.** If the existing block is present but missing newer fields, backfill silently with documented defaults:
   - `capture-confirmation` → `confirm-when-unsure`
   - `source-reference` → `never`
   - `context-schema` → `0.2.0`
   Do not prompt the user for fields that have documented defaults. Done when: all missing newer fields are backfilled with documented defaults and no user prompt is issued for them.

3. **Run project wizard** (first activation only). Ask the user for project-level configuration. Write the pointer and project config block into the entry-point file. Done when: the pointer and project config block are written into the entry-point file.

4. **Run personal wizard** (personal block missing). Ask the user about confirmation flow and personal preferences. No silent default is applied because no prior behavior exists to preserve. Write the personal config block into the entry-point file. Done when: the personal config block is written into the entry-point file with user-confirmed values.

5. **Validate existing blocks.** If a block is present but invalid, duplicated with conflict, or ambiguous, do not treat it as missing. Name the specific problem and ask the user to resolve:
   - Invalid: identify which fields fail validation and ask for correction.
   - Duplicated with conflict: show both versions and ask which to keep.
   - Ambiguous: name the ambiguity and ask for clarification.
   Done when: every present-but-invalid, duplicated, or ambiguous block is named and the user is asked to resolve it.

6. **Evaluate timers opportunistically.** On each activation, compare elapsed time against configured intervals for update check and context staleness. No OS cron or background process is used. Done when: elapsed time is compared against configured intervals for both timers.

7. **Run update check** (if timer elapsed). Perform a read-only network check for available updates.
   - On success: record the check timestamp.
   - On failure: surface the failure exactly once and offer the user the option to disable future update checks.
   Done when: the update check is performed and its result (timestamp or one-time failure with disable option) is recorded.

8. **Validate written blocks.** Confirm both project and personal blocks are structurally valid in the entry-point file. Done when: both blocks are confirmed structurally valid.

## Failure and recovery
- **Entry-point file missing or read-only.** Report the file path and the access error. Do not create the file automatically. Partial writes already completed are rolled back by restoring the prior file content.
- **User provides invalid or ambiguous input.** Name the specific problem and re-ask. Do not apply defaults to resolve ambiguity.
- **Network failure during update check.** Surface the failure message exactly once. Offer the option to disable future update checks. Do not retry in the same session.
- **Duplicated block with conflict.** Show both versions and ask the user to choose. Do not silently merge or pick one.
- **Non-converged state.** If the wizard cannot reach a valid configuration after user interaction, report the blocking issue and leave the entry-point file unchanged from its prior state.

## Output

Both project and personal config blocks present and valid in the entry-point file, timer timestamps recorded, any update-check failure surfaced once with a disable option, and a report of blocks written, fields backfilled (if any), and timer evaluation results.
