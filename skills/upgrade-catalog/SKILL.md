---
name: upgrade-catalog
description: 'Use when a user asks to update or converge their installed ODIN module catalog to current. Retires renamed skills, adds missing catalog entries, refreshes the rest, and wires idempotent discovery hooks — all shown and confirmed before anything changes.'
---

# Upgrade catalog

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to update, upgrade, or converge their installed ODIN module catalog to current. |
| Authority | Reversible-local: after explicit plan approval, removes stale names, installs missing catalog entries, refreshes present ones, and wires idempotent backed-up version-pinned discovery hooks; rollback is restoring the pre-run backup. |
| Side effect | Local-write only, after explicit plan approval: removes stale skill names, installs missing catalog entries, refreshes present ones, wires idempotent backed-up version-pinned discovery hooks; unknown installed names and foreign hooks are never touched. |
| Done | Reconciliation plan printed and approved first with the add(new-to-local-catalog) group named in full; no deprecated name remains; full catalog installed; unknown names untouched; retry/fallback skills verified present; hooks idempotent with foreign hooks untouched. |

## Inputs

- Install scope (required): which harness and scope ODIN is installed under: global plugin install, project install, or exact-agent install. If the user has not said which, ask before classifying.
- Installed ODIN version (required): read from the installed plugin manifest at `.claude-plugin/plugin.json`.
- Current ODIN release (required): the latest published version and its skill catalog, derived from the release tag's `skills/` directories.

## Procedure

1. Pick one install scope and keep it for the whole run. If the user has not said which, ask; do not assume: a scope mismatch reads the wrong install location, classifies the entire catalog as missing, and proposes installing all of it into a scope where the user's skills do not actually live.
   - global plugin install: read with the harness's plugin list command (e.g. `claude plugin list` for Claude Code, `codex plugin list` for Codex), inspect the installed skills directory, and use global scope on every command;
   - project install: read from that project's plugin configuration and installed skill directory if present;
   - exact-agent install: use only explicit agent identifiers, never a wildcard.
   **Done when:** one install scope is chosen and held for the whole run.
2. Before classifying, rule out a shadow install. The skill runs as an ODIN skill, so ODIN is loaded; if the plugin list for the chosen scope reports zero ODIN skills, that contradicts a provable fact, and the ordinary whole-catalog-missing plan would rest on a false premise. Do not emit it. Check the managed footprint: does the chosen scope's plugin directory hold any current-catalog skill?
   - It does: the install is managed and the CLI read the wrong place or hiccuped. Re-check the scope from step 1 and retry the list. If a correct-scope retry still contradicts the on-disk footprint, report the CLI failure and stop rather than guessing; never treat a flaky or mis-scoped read as nothing installed.
   - It does not, yet ODIN is loaded. This is a shadow install: the repo was placed some other way (typically a git clone that the harness loads as a plugin) with no managed entry, so the CLI cannot see, update, or remove it. STOP and report it doctor-style instead of classifying: offer two consented paths: a managed reinstall (recommended: install via the harness marketplace command under the chosen scope, so the CLI can track it and future upgrades and the discovery notice reach the user) or keep the clone (left untouched, noting it stays CLI-invisible and every upgrade-catalog run re-flags it). Change nothing until the user picks; never delete the clone or install a second copy without an explicit choice.

   Once the install is confirmed managed, read the installed state and cross-reference both installed skill names and installed directory slugs against the Deprecations table and the Current catalog below:
   - stale: installed entries or directory slugs in the Deprecated column;
   - missing: Current catalog skills not installed, after resolving each deprecation chain to its final name (a replacement already installed under its new name counts as present, not missing);
   - present: Current catalog skills already installed and not deprecated;
   - unknown: installed names that are neither current catalog nor deprecated; these stay untouched.
   **Done when:** every installed entry is classified as stale, missing, present, or unknown.
3. Report the full reconciliation plan before changing anything. State the target scope first (global / project / exact-agent), so a scope mismatch is visible at the gate before any install lands. Then the named groups:
   - retire: <stale names>;
   - add (new to the local catalog): <missing catalog skills>, including the replacement for every retired name. A subset refresh would skip this group, but full-catalog convergence adds it, so name it in full;
   - refresh: <present current ODIN skills>;
   - untouched: <unknown names>;
   - wire discovery notice: the present agents whose session-start hook will be pointed at the ODIN discovery notice (step 9), or none if the user declines it.
   **Done when:** the reconciliation plan is printed with the scope and all named groups.
4. Ask for explicit confirmation before any removal, install, or hook-wiring command. Convergence to the full catalog and wiring the discovery notice are both the recommendation, but the user may decline the whole run, decline just the wiring, or approve it as shown; nothing mutates before they do. **Done when:** explicit confirmation is received or the run is declined.
5. After confirmation, run only the commands the plan named, with the scope chosen in step 1:
   - upgrade the plugin to the latest published version via the harness's plugin upgrade command (e.g. `claude plugin marketplace upgrade` then `claude plugin install odin@odin-marketplace` for Claude Code; `codex plugin marketplace upgrade` then `codex plugin add odin@odin-marketplace` for Codex), which brings all new and refreshed skills as a unit;
   - remove stale directory slugs for retired names that linger after the upgrade, using the harness's plugin removal command or direct directory removal of the deprecated slug only;
   - if the harness supports per-skill installation, enumerate each missing catalog name individually rather than using a bulk install, so the install is defined by this skill's Current catalog.
   **Done when:** all planned commands are run with the chosen scope.
