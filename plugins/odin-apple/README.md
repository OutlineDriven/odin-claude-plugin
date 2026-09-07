# ODIN Apple

ODIN workflows for software on Apple platforms.

3 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-apple@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-apple@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-apple/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-apple:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| ios-build-cleanup | Use when the user wants a clean Xcode rebuild by deleting DerivedData and build artifacts. |
| ios-build-fix | Use when asked to run /ios-build-fix to fix a failing iOS build, regenerate an Xcode project from project.yml, or correct UI behavior. |
| xcode-simulator-testing | Use when asked to run /xcode-simulator-testing with a scheme name or current to build and launch an iOS app in a simulator. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
