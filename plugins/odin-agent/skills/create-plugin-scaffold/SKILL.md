---
name: create-plugin-scaffold
description: 'Use when asked to create a local agent-plugin directory tree. Generates a valid scaffold with a host-specific manifest, entry point exporting the registration API, and standard directory layout, then validates the result. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Create plugin scaffold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to create an agent plugin or marketplace package |
| Authority | Reversible local writes: create files and directories under a new plugin tree. No remote, VCS, credential, paid, published, or deployed mutation |
| Side effect | Creates a plugin tree on the local filesystem. Scope is bounded to the named plugin directory before any file is written |
| Done | A valid plugin scaffold tree exists and a validation report confirms manifest fields, entry points, and directory layout |

## Inputs

- Plugin name (required): the directory name and manifest identifier for the new plugin.
- Target root directory (required): the filesystem path under which the plugin tree is created.
- Target ecosystem (optional): the host agent platform the scaffold targets. Determines the manifest filename, schema, and registration API. Defaults to Claude Code (`plugin.json` with `.claude-plugin/` schema).
- Entry point file name (optional): defaults to `index.ts`; supplied when a non-default entry is needed.
- Plugin manifest fields (optional): author, version, description, and capability list. Apply defaults to omitted fields.

## Procedure

1. Resolve the target path and verify write access. Confirm the plugin name and target root are present. Resolve the target root to an absolute path and verify it exists and is writable. Compute the plugin directory as `<target root>/<plugin name>`. If it already exists and is non-empty, stop and report the collision rather than overwriting. Done when: the plugin directory path is computed and confirmed not to collide with an existing non-empty directory.
2. Create the standard directory tree. Create the plugin root, an `agents/` subdirectory, and a `skills/` subdirectory. Done when: the plugin root, `agents/`, and `skills/` directories exist.
3. Write a host-specific plugin manifest matching the target ecosystem. For Claude Code: write `plugin.json` at the plugin root with fields `name`, `version` (default `0.1.0`), `description`, `author`, `entry`, and `capabilities`, conforming to the `.claude-plugin/plugin.json` schema. For other ecosystems: write the manifest filename and schema that ecosystem requires. Done when: the manifest is written with all fields populated from supplied values or defaults, conforming to the target ecosystem's schema.
4. Write a valid entry point exporting the registration API. Write the entry point file at the plugin root using the supplied or default name. The entry point must export the registration function that the host ecosystem calls to load the plugin and its declared capabilities. For Claude Code: export a default function or named `register` function that returns the plugin's capabilities. Done when: the entry point file exists and exports the registration API.
5. Validate the layout against the manifest. Confirm the manifest parses as valid JSON, every declared entry point file exists, the `agents/` and `skills/` directories are present, and no required manifest field is missing. Done when: every validation check passes or every failure is identified.

## Failure and recovery

- Missing required input: stop before any write; report which input is missing. No files are created.
- Target root missing or not writable: stop before any write; report the path and the access error. No files are created.
- Plugin directory already exists and is non-empty: stop before any write; report the collision. No files are overwritten.
- Manifest write or parse failure: delete any files already written under the plugin path for this run, then report the failure. The plugin tree is left absent rather than partial.
- Validation failure: report every failing check with the offending path or field. Do not claim the done predicate holds. Leave the created tree in place only if every validation check passed; otherwise remove the partial tree and report the failure.
- Blocked or non-converged result: return the partial validation report and the exact blocker; never swallow the error or pretend success.

## Output

A plugin scaffold tree under `<target root>/<plugin name>` containing the manifest, entry point, `agents/`, and `skills/` directories, and a validation report listing each check result and the absolute path of every created artifact.
