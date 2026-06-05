# Native Agent Config Rule Catalog

Each rule is intentionally checkable with native `find`, `read`, and `search` passes. Use line-numbered tool output for `file:line` evidence. Certainty means confidence that the finding is a real config defect once the recipe matches.

## Discovery Set

Run `find` with these paths before applying rules:

- `skills/*/SKILL.md`
- `agents/*.md`
- `.claude/agents/*.md`
- `CLAUDE.md`, `AGENTS.md`
- `**/CLAUDE.md`, `**/AGENTS.md`
- `hooks.json`, `**/hooks.json`
- `.mcp.json`, `mcp.json`, `**/.mcp.json`, `**/mcp.json`
- `.claude-plugin/plugin.json`

Default skips: `.git/`, `node_modules/`, `dist/`, `build/`, `target/`, `.next/`, `.turbo/`.

## Rule Format

- **ID / certainty**
- **Target**
- **Read/search recipe**
- **Finding**
- **Fix**

## Skill Frontmatter

### AGX-SK-001 / HIGH — Missing frontmatter

**Target**: `skills/*/SKILL.md`.

**Read/search recipe**:
1. `read <skill>/SKILL.md:1-40`.
2. Check line 1 is exactly `---`.
3. Check a second `---` delimiter exists before body text.

**Finding**: no YAML frontmatter block, or opening/closing delimiter missing.

**Fix**: add frontmatter at file start with `name`, `description`, and optional `metadata.short-description`.

### AGX-SK-002 / HIGH — Missing required frontmatter field

**Target**: `skills/*/SKILL.md`.

**Read/search recipe**:
1. `read <skill>/SKILL.md:1-40`.
2. Inside frontmatter only, search for lines matching `^name:\s*\S+` and `^description:\s*\S+`.

**Finding**: `name` or `description` absent or blank.

**Fix**: add the missing key. Prefer `name: <directory-name>` and a one-paragraph description ending in `Use when ...` triggers.

### AGX-SK-003 / HIGH — Invalid skill name format

**Target**: `skills/*/SKILL.md`.

**Read/search recipe**:
1. `read <skill>/SKILL.md:1-20`.
2. Extract `name:`.
3. Validate against `^[a-z0-9]+(-[a-z0-9]+)*$` and length `1..64`.
4. Also reject leading/trailing hyphen and `--`.

**Finding**: name is not kebab-case, contains invalid characters, is too long, or has malformed hyphens.

**Fix**: convert to kebab-case: lowercase, replace spaces/underscores with `-`, remove invalid characters, collapse repeated hyphens, trim hyphens.

### AGX-SK-004 / HIGH — Skill name does not match directory

**Target**: `skills/*/SKILL.md`.

**Read/search recipe**:
1. From path `skills/<dir>/SKILL.md`, record `<dir>`.
2. `read skills/<dir>/SKILL.md:1-20`.
3. Compare frontmatter `name:` exactly to `<dir>`.

**Finding**: `name` differs from parent directory.

**Fix**: change `name` to match the directory, or rename the directory if the frontmatter is authoritative.

### AGX-SK-005 / MEDIUM — Missing trigger phrase

**Target**: `skills/*/SKILL.md`.

**Read/search recipe**:
1. `read <skill>/SKILL.md:1-30`.
2. Inspect frontmatter `description:`.
3. Search case-sensitively for `Use when`; if multiline YAML is used, inspect the whole description scalar.

**Finding**: description lacks an explicit activation phrase.

**Fix**: rewrite description so it ends with `Use when ...` followed by concrete trigger phrases.

### AGX-SK-006 / MEDIUM — Unrestricted Bash in tool allow-list

**Target**: `skills/*/SKILL.md`, `agents/*.md`, `.claude/agents/*.md`.

**Read/search recipe**:
1. `search` pattern `^(allowed-tools|tools):.*\bBash\b` over target files.
2. For each match, check whether the token is scoped as `Bash(...)`.
3. Also read adjacent frontmatter lines if the tools list spans multiple lines.

**Finding**: `Bash` is allowed without command scoping.

**Fix**: replace with scoped command grants such as `Bash(git status:*)`, or remove shell access if not required.

## Agent Markdown

### AGX-AG-001 / HIGH — Agent frontmatter missing required fields

**Target**: `agents/*.md`, `.claude/agents/*.md`.

**Read/search recipe**:
1. `read <agent>.md:1-60`.
2. Check opening/closing `---` delimiters.
3. Inside frontmatter, search for `^name:\s*\S+` and `^description:\s*\S+`.

**Finding**: agent file lacks frontmatter, `name`, or `description`.

**Fix**: add complete frontmatter with stable `name` and trigger-oriented `description`.

### AGX-AG-002 / HIGH — Tool allow/disallow conflict

