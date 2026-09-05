---
name: snippet-image-rendering
description: 'Use when the user explicitly names snipgrapher and wants code rendered to a polished PNG, SVG, or WebP at an explicit local path. Not for other renderers, publishing, or remote actions.'
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
| Authority | Reversible local: writes only the named image file and, only when the user asks, a snipgrapher config file whose path and format are stated before writing; rollback is deleting only files this run created. No remote mutation. If the output path existed before the run, the pre-existing bytes are captured before overwrite and restored on failure. |
| Side effect | Writes one image file to the explicit output path; optionally writes a config file when the user requests it and its path and format are stated before writing |
| Done | The requested PNG, SVG, or WebP exists at the explicit path with non-zero size, produced through the profile actually used (default named when none supplied), with a one-line report of path and byte count |

## Inputs

- Source code (required): the code snippet to render, supplied as a file path or inline code block.
- Output path (required): explicit path with a .png, .svg, or .webp extension.
- Profile (optional): a snipgrapher profile name. If omitted, snipgrapher uses its default.
- Language (optional): a language hint for syntax highlighting. If omitted, snipgrapher infers from the file extension or content.

## Procedure

1. **Verify snipgrapher resolves from PATH.**
   ```
   command -v snipgrapher
   ```
   If not found, stop with: `snipgrapher is not installed or not in PATH. Install it before proceeding.`
   Done when: the executable resolves, or the workflow stops with the missing-dependency report.

2. **Normalize the source.** If a file path was supplied, verify it exists:
   ```
   test -f <source_path>
   ```
   If not found, stop with the missing-file report. If inline code was supplied, write it to a temp file with an extension derived from the language hint when the installed CLI consumes paths. If `snipgrapher --help` exposes a stdin pipe, pipe the inline snippet directly instead.
   Done when: a readable source is available as a path or stdin stream, or the workflow stops with source-missing.

3. **Construct the command from the installed version.** Check available flags:
   ```
   snipgrapher --help
   ```
   Include `--profile <name>` only when help exposes `--profile` and a profile was supplied. Include `--language <lang>` only when help exposes `--language` and a language was supplied. If a requested flag is not exposed by the installed version, stop with unsupported-flag and report which flag was requested and what the help output shows.
   Done when: every selected optional flag is both requested and supported by the installed CLI.

4. **Render to the explicit output path.** If the output path already exists, capture its bytes before overwriting:
   ```
   cp <output_path> <output_path>.pre-existing
   ```
   Run:
   ```
   snipgrapher <source> --output <output_path> [validated flags]
   ```
   Done when: snipgrapher exits successfully targeting the explicit output path.

5. **Verify the artifact and report.**
   ```
   test -s <output_path> && wc -c <output_path>
   ```
   If the file is missing or empty, stop with empty-or-missing-output and trigger rollback. On success, report the path, byte count, and the profile actually used (default named when none supplied). Remove the pre-existing backup if the render succeeded.
   Done when: the artifact exists with non-zero size and the one-line report is returned.

## Failure and recovery

| Failure class | Rule |
|---|---|
| `snipgrapher-missing` | Stop and report the missing dependency. Do not attempt alternative renderers. |
| `source-missing` | Stop and report the nonexistent source path. |
| `unsupported-flag` | Stop and report which flag was requested and what `snipgrapher --help` exposes. Do not retry with different flags unless the user instructs. |
| `render-failure` | Stop and report snipgrapher's stderr. Do not retry with different flags unless the user instructs. |
| `empty-or-missing-output` | Stop and report that rendering produced no output. Trigger rollback. |
| `rollback` | If a pre-existing backup exists, restore it to the output path. Delete only files this run created (the output file if it did not pre-exist, any temp file, the backup). Do not delete files the user created before this run. |

## Output

The rendered image at the explicit path, then one report line naming the path, byte count, and profile used.
