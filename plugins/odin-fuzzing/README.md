# ODIN Fuzzing

ODIN workflows for fuzz harnesses, fuzzer setup, sanitizers, and coverage analysis.

11 skills, category Security. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-fuzzing@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-fuzzing@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-fuzzing/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-fuzzing:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| atheris | Use when a user needs coverage-guided fuzzing for Python code or a Python native extension using Atheris. |
| cargo-fuzz | Use when initializing, running, measuring coverage, or triaging a cargo-fuzz target in a Rust crate. |
| fuzz-harness-writing | Use when a user needs to create or improve a deterministic, engine-agnostic fuzz harness for raw or structured target inputs. |
| fuzzing | Use when planning an end-to-end fuzzing program for a project: engine and target selection, corpus management, and CI or nightly wiring. |
| fuzzing-coverage-analysis | Use when a user needs to measure fuzz corpus coverage, explain a coverage plateau, or turn uncovered regions into campaign work. |
| fuzzing-dictionary | Use when a parser, protocol, or file format fuzzer stalls at fixed-token validation gates and needs a coverage dictionary. |
| fuzzing-obstacles | Use when asked to identify and bypass checksums, nondeterminism, or validation barriers that block fuzzing coverage. |
| libafl | Use when a LibAFL fuzzer needs an executor, observer, feedback, mutator, scheduler, or objective composed around a target. |
| libfuzzer | Use when asked to build, run, or triage a coverage-guided C/C++ fuzz campaign on the libFuzzer or AFL++ engine. |
| oss-fuzz | Use when enrolling a project in OSS-Fuzz, running its helper workflow locally, or reproducing an OSS-Fuzz report. |
| ruzzy | Use when asked to set up and run coverage-guided fuzzing of Ruby code or C extensions with Ruzzy, producing crash reports or clean campaign summaries. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
