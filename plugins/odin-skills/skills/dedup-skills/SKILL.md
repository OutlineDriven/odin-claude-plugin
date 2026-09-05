---
name: dedup-skills
description: 'Use when asked to deduplicate a skill tree, fold overlapping skills, or cut the skill count: analyze, gate per family, then fold. Not for prompt-doctrine cascades: use cascade-dedup.'
disable-model-invocation: true
---

# Dedup skills

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to deduplicate a skill tree, fold overlapping skills, or cut the skill count. |
| Authority | Human-gated: requires explicit human invocation; the analyze phase writes only the fold ledger; the dedup phase runs only on an explicit user command naming approved families and then writes skill directories, descriptions, the attribution file, the changelog, and generated surfaces, one commit per family; rollback is `git revert` of that commit. No remote mutation. |
| Side effect | A fold ledger, then per approved family: the survivor absorbs the members' unique steps, the members are deleted, pointers are rewritten, attribution and changelog are updated, and generated surfaces are re-rendered. |
| Done | Every family in the ledger carries a decision; every approved family is folded in its own commit; the checker reports no dangling pointer; the removed count and the remaining count are measured, not projected. |

## Inputs

- Target tree path (default `plugins/`). Every `<plugin>/skills/<slug>/SKILL.md` under it is a skill.
- The tree's attribution file (`licenses/NOTICE` or equivalent), read in full before scanning. A license-covered skill is a fold candidate like any other; the attribution follows the text.
- Reduction floor (optional): a count or percent the fold must clear. The floor never loosens the fold criteria; a shortfall is reported at the gate.

## Fold criteria

Two skills belong to one family when a user asking for one would accept the other's procedure with a parameter changed. Three evidence sets, in priority order:

1. Pointer neighbors: descriptions that route to each other through `Not for <x>: use <y>`. Adjacency is evidence, not proof; a component that chains distinct jobs (implement, test, ticket) is several families or none.
2. Parameter siblings: slugs that differ by one axis (`from-<seat>-perspective`, `watch-<mode>`, `culture-<situation>`), whose procedures share every step except the parameterized one.
3. Mode siblings: skills whose descriptions differ only by a mode word (`exhaustive`, `batch`, `interview`) over one procedure.

The survivor is the member with the most general name. A member's unique steps enter the survivor as an input or a named mode, never as a second procedure. No alias directory, stub `SKILL.md`, or redirect survives a fold.

## Procedure

### Analyze

1. Enumerate the tree: every skill directory, its plugin, its frontmatter description, and whether the attribution file names it. Done when: the count is measured and each skill carries its plugin, description, and attribution source.
2. Build the pointer graph from every description's `use <slug>` targets and list its connected components. Done when: every component is listed with its members.
3. Propose families from the three evidence sets. For each family record the survivor, every member path, the `Vendored: <source>` annotation for each license-covered member, the unique steps the survivor absorbs, the steps dropped and why, and every description whose pointer must be rewritten. Reject a candidate whose members do different jobs, and record the rejection in one line. Done when: every family and every rejected candidate is recorded.
4. Write the fold ledger with a `Projected remaining: <n>` header and one `## Family <name>` section per family. If a floor was supplied and the projection misses it, state the shortfall in the header. Done when: the ledger is written and the projection is stated against the floor.

### Gate

5. Present the ledger and stop. Ask one question per family: approve or strike. Record each answer as a `Decision: approved|struck` line in that family's section. Nothing in the tree changes in this phase. Done when: every family carries a decision, or the user ends the gate with families undecided and the run reports them as open.

### Dedup

6. For each approved family, in ledger order: rewrite the survivor so its description names the absorbed seats or modes inside the description cap and its procedure carries the absorbed steps as inputs or modes; delete every member directory; rewrite every pointer the ledger listed; drop retired names from the attribution lists and add the source of any absorbed licensed text to the survivor's entry; add the retired slug and survivor to the changelog's retired-skill table; re-render generated surfaces; run the tree's checks; commit as `Fold <members> into <survivor>`. Done when: the commit exists and the checks passed on it.
7. Measure: count skill directories, compute the percent removed against the count from step 1, and confirm the checker reports no dangling pointer. Done when: the measured count, percent, and check result are recorded in the report.

## Failure and recovery

- Empty or missing target tree: stop before scanning; report that no skill was found. No ledger is written.
- Candidate whose members do different jobs: reject it in the ledger with the reason; never fold to reach a floor.
- Floor not reachable from defensible families: state the shortfall in the ledger header and at the gate; the user lowers the floor or accepts the shortfall. The fold criteria do not change.
- Gate ended with undecided families: report them as open; fold only the approved ones.
- A fold commit fails the tree's checks: fix inside that commit before the next family; if the family cannot pass, revert its commit and mark the family `Decision: struck` with the failing check named.
- Rollback: `git revert` of one fold commit restores one family; the ledger is a local artifact and is discarded to restore the pre-run state.

## Output

Analyze: the fold ledger with the projected count against the floor. Gate: one decision per family recorded in the ledger. Dedup: one commit per approved family, the measured remaining count and percent removed, the checker result, and the list of struck or open families.
