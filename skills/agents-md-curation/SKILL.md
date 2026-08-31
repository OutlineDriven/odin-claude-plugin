---
name: agents-md-curation
description: 'Use when asked to create, update, or prune a repository AGENTS.md when instructions are long, generic, or stale and agents repeat avoidable mistakes. Every surviving line passes a three-check gate so the file holds only non-discoverable, accurate, mistake-reducing guidance. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Agents MD curation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create/update/prune a repository AGENTS.md; existing instructions long, generic, or stale; agents repeat avoidable mistakes. |
| Authority | Write only the named AGENTS.md and module-local variants; recover by reverting the edited file. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes or edits AGENTS.md and module-local variants. |
| Done | Every line passes the 3-check gate (non-discoverable today, accurate today, materially mistake-reducing); tooling-enforced rules and code-inferable summaries absent. |

## Inputs

- Repository root (the current working directory). Must be supplied.
- Target AGENTS.md path or module-local variant to edit. Optional; when omitted, bound to the root AGENTS.md and any module-local variants the user names. Do not edit a variant the user did not name.
- Scope limit (root-only versus hierarchical). Optional.

## Procedure

1. Bound scope before mutation: identify the target AGENTS.md path(s) — the root file and any module-local variants the user named. Do not create or edit a file outside this set.
2. Survey source files to learn what is already discoverable: the existing AGENTS.md, README, PROJECT.md if present, cursor rules (`.cursor/rules/` or `.cursorrules`), Copilot instructions (`.github/copilot-instructions.md`), GEMINI.md, CI/workflow files, and package manager config. Record what an agent can infer from these alone.
3. For an existing AGENTS.md, audit every line against the discoverability filter: can an agent discover this by reading the repo (README, code, config, scripts, directory tree)? If yes, mark it for deletion. If no and it materially affects task success, cost, or safety, keep it. Prefer targeted edits over wholesale rewrites; improve incrementally instead of replacing blindly.
4. Apply the three admission checks to each surviving line and each candidate line: (a) non-discoverable from repository files alone, (b) operationally significant — it changes commands, outcomes, or safety, (c) actionable — specific enough to execute. Omit anything that fails one check.
5. Omit tech stack summaries, directory structure overviews, architecture descriptions agents can infer from code, generic best-practice advice not specific to this repo, rules already enforced by tooling (linters, typecheck, tests, CI), and mandatory boilerplate headers unless the repo explicitly requires one.
6. Write each retained entry as an imperative or prohibition paired with why the rule needs to be. Each fact appears once. Ground every statement in a file actually read; if uncertain, omit the claim rather than speculate. Admissible form: "Use pnpm; npm lockfiles break CI." Inadmissible form: "The repo uses pnpm."
7. For large repos, prefer hierarchical module-local AGENTS.md files near relevant modules instead of one monolithic root file.
8. Run the quality gate before finalizing: for each line verify it is non-discoverable, still accurate today, and materially reduces mistakes, cost, or time. Delete any line that fails one of these checks.
9. Maintenance mindset: AGENTS.md is temporary guidance, not permanent configuration. When a recurring issue has a fixable root cause in code or tooling (a lint rule, test, script, or structural change), prefer that fix and keep only the minimum instruction needed until the root cause is solved. Prune stale instructions aggressively.

## Failure and recovery
- Unverifiable claim: a candidate line cannot be grounded in a file actually read. Omit it; never speculate or fabricate. The done predicate does not hold for omitted lines.
- Stale but load-bearing: a line fails "accurate today" yet removing it would let agents repeat a known mistake. Flag it to the user as needing a root-cause fix in code or tooling, keep the minimum instruction, and do not silently delete.
- Scope drift: the user did not name a module-local variant. Do not create or edit it; stop and ask rather than widen scope.
- Partial result: if some lines cannot be verified, deliver the verified subset and list the unverified candidates as omitted, never as passing.
- Rollback: edits are reversible by reverting the changed AGENTS.md file. No state outside the named local files is mutated.
- Blocked result: when the target file cannot be read or the scope is ambiguous and the user cannot resolve it, return blocked with the exact obstacle and the lines verified so far.

## Output
An AGENTS.md (and any named module-local variants) containing only lines that pass the three-check gate, each an imperative or prohibition with its rationale, grounded in files read. Plus a deletion list of removed descriptive lines and an omission list of unverifiable candidates, so the user can see what was cut and why.

## Provenance

Origin: `mcollina/skills` repository, revision `856efd268ae85482d882f3d0bed869fd020b5c06`, license MIT. Adapted from file path `skills/init/SKILL.md` in that repository: the discoverability filter, three-check quality gate, omission set, source-file survey, hierarchical recommendation, and maintenance mindset are preserved; expression is rewritten self-contained for ODIN 2.0 with no dependency on the source repository, another skill, a system prompt, or a rule file. Third-party license obligations: see root PROVENANCE.md.
