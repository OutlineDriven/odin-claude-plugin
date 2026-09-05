---
name: check-agent-compatibility
description: 'Use when a human explicitly asks for a full repository agent-compatibility pass returning a scored report with prioritized fixes. Not for tasks that require source or remote-system changes.'
---

# Check agent compatibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Full repository agent-compatibility pass, invoked explicitly by a human |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; target is read-only CLI and review passes. No repository, configuration, or remote state is changed |
| Done | A scored compatibility report with prioritized fixes and broken-down dimension results is returned |

## Inputs

- Repository path to audit (must be supplied).
- Optional scope limit (subdirectory or file glob) narrowing the pass; when omitted the whole repository is audited.

## Procedure

1. Parse scope and bind to the repository. Resolve the repository path to an absolute directory and apply the optional scope limit. Do not widen scope mid-pass. Done when: scope is bound to the repository path and optional limit.
2. Discover agent configuration and instruction surfaces. Scan for: `.claude/` directories (`settings.json`, `commands/`, `hooks/`), `CLAUDE.md` and `AGENTS.md` files, `.cursor/` directories, `plugin.json` or `.claude-plugin/` manifests, `agents/openai.yaml` skill manifests, MCP configuration files (`.mcp.json`, `mcp.json`), and any `skills/*/SKILL.md` trees. Done when: all agent configuration and instruction surfaces within scope are discovered.
3. Validate syntax, schema, and dependency resolution for discovered surfaces. For each surface: parse JSON/YAML syntax, check required schema fields against the expected format, and verify that referenced files (entry points, hook scripts, skill directories) exist and resolve. Done when: every discovered surface is validated or its validation error is recorded.
4. Run read-only agent startup and configuration loading. Attempt to load the agent configuration as the host would: parse settings, resolve hook definitions without executing them, resolve tool permissions, and load skill manifests. Registering a hook in the host runs its command, so resolve and validate hook definitions only; do not register or run them. Capture any startup errors, missing dependencies, or configuration conflicts. Do not execute any tool or mutation. Done when: startup and configuration loading is attempted, hook definitions are resolved without execution, and results are captured.
5. Aggregate findings into a scored compatibility report. Score each of the four dimensions on a 0-100 scale:
   - Configuration validity (syntax, schema, field completeness)
   - Instruction reliability (documented instructions match observed repository behavior)
   - Startup readiness (configuration loading and tool registration succeed without mutation)
   - Dependency resolution (referenced files, entry points, and skill paths resolve)
   Compute the composite as the unweighted average of available dimension scores. A dimension that could not be evaluated contributes no score and does not lower the composite. Rank findings by impact on agent compatibility. Done when: the scored report with prioritized fixes is produced.

## Failure and recovery

- Missing repository path: stop and report the blocked input; do not guess a path or widen scope.
- Missing required runtime blocking startup: record the missing runtime as a startup-readiness failure that could not be evaluated; continue evaluating the other dimensions. The blocked dimension contributes no score and does not lower the composite.
- Review pass error: stop that dimension, record which dimension failed, and continue the remaining dimensions. The returned report marks the failed dimension rather than pretending it passed.
- No mutation occurs on any failure. Because the pass is read-only, there are no changes to roll back.

## Output

A chat report containing the composite compatibility score (0-100), the per-dimension scores with broken-down findings, and a prioritized fix list ranked by impact on agent compatibility.
