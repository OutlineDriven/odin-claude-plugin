---
name: dx-audit
description: 'Use when asked to audit the developer-facing surface of a CLI, SDK, library, or package across API contracts, errors, CLI behavior, public types, onboarding, and config. Returns bounded, severity-tiered findings with root-cause analysis and committable fixes for the smallest relevant public surface. Don''t use for tasks that require source or remote-system changes.'
---

# DX audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Audit my CLI, make this CLI agent-friendly, is this API ergonomic, SDK review, library DX, developer onboarding |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Produces recommended fixes as chat output; never applies them. |
| Side effect | Chat output only: severity-tiered findings with root-cause analysis and committable fix recommendations. No repository mutation. |
| Done | Returns bounded, root-caused DX findings for the smallest relevant public surface. |

## Inputs

Required: the developer-facing surface to audit — a named CLI command, exported API, package, error path, config loader, or the changed public surface from a diff.

Optional: a comparison baseline or prior release contract when the diff changes a public export, signature, or return shape.

## Procedure

1. **Lock scope.** Choose the narrowest mode: targeted (default — inspect the named or changed public surface and report) or exhaustive (only when the user explicitly asks for the whole package or every public surface). Write a one-line scope receipt naming the mode, surfaces, selected audit categories, and exclusions (end-user UI, docs prose, repo architecture, private internals).

2. **Identify the public surface.** Default to `git diff` against the repository's normal base, keeping only changed files reachable through a public entry point. With no useful diff, use the command, export, package, error, or config named by the user. Public reachability comes from `package.json` `exports`/`bin`, a command registry, an exported type, a documented config loader, or an observed error path. Do not audit a private helper unless a public caller exposes its behavior.

3. **Follow the evidence ladder, then stop.** (a) Read local instructions, the relevant manifest, and the diff or named entry point. (b) Trace only direct public dependencies and the nearest tests that establish behavior. (c) For a CLI, use a small safe probe set when useful: `--help`, `--version`, one success path, one invalid-input path. Do not trigger a real mutation merely to test DX. (d) Check a prior release contract only when the diff changes a public export, signature, or return shape. Stop when the behavior is proven, disproven, private, or outside scope. Do not browse general best-practice articles, inventory unrelated apps, or build static repo maps.

4. **Select audit categories candidate-first.** Map locked surfaces to these categories; applicability outranks global priority:

   | Priority | Category | Default impact | Checks |
   |---|---|---|---|
   | 1 | Public API and SDK | CRITICAL | Argument order, naming consistency, async consistency, no hidden side effects, predictable return shape, sensible defaults, stable contract |
   | 2 | Developer-facing errors | CRITICAL | Fail-fast validation, name/cause/value, no raw stack as message, stable error codes, suggest the fix |
   | 3 | CLI UX | HIGH | Flag naming, help and version, exit codes, structured I/O, pipes/TTY/JSON, schema introspection, agent input hardening, delta polling, idempotent resume, order-independent flags, responsive and progress, safe mutations, suggest corrections |
   | 4 | Exported type ergonomics | HIGH | No leaked any, prefer inference, helpful generics, discriminated unions, public JSDoc |
   | 5 | Install and first run | HIGH | Zero-config quickstart, minimal install, no required env, tree-shakeable |
   | 6 | Config ergonomics | MEDIUM | Optional with defaults, validate and discover, XDG and precedence |

   A public API entry point uses API, types, and reached error paths; a CLI uses CLI and reached error paths; exported declarations use types, plus API only when behavior changes; install and first run use onboarding; config loaders use config and reached error paths.

5. **Capability-gate within selected categories.** Structured JSON input and schema introspection apply when automation or agent use is promised, requested, or already supported. Dry-run and confirmation apply to destructive, expensive, or difficult-to-reverse mutations. Progress, delta polling, and resume apply to operations that can block, outlive one command, or be retried after ambiguous output. `stdin` applies when the command semantically accepts file or stream data. Stable-contract comparison applies only when a public contract changed.

6. **Rank root causes, not instances.** CRITICAL findings first, then HIGH, then MEDIUM. Merge repeated instances of one root cause into one finding with up to three representative locations. Do not flag a hypothetical missing feature with no current consumer path — YAGNI is not a defect. Do not turn absence of JSDoc, error codes, or a flag into one finding per symbol or command. In targeted mode, report all CRITICAL findings, then the highest-value remaining findings up to five total; summarize any remainder by category rather than expanding the audit.

7. **Verify on the same scope.** Re-open every cited location, rerun the same safe probes and focused project checks, and reapply the same category checks. A clean build alone does not prove CLI behavior; a runtime probe alone does not prove exported types. Verification evidence must match the finding.

## Failure and recovery
- **No public surface found:** If no changed file is reachable through a public entry point and the user named no surface, return that state and ask for a named command, export, or package. Do not audit private internals to fill the gap.
- **Probe resolves the published binary, not the local build:** `npx <pkg>` and an existing global install resolve the registry copy, so `--help`, exit codes, and error strings describe a release the working tree has not changed. Build, then invoke the local entry point (e.g., `node ./dist/cli.js`). If the local build cannot be produced, report that the probe reflects the published version and cannot confirm working-tree behavior.
- **Scope creep:** "DX", "gold standard", or "review holistically" do not authorize a multi-repo or whole-package sweep. If the request expands past the scope receipt, stop and re-lock scope rather than widening.
- **Partial-result rule:** Report all confirmed findings within the locked scope. Summarize out-of-scope candidates by category rather than expanding the audit. Never swallow an error or pretend the done predicate holds when evidence is missing.
- **Non-converged:** If evidence cannot prove or disprove a behavior (local build unavailable, probe inconclusive), report the finding as unconfirmed with the specific blocker rather than asserting pass or fail.

## Output
A compact report:

```markdown
### DX audit

Scope: `<surface>`; `<categories>`; <N> files inspected.

### Findings
- [IMPACT] `<category-check>` at `<file:line>`: <root cause>.
  Fix: <committable fix recommendation>.

### Deferred
- <count> lower-impact <category> candidates were outside the locked scope.
```

Only list files with findings. If none are material, return one pass line naming the surfaces and categories checked. Do not emit a pass entry for every clean file. In exhaustive mode, include every material finding; list clean files only when the user requests compliance-style evidence.

## Provenance

Origin: `mblode/agent-skills`, revision `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`, MIT license (Copyright (c) 2026 Matthew Blode). Clean-room adaptation: the source's rule-file-per-check structure and external reference files were inlined into a self-contained category table; the severity-tiered, root-cause-ranked, candidate-first selection mechanism, evidence ladder, and compact report format are preserved. Fix mode was dropped to honor read-only authority.
