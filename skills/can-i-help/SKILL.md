---
name: can-i-help
description: Route contributors to data-backed contribution opportunities. Use when the user asks "where can I help", "what can I contribute", "find a good first issue", or "what should I work on".
metadata:
  short-description: Contribution opportunity router
---

# Can I Help: interest-routed contribution matching

Turn repository state into contributor action. Collect project context, ask the developer what kind of contribution they want, map that interest to the strongest native signals, then return exact file/line recommendations with data-backed rationale and an executable first step.

The invariant: no vague "look around `src/`". Every recommendation names a file and preferably a line, states why the target matters, explains the local code in 2 to 3 sentences, and gives the first command or edit.

## When to Apply / NOT

Apply:
- A contributor asks where to start, what needs work, or what would be a good first issue.
- A maintainer wants to route a helper toward tests, bugs, docs, or cleanup using repo evidence.
- An OSS project has open issues but unclear contribution paths.
- The user wants quick, low-risk cleanup and accepts the verification gate before deletion claims.

NOT:
- The user already named the exact task or issue; solve that task instead.
- The repo cannot be read locally and no public issue tracker is available; report the missing substrate.
- The user asks for maintainer-only triage, release planning, or architectural roadmap work.
- The request is pure project orientation with no contribution decision; produce orientation, not recommendations.

## Workflow

1. **Resolve target and collect base context.** Default target = current repo unless the user supplied a path. Capture the project shape before ranking anything:
   - Manifests: `fd '^(package.json|pyproject.toml|Cargo.toml|go.mod|pom.xml|build.gradle|deno.json|bun.lockb|pnpm-lock.yaml|requirements.txt)$' <repo>`.
   - Top-level structure: `fd --max-depth 3 --type f <repo>`; exclude generated/vendor directories.
   - README / contributing docs: `fd '^(README|CONTRIBUTING|DEVELOPMENT|HACKING)(\..*)?$' <repo>` then read the relevant file ranges.
   - Test roots: `fd '(^test$|^tests$|__tests__|spec$|\.test\.|\.spec\.)' <repo>`.
   - Build/test commands: derive from manifest scripts, Makefile targets, CI config, or existing docs; mark certainty **MEDIUM** unless a command is explicitly declared.

2. **Collect contribution signals with native recipes.** Prefer indexed codegraph when available; otherwise use `ast-grep`, `rg`, `fd`, and git history recipes. Keep every signal as `{kind, file, line?, metric, confidence, evidence}`.
   - **Good-first areas**: low blast radius, clear adjacent patterns, nearby tests, recent maintainer activity, low bug density. Codegraph: `codegraph_impact` on candidate symbols and `codegraph_files` for local neighborhoods. Fallback: count importers with `rg -n 'from .*/<module>|require\(.*/<module>|use .*<module>|import .*<module>'` and prefer files with few dependents plus visible neighboring tests.
   - **Test gaps**: hot source files with no co-changing test file and no nearby test. Native history recipe: `git --no-pager log --since='180 days ago' --name-only --format='commit:%H' -- <src-paths>`; rank source files by touches, then subtract files whose commits include a matching `test|tests|spec|__tests__` path. Certainty **HIGH** when source churn ≥5 and zero matching test co-change; **MEDIUM** when no test root exists but naming conventions are unclear.
   - **Doc drift**: docs with zero or weak code coupling, stale inline identifiers, or examples importing paths that no longer exist. History recipe: `git --no-pager log --since='365 days ago' --name-only --format='commit:%H' -- docs README* CONTRIBUTING*`; compute doc commits with no source files. Symbol recipe: extract backticked identifiers/import paths from docs, check via codegraph search, else `rg -n '<identifier-or-path>' <repo>`. Certainty **HIGH** for broken import/path; **MEDIUM** for zero code coupling.
   - **Bugspots**: files repeatedly touched by fix commits. History recipe: `git --no-pager log --since='365 days ago' --regexp-ignore-case --grep='fix|bug|regression|crash|panic|race|leak|broken' --name-only --format='commit:%H' -- <repo>`; bug-fix rate = `fix_touches / max(total_touches, 1)`. Certainty **HIGH** when fix_touches ≥3 and rate ≥0.25.
   - **Open issues**: `gh issue list --state open --limit 15 --json number,title,labels`. Treat labels `bug`, `good first issue`, `help wanted`, `documentation`, `test`, `testing`, `cleanup`, `refactor` as routing hints. If `gh` fails, mark issue signal unavailable and continue.
   - **Slop-deletion candidates**: commented-out code, orphan exports, passthrough wrappers, and always-true/always-false conditions. Use AST where possible; never promise zero-behavior cleanup until the slop verification gate passes.

