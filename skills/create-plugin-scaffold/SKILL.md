---
name: create-plugin-scaffold
description: 'Use when asked to create an agent plugin or marketplace package. Produces a valid plugin scaffold tree and a validation report. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Create plugin scaffold

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to create an agent plugin or marketplace package. |
| Authority | Reversible local writes: create files and directories under a new plugin tree and an optional marketplace entry. No remote, VCS, credential, paid, published, or deployed mutation. |
| Side effect | Creates a plugin tree on the local filesystem and an optional marketplace entry file. Scope is bounded to the named plugin directory before any file is written. |
| Done | A valid plugin scaffold tree exists and a validation report confirms manifest fields, entry points, and directory layout. |

## Inputs

- Plugin name (required): the directory name and manifest identifier for the new plugin.
- Target root directory (required): the filesystem path under which the plugin tree is created.
- Entry point file name (optional): defaults to `index.ts`; supplied when a non-default entry is needed.
- Marketplace entry (optional): when supplied, a marketplace manifest entry is generated alongside the plugin tree.
- Plugin manifest fields (optional): author, version, description, and capability list. Apply defaults to omitted fields.

## Procedure

1. Confirm the required inputs are present. If the plugin name or target root is missing, stop and report the missing input. Done when: plugin name and target root are confirmed present, or the missing input is reported.
2. Resolve the target root to an absolute path and verify it exists and is writable. Do not create or modify directories outside the resolved plugin path. Done when: the target root is resolved to an absolute path and confirmed writable.
3. Compute the plugin directory as `<target root>/<plugin name>`. If it already exists and is non-empty, stop and report the collision rather than overwriting. Done when: the plugin directory path is computed and confirmed not to collide with an existing non-empty directory.
4. Create the plugin directory tree: the plugin root, an `agents/` subdirectory, and a `skills/` subdirectory. Done when: the plugin root, `agents/`, and `skills/` directories exist.
5. Write the plugin manifest at the plugin root with the supplied values or defaults: name, version (default `0.1.0`), description, author, entry point, and capability list. Done when: the manifest is written with all fields populated from supplied values or defaults.
6. Write the entry point file at the plugin root using the supplied or default name, containing the plugin registration stub that exports the declared capabilities. Done when: the entry point file exists and exports the declared capabilities.
7. If a marketplace entry was requested, write the marketplace manifest entry file referencing the plugin name and path. If not requested, skip this step. Done when: the marketplace entry file exists when requested, or the step is skipped when not requested.
8. Run validation over the created tree: confirm the manifest parses, every declared entry point file exists, every declared capability has a corresponding file, and no required directory is missing. Done when: every validation check passes or every failure is identified.
9. Produce a validation report that lists each check, its pass or fail result, and the absolute path of every created artifact. Done when: the validation report lists every check result and every created artifact path.

## Failure and recovery
- Missing required input: stop before any write; report which input is missing. No files are created.
- Target root missing or not writable: stop before any write; report the path and the access error. No files are created.
- Plugin directory already exists and is non-empty: stop before any write; report the collision. No files are overwritten.
- Manifest write or parse failure: delete any files already written under the plugin path for this run, then report the failure. The plugin tree is left absent rather than partial.
- Validation failure: report every failing check with the offending path or field. Do not claim the done predicate holds. Leave the created tree in place only if every validation check passed; otherwise remove the partial tree and report the failure.
- Blocked or non-converged result: return the partial validation report and the exact blocker; never swallow the error or pretend success.

## Output
A plugin scaffold tree under `<target root>/<plugin name>` containing the manifest, entry point, `agents/`, and `skills/` directories, an optional marketplace entry file, and a validation report listing each check result and the absolute path of every created artifact.

## Provenance

Origin: cursor/plugins repository, path `create-plugin/skills/create-plugin-scaffold/SKILL.md` and `create-plugin/agents/plugin-architect.md`. Pinned revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest as recorded in the pinned source audit. Adaptation: clean-room rewrite preserving the agent-plugin scaffolding mechanism and local reversible tree creation; no third-party expression copied.
