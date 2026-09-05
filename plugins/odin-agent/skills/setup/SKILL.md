---
name: setup
description: 'Use when the user asks to set up the agent environment. Covers credentials, placeholders, tool access checks, a uv venv, a pack install, or a role-model mapping file. Not for unattended runs.'
disable-model-invocation: true
---

# Setup

One concern: configure the agent environment. Four mechanisms reach it: credentials and placeholders, a uv-managed virtual environment, a pack install from an archive, and a role-to-model mapping file. Every mechanism requires explicit human confirmation; run one mechanism per invocation, and when the user names none, list the four and ask which to run.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to set up or configure the agent environment from a fresh or existing clone: credentials, placeholders, the virtual environment, a third-party pack install from an archive, or a role-to-model mapping file. |
| Authority | Human-gated: asks before each credential write, `.venv` creation, placeholder replacement in skill scripts, pack install, and role-model file write; every other write is reversible local, with version control as the rollback. |
| Side effect | Creates or updates .env and token.json, creates a uv-managed `.venv`, replaces placeholders in skill scripts, installs a pack into a target directory behind hash verification, and writes one role-to-model mapping file. |
| Done | The selected mechanism reaches its done state: a ready/not-ready checklist with one example prompt per configured integration, a present or created `.venv`, an installed pack with a saved applied manifest, or a written and re-read role-model file. |

## Not for

- Automated or unattended runs; every mutation requires human approval.

## Inputs

- Mechanism: which of the four to run. When absent, list the mechanisms and ask.
- Credentials (optional): desired integration names (e.g. `GITHUB_TOKEN`, `OPENAI_API_KEY`). If absent, the credentials mechanism lists all recognized integrations and asks which to configure.
- Virtual environment (optional): `.venv` path, defaulting to the project root.
- Pack install (required for that mechanism): source archive URL, target directory, expected file manifest mapping paths to expected SHA-256 hashes, and required transformations keyed by strict unique anchors.
- Role-model mapping (required for that mechanism): `role: model` pairs, an absolute rule file path, the caller-supplied available-models set, and optional prior file content for drift detection.

## Mechanism selection

| User asks | Mechanism |
|---|---|
| set up credentials, configure an integration, replace placeholders, token, gather tool credentials into .env, verify repository or tool access | credentials and placeholders |
| create or check the virtual environment, uv venv | virtual environment |
| install a pack or template repository from an archive | pack install |
| write role-to-model choices or a model mapping file | role-model mapping |

## Credentials and placeholders

1. **Confirm scope.** If the user named no integration, list every known integration placeholder found in skill scripts and .env templates. Ask the user to select which to configure. **Done when:** the user selects integrations or declines.

2. **Identify targets.** For each selected integration, locate the corresponding placeholder in skill scripts (search for `{{VARIABLE_NAME}}` patterns or comments naming the integration) and identify which credential file it reads (`.env` or `token.json`). Do not write in this step. **Done when:** every selected integration has a placeholder located and its credential file identified.

3. **Detect current state.** Check whether a real value already exists in `.env` or `token.json` for each selected integration. Never overwrite an existing non-empty value: report the key name and that it was skipped, never the value. **Done when:** the current state of every selected integration is recorded.

4. **Make each credential file safe before creating or appending.** Check `.env` and every `token.json` that a selected integration uses. A path is safe when it is not tracked and it is ignored; do not use `git status` for either check, because an ignored path is omitted from that output. In a git work tree: stop when `git ls-files --error-unmatch -- <path>` succeeds (the file is tracked); when `git check-ignore -q -- <path>` fails, obtain confirmation and add the path to `.gitignore`, creating it when missing; create an empty file only when the path is safe. In a fresh directory with no git work tree: create a `.gitignore` excluding `.env` and `token.json`, then create each empty file when missing. **Done when:** every credential file is safe, or the unsafe state is reported and the mechanism stops.

