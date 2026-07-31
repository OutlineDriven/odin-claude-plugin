---
name: research
description: Use when researching a named library, framework, SDK, API, or service, or finding a migration guide.
---

# Research Command

External knowledge gathering with one persistent Markdown artifact; source files stay read-only. Walk the 5-tier source ladder, dispatch research to a background subagent so user work can continue, cite every claim to a primary source, and record the findings.

## When to Apply / NOT

**Apply:**
- Library/framework/SDK/API docs: signatures, config options, migration
- Version-specific behavior: changelogs, deprecations, breaking changes
- Vendor announcements, RFCs, public web technical content
- Any named library, framework, SDK, API, CLI tool, or cloud service

**NOT apply:**
- Questions about a local repo's code: use a codebase exploration workflow instead
- Autonomous goal-directed research loops (multi-step, agent-driven)
- Implementation or edits outside the research artifact

## Process

1. **Identify subject**: Extract the library, framework, SDK, API, CLI, or topic from the user's request. Capture version if stated (e.g., `pydantic@2.7`). If version is unstated, resolve latest stable at Tier 1.
2. **Dispatch background subagent**: Dispatch a writing-capable background worker via `task` so primary session work continues without blocking. Pass self-contained instructions specifying the subject, version, source ladder requirements, and target artifact path. The worker may use a `librarian` for external docs or a read-only `scout` for local context, but those helpers return evidence to the worker; the worker that owns completion writes the artifact.
3. **Resolve identifier & walk ladder**: Inside the subagent task, look up the canonical name and version from official docs. Walk the 5-tier source ladder starting at Tier 1; proceed to the next tier only on hard failure (source unavailable, no results, non-authoritative). Record any skipped tiers.
4. **Cross-reference**: Every factual claim must cite at least one primary source URL or doc path. Assertions derived solely from training data must carry `[Speculative — training data only]`.
5. **Write cited Markdown artifact**: Persist all research findings into a single Markdown file at the target location. Completion requires writing this artifact to disk before returning the final report.

## Source Ladder

If a source category is unavailable or returns no authoritative results, skip it and move to the next tier. Do not halt.

| Tier | Priority | Source type | Use when |
|------|----------|-------------|---------|
| 1 | Official docs | Library/framework official documentation site; SDK reference pages | Named library/framework/SDK with a published doc surface |
| 2 | API refs | API reference pages; repository README and docs folders | API signatures, types, configuration keys, repo-architecture details |
| 3 | Books/papers | RFCs; academic papers; vendor whitepapers; standards documents | Standards-body publications, deep technical specifications |
| 4 | Tutorials | Tutorial articles; blog posts; vendor how-to guides | Example-driven walkthroughs when reference docs are insufficient |
| 5 | Community | Repository issues and discussions; community forums; Q&A threads | Real-world usage patterns, upstream known issues, community workarounds |

## Artifact Location & Fallback

Research findings must be saved as a single cited Markdown file (`<subject-slug>.md`):

1. **Existing repo home**: If the repository has an established directory for research notes or technical documentation (e.g., `docs/research/`, `research/`, `notes/`), write the artifact there.
2. **Deterministic fallback**: If no research-note directory exists in the project, write the file to `.outline/research/<subject-slug>.md`.

## Required Output & Completion

The research task is complete only when the Markdown artifact is written to disk and its relative path is returned.

The output (both in the Markdown artifact and in the summary notification) must contain:

1. **Artifact location**: Path to the generated Markdown file (e.g., `.outline/research/pydantic-v2.md`).
2. **Subject identification**: Canonical name + version (e.g., `pydantic@2.7.4`).
3. **Source-cited claims**: Each claim formatted as `[Claim] — Tier N, source: [URL or doc path]`.
4. **Confidence labels**: `Verified` (Tier 1–2 primary source), `Probable` (Tier 3–4), or `Speculative` (training data only; flagged explicitly).
5. **Open questions**: Claims unanswered after ladder exhaustion, listing attempted tiers.

## Anti-Patterns

- Inventing versions, API signatures, or config keys from training data without Tier 1 verification
- Blocking session progress on synchronous research instead of dispatching via background `task`
- Returning inline output without creating and saving the required Markdown artifact
- Re-entering a router or orchestrator skill from within this leaf skill (recursion guard)
