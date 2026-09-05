---
name: pr-review-canvas
description: 'Use when asked to render a PR review as a Cursor Canvas artifact or a standalone HTML page served on localhost (mode: html), with risky hunks foregrounded.'
---

# PR review canvas

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Render a PR review as a local canvas artifact (format: canvas, the default) or as a standalone self-contained HTML page served on localhost (format: html). |
| Authority | Reversible local: writes only the named canvas or HTML artifact; rollback is deleting that file. No remote mutation. |
| Side effect | Creates a local `.canvas` artifact file (overwrites any prior canvas for the same PR) or one self-contained HTML file under `/tmp`; mode html also serves it on a loopback port and reads PR data through `gh api`. |
| Done | The review artifact exists with risky hunks foregrounded above safe hunks: a `.canvas` file in the working directory, or a self-contained HTML page served on localhost. |

## Inputs

- `format`: `canvas` (default) or `html`.
- Mode `canvas`: PR diff (required) — the unified diff of the pull request, supplied as a file path or piped content; PR metadata (optional) — title, description, and linked issue text, which improve hunk risk classification.
- Mode `html`: a GitHub PR web URL or `owner/repo#<number>` (required) — the model extracts `{owner}`, `{repo}`, `{number}`; an installed, authenticated `gh` CLI.

## Procedure

1. **Select the format and parse the input.** Mode `canvas`: read the PR diff and parse it into individual hunks grouped by file. Mode `html`: extract `{owner}`, `{repo}`, `{number}` from the provided URL or `owner/repo#number` string, then fetch PR data with these `gh api` calls run concurrently:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number} --jq '{title, body, user: .user.login, state, additions, deletions, changed_files, base: .base.ref, head: .head.ref}'
   gh api repos/{owner}/{repo}/pulls/{number}/files --paginate --jq '.[] | {filename, status, additions, deletions, patch}'
   gh api repos/{owner}/{repo}/pulls/{number}/comments --jq '.[] | {user: .user.login, body, path, line}'
   ```
   Stop if extraction fails or any call fails or returns no data. Done when: the diff is parsed into file-grouped hunks, or owner/repo/number are extracted and all three API calls returned data.
2. **Classify each hunk as risky or safe.** A hunk is risky if it touches control flow, error handling, concurrency, public API boundaries, security-sensitive paths, or data integrity logic. A hunk is safe if it is documentation-only, import reordering, formatting, or trivial renaming with no behavioral change. Mode `html`: fold the fetched review comments into the analysis. Done when: every hunk is classified as risky or safe.
3. **Foreground risk.** Within each file, place risky hunks before safe hunks while preserving the file order from the diff. Done when: risky hunks precede safe hunks within each file with file order preserved.
4. **Build a review block per hunk** containing the file path, hunk line range, diff text, and a risk annotation that explains the classification. Done when: every hunk has a review block with path, range, diff text, and risk annotation.
5. **Assemble the artifact.**
   - Mode `canvas`: assemble the canvas document with a PR metadata summary, followed by risky hunk blocks and then safe hunk blocks, each block a distinct canvas section.
   - Mode `html`: generate one complete self-contained HTML5 document directly — no scratch files, no renderer or template files read from the skill directory. Write the `<body>` content as HTML in whatever structure fits the PR: a header with title, PR number, author, and stats; a summary box explaining the PR in plain English; core file sections with annotations and diffs; boilerplate files collapsed by default; a review checklist at the bottom; `<div data-diff="<target>">` placeholders where diffs render. Embed CSS for risk callouts, diffs, and collapsed boilerplate, and JavaScript that maps each `data-diff` key to its patch text. Build the patch map in memory from the step-1 fetch and embed it as JSON with `<`, `>`, and `&` escaped so patch text cannot terminate the script element.
   Done when: the canvas document is assembled with metadata, risky blocks, then safe blocks; or the HTML document is complete with embedded CSS, JS, and safe JSON patch data.
6. **Write and deliver.**
   - Mode `canvas`: write the canvas document to `<pr-identifier>.canvas` in the working directory, overwriting the file if it exists.
   - Mode `html`: write the document to `/tmp/pr-review-<number>.html`, then serve it with `python3 -m http.server 8432 --bind 127.0.0.1` under the harness background-process manager with `/tmp` as the working directory; if port 8432 is taken, try 8433, then 8434, and stop after 8434 fails. Report the ready URL to the user.
   Done when: the `.canvas` file is written, or the HTML file is served and the ready URL is reported.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Empty or unparseable diff | Stop. Report that no hunks were found. Do not write a canvas artifact. |
| Diff exceeds reasonable size (>500 hunks) | Stop. Report the hunk count and recommend splitting the PR. Do not write a partial canvas. |
| Write permission denied | Stop. Report the target path and the permission error. No rollback needed since no file was written. |
| Hunk classification ambiguous | Mark the hunk as risky (conservative default). Note the ambiguity in the risk annotation. Do not drop the hunk. |
| `gh` not available or not authenticated (mode `html`) | Stop; report that `gh` must be installed and authenticated. |
| PR not found or network error (mode `html`) | Stop; report the error verbatim. |
| Rate limit exceeded (mode `html`) | Stop; report rate limit hit. |
| HTML assembly fails (mode `html`) | Stop; do not write or serve a partial artifact. |
| Port exhausted (mode `html`) | Report the failure and the last port tried. |

The procedure never writes a partial artifact. If it stops before the write step, it does not create or overwrite an artifact file.

## Output
Mode `canvas`: a single `.canvas` file named after the PR identifier, with a header section (PR title, description, file count), risky hunk sections (path, range, diff, annotation), then safe hunk sections in the same format — local only, never published or pushed. Mode `html`: `/tmp/pr-review-<number>.html` (self-contained HTML with embedded CSS, JS, and safe JSON patch data) served at `http://127.0.0.1:8432/pr-review-<number>.html` (or the next available port), rendering the interactive risk-first review in the browser.
