# AI Tooling Patterns

Paste this block verbatim into the `# === AI TOOLING ===` section of the composed `.gitignore`.

**Before using:** some of these patterns apply to dirs that agent-enabled repos intentionally commit (e.g., a repo that IS a Claude project commits `.claude/`). Review each entry for your repo before including it.

```gitignore
# AI agent scratch / plan artifacts (safe to ignore in all repos)
.outline/
.plan/
PLAN.md
TASKS.md

# Aider runtime state (safe to ignore in all repos)
.aider.chat.history.md
.aider.input.history
.aider.tags.cache.v*/

# --- Agent state dirs (check before including) ---
# These dirs may contain committed project rules in agent-enabled repos.
# Include only if the repo does NOT commit these dirs.

# Claude Code personal state (credentials, session DBs, local config)
# Note: omit if this repo IS a .claude/ project that commits CLAUDE.md / skills/
.claude/settings.local.json
.claude/credentials
.claude/*.db
.claude/*.sqlite
.claude/logs/

# Codex personal state
# Note: omit if this repo commits .codex/ project config
.codex/conversations/
.codex/logs/

# Cursor personal state (chat history, logs)
# Note: .cursor/rules/ may be committed project config; don't ignore the whole dir
.cursor/chat/
.cursor/conversations/
.cursor/logs/
.cursorignore

# Other AI coding assistants (usually pure runtime state, safe to ignore)
.roo/
.cline/
.kilo/
.amazonq/
.trae/
.gemini/
.opencode/
.junie/
.zencoder/
.pi/
.continue/
.copilot/
```
