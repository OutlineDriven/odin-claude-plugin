# Slop Cleanup Gate

Cleanup candidates are attractive but dangerous because "deletion-only" is easy to overclaim.

Before any cleanup recommendation says "zero behavior change":
1. Read the file and surrounding block.
2. Check references with codegraph callers/search when indexed; fallback `rg -n '<symbol>' <repo>` and language-specific `ast-grep` for import/export sites.
3. Check framework entry reachability: route files, plugin registries, CLI command tables, dynamic imports, reflection decorators, config exports, and generated public APIs.
4. Classify:
   - **Pure deletion HIGH**: commented-out code that re-parses as old code and has no live marker; orphan export with no references and no entry reachability.
   - **Contained refactor MEDIUM**: passthrough wrapper with all call sites visible; first step is call-site inventory, not deletion.
   - **Bug investigation MEDIUM**: always-true/false condition; likely wrong predicate, not cleanup.
5. If any entry-reachability doubt remains, phrase as "cleanup candidate" and make the first step verification, not removal.
