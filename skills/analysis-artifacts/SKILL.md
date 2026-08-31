---
name: analysis-artifacts
description: 'Use when the user requests a deep dive, exploratory analysis, or data analysis on BigQuery data, produce a dated analyses directory with an approved plan, explicit cohorts, linked query and visualization artifacts, and a TLDR with key takeaways. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Analysis artifacts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a deep dive, exploratory analysis, or data analysis on BigQuery data |
| Authority | Reversible local writes to a dated analyses tree; warehouse reads proceed only after the user approves the analysis plan |
| Side effect | Creates a dated analyses/<name>/ directory containing README.md, assets/queries/*.sql, and assets/visualizations/*.{png,svg,html}; overwrites stale artifacts in the same directory consistently |
| Done | README contains the approved plan, explicit cohort definitions, links to every SQL and visualization file, a TLDR, and key takeaways; source_paths are documented |

## Inputs

- **Analysis request** (required): the question or hypothesis the user wants explored against BigQuery data.
- **BigQuery project and dataset** (required): the warehouse target for read queries.
- **Analysis name** (required): a short slug used as the directory name under analyses/.
- **Cohort definitions** (derived): population filters expressed as SQL predicates, made explicit in the README before any query runs.
- **Existing analyses tree** (optional): present when prior artifacts exist and may need overwriting.

## Procedure

1. Draft a written analysis plan: the question, the BigQuery project and dataset, the cohorts to compare, the queries to run, and the visualizations to produce. Present the plan to the user and stop until it is explicitly approved. Do not run warehouse queries before approval.
2. After approval, create the directory analyses/<name>/ with subdirectories assets/queries/ and assets/visualizations/.
3. Write each SQL query as a standalone file under assets/queries/*.sql. Every query must be runnable independently against the named BigQuery project and dataset.
4. Run the approved queries against BigQuery in read mode. Record each query's source path in the README.
5. Produce visualization artifacts (PNG, SVG, or HTML) under assets/visualizations/ for each result set that warrants one. Name each file to match its originating query.
6. Write README.md in the analyses/<name>/ root with these sections in order: TLDR, Key Takeaways, Approved Plan, Cohort Definitions, Queries (with links to each assets/queries/*.sql file), Visualizations (with links to each assets/visualizations/* file), and Source Paths.
7. If a prior analyses/<name>/ directory exists with stale artifacts, overwrite the affected files in place so the directory reflects the current approved plan. Do not leave mixed old and new versions of the same artifact.
8. Verify the done predicate: open README.md and confirm every SQL file and visualization file is linked, cohort definitions are explicit, the TLDR and key takeaways are present, and source_paths are documented.

## Failure and recovery
- **Plan not approved**: stop before any warehouse read or file write. No directory is created. Return the draft plan and ask for approval.
- **Query execution failure**: record the failing query path and the BigQuery error in the README under a Failures section. Do not write a partial visualization for a failed query. Leave the SQL file in place so the user can correct and re-run.
- **Visualization generation failure**: record the failure in the README. The SQL file and result remain; only the visualization is missing. Re-run visualization generation after the cause is fixed.
- **Stale artifact conflict**: if overwriting would destroy an artifact not covered by the current approved plan, stop and surface the conflict to the user before overwriting.
- **Partial-result rule**: a partial run (some queries succeeded, some failed) is not done. The README must honestly mark which sections succeeded and which failed. Never claim the done predicate holds when any approved query or visualization is missing.

## Output
A dated analyses/<name>/ directory containing README.md with the approved plan, explicit cohort definitions, linked SQL and visualization files, a TLDR, key takeaways, and documented source_paths; assets/queries/*.sql files; and assets/visualizations/*.{png,svg,html} files. The directory is the single artifact; no external state is modified.

## Provenance

Adapted from the Warp oz-skills analysis-artifacts skill (https://github.com/warpdotdev/oz-skills, revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765, MIT license, file .agents/skills/analysis-artifacts/SKILL.md). Clean-room adaptation: the plan-approval gate, canonical analyses tree, per-query SQL files, linked visualizations, and honest partial-result reporting are preserved as mechanism; expression is rewritten for the ODIN contract format.
