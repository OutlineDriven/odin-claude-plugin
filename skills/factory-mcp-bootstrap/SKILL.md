---
name: factory-mcp-bootstrap
description: 'Use when someone outside Warp wants to wire a third-party coding agent (Claude Code, Codex, or Cursor) to a Warp Factory MCP endpoint. Confirms the oz CLI, runs login, mints a 30-day API key, writes a bearer-token MCP registration, and verifies the endpoint. Don''t use for remote publish, deploy, or changes beyond the local MCP registration and credential.'
disable-model-invocation: true
---

# Factory MCP bootstrap

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Someone outside Warp wants a third-party coding agent to reach a Warp Factory: "set up Factory MCP in Claude Code / Codex / Cursor", "add the factory MCP server", "connect my agent to Warp Factory" |
| Authority | Human-only. Mints a 30-day API credential and writes a bearer-token MCP registration; both are credential and data-at-rest mutations requiring explicit human invocation. |
| Side effect | Installs or confirms the oz CLI, runs oz login, mints a 30-day API key exported as WARP_API_KEY, writes a harness-specific MCP registration carrying an Authorization: Bearer header, performs read-only verification calls, and optionally (only on request) creates a factory. |
| Done | The MCP endpoint `{server_root}/api/v1/mcp/factory` is registered with a valid bearer token; `tools/list` shows the ten Factory tools; `list_factories` returns any non-auth-error response (empty allowed); the endpoint serves its factory setup document through both `resources/list` and `resources/read` without an auth error; the user is told setup is done and the agent hands off and stops. |

## Inputs

- **Target harness**: which coding agent to wire — Claude Code, Codex, or Cursor. Must be supplied.
- **Server root**: the Warp Factory API root URL. Must be supplied if not inferable from oz context.
- **Factory creation**: optional. Create a factory only when the user explicitly requests it; otherwise skip.

## Procedure

1. Confirm the `oz` CLI is installed by running `oz --version`. If it is not on PATH, tell the user that `oz` is required and stop. Do not invent or guess an install command.
2. Run `oz login` and let the human complete authentication interactively. Do not proceed until login succeeds.
3. Mint a 30-day API key with `oz` and export it as `WARP_API_KEY` in the shell environment that will launch the target harness.
4. Determine the target harness and write its MCP registration pointing at `{server_root}/api/v1/mcp/factory` with an `Authorization: Bearer $WARP_API_KEY` header:
   - **Claude Code**: add the server via the harness MCP config command or by editing its MCP settings file.
   - **Codex**: add the server entry to the Codex MCP configuration.
   - **Cursor**: add the server entry to the Cursor MCP configuration.
5. Restart or reload the harness so it picks up the new registration.
6. Call `tools/list` on the registered endpoint and confirm the ten Factory tools are present.
7. Call `list_factories` and confirm the response is not an authentication error. An empty list is acceptable.
8. Confirm the endpoint serves its factory setup document: `resources/list` includes the document URI and `resources/read` returns its content without an auth error.
9. If the user explicitly requested a factory, create it now; otherwise skip.
10. Tell the user setup is done, hand off, and stop.

## Failure and recovery
- **oz not installed**: tell the user `oz` is required and stop. Never invent an install command.
- **oz login fails**: report the error from `oz login` and stop. Do not write any MCP registration without a valid credential.
- **API key minting fails**: report the error and stop. Do not proceed to registration.
- **tools/list missing tools or auth error**: report which verification failed and stop. Do not claim setup is done.
- **list_factories returns an auth error**: report it as a credential or registration problem and stop.
- **Factory setup document absent from `resources/list`, or `resources/read` returns an auth/read error**: report the exact failure and stop; the done predicate is not met.
- Partial results are not success. If any verification step fails, report the exact failure and stop; do not widen scope or retry beyond re-running the failed step once.

## Output
A terminal classification: setup done (all done-predicate checks passed) or blocked (named failure class with the exact failing step). The user is told the result and the agent hands off and stops.

## Provenance

Origin: https://github.com/warpdotdev/warp-factories-skills, revision d91db3403d27c85adf2a57bd642047e29e98a51a. No explicit license exists at that revision; all rights reserved. Clean-room rederivation only — no source expression (prose, YAML frontmatter, structure, or exact bytes) was copied. The observable bootstrap procedure (oz CLI confirmation, login, API-key minting, bearer-token MCP registration, tool-list and list_factories verification, skill-resource readability check) was rederived in ODIN style. The source's refusal to invent an install command is preserved as a contract rule.
