---
name: dbt-model-index
description: 'Use when asked to consult a human-curated index of dbt models before writing BigQuery SQL against a data warehouse. Emits a query that uses the correct fully-qualified model name and respects documented grain, standard filters, partition fields, and cost controls. Don''t use for tasks that require source or remote-system changes.'
---

# dbt model index

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Need to query or load up data in a dbt-powered data warehouse, resolve a data question |
| Authority | Read-only advisory; no file, VCS, credential, paid, published, deployed, or remote mutation. Consults the curated model index and emits SQL without executing it |
| Side effect | Produces a BigQuery SQL query that references the correct model; no warehouse mutation |
| Done | Query uses the correct fully-qualified model name, respects documented standard filters, partition fields, grain, and cost controls |

## Inputs

- A data question or query intent (required). May be vague or ambiguous.
- The human-curated model index in the Curated Model Index section (required). The human maintains one entry per dbt model, organized by domain. Each entry must record: fully-qualified table reference, grain (one row per what), useful-for query patterns, join keys, standard filters, and partition fields.
- Standard filters, production dataset path, plan or tier valid values, and sensitive-dataset callouts documented in the Curated Model Index section (required when the project has them).

## Procedure

1. Read the data question. If it names specific models, skip to step 4.
2. Scan the Curated Model Index section. Match the question to the model whose grain and useful-for patterns best fit the intent.
3. If no single model fits, identify the join keys that connect candidate models and note each model's grain to avoid fan-out.
4. Construct the fully-qualified table reference using the production dataset path documented in the Curated Model Index section. For sensitive datasets, use the separate dataset path called out there.
5. Apply every standard filter documented in the Curated Model Index section (for example, excluding test accounts, soft-deleted records, internal users, flagged or fraudulent users). Omit none.
6. For partitioned tables, filter on the partition field and constrain the date range. Never issue an unbounded scan of a large partitioned table.
7. Include a comment stating the model grain (one row per what) so join cardinality is explicit.
8. If the query references plan or tier types, filter only on the valid values documented in the Curated Model Index section.
9. Emit the BigQuery SQL query.

## Failure and recovery
- No model in the index matches the question: stop and report which models were considered and why each was rejected. Do not invent a model or guess a table name.
- The index is empty or an entry is missing required metadata (grain, filters, partition fields): stop and report the gap. Do not emit SQL that skips an undocumented standard filter or partition constraint.
- Joining models would cause a grain fan-out: report the conflict and the grains involved. Do not emit SQL that silently multiplies rows.
- Partial result: never emit a query that respects some but not all documented standard filters or cost controls. The done predicate is all-or-nothing.

## Output
A BigQuery SQL query that references the correct fully-qualified model name, applies every documented standard filter, constrains partitioned-table scans to a bounded date range, and states the model grain. Accompanied by the model name or names selected and the reason each was chosen.

## Provenance

Adapted from warpdotdev/oz-skills, `.agents/skills/dbt-model-index/SKILL.md`, revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765, MIT license (Copyright 2026 Warp). Clean-room adaptation: the original template scaffold was restructured into a self-contained read-only advisory procedure preserving the model-index, grain, standard-filter, partition, and cost-control mechanisms.

### Curated model index

The human maintains this section. Organize model entries by domain. For each model, record: fully-qualified table reference, grain (one row per what), useful-for query patterns, join keys, standard filters, and partition fields.

### Standard filters

Document every filter that must always appear in user-facing queries (for example, `where not is_internal_user`). List each filter and its purpose.

### Production dataset path

Document the default project and dataset for fully-qualified table references.

### Plan or tier valid values

If the product has subscription tiers or plan types, list the valid values so queries filter correctly.

### Sensitive datasets

If any models live in a separate dataset, call out the dataset path explicitly so queries use the right fully-qualified reference.