3. **Ask the developer's interest: mandatory and first before recommendations.** Use the ODIN `ask` tool, single-select, exactly one Recommended option. Do this even if signals already look obvious.

   Prompt: `What kind of contribution do you want to make?`

   Options:
   - `New to the stack`: Recommended when good-first areas or cleanup candidates exist.
   - `Experienced`: hard problems, bugspots, architecture-adjacent issues.
   - `Want to write tests`: test gaps and bugspot overlap.
   - `Want to fix bugs`: bug-labelled issues, bugspots, suspicious conditions.
   - `Want to improve docs`: stale references, doc drift, documentation issues.
   - `Want quick cleanup`: verified deletion-only or tightly-contained cleanup.

4. **Route interest to signals.** Use `references/interest-routing.md` as the contract. Lead with the strongest non-empty primary signal for the chosen interest; skip empty subsections with one sentence, not a filler apology. If the chosen interest has no supporting signal, say which signal was empty and pivot to the nearest adjacent interest with data.

5. **Read before explaining.** For every candidate that survives ranking, read the target file range plus enough surrounding code to understand the local pattern. For docs, read the stale doc and the current code target. For tests, read one nearby existing test pattern. Structural claims without a read are **Graft**.

6. **Emit 2 to 5 recommendations.** Each recommendation MUST use the four-field shape:
   - **What**: exact file and line/range, function, issue number, or doc section.
   - **Why**: data-backed metric: bug-fix rate, test-gap touch count, zero doc coupling, broken symbol lookup, issue label, confidence score.
   - **How**: 2 to 3 sentences explaining the local code and the contribution shape.
   - **First step**: exact command/action, e.g. `bat -P -p -n src/parser/expr.ts`, `rg -n 'parseExpr' tests src`, `gh issue view 42`, or `edit src/foo.ts:88-93 after reading context`.

7. **Offer the next depth step.** Close with: `Want me to walk you through one of these? I can read the target code, outline the exact diff, or draft the PR description.` Do not stop at the recommendation list.

## Ranking Rules

- Prioritize file-level evidence over directory-level evidence.
- Prefer overlap: `test gap ∩ bugspot` beats standalone test gap; `doc drift ∩ open documentation issue` beats standalone stale doc.
- Prefer clear first PRs for newcomers: one file, local pattern, existing tests/docs nearby, low dependents.
- Prefer maintainer value for experienced contributors: bugspot with open issue, high-impact symbol, repeated regression area.
- Cap to 5 recommendations; more is choice overload.
- Certainty labels: **HIGH** = direct file/line evidence plus metric; **MEDIUM** = strong heuristic but missing one axis; **LOW** = only issue label or filename hint. Do not present LOW as fact.

## Slop Cleanup Gate

Apply `references/slop-cleanup-gate.md` in full whenever a recommendation is cleanup-shaped AND claims "zero behavior change" — regardless of whether it surfaced from step 3's `Want quick cleanup` interest, a slop-deletion signal, or a cleanup-labeled issue. A recommendation that makes no such claim never routes through this gate.

## Anti-patterns

- Treating GitHub labels as enough evidence when repo signals disagree.
- Dumping raw signal tables instead of translating them into contribution moves.
- Suggesting generated, vendored, lockfile, snapshot, or build-output files.
- Ranking by personal preference instead of stated contributor interest.

## Validation Gates

| Gate | Pass Criteria | Blocking |
|---|---|---|
| Interest asked | ODIN `ask` single-select used before recommendations | Yes |
| Signals collected | At least base context plus one of test gaps / doc drift / bugspots / issues / cleanup candidates | Yes |
| File-level target | Every recommendation includes exact file and line/range when available | Yes |
| Data-backed why | Every recommendation has a metric, label, confidence, or observed coupling fact | Yes |
| Code read | Each recommendation's How is based on a read source/doc range | Yes |
| Cleanup verified | Cleanup claims passed caller + context checks | Yes for zero-behavior wording |
| Four-field shape | What / Why / How / First step present for each item | Yes |
| Go-deeper close | Final question offers walkthrough/diff/PR help | Yes |
