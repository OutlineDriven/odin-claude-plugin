---
name: pricing-projection
description: 'Use when projecting cost, estimating BYO cost or spend, or sizing a deal. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Pricing projection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to project cost, estimate BYO cost, estimate spend, how much will this cost, or size a deal. |
| Authority | Reversible local: writes only the projection script and one report to reports/pricing/; rollback is undo. No remote mutation. |
| Side effect | Generates and runs a projection script that prints or saves a cost projection brief to reports/pricing/. |
| Done | Projection delivered with pricing model, run-rate, scenario comparison, conversion assumption, and sensitivity grid. |

## Inputs

Required:

- `usage_records`: structured usage log in CSV or JSON (date, model, input_tokens, output_tokens).
- `pricing_table`: pricing table in CSV or JSON with validated schema: `provider`, `model`, `input_cost_per_million`, `output_cost_per_million`. Reject if any required column is absent; list missing columns in the error.

Optional (defaults applied when absent, before the script runs):

- `scenario_params`: JSON with three named scenarios (e.g. `low`, `mid`, `high`) each carrying `requests_per_day`, `avg_input_tokens`, `avg_output_tokens`. Defaults to `{"low":{"requests_per_day":100,"avg_input_tokens":1000,"avg_output_tokens":500},"mid":{"requests_per_day":1000,"avg_input_tokens":1000,"avg_output_tokens":500},"high":{"requests_per_day":10000,"avg_input_tokens":1000,"avg_output_tokens":500}}`.
- `conversion_ratio`: numeric ratio (credits-per-dollar or reverse) applied in the projection. Defaults to `1.0`.
- `output_path`: destination directory. Defaults to `reports/pricing/`.

## Procedure

1. Confirm the two required inputs are present. If `usage_records` is absent, abort and name it. If `pricing_table` is absent, abort and name it. If `pricing_table` is present but its schema lacks `provider`, `model`, `input_cost_per_million`, or `output_cost_per_million`, abort and list the missing columns. Done when: both required inputs are confirmed present with valid schema.

2. Apply defaults for optional inputs. If `scenario_params` is absent, use the default scenario map. If `conversion_ratio` is absent, set it to `1.0`. If `output_path` is absent, set it to `reports/pricing/`. Done when: scenario_params, conversion_ratio, and output_path are resolved with defaults applied where absent.

3. Generate `reports/pricing/project_credits.py`, creating `reports/pricing/` if it does not exist, as a Python script that loads the usage records and pricing table; computes each model cost as `input_tokens * input_cost_per_million / 1_000_000 + output_tokens * output_cost_per_million / 1_000_000`; applies the conversion ratio; computes daily, weekly, and monthly mid-scenario run-rate; compares all three scenarios; and builds a sensitivity grid across token volume and model choice. Done when: the projection script is generated.

4. Execute the script with `--usage <usage_records>`, `--pricing <pricing_table>`, `--scenarios <scenario_params>`, `--conversion <conversion_ratio>`, and `--output <output_path>`. Pipe stdout to the terminal. Done when: the script is executed with all resolved parameters and stdout is piped to the terminal.

5. If the script exits non-zero, capture stderr, report the error verbatim, and return with status `blocked` and the five required output elements absent. If the script exits zero and output exists, confirm it contains the five required elements: pricing model, run-rate, scenario comparison table, conversion assumption, and sensitivity grid. Done when: the five required elements are confirmed present in the output, or a non-zero exit is handled with stderr captured and status `blocked` returned.

## Failure and recovery

| Failure class | Response |
|---|---|
| Missing required input | Abort; name the absent input. |
| Invalid pricing table schema | Abort; list missing required columns. |
| Projection script exits non-zero | Report error verbatim; return status `blocked`; do not claim done. |
| Empty or partial projection | Return the partial result with a `warning` note; do not suppress the missing elements. |

Partial-result rule: if the script produces output but omits one or more of the five required elements, return what was produced and name the absent elements. Do not fabricate or infer missing elements.

## Output

A cost projection brief with pricing model, run-rate, scenario comparison, conversion assumption, and sensitivity grid, in that order; printed to terminal and saved to `reports/pricing/`.
