# ODIN Formal

ODIN workflows for formal methods: model checking, SMT solving, deductive verification, and proof assistants.

9 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-formal@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-formal@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-formal/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-formal:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| bounded-model-checking-c | Use when C or C++ code needs memory-safety or undefined-behavior guarantees proved with CBMC, or ACSL contracts checked with Frama-C Eva or WP. |
| deductive-verification-with-dafny-and-why3 | Use when an imperative program needs pre-conditions, post-conditions, and loop invariants proved automatically by SMT in Dafny or Why3, short of a tactic prover. |
| f-star-effectful-verification | Use when effectful, security-sensitive code needs refinement-typed, SMT-backed verification in F*, in the HACL* or Project Everest style. |
| rust-formal-verification | Use when Rust code, especially unsafe or panic-critical paths, needs a Kani, Verus, or Creusot harness written, run, and its failure read. |
| smt-solving-with-z3-cvc5 | Use when a query needs direct SMT solving, an unsat core needs debugging, or another tool reports a solver timeout or unknown. |
| writing-isabelle-proofs | Use when a proof needs Isabelle/HOL, its Sledgehammer automation, or an AFP session. |
| writing-lean-proofs | Use when asked to design, write, review, refactor, lint, or performance-diagnose Lean 4 proofs, libraries, or tactics. |
| writing-rocq-proofs | Use when a proof needs Rocq (formerly Coq), including legacy Coq codebase maintenance and migration through the Coq to Rocq rename. |
| writing-tla-plus-specs | Use when a protocol, concurrent algorithm, or design needs a model-checked TLA+ or Alloy spec, or a TLC or Apalache trace needs reading. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
