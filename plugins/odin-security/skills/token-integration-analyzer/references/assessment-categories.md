# Token integration analyzer: assessment categories

Branch detail for the 10 assessment categories referenced by SKILL.md step 3.
For each applicable category, evaluate every checklist item against the codebase
and produce a compliance finding (pass, warning, or fail) with file and line
references.

## General Considerations

- Audit history
- Team transparency
- Security contact

## Contract Composition

- Complexity
- SafeMath or Solidity 0.8+ arithmetic guards
- Non-token functions
- Single address entry point

## Owner Privileges

- Upgradeability (proxy patterns)
- Minting caps
- Pausability
- Blacklisting
- Team accountability

## ERC20 Conformity

- Boolean return values on transfer/transferFrom
- Metadata presence
- Decimals type and value
- Race-condition mitigation (increaseAllowance/decreaseAllowance)

## ERC20 Extension Risks

- External calls in transfer (ERC777 hooks)
- Transfer fees
- Rebasing or yield-bearing mechanics

## Token Scarcity Analysis (on-chain only when address and RPC are supplied)

- Supply distribution
- Holder concentration
- Exchange listings
- Flash-loan and flash-mint risk

## Weird ERC20 Patterns

Check all 24 known nonstandard behaviors:

1. Reentrant calls (ERC777 hooks)
2. Missing return values (USDT, BNB, OMG)
3. Fee-on-transfer (STA, PAXG)
4. Balance modifications outside transfers (Ampleforth, Compound)
5. Upgradable tokens (USDC, USDT)
6. Flash-mintable (DAI)
7. Blocklists (USDC, USDT)
8. Pausable tokens (BNB, ZIL)
9. Approval race protections (USDT, KNC)
10. Revert on zero-address approval
11. Revert on zero-value approval
12. Revert on zero-value transfer
13. Multiple token addresses
14. Low decimals (USDC 6, Gemini 2)
15. High decimals (YAM-V2 24)
16. transferFrom with src==msg.sender
17. Non-string metadata (MKR)
18. Revert on transfer to zero
19. No-revert-on-failure (ZRX, EURS)
20. Revert on large approvals (UNI, COMP >= 2^96)
21. Code injection via token name
22. Upgradable tokens without proxy transparency
23. Snapshot mechanisms affecting balance reads
24. Delegated voting or checkpoint mechanisms

## Token Integration Safety

- Safe transfer patterns (SafeERC20)
- Balance verification before/after transfer
- Allowlist pattern
- Wrapper contracts
- Reentrancy guards on token interactions

## ERC721 Conformity

- Transfers to 0x0 revert
- safeTransferFrom and onERC721Received
- Metadata functions
- ownerOf behavior
- Approval clearing on transfer
- Token ID immutability

## ERC721 Common Risks

- onERC721Received reentrancy
- Safe minting to contracts
- Burning clears approvals
