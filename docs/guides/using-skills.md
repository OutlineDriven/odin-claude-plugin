# Using skills

## Invoke one skill

Type the skill's name before a request, in the form your harness uses:

| Harness | Explicit invocation | Example |
|---|---|---|
| Claude Code | `/<plugin>:<slug>`; plugin skills are namespaced by plugin id | `/odin-planning:todos-update` |
| Codex | `$<slug>`, or `/skills` to pick from a list | `$todos-update` |
| Cursor | Type `/` and pick the skill by name | `/todos-update` |

Grok and Kimi load the same skill tree; each harness's own documentation gives its explicit-invocation form. The guides in this directory write a step as `/skill:<slug>` when the harness does not matter.

Names are exact: `todos-update` loads one skill, and a near miss loads nothing.

## Stack invocations

Several invocations in one message stack in the order you wrote them. This is the dominant pattern in real use: transcripts show 96 distinct multi-skill stacks, up to 20 skills in one message. Order them the way you want them applied.

## Match by trigger

A skill can also load when your request matches its description trigger. Every description opens with a routing phrase such as `Use when`, and `scripts/check-skill-routes.mjs` rejects a description that states no trigger. When you phrase a request as the situation a skill names, that skill loads without an explicit invocation.

The exception is the 334 skills whose frontmatter sets `disable-model-invocation: true`, such as `work`, `commit-push-current`, and `publish-branch`: these run only when you invoke them by name, so the model never starts a side-effecting workflow on a phrase match.

## Pass arguments

Words after the invocation pass through to the skill, including file references. Two shapes from real transcripts:

```text
/odin-writing:unslop @skills/
```

```text
/odin-writing:unslop clean this draft local://skill-foundry-plan.md
```

Point the skill at the material and state the job in the same line.

## Choose between overlapping skills

Most descriptions end with a `Not for ...` clause that names the narrower skill. Read it and reach for the narrower one.

`todos-update` resyncs a task list that drifted from the tree. `todos-enhance` sharpens tasks that read as vague headings. Each names the other as out of scope, so a stale list calls for the first and a coarse list calls for the second.

`unslop` cleans AI tells from prose. `deslop` removes dead code and config from a diff. Prose calls for the first and code debris calls for the second.

## Prove a gap

When no skill fits, run `skill-gap-finder`. It names the owning skill or writes a missing-skill brief that proves the gap. It never invokes the match; you decide what to do with the answer.

## Install one skill

`gh skill install` installs a single skill by its exact repository path, per the Individual lane of the root README Install section:

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-planning/skills/askme \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Prefer this when one trigger is all you need from a large plugin.

Any claim about harness behavior beyond this page needs a check against `docs/specs/distribution-surfaces.md`, which carries tiered, dated evidence for each surface.
