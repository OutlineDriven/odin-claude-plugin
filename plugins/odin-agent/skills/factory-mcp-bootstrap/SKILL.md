---
name: factory-mcp-bootstrap
description: 'Use when someone outside Warp wants to wire a third-party coding agent (Claude Code, Codex, or Cursor) to a Warp Factory MCP endpoint. Provisions a 30-day bearer credential, writes a bearer-token MCP registration in the target harness, reloads it, and verifies protocol-level tool and resource discovery. Not for unattended runs; credential minting requires explicit human invocation.'
disable-model-invocation: true
---

# Factory MCP bootstrap

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Someone outside Warp wants a third-party coding agent to reach a Warp Factory: "set up Factory MCP in Claude Code / Codex / Cursor", "add the factory MCP server", "connect my agent to Warp Factory" |
| Authority | Human-only. Mints a 30-day API credential and writes a bearer-token MCP registration; both are credential and data-at-rest mutations requiring explicit human invocation |
| Side effect | Confirms the oz CLI, runs oz login, mints a 30-day API key exported as WARP_API_KEY, writes a harness-specific MCP registration carrying an Authorization: Bearer header, reloads the harness, and performs read-only protocol verification calls |
| Done | The MCP endpoint `{server_root}/api/v1/mcp/factory` is registered with a valid bearer token; `tools/list` shows the ten Factory tools; `list_factories` returns any non-auth-error response (empty allowed); the endpoint serves its factory setup document through both `resources/list` and `resources/read` without an auth error; the user is told setup is done and the agent hands off and stops |

## Inputs

- Target harness: which coding agent to wire — Claude Code, Codex, or Cursor. Must be supplied.
- Server root: the Warp Factory API root URL. Must be supplied if not inferable from oz context.
- Factory creation: optional. Create a factory only when the user explicitly requests it; otherwise skip.

## Procedure

1. Confirm the `oz` CLI is installed by running `oz --version`. If it is not on PATH, tell the user that `oz` is required and stop. Do not invent or guess an install command. Done when: oz is confirmed installed, or the user is told it is required and the skill stops.
2. Run `oz login` and let the human complete authentication interactively. Do not proceed until login succeeds. Done when: login succeeds.
3. Provision a short-lived bearer credential. Mint a 30-day API key with `oz api-key create --expires 30d` and export it as `WARP_API_KEY` in the shell environment that will launch the target harness. Done when: WARP_API_KEY is exported with a valid key.
4. Determine the target harness configuration path and schema. Write the MCP server registration with the bearer token to the configuration file:
   - Claude Code: add the server entry to `.claude/mcp.json` (project) or `~/.claude/mcp.json` (global), pointing at `{server_root}/api/v1/mcp/factory` with `Authorization: Bearer $WARP_API_KEY` in the headers.
   - Codex: add the server entry to `~/.codex/mcp.json` with the same URL and bearer header.
   - Cursor: add the server entry to `~/.cursor/mcp.json` with the same URL and bearer header.
   Done when: the MCP registration is written for the target harness with the bearer token.
5. Reload the harness so it picks up the new registration. For Claude Code: restart the session or run the MCP reload command. For Codex: restart the Codex process. For Cursor: restart Cursor or reload the MCP configuration. Done when: the harness picks up the new registration.
6. Verify protocol-level discovery by calling `tools/list` on the registered endpoint. Confirm the ten Factory tools are present: `list_factories`, `create_factory`, `get_factory`, `update_factory`, `delete_factory`, `list_factory_runs`, `create_factory_run`, `get_factory_run`, `cancel_factory_run`, `get_factory_status`. Done when: the ten Factory tools are present in the `tools/list` response.
7. Call `list_factories` and confirm the response is not an authentication error. An empty list is acceptable. Done when: the response is not an auth error (empty list allowed).
8. Confirm the endpoint serves its factory setup document: call `resources/list` and confirm the setup resource URI (`factory://setup`) is present, then call `resources/read` on that URI and confirm content is returned without an auth error. Done when: `resources/list` includes the setup document URI and `resources/read` returns its content without an auth error.
9. If the user explicitly requested a factory, create it now; otherwise skip. Done when: the factory is created or skipped.
10. Tell the user setup is done, hand off, and stop. Done when: the user is told setup is done and the agent stops.

## Failure and recovery

- oz not installed: tell the user `oz` is required and stop. Never invent an install command.
- oz login fails: report the error from `oz login` and stop. Do not write any MCP registration without a valid credential.
- API key minting fails: report the error and stop. Do not proceed to registration.
- Configuration path not found: report which harness configuration file was expected and not found; stop without writing.
- tools/list missing tools or auth error: report which verification failed and stop. Do not claim setup is done.
- list_factories returns an auth error: report it as a credential or registration problem and stop.
- Factory setup document absent from `resources/list`, or `resources/read` returns an auth or read error: report the exact failure and stop; the done predicate is not met.
- Partial results are not success. If any verification step fails, report the exact failure and stop; do not widen scope or retry beyond re-running the failed step once.

## Output

A terminal classification: setup done (all done-predicate checks passed) or blocked (named failure class with the exact failing step). The user is told the result and the agent hands off and stops.
