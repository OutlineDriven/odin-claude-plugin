---
name: seed-casebook
description: 'Use when a user opens a new build cycle in a repo with an established iteration convention: creates the iteration casebook directory already containing real seed content, never an empty folder. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Seed iteration casebook

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User opens a new build cycle in a repo with an established iteration convention |
| Authority | Reversible local write: creates named local casebook directory and its seed files |
| Side effect | Creates the iteration casebook directory already containing real seed content (never an empty folder) |
| Done | Folder has real content from the moment it exists on either weight path; full path has DESIGN thesis/scope/gates, cycle-specific WORKFLOW steps, EVIDENCE gates each tracing to a DESIGN line; lightweight path has a one-paragraph retro seed; bump stays provisional until forks resolve |

## Inputs

- **Required**: the repo's iteration convention path prefix and naming scheme (e.g. `.re0/iteration/<version>-<workname>/`). The model infers this from existing casebook directories, VCS history, or project docs; it is not hard-coded.
- **Required**: the cycle name or workname for this iteration.
- **Optional**: any context about whether the cycle is a fix, hardening pass, or new direction. Defaults to lightweight if the model cannot determine.

## Procedure

1. Classify the cycle weight before any write:
   - **lightweight**: a fix or hardening pass with no genuine design surface.
   - **full**: a cycle with a direction worth arguing through.
   If classification is uncertain, choose lightweight; full can be reopened by a subsequent cycle.

2. Construct the casebook directory path from the repo's established iteration convention and cycle name. Create the directory and its first file in the same step so the folder is never empty from creation.

3. **Lightweight path**: write `RETRO.local.md` with one paragraph naming the task and why it is lightweight. Stop. Do not write `DESIGN`, `WORKFLOW`, or `EVIDENCE`.

4. **Full path**: write three files in order:
   - `DESIGN.local.md`: thesis, scope, and quality gates. When the cycle touches shippable surface, gates must include a documentation reflection gate: internal mechanisms, rules, and anatomy update the project developer-instruction file; user-facing catalog and experience changes update the product README.
   - `WORKFLOW.local.md`: the numbered steps this specific cycle runs: specific to this build, not a restatement of generic stages.
   - `EVIDENCE.local.md`: the gates from `DESIGN.local.md` listed as proof surface still to fill. Every gate in EVIDENCE traces to a line in DESIGN; do not invent proof surface DESIGN did not name.

5. Keep reference material flat as `REF-<topic>.local.md` files; promote to a `refs/` subfolder only when it multiplies past two files.

6. Verify before reporting done:
   - Casebook directory exists and contains at least one file.
   - Full path: `DESIGN.local.md` states thesis, scope, and gates; `WORKFLOW.local.md` steps are specific to this cycle; each `EVIDENCE.local.md` gate traces to a `DESIGN.local.md` line.
   - Lightweight path: `RETRO.local.md` is one paragraph naming the task and reason.
   - Reference material stayed flat unless it earned a `refs/` subfolder.

## Failure and recovery
**Already-exists**: the casebook directory already exists for this cycle. Stop. Do not overwrite existing content or write a parallel directory. Report the conflict.

**Creation-failure**: directory or file write fails. Stop. Do not produce a partial or empty directory. Report the filesystem error.

**Empty-write**: a required file would be written empty. Stop. Never create a placeholder.

**Wrong-path**: if the chosen weight path proves wrong mid-cycle, the casebook is retired by a release or retirement workflow, not overwritten or migrated by this skill.

**Version provisional**: the casebook directory's version token is tentative until any open fork in the cycle resolves. Do not finalize the bump label until forks close.

## Output
A casebook directory at the repo's iteration convention path, containing either:
- **Lightweight**: `RETRO.local.md` (one-paragraph retro seed)
- **Full**: `DESIGN.local.md` + `WORKFLOW.local.md` + `EVIDENCE.local.md`

The directory is never empty at creation. The skill reports which path was taken and why.

## Provenance

Origin: `skills/coil/re0-plan` in `github.com/LilMGenius/paperthin` at `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`.

License: MIT (c) 2026 LilMGenius. NOTICE: additionally vendors verbatim material from `mattpocock/skills` (MIT, (c) 2026 Matt Pocock) with per-source attribution. Retain the MIT copyright+permission notice for substantial reuse; per-source attribution obligation binds only verbatim vendor material, which the foundry does not copy.

Adaptation: Clean-room ODIN 2.0 port. Generalized `.re0/iteration/` convention to the workspace's local provenance home. Removed paperthin-only skill references (`re0-release`, `re0-memo`, `re0-loop`, `re0-work`). Retained: never-empty-at-creation, no-padding lightweight rule, full-path gate traceability, provisional bump rule, and the shippable-surface developer-instruction/product-README split. Module `odin-run`; single-setup-task execution is common, not multi-agent.
