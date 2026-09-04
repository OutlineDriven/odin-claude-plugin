# Install proof

Each supported surface, exercised against this tree rather than read from a document. Run
2026-09-01 on branch `feat/skill-foundry-2.0-source`.

`docs/specs/distribution-surfaces.md` carries the specifications and their citations. This file
carries only what was executed and what it returned.

## Agent Skills validation

The GitHub CLI validates every skill against the Agent Skills specification. (The retired Agent Plugins specification adopted the same skill format; the skill tree is unchanged by the surface retirement.)

```shell
$ gh skill publish --dry-run
Dry run complete. Use without --dry-run to publish.
$ echo $?
0
```

All 657 skill directories present at the time of the run were discovered under the `[plugins]`
label, which is the `plugins/{scope}/skills/*/SKILL.md` convention that `gh skill publish --help`
enumerates. The only per-skill finding was `recommended field missing: license`.

That warning is accepted, not fixed. `license` is optional in the Agent Skills specification, this
tree has mixed provenance, and third-party attribution lives in `licenses/NOTICE`. A uniform
per-skill value would misstate the provenance of an adapted skill.

## Per-skill install

`gh skill install` accepts an exact repository path, which skips a full tree traversal. At 614
skills that matters.

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-core/skills/askme \
  --agent claude-code --scope user
```

## Codex marketplace

Run against an isolated `CODEX_HOME` so no user configuration changed. codex-cli 0.151.0. Historical run, recorded 2026-09-01 against releaseVersion 2.0.0; output below is verbatim from that run.

```shell
$ codex plugin marketplace add /tmp/odin-ship-v2
Added marketplace `odin-marketplace` from /tmp/odin-ship-v2.
Installed marketplace root: /tmp/odin-ship-v2

$ codex plugin add odin-core@odin-marketplace --json
{
  "pluginId": "odin-core@odin-marketplace",
  "name": "odin-core",
  "version": "2.0.0",
  "installedPath": ".../plugins/cache/odin-marketplace/odin-core/2.0.0",
  "authPolicy": "ON_USE"
}
```

All 16 `odin-core` skills materialized under the install cache, which proves Codex resolved the
fixed `skills/` location from the root manifest without the manifest declaring it. (Run recorded 2026-09-01, before the Agent Plugins surface was retired; no root manifest ships anymore, and the same default now resolves through `.codex-plugin/plugin.json` in Legacy format.)
`codex plugin list --json` then reported the plugin installed and enabled, with
`installPolicy: AVAILABLE` and `source.path: /tmp/odin-ship-v2/plugins/odin-core`.

One quirk worth recording: before an install, `codex plugin list` reports `available: []` for a
freshly added local marketplace. Installing by name from that same marketplace works, so this is a
listing behavior rather than a manifest defect.

## Claude Code marketplace

Run against an isolated `CLAUDE_CONFIG_DIR`. No user configuration changed.

Historical run, recorded 2026-09-01 against releaseVersion 2.0.0. Output below is verbatim from that run.

```shell
$ claude plugin marketplace add /tmp/odin-ship-v2
✔ Successfully added marketplace: odin-marketplace

$ claude plugin install odin-core@odin-marketplace
✔ Successfully installed plugin: odin-core@odin-marketplace (scope: user)

$ claude plugin list
  ❯ odin-core@odin-marketplace
    Version: 2.0.0
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
