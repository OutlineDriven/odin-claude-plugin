# Skill lifecycle

A skill slug owns these states. The boundary runs from the first authored `SKILL.md` under a plugin
to one of three terminals: shipped, merged into a survivor, or purged. Nothing outside that slug is
modeled here, and the machine says nothing about what a skill does once a consumer installs it.

Every guard below is either a gate command this repository already runs or an adjudication record it
already keeps. That is the point of writing the ladder down: a state becomes provable instead of
asserted, and a skipped rung becomes a named illegal transition instead of an oversight nobody
noticed. The gates themselves live in `.pre-commit-config.yaml`.

## States

| State | Entry condition | Outgoing |
|---|---|---|
| Drafted | A `SKILL.md` exists at `plugins/<plugin>/skills/<slug>/` and no gate has cleared it | T1, T5, T6 |
| Contracted | Frontmatter name equals the directory name, parses under a strict YAML parser, and its description states a trigger a model can route on | T2, T7 |
| Manifested | `agents/openai.yaml` is generated and matches the frontmatter it derives from | T3, T7 |
| Routable | The voice contract and the route gate both pass, and any licensed upstream carries its notice | T4, T7 |
| Quarantined | A gate reports red, and the skill is held out of the release rather than shipped broken | T8 |
| Restored | A write verification failed and the checkpoint bytes are back in place | T10 |
| Shipped | The skill is reachable through the plugin manifest and all three registries | terminal |
| Merged | Its content is folded into a named survivor, its slug is retired, and provenance is kept | terminal |
| Purged | Its slug is retired with no survivor | terminal |

## Transitions

| # | From | To | Event | Guard | Outcome |
|---|---|---|---|---|---|
| T1 | Drafted | Contracted | The frontmatter gate runs | `check-skill-frontmatter` exits 0 and the name equals the directory | The installer will not drop the skill |
| T2 | Contracted | Manifested | The generator runs | `render-skill-manifests --check` exits 0 | The Codex surface carries the skill |
| T3 | Manifested | Routable | The prose and route gates run | `check-voice` and `check-skill-routes` both exit 0, and `licenses/NOTICE` covers any upstream | A model can route to the skill |
| T4 | Routable | Shipped | The surface render runs | `check-plugin-surfaces` exits 0 and all three registries carry the plugin | The skill installs from every surface |
| T5 | Drafted | Merged | Dedup adjudication closes | A survivor is named, its body carries the folded content, and the notice keeps the provenance | One skill stands where two did |
| T6 | Drafted | Purged | Purge adjudication closes | The skill is classified as template filler, environment-bound, or narrow novelty, and no consumer references it | The slug is gone |
| T7 | Contracted, Manifested, or Routable | Quarantined | A gate reports red | The failing gate and its exact output are recorded | The skill is held out of the release |
| T8 | Quarantined | Contracted | The defect is fixed | The gate that failed now exits 0 | The skill re-enters the ladder at the rung it fell from |
| T9 | Any state except Restored | Restored | A write verification fails | The checkpoint bytes compare equal to the tree | The tree is unchanged |
| T10 | Restored | Drafted | Work resumes | The tree matches its checkpoint | The ladder starts again with the defect known |

## Terminal outcomes

| State | Observable result |
|---|---|
| Shipped | The slug appears in `plugins/<plugin>/plugin.json` and in all three marketplace registries, and `check-plugin-surfaces` confirms byte parity with the catalog |
| Merged | The slug's directory is gone, the survivor's body carries its content, and `licenses/NOTICE` still names the upstream it came from |
| Purged | The slug's directory is gone, no survivor claims its content, and no file in the tree references it |

## Illegal transitions

| Forbidden pair | Why |
|---|---|
| Drafted to Shipped | Skips contract, manifest, and routing at once, so the installer may drop a skill nobody checked |
| Contracted to Shipped | The manifest would be stale against the frontmatter it claims to describe |
| Manifested to Shipped | Skips the prose and route gates, so a skill can ship that no model can route to |
| Drafted to Manifested | Hand-writing a generated manifest, which the next render silently reverts |
| Merged to Shipped | A retired slug resurfacing as its own skill, which duplicates the survivor |
| Purged to Merged | Purged means no survivor exists to fold content into |
| Purged to Shipped | Same reason, one rung later |
| Quarantined to Shipped | Ships a skill whose gate is red |
| Routable to Merged | Discards gate-clean work with no adjudication behind the decision |
| Restored to Shipped | A restored tree has no verified ladder behind it |

## Completeness

Four properties hold, and each is checkable by reading the tables above.

Every state has at least one outgoing transition except the three terminals. Every path from Drafted
reaches a terminal, including the paths through Quarantined and Restored, because T8 and T10 both
return to a rung rather than dead-ending. No two transitions leaving the same state share an event
and a guard. Every guard names either a command with an exit code or a record with an author.
