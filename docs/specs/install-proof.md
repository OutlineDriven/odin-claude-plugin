# Install proof

Each supported surface, exercised against this tree rather than read from a document. The tree is
28 job-named plugins and 543 skills on branch `feat/prompt-stack-2.1` at `releaseVersion` 2.1.0.

The Agent Skills validation below was re-run 2026-09-05 against the current tree. Every other
section keeps the run it recorded, with its own date where one was captured. A section that gives
a command shape rather than a run, or names a lane nobody could exercise here, says which.

`docs/specs/distribution-surfaces.md` carries the specifications and their citations. This file
carries what was executed and what it returned, plus any command shape it labels as such.

## Agent Skills validation

The GitHub CLI validates every skill against the Agent Skills specification. (The retired Agent Plugins specification adopted the same skill format; the skill tree is unchanged by the surface retirement.)

Run 2026-09-05. The counts are that run's own, and they match the tree as it stands:
`check-plugin-surfaces` prints the same 543.

```shell
$ gh skill publish --dry-run
warning	[plugins] odin-agent/agent-environment-retrospective	recommended field missing: license
warning	[plugins] odin-agent/agents-md	recommended field missing: license
... 541 more lines of the same shape, one per skill ...
warning		secret scanning is not enabled. Recommended to prevent accidental credential exposure (gh repo edit --enable-secret-scanning)
warning		secret scanning push protection is not enabled. Blocks pushes containing secrets (gh repo edit --enable-secret-scanning-push-protection)
warning		no active tag protection rulesets found. Consider protecting tags to ensure immutable releases (Settings > Rules > Rulesets)

Dry run complete. Use without --dry-run to publish.
$ echo $?
0
```

All 543 skill directories were discovered under the `[plugins]` label, which is the
`plugins/{scope}/skills/*/SKILL.md` convention that `gh skill publish --help` enumerates. The only
per-skill finding was `recommended field missing: license`, 543 times.

That warning is accepted, not fixed. `license` is optional in the Agent Skills specification, this
tree has mixed provenance, and third-party attribution lives in `licenses/NOTICE`. A uniform
per-skill value would misstate the provenance of an adapted skill.

The three repository-level advisories (secret scanning, push protection, tag protection) name
GitHub settings, not tree content; they belong to the repository owner.

## Per-skill install

`gh skill install` accepts an exact repository path, which skips a full tree traversal. At 543
skills that matters.

Command shape rather than a run record: no output or exit code is captured below.

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-planning/skills/askme \
  --agent claude-code --scope user
```

## Codex marketplace

Run against an isolated `CODEX_HOME` so no user configuration changed. codex-cli 0.151.0, run
2026-09-04 against this tree at `releaseVersion` 2.1.0. Output below is verbatim; the PATH-alias
warning is Codex refusing to write helper binaries under the temporary `CODEX_HOME`, not a tree
finding.

```shell
$ codex plugin marketplace add /home/alpha/.claude/claude/.outline/worktree/prompt-stack
Added marketplace `odin-marketplace` from /home/alpha/.claude/claude/.outline/worktree/prompt-stack.
Installed marketplace root: /home/alpha/.claude/claude/.outline/worktree/prompt-stack

$ codex plugin add odin-core@odin-marketplace --json
{
  "pluginId": "odin-core@odin-marketplace",
  "name": "odin-core",
  "marketplaceName": "odin-marketplace",
  "version": "2.1.0",
  "installedPath": ".../plugins/cache/odin-marketplace/odin-core/2.1.0",
  "authPolicy": "ON_USE"
}
```

All 8 `odin-core` skills materialized under the install cache, which proves Codex resolved the
fixed `skills/` location through `.codex-plugin/plugin.json` in Legacy format without the manifest
declaring it. `codex plugin list --json` then reported the plugin installed and enabled, with
`installPolicy: AVAILABLE` and `source.path` pointing at `plugins/odin-core` under the marketplace
root.

One quirk worth recording: `codex plugin list` reports `available: []` for a local marketplace
both before and after an install. Installing by name from that same marketplace works, so this is a
listing behavior rather than a manifest defect.

## Claude Code marketplace

Run against an isolated `CLAUDE_CONFIG_DIR`. No user configuration changed. Claude Code 2.1.259,
run 2026-09-04 against this tree at `releaseVersion` 2.1.0. Output below is verbatim.

```shell
$ claude plugin marketplace add /home/alpha/.claude/claude/.outline/worktree/prompt-stack
✔ Successfully added marketplace: odin-marketplace (declared in user settings)

$ claude plugin install odin-core@odin-marketplace
✔ Successfully installed plugin: odin-core@odin-marketplace (scope: user)

$ claude plugin list
Installed plugins:

  ❯ odin-core@odin-marketplace
    Version: 2.1.0
    Scope: user
    Status: ✔ enabled
```

## Cursor marketplace

Partly proven. The CLI takes a git repository URL and rejects a local path, so the directory that
proved Codex and Claude Code cannot be used here:

```shell
$ cursor-agent plugin marketplace add /tmp/odin-ship-v2
Invalid URL format. Expected: github.com/owner/repo or https://github.example.com/owner/repo
```

Against the remote, Cursor accepts the repository. `cursor-agent plugin marketplace list` shows the
entry:

```
odin-marketplace    user    https://github.com/OutlineDriven/odin-claude-plugin
```

The fetch does not complete on this host. It stops at a filesystem permission, not at anything in
the tree:

```shell
$ cursor-agent plugin marketplace add github.com/OutlineDriven/odin-claude-plugin
Fetching plugins from github.com/OutlineDriven/odin-claude-plugin...
EACCES: permission denied, mkdir '/home/alpha/.cursor/plugins'
```

One half of this is now settled and the other is not. Cursor indexes a repository rather than a ref,
so the `.cursor-plugin/marketplace.json` it reads is the one on the default branch; that registry
reached the default branch at `31d7c15c`, so the merge this paragraph once waited on has happened.
The registry is generated to the documented schema with repository-relative sources and is asserted
by `check-plugin-surfaces`. What remains untested is Cursor's own parse of it, because this machine's
plugin cache still holds the entry it indexed from the feature branch, at
`7f996aac4a86a8d8378d73c1bd6afa541d134447`. That SHA is reachable from the default branch, since the
merge was a fast-forward, so the pin is stale rather than broken. Re-indexing is one command,
`cursor-agent plugin marketplace update odin-marketplace`, and it belongs to whoever owns the
machine: it mutates a consumer cache outside this repository, so no gate here runs it.

## Manifest name parity

Codex resolves a plugin's namespace from the dotdir manifest list only, never from a root file. If the five dotdir manifests under one plugin carry different names, Codex namespaces the plugin under one name and loads its components under another. With no root manifests, every plugin resolves through `.codex-plugin/plugin.json`, first in `DISCOVERABLE_PLUGIN_MANIFEST_PATHS`, in Legacy format.

`check-plugin-surfaces` asserts the parity. The assertion is mutation-verified: changing one
plugin's `.claude-plugin/plugin.json` name produced exactly one `name differs` error, and
regenerating restored a clean run.

## Grok and Kimi lanes

Unproven on this machine, matching how this file already treats the unexercised Cursor parse. The Grok registry is generated to the documented `{"type": "local", "path"}` shape and the Kimi registry to a local-clone `../plugins/<id>` shape; both are asserted by `check-plugin-surfaces`. Grok's `owner/repo#subdir` install and Kimi's absolute-path local-clone install need a live probe against Grok Build v1.0.13 or later and Kimi Code CLI 0.40.1 or later.
