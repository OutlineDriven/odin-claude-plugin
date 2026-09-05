---
name: retaxonomize-plugins
description: 'Use when skills must move between plugins, or plugins be created, merged, or retired. Not for reordering a listing, use reorder. Not for retiring a code path, use deprecate-and-migrate.'
---

# Retaxonomize plugins

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Skills must move between plugins, or plugins must be created, merged, or retired, in a marketplace whose plugin manifests, registries, and READMEs are generated from one catalog. |
| Authority | Reversible local: writes only the plugin tree, the catalog, the guard rule, and generated surfaces; rollback is version control. No remote mutation. |
| Side effect | Moves skill directories with `git mv`, deletes emptied plugin directories, rewrites the catalog entries, replaces retired ids in authored files, and regenerates every generator-owned surface. |
| Done | Every skill sits in exactly one target plugin, no retired id survives outside version history, the catalog carries the new entries under one stated ordering principle, every generated surface matches its generator, and the tree's own gates exit 0. |

## Inputs

- The assignment map (required): every skill slug paired with exactly one target plugin id, and the list of plugin ids to retire. A slug missing from the map, or present twice, stops the run before any move.
- The ordering principle for the catalog (required): the sentence that decides where a new plugin sits, so a later addition has one obvious home.
- The set of authored files where ids may be replaced (required): typically the root context file, the root README, `docs/`, and skill bodies. Version history, root registries, plugin dotdirs, and generated manifests are never in the set.

## Procedure

1. Prove the map is total. Count the skill directories on disk, count the map's slugs, and require the two sets to be equal with no slug assigned twice. Record the counts. Done when: the on-disk slug set equals the map's slug set and the retired-id list names only plugins that end up empty.

2. Create every target plugin directory before the first move: `mkdir -p plugins/<id>/skills` for each new id. A move into a missing directory renames the skill directory to the target path instead of nesting it. Done when: every target `skills/` directory exists.

3. Move each skill whose target differs from its current home with `git mv plugins/<source>/skills/<slug> plugins/<target>/skills/<slug>`. Done when: `find plugins -name SKILL.md | wc -l` prints the same count as step 1 and no slug appears under two plugins.

4. Inventory each retired plugin directory with `ls -A`. It may hold only an empty `skills/`, the generated `README.md`, `LICENSE`, and `NOTICE`, and the harness dotdirs. Any other file is authored content that step 1 missed; stop and extend the map. Delete the inventoried directories with `rm -rf` (tracked, so version control restores them). Done when: every retired directory is gone and the SKILL.md count is unchanged.

5. Rewrite the catalog. Replace the `entries` array with one entry per surviving plugin, ordered by the stated principle, and leave `releaseVersion` alone. Each entry carries `index` (1-based, equal to its position in the array), `id`, `display_name`, `description`, `category`, `tags`, `homepage`, and `directory` (`plugins/<id>`). Copy `homepage` from a surviving sibling, or from the catalog `repository` URL. Done when: the catalog lists exactly the surviving plugins, every `index` matches its position, every required field is present, and the ordering principle is written into the change description.

6. Replace retired ids in the authored file set only. Build one regex from the retired ids, longest first, with an id-character boundary on both sides (`(?<![a-z0-9-])` before and `(?![a-z0-9-])` after), so a retired id that is a prefix or suffix of a surviving id never matches inside it. Exclude version history and every generated surface. Done when: the regex finds nothing in the authored set and the excluded files are byte-identical.

7. Repair every literal path inside a gate script that names a moved skill, for example an allowlist that holds `plugins/<old>/skills/<slug>/SKILL.md`. Edit only those literals. Done when: each gate script resolves every path it names to a file that exists.

8. Add or confirm the guard: a rule in the root context file stating what a plugin id names (a job or a stack, never a tier), and an assertion in the surface checker that rejects a plugin id carrying the `-advanced` tier suffix (extend its pattern when a new tier word appears). Prove the assertion fires by renaming one plugin to a tier-suffixed id, running the checker, reading its non-zero exit, and reverting. Done when: the guard is proven to fire and the tree is back to its intended state.

9. Regenerate every generator-owned surface with the project's render task, then run its check mode. Done when: the check reports every generated file in sync and `git status` shows no hand edit under a generated path.

10. Rewrite the hand-authored install examples and count prose in the root README, and update every count literal the run changed. Recompute counts from generator output, never by hand. The generated `## Plugins` table is owned by `just render`; do not hand-edit it. Done when: no retired id and no stale count remains in the authored set.

11. Run the tree's gates: frontmatter, routes, manifests, generated surfaces, voice, and the installer's dry run over the whole tree. Done when: every gate exits 0.

12. Commit the moves, catalog, id replacements, guard, and regenerated output as one change whose message carries the retired-to-surviving id table. Done when: the commit exists and `git status` is clean.

## Failure and recovery

- Missing target directory: a `git mv` into a nonexistent `plugins/<id>/skills/` renames the source directory to that path. Detect it by a SKILL.md count that still matches while a plugin directory is missing its `skills/` child; move the misplaced directory into place and repeat step 3.
- Emptied plugin still holding an authored file: step 4 found a file outside the generated set. Stop, add the file's skill to the map, and rerun from step 3. Never delete an authored file to make the inventory clean.
- Id regex matching a longer id: a surviving id that contains a retired id was rewritten. Restore the affected files from version control, add the boundaries on both sides, and rerun step 6.
- Stale allowlist path inside a gate script: a gate that names a moved path now fails or, worse, silently skips the file. Repair the literal in step 7; never widen the allowlist to a glob to make the gate pass.
- Hand edit to a generated surface: the check in step 9 reports drift. Discard the hand edit, change the generator or the catalog, and regenerate.
- Non-convergence: if a gate still fails after the repairs above, return the failing gate's output and the exact map row or file that produced it. Do not commit.

## Output

One commit on the working branch: the moved skill tree, the rewritten catalog, the id replacements in authored files, the guard rule and assertion, and every regenerated surface. A report naming the retired-to-surviving id table, the move count, the count literals updated, and the verbatim exit lines of every gate run in step 11.
