---
name: automatic-freeform-graphs-design
description: 'Use when a user wants a looser conceptual graph for exploratory work. Generates a freeform conceptual graph that the user can explore. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Automatic freeform graphs design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a looser conceptual graph for exploratory work. |
| Authority | Reversible local: write only one named freeform conceptual graph artifact to the working directory. Do not mutate VCS, credentials, remotes, or published content. Roll back by deleting or overwriting that single file. |
| Side effect | A freeform conceptual graph artifact for exploration, written to the local filesystem. |
| Done | A freeform conceptual graph is generated and can be used for exploration. |

## Inputs

- Exploratory topic or problem statement (required): the subject area to map. May be a question, a half-formed idea, a domain, or a set of related concerns.
- Existing notes or fragments (optional): prior concepts, questions, or connections the graph should incorporate.
- Output path (optional): where to write the graph artifact. Defaults to a file in the working directory.

## Procedure

1. Read the exploratory topic and any supplied notes. Identify the kind of exploration: open-ended question, design-space survey, concept mapping, or unknown-territory scouting. Done when: the exploration type is identified from the topic and notes.
2. Extract concepts, questions, unknowns, and hypotheses as candidate nodes. Do not force them into a dependency order: this is exploration, not execution planning. Done when: candidate nodes are extracted without imposing a dependency order.
3. Map relationships between nodes as labeled edges. Use relationship types suited to exploration: influences, tensions, supports, contradicts, depends-on-maybe, raises-question-of, and unknown-link. Allow cycles, bidirectional edges, and self-references where the exploration calls for them. Done when: edges are mapped with exploration-suited relationship labels, allowing cycles.
4. Mark each node and edge with a confidence marker: certain, suspected, or unknown. Mark open questions explicitly so the graph surfaces what is not yet known. Done when: every node and edge has a confidence marker and open questions are marked.
5. Identify clusters of tightly connected nodes and label them as provisional themes. Identify bridges between clusters as high-value exploration targets. Done when: clusters are labeled as themes and bridges are identified as high-value targets.
6. Write the graph as a text artifact: a node list with confidence markers, an edge list with relationship labels, a cluster summary, the high-value bridge targets identified in step 5, and a list of open questions. Use a plain-text or markdown format that a human can read and revise without tooling. Done when: the graph artifact is written with all five sections in human-readable format.
7. Review the graph against the original topic. Check that it surfaces the key unknowns without imposing a false dependency order. If a region is sparse or missing, add nodes and edges rather than leaving gaps. Done when: the graph surfaces key unknowns and has no false dependency order or sparse gaps.

## Failure and recovery
- Topic too vague to extract nodes: ask the human for one concrete anchor (a question, a constraint, or a stakeholder concern), then proceed from that anchor. Do not fabricate concepts to fill the graph.
- Graph collapses into a linear chain or strict DAG: the procedure drifted toward execution planning. Restart at step 3 and deliberately use non-dependency relationship types (tensions, unknowns, contradictions) to break the chain.
- Graph too dense to read: collapse low-confidence peripheral nodes into a summary node and keep the high-value bridges visible. Preserve the full node list in an appendix section.
- Partial result: if the procedure stops before step 7, deliver the graph as-is with an explicit note on which review step was not completed. Do not claim the done predicate holds.
- Rollback: the artifact is a single local file. Delete or overwrite it to revert. No other state is mutated.

## Output
A single freeform conceptual graph artifact ordered: node list (with confidence markers), labeled edge list (allowing cycles), provisional cluster summary, high-value bridge targets, open-questions list — human-readable, revisable without tooling.
