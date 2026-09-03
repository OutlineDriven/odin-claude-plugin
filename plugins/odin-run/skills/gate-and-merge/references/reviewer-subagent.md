# Reviewer subagent

Load this when dispatching the reading gates for a PR. One dispatch per PR, into a fresh context
that has never seen the queue or the merge decision.

The subagent returns findings. It merges nothing, pushes nothing, comments nothing, and resolves
nothing. Every verdict stays with the orchestrator.

## Assignment template

Fill the slots at dispatch time and send this as the whole assignment.

```
You are reviewing one pull request. Return findings only. You have no merge, push, comment, or
close authority, and you will not be asked for a verdict.

<pr>
Number: {number}
Title: {title}
Head: {head_ref} at {head_ref_oid}
Base: {base_ref}
</pr>

<what-to-read>
Read the file set and the whole diff:

  gh pr diff {number} --name-only
  gh pr diff {number}

Read the surrounding code for any file the diff changes. A finding you cannot ground in code you
actually read is not a finding.
</what-to-read>

<scope>
Report the file set as one of three shapes:

- A file set spanning unrelated subsystems under a title naming one concern: report as mixed
  concerns. That mixing is what makes the revert impossible later.
- A lockfile or generated path alongside source: report it. A PR that is only a lockfile or only
  generated output is one concern and passes.
- Otherwise: one concern, no finding.
</scope>

<diff>
Read the whole diff once. A finding names a reachable input or state that produces the wrong
result, with `file:line`. A line that is merely unlovely is not a finding. Six classes, ordered by
what actually breaks:

1. Wrong on a plausible input: an unhandled empty, missing, or boundary value on a path the change
   introduces.
2. Trust boundary: untrusted input reaching a sink unvalidated, or a credential in the diff.
3. Resource and error path: an acquired resource with no release on the failure path, a swallowed
   error, or a partial write with no rollback.
4. Concurrency: shared state written without the lock its neighbours take, or an await between a
   read and its dependent write.
5. Contract drift: a changed signature, error string, config key, or wire field with a caller left
   behind. This class must search rather than read: `grep` the old name tree-wide, and a surviving
   caller is a finding.
6. Convention: the diff introduces a second way to do what the repo already does one way.

Classes 1 to 5 carry a reachable wrong result or they are not findings. Class 6 needs the existing
one way cited by path.
</diff>

<tests>
A behavior change with no test that fails without it is a finding. Say whether the repository has
a suite the change fits, and whether the change touches a trust boundary or data at rest. Never
demand a test for plumbing.
</tests>

<return>
One block per finding, and nothing else:

  class: <scope | 1 | 2 | 3 | 4 | 5 | 6 | tests>
  where: <file:line>
  reachable: <the input or state that produces the wrong result>
  design fault: <the design-level fault the finding is evidence of, in one sentence>
  repair: <the change that makes the general case absorb it, and every file it touches>

List every file your repair would touch, including files outside the PR file set. The orchestrator
decides what that costs; you do not.

If nothing survives the three gates, return exactly `no findings` and stop. Do not pad the list to
look thorough.
</return>
```

## Slot reference

| Slot | Source |
|---|---|
| `{number}` | The PR number from the queue listing |
| `{title}` | `title` from the queue listing |
| `{head_ref}` | `headRefName` from the queue listing |
| `{head_ref_oid}` | `headRefOid` from the queue listing, so the subagent reviews the head the orchestrator will merge |
| `{base_ref}` | `baseRefName`, re-read at the PR's turn rather than taken from the graph drawn at the start |

## Why the split exists

The diff gate's criterion is irreducibly fuzzy: whether a wrong result is reachable is a judgment,
not a check. The merge step sits in the same context and supplies the pull to rush that judgment. A
real context boundary is the defense, so the reading gates run where the merge decision is not
visible.

Done when: the PR has one returned finding set from a subagent that never saw the merge decision.
A subagent that returns nothing, or returns findings it could not ground, is re-dispatched once,
and a second failure holds the PR.
