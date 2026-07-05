---
name: zoom-out
description: Step up one layer of abstraction and map surrounding modules, callers, and invariants. Use when the local view is too narrow, the region is unfamiliar, or before committing to a change in unknown code.
disable-model-invocation: true
---

Stop reading the local fragment. Climb one level of abstraction and produce a map: which modules surround this region, who calls into it, what it calls out to, and where its invariants live. Dispatch an Explore agent (`fd`-first discovery, then `git grep`/`ast-grep` for call-site enumeration) rather than reading individual files; the goal is structural orientation, not line-level detail.

Output is a compact module-and-caller map, not a narrative. Name the surrounding components, the inbound and outbound edges, and any obvious invariant boundaries (transactional scope, ownership, IO surfaces). Stop at one layer up unless the user asks for more. Over-zoom dilutes the orientation.
