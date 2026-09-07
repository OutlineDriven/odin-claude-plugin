# ODIN Security

ODIN workflows for security review, vulnerability triage, and defensive implementation.

38 skills, category Security. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-security@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-security@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-security/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-security:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| build-program-graph | Use when a multi-language program graph is needed for call paths, entrypoints, blast radius, or taint reachability. |
| burpsuite-project-parser | Use when asked to analyze a Burp Suite .burp project for audit items, request/response metadata, or captured traffic. |
| c-security-review | Use when the user requests a userspace C or C++ security review with a threat model and severity filter and wants validated findings. |
| chain-vulnerability-scanner | Use when an Algorand, Cairo, Cosmos SDK, Solana, Substrate, or TON codebase needs vulnerability scanning with reachability-backed findings. |
| codeql-security-analysis | Use when building or reusing a CodeQL database, running CodeQL security analysis, or modeling project-specific sources and sinks. |
| confirmed-security-review | Use when the user asks for a security review, vulnerability audit, or review of injection, XSS, auth, or crypto. |
| constant-time-analysis | Use when reviewing cryptographic code for timing side-channels, statically in compiled output or at runtime with statistical timing tests. |
| crypto-protocol-diagram | Use when asked for a sequence diagram of cryptographic protocol semantics from code, prose, RFCs, papers, ProVerif, or Tamarin, or for code/spec divergence. |
| django-access-review | Use when reviewing Django or DRF access control, IDOR, authorization, permissions, or tenant isolation. |
| entry-point-analyzer | Use when mapping state-changing external entry points in a smart-contract codebase by access level, auditing access control, or invoking an entry-points command. |
| firebase-apk-scanner | Use when an authorized user needs to assess mobile-backend exposure from compiled Android APKs, covering Firebase, custom HTTP backends, and cloud function endpoints. |
| function-audit-context-analyzer | Use when asked for audit-context analysis of one function, or to build audit context across codebase before vulnerability hunting. |
| gha-security-review | Use when asked to review GitHub Actions for exploitable vulnerabilities, including prompt injection through Claude Code Action, Gemini CLI, or OpenAI Codex. |
| graph-evolution | Use when two refs or source snapshots need security-relevant structural comparison a line diff may miss. |
| insecure-default-discovery | Use when the user asks to audit a file, subtree, or repository for fallback secrets, default credentials, fail-open controls, weak primitives, or permissive access. |
| mermaid-to-proverif | Use when a crypto Mermaid sequenceDiagram needs a ProVerif model for secrecy, authentication, replay, or forward-secrecy checks. |
| oauth2-flow-implementation | Use when asked to implement, debug, validate, or explain an OAuth 2.1 flow: auth code with PKCE, client credentials, device, or refresh. |
| project-findings-onto-graph | Use when SARIF, reviewer annotations, or third-party findings must be projected onto a program graph. |
| rust-security-review | Use when asked for a Rust security or correctness audit of a crate, service, or library with unsafe, FFI, concurrency, async, or untrusted-input code. |
| security-finding-verification | Use when a named security allegation needs a true-positive or false-positive verdict. |
| security-hardening | Use when adding security controls for untrusted input, auth/authz, data storage, or external integrations. |
| security-review | Use when changes touch auth, parsing, dependencies, network, or pre-release, or a diff or baseline needs regression review. |
| semgrep-rule-authoring | Use when a vulnerability or pattern and target language need a new Semgrep rule, or an existing rule needs porting to another language. |
| semgrep-security-scan | Use when a user asks for a Semgrep security scan or fast pattern-based scan of a codebase. |
| sharp-edges | Use when asked to audit a code surface for misuse resistance or security edge cases, including delegated specialist analysis with exploitability validation (mode: specialist). |
| smart-contract-audit-prep | Use when a smart-contract project must become review-ready before an audit. |
| smart-contract-guidelines-advisor | Use when a smart-contract project needs architecture, testing, or a maturity scorecard. |
| smart-contract-secure-workflow | Use when a smart-contract team invokes this before check-in or deployment. |
| supply-chain-risk-auditor | Use when assessing npm, PyPI, or Go dependency supply-chain risk, with lockfile-absent paths marked unassessable. |
| token-integration-analyzer | Use when a token implementation or integration needs standards, privilege, nonstandard-behavior, and defensive-integration analysis. |
| trailmark-structural | Use when a target needs a Trailmark summary of languages, entrypoints, dependencies, or a snapshot of hotspots, taint, blast radius, subgraphs. |
| triage-security-finding | Use when exactly one concrete security finding with a source anchor needs a verdict before PoC work. |
| variant-hunt | Use when a confirmed root cause must be searched across a codebase, turned into a search rule, or seeded from graph neighbors. |
| vector-forge | Use when crypto implementations and a vector harness need mutation-driven cross-implementation test vector expansion. |
| vulnerability-triage-brocards | Use when a vulnerability report, CVE, bug-bounty submission, or automated finding needs triage before deep verification. |
| wycheproof | Use when validating crypto against Project Wycheproof vectors, or explaining a disagreement with a vector. |
| yara-rule-authoring | Use when writing, reviewing, optimizing, validating, or migrating YARA or YARA-X malware-detection rules, including CRX or DEX rules. |
| zeroize-audit | Use when auditing C, C++, or Rust secret-handling code to verify zeroization survives compiler optimization. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
