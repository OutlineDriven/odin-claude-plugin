---
name: save-md
description: 'Use when asked to save a named source as a .md file with frontmatter; preserves the source body verbatim without summarization. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Save source as Markdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says: save this, save this article, convert this, keep this source, get the markdown, transcript this, or extract this PDF |
| Authority | reversible-local: write only the named .md file; state the rollback path |
| Side effect | Writes one .md file to the working directory from a named source; no other artifact mutated |
| Done | A .md file exists with frontmatter and the named source body is preserved, not summarized |

## Inputs

- **Source** (required): the URL, file path, or content to save. Must be supplied by the user. The user names or points at the source; the skill does not guess which source the user means.
- **Filename** (optional): the desired .md filename. If omitted, infer from the source title or URL basename. If omitted and the source is ambiguous, stop and ask.
- **Title** (optional): override for the frontmatter `title` field. If omitted, infer from the source.
- **Extract body only** (optional): if true, strip navigation, ads, footers, and unrelated page structure; keep only the substantive content body. Defaults to false.

## Procedure

1. Confirm the source and desired filename with the user if either is ambiguous. Stop if the user does not provide or confirm them.
2. Fetch or read the source content. For a URL: retrieve via HTTP GET. For a file: read the file. For pasted content: use as-is.
3. Extract the raw body. If the source is a web page, extract the main content body, stripping navigation, ads, footers, scripts, and unrelated page structure. Preserve all substantive text, headings, lists, code blocks, tables, and images with their original src attributes. If the source is a file or pasted content, use it verbatim.
4. Generate YAML frontmatter containing at minimum:
   - `source`: the original URL, file path, or label the user provided
   - `title`: the inferred or user-supplied title
   - `saved_at`: the ISO 8601 datetime of extraction
   - `source_type`: one of `url`, `file`, or `text`
5. Write the .md file to the working directory: frontmatter first, then a blank line, then the extracted body. Do not add summaries, introductions, or commentary. Preserve whitespace and structure from the source.
6. Verify the file was written: confirm it exists, is non-empty, and the frontmatter and body are present. If verification fails, report the failure and stop without claiming done.

## Failure and recovery
**Source unreachable**: HTTP error, file not found, or permission denied. Stop. Do not create a file.

**Filename conflict**: the target .md file already exists. Stop. Do not overwrite. Report the conflict.

**Empty source**: the source resolves but has no extractable body content. Stop. Do not write a file.

**Write failure**: disk full, permission error, or I/O error. Stop. Report the error.

**Verification failure**: the file does not exist, is empty, or is missing frontmatter or body after write. Stop. Do not claim done.

**Rollback**: if the file was written but verification fails, do not delete the file; report the error and let the user decide. If the user explicitly cancels mid-procedure, do not write a file.

## Output
One `.md` file in the working directory. The file contains YAML frontmatter followed by a blank line, then the verbatim extracted source body. The body is not summarized, condensed, or rewritten.

## Provenance

Origin: `mblode/agent-skills` (MIT License). Adaptation from the source-to-markdown conversion workflow. Clean-room implementation of the source mechanism. The MIT license requires preservation of the copyright notice; any copied attribution text carries "Copyright (c) 2026 Matthew Blode".
