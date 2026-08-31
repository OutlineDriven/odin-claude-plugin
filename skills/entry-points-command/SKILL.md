---
name: entry-points-command
description: 'Use when a human explicitly invokes the entry-points command with an optional directory path. The command resolves the directory argument and reports the state-changing entry points found in the smart contract source under that scope. Don''t use for tasks that require source or remote-system changes.'
---

# Entry points command

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes the entry-points command with an optional directory path. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | The entry-point analysis report for the command-selected directory, emitted as chat output only. |
| Done | The directory argument is resolved and the full entry-point analysis workflow is invoked for that exact scope. |

## Inputs

- Directory path (optional). If omitted, the current working directory is the scope.

## Procedure

1. Parse the directory path from the invocation arguments. If the argument is empty, use the current working directory.
2. Resolve the directory to an absolute path and confirm it exists and is a directory. Stop if it does not.
3. Bound the analysis scope to that directory tree. Do not read or report outside it.
4. Locate smart contract source files in the scope by extension and content patterns for the supported ecosystems: Solidity, Vyper, Solana, CosmWasm, Move on Aptos, Move on Sui, and TON.
5. For each source file, identify entry points: public or externally callable functions, message handlers, or contract interface functions that can mutate contract state.
6. For each candidate entry point, determine whether it performs a state-changing operation such as a storage write, token transfer, balance change, access-control set, or equivalent mutation of on-chain state.
7. Collect the identified state-changing entry points with file path, function or handler name, and a one-line description of the state change.
8. Emit the report as chat output for the resolved scope.

## Failure and recovery
- Unresolved or non-existent directory: stop and report the unresolved path. Do not default silently or widen scope.
- No smart contract source files found in scope: report that no entry points were found for the scope. This is a valid empty result, not a failure.
- Unparseable or ambiguous source: report the file and the parse limitation, then continue with remaining files. Do not invent entry points.
- Partial results are reported with the files that succeeded and the files that were skipped. No rollback is required because no mutation occurs.

## Output
A chat-output report listing, for the resolved directory scope, each state-changing entry point with its source file path, function or handler name, and a one-line description of the state change. If no smart contract source is present, the report states that no entry points were found.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, file /plugins/entry-point-analyzer/commands/entry-points.md. License CC-BY-SA-4.0; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Adapted as a self-contained ODIN command skill: the directory-resolution and invocation mechanism is preserved, and the referenced entry-point-analyzer workflow is inlined because this skill may not depend on another skill or module.