5. **Ask for each missing value, with format validation.** Prompt the user to supply the credential; accept it only via direct user input in the conversation. Validate basic format: a non-empty string plus the named tool's convention (for example, a Slack bot token starts with `xoxb-`; a Postgres URL contains `://`). Discard a failing value and prompt again. **Done when:** every missing value is supplied and validated, or the user declines.

6. **Write credentials.** Append each validated credential as one `KEY=VALUE` line to `.env`, or write it to `token.json` as the integration requires. Write nothing else to the file. **Done when:** every validated value is written, or skipped with the reason.

7. **Verify repository, tool access, and prerequisites.** When a repository is supplied or detected: confirm the remote is reachable (`git ls-remote` or an authenticated HEAD request) and the token grants at least read access; report pass or fail without exposing token values. Run the named tool's prerequisite checks; stop on the first failure and name the tool and the failing check. Confirm `.env` parses (`dotenv` or equivalent) and report its keys. **Done when:** access and every prerequisite pass, or the first failure is reported.

8. **Replace placeholders.** Scan skill scripts for the matching placeholder and replace it with a reference that reads the value from `.env` or `token.json` at runtime (e.g. an environment-variable lookup or a token-file read), never the literal credential value. Write each modified skill script back to disk. **Done when:** every placeholder is replaced with a runtime reference or reported as not found.

9. **Report checklist.** Emit a checklist with two sections: **Configured** (integrations that now have a real value in place, with prerequisite results) and **Still needs attention** (integrations that were not selected, were skipped, or whose placeholder could not be resolved). **Done when:** the checklist is emitted.

10. **Report example prompts.** For each configured integration, provide one minimal example prompt that exercises the integration, and name the workflows now ready. **Done when:** one example prompt per configured integration is reported.

## Virtual environment

1. **Detect state.** Check whether a uv-managed `.venv` exists at the configured path. **Done when:** the current state is recorded.

2. **Create or report.** Create the `.venv` with `uv venv <configured_venv_path>` when absent. Report the existing one when present; do not recreate or upgrade it without explicit user confirmation. **Done when:** the `.venv` exists and its state is reported.

## Pack install

1. **Fetch and extract.** Download the source archive to a scratch location and extract it, rejecting any entry whose resolved path leaves the scratch directory or contains `..` path components (zip-slip), and rejecting symlink and hardlink entries outright: links are never followed and no link entry is restored. **Done when:** the archive is downloaded and extracted to the scratch location with no traversal or link entries.

2. **Verify every file.** For every file in the extracted tree, compute its SHA-256 hash and compare it against the expected manifest. Fail on any mismatch. **Done when:** every extracted file's hash matches the expected manifest.

3. **Apply transformations.** For each transformation, locate the unique anchor string in the named file, replace it with the specified value, and confirm the anchor was found exactly once. Fail if an anchor is absent or appears more than once. **Done when:** every transformation is applied and every anchor was found exactly once.

4. **Check the target for conflicts.** If the target directory exists and contains files, compare each existing file's hash against the managed-state manifest from a prior install. Block when existing files differ from managed state, which indicates manual modification. **Done when:** the target directory is confirmed empty or matches prior managed state.

5. **Back up prior managed files.** If the target directory exists and contains files that matched the prior managed-state manifest in step 4, copy those files to a `rollback/` subdirectory in the scratch location, separate from the extracted files. The applied manifest alone cannot rebuild prior contents. **Done when:** the prior managed files are copied to the `rollback/` directory, or no prior files are present.

6. **Move atomically and record rollback.** Move only the extracted files from the scratch location to the target directory in one operation, leaving the `rollback/` directory behind. Write the applied manifest (file paths, post-transformation hashes, and the original source archive identifier, needed for rollback verification) beside the target for rollback on future runs. **Done when:** all extracted files are moved to the target and the applied manifest is saved.

## Role-model mapping

