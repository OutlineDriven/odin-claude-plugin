---
name: write-product-spec
description: 'Use when a user asks for a product spec with invariants, a tech spec, or a PRD. Modes: product (default), technical, requirements. Not for task breakdown: use plan.'
disable-model-invocation: true
---

# Write product spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a product spec with numbered behavioral invariants, a technical implementation plan, or an evidence-backed PRD. |
| Authority | Human-gated: in requirements mode, previews and confirms credentials, paid actions, and remote publishing before execution; otherwise writes only the named artifact. Rollback is delete the file. No remote mutation without explicit human approval in requirements mode. |
| Side effect | Writes one PRODUCT.md, TECH.md, or PRD artifact; in requirements mode also stages, commits, and opens a PR after explicit confirmation. |
| Done | The named artifact exists, meets its mode-specific contract, and the output is confirmed. |

## Inputs

- Mode (required): `product` (default), `technical`, or `requirements`.
- Feature identifier or intent (required): for `product` and `requirements`, a short kebab-case feature name or ticket or issue number; for `technical`, a description of the feature, change, or system to specify.
- Feature summary (required for `product` and `requirements`): one to three sentences describing what the feature does and the desired outcome.
- Target consumers (optional for `product`): who consumes the surface. Defaults to the end user.
- Key behaviors and edge cases (optional for `product`): gather via dialogue; do not guess.
- Codebase context (optional for `technical`): existing files, modules, or architecture the spec must integrate with.
- Target users (optional for `requirements`): who the feature serves.
- Constraints (optional for `requirements`): limits on the feature.
- Related URLs or docs (optional for `requirements`): sources to cite.
- Priority level (optional for `requirements`): P0, P1, or P2.

## Procedure

1. Select the mode. Ask or infer from the request: `product` for behavioral invariants, `technical` for implementation plan, `requirements` for evidence-backed PRD. Default to `product` if the request does not name a mode. Done when: the mode is confirmed.
2. Confirm scope. Ask only what is strictly necessary; do not guess.
   - Mode `product`: confirm the feature identifier, feature summary, target consumers, key behaviors, edge cases, and validation approach.
   - Mode `technical`: confirm the intent, codebase context, and constraints.
   - Mode `requirements`: confirm the feature name or description, target users, constraints, related URLs or docs, and priority level.
   Done when: the required scope for the selected mode is confirmed.
3. Mode `requirements`: gather supporting evidence. Read local sources when present and non-stale (≤7 days): `reports/customer_feedback_summaries/`, `reports/competitor_changelog_reports/` or `reports/feature_research/`, `reports/git_history_analysis/`, `reports/weekly_product_briefings/`. Note absent or stale sources. Cite every claim in the Problem Statement and Technical Considerations sections; tag unattributed claims `[UNCITED]`. Done when: available sources are read and stale or missing sources are noted.
4. Draft the artifact structure.
   - Mode `product`: Summary (required), Behavior (required, numbered invariants), optional Problem, optional Goals/Non-goals, optional Open questions. Do not include Validation, Success criteria, or Testing sections.
   - Mode `technical`: Objective, Background, Design, Implementation plan, Risks and mitigations, Open questions. No placeholders or TODOs.
   - Mode `requirements`: TL;DR, Problem Statement, Goals & Success Metrics, Target Users, Scope, Proposed Solution, Technical Considerations, Competitive Context, Open Questions, References. Include a header block with title, author, date, status (Draft), priority.
   Done when: the section list is decided with required and optional sections.
5. Produce the content.
   - Mode `product`: write Behavior as numbered, testable invariants from the consumer's perspective. Cover default flow, states, inputs, empty/error/loading/cancellation states, edge cases, keyboard/accessibility, and invariants. Keep framing thin relative to Behavior.
   - Mode `technical`: write each section. Validate every implementation step against the codebase: confirm referenced paths, types, and interfaces exist or are created by a prior step.
   - Mode `requirements`: write each section with citations. Derive the feature slug from the feature name (lowercase, hyphenated).
   Done when: all sections are drafted with concrete content and the mode-specific contract is satisfied.
6. Write the artifact.
   - Mode `product`: `specs/<id>/PRODUCT.md` where `<id>` is the feature identifier.
   - Mode `technical`: `TECH.md` in the working directory.
   - Mode `requirements`: `reports/prds/prd_<feature_slug>_YYYY-MM-DD.md`.
   Create the directory if it does not exist. Done when: the file is written to the correct path.
7. Mode `requirements`: publish the PRD. Present the saved path and a content summary. Obtain explicit confirmation. Stage and commit the PRD file; open a pull request against the default branch. If VCS commands fail, report the error. Inform the user that optional exports to Google Docs, Notion, or Slack are separate steps. Done when: the PR is open or the user stops before the PR.
8. Confirm the output. Present the file path, a one-line summary, and a count (behavior invariants for `product`, implementation steps for `technical`, or sections for `requirements`). Done when: the summary and count are presented.

## Failure and recovery

| Failure class | Mode | Partial-result rule | Recovery |
|---|---|---|---|
| Missing scope | all | No file written | Stop; ask for the missing input. |
| Conflicting requirements | technical | No file written | Stop; name the conflict and present the trade-off. |
| Scope creep | technical | Bound to the original ask | Note out-of-scope items in Open questions. |
| Technical uncertainty | technical | Record the assumption | Flag the assumption in Open questions with the test or investigation needed. |
| Unclear behavior | product | No file written | Write `**Open question:** ...` inline in Behavior; do not guess. |
| File write fails | all | No artifact on disk | Report the error with the path and root cause. |
| Source read fails | requirements | Continue without that source | Note the absence; do not halt. |
| Stale data (>7 days) | requirements | Note staleness | Proceed; do not block. |
| Uncited claim | requirements | Tag `[UNCITED]` | Resolve or move to Open Questions. |
| Missing required section | all | Incomplete artifact | Do not claim Done; report which section is absent. |
| PR creation fails | requirements | PRD file exists | Report the error; do not delete the PRD file. |
| Partial stop | all | No file written | Do not save a partial artifact. |

To reverse the side effect, delete the written artifact. In requirements mode, a partial result that produced a file but not a PR leaves the file in place.

## Output

- Mode `product`: `specs/<id>/PRODUCT.md` with sections in order: Summary, Behavior (numbered invariants), optional Problem, optional Goals/Non-goals, optional Open questions; no Validation, Success criteria, or Testing sections.
- Mode `technical`: `TECH.md` with sections in order: Objective, Background, Design, Implementation plan, Risks and mitigations, Open questions; no placeholders or TODOs.
- Mode `requirements`: `reports/prds/prd_<feature_slug>_YYYY-MM-DD.md` with sections in order: TL;DR, Problem Statement, Goals & Success Metrics, Target Users, Scope, Proposed Solution, Technical Considerations, Competitive Context, Open Questions, References; plus an open PR against the default branch.
