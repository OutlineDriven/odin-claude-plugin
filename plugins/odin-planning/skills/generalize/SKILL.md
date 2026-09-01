---
name: generalize
description: 'Use when asked to derive the general rule a request carries when it arrives as examples instead of a stated rule, then bound that rule. Not for ambiguity resolution inside a stated request — use clarify. Read-only.'
---

# Generalize from cases

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The ask is carried by instances ("do it like this one", "fix these three the same way", "here is a sample of what I mean"), material lands as a data drop with no stated ask ("here is the data, you figure it out"), or one instance is clearly standing in for a class. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Edits nothing; the deliverable is a stated rule handed off for downstream application. |
| Side effect | Chat output only: a stated rule, its boundary, and the probe basis. Hands off for downstream application; read-only on source material. |
| Done | The surviving rule reproduces every supplied case, every dropped candidate names the case that killed it, the boundary names at least one concrete excluded neighbour, and no discriminating probe is still open. |

## Not for

- Ambiguity resolution inside a stated request — use clarify.
- Intent exploration with no examples on the table — use askme, which explores ambiguous intent through verbalized sampling and clarifying questions; generalize derives a rule from supplied cases. The split is: examples present → generalize; no examples, just ambiguity → askme.
- Applying the rule — the deliverable is the stated rule; acting on it belongs downstream.

## Inputs

- **Cases (required).** The examples the user pointed at. Collect positives (instances pointed at approvingly or asked to be repeated) and negatives (anything named "not that", including an earlier attempt the user rejected). A rejected attempt is the most informative case in the set because it kills hypotheses no positive can.
- **Negatives (optional but load-bearing when present).** With no negatives the hypothesis space is wide and the probe step carries the whole result.
- **Data drop (a case-set variant).** Material arrived with no stated ask: a pasted log, a dump, a folder, a link. Treat every item as a positive and read the shape of what was handed over as the case set; the deliverable changes to a stated inferred intent handed back for confirmation.
- **Probe material (optional).** Other files, rows, sibling call sites, or neighbouring paragraphs in the user's own material that surviving candidates may classify differently.

## Procedure

1. Collect the case set before reading any case as a rule. List every positive and every negative. State the set size in the output so the reader knows how much evidence stands behind the rule. For a data drop, treat every item as a positive and read the shape of what was handed over as the case set; the deliverable becomes a stated inferred intent handed back for confirmation. Done when: the case set is listed with set size and each case marked positive or negative.
2. Split each case into features. List every observable attribute of each case: subject, location, shape, trigger, wording, scale, whatever it exhibits. Attributes, not impressions. "Returns early on nil" is a feature; "is clean" is not. Done when: every case has its features listed.
3. Mark invariant against incidental. An attribute present in every positive and absent from every negative is *candidate-invariant*. An attribute that varies across positives is *incidental*. With a single positive this step decides nothing: every attribute stays candidate-invariant and the probe step does the work. Done when: every attribute is marked candidate-invariant or incidental.
4. Write rival rules, narrow to broad. State 2 to 4 candidate rules ordered by generality, one sentence each, weighted 0 to 1. Every candidate must reproduce all positives and exclude all negatives. A candidate that misses a supplied case is dead; drop it and name the case that killed it. If the filter leaves exactly one candidate, the induction is settled, so go to step 6. Done when: 2 to 4 rival rules are stated, or the filter reduced them to one with the killing case named.
5. Probe with a real item. Find something that exists in the user's own material (another file, another row, a sibling call site, a neighbouring paragraph) that the surviving candidates classify *differently*. That item is the discriminator. Resolve it from evidence first using search, glob, read, language-server, or a scout subagent: if the material shows the probe item already follows one candidate's rule, that candidate wins and the question dies. Ask only when evidence cannot settle it, as one single-select question naming the surviving readings, each shown by what it would do to the probe item, with a recommended default. Never ask a probe the material answers. Done when: the probe is resolved from evidence or asked as a single-select with a recommended default.
6. Bound the rule. A rule is not stated until its edge is. Name three things: what it covers, what it deliberately excludes, and the nearest excluded neighbour, meaning the closest thing a reader might expect to be swept in that will not be. "Everything similar" is not a boundary. Done when: the boundary names covers, excludes, and a concrete nearest excluded neighbour.
7. Emit the generalization contract and stop. Output the case set with each case marked positive or negative, the surviving rule, the invariant attributes it rests on, the incidental attributes it discards, the boundary with its nearest excluded neighbour, and the probe with its basis. For a data drop, also state the inferred intent as a proposal to confirm. Then hand off. Do not apply the rule here; acting on it belongs to the next step. Done when: the generalization contract is emitted and the skill stops without applying the rule.

## Failure and recovery

- Overfit: the example's incidental details are treated as requirements, so the change would land on one instance and stop. Recovery: step 3 marks incidental attributes, and the rule must rest only on candidate-invariant attributes.
- Overgeneralize: too much is stripped, so the change would land where it was never wanted. Recovery: step 4 requires every candidate to exclude every negative; a candidate that fails a negative is dropped and the killing case is named.
- Single candidate written from the start: one hypothesis is a guess wearing a method. Recovery: step 4 requires 2 to 4 rival rules, or an explicit showing that the filter reduced them to one.
- Boundary phrased as "and similar cases": this defers the decision this skill exists to make. Recovery: step 6 requires a concrete nearest excluded neighbour.
- Asking a probe the material answers: recovery: step 5 resolves from evidence first, every time; the single-select question is only for evidence the material cannot settle.
- Applying the rule here: the rule is the deliverable; acting on it belongs downstream. Recovery: step 7 emits the contract and stops.
- Partial-result rule: if the probe cannot be resolved from evidence and the user does not answer, emit the surviving candidate(s) with the open probe marked unresolved and the done predicate not satisfied. Never swallow the open probe or pretend the rule is settled.
- Non-mutation rule: this skill edits nothing. On any failure it leaves all source material unchanged and returns the partial contract above.

## Output

A generalization contract: the case set (each case marked positive/negative with features), candidate rules (weight, status, killing case), surviving rule, invariant attributes, incidental attributes, boundary (covers, excludes, nearest excluded neighbour), and probe (item, basis, resolved-by) — for a data drop, also the inferred intent as a proposal to confirm; on structured-output request, a fenced `generalization/v1` YAML block.
