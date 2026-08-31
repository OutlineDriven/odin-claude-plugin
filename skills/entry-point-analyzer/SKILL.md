---
name: entry-point-analyzer
description: 'Use when asked to map state-changing externally callable entry points in a supported smart-contract codebase and classify each by access level. Returns a structured report of signatures, file and line, access classification, restriction evidence, callbacks, and analyzed-file accounting. Don''t use for tasks that require source or remote-system changes.'
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

## Procedure

1. Detect language(s) from file extensions and manifest contents using the supported-language list above. If no supported language is present, stop and report an unsupported codebase.
2. Apply the optional directory filter if supplied; only analyze files within that path and note the filter in the report scope.
3. Locate every contract/module file of the detected language(s) under the scoped path.
4. For Solidity only: check whether `slither` is available (`which slither`). If present, run `slither . --print entry-points` and use its table (contract, function, visibility, modifiers) as the foundation, then cross-reference with manual inspection for access classification. If Slither fails or is absent, fall back to manual analysis.
5. Parse each file for externally callable, state-changing functions. Exclude read-only functions per language: Solidity `view`/`pure`; Vyper `@view`/`@pure`; Solana functions without `mut` account references; Move non-entry `public fun` (module-callable only); TON `get` methods (FunC) and read-only receivers (Tact); CosmWasm `query` entry point and its handlers. Read-only functions cannot directly cause loss of funds or state corruption and are out of scope.
6. Classify each retained entry point into one access category:
   - **Public (Unrestricted)**: callable by anyone without restrictions.
   - **Role-Restricted**: limited to a specific role. Detect explicit role names (`admin`, `owner`, `governance`, `guardian`, `operator`, `manager`, `minter`, `pauser`, `keeper`, `relayer`, `lender`, `borrower`) and role-checking patterns (`onlyRole`, `hasRole`, `require(msg.sender == X)`, `assert_owner`, `#[access_control]`). Group by role where identifiable.
   - **Restricted (Review Required)**: an access-control pattern is present but the role is ambiguous or dynamic (e.g. `require(trusted[msg.sender])`); record the pattern and the reason manual verification is needed.
   - **Contract-Only (Internal Integration Points)**: callable only by other contracts, not EOAs. Indicators include callbacks (`onERC721Received`, `uniswapV3SwapCallback`, `flashLoanCallback`), interface implementations with contract-caller checks, functions that revert when `tx.origin == msg.sender`, and cross-contract hooks.
7. For each entry point, record the signature, file and line, the access category, the restriction evidence (modifier/decorator/role-check and its actual implementation, not just its name), and any callback or expected-caller note. When a function's access control is inherited from a parent contract, note the inheritance.
8. Be conservative: when access level is uncertain, flag as Restricted (Review Required) with the restriction pattern noted rather than miscategorize. Reject the shortcuts "this function looks standard", "the modifier name is clear", "this is obviously admin-only", "skip the callbacks", and "it doesn't modify much state"—trace the actual restriction, always include callbacks, and include every non-view function.
9. Generate the report in the Output format, including the summary count table, per-category tables, the Files Analyzed list with per-file entry-point counts, and any Analysis Warnings.

## Failure and recovery
- **Unparsable file**: note the file under an Analysis Warnings section of the report, continue with the remaining files, and recommend manual review for the unparsable file. Do not abort the whole analysis.
- **Slither failure** (compilation errors or unsupported features): fall back to manual analysis for Solidity and note the fallback in the report.
- **Ambiguous access control**: classify as Restricted (Review Required) with the pattern recorded; never assign a confident category without tracing the restriction's implementation.
- **Partial-result rule**: the report is returned with whatever entry points were successfully analyzed plus explicit warnings for what could not be parsed; the done predicate holds only when every in-scope file was either analyzed or warned.
- **Non-mutation rule**: no source file, configuration, or repository state is changed; recovery never edits the codebase.
- **Blocked result**: if no supported language is detected, return a report stating the unsupported codebase and stop without inventing entry points.

## Output
A markdown report structured as follows:

- Header: project name, analysis timestamp, scope (directories analyzed or "full codebase"), detected languages, and the focus statement (state-changing functions only; view/pure excluded).
- Summary table counting Public, Role-Restricted, Restricted (Review Required), Contract-Only, and Total.
- Public Entry Points (Unrestricted) table: `Function`, `File` (`path:L<line>`), `Notes`.
- Role-Restricted Entry Points tables grouped by role (Admin/Owner, Governance, Guardian/Pauser, Other Roles) with `Function`, `File`, `Restriction` (and `Role` for Other Roles).
- Restricted (Review Required) table: `Function`, `File`, `Pattern`, `Why Review`.
- Contract-Only (Internal Integration Points) table: `Function`, `File`, `Expected Caller`.
- Files Analyzed list: each path with its state-changing entry-point count.
- Analysis Warnings section listing any unparsable files, Slither fallbacks, and recommended manual review.

## Provenance

Origin: https://github.com/trailofbits/skills, pinned revision d1f1575cff97816e5cc08af66cd2506099c681d3, source path /plugins/entry-point-analyzer/skills/entry-point-analyzer/SKILL.md. License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3. Preserve Trail of Bits attribution and the source link; mark modifications; license adaptations ShareAlike; claim no trademark rights; never reuse trail-of-bits-mark.svg as branding. Adaptation statement: clean-room adaptation preserving the entry-point extraction, access-classification, callback-tracking, and Slither-integration mechanism as a self-contained procedure with no external reference files or peer-skill dependencies.
