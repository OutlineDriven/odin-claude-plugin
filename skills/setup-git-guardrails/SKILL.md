---
name: setup-git-guardrails
description: 'Install a Claude Code PreToolUse hook that blocks irreversible git operations before they execute: force pushes, hard resets, forced branch deletion, and working-tree discards. Use when a repository needs a tool-time safety net. Plain `git push` stays allowed.'
---

# Set up Git guardrails

Install a Claude Code `PreToolUse` hook that blocks accidental destructive Git commands before Bash runs them. Plain `git push` stays allowed.

The hook parses shell quoting and scans every Git invocation. It also follows code passed to common shells and `eval`. It is a guardrail, not a sandbox. A determined caller can still hide Git behind runtime indirection.

## 1. Ask for scope

Ask the user where to install the hook:

- **Project:** `.claude/settings.json`
- **Global:** `~/.claude/settings.json`

## 2. Copy the hook

Copy `scripts/block-dangerous-git.py` to the chosen location:

- **Project:** `.claude/hooks/block-dangerous-git.py`
- **Global:** `~/.claude/hooks/block-dangerous-git.py`

Run `chmod +x` on the copied script.

## 3. Offer rule changes

Show the blocked operations. Ask whether the user wants to add or remove a rule. Edit only the installed copy when they approve a change.

The default rules block:

- Forced pushes and forced refspecs
- `reset --hard`
- Forced `clean`
- Forced branch deletion
- `checkout .` and `restore .`
- `stash drop` and `stash clear`
- `reflog expire`
- `gc --prune=now`

## 4. Verify

For each payload below, run:

```bash
printf '%s\n' '<payload>' | <path-to-hook>
printf 'exit=%s\n' "$?"
```

All eleven cases must match the expected exit before registration.

Must exit 2:

1. `{"tool_input":{"command":"git push --force origin main"}}`
2. `{"tool_input":{"command":"ok && git reset --hard"}}`
3. `{"tool_input":{"command":"echo ok\ngit reset --hard"}}`
4. `{"tool_input":{"command":"bash -c \"git reset --hard\""}}`
5. `{"tool_input":{"command":"bash -lc \"git reset --hard\""}}`
6. `{"tool_input":{"command":"eval \"git reset\" --hard"}}`
7. `{"tool_input":{"command":"git clean --force"}}`
8. `{"tool_input":{"command":"git branch --delete --force"}}`

Must exit 0:

9. `{"tool_input":{"command":"git push origin main"}}`
10. `{"tool_input":{"command":"git commit -m \"oops; git reset --hard\""}}`
11. `{"tool_input":{"command":"git --git-dir=.git status"}}`

A blocked command prints this contract to stderr and exits 2:

```text
BLOCKED: '<command>' matches dangerous pattern '<pattern>'. The user has prevented you from doing this.
```

## 5. Register the hook

After all eleven cases pass, merge the entry into the existing `hooks.PreToolUse` array. Never overwrite the settings file or discard existing hooks.

Project settings fragment:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.py"
          }
        ]
      }
    ]
  }
}
```

Global settings fragment:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.py"
          }
        ]
      }
    ]
  }
}
```
