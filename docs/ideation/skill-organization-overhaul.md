# Ideation: skill organization overhaul

Status: historical ideation, not the current skill roster. Later approved
consolidation rounds changed several survivors, including `ci-fix` and
`strike-the-root`. The current roster lives in
`catalog/skill-membership.json`.

Six councils (Merge, Hierarchy, Interface, Voice, Experience, Infra) produced 48 candidates.
A reject-by-default critic passed 29; a deep adjudicator audited all 48 verdicts, overturned 7,
and sealed the set: **26 survive, 22 rejected**. The survivors and rejected candidates are
enumerated in the sections below (Survivors by axis, Rejected).

## Survivors by axis

### Structure (merges — the reduction)
- unslop/deslop cleanup cluster: 7 dirs → 2 survivors (prose: unslop; code: deslop).
- architect cluster: 6 relevant dirs → 2 survivors (architect; architecture-diagram).
- principle-* register: 21 dirs → 1 survivor (principles, indexed anchor register — the spine pattern).
- fix pipeline: fix absorbs code-improver, code-improver-fixer, review-fix.
- CI fix pair: gh-fix-ci absorbs ci-fix.
- merge-conflict trio: resolve-merge-conflicts absorbs fix-merge-conflicts, resolving-merge-conflicts.
- agents-md trio: agents-md absorbs agents-md-curation, lean-agents-md.
- taste ⊇ spine: plugin taste is the one home for the anchor register; verify subsumption.
- General merge rule: every merge names one survivor, folds unique content into references/,
  flows renames through the package-surfaces generator, keeps display_name unique.
- Slop/cleanup taxonomy: the wider 14-skill cleanup axis gets one documented routing map
  (each remaining cleanup skill names its neighbors and the discriminating condition).
- Invocation-authority namespace: the human-only (disable-model-invocation) class becomes
  visible policy, not a buried frontmatter flag.

### Interface (context economy)
- Hard description character budget for model-invoked skills; descriptions are trigger
  pointers, not summaries.
- Audit model-invoked skills; convert hand-only-fired ones to user-invoked to recover
  always-loaded context budget.
- Branching disclosure test: branch-specific procedure detail moves to references/;
  the shared spine stays in-file.
- Deterministic sub-tasks move from prose to scripts/ (zero context cost).

### Voice (the ODIN/spine register)
- Verdict-first descriptions: one discriminating trigger condition; output range lives in Done.
- Lead with the load-bearing refusal — what the skill rejects — before mechanics.
- Name the primary target; secondary targets routed as "also handles" with the condition attached.
- One-line output contracts (named sections + ordering rule) replace fill-in-the-blank templates.
- Specification and validation merge into single steps carrying their own pass condition.
- Checklists group by failure mode with opinionated framing, not flat numbered lists.

### Infrastructure (gates that make reduction safe)
- Derive agents/openai.yaml from SKILL.md frontmatter via generator; delete hand-authored manifests.
- Wire check-skill-routes.mjs into the prek pre-commit gate.
- Skill-count invariant: catalog/skill-membership.json count == skills/ directory count.
- Frontmatter colon-space quoting validator.
- Use catalog/skill-membership.json as canonical neutral membership source (renames = one edit + generator run).
- Generate packages/*/NOTICE copies from authored licenses/NOTICE.
- display_name uniqueness collector that fails on collision.
- Atomic rename identity gate: dir name == frontmatter name == membership slug == manifest.
- Multi-class rename leak auditor: detect slash triggers, backticks, paths, headings, and state dirs from old names.

## Rejected (headline reasons)
- from-* 12→1 collapse: from-first-principle writes an artifact; not a seat variant.
- review 35→3 fold: sampled contracts differ in mutation authority; claim overbroad.
- visual/visualise merge: HTML vs SVG output is a real semantic split.
- Nested family subdirectories: flat-tree loader constraint; speculative.
- Depth-ratio metric: gameable proxy, no grounding.
- Register-consistency prose pass, one-decisive-step restructure, outcome-restatement strip:
  not load-bearing or subsumed by surviving directions.
- Substring-collision gate: unbounded false positives; bounded merge rule carries it instead.
