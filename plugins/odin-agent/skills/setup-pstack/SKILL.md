---
name: setup-pstack
description: 'Use when asked to configure pstack role-to-model choices so every role maps to an available model. Writes one user-level pstack model rule file. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup pstack

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Configure pstack role-to-model choices. |
| Authority | Write only to the named local pstack rule file; rollback path is removal or revert. |
| Side effect | Writes one user-level pstack model rule file. |
| Done | Every pstack role maps to a model in the available-models set. |

## Inputs

- Role–model mappings (required): one or more `role: model` pairs to write. Each role name must be non-empty. Each model name must be non-empty.
- Rule file path (required): absolute path to the user-level pstack rule file.
- Available models (required): the set of model names the user's pstack installation can resolve, supplied by the user (for example, the output of the user's model-listing command). Used to validate that every supplied model is resolvable before writing.
- Existing rule file content (optional): current file contents if it already exists, used to detect drift.

## Procedure

1. **Validate inputs.** Stop if any role name is empty, any model name is empty, or the rule file path is not an absolute path. Verify each supplied model is in the available-models set; stop with `unavailable-model` if any model is not in the set. **Done when:** every role and model is non-empty, every model is in the available-models set, and the path is absolute.
2. **Read existing file** if it exists. Record its content for the rollback record. When existing rule file content was supplied, compare it against the actual file content and report any drift (supplied content that no longer matches the file) before proceeding. **Done when:** the original content is recorded or confirmed absent, and any drift is reported.
3. **Parse existing rules** to produce a map of role → model. **Done when:** the map is built or a malformed line is reported.
4. **Merge**: for each supplied role–model pair, set or overwrite the entry in the map. **Done when:** every supplied pair is in the map.
5. **Serialize**: write the map as `role: model` lines, sorted by role. **Done when:** the file is written with all roles sorted.
6. **Confirm done**: re-read the written file and verify every supplied role maps to its model and that every model is in the available-models set. **Done when:** every supplied role resolves to a model in the available-models set in the file.
7. **Return** the final file path, a rollback record (original content or `(no prior file)`), and a human-readable summary. **Done when:** the summary is emitted.

## Failure and recovery

- Invalid input: stop with `invalid-input`; no file is written.
- Unavailable model: stop with `unavailable-model`; no file is written.
- Malformed existing file: stop with `invalid-existing-file`; do not overwrite.
- Write failure: stop with `write-failure`; do not report done.
- Done-check failure: stop with `non-converged`; do not report done.
- Rollback: on any failure after step 4, restore the original file content if it existed. If the file did not exist, remove it. If rollback itself fails, halt. The partial state is now the artifact.

## Output

Rule file path, configured role–model pairs, and a rollback record (original content or `(no prior file)`).
