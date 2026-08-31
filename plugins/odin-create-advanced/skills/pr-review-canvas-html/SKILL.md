---
name: pr-review-canvas-html
description: 'Use when asked to render a GitHub PR as a standalone review HTML page. Fetches PR data via gh API, renders diffs with move detection, and serves the artifact on a local port. Not for Cursor Canvas output — use pr-review-canvas.'
---

# PR review canvas HTML

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Render a GitHub PR as standalone review HTML. |
| Authority | Reversible-local: writes confined to /tmp. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes one self-contained HTML file to /tmp and serves it on a fixed localhost port. |
| Done | A self-contained HTML artifact at /tmp/pr-review-<number>.html, served on localhost. |

## Inputs

- PR URL or identifier (required): a GitHub PR web URL or `owner/repo#<number>`. The model extracts `{owner}`, `{repo}`, `{number}`.
- PR data (fetched): `gh api repos/{owner}/{repo}/pulls/{number}`, file list, diff, and comments fetched during step 2.

## Procedure

1. Parse the PR identifier. Extract `{owner}`, `{repo}`, `{number}` from the provided URL or `owner/repo#number` string. Stop if extraction fails. Done when: owner, repo, and number are extracted.

2. Fetch PR data in parallel. Run these `gh api` calls concurrently:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number} --jq '{title, body, user: .user.login, state, additions, deletions, changed_files, base: .base.ref, head: .head.ref}'
   gh api repos/{owner}/{repo}/pulls/{number}/files --paginate --jq '.[] | {filename, status, additions, deletions, patch}'
   gh api repos/{owner}/{repo}/pulls/{number}/comments --jq '.[] | {user: .user.login, body, path, line}'
   ```
   Stop if any call fails or returns no data. Done when: all three API calls return data.

3. Analyze the PR and write body HTML. Read the diffs, understand the PR, and write the `<body>` content directly as HTML. Use any structure that fits the PR: a header with title, PR number, author, and stats; a summary box explaining the PR in plain English; core file sections with annotations and diffs; boilerplate files collapsed by default; a review checklist at the bottom. Include `<div data-diff="<target>">` placeholders where diffs should render. Add collapsible boilerplate sections, inline code references, and callout boxes for warnings. Done when: the body HTML is written with data-diff placeholders for every diff target.

4. Assemble from inline resources. Do not read renderer, style, or template files from the skill directory. Generate the complete document in the assembly script: an HTML5 shell, embedded CSS for risk callouts, diffs, and collapsed boilerplate, plus embedded JavaScript that maps each `data-diff` key to its patch text. Done when: the assembly script produces a complete HTML5 document with embedded CSS and JS.

5. Assemble the final HTML. Write the body fragment from step 3 to `/tmp/pr-review-<number>-body.html`. Save patches to `/tmp/pr-patches-<number>.json` using `jq`:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/files --paginate \
     --jq '[.[] | {key: (.filename | gsub("[^a-zA-Z0-9]"; "_")), value: (.patch // "")}] | from_entries' \
     > /tmp/pr-patches-<number>.json
   ```
   Run this self-contained Python assembly script after replacing `<number>` with the parsed PR number:
   ```python
   import json
   from pathlib import Path

   patches = json.loads(Path("/tmp/pr-patches-<number>.json").read_text())
   body = Path("/tmp/pr-review-<number>-body.html").read_text()
   safe_json = (
       json.dumps(patches)
       .replace("&", "\u0026")
       .replace("<", "\u003c")
       .replace(">", "\u003e")
   )
   css = """
   :root { color-scheme: light dark; font: 16px/1.5 sans-serif; }
   body { max-width: 1120px; margin: 0 auto; padding: 2rem; }
   pre { overflow: auto; padding: 1rem; border: 1px solid currentColor; }
   .risk { border-left: .35rem solid currentColor; padding-left: 1rem; }
   details { margin-block: 1rem; }
   """
   js = """
   const patches = JSON.parse(document.getElementById("pr-patches").textContent);
   for (const target of document.querySelectorAll("[data-diff]")) {
     const pre = document.createElement("pre");
     pre.textContent = patches[target.dataset.diff] ?? "Patch unavailable";
     target.replaceChildren(pre);
   }
   """
   document = (
       "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">"
       f"<title>PR review <number></title><style>{css}</style><body>{body}"
       f"<script id=\"pr-patches\" type=\"application/json\">{safe_json}</script>"
       f"<script>{js}</script></body></html>"
   )
   Path("/tmp/pr-review-<number>.html").write_text(document)
   ```
   Escaping `<`, `>`, and `&` prevents patch text from terminating the JSON script element. Done when: `/tmp/pr-review-<number>.html` is written with safe JSON patch data.

6. Serve locally on a fixed port. Start `python3 -m http.server 8432 --bind 127.0.0.1` with the harness background-process manager and `/tmp` as the working directory. If port 8432 is taken, try 8433, then 8434. Stop after 8434 fails and report the attempted ports. Report the ready URL to the user. Done when: the server is running and the ready URL is reported.

## Failure and recovery

| Failure class | Result |
|---|---|
| `gh` not available or not authenticated | Stop; report that `gh` must be installed and authenticated. |
| PR not found or network error | Stop; report the error verbatim. |
| Rate limit exceeded | Stop; report rate limit hit. |
| HTML assembly fails | Stop; do not write or serve a partial artifact. |
| Port exhausted | Report the failure and the last port tried. |

Partial-result rule: if the artifact cannot be fully assembled, do not write or serve it.

## Output

File `/tmp/pr-review-<number>.html` (self-contained HTML with embedded CSS, JS, and safe JSON patch data) served at `http://127.0.0.1:8432/pr-review-<number>.html` (or next available port). The interactive risk-first review canvas renders in the browser.
