---
name: research
description: 'Use when researching a named library, framework, SDK, API, or service, or finding a migration guide. Produces a cited Markdown artifact written to disk with source-cited claims, confidence labels, and open questions. A primary-source-only mode restricts the ladder to official docs, API refs, and source code. Not for codebase-internal research — use scout.'
---

# Research command

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Researching a named library/framework/SDK/API/service or finding a migration guide. |
| Authority | Reversible-local: write only named local artifacts; state the rollback path. |
| Side effect | Writes a cited Markdown artifact to `docs/research/` or `.outline/research/`; no remote mutation and no paid action. |
| Done | Cited artifact written to disk with subject id, source-cited claims, confidence labels, open questions. |

## Refusals

- Codebase-internal research: use `scout`. This skill researches external libraries, frameworks, and services.
- Assertions derived solely from training data without a `[Speculative]` label: rejected. Every factual claim must cite at least one primary source URL or doc path.
- Returning without writing the artifact: rejected. Do not return without writing the artifact.

## Inputs

Subject (required): the library, framework, SDK, API, CLI, or service name extracted from the user request.
Version (optional): pinned version string if stated, e.g. `pydantic@2.7`. If unstated, resolve latest stable at Tier 1.
Target path (optional): preferred output directory. Defaults to `docs/research/` if it exists, else `.outline/research/`.

## Procedure

1. Identify the subject. Extract the canonical name and version from the user request. Capture version if stated. If unstated, note "latest stable" and resolve from Tier 1. **Done when**: the canonical name and resolved version are recorded.
2. Dispatch a background subagent via `task` with self-contained instructions: subject, version, source ladder requirements, target artifact path. The worker owns completion and writes the artifact. **Done when**: the background task is dispatched and the primary session is unblocked.
3. Walk the 5-tier source ladder inside the subagent. Resolve the canonical name from official docs, then probe tiers in priority order. Proceed to the next tier only on hard failure (source unavailable, no results, non-authoritative). Record skipped tiers.

   | Tier | Priority | Source type |
   |------|----------|-------------|
   | 1 | Highest | Official docs: library/framework documentation site, SDK reference pages |
   | 2 | High | API refs: reference pages, repository README and docs folders |
   | 3 | Medium | Books/papers: RFCs, academic papers, vendor whitepapers, standards documents |
   | 4 | Low | Tutorials: tutorial articles, blog posts, vendor how-to guides |
   | 5 | Lowest | Community: repository issues and discussions, forums, Q&A threads |

   **Done when**: all tiers are probed or a hard failure stops the ladder.

4. Cite every claim. Every factual claim must cite at least one primary source URL or doc path. Assertions derived solely from training data must carry `[Speculative — training data only]`. **Done when**: every claim has a citation or speculative label.
5. Write the artifact. Persist all findings into a single Markdown file at the target location. The file name is a slug of the subject. **Done when**: the artifact is written to disk.

## Primary-source-only mode

When the task needs primary-source reading, restrict the ladder to its strictest tier: search only authoritative primary sources (Tier 1 official docs, Tier 2 API refs and repository README/docs folders, and source code). Stop after the first authoritative match; do not iterate the rest of the ladder. Every factual claim must link to its owning primary source URL or file path, and each citation must uniquely own the claim it annotates. A claim that cannot be sourced from a primary source is written with the label `[Unverified — no primary source available]` and the gap is left unfilled; never substitute a community, tutorial, or non-authoritative source to close it. If a primary source is unreachable, stop after one retry rather than dropping to a lower tier. If the target write fails, delete any partial file before reporting. This mode never widens beyond primary sources; the lower tiers (3-5) are not probed.

## Failure and recovery

- `ladder-exhausted`: no authoritative source found after Tier 5; surface all attempted tiers and any partial findings.
- `invalid-output`: artifact missing required fields, unparseable, or not written to the target path.
- `task-dispatch-failed`: background subagent could not start or returned no result.
- Partial-result rule: when the background subagent partially succeeds (artifact written but claims sparse), return the artifact path and list the specific gaps.
- Blocked/non-converged result: if no artifact can be written, return `BLOCKED: <named failure class>` with the specific blocking reason. Do not pretend the done predicate holds.

## Output

A single cited Markdown artifact (`<subject-slug>.md`) with subject id, source-cited claims with confidence labels (Verified for Tier 1-2, Probable for Tier 3-4, Speculative for training data only), and open questions listing attempted tiers, ordered: subject id, claims, open questions.
