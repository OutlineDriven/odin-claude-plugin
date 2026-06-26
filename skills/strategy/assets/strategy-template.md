# Strategy template — STRATEGY.md skeleton

Read after the interview clears the reject-by-default gate. Fill with captured answers and write to `$root/STRATEGY.md` (the operating repo root resolved in the SKILL's Phase 0).

## Rules for filling in

- Use the user's own language. Don't paraphrase into generic PM-speak.
- Each section stays compact — the whole doc reads in under 5 minutes.
- Section order is locked. Don't add top-level sections.
- Optional sections (milestones, non-goals, marketing): delete entirely if unused. Never leave an empty header.
- Set `last_updated` in the frontmatter to today's ISO date (YYYY-MM-DD). Don't repeat the date in prose.
- Set `name` in the frontmatter to the product or initiative name — the same value as the H1.

## Template

The block below is the literal file to write (minus this line and the fences). Replace every `{{placeholder}}`. Delete any optional section whose placeholder wasn't answered.

~~~markdown
---
name: {{product_name}}
last_updated: {{YYYY-MM-DD}}
---

# {{product_name}} Strategy

## Target problem

{{1-2 sentence diagnosis. Names the user situation and the crux that makes it hard. No solution language.}}

## Our approach

{{1-2 sentence guiding policy. What this product commits to, so the target problem becomes tractable.}}

## Persona

**Primary:** {{Persona name}} — {{one-sentence JTBD, e.g. "They're hiring {{product_name}} to..."}}

<!-- Add a secondary persona only if truly necessary. Fewer is better. -->

## Key metrics

- **{{metric 1}}** — {{one-line definition; where it's measured}}
- **{{metric 2}}** — {{...}}
- **{{metric 3}}** — {{...}}

<!-- 3-5 total. Stop at 5. Each must be able to regress. -->

## Tracks

### {{Track 1 name}}

{{One line: the investment area, not a feature list.}}

_Why it serves the approach:_ {{one line}}

<!-- 2-4 tracks total. If you can't hold it to 4, fold related tracks together. -->

## Milestones

- **{{YYYY-MM-DD}}** — {{milestone}}

<!-- Optional. Delete the section if unused. Externally visible only: launches, fundraises, conferences, renewals. -->

## Non-goals

- {{one line per item}}

<!-- Optional. Delete the section if unused. Only things the team keeps being tempted by. -->

## Marketing

**One-liner:** {{single-sentence pitch}}

**Key message:** {{2-3 lines if useful}}

<!-- Optional. Delete the section if unused. -->
~~~

## Post-write checklist

Before confirming the write, scan the draft for:

- [ ] Frontmatter at the top with `name` and `last_updated`.
- [ ] `last_updated` is today's ISO date (YYYY-MM-DD).
- [ ] No section over 4 sentences except Tracks (each track its own short block).
- [ ] No `{{placeholder}}` remains.
- [ ] Unused optional sections deleted, not left empty.
- [ ] Metric count 3–5; track count 2–4.
- [ ] Target problem and Our approach connect — one clearly responds to the other.
