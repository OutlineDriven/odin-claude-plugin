# finder-fixer mode — verdict, pin, and scope-guard specification

Activated when the classifier routes to `finder-fixer`: a review supplies a bounded
set of blocking findings, each with evidence and a cited location, plus explicit
file scope globs naming the only files this mode may edit.

## Verdict taxonomy

Each dispatched finding gets exactly one verdict. No finding is silently skipped —
a finding with no verdict stays open and costs a round.

| Verdict | When | Requirement |
|---------|------|-------------|
| `fixed` | Change code that addresses the finding's evidence, confined to a scope glob | Name a regression pin for any behavioral change |
| `rejected` | The finding is wrong, or fixing it requires an out-of-scope edit, or a documented guarantee makes it structurally unsatisfiable | Reason specific enough that a later reviewer can tell whether new evidence contradicts it |
| `deferred` | Minor or info only | Never defer a critical or major finding — deferring it leaves it open |

## Regression pins

A pin is a test or assertion that fails against the pre-fix code. It proves the
fix changed observable behavior in the intended direction.

| Fix type | Pin requirement |
|----------|-----------------|
| Behavior-changing (logic, control flow, return values) | One pin that fails pre-fix, passes post-fix |
| Heuristic over strings or severities | Table pins covering each class, not a single example |
| Prose, frontmatter, documentation | No pin — the next independent review verifies |

## Scope guard

Before any edit, confirm the finding's cited location exists and the file is
inside a dispatched scope glob. If the location is missing or the file is out of
scope, verdict `rejected` with `requires out-of-scope change: <path>` and make
no edit.

Register any newly created file with `git add -N <file>` so the diff and scope
guard can see it.

## Git-safety

Never run `git checkout --`, `git stash`, `git reset`, `git clean`, or
`git commit`. The working tree holds uncommitted work not created by this
invocation; this mode does not own the commit lifecycle.

## Minimal diff

Fix the finding, not the file. Unrelated cleanups widen the next review and
are not made. One fix per finding — no "while I'm here" changes.

## No narration

Add no comments, doc text, or names referencing this loop, rounds, iterations,
or previous fixes. The tree ships; the process does not.

## No goalpost moving

Never weaken a documented guarantee, threat model, or stated behavior to make
a finding pass. If the documentation makes a real finding structurally
unsatisfiable, verdict `rejected`, state why, and mark it `structural: true`
so the loop escalates the conflict to the user. Do not leave this disagreement
unresolved.

## Done when

Every dispatched finding has a verdict (`fixed` / `rejected` / `deferred`),
each `fixed` behavioral change has a named regression pin, and the verdict set
is complete so the next independent review can verify the changes.

## Provenance

Origin: Trail of Bits skills, https://github.com/trailofbits/skills, revision
d1f1575cff97816e5cc08af66cd2506099c681d3, file
plugins/code-improver/agents/fixer.md. License: CC-BY-SA-4.0 — preserve Trail
of Bits attribution and the source link, mark modifications, license
adaptations ShareAlike, claim no trademark rights, and never reuse
trail-of-bits-mark.svg as branding. Clean-room rewrite preserving the verdict,
scope-guard, git-safety, regression-pin, no-narration, no-goalpost-moving, and
minimal-diff mechanism without copying source expression.
