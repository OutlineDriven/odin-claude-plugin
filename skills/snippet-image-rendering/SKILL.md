---
name: snippet-image-rendering
description: 'Use when the user explicitly names snipgrapher and wants code rendered to a polished PNG, SVG, or WebP for documentation or sharing. Writes the image at an explicit local path. Not for other renderers, publishing, remote actions, or guessing unsupported flags.'
---

# Snippet image rendering

## Refuse first

- Do not substitute another renderer when snipgrapher is missing.
- Do not publish, upload, or touch credentials or remote systems.
- Do not guess CLI flags; use only options exposed by the installed version.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly mentions snipgrapher and wants code rendered as an image |
| Authority | reversible-local: write only named local image files and optional project config; rollback by deleting those files |
| Side effect | Writes image files to the specified output path; optionally writes a snipgrapher config file |
| Done | Rendered image exists at the explicit output path with non-zero byte size, produced via a named profile |

## Inputs

- **Source code**: The code snippet to render (required), supplied as a file path or inline code block.
- **Output path**: The explicit output path (required), with a .png, .svg, or .webp extension.
- **Profile**: An optional snipgrapher profile name. If omitted, snipgrapher uses its default.
- **Language**: An optional language hint for syntax highlighting. If omitted, snipgrapher infers it from the file extension or content.

## Procedure

1. **Verify snipgrapher is installed and accessible.**
   ```
   command -v snipgrapher
   ```
   If not found, stop and report: `snipgrapher is not installed or not in PATH. Install it before proceeding.`

   **Done when:** the executable resolves from PATH, or the workflow stops with the exact missing-dependency report.

2. **Verify a file source.** If a file path was supplied, run:
   ```
   test -f <source_path>
   ```
   If not found, stop and report the missing file. Inline code needs no file check.

   **Done when:** the source file exists or the inline snippet is present and non-empty.

3. **Construct the installed-version command.** Check available flags:
   ```
   snipgrapher --help
   ```
   Include `--profile <name>` only when the help output exposes `--profile` and a profile was supplied. Include `--language <lang>` only when help exposes `--language` and a language was supplied.

   **Done when:** every selected optional flag is both requested and supported by the installed CLI.

4. **Render.** Run:
   ```
   snipgrapher <source_path> --output <output_path>
   ```
   Append only the validated optional flags from step 3.

   **Done when:** snipgrapher exits successfully after targeting the explicit output path.

5. **Verify the artifact.** Run:
   ```
   test -s <output_path>
   ```
   If the file is missing or empty, stop and report snipgrapher's error output.

   **Done when:** the requested PNG, SVG, or WebP exists at the exact output path with non-zero size.

6. **Measure and report.** Run:
   ```
   wc -c <output_path>
   ```

   **Done when:** the final report names the exact output path and measured byte count.

## Failure and recovery

### Dependency and input failures
- **snipgrapher not installed:** Stop and report the missing dependency. Do not attempt alternative renderers.
- **Source file missing:** Stop and report the nonexistent path.

### Render and artifact failures
- **Render failure:** Stop and report snipgrapher's stderr. Do not retry with different flags unless the user instructs.
- **Output file empty or missing:** Stop and report that rendering produced no output, including snipgrapher's error messages.
- **Rollback:** Delete any partially written output file on failure.

## Output

**Output contract:** Return the rendered image at the explicit path, then one brief report containing that path and its measured byte size.

## Provenance

- Origin: mcollina/skills, skills/snipgrapher/SKILL.md
- Revision: 856efd268ae85482d882f3d0bed869fd020b5c06
- License: MIT (notice retained; mechanism adapted)
- Adaptation: Trigger narrowed to explicit snipgrapher mention; module remapped to odin-create-advanced; verification changed from ls -lh to test -s; profile handling made conditional on installed version support.