6. If the upgrade command reports that a specific skill failed, retry that skill alone with the same scope; if it still fails, confirm with the user by name, then remove and reinstall it, rather than leaving the catalog incomplete or a skill stale. **Done when:** every skill is installed or the failure is escalated.
7. Verify with the harness's plugin list: no deprecated name remains, every Current catalog skill is now installed, unknown names were left untouched, and any skill that took the retry/fallback path is actually present. **Done when:** verification confirms no deprecated names, full catalog present, unknown names untouched.
8. Tell the user how their current session picks up the change: Claude Code applies updated SKILL.md content in the current session automatically, no restart needed, unless a different already-running Claude Code session shares the same install, in which case run /reload-skills in that other session. Codex has no in-session reload; restart Codex (or codex resume) to pick up the change. For any other agent, restart its session if the new behavior does not show up. **Done when:** the session-pickup instructions are delivered.
9. Auto-wire the session-start discovery notice, unless the user declined it in the plan, so a future release's new skills reach the user without manual setup. For each agent actually present on the machine:
   - Place the notice runtime under the ODIN runtime directory by fetching it from the pinned release tag, never main: the discovery script from the installed version's tag.
   - Claude Code (`~/.claude/settings.json`) and Codex (`~/.codex/config.toml`): add a SessionStart command hook that runs the placed discovery script, only if no ODIN discovery hook is already wired, i.e. no existing SessionStart command runs a discovery script by any path. (A pre-rename install stays wired to its own runtime and keeps working; never add a second hook; two would double-fire the notice.) Back the config up first.
   - OpenCode (`opencode.json`/`opencode.jsonc`): add the placed discovery script to the plugin array only if no discovery script entry (by any path) is already present. Back the config up first.
   - Wire only these three: Copilot CLI ignores session-start hook output, Antigravity CLI has no session-start event, and Grok Build's hook format is unverified; none can carry the notice today, so skip them.
   - Never delete or overwrite another tool's hook; on a conflicting entry, report it doctor-style and leave it. State exactly what was wired, in which files, and how to unwire.
   **Done when:** discovery hooks are wired for present agents or the user's decline is honored.

### Deprecations

This ordered table is the rename SSOT. Append future renames here in release order. Resolve deprecation chains to the final current skill before installing replacements.

| Deprecated | Renamed to | Since |
|---|---|---|
| (none currently) | | |

### Current catalog

Every skill in the convergence target must be installed under the chosen scope after a run, except those the user declined at the confirmation gate. Derive the current catalog from the latest published plugin version: every skill directory under `skills/` at the current release tag, spanning the ten ODIN modules in lockstep. Use this derived set to separate current ODIN skills from unknown installed names when parsing the plugin list and installed skill directories.

## Failure and recovery
- **Missing install scope**: stop and ask the user which scope ODIN is installed under; do not assume. A scope mismatch classifies the entire catalog as missing and proposes installing into the wrong location.
- **Shadow install**: running from a clone yet the plugin list shows zero ODIN; stop and report doctor-style; offer managed reinstall or keep the clone; never duplicate-install, delete the clone, or classify the catalog as missing without an explicit user choice.
- **CLI failure or flaky read**: if a correct-scope retry still contradicts the on-disk footprint, report the CLI failure and stop rather than guessing; never treat a flaky or mis-scoped read as nothing installed.
- **Install or update failure for a specific skill**: retry that skill alone with the same scope; if it still fails, confirm with the user by name, then remove and reinstall it; never leave the catalog incomplete or a skill stale.
- **Unparseable installed-skill list**: stop and report the ambiguity instead of guessing.
- **Discovery-hook conflict**: never delete or overwrite a foreign hook; report it doctor-style and leave it.
- Partial results are valid when each group's outcome is reported explicitly. Rollback is restoring the pre-run config backups and reinstalling the previous plugin version; the target install is never left in a half-converged state without a reported gap.

## Output
Reconciliation plan (scope, retire, add, refresh, untouched, discovery-notice wiring), executed commands and results, verification report (no deprecated names, full catalog, unknown names untouched, retry/fallback present, hooks idempotent), and any skipped step or unresolved ambiguity.

## Provenance

Origin: https://github.com/LilMGenius/paperthin, skills/breadth/re0-upgrade/SKILL.md, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317. License: MIT (c) 2026 LilMGenius; NOTICE additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. This is a clean-room adaptation: the foundry does not copy verbatim vendor material. Adaptation: re-targeted from paperthin's npx-skills installer to the ODIN harness plugin installer; preserved the rename/deprecation SSOT, shadow-install detection, confirmation gate, and idempotent backed-up version-pinned discovery-hook wiring; dropped the silent auto-star step (gh api PUT user/starred) as a non-consented side effect.
