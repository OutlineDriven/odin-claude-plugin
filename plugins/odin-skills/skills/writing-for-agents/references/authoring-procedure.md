# Authoring procedure

The write path: the ordered operation that creates or changes a skill directory on disk. The
levers in `SKILL.md` decide what the document should be; this file is how the change lands.

Build the smallest skill that makes one user job reliable. A skill earns its directory through a
distinct trigger and procedure, not through a topic label.

## Boundaries

- Write only the requested local skill artifacts and the repository-owned registration or
  attribution surfaces they require.
- Do not publish, install, commit, or mutate remote state unless the user separately asks for that
  operation.
- Do not create a second skill when an existing skill can own the job without splitting its method.
- Do not preserve an old name, route, or layout after every live caller has moved.

## Procedure

1. Classify the change as create, port, rephrase, upgrade, merge, or split. Name the user job,
   input, observable result, authority, and non-goals. Stop if those facts do not define one
   coherent operation.
2. Search the local skill set by trigger, promised result, and method. Deepen or merge an existing
   skill when it already owns the job. Create a new directory only when the job and procedure are
   both distinct.
3. Read the repository's skill conventions, one strong neighboring skill, and every live route to or
   from the target. Preserve repository-owned schema and registration rules; do not copy a
   neighboring skill's domain language.
4. For a port, read the upstream skill and its license at a pinned revision. Separate portable
   method from vendor names, harness syntax, obsolete paths, and promotional framing. Record
   required credit in the repository's canonical notice or attribution source. Do not invent a
   per-skill provenance file when the repository owns attribution elsewhere.
5. Write the routing contract before the body:
   - `name` matches the directory exactly and uses lowercase words with single hyphens.
   - `description` states positive triggers, the result, and the nearest negative route in third
     person.
   - the authority boundary names every local, remote, paid, credential, publication, or
     destructive effect.
   - the completion condition is observable and belongs to this skill alone.
6. Design one chronological procedure from validated input to the completion condition. Name
   decisions where the agent could otherwise guess. Keep hard bans explicit. Remove generic step
   receipts, ceremonial phase tables, and repeated "done when" text that add no decision or check.
7. Keep `SKILL.md` below 500 lines. Move bulky catalogs, schemas, and branch-specific rules into
   one-level `references/` files, and name the exact condition that loads each file. Add an
   `assets/` template only when output plan is contractual.
8. Add a `scripts/` program only for deterministic work that prose handles badly, such as parsing,
   validation, or repetitive generation. Give it a narrow CLI, useful errors, no hidden network
   calls, and a direct behavioral check. Do not create empty directories.
9. Add or regenerate the harness manifest and membership entry required by the repository. Keep the
   display name unique and the short description useful at list-view length.
10. Migrate all live inbound and outbound routes. Delete absorbed skill directories, stale aliases,
    obsolete references, and dead registration rows in the same change.
11. Validate metadata, directory-name identity, relative links, route reachability, reference load
    conditions, script behavior, registration, and the repository's native gate. Repair the source
    of each failure; do not weaken the gate.

## Failure and recovery

| Failure | Action |
|---|---|
| The job is not distinct | Merge it into the current owner or report that no new skill is justified. |
| The source license is absent or unclear | Preserve an explicit no-license acknowledgement and do not claim reuse rights. |
| A required route target does not exist | Stop the cutover, restore a reachable route, and re-run route validation. |
| Validation fails after creating files | Remove only the uncommitted artifacts created by this run, repair the contract, and validate again. |
| The request would publish or destroy state | Stop at the local artifact unless the user explicitly authorizes that separate operation. |

## Output

Return the changed skill paths, the user job each skill now owns, merge or deletion decisions,
attribution changes, and the exact validation evidence.
