---
name: native-capability-catalogue
description: 'Use when any builder run must resolve its target architecture and build kind into a system-prompt capability catalogue. The run receives the correct per-architecture native-tool catalogue, version-stamped and parity-checked, or fails closed naming the architectures that support the requested build kind. Don''t use for tasks that require source or remote-system changes.'
---

# Native capability catalogue

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Any builder run resolves its target architecture and build kind to a system-prompt capability catalogue. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The run reads only the constants embedded in this skill and never queries a live agent runtime for its tools. |
| Side effect | None. The catalogue is emitted as prompt text from embedded versioned constants, never discovered by live tool introspection. |
| Done | The builder system prompt carries the correct per-architecture native-tool catalogue (gh over browser, platform-aware shell), the property the builder evals guard, stamped with its version and verified byte-identical by an independent re-derivation. |

## Inputs

- Supplied by the calling builder run: the pair (target architecture, build kind). Architecture is one of `scout`, `cowork`, `agent-skill`, `copilot-studio`; build kind is `skill` or `automation`. Nothing else is supplied; no network, repository, or runtime tool access is used.
- Embedded, versioned constants owned by this skill: the only catalogue source:

| Architecture | Build kind | Enabled | Version |
|---|---|---|---|
| scout | skill | yes | 2026-07-26 |
| scout | automation | yes | 2026-07-26 |
| cowork | skill | yes | 2026-07-28 |
| agent-skill | skill | yes | 2026-08-06 |
| copilot-studio | skill | no | — |

Manifest invariants: at least one row; each (architecture, kind) appears at most once; kind is `skill` or `automation`; every enabled row carries a non-empty version and a non-empty catalogue body; no architecture outside the table exists.

Catalogue bodies, one per enabled row, emitted verbatim:

`scout` / `skill`:

```text
# Target: Microsoft Scout — native capability catalogue (built-ins only)

A Scout skill is a SKILL.md file: optional YAML frontmatter plus a markdown instructions
body; Scout auto-loads user skills from ~/.copilot/skills/<name>/SKILL.md. Frontmatter:
`name` kebab-case `^[a-z0-9-]+$`; `description` — one line of trigger keywords; optional
`allowed-tools` — tool patterns the skill may use (e.g. `Bash(gh *)`). The body is written
TO the agent, imperative voice: when to use it, ordered steps, input and edge-case handling.

### Native tools to prefer, in order
1. WorkIQ (`workiq_*`) for Microsoft 365 — Teams chat, Outlook mail, calendar,
   SharePoint/OneDrive files, and people. Reads are auto-approved; send/create/update/delete
   need the user's approval at run time.
2. SDK built-ins `view`, `glob`, `grep`, `web_fetch` — discover inputs on the device or the
   public web instead of asking the user.
3. The device shell and installed CLIs. A service's first-class CLI IS its native tool —
   prefer it over the browser. GitHub → the `gh` CLI (`gh issue`, `gh pr`, `gh release`,
   `gh repo`, `gh api`), never github.com in a browser; likewise `git` and the task's cloud
   or service CLIs (`az`, `aws`, `gcloud`, `kubectl`, `npm`, `docker`). Write commands for
   the target OS — POSIX (zsh/bash) on macOS, PowerShell on Windows, minding path and
   quoting differences. Gate the shell with an `allowed-tools` pattern such as `Bash(gh *)`.
4. Browser automation (`browser_*`, Playwright) only for a web app with no API and no CLI;
   `browser_snapshot` before acting. GitHub is never such a case — use `gh`.

### Built-in skills only
Lean on Scout's shipped skills when they match — pptx, docx, xlsx, loop,
web-artifacts-builder — and assume nothing else is installed. Never rely on a
user-installed or repo-local skill.

### Generalize
If the recording acted on N specific items, write the procedure for every item of that kind.
Resolve each input as a fixed value, user-provided, or agent-located on the device. Use the
browser only for genuine UI-only steps.
```

`scout` / `automation`:

