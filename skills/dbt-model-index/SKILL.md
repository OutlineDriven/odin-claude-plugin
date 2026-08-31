---
name: dbt-model-index
description: 'Use when a human-curated dbt model index must guide BigQuery SQL for a warehouse question. Emits a query with the correct fully-qualified model, grain, standard filters, partition bounds, and cost controls. Not for discovering undocumented models or executing warehouse changes.'
---

# dbt model index

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs to query data in a dbt-powered data warehouse or resolve a data question. |
| Authority | Read-only advisory; no file, VCS, credential, paid, published, deployed, or remote mutation. Consults the curated model index and emits SQL without executing it |
| Side effect | Produces a BigQuery SQL query that references the correct model; no warehouse mutation |
| Done | Query uses the correct fully-qualified model name, respects documented standard filters, partition fields, grain, and cost controls |

## Inputs

- A data question or query intent (required). May be vague or ambiguous.
- The human-curated model index in the Curated Model Index section (required). The human maintains one entry per dbt model, organized by domain. Each entry must record: fully-qualified table reference, grain (one row per what), useful-for query patterns, join keys, standard filters, and partition fields.
- Standard filters, production dataset path, plan or tier valid values, and sensitive-dataset callouts documented in the Curated Model Index section (required when the project has them).

## Procedure

1. Read the data question. If it names specific models, skip to step 4. Done when: the data question is read and the path (model-named or index-scan) is determined.
2. Scan the Curated Model Index section. Match the question to the model whose grain and useful-for patterns best fit the intent. Done when: the best-fit model is identified from the index.
3. If no single model fits, identify the join keys that connect candidate models and note each model's grain to avoid fan-out. Done when: join keys are identified and grains noted, or a single model is selected.
4. Construct the fully-qualified table reference using the production dataset path documented in the Curated Model Index section. For sensitive datasets, use the separate dataset path called out there. Done when: the fully-qualified table reference uses the correct dataset path.
5. Apply every standard filter documented in the Curated Model Index section (for example, excluding test accounts, soft-deleted records, internal users, flagged or fraudulent users). Omit none. Done when: every documented standard filter is applied.
6. For partitioned tables, filter on the partition field and constrain the date range. Never issue an unbounded scan of a large partitioned table. Done when: partitioned tables are filtered on the partition field with a bounded date range.
7. Include a comment stating the model grain (one row per what) so join cardinality is explicit. Done when: the query includes a grain comment.
8. If the query references plan or tier types, filter only on the valid values documented in the Curated Model Index section. Done when: plan or tier filters use only documented valid values.
9. Emit the BigQuery SQL query. Done when: the BigQuery SQL query is emitted with correct model name, all standard filters, partition constraints, grain comment, and valid-value filters.

## Failure and recovery
- No model in the index matches the question: stop and report which models were considered and why each was rejected. Do not invent a model or guess a table name.
- The index is empty or an entry is missing required metadata (grain, filters, partition fields): stop and report the gap. Do not emit SQL that skips an undocumented standard filter or partition constraint.
- Joining models would cause a grain fan-out: report the conflict and the grains involved. Do not emit SQL that silently multiplies rows.
- Partial result: never emit a query that respects some but not all documented standard filters or cost controls. The done predicate is all-or-nothing.

## Output
A BigQuery SQL query that references the correct fully-qualified model name, applies every documented standard filter, constrains partitioned-table scans to a bounded date range, and states the model grain. Also name each selected model and explain why it was chosen.
