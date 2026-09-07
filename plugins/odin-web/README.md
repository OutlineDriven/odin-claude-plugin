# ODIN Web

ODIN workflows for browser testing, web performance, SEO, and extensions.

13 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-web@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-web@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-web/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-web:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| browser-cookie-store | Use when the user runs /browser-cookie-store to populate the session cookie store from installed browsers. |
| browser-testing | Use when building, debugging, or verifying browser-rendered code, or running browser tests for PR- or branch-affected pages. |
| chrome-extension | Use when the user explicitly asks to build, modify, or publish a Manifest V3 Chrome extension. |
| diff-scoped-browser-qa | Use when asked to run branch-diff browser QA against a PR or branch. |
| first-load-byte-reduction | Use when a first screen needs lower transfer bytes without visual or behavioral change. |
| headed-browser-takeover | Use when the user asks to open or take over a visible browser session by hand, for example to solve a CAPTCHA or authenticate. |
| llms-visibility | Use when asked to make a site discoverable by LLM agents using llms.txt, Markdown content-negotiation, and alternate link headers. |
| native-messaging-host-conflicts | Use when a browser extension native messaging host fails, times out, or the wrong host spawns. |
| optimise-seo | Use when asked to make a Next.js App Router app crawlable, indexable, and search-optimized for sitemaps, robots, canonicals, and Core Web Vitals. |
| seo-aeo-audit | Use when asked to improve SEO, optimize for search, fix meta tags, add structured data, or improve AEO visibility. |
| site-launch-checklist | Use when a user says a site or app is ready to ship and wants a decision-gated pre-launch readiness pass. |
| web-performance-audit | Use when asked to audit, profile, or debug page load performance, Lighthouse scores, or site speed. |
| webapp-testing | Use when asked to verify frontend or UI behavior, or capture browser screenshots and console logs. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