```text
# Target: Microsoft Scout — automation catalogue (built-ins only)

A Scout automation is a trigger plus ordered steps; each step is a natural-language prompt
the Scout agent executes with its native tools (below). Automations are imported from a
bundle folder — they are NOT auto-loaded like skills.

### Trigger
- schedule (default): natural language on a clock — "every weekday at 9am", "every 30
  minutes" (N divides 1440 evenly), or several fixed times of day.
- condition: a natural-language condition checked on a cadence, used only when the
  recording clearly implies an event trigger.
A recording captures one run and carries no "when to run" signal — propose a sensible
default schedule, state the assumption, and let the user correct it in plain language.

### Steps
Few, ordered, each with a short label and an imperative prompt that generalizes past the
recorded examples. Prefer native tools over UI replay and say briefly why. Reference fixed
literals by their `{{id}}` value tokens; for anything variable, tell the agent to locate it
on the device or read it from Microsoft 365 — an unattended automation never depends on a
user-provided value. Keep destructive or send/create actions explicit.

### Native tools to prefer, in order
1. WorkIQ (`workiq_*`) for Microsoft 365 — Teams chat, Outlook mail, calendar,
   SharePoint/OneDrive files, and people. Reads are auto-approved; mutations need the
   user's approval at run time.
2. SDK built-ins `view`, `glob`, `grep`, `web_fetch` — discover inputs on the device or the
   public web.
3. The device shell and installed CLIs. A first-class CLI IS its native tool — prefer it
   over the browser. GitHub → the `gh` CLI (`gh issue`, `gh pr`, `gh release`, `gh repo`,
   `gh api`), never github.com in a browser; likewise `git` and the task's cloud or service
   CLIs. Write commands for the target OS — POSIX (zsh/bash) on macOS, PowerShell on
   Windows. Gate the shell with an `allowed-tools` pattern such as `Bash(gh *)`.
4. Browser automation (`browser_*`, Playwright) only for a web app with no API and no CLI;
   `browser_snapshot` before acting.

### Built-in skills only
pptx, docx, xlsx, loop, web-artifacts-builder — assume nothing else is installed.

### Generalize
Give the automation a clear description of what it does and when it runs.
```

`cowork` / `skill`:

