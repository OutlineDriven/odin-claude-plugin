---
name: llms-visibility
description: 'Use when asked to make a public site discoverable and readable by LLM agents using llms.txt, Markdown content negotiation, and alternate link headers. Emits standards-grounded artifacts, validates them by fetching each route, and reports per-route verification. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# LLMs visibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a public site readable and discoverable by LLMs, or mentions llms.txt, Markdown Accept negotiation, or alternate link headers. |
| Authority | Reversible local writes to named generated artifacts only: llms.txt, optional llms-full.txt, route negotiation code, HTML link tags. Preview before overwriting existing files. No credentials, remote mutation, or VCS changes. |
| Side effect | Writes llms.txt, optional llms-full.txt, adds text/markdown content negotiation on eligible routes, adds Link headers and HTML link tags where HTML exists. |
| Done | Every eligible route serves text/markdown with correct Content-Type and Vary on Accept: text/markdown; llms.txt parses under the documented Markdown-structured format; Link headers and HTML link tags are present where applicable; validation report lists every route and its headers. |

## Inputs

- Project root (required): the local codebase to modify.
- Public route paths or URL patterns (required): the routes that should be LLM-discoverable.
- Framework identification (required): Next.js, Astro, Nuxt, plain static, Express, Hono, FastAPI, or other. The framework must support content negotiation or middleware injection.
- llms-full.txt flag (optional): emit a deep variant including non-public paths with comment prefixes.
- no-html flag (optional): emit only machine-readable files without HTML integration.

## Procedure

1. Audit framework, public URL root, and discoverable routes. Identify the framework and confirm it can express content negotiation (middleware, route handlers, or static file serving with header control). Identify the public URL root. List every route path or pattern that should be LLM-discoverable. Stop blocked if the framework cannot express content negotiation. Done when: the framework, public URL root, and discoverable route list are identified, or the skill stops on an unsupported framework.

2. Emit llms.txt in the established Markdown-structured format: H1 site name, blockquote summary, H2 sections of Markdown link lists (one link per line, each linking to the page with an optional title). Do not use the one-URL-per-line plain-text format; the documented format is Markdown-structured. If llms-full.txt is requested, emit it as a deeper variant with the same Markdown structure plus non-public paths marked with a comment prefix. Preview before overwriting an existing file. Done when: llms.txt is written in the Markdown-structured format, and llms-full.txt is written if requested.

3. Add text/markdown content negotiation on eligible routes. For each route that has Markdown source, add handling for Accept: text/markdown that returns the Markdown source with Content-Type: text/markdown. Set Vary: Accept only on responses where the representation actually varies by the Accept header. If the route always returns the same content type regardless of Accept, do not add Vary. Done when: every eligible route serves text/markdown on Accept: text/markdown with correct Content-Type, and Vary: Accept is set only where the representation varies.

4. Add Link rel="alternate" type="text/markdown" headers on responses that serve Markdown, and HTML link rel="alternate" type="text/markdown" tags in the head of HTML pages where HTML exists and the no-html flag is not set. Use absolute URLs. Done when: every Markdown-serving route carries the Link header and every HTML page carries the alternate link tag, unless no-html is set.

5. Validate by fetching each route with Accept: text/markdown. Confirm Content-Type: text/markdown on the response. Confirm Vary: Accept is present only where the representation varies and absent where it does not. Parse llms.txt against the documented Markdown-structured format: H1 present, blockquote summary present, H2 sections with Markdown link lists. Record each route, its Content-Type, its Vary header, and the parse result. Done when: every route validates with correct headers and content types, and llms.txt parses under the documented format.

## Failure and recovery

- Unsupported framework: the framework cannot express content negotiation or header injection. Stop, report the framework name and the specific gap. Do not add untested fallbacks.
- Negotiation conflict: the framework overrides Content-Type after the handler sets it. Report the conflict, remove that route from the index, and continue validating the remainder.
- Validation failure: a route does not return text/markdown or returns the wrong Content-Type. Report the route and the observed headers. Fix locally if possible; otherwise mark the route as non-converged and continue.
- llms.txt parse failure: the file does not match the Markdown-structured format. Rewrite to fix before declaring done.
- Full rollback: on any unrecoverable failure, remove every file and code change this skill made. Leave the project in its prior state.

## Output

A validation report listing every route, its Content-Type, its Vary header, and the llms.txt parse result. The terminal classification is done when every route validates and llms.txt parses, blocked when the framework is unsupported, or non-converged when validation failures are not locally fixable. On non-converged or blocked, full rollback of every file and code change the skill made.