**Target**: `agents/*.md`, `.claude/agents/*.md`.

**Read/search recipe**:
1. `read <agent>.md:1-80`.
2. Extract `tools:` and `disallowedTools:` frontmatter values, including YAML arrays and comma-separated scalars.
3. Compare normalized tool tokens exactly.

**Finding**: the same tool appears in both lists.

**Fix**: remove the tool from one list; prefer denying unless the agent contract requires the tool.

### AGX-AG-003 / HIGH — Unsafe bypass permission mode

**Target**: `agents/*.md`, `.claude/agents/*.md`.

**Read/search recipe**: `search` pattern `^permissionMode:\s*bypassPermissions\s*$` over agent files.

**Finding**: agent disables normal permission checks.

**Fix**: use `permissionMode: default` or a narrower mode; document why if bypass is intentionally required.

### AGX-AG-004 / MEDIUM — Invalid or vague tool name

**Target**: `agents/*.md`, `.claude/agents/*.md`, `skills/*/SKILL.md`.

**Read/search recipe**:
1. `read <file>:1-80`.
2. Extract `tools:`, `allowed-tools:`, and `disallowedTools:`.
3. Accept known first-party tool names and MCP-style `mcp__server__tool` tokens.
4. Flag names that are not recognized and not MCP-style.

**Finding**: typo or unsupported tool token in frontmatter.

**Fix**: replace with the correct tool name or remove it.

## Instruction Memory and Cross-file Conflicts

### AGX-MEM-001 / HIGH — Generic no-op instruction

**Target**: `CLAUDE.md`, `AGENTS.md`, nested variants.

**Read/search recipe**: `search` pattern `(?i)\b(be helpful|be accurate|think step by step|be concise|use best practices)\b` over instruction files.

**Finding**: generic instruction adds tokens without constraining behavior.

**Fix**: replace with project-specific invariant, command, path, or rejection rule.

### AGX-MEM-002 / MEDIUM — Nested instruction layers without precedence

**Target**: all `AGENTS.md` and `CLAUDE.md` files.

**Read/search recipe**:
1. `find` paths `**/AGENTS.md`, `**/CLAUDE.md`.
2. If more than one matching file exists, `search` pattern `(?i)\b(precedence|takes precedence|overrides|inherits|nearest|nested)\b` across those files.
3. If no precedence language appears, report each nested file.

**Finding**: multiple instruction layers may apply, but precedence/inheritance is undocumented.

**Fix**: add a short precedence section naming which file wins and how nested files override or extend root instructions.

### AGX-MEM-003 / MEDIUM — Conflicting package-manager commands

**Target**: all `AGENTS.md` and `CLAUDE.md` files.

**Read/search recipe**:
1. `search` pattern `\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|build|lint|typecheck|install)\b` across instruction files.
2. Group by command purpose: test/build/lint/typecheck/install.
3. If two package managers are prescribed for the same purpose without a conditional scope, flag both lines.

**Finding**: inconsistent command contract across instruction layers.

**Fix**: standardize on one command per purpose, or add explicit scope guards such as `frontend/ uses pnpm; scripts/ uses bun`.

### AGX-MEM-004 / HIGH — Conflicting tool constraints

**Target**: all `AGENTS.md` and `CLAUDE.md` files.

**Read/search recipe**:
1. `search` pattern `(?i)\b(must|always|allow|allowed|use)\b.*\b(Bash|Write|Edit|git|network|web)\b`.
2. `search` pattern `(?i)\b(must not|never|forbid|forbidden|disallow|do not)\b.*\b(Bash|Write|Edit|git|network|web)\b`.
3. Compare constraints by tool/resource and scope. Exact allow-vs-deny in overlapping scope is HIGH; unclear scope is MEDIUM.

**Finding**: one instruction layer allows what another forbids.

**Fix**: resolve to one rule, or split by explicit path/task scope.

### AGX-MEM-005 / MEDIUM — Platform-specific feature without guard

**Target**: `AGENTS.md` and nested `AGENTS.md` files.

**Read/search recipe**: `search` pattern `(?i)\b(allowed-tools|permissionMode|hooks|mcpServers|context:\s*fork|CLAUDE_PLUGIN_ROOT)\b` over `AGENTS.md` files, then read nearby headings.

**Finding**: Claude-specific directive appears in generic cross-tool instructions without a platform heading or guard.

**Fix**: move it to `CLAUDE.md`, or place under a `Claude Code`-scoped heading.

## Hooks

### AGX-HK-001 / HIGH — Hook JSON parse error

**Target**: `hooks.json`, `**/hooks.json`.

**Read/search recipe**: `read <hooks.json>`. If the reader reports malformed JSON or cannot parse the file as JSON, report the parser line/column when available.