```text
# Target: Microsoft 365 Copilot (Cowork) — native capability catalogue (built-ins only)

A Cowork skill is a SKILL.md file: optional YAML frontmatter plus a markdown instructions
body, exported and installed by the user. Frontmatter: `name` kebab-case `^[a-z0-9-]+$`;
`description` — one line of trigger keywords; optional `allowed-tools` — tool patterns the
skill may use (e.g. `Bash(gh *)`). The body is written TO the Cowork agent, imperative voice.

### Native tools to prefer, in order
1. Microsoft 365 MCP tools — Teams, Outlook mail, calendar, SharePoint/OneDrive, the org
   directory, unified search, and meeting transcripts (`m365_teams/*`, `outlook/*`,
   `outlook_calendar/*`, `sharepoint_onedrive/*`, `me_profile/*`, `m365_search/SearchM365`,
   `graph/*` transcripts), with `graph/QueryGraph` / `graph/CallGraph` as the escape hatch
   for any other Graph call. Reads are auto-approved; send/create/update/delete need the
   user's approval at run time.
2. SDK built-ins `Read`, `Glob`, `Grep`, `core/web_fetch`, `core/web_search` — discover
   inputs on the local OS or the public web; `Write`/`Edit` to author local files.
3. The device shell and installed CLIs (`Bash`). A service's first-class CLI IS its native
   tool — prefer it over the browser. GitHub → the `gh` CLI (`gh issue`, `gh pr`,
   `gh release`, `gh repo`, `gh api`), never github.com in a browser; likewise `git` and
   the task's cloud or service CLIs (`az`, `aws`, `gcloud`, `kubectl`, `npm`, `docker`).
   Gate the shell with an `allowed-tools` pattern such as `Bash(gh *)`.
4. Power BI (`pbi_fabricaihub/*`) for Power BI / Fabric reports and semantic models.

### No browser automation
Cowork has no Playwright or `browser_*` tools — it cannot click or type in a web UI. Map
every recorded UI step to an M365 tool, a CLI, or an API; at most it reads a public page
with `core/web_fetch`. If a step genuinely requires a UI Cowork cannot automate, say so in
the skill instead of pretending to click.

### Built-in skills only
Lean on Cowork's shipped skills when they match — pptx, docx, xlsx, pdf, loop, canvas,
deep-research, code-review, security-review, powerbi, calendar-management,
schedule-meeting, meeting-intel, stakeholder-comms, daily-briefing, image-operations —
and assume nothing else is installed. Never rely on a user-installed skill.

### Generalize
If the recording acted on N specific items, write the procedure for every item of that kind.
Resolve each input as a fixed value, user-provided, or agent-located. Keep the body concise
and imperative, with a short "When to use" and the ordered steps.
```

`agent-skill` / `skill`:

```text
# Target: any AI agent with skill support — generic catalogue (portable capabilities only)

An Agent skill is a portable SKILL.md file: optional YAML frontmatter plus a markdown
instructions body. It targets no specific host and must not assume proprietary built-in
tools. Frontmatter: `name` kebab-case `^[a-z0-9-]+$`; `description` — one line of trigger
keywords; optional `allowed-tools` — tool patterns the skill may use (e.g. `Bash(gh *)`).

### Assume only portable capabilities
No host-specific integrations — no Teams, Outlook, Calendar, or WorkIQ — and no browser
automation. Rely only on what every agent can reasonably provide: reading and writing
files, running shell commands and standard CLIs, and calling documented HTTP APIs. Map
every recorded UI action to a portable tool, an API call, or a CLI — never "click"/"type"
UI steps.

### Generalize
If the recording acted on N specific items, write the procedure for every item of that kind.
Resolve each input as a fixed value, user-provided, or agent-located. Keep the body concise
and imperative, with a short "When to use" and the ordered steps.
```

## Procedure

1. Read the pair supplied by the builder run. If the architecture is not one of `scout`, `cowork`, `agent-skill`, `copilot-studio`, or the kind is not `skill` or `automation`, stop: report the valid vocabulary. Nothing is resolved.
2. Check the embedded manifest against its invariants (Inputs). On any violation, stop: report the violated invariant. Never resolve from constants that fail their own invariants.
3. Look up the pair. If the row is absent, disabled (e.g. `copilot-studio` / `skill`), or lacks a version or body, fail closed with exactly `That target architecture isn't available yet. Choose <labels>.` where `<labels>` names the architectures whose rows for that kind are enabled — for `skill`: `Scout, Cowork, or Agent skill`; for `automation`: `Scout`. Never synthesize a catalogue, substitute another row, or probe the target.
4. Emit the catalogue section for the row: one line `Catalogue version: <version>` followed by the row's body byte-for-byte, and attach the section to the builder system prompt. Do not paraphrase, trim, or reflow the body. Never enumerate a running agent's tools or fetch a capability report at run time.
5. Parity guard: re-derive the expected section by reading the constants again — a second pass that does not reuse the first rendering — and compare it byte-for-byte against the attached section, version line included. On any difference, detach the section and stop; the prompt must not ship a catalogue that differs from the constants.
6. Never mutate: a run of this skill writes no file, bumps no version, and edits no constant. If the caller asserts the target's native tools changed, emit the embedded body unchanged with its version and report the asserted mismatch as an open item for this skill's maintainers.

## Failure and recovery
- Invalid request — architecture or kind outside the vocabulary. Terminal; report the valid values; no catalogue produced.
- Corrupt manifest — any invariant violation. Terminal; name the violated invariant; produce no catalogue.
- Unavailable target — row absent, disabled, or missing version or body (e.g. `copilot-studio` / `skill`). Fail closed with the exact choices message from procedure step 3; never synthesize or substitute.
- Parity mismatch — the re-derived section differs from the attached one. Detach the section; the builder run is blocked: report both renderings and stop. Never claim done with a mismatched catalogue.
- Asserted staleness — the caller says the catalogue is out of date. Emit the embedded version unchanged and attach the mismatch report; no mutation and no live introspection happens in the run.
- Partial-result rule: the artifact is one prompt section; any failure yields no section rather than a partial one. The skill writes nothing, so there is nothing to roll back.
- Blocked result: state `blocked: no catalogue resolved for <architecture>/<kind>` plus the failure class. Never report the done predicate as holding when any failure fired.

## Output
- Success: the catalogue section — the `Catalogue version: <version>` line plus the row's body, byte-identical to the embedded constant and parity-checked — attached to the builder system prompt, with the verdict (architecture, kind, enabled=true, version).
- Failure: one of the terminal classifications above with its exact blocked message; no prompt section.

## Provenance

- Origin: https://github.com/microsoft/skill-recorder, pinned revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61 (electron/architectures/catalogue-provider.ts, electron/architectures/catalogue-registry.ts, common/architecture-registry.ts, evals/lib/catalogue-registry.ts, electron/architectures/catalogues/agent-skill-catalogue.ts, electron/architectures/catalogues/cowork-catalogue.ts, electron/architectures/catalogues/scout-catalogue.ts).
- License: MIT (SPDX MIT), Copyright (c) Microsoft Corporation. Copies or substantial portions retain the copyright and permission notice; modified versions must not imply Microsoft sponsorship (upstream README trademark note).
- Adaptation: the manifest, registry, provider, and eval-parity machinery was re-expressed as an agent-executable resolution procedure. Retained from the pinned revision: the architecture inventory and versions, the manifest invariants, the fail-closed error classes and choices message, the no-live-introspection rule, and the built-ins-only / gh-over-browser / platform-aware-shell catalogue rules. The third-party tool-name listings are condensed to the capability rules the done predicate guards. Project-owned ODIN infrastructure; not a Microsoft artifact.
