---
name: generalize-from-cases
description: 'Derive the general rule a request actually carries when it arrives as examples instead of a stated rule, then bound that rule before anyone acts on it. Use when the ask is carried by instances ("do it like this one", "fix these three the same way", "here is a sample of what I mean"), when material lands as a data drop with no stated ask ("here is the data, you figure it out"), or when one instance is clearly standing in for a class. For ambiguity inside a stated request, use clarify; for intent exploration with no examples on the table, use askme.'
---

# Generalize from cases

The request arrived as examples, not as a rule. Recover the rule. Two failures mirror each other: **overfit** treats the example's incidental details as requirements, so the change lands on one instance and stops; **overgeneralize** strips too much, so the change lands where it was never wanted. Both come from skipping the split between what is the point and what is circumstance.

This skill edits nothing. The deliverable is a stated rule with a boundary. Whatever applies it runs afterwards, against the rule rather than the examples.

## Case set

Collect every example before reading any of them as a rule.

- **Positives** — instances the user pointed at approvingly or asked to have repeated.
- **Negatives** — anything named as "not that", including an earlier attempt the user rejected. A rejected attempt is the most informative case in the set, because it kills hypotheses no positive can.
- **Size** — one positive and no negatives is the common case and the weakest. The hypothesis space is wide and step 4 carries the whole result. State the set size in the output so the reader knows how much evidence stands behind the rule.
- **Data drop** — the material arrived with no stated ask: a pasted log, a dump, a folder, a link. Treat every item as a positive and read the shape of what was handed over as the case set. The deliverable changes with it: state the intent you infer and hand it back for confirmation instead of asking what the user wants done. A wrong proposal is corrected in one line, where a question restarts the exchange.

## Method

1. **Split each case into features.** List every observable attribute of each case: subject, location, shape, trigger, wording, scale, whatever it exhibits. Attributes, not impressions. "Returns early on nil" is a feature; "is clean" is not.

2. **Mark invariant against incidental.** An attribute present in every positive and absent from every negative is *candidate-invariant*. An attribute that varies across positives is *incidental*. With a single positive this step decides nothing: every attribute stays candidate-invariant and step 4 does the work.

3. **Write rival rules, narrow to broad.** State 2 to 4 candidate rules ordered by generality, one sentence each, weighted 0 to 1. Every candidate must reproduce all positives and exclude all negatives. A candidate that misses a supplied case is dead; drop it and name the case that killed it. If the filter leaves exactly one candidate, the induction is settled, so go to step 5.

4. **Probe with a real item.** Find something that exists in the user's own material (another file, another row, a sibling call site, a neighbouring paragraph) that the surviving candidates classify *differently*. That item is the discriminator. Resolve it from evidence first with `grep`, `glob`, `read`, `lsp`, or a scout subagent: if the material shows the probe item already follows one candidate's rule, that candidate wins and the question dies. Ask only when evidence cannot settle it, using the `AskUserQuestion` contract in `skills/askme/SKILL.md`: one single-select naming the surviving readings, each shown by what it would do to the probe item, with a recommended default. Never ask a probe the material answers.

5. **Bound the rule.** A rule is not stated until its edge is. Name three things: what it covers, what it deliberately excludes, and the nearest excluded neighbour, meaning the closest thing a reader might expect to be swept in that will not be. "Everything similar" is not a boundary.

6. **Emit the generalization contract and stop.** Output the case set with each case marked positive or negative, the surviving rule, the invariant attributes it rests on, the incidental attributes it discards, the boundary with its nearest excluded neighbour, and the probe with its basis. For a data drop, also state the inferred intent as a proposal to confirm. Then hand off.

## Completion

Done when all four hold: the surviving rule reproduces every supplied case, every dropped candidate names the case that killed it, the boundary names at least one concrete excluded neighbour, and no discriminating probe is still open.

## Rejected shapes

- Applying the rule here. The rule is the deliverable; acting on it belongs to the next skill.
- Asking a probe the material answers. Step 4 resolves from evidence first, every time.
- A single candidate written from the start. One hypothesis is a guess wearing a method. Write rivals, or show that step 3's filter reduced them to one.
- A boundary phrased as "and similar cases". That defers the decision this skill exists to make.

## Machine-readable output

On explicit request for structured output, emit a fenced `generalization/v1` block containing YAML with `cases` (list of `{id, polarity, features}`), `candidates` (list of `{rule, weight, status, killed_by}`), `rule`, `invariant`, `incidental`, `boundary` (`{covers, excludes, nearest_excluded}`), and `probe` (`{item, basis, resolved_by}`). In a plain interactive run, emit only the human-readable contract.
