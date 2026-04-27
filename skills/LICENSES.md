# Third-Party Attribution Registry

Single source of attribution for skills and reference documents adapted from upstream open-source projects. Individual skill files do not carry per-file copyright headers — attribution is consolidated here so SKILL.md prose stays clean. The license terms apply to the original upstream content; ODIN-style adaptations (rewording, language-agnostic generalization, voice changes, structural reorganization) are made under the same license.

Upstream reference: https://github.com/mattpocock/skills (Matt Pocock).

## Skills

Each row covers the SKILL.md (and any skill-internal references the upstream skill ships) at the listed path.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `domain-model/SKILL.md` | https://github.com/mattpocock/skills/tree/main/domain-model | MIT | © 2026 Matt Pocock | Adapted in ODIN voice; English-mandate; ODIN integration appendix added; reference paths rewritten to `references/`. |
| `ubiquitous-language/SKILL.md` | https://github.com/mattpocock/skills/tree/main/ubiquitous-language | MIT | © 2026 Matt Pocock | ODIN voice; modality disambiguation against `domain-model` and `askme`; `disable-model-invocation: true` preserved verbatim. |
| `grill-me/SKILL.md` | https://github.com/mattpocock/skills/tree/main/grill-me | MIT | © 2026 Matt Pocock | ODIN voice; explicit modality table vs `askme` and `domain-model`; banned-tooling references replaced with mandated alternatives; language-neutral examples. |
| `design-an-interface/SKILL.md` | https://github.com/mattpocock/skills/tree/main/design-an-interface | MIT | © 2026 Matt Pocock | ODIN voice; TypeScript interface examples regeneralized to ≥2 language families; "Design It Twice" framing preserved. |
| `improve-codebase-architecture/SKILL.md` | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture | MIT | © 2026 Matt Pocock | ODIN voice; cross-linked from `plan/SKILL.md` and `contexts/SKILL.md` per canonical-homes map. |
| `zoom-out/SKILL.md` | https://github.com/mattpocock/skills/tree/main/zoom-out | MIT | © 2026 Matt Pocock | ODIN voice; `disable-model-invocation: true` preserved verbatim; aligned with `odin:duet` director pattern. |
| `caveman/SKILL.md` | https://github.com/mattpocock/skills/tree/main/caveman | MIT | © 2026 Matt Pocock | Caveman-adapted: grammar-fragmentation dropped; verbosity reduction preserved; English-mandate honored. |
| `write-a-skill/SKILL.md` | https://github.com/mattpocock/skills/tree/main/write-a-skill | MIT | © 2026 Matt Pocock | ODIN voice; scope disambiguation against `odin:init` and `skill-creator:skill-creator`; language-neutral framing. |
| `git-guardrails-claude-code/SKILL.md` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | ODIN voice; cross-harness installation note added; safety-critical hook script (see `hook.sh` row below). |
| `git-guardrails-claude-code/hook.sh` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | Bash hook script ported verbatim. Pattern list and exit-2 contract are upstream's; install path adapted for ODIN harness. |
| `to-prd/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-prd | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: GitHub-issue emission abstracted to optional `--emit-issue` flag; default emits markdown PRD file. |
| `to-issues/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-issues | MIT | © 2026 Matt Pocock | ODIN voice; tracer-bullet vertical-slice framing preserved; emission modes (file vs `--emit-issue`) added. |
| `triage-issue/SKILL.md` | https://github.com/mattpocock/skills/tree/main/triage-issue | MIT | © 2026 Matt Pocock | ODIN voice; TDD fix-plan handoff to `odin:test-driven` made explicit. |
| `qa/SKILL.md` | https://github.com/mattpocock/skills/tree/main/qa | MIT | © 2026 Matt Pocock | ODIN voice; modality differentiation table vs `odin:review` and `odin:pr-review`. |
| `request-refactor-plan/SKILL.md` | https://github.com/mattpocock/skills/tree/main/request-refactor-plan | MIT | © 2026 Matt Pocock | ODIN voice; scope fence vs `odin:plan` and `odin:refactor-break-bw-compat`; emission modes added. |
| `github-triage/SKILL.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: hard-coded label names abstracted to a configurable label-map at the top of SKILL.md. |
| `setup-pre-commit/SKILL.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | ODIN voice; generalized from Husky+lint-staged to project's hook tool of choice (Husky, pre-commit, lefthook, cargo-husky, dune hooks). |
| `edit-article/SKILL.md` | https://github.com/mattpocock/skills/tree/main/edit-article | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: tightening heuristics restricted to mechanical/structural edits; voice/register/tone changes deferred to ODIN's English-mandate. |

## Reference documents

Reference documents cross-linked across multiple skills per the canonical-homes map. The owner skill carries the `references/` subdirectory; consumer skills link via relative paths.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `domain-model/references/ADR-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/ADR-FORMAT.md | MIT | © 2026 Matt Pocock | Language-agnostic ADR template; ODIN voice. |
| `domain-model/references/CONTEXT-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/CONTEXT-FORMAT.md | MIT | © 2026 Matt Pocock | Glossary entry format; ODIN voice; cross-linked from `contexts/SKILL.md`. |
| `improve-codebase-architecture/references/LANGUAGE.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-codebase-architecture/references/DEEPENING.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/DEEPENING.md | MIT | © 2026 Matt Pocock | Dependency taxonomy and seam discipline; TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-codebase-architecture/references/INTERFACE-DESIGN.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/INTERFACE-DESIGN.md | MIT | © 2026 Matt Pocock | "Design It Twice" parallel-generation workflow; TS examples regeneralized to ≥2 language families; cross-linked from `contexts/SKILL.md`. |
| `test-driven/references/mocking.md` | https://github.com/mattpocock/skills/blob/main/tdd/mocking.md | MIT | © 2026 Matt Pocock | Fold-in into existing `odin:test-driven`; JS mocking examples regeneralized to ≥2 language families. |
| `test-driven/references/interface-design.md` | https://github.com/mattpocock/skills/blob/main/tdd/interface-design.md | MIT | © 2026 Matt Pocock | Fold-in; TS interface examples regeneralized to ≥2 language families. |
| `test-driven/references/refactoring.md` | https://github.com/mattpocock/skills/blob/main/tdd/refactoring.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |
| `test-driven/references/deep-modules.md` | https://github.com/mattpocock/skills/blob/main/tdd/deep-modules.md | MIT | © 2026 Matt Pocock | Fold-in; npm-flavored examples regeneralized; ODIN voice. |
| `test-driven/references/tests.md` | https://github.com/mattpocock/skills/blob/main/tdd/tests.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |

## ODIN-only-gap skills (not Matt-derived)

The following skills are authored by ODIN and do not carry upstream attribution: `debug`, `perf-profile`, `security-review`, `deps-upgrade`. They are governed by the ODIN project license, not MIT.

## Full upstream license text (MIT)

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Maintenance notes

- New ports: add a row before merging the SKILL.md.
- Renamed paths: keep the old row with strikethrough and add the new path.
- Removed ports: keep the row with a "removed" provenance note for audit trail.
- Upstream relicensing: re-evaluate the entire registry; do not silently bump license fields.
