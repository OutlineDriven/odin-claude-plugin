---
name: leave-only-first-principle
description: 'Use when asked to prune an existing design or codebase until only primitives remain, producing a reusable first-principles map for rewrite or study. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Leave only first principle

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User names a design artifact or codebase to reduce to its primitives before a rewrite or codebase lesson |
| Authority | Write only the named pruning map artifact; no other file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | A local file holding the pruned first-principles decomposition; recoverable by deletion |
| Done | Every leaf in the map is a language primitive, stdlib call, or proven irreducible primitive; no composite element remains |

## Inputs

- Required: a design artifact or codebase path, named by the human at invocation
- Optional: human-supplied trust boundary if a section is out of scope

## Procedure

1. **Name the target.** Confirm the exact design artifact or codebase path. Stop if more than one target is named. Done when: exactly one target is confirmed.
2. **Inventory every component.** Enumerate all named modules, classes, functions, data structures, and abstractions. Do not skip deprecated or generated sections. Done when: every named component in the target is listed.
3. **Classify each as primitive or composite.**
   - Primitive: language keyword, stdlib call, well-known third-party library call with a single documented responsibility, or a human-declared irreducible building block.
   - Composite: anything that hides a decision, delegates to another named component, or can be expressed more simply.
   Done when: every inventoried component has a primitive-or-composite label.
4. **Decompose composites recursively.** For each composite, write its name and the primitives it is made from. If a sub-component is also composite, recurse. Done when: every composite has been expanded into its constituents.
5. **Stop recursion when a leaf is a primitive.** A primitive does not decompose further. Done when: no composite remains unexpanded at a leaf.
6. **Record every irreducible primitive as a leaf.** No composite may survive as a leaf. Done when: every leaf in the map is a primitive.
7. **Write the map.** Produce a tree or list where every leaf is a primitive. Annotate leaves that are architectural decisions rather than code units. Done when: the map file is written and every leaf is primitive.

## Failure and recovery
- Ambiguous scope: the human named more than one target or the boundary is unclear. Stop and ask for a single, bounded target.
- Recursive loop: the decomposition circles without reaching primitives. Stop and surface the contested section with a `loop-detected` marker.
- Primitive dispute: the human asserts a composite is primitive. Accept the human's assertion; do not reclassify.
- Partial result: stop is reached before full decomposition. Return the partial map with a `non-converged` marker. Do not claim the map is complete.

## Output

A tree or structured list file `<target-name>-primitives.md` containing every component classified, each composite decomposed into its primitive leaves, a `non-converged` marker if any section was not fully resolved, and a `loop-detected` marker naming the contested section when the decomposition circled without reaching primitives.
