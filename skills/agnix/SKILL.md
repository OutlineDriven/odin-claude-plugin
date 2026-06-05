---
name: agnix
description: Native agent-configuration lint pass for ODIN and Claude Code surfaces: skill frontmatter, instruction memory, hooks, MCP servers, plugin manifests, and subagent files. Use when lint agent config, validate SKILL.md, check CLAUDE.md, check hooks, check MCP config, agnix.
metadata:
  short-description: Native agent config lint
---

Agnix is a correct op-cell: restore the invariant that agent-facing configuration is parseable, scoped, non-conflicting, and safe to load. Run native read/search checks only; report evidence, certainty, and the smallest fix.

## When to Apply / NOT

Apply: new or edited `SKILL.md`; project `CLAUDE.md` / `AGENTS.md`; `hooks.json`; `.mcp.json`; `.claude-plugin/plugin.json`; `agents/*.md`; suspicious prompt XML; tool allow-list review; plugin packaging check.

NOT: source-code linting; dependency audit; runtime security review beyond config text; generated vendor configs; proving every rule in a large external ruleset.

## Workflow

1. **Discover config files** — use native file lookup, then keep the scope tight:
   - `find` paths: `skills/*/SKILL.md`, `CLAUDE.md`, `AGENTS.md`, `**/CLAUDE.md`, `**/AGENTS.md`, `hooks.json`, `**/hooks.json`, `.mcp.json`, `mcp.json`, `.claude-plugin/plugin.json`, `agents/*.md`, `.claude/agents/*.md`.
   - Exclude generated/build directories by default: `.git/`, `node_modules/`, `dist/`, `build/`, `target/`, `.next/`, `.turbo/`.
2. **Read structure, not bulk** — `read` each candidate. For `SKILL.md` / agent files, read from line 1 through the closing frontmatter delimiter plus the first body paragraph; only read more when checking XML or trigger placement.
3. **Run HIGH checks first** — parseability and load blockers: frontmatter delimiters, required fields, name format, name-directory match, JSON shape, hook required fields, MCP server required fields, plugin manifest fields, XML balance, dangerous hook commands.
4. **Run MEDIUM checks** — portability and maintainability: missing `Use when` trigger, unrestricted `Bash`, missing hook timeout, plaintext MCP env secrets, nested instruction conflicts, platform-specific content without guard.
5. **Run LOW checks only on request** — heuristic prompt quality, unknown optional fields, vague names, portability hints.
6. **Report grouped by certainty** — each finding uses:
   - `CERTAINTY rule-id file:line — problem`
   - `Evidence: exact key/line/pattern observed`
   - `Fix: one concrete edit`
7. **Fix only when explicitly asked** — apply HIGH fixes first. Do not auto-fix MEDIUM/LOW unless the user accepts the tradeoff.

## Native Check Recipes

Use `references/agent-config-rules.md` as the rule catalog. Every rule includes: id-like tag, certainty, target files, native read/search recipe, and fix.

Minimum pass:

- `SKILL.md`: frontmatter exists; `name` and `description` exist; `name` is kebab-case and equals parent directory; `description` contains `Use when`.
- Agent markdown: frontmatter exists; `name` and `description` exist; tools are known/scoped; no tool appears in both allow and deny lists.
- Instruction memory: nested `AGENTS.md` / `CLAUDE.md` layers are intentional; conflicting tool/package-manager commands are not present.
- Hooks: JSON parses; hook entries have required handler fields; command strings do not contain destructive shell patterns.
- MCP: JSON parses; `mcpServers` entries have valid `type` plus `command` or `url`; args/env shapes are sane.
- Plugin manifest: `.claude-plugin/plugin.json` has required fields; version is `major.minor.patch`; component paths are relative and outside `.claude-plugin/`.
- Prompt XML: tags are balanced; mismatched/unmatched closing tags are reported with stack context.

## Certainty Contract

- **HIGH** — syntactic or schema fact. Report as defect. Safe to fix mechanically when the fix is local and unambiguous.
- **MEDIUM** — likely defect or portability risk. Report by default; fix needs human intent.
- **LOW** — style/quality heuristic. Report only when the user asks for a stricter pass.

## Anti-patterns

- **Graft**: adding a new config layer instead of fixing the failing one.
- **Sprawl**: validating every markdown file when the request names one config surface.
- **Excess**: treating heuristic prompt taste as a load blocker.
- **Silent downgrade**: reporting malformed JSON/XML as MEDIUM.
- **Unsafe convenience**: accepting unrestricted `Bash`, wildcard hooks, or plaintext MCP secrets without a finding.
- **Cross-file guess**: claiming instruction precedence without reading every applicable `AGENTS.md` / `CLAUDE.md` layer.

## Validation Gates

Before yielding a lint result:

1. Every reported finding has `file:line`, certainty, evidence, and fix.
2. HIGH findings are based on observed syntax/schema facts, not inference.
3. MEDIUM findings name the uncertainty: portability, conflict, missing guard, or safety policy.
4. No sibling skill or external rule pack is needed to understand the report.
5. If edits were applied, re-read touched files and rerun the matching checks only.

## Out of Scope Without a Dedicated Engine

- 1000-file parallel scale with deterministic global sorting.
- Tiered auto-fix orchestration across HIGH/MEDIUM/LOW findings.
- SARIF, LSP diagnostics, editor integrations, or workspace push diagnostics.
- Full multi-hundred-rule coverage across every vendor/tool ecosystem.
- Semantic execution proving for hook scripts or MCP servers.