1. **Validate inputs.** Stop if any role name is empty, any model name is empty, or the rule file path is not an absolute path. Verify every supplied model is in the available-models set; stop with `unavailable-model` when one is not. **Done when:** every role and model is non-empty, every model is in the available-models set, and the path is absolute.

2. **Read the existing file** if present. Record its content for the rollback record. When prior file content was supplied, compare it against the actual file content and report any drift (supplied content that no longer matches the file) before proceeding. **Done when:** the original content is recorded or confirmed absent, and any drift is reported.

3. **Parse existing rules** into a map of role to model. **Done when:** the map is built or a malformed line is reported.

4. **Merge.** For each supplied pair, set or overwrite the entry in the map. **Done when:** every supplied pair is in the map.

5. **Serialize.** Write the map as `role: model` lines, sorted by role. **Done when:** the file is written with all roles sorted.

6. **Confirm done.** Re-read the written file and verify every supplied role maps to its model and every model is in the available-models set. **Done when:** every supplied role resolves to a model in the available-models set in the file.

7. **Return** the final file path, a rollback record (original content or `(no prior file)`), and a summary. **Done when:** the summary is emitted.

## Failure and recovery

### Credentials and placeholders

| Failure class | Result |
|---|---|
| User cancels during selection | Nothing is written. Return the checklist in its current state (empty). |
| Credential file is unreadable | Skip that file; mark it in the checklist under "still needs attention". Report the path and error. |
| Placeholder not found in any skill script | Skip replacement; mark the integration in the checklist. Report the integration and the fact that no placeholder was found. |
| Write fails (permission or disk) | Do not continue writing remaining files. Report the failing path and the reason. |
| No integrations selected | Return an empty checklist and stop. |
| Unsafe credential file path (`.env` or `token.json` tracked, or ignore coverage declined) | Stop the credentials mechanism. Do not create or append the file. |
| Repository or tool access fails | Name the failing token or URL and stop the verification step. Credentials already written remain. |

Rollback: if a write fails mid-way, already-written credential files are retained as-is; do not attempt to erase or revert partial writes.

### Virtual environment

- Creation fails (missing uv, permission, or disk): report the command and the error; mark the checklist under "still needs attention". Nothing else is written.

### Pack install

- Hash mismatch: a file's computed hash does not match the expected manifest. Stop before moving any file to the target. Report the mismatched file, expected hash, and actual hash. The scratch directory is cleaned up.
- Anchor absent or repeated: a required anchor string is missing from the target file or appears more than once. Stop before moving any file to the target. Report the anchor and the file. The scratch directory is cleaned up.
- Destination conflict: the target directory contains files whose hashes differ from the prior managed-state manifest, indicating manual modifications. Stop before overwriting. Report the conflicting files and their expected versus actual hashes. Do not overwrite user modifications.
- Rollback: if any step fails after files have been moved to the target, restore the pre-install state: use the saved applied manifest to identify and remove the installed files, and restore any prior managed-state files from the `rollback/` directory the install left in the scratch location.

### Role-model mapping

- Invalid input: stop with `invalid-input`; no file is written.
- Unavailable model: stop with `unavailable-model`; no file is written.
- Malformed existing file: stop with `invalid-existing-file`; do not overwrite.
- Write failure: stop with `write-failure`; do not report done.
- Done-check failure: stop with `non-converged`; do not report done.
- Rollback: on any failure after the merge step, restore the original file content when it existed; remove the file when it did not. If rollback itself fails, halt; the partial state is now the artifact.

## Output

- Credentials and placeholders: written or updated `.env`, `token.json`, and modified skill scripts, plus a ready/not-ready checklist and one example prompt per configured integration.
- Virtual environment: the `.venv` state (created or already present).
- Pack install: the pack installed in the target directory with all files passing hash verification and transformations applied, plus a saved applied manifest enabling rollback on future runs.
- Role-model mapping: the rule file path, configured role-model pairs, and a rollback record (original content or `(no prior file)`).
