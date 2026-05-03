# Worked audits

Three terse examples — prose, code, decision. Each: artifact → per-anchor verdict → top-3 fixes → revised. Visual domain deferred to `/odin:design`.

## Example 1 — Prose (corporate-blog opener)

**Artifact**:
> Sure! In this post, we'll explore some really fascinating considerations around the topic of API design, which is, basically, a really important topic in modern software development. There are many factors to consider, and the best approach often depends on your specific use case.

**Audit**:

| Anchor | Verdict | Citation | Fix |
|---|---|---|---|
| Clarity | fail | Side A: AI-flat prose | Lead with the actual claim, not a topic announcement |
| Hierarchy | fail | Side A: AI-flat prose | Verdict sentence first, supporting after |
| Intent | fail | Side A: hedge-stack ("really fascinating", "basically", "many factors") | Cut every hedge; commit to one position |
| Coherence | warn | — | Tone is tour-guide; the post body claims to be technical |
| Restraint | fail | Side A: ceremony | Drop the framing paragraph entirely |
| Generosity | pass | — | (Cannot judge — body absent) |
| Honesty | fail | Side A: "depends on your use case" | Name the position; if there is none, do not write the post |
| One-strong-moment | fail | Side A: 50/50 hedge | Pick one design rule; argue it |

**Top-3 fixes**: 1. Open with the position. 2. Cut every "really", "basically", "fascinating". 3. If there is no position, kill the post.

**Revised**:
> Most APIs are too configurable. Default to one path; let callers pay for the second one only when they need it.

## Example 2 — Code (defensive nil + abstraction tower)

**Artifact**:
```ts
class UserServiceFactoryBuilder {
  build(): UserServiceFactory {
    return new UserServiceFactory();
  }
}
class UserServiceFactory {
  create(): UserService { return new UserService(); }
}
class UserService {
  getUser(id: string): User | null {
    if (id === null || id === undefined || id === "") return null;
    const user = this.repo.find(id);
    if (user !== null && user !== undefined) { return user; }
    return null;
  }
}
```

**Audit**:

| Anchor | Verdict | Citation | Fix |
|---|---|---|---|
| Clarity | fail | Side B: abstraction tower | Replace 3 classes with `getUser(id)` function |
| Hierarchy | fail | — | One call site; no factory needed |
| Intent | fail | Side A: defensive nil-checks | Type system rules out "" if `id: NonEmptyString` |
| Coherence | warn | — | TS strict mode rules out `undefined`; the checks contradict the type |
| Restraint | fail | Side B: parameterization, Side A: defensive checks | Inline; delete factory layer |
| Generosity | fail | Side A: silent null return | Throw with the id when not found |
| Honesty | fail | Side B: "Factory" performs architecture | Name the function for what it does |
| One-strong-moment | fail | — | Nothing in 12 lines justifies its weight |

**Top-3 fixes**: 1. Collapse 3 classes to 1 function. 2. Drop the nil-checks; lean on the type. 3. Throw with the id instead of returning null.

**Revised**:
```ts
function getUser(id: NonEmptyString): User {
  return repo.find(id) ?? (() => { throw new Error(`user not found: ${id}`); })();
}
```

## Example 3 — Decision (ADR with weighted matrix)

**Artifact**:
> ## Decision: Postgres vs MySQL
> Both Postgres and MySQL have merit. Postgres scores 8.2/10 on our weighted matrix (correctness 9, ecosystem 8, ops 7, cost 8, team familiarity 9); MySQL scores 7.8/10 (correctness 7, ecosystem 9, ops 8, cost 9, team familiarity 6). The recommendation depends on which factors you weight most heavily.

**Audit**:

| Anchor | Verdict | Citation | Fix |
|---|---|---|---|
| Clarity | fail | Side A: 50/50 hedge | State the pick in the first line |
| Hierarchy | fail | Side B: scoring matrix | The matrix is the alibi for not picking |
| Intent | fail | Side A: "depends" | Pick one; defend it |
| Coherence | warn | — | "Decision" header but no decision in body |
| Restraint | fail | Side B: 5-criterion scoring | Two reasons suffice if they are load-bearing |
| Generosity | fail | — | No cost named for the recommendation |
| Honesty | fail | Side B: scoring performs rigor | Name the real reason (likely "team knows Postgres") |
| One-strong-moment | fail | Side A: 50/50 hedge | The decision is the moment; it is missing |

**Top-3 fixes**: 1. First line names the pick. 2. Drop the scoring matrix entirely. 3. Two reasons (one for, one against), not five weighted axes.

**Revised**:
> ## Decision: Postgres
> We pick Postgres. The team has 5 years of operational experience with it; switching to MySQL costs 6+ months of unfamiliar incident response. The trade-off: MySQL's ecosystem is broader for our planned analytics path, and we accept that cost.
