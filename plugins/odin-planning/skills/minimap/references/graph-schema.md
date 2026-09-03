# `graph.yaml` schema

`graph.yaml` uses schema version `odin.graph/v1`.

```yaml
schema: odin.graph/v1
revision: <non-empty revision identifier>
nodes:
  - id: <unique non-empty identifier>
    type: Invariant | Surface | Store | Hazard | Decision
    label: <non-empty human label>
edges:
  - from: <existing node id>
    to: <existing node id>
    type: constrains | reads | writes | fails-when
```

The `schema`, `revision`, `nodes`, and `edges` fields are required. Node IDs are unique. Every edge endpoint names an existing node. Reject an unknown schema version, node type, edge type, duplicate node ID, or dangling edge. Ignore unknown top-level and per-record fields so additive metadata remains forward compatible.

Nodes and edges are immutable within one revision. A declared gate may replan focus nodes without changing topology. Any node or edge change creates a new revision.
