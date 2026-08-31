---
name: research
description: 'Use when researching a named library, framework, SDK, API, or service, or finding a migration guide; produces a cited Markdown artifact written to disk. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Research command

## Contract

| Field | Bound contract |
|---|---|
| Trigger | researching a named library/framework/SDK/API/service or finding a migration guide |
| Authority | reversible-local: write only named local artifacts; state the rollback path |
| Side effect | writes a cited Markdown artifact to docs/research/ or .outline/research/; no remote mutation and no paid action |
| Done | cited artifact written to disk with subject id, source-cited claims, confidence labels, open questions |

## Inputs

Subject (required): the library, framework, SDK, API, CLI, or service name extracted from the user request.
Version (optional): pinned version string if stated, e.g. `pydantic@2.7`. If unstated, resolve latest stable at Tier 1.
Target path (optional): preferred output directory. Defaults to `docs/research/` if it exists, else `.outline/research/`.

## Procedure

1. **Identify subject**: Extract the canonical name and version from the user request. Capture version if stated. If unstated, note "latest stable" and resolve from Tier 1.
2. **Dispatch background subagent**: Spawn a writing-capable background worker via `task` with self-contained instructions: subject, version, source ladder requirements, target artifact path. The worker owns completion and writes the artifact.
3. **Walk 5-tier source ladder**: Inside the subagent, resolve the canonical name from official docs, then probe tiers in priority order. Proceed to the next tier only on hard failure (source unavailable, no results, non-authoritative). Record skipped tiers.

   | Tier | Priority | Source type |
   |------|----------|-------------|
   | 1 | Highest | Official docs: library/framework documentation site, SDK reference pages |
   | 2 | High | API refs: reference pages, repository README and docs folders |
   | 3 | Medium | Books/papers: RFCs, academic papers, vendor whitepapers, standards documents |
   | 4 | Low | Tutorials: tutorial articles, blog posts, vendor how-to guides |
   | 5 | Lowest | Community: repository issues and discussions, forums, Q&A threads |

4. **Cite every claim**: Every factual claim must cite at least one primary source URL or doc path. Assertions derived solely from training data must carry `[Speculative — training data only]`.
5. **Write artifact**: Persist all findings into a single Markdown file at the target location. The file name is a slug of the subject. Do not return without writing the artifact.

## Failure and recovery
**Named failure classes:**
- `ladder-exhausted`: no authoritative source found after Tier 5; surface all attempted tiers and any partial findings.
- `invalid-output`: artifact missing required fields, unparseable, or not written to the target path.
- `task-dispatch-failed`: background subagent could not start or returned no result.

**Partial-result rule:** When the background subagent partially succeeds (artifact written but claims sparse), return the artifact path and list the specific gaps.

**Blocked/non-converged result:** If no artifact can be written, return `BLOCKED: <named failure class>` with the specific blocking reason. Do not pretend the done predicate holds.

## Output
A single cited Markdown artifact (`<subject-slug>.md`) containing:

1. **Subject id**: canonical name and resolved version.
2. **Source-cited claims**: each claim formatted with a confidence label — `Verified` (Tier 1–2), `Probable` (Tier 3–4), `Speculative` (training data only).
3. **Open questions**: claims unanswered after ladder exhaustion, listing attempted tiers.

The artifact path is returned to the user. The primary session is unblocked as soon as the background task is dispatched.

## Provenance

Origin: `odin-current` (skills/research/SKILL.md). Revision: none. License: project-owned, no third-party expression copied. Adaptation: clean-room re-derivation into the odin-research-advanced module, preserving the external-research contract, 5-tier source ladder mechanism, and background subagent dispatch pattern. No third-party text was copied.
