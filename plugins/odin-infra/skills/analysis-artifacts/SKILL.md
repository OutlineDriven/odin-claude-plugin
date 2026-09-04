---
name: analysis-artifacts
description: 'Use when the user requests a deep dive, exploratory analysis, or data analysis on BigQuery. Not for credential, publish, deploy, or irreversible changes.'
---

# Analysis artifacts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a deep dive, exploratory analysis, or data analysis on BigQuery data |
| Authority | Human-gated: presents the analysis plan and waits for explicit user approval before any warehouse read; otherwise reversible local: writes only a dated analyses tree; rollback is version control. No remote mutation. |
| Side effect | Creates a dated analyses/<date>-<name>/ directory containing README.md, assets/queries/*.sql, and assets/visualizations/*.{png,svg,html}; overwrites stale artifacts in the same directory consistently |
| Done | README contains the approved plan, explicit cohort definitions, links to every SQL and visualization file, a TLDR, and key takeaways; source_paths are documented |

## Inputs

- Analysis request (required): the question or hypothesis to explore against BigQuery data.
- BigQuery project and dataset (required): the warehouse target for read queries.
- Date (required): a calendar date in YYYY-MM-DD format used to construct the analysis directory path.
- Analysis name (required): a short slug used for the directory name under analyses/.
- Cohort definitions (derived): population filters expressed as SQL predicates and stated explicitly in the README before any query runs.
- Existing analyses tree (optional): prior artifacts that may need to be overwritten.

## Procedure

1. Draft a written analysis plan that states the question, BigQuery project and dataset, cohorts to compare, queries to run, and visualizations to produce. Present the plan to the user and stop until the user explicitly approves it. Do not run warehouse queries before approval. Done when: the plan is presented and user-approved.
2. After approval, create analyses/<date>-<name>/ with the subdirectories assets/queries/ and assets/visualizations/. Done when: the directory and subdirectories exist.
3. Save each SQL query as a standalone assets/queries/*.sql file. Every query must run independently against the named BigQuery project and dataset. Done when: each query is a standalone .sql file.
4. Run the approved queries against BigQuery in read mode. Record each query's source path in the README. Done when: each query's source path is recorded in the README.
5. For each result set that warrants a visualization, produce a PNG, SVG, or HTML file under assets/visualizations/. Name the file after its originating query. Done when: each visualization file is named after its originating query.
6. Write README.md in the analyses/<date>-<name>/ root with these sections in order: TLDR, Key Takeaways, Approved Plan, Cohort Definitions, Queries (with links to each assets/queries/*.sql file), Visualizations (with links to each assets/visualizations/* file), and Source Paths. Done when: README links every SQL and visualization file, states cohort definitions, includes TLDR and key takeaways, and documents source_paths.
7. If analyses/<date>-<name>/ already contains stale artifacts, overwrite the affected files in place so the directory matches the current approved plan. Do not leave mixed old and new versions of the same artifact. Done when: the directory matches the current approved plan with no mixed versions.

## Failure and recovery
If the plan is not approved, stop before any warehouse read or file write; do not create a directory, and return the draft plan and ask for approval. If query execution fails, record the failing query path and the BigQuery error in a Failures section of the README; do not write a partial visualization for a failed query, and leave the SQL file in place so the user can correct and re-run it. If visualization generation fails, record the failure in the README; keep the SQL file and result, as only the visualization is missing, and re-run visualization generation after fixing the cause. If overwriting would destroy an artifact outside the current approved plan, stop and surface the conflict to the user before overwriting. A run in which some queries succeed and others fail is not done: the README must mark which sections succeeded and which failed, and never claim the done predicate holds while an approved query or visualization is missing.

## Output
A dated analyses/<date>-<name>/ directory containing README.md with the approved plan, explicit cohort definitions, linked SQL and visualization files, a TLDR, key takeaways, and documented source_paths; assets/queries/*.sql files; and assets/visualizations/*.{png,svg,html} files. The directory is the single artifact; no external state is modified.