**Finding**: hooks config is not valid JSON.

**Fix**: repair JSON syntax before running semantic checks.

### AGX-HK-002 / HIGH — Hook missing required handler field

**Target**: `hooks.json`, `**/hooks.json`.

**Read/search recipe**:
1. `read <hooks.json>`.
2. For each hook entry, inspect `type`.
3. `type: "command"` requires non-empty `command`.
4. `type: "prompt"` requires non-empty `prompt`.
5. `type: "agent"` requires non-empty `prompt` or an explicit agent target, depending on local schema.
6. `type: "mcp_tool"` requires non-empty `server` and `tool`.

**Finding**: hook entry cannot execute because required fields are missing.

**Fix**: add the required field or remove the incomplete hook.

### AGX-HK-003 / HIGH — Dangerous hook command pattern

**Target**: `hooks.json`, `**/hooks.json`.

**Read/search recipe**: run `search` over hook files with patterns:

- `rm\s+-rf\s+(/|\$\{|\$[A-Z_]|\*)`
- `curl\b[^\n|]*\|\s*(sh|bash)`
- `wget\b[^\n|]*\|\s*(sh|bash)`
- `\beval\s+[`"$]`
- `git\s+reset\s+--hard`
- `drop\s+database`

**Finding**: hook command contains destructive, remote-execution, or evaluation pattern.

**Fix**: replace with an audited script path, require explicit confirmation, or remove the hook. Never hide destructive commands in shell wrappers.

### AGX-HK-004 / MEDIUM — Hook timeout missing

**Target**: `hooks.json`, `**/hooks.json`.

**Read/search recipe**:
1. `read <hooks.json>`.
2. For each command/http/mcp hook entry, check for numeric `timeout`.
3. Missing timeout is MEDIUM; timeout `<= 0` is HIGH.

**Finding**: hook may hang or has invalid timeout.

**Fix**: add a positive timeout appropriate to the hook, usually seconds not minutes.

### AGX-HK-005 / HIGH — Matcher on event where it is ignored or invalid

**Target**: `hooks.json`, `**/hooks.json`.

**Read/search recipe**:
1. `read <hooks.json>`.
2. For event groups such as `Stop`, `SubagentStop`, and `UserPromptSubmit`, check hook entries for `matcher`.

**Finding**: matcher is attached to a non-tool event and will not constrain execution as intended.

**Fix**: remove `matcher`, or move the hook to a tool event where matching is supported.

## MCP Configuration

### AGX-MCP-001 / HIGH — MCP JSON parse error

**Target**: `.mcp.json`, `mcp.json`, `**/.mcp.json`, `**/mcp.json`.

**Read/search recipe**: `read <mcp-config>`. If JSON parse fails, report the parser line/column when available.

**Finding**: MCP config is not valid JSON.

**Fix**: repair JSON syntax before semantic checks.

### AGX-MCP-002 / HIGH — Missing or invalid MCP server shape

**Target**: `.mcp.json`, `mcp.json`, agent frontmatter with `mcpServers`.

**Read/search recipe**:
1. `read <mcp-config>` or `read <agent>.md:1-120`.
2. Locate `mcpServers` object.
3. Each server entry must be a non-empty object.
4. `type` absent or `stdio` requires non-empty `command`.
5. `type: "http"` or `type: "sse"` requires non-empty `url`.
6. Any explicit `type` must be one of `stdio`, `http`, `sse`.

**Finding**: server cannot be launched or reached because required shape is missing.

**Fix**: add the required `command` or `url`, set a valid `type`, and remove empty server objects.

### AGX-MCP-003 / HIGH — Invalid args shape

**Target**: MCP configs and agent frontmatter `mcpServers`.

**Read/search recipe**:
1. `read <mcp-config>`.
2. For each server `args`, verify it is an array of strings.

**Finding**: `args` is not a string array.

**Fix**: convert to `"args": ["--flag", "value"]`; do not pass a shell-concatenated string.

### AGX-MCP-004 / MEDIUM — Plaintext secret in MCP env

**Target**: MCP configs and agent frontmatter `mcpServers`.

**Read/search recipe**: `search` pattern `(?i)"(env)"|API_KEY|TOKEN|SECRET|PASSWORD` over MCP configs, then read matching server blocks.

**Finding**: secret-like env key has a non-empty literal value.

**Fix**: read secrets from process environment or a local untracked file; leave committed config with variable names only.

### AGX-MCP-005 / HIGH — Non-local HTTP MCP URL is plaintext

**Target**: MCP configs.

**Read/search recipe**: `search` pattern `"url"\s*:\s*"http://` over MCP configs, then ignore `localhost`, `127.0.0.1`, and `[::1]` hosts during review.

