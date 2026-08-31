---
name: mcp-builder
description: 'Use when asked to create an MCP server to integrate an API or service in Python or TypeScript. Produces a server with typed tools, tests, and a read-only evaluation suite. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# MCP builder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Creating an MCP server to integrate an API or service in Python or TypeScript |
| Authority | Reversible local: write only named project files; delete the project directory to roll back |
| Side effect | A new MCP server project with typed tools, tests, and a read-only evaluation suite |
| Done | Server builds, registers tools with correct Zod/Pydantic schemas and annotations, passes MCP inspector, and has 16 stable read-only evaluations with verified answers |

## Inputs

- **API or service specification** (required): endpoint list, auth method, request/response shapes, or OpenAPI/GraphQL schema describing the service to integrate.
- **Language** (required): `python` or `typescript`.
- **Project directory** (required): target path for the new MCP server project.
- **Tool design intent** (optional): which operations to expose as MCP tools and any annotation hints (readOnlyHint, destructiveHint, idempotentHint, openWorldHint).

## Procedure

1. Validate inputs: confirm the API specification is parseable, the language is `python` or `typescript`, and the project directory does not already exist or is empty.
2. Scaffold the project:
   - TypeScript: initialize with `pnpm init`, then run `pnpm add @modelcontextprotocol/sdk zod`. Create `src/index.ts` as the server entry point.
   - Python: initialize with `uv init`, install `mcp` and `pydantic`. Create `server.py` as the server entry point.
3. For each API operation to expose as a tool:
   a. Define the tool with `server.tool()` using a descriptive kebab-case name, a human-readable description, and input schema.
   b. TypeScript: define input schema as a Zod object. Python: define input schema as a Pydantic model.
   c. Set MCP annotations: `readOnlyHint` for GET-like operations, `destructiveHint` for delete/mutate operations, `idempotentHint` for safe retries, `openWorldHint` when the tool calls external services.
   d. Implement the handler: call the target API, validate the response against the expected shape, and return structured content (text or resource).
   e. Ensure every tool returns a JSON-serializable output with a `type` field.
4. Build and verify the server compiles:
   - TypeScript: run `pnpm exec tsc --noEmit`.
   - Python: run `python -c "import server"` or `pyright server.py`.
5. Create the test suite with exactly 16 read-only evaluations:
   - Each evaluation invokes one tool via the MCP inspector or a direct stdio client call with fixed input.
   - Each evaluation has a pre-recorded verified expected output stored alongside the test.
   - Cover: at least one happy-path call per tool, at least one error/edge case per tool, at least one schema-validation boundary test, and at least one annotation-correctness check.
   - TypeScript: use a test runner (vitest or jest). Python: use pytest.
6. Run all 16 evaluations and confirm every one passes with the expected output.
7. Run the MCP inspector against the running server to confirm tool registration, schema correctness, and annotation presence.

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|
| Build failure | Compiler/type-checker exit code non-zero | Fix the syntax or import error in the generated source; re-run the build step |
| Schema mismatch | MCP inspector rejects a tool registration or Zod/Pydantic validation fails at runtime | Correct the input schema definition to match the API spec; re-register the tool |
| Evaluation failure | Any of the 16 evaluations returns output differing from the verified expected output | Fix the tool handler logic; update the expected output only if the API behavior changed (not to force a pass) |
| MCP inspector failure | Inspector reports protocol violation or missing annotations | Fix the server entry point or annotation configuration; re-run inspector |

Partial results rule: if the server builds but evaluations fail, keep the project directory and report which evaluations failed. Do not delete partial work.
Rollback: delete the project directory to fully reverse all side effects.
Blocked result: if the API specification is unparseable or the language is unsupported, stop and report the specific validation failure. Do not proceed with scaffolding.

## Output
A complete MCP server project at the specified directory containing:
- Server entry point (`src/index.ts` or `server.py`) with all tools registered.
- Tool definitions with typed input schemas (Zod or Pydantic) and MCP annotations.
- Test suite with 16 read-only evaluations, each with a verified expected output.
- Build passes, all 16 evaluations pass, MCP inspector confirms registration and schemas.

## Provenance

- Origin: https://github.com/warpdotdev/oz-skills
- Pinned revision: 6c08c49fc6c51b8f768bf8c53c041bc06a160765
- License: Apache-2.0 (attribution notices preserved; not relicensed under MIT)
- Adaptation: adapted as a tool-creation flow for LLM composability with typed schemas, annotations, JSON Schema outputs, and stable read-only evaluations. Content is clean-room procedural adaptation, not copied expression.
