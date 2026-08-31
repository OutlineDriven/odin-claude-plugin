# Install proof

Each supported surface, exercised against this tree rather than read from a document. Run
2026-09-01 on branch `feat/skill-foundry-2.0-source`.

`docs/specs/distribution-surfaces.md` carries the specifications and their citations. This file
carries only what was executed and what it returned.

## Agent Plugins standard

The GitHub CLI validates every skill against the Agent Skills specification, which the Agent
Plugins specification adopts for skill format.

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

`gh skill install` accepts an exact repository path, which skips a full tree traversal. At 616
skills that matters.

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-core/skills/askme \
  --agent claude-code --scope user
```

## Codex marketplace

Run against an isolated `CODEX_HOME` so no user configuration changed. codex-cli 0.151.0.

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
fixed `skills/` location from the Agent Plugins manifest without the manifest declaring it.
`codex plugin list --json` then reported the plugin installed and enabled, with
`installPolicy: AVAILABLE` and `source.path: /tmp/odin-ship-v2/plugins/odin-core`.

One quirk worth recording: before an install, `codex plugin list` reports `available: []` for a
freshly added local marketplace. Installing by name from that same marketplace works, so this is a
listing behavior rather than a manifest defect.

## Claude Code marketplace

Run against an isolated `CLAUDE_CONFIG_DIR`. No user configuration changed.

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

Two things are therefore still unproven, and neither is a property of this branch. Cursor's plugin
cache is unwritable under the sandbox this session runs in. Cursor also indexes a repository rather
than a ref, so the `.cursor-plugin/marketplace.json` it would read is the one on the default branch,
not the one on this feature branch. The registry itself is generated to the documented schema with
repository-relative sources and is asserted by `check-plugin-surfaces`; what remains untested is
Cursor's parse of it, and that test needs a merge plus a writable cache.

## Manifest name parity

Codex resolves a plugin's manifest from the root `plugin.json` but resolves its namespace from the
dotdir list only, never the root file. If `plugin.json` and `.claude-plugin/plugin.json` carry
different names, Codex namespaces the plugin under one name and loads its components under
another.

`check-plugin-surfaces` asserts the parity. The assertion is mutation-verified: changing one
plugin's `.claude-plugin/plugin.json` name produced exactly one `name differs` error, and
regenerating restored a clean run.