**Finding**: remote MCP endpoint uses plaintext HTTP.

**Fix**: use HTTPS, or restrict the endpoint to localhost for development.

### AGX-MCP-006 / MEDIUM — Risky stdio command

**Target**: MCP configs.

**Read/search recipe**: `search` patterns `curl\b[^\n|]*\|\s*(sh|bash)`, `wget\b[^\n|]*\|\s*(sh|bash)`, `sudo\s+rm`, and `\beval\s+` over MCP configs.

**Finding**: server command delegates trust to shell text or destructive command patterns.

**Fix**: use a stable executable plus explicit `args` array.

## Plugin Manifest

### AGX-PL-001 / HIGH — Plugin manifest missing or misplaced

**Target**: `.claude-plugin/plugin.json`.

**Read/search recipe**:
1. `find` path `.claude-plugin/plugin.json`.
2. Also `find` path `**/plugin.json`.
3. If a plugin manifest-like file exists outside `.claude-plugin/`, report possible misplacement.

**Finding**: plugin manifest is missing or not under `.claude-plugin/`.

**Fix**: place the manifest at `.claude-plugin/plugin.json`.

### AGX-PL-002 / HIGH — Plugin JSON parse error

**Target**: `.claude-plugin/plugin.json`.

**Read/search recipe**: `read .claude-plugin/plugin.json`. If JSON parse fails, report parser evidence.

**Finding**: manifest is not valid JSON.

**Fix**: repair JSON syntax before semantic checks.

### AGX-PL-003 / HIGH — Missing required plugin fields

**Target**: `.claude-plugin/plugin.json`.

**Read/search recipe**:
1. `read .claude-plugin/plugin.json`.
2. Check top-level `name` is present and non-empty.
3. Check `description` and `version` are present; absence is at least MEDIUM and HIGH for release/publish readiness.

**Finding**: manifest lacks fields needed for discovery or distribution.

**Fix**: add non-empty `name`, concise `description`, and `version`.

### AGX-PL-004 / HIGH — Invalid version format

**Target**: `.claude-plugin/plugin.json`.

**Read/search recipe**:
1. `read .claude-plugin/plugin.json`.
2. Validate `version` string against `^\d+\.\d+\.\d+$`.

**Finding**: version is not `major.minor.patch`.

**Fix**: use numeric semver, for example `1.2.3`.

### AGX-PL-005 / HIGH — Unsafe component path

**Target**: `.claude-plugin/plugin.json`.

**Read/search recipe**:
1. `read .claude-plugin/plugin.json`.
2. Inspect component path fields for commands, agents, skills, hooks, MCP, and output styles.
3. Flag paths beginning with `/`, drive-letter roots, `..`, or `.claude-plugin/`.

**Finding**: component path is absolute, traverses upward, or points inside manifest metadata.

**Fix**: use a relative path from plugin root, outside `.claude-plugin/`.

## Prompt XML

### AGX-XML-001 / HIGH — Unclosed XML tag

**Target**: `SKILL.md`, `CLAUDE.md`, `AGENTS.md`, agent markdown, hook prompts.

**Read/search recipe**:
1. `search` pattern `</?[A-Za-z][A-Za-z0-9_-]*(\s[^>]*)?>` over target markdown.
2. `read` each matching section with enough surrounding lines to include the full prompt block.
3. Ignore fenced code blocks unless the prompt intentionally embeds XML outside code.
4. Push opening tags onto a stack; pop matching closing tags; ignore self-closing tags ending `/>`.
5. EOF with non-empty stack is unclosed tag.

**Finding**: opening tag has no matching close.

**Fix**: add the missing closing tag or remove the orphan opener.

### AGX-XML-002 / HIGH — Mismatched closing XML tag

**Target**: same as AGX-XML-001.

**Read/search recipe**: use the AGX-XML-001 tag stack; when a closing tag appears and stack top differs, report both opener and closer lines.

**Finding**: closing tag does not match the latest open tag.

**Fix**: rename the closing tag or close nested tags in the correct order.

### AGX-XML-003 / HIGH — Unmatched closing XML tag

**Target**: same as AGX-XML-001.

**Read/search recipe**: use the AGX-XML-001 tag stack; if a closing tag appears while the stack is empty, report the closing line.

**Finding**: closing tag has no corresponding opener.

**Fix**: remove the closing tag or add the missing opener before it.

## Reporting Template

```text
HIGH AGX-SK-004 skills/foo/SKILL.md:2 — frontmatter name does not match parent directory
Evidence: name: bar, path directory: foo
Fix: change line 2 to `name: foo`
```

Group order: HIGH, MEDIUM, LOW. Within each group, sort by file path then line. Do not report a LOW finding when a HIGH parse failure prevents reliable inspection of the same file.
