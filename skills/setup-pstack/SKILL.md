---
name: setup-pstack
description: 'Use when asked to configure pstack role-to-model choices so every role maps to an available model. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup pstack

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Configure pstack role-to-model choices. |
| Authority | Write only to the named local pstack rule file; rollback path is removal or revert. |
| Side effect | Writes one user-level pstack model rule file. |
| Done | Every pstack role maps to an available model. |

## Inputs

- **Role–model mappings** (required): one or more `role: model` pairs to write. Each role name must be non-empty. Each model name must be non-empty.
- **Rule file path** (required): absolute path to the user-level pstack rule file.
- **Existing rule file content** (optional): current file contents if it already exists, used to detect drift.

## Procedure

1. **Validate inputs.** Stop if any role name is empty, any model name is empty, or the rule file path is not an absolute path.
2. **Read existing file** if it exists. Record its content for the rollback record.
3. **Parse existing rules** to produce a map of role → model. Stop on malformed line (non-empty line that does not contain `:`).
4. **Merge**: for each supplied role–model pair, set or overwrite the entry in the map.
5. **Serialize**: write the map as `role: model` lines, sorted by role.
6. **Confirm done**: re-read the written file and verify every supplied role maps to its model.
7. **Return** the final file path, a rollback record (original content or empty-string marker), and a human-readable summary.

## Failure and recovery
- **Invalid input**: stop with `invalid-input`; no file is written.
- **Malformed existing file**: stop with `invalid-existing-file`; do not overwrite.
- **Write failure**: stop with `write-failure`; do not report done.
- **Done-check failure**: stop with `non-converged`; do not report done.
- **Rollback**: on any failure after step 4, restore the original file content if it existed. If the file did not exist, remove it. If rollback itself fails, halt. The partial state is now the artifact.

## Output
```
setup-pstack

Rule file: <absolute path>
Roles configured:
  <role>: <model>
  …

Rollback record: <original content or '(no prior file)'>
```

## Provenance

Adaptation of `pstack/skills/setup-pstack/SKILL.md` from cursor/plugins at revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. Authored by Lauren Tan (poteto) under MIT license (LICENSE blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`). Clean-room adaptation: original skill mechanics translated into odin-agent authoring contract shape without copying expression.
