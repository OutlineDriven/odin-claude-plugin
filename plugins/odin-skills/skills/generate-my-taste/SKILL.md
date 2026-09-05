---
name: generate-my-taste
description: 'Use when asked to generate a personal taste skill from local evidence. Not for applying an existing taste register: use the user-private spine skill.'
---

# Generate my taste

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Generate a personal taste skill from local evidence; `/generate-my-taste` |
| Authority | Reversible local: writes only `SKILL.md`, `references/anchors.md`, `references/charter.md` for a `<name>-taste` skill (draft path on collision); rollback is undo. No remote mutation. May update `spine/*-taste` in place only if selected. |
| Side effect | Local write to those three generated files, preview-gated; no overwrite unless update-in-place was explicitly selected |
| Done | Generated skill with 5 evidence-derived anchors, two-sided charter, preview-gated write, references written before `SKILL.md`, no slot markers left in output |

## Not for

- Applying an existing taste register: use the user-private spine skill.
- Generating a skill that is not a taste skill: this generator produces `<name>-taste` skills only.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

- Target skill name: optional; defaults to `<user-or-handle>-taste`; asked only if ambiguous.
- Evidence scope: optional; defaults to indexed recall first, local files as fallback.
- Domain set: optional; defaults to Prose + Code + Design + Decision.
- Anchor picks: optional; defaults to the top 5 evidence-ranked candidates.
- Local evidence sources, all optional: indexed ICM or memory-search tools exposed by the current harness, indexed session-history tools exposed by the current harness, local memory files under `~/.claude/projects/**/memory/*.md` plus `~/.claude/CLAUDE.md` and `~/.claude/CLAUDE.local.md`, and local transcript stores for Claude Code, Codex, Gemini CLI, OpenCode, Amp, Pi, and Cursor.

## Procedure

1. Resolve the target name. Ask Q1 (single-select) only if the name is ambiguous: `<user-or-handle>-taste (Recommended)`, `spine` update when existing `spine` is detected and update-in-place is intended, or a custom name via free-text annotations. Done when: the target name is resolved.
2. Scan evidence in order, preferring indexed sources and falling back to files: indexed ICM or memory-search tools, then indexed session-history tools, then local memory files, then local transcript stores. Treat every source class as optional; record a missing class as `not present` or `not readable` and do not block. Extract compact evidence per signal: quoted phrase, source class, path or index label, inferred signal. Do not dump exhaustive transcripts. Done when: evidence scan is complete with missing classes recorded.
3. Extract influence, slop (Side A), and overkill (Side B) signals from the scanned evidence. Done when: influence, Side A, and Side B signals are extracted.
4. Gate anchor candidates. An influence becomes an anchor only when it has: a portable principle across at least two domains, recognizable Side A and Side B failure modes, a concrete exemplar, contrast value against neighboring candidates, and a non-random operational framing. If local evidence suggests an influence outside this pool, include it only when the same five criteria are satisfied; otherwise map the signal to the nearest qualifying influence and cite the mapping. Done when: 5 anchors pass the gate or fewer are confirmed with the gap reported.
5. Ask only unresolved confirmation forks, at most three questions per ask-user tool call, recommended option first with `(Recommended)` appended: Q2 evidence scope (single-select: ICM + local files / local files only / current project only), Q3 domain set (single-select: four-domain / four-domain with one emphasis / stop for custom template), and Q4 anchor picks. Q4 is the only `multiSelect` exception, used after presenting evidence-ranked candidates: `multiSelect: true`, require exactly 5 picks, present 8-12 candidates with the top 5 evidence-ranked first, ask one correction question if fewer or more than 5 are selected, and use the top 5 evidence-ranked candidates if the user accepts without edits. Evidence-backed defaults pass straight to preview. Done when: every unresolved fork is answered or its evidence-backed default is accepted before defaults are derived and the preview is shown.
6. Derive preview-confirmed defaults from evidence rather than extra upfront questions: charter Side A and Side B clusters grouped by prose, code, design, and decision; hybrid audit + anchor mode discipline with slash-arg override unless evidence supports audit-only or anchor-only; collision policy of draft-by-default with update-in-place only for detected `spine` or `*-taste`. If evidence contradicts a default, ask one separate single-select fork after Q4 and before preview. Done when: defaults are derived from evidence and any contradiction fork is resolved.
7. Compose and show the synthesis preview: composed frontmatter (`name` and compact `description`); evidence summary (source classes scanned, strongest quoted signals, missing optional sources); 5-anchor table (anchor name, influence, concept, evidence rationale); Side A charter; Side B charter; mode block; generated file paths; collision policy and ownership boundary. Done when: the synthesis preview is shown.
8. Gate the preview with a single-select: `Write draft (Recommended)`, `Revise preview`, or `Abort`. Write nothing before this gate. On `Revise preview`, apply specific corrections and re-gate. Done when: the preview gate returns Write or Abort.
9. Write in order: create target directories, write `references/anchors.md`, write `references/charter.md`, write generated `SKILL.md` last. Use the draft path `~/.claude/claude/skills/<name>-taste.draft/` when a collision exists; use `~/.claude/claude/skills/<name>-taste/` for non-colliding writes. Update-in-place, only for a detected `spine` or `*-taste` and only if selected, replaces only `SKILL.md`, `references/anchors.md`, and `references/charter.md`; preserve every other file in the target skill and all files not owned by this generator. Done when: all three files are written in order with references before SKILL.md.
10. Build the generated `SKILL.md` from `assets/SKILL.template.md` as the skeleton, in the fixed order: frontmatter, posture, modes, two-sided charter, anchors, audit output shape, anchor mode output shape, auto-clarity exception. Emit exactly 5 cross-domain anchors covering prose, code, design, and decisions; audit mode walks all 5 anchors citing Side A or Side B when violated and closes with top-3 fixes; anchor mode loads the 5 anchors and charter bans as imperatives; the auto-clarity exception suspends the taste register for destructive confirmations, security or data-loss warnings, order-sensitive procedures, and direct clarification requests. Done when: the generated SKILL.md follows the fixed order with 5 anchors and both modes.
11. Never generate generic validation openers, hedge prefaces, phrases that invite skipping the discipline, a summary after every answer, a weighted rubric, an exhaustive transcript dump, or unresolved placeholders. Template slot markers may appear only in `assets/`, never in generated output. Done when: anti-slop search confirms none of these patterns in the output.
12. Report the written paths and verification notes. Done when: the report lists written paths and verification notes.

## Failure and recovery

- Missing evidence source: record as `not present` or `not readable`; do not block; proceed with available evidence.
- Ambiguous name or anchor count not equal to 5: ask one correction question; do not guess.
- Preview not confirmed: on `Abort` write nothing; on `Revise preview` apply corrections and re-gate; never write before confirmation.
- Collision without update-in-place selected: write to the draft path; never overwrite.
- **Off-catalogue influence failing the five criteria**: map to the nearest qualifying influence and cite the mapping; do not invent an anchor.
- Insufficient evidence: if fewer than 5 qualifying anchors can be derived from available evidence, stop and report the gap rather than emit slot markers or fabricated anchors. Partial results are not written; the only non-converged result is a report naming the missing evidence and the blocked anchor count.

## Output

Three written files at the target or draft path: `references/anchors.md`, `references/charter.md`, generated `SKILL.md` last: plus a report listing written paths and verification notes: evidence source classes scanned, question shapes, generated SKILL.md order, anti-slop search results, compact frontmatter description, and write-safety confirmation.
