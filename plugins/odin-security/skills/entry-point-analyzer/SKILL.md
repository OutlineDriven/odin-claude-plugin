---
name: entry-point-analyzer
description: 'Use when mapping state-changing external entry points in a smart-contract codebase by access level, auditing access control, or invoking an entry-points command. Read-only. Not for remote mutation.'
---

# Entry point analyzer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to map state-changing externally callable entry points, audit flows, access-control categories, callbacks, or privileged operations in a supported smart-contract codebase. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Analysis reads source files only and emits chat output. |
| Side effect | A structured smart-contract entry-point and access-classification report emitted as chat output. |
| Done | Every in-scope state-changing external entry point is listed with signature, file and line, access classification, restriction evidence, callbacks, warnings for unparsable files, and analyzed-file accounting. |

## Inputs

- A smart-contract codebase path (required). Supported languages: Solidity (`.sol`), Vyper (`.vy`), Solana/Rust (`.rs` with a `Cargo.toml` containing `solana-program`), Move Sui (`.move` with a `Move.toml` containing `edition`), Move Aptos (`.move` with a `Move.toml` containing `Aptos`), TON (`.fc`/`.func`/`.tact`), and CosmWasm (`.rs` with a `Cargo.toml` containing `cosmwasm-std`).
- An optional directory filter restricting analysis to a subpath.
- An optional project name for the report header.

## Invocation

The human-invoked `entry-points` command is a supported entry: pass an optional directory path to bound the scope. With no argument, the current working directory is the scope. Resolve the directory to an absolute path and confirm it exists before analysis; stop and report an unresolved path rather than defaulting silently or widening scope. The optional directory filter in the procedure handles this bound.

## Procedure

1. Detect language(s) from file extensions and manifest contents using the supported-language list above. If no supported language is present, stop and report an unsupported codebase. Done when: the detected language(s) are confirmed or the codebase is reported as unsupported.
2. Apply the optional directory filter if supplied; only analyze files within that path and note the filter in the report scope. Done when: the scope is bounded to the filtered path or the full codebase.
3. Locate every contract/module file of the detected language(s) under the scoped path. Done when: every contract/module file is located.
4. For Solidity only: check whether `slither` is available (`which slither`). If present, run `slither . --print entry-points` and use its table (contract, function, visibility, modifiers) as the foundation, then cross-reference with manual inspection for access classification. If Slither fails or is absent, fall back to manual analysis. Done when: Slither is run or manual analysis is selected as fallback.
5. Parse each file for externally callable, state-changing functions. Exclude read-only functions per language: Solidity `view`/`pure`; Vyper `@view`/`@pure`; Solana functions without `mut` account references; Move non-entry `public fun` (module-callable only); TON `get` methods (FunC) and read-only receivers (Tact); CosmWasm `query` entry point and its handlers. Read-only functions cannot directly cause loss of funds or state corruption and are out of scope. Done when: every state-changing external function is retained and every read-only function is excluded.
6. Classify each retained entry point into one access category:
   - Public (Unrestricted): callable by anyone without restrictions.
   - Role-Restricted: limited to a specific role. Detect explicit role names (`admin`, `owner`, `governance`, `guardian`, `operator`, `manager`, `minter`, `pauser`, `keeper`, `relayer`, `lender`, `borrower`) and role-checking patterns (`onlyRole`, `hasRole`, `require(msg.sender == X)`, `assert_owner`, `#[access_control]`). Group by role where identifiable.
   - Restricted (Review Required): an access-control pattern is present but the role is ambiguous or dynamic (e.g. `require(trusted[msg.sender])`); record the pattern and the reason manual verification is needed.
   - Contract-Only (Internal Integration Points): callable only by other contracts, not EOAs. Indicators include callbacks (`onERC721Received`, `uniswapV3SwapCallback`, `flashLoanCallback`), interface implementations with contract-caller checks, functions that revert when `tx.origin == msg.sender`, and cross-contract hooks.
   Done when: every retained entry point is classified into one access category.
7. For each entry point, record the signature, file and line, the access category, the restriction evidence (modifier/decorator/role-check and its actual implementation, not just its name), and any callback or expected-caller note. When a function's access control is inherited from a parent contract, note the inheritance. Done when: every entry point has signature, file/line, category, restriction evidence, and callback note recorded.
8. Be conservative. When the access level is uncertain, classify it as Restricted (Review Required) and note the restriction pattern rather than miscategorizing it. Reject these shortcuts: "this function looks standard", "the modifier name is clear", "this is obviously admin-only", "skip the callbacks", and "it doesn't modify much state". Trace the actual restriction, always include callbacks, and include every non-view function. Done when: every uncertain entry point is classified as Restricted (Review Required) with the pattern noted.
9. Generate the report in the Output format, including the summary count table, per-category tables, the Files Analyzed list with per-file entry-point counts, and any Analysis Warnings. Done when: the report is generated with all sections.

## Failure and recovery
- Unparsable file: note the file under an Analysis Warnings section of the report, continue with the remaining files, and recommend manual review for the unparsable file. Do not abort the whole analysis.
- Slither failure (compilation errors or unsupported features): fall back to manual analysis for Solidity and note the fallback in the report.
- Ambiguous access control: classify as Restricted (Review Required) with the pattern recorded; never assign a confident category without tracing the restriction's implementation.
- Partial-result rule: the report is returned with whatever entry points were successfully analyzed plus explicit warnings for what could not be parsed; the done predicate holds only when every in-scope file was either analyzed or warned.
- Non-mutation rule: no source file, configuration, or repository state is changed; recovery never edits the codebase.
- Blocked result: if no supported language is detected, return a report stating the unsupported codebase and stop without inventing entry points.

## Output
A markdown report with header (project, timestamp, scope, languages, focus), summary count table (Public/Role-Restricted/Restricted/Contract-Only/Total), per-category tables with Function/File/Restriction/Notes, Files Analyzed list with per-file counts, and Analysis Warnings for unparsable files or Slither fallbacks.
