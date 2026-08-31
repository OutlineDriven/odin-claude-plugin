---
name: readout
description: 'Use when a user wants a readable, shareable document of findings. Produces a self-contained HTML readout under ~/.readouts, embedding cited source text and refreshing the local index. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Readout

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a readable, shareable document of findings. |
| Authority | Reversible-local: write only named local artifacts under `~/.readouts`; rollback restores the prior index and removes the new readout. |
| Side effect | Writes self-contained HTML under `~/.readouts`. No remote mutation, VCS change, credential use, or external asset write. |
| Done | Document answers the brief, uses the inline HTML shell, embeds source, and the index is refreshed. |

## Inputs

Required:
- **brief**: a non-empty string or non-empty ordered list of findings. A string is rendered as paragraphs split on blank lines; a list is rendered as one section per item in input order.
- **output_name**: a filename stem without an extension or path separator.

Optional:
- **title**: the displayed document title; defaults to `output_name` with `-` and `_` replaced by spaces.
- **sources**: an ordered list of readable source-file paths to embed. Preserve the supplied order; reject duplicate normalized paths.
- **template_override**: a complete HTML document supplied by the user. It must contain exactly one `{{TITLE}}`, `{{TIMESTAMP}}`, `{{BRIEF}}`, and `{{SOURCES}}` marker. If absent, use the inline shell in Procedure step 3.

## Procedure

1. **Validate before writing.** Require a non-empty `brief`. Require `output_name` to match `^[A-Za-z0-9][A-Za-z0-9._-]*$`, reject `.` and `..`, and reject an existing `~/.readouts/<output_name>.html`. Normalize every source path without following it outside its containing filesystem root; require a regular readable file. Stop before any write on failure.

2. **Prepare rollback state.** Ensure `~/.readouts/` exists. If `~/.readouts/index.html` exists, read and retain its exact bytes until the run succeeds. The only new primary path is `~/.readouts/<output_name>.html`.

3. **Select the document shell.** If `template_override` is absent, use this exact shell:

   ```html
   <!doctype html>
   <html lang="en">
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>{{TITLE}}</title>
     <style>
       :root{color-scheme:light dark;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.55}body{max-width:72rem;margin:0 auto;padding:2rem}header{border-bottom:1px solid #8888;margin-bottom:2rem}main>section{margin-block:1.5rem}pre{overflow:auto;padding:1rem;border:1px solid #8888;border-radius:.5rem}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}details{margin-block:1rem}time{font-variant-numeric:tabular-nums;color:#666}a{color:inherit}
     </style>
   </head>
   <body>
     <header><h1>{{TITLE}}</h1><p>Generated <time datetime="{{TIMESTAMP}}">{{TIMESTAMP}}</time></p></header>
     <main><section id="findings"><h2>Findings</h2>{{BRIEF}}</section><section id="sources"><h2>Sources</h2>{{SOURCES}}</section></main>
   </body>
   </html>
   ```

4. **Render and escape content.** Escape all inserted text in this order: `&` to `&amp;`, `<` to `&lt;`, `>` to `&gt;`, `"` to `&quot;`, and `'` to `&#39;`. Never interpret brief or source text as HTML. Render each non-empty brief paragraph as `<p>…</p>`; render list item `n` as `<section><h3>Finding n</h3><p>…</p></section>`. For each source, read exact UTF-8 text and emit `<details><summary>escaped-path</summary><pre><code>escaped-content</code></pre></details>`. An empty source list emits `<p>No source files supplied.</p>`. Invalid UTF-8 is `source-read-failed`; do not replace or discard bytes silently.

5. **Assemble deterministically.** Escape the resolved title, obtain the current UTC timestamp in `YYYY-MM-DDTHH:MM:SSZ` form, and replace each shell marker exactly once. Reject a shell with missing, duplicate, or remaining `{{…}}` markers. The result must contain no external stylesheet, script, image, font, or network reference; a user override that contains one is `non-self-contained-template`.

6. **Write the readout exclusively.** Create `~/.readouts/<output_name>.html` only if absent, write the complete UTF-8 document, and close it successfully. A partial file is deleted on any write or close failure.

7. **Refresh the index without a helper.** Enumerate regular `*.html` files directly under `~/.readouts/`, excluding `index.html` and temporary files. Sort basenames by ascending Unicode code-point order. Build an exact self-contained index with `<!doctype html>`, UTF-8 and viewport metadata, `<title>Readouts</title>`, `<h1>Readouts</h1>`, and one `<li><a href="URL_ENCODED_BASENAME">ESCAPED_STEM</a></li>` per file. Percent-encode every UTF-8 byte outside RFC 3986 unreserved characters in the `href`, and HTML-escape the displayed stem by step 4. Write the complete candidate to a temporary file in `~/.readouts/`, then atomically replace `index.html` only after the temporary write closes successfully.

8. **Verify done.** Re-read the new readout and index. Require the readout to be non-empty, contain the escaped title, brief rendering, UTC timestamp, and every supplied source path and exact escaped source text. Require the index to contain exactly one link to every current readout and no link to `index.html`. On any mismatch, restore the prior index bytes (or remove the new index if none existed), delete the new readout, and report `done-predicate-failed`.

## Failure and recovery

| Failure class | Condition | Recovery |
|---|---|---|
| `empty-brief` | `brief` is empty | Stop before writing. |
| `invalid-output-name` | stem fails the stated grammar | Stop before writing. |
| `output-exists` | target readout already exists | Stop; never overwrite it. |
| `directory-creation-failed` | `~/.readouts/` cannot be created | Stop with the filesystem error. |
| `source-read-failed` | source is missing, unreadable, non-regular, duplicate after normalization, or invalid UTF-8 | Stop before writing. |
| `invalid-template` | override markers are missing, duplicated, or remain after assembly | Stop before writing. |
| `non-self-contained-template` | override refers to an external stylesheet, script, image, font, or network resource | Stop before writing. |
| `write-failed` | readout write or close fails | Delete the partial target. |
| `index-refresh-failed` | index enumeration, temporary write, or atomic replacement fails | Restore the prior index if replacement occurred; delete the new readout and temporary file. |
| `done-predicate-failed` | final content or index checks fail | Restore the prior index and delete the new readout. |

No index failure is a successful partial result because the frozen done predicate requires the index to be refreshed.

## Output

- `~/.readouts/<output_name>.html`: one self-contained HTML document containing the brief, UTC timestamp, and escaped source text.
- `~/.readouts/index.html`: a self-contained, deterministically sorted index containing the new readout.

## Provenance

Origin: `warpdotdev/common-skills`, revision `f589e224907eda566c13755529f59db563090d14`. License: MIT, Copyright (c) 2026 Denver Technologies, Inc.; preserve the copyright and permission notices in copies or substantial portions. Adaptation: clean-room ODIN 2.0 restatement of the HTML-template, source-embedding, and index-refresh mechanisms. No source support assets or vendored third-party bundle are carried or required.
