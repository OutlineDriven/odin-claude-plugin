---
name: fixture-eval-harness
description: 'Use when asked to invoke the eval scripts to score skill scenarios against rubrics. Emit results JSON and exit non-zero on any rubric, forbidden-noise, or forbidden-tool failure. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Fixture eval harness

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human invokes `pnpm run eval`, `eval:builder`, `eval:skill`, or `eval:sensitive`. |
| Authority | Reversible-local: write only to a git-ignored results directory under an isolated temp sessions root. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes results JSON to the git-ignored results dir; exits non-zero on any rubric failure; forbidden-noise and forbidden-tool hits fail outright. |
| Done | Repeatable, fast (~15-25s per scenario) runs where every rubric check passes and a failure points at model/instructions/catalogue rather than capture flakiness; a seeded frozen approved analysis isolates the builder from describer variance. |

## Inputs

- A scenario suite selected by the invoked script: `eval:builder`, `eval:skill`, `eval:sensitive`, or the aggregate `eval`.
- Optional: a seeded frozen approved analysis per scenario, used to isolate the builder from describer variance. When supplied, do not regenerate it.
- Optional: an opt-in judge, enabled by flag.

## Procedure

1. Bound scope before any run: resolve an isolated temp sessions root for this run and confirm the results directory is git-ignored before writing to it.
2. Select the scenario suite from the invoked script (`eval:builder`, `eval:skill`, `eval:sensitive`, or the aggregate `eval`).
3. For each scenario, load its fixture and, when supplied, the seeded frozen approved analysis; do not regenerate a seeded analysis.
4. Run the scenario capture under the configured model, instructions, and catalogue; keep each scenario fast (~15-25s).
5. Score rubric-primary: evaluate each scenario against its rubric checks. Treat forbidden-noise and forbidden-tool hits as outright failures independent of the rubric pass count.
6. When the opt-in judge is enabled, run it only on scenarios the rubric did not already resolve; judge output is advisory unless a rubric check consumes it.
7. Write the results JSON to the git-ignored results directory.
8. Exit non-zero if any rubric, forbidden-noise, or forbidden-tool check failed; exit zero only when the full check set passes.

## Failure and recovery
- Capture failure (timeout, crash, missing fixture): mark that scenario failed, record the capture error in the results JSON, and continue the remaining scenarios; do not attribute a capture failure to the model, instructions, or catalogue.
- Rubric failure: non-zero exit; the results JSON names the failing check so the failure points at model/instructions/catalogue rather than capture flakiness.
- forbidden-noise or forbidden-tool hit: non-zero exit, outright, regardless of rubric results.
- Partial results: scenarios completed before a capture failure are retained in the results JSON; the run still exits non-zero if any retained scenario failed or any check failed.
- Rollback: all writes are confined to the git-ignored results dir under the isolated temp sessions root; delete that directory to discard a run. No mutation outside it.

## Output
- A results JSON file in the git-ignored results directory recording per-scenario rubric outcomes, forbidden-noise and forbidden-tool hits, capture errors, and the seeded-analysis state used.
- A process exit code: zero only when the full check set passes, non-zero on any failure.

## Provenance

- Origin: https://github.com/microsoft/skill-recorder, revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61, MIT (Microsoft Corporation). Adapted clean-room: the deterministic fixture eval harness design — isolated temp sessions root, rubric-primary scoring, opt-in judge, seeded frozen analyses, non-zero exit on failure — is re-expressed as a self-contained procedure; no source expression is copied.
