# Survey and ranking

Depth indicators and two-axis scoring for the brownfield survey sub-branch. Assumes the vocabulary in the survivor SKILL.md — module, interface, depth, seam, adapter, leverage, locality.

## Depth indicators

For each public module (directories with an index or entry point, packages, or namespaces exposing types and functions consumed by other modules), evaluate:

- Surface size: number of distinct types, functions, and constants in the public surface.
- Internal abstraction: presence of private types, helper modules, or sub-namespaces holding logic separate from the entry point.
- Coupling: does the public surface delegate to other modules or contain all logic inline?
- Width: does the module expose many unrelated responsibilities on its public surface?

A shallow module has a broad public surface with few internal abstractions, where logic lives directly on the public surface and is not decomposed into internal seams.

## Two-axis ranking

Order shallow modules by:

- Refactoring effort: how many call sites or dependents would need to change. Lower effort ranks higher.
- Architectural gain: how much internal depth the module would gain from decomposition. Higher gain ranks higher.

Higher gain and lower effort ranks higher.

## Report shape

- Ranked list of all shallow modules with their effort and gain scores.
- Top candidate with a one-paragraph rationale for why it ranks first.
- Internal seam notes: what seams the top candidate would need to expose.
- Load-bearing rejection: if the top candidate cannot be deepened without breaking a hard invariant or triggering a cascade, note this with the specific invariant or cascade.
