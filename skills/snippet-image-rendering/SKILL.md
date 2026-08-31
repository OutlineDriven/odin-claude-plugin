---
name: snippet-image-rendering
description: 'Use when asked to turn code into polished shareable images (PNG/SVG/WebP) for docs, changelogs, or social posts when the user explicitly mentions snipgrapher. Produces a rendered image file at the specified output path. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Snippet image rendering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly mentions snipgrapher and wants code rendered as an image |
| Authority | reversible-local: write only named local image files and optional project config; rollback by deleting those files |
| Side effect | Writes image files to the specified output path; optionally writes a snipgrapher config file |
| Done | Rendered image exists at the explicit output path with non-zero byte size, produced via a named profile |

## Inputs

- **Source code**: The code snippet to render (required). Supplied as a file path or inline code block.
- **Output path**: Where to write the image (required). Must be an explicit path with .png, .svg, or .webp extension.
- **Profile**: Optional snipgrapher profile name. If not supplied, snipgrapher uses its default.
- **Language**: Optional language hint for syntax highlighting. If not supplied, snipgrapher infers from file extension or content.

## Procedure

1. Verify snipgrapher is installed and accessible:
   ```
   command -v snipgrapher
   ```
   If not found, stop and report: "snipgrapher is not installed or not in PATH. Install it before proceeding."

2. Verify the source code input exists (if a file path was supplied):
   ```
   test -f <source_path>
   ```
   If not found, stop and report the missing file.

3. Construct the snipgrapher command. Use only flags the installed version supports. Check available flags:
   ```
   snipgrapher --help
   ```
   If the help output shows a `--profile` flag and a profile was supplied, include `--profile <name>`. If the help output shows a `--language` flag and a language was supplied, include `--language <lang>`.

4. Run the render command:
   ```
   snipgrapher <source_path> --output <output_path>
   ```
   Append any validated optional flags from step 3.

5. Verify the output file exists and has non-zero size:
   ```
   test -s <output_path>
   ```
   If the file does not exist or is empty, stop and report the snipgrapher error output.

6. Report the output path and file size in bytes:
   ```
   wc -c <output_path>
   ```

## Failure and recovery
- **snipgrapher not installed**: Stop. Report the missing dependency. Do not attempt alternative renderers.
- **Source file missing**: Stop. Report the path that does not exist.
- **Render failure**: Stop. Report snipgrapher's stderr output. Do not retry with different flags unless the user instructs.
- **Output file empty or missing**: Stop. Report that the render produced no output. Check snipgrapher's error messages.
- **Rollback**: Delete any partially written output file on failure.

## Output
- The rendered image file at the specified output path.
- A brief report stating the output path and byte size.

## Provenance

- Origin: mcollina/skills, skills/snipgrapher/SKILL.md
- Revision: 856efd268ae85482d882f3d0bed869fd020b5c06
- License: MIT (notice retained; mechanism adapted)
- Adaptation: Trigger narrowed to explicit snipgrapher mention; module remapped to odin-create-advanced; verification changed from ls -lh to test -s; profile handling made conditional on installed version support.
