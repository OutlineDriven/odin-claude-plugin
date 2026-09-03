---
name: instruction-phrasing-microtest
description: 'Use when changing the wording of a rule in a skill, prompt template, or agent instruction where the change is meant to alter model output. Produces a scored results table comparing each variant against a no-guidance control, with every match hand-verified.'
---

# Instruction phrasing microtest

## Contract

| Field | Bound contract |
|---|---|
| Trigger | About to change the wording of a rule in a skill, prompt template, or agent instruction, where the change is meant to alter what the model produces. |
| Authority | Reversible-local: writes only a local results table file; no repository, VCS, credential, paid, published, deployed, or remote mutation. Rollback is deleting the results file. |
| Side effect | Runs a bounded set of cheap single-call model samples against variant system prompts and writes a scored results table. No repository mutation. |
| Done | A results table exists comparing each variant against the control on programmatic markers, with every match hand-verified, and the adopted phrasing beats the control on the target metric without regressing the others — or the change is dropped as unmeasurable. |

## Inputs

1. **Control text** (required): the current wording of the rule or instruction being evaluated.
2. **Variant texts** (required): one or more proposed rephrasings. Each variant must be a complete, self-contained instruction — not a diff or delta from the control.
3. **Fixture scenario** (required): a realistic mid-workflow user message or task prompt that would trigger the rule. Must be specific enough to tempt the failure the instruction targets.
4. **Scoring markers** (required): regex patterns or literal strings to search for in model output that indicate compliance or violation. At least one compliance marker and one violation marker.
5. **Target metric** (required): which scoring marker the variant must improve over the control.
6. **Sample count** (optional, default 5): number of model calls per variant. Minimum 5 for statistical signal.
7. **Model** (optional): the model to sample. Must match the model that writes the artifact in production.

## Procedure

1. **Classify the instruction.** Determine which category the current rule falls into:
   - Tripwire: phrase-level self-check on concrete tokens (e.g., "if your output contains 'do not flag' … stop").
   - Recognition table: red-flags or rationalization table read at decision time.
   - Discrete-directive prohibition: "Do not ask X to do Y" where the model has no competing incentive to do Y.
   - Composition prohibition: a prohibition on how to compose output where the model has its own agenda for the output (e.g., restating specs feels like helpful curation).
   This classification determines which phrasing strategies are worth testing. Composition prohibitions are the category most likely to backfire; tripwires and recognition tables are the most reliable.

2. **Build the sample matrix.** For each variant plus the control, prepare N identical API calls where:
   - System prompt = the variant instruction text embedded in realistic surrounding context (not isolated — context matters for instruction following).
   - User message = the fixture scenario.
   - Temperature = the production default for this model and task.
   - All other parameters match production settings.

3. **Run samples.** Execute all calls. One API call per sample. Record the full model output for each.

4. **Score programmatically.** For each sample output, run every scoring marker. Record match counts. Do not interpret or summarize — raw counts only.

5. **Inspect every match manually.** Before trusting any programmatic score, read each flagged output. A common false positive is the model correctly quoting the prohibition in its reasoning, which the grep mislabels as a violation. Automated negation detection can also mislabel compliant output. Discard false positives and re-score.

6. **Compute per-variant summary.** For each variant and the control, report:
   - Mean and variance of each scoring marker across samples.
   - Whether the variant beats the control on the target metric.
   - Whether the variant regresses on any non-target metric.

7. **Apply acceptance rule.** Adopt a variant only if it beats the control on the target metric without regressing any other metric. If two variants tie, prefer the shorter phrasing — prose length is a real cost when the instruction is re-read hundreds of times per session. If no variant beats the control, drop the change as unmeasurable.

8. **Write results table.** Produce a table with columns: Variant, Marker 1 (mean ± variance), Marker 2, …, Target metric delta, Verdict (adopt / drop / inconclusive). Include the manual-inspection notes for any match that was reclassified.

## Failure and recovery
- Insufficient samples: if fewer than 5 samples per variant complete, the run is invalid. Re-run with the same parameters.
- All variants tie with control: report "unmeasurable" — the instruction change has no detectable effect at this sample size. Do not adopt.
- Variant regresses a non-target metric: report the regression and drop the variant. Do not adopt a phrasing that trades one improvement for one regression.
- **Scoring markers produce zero hits across all variants including control**: the markers are wrong, not the instructions. Halt, redefine markers, re-run.
- Model API failure mid-run: discard partial results for the failed variant. Re-run only the failed variant's remaining samples.
- **False-positive rate above 20% after manual inspection**: the markers are too noisy to produce a verdict. Halt and redefine markers.

No rollback is needed because no repository files are modified. The results table is the only artifact.

## Output
A local results file (Markdown table) containing:
- The control and each variant's full text.
- Per-variant scoring summary with mean, variance, and manual-inspection notes.
- The acceptance verdict per variant.
- The final recommendation: adopt (with the winning variant text), drop (with reason), or inconclusive (with what additional evidence would resolve it).
