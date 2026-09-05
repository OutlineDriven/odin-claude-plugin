# MCP and Agents in Go

The Go MCP world has **two real SDKs with incompatible APIs**: the **official `modelcontextprotocol/go-sdk`** (Google + Anthropic, v1, API-frozen until v2; the default for new code) and the community **`mark3labs/mcp-go`** (still v0, fast-moving, batteries-included). Default to the official SDK for protocol infrastructure; reach for mcp-go for app-framework ergonomics. For Go *coding* agents, don't reinvent code intelligence; `gopls` ships an MCP server.

> Verified against Go **1.26** (stable) + **1.27 RC** notes; `modelcontextprotocol/go-sdk` **v1.6.1** (stable; v1.7.0-pre targeting the RC spec); `mark3labs/mcp-go` **v0.55.1**; `gopls` MCP **v0.20.0→v0.22.x**; **MCP spec 2025-11-25** (current) / **2026-07-28** (RC), 2026-06. This is a **fast-moving, young ecosystem**: verify SDK API shapes and exact patch versions against the upstream repo before pinning.

## TL;DR: the deltas models miss (read first)

- The official SDK is v1 and stable, not "the new unstable one." v1.0.0 (late Sep 2025) froze the API: no breaking changes until a v2 that the maintainers intend to delay "as long as possible." Latest stable is **v1.6.1**; **v1.7.0** (prerelease) adds the **2026-07-28** spec.
- The official tool API is a top-level generic with schema inference: `mcp.AddTool(server, &mcp.Tool{...}, handler)`, handler `func(ctx, *mcp.CallToolRequest, In) (*mcp.CallToolResult, Out, error)`. **Don't hand-write JSON Schema**: it's inferred from struct tags and inputs are auto-validated.
- The pre-v1.0 prototype API is all over training data and won't compile against v1.x (`mcp.NewServerTool`, `server.AddTools`, `CallToolParamsFor[T]`, `mcp.NewStdioTransport()`, string-arg `NewServer`); see the WRONG block in [official SDK](#official-sdk).
- `mcp-go` is at v0.55.1 and actively maintained; not dead; but still v0 (no semver stability). The official SDK's own README calls it a "viable alternative."
- Transports: stdio + Streamable HTTP. Plain **HTTP+SSE is deprecated** (since spec 2025-03-26). Models keep emitting two-endpoint SSE servers. (But SSE isn't gone everywhere; `gopls` attached mode and mcp-go still expose it for compatibility.)
- **Input-validation failures should return as a tool *result* (`IsError`), not a JSON-RPC protocol error**; so the model can self-correct. The official SDK formalized this in v1.5.0.
- **`gopls mcp` exists and is underused.** Detached mode sees only saved files; **attached mode** (`gopls -mcp.listen`) sees unsaved editor buffers.

## Table of Contents
1. [MCP protocol primitives](#mcp-primitives)
2. [Which MCP SDK?](#which-sdk)
3. [MCP server with the official SDK](#official-sdk)
4. [Typed tools, structured results & errors](#tool-results)
5. [MCP server with mcp-go](#mcp-go)
6. [Transports & protocol versions](#transports)
7. [Client construction & sessions](#client-sessions)
8. [Concurrency, context & cancellation](#concurrency)
9. [Security: arg validation, origin, sandboxing](#security)
10. [Agent framework comparison](#agent-frameworks)
11. [Multi-agent patterns](#multi-agent)
12. [gopls MCP integration](#gopls-mcp)
13. [Library landscape & status](#libraries)
14. [Version & maturity map](#versions)
15. [What models get wrong](#stale)

---

## MCP protocol primitives {#mcp-primitives}

MCP is **JSON-RPC 2.0** over a transport. A connection begins with an `initialize` handshake that negotiates the **protocol version** and exchanges **capabilities**: only what each side advertises may be used. The three server primitives differ by *who drives them*; a distinction that should shape your permissions, UI placement, logging, and caching, not just your docs:

| Primitive | Driven by | Purpose | RPC methods |
|---|---|---|---|
| **Tools** | the **model** | Actions/computation with side effects | `tools/list`, `tools/call` |
| **Resources** | the **application** | Read-only context loaded into the model | `resources/list`, `resources/read`, `resources/templates/list` |
| **Prompts** | the **user** | Reusable, user-invoked instruction templates | `prompts/list`, `prompts/get` |

The classification trap: models collapse everything into tools because "the model can call it." If it *reads contextual data* → **resource**; *reusable user-invoked scaffolding* → **prompt**: only *actions/computation* → **tool**. Exposing a document tree as a tool fights the protocol. Other features: **roots** (client-advertised fs boundaries), **sampling** (server asks the client's LLM to complete), **logging**, **completion**, **elicitation**: roots/sampling/logging deprecated as of the 2026-07-28 RC (SEP-2577, ≥12-mo window), so don't build new hard deps on them.

---

## Which MCP SDK? {#which-sdk}

| | Official `go-sdk` | Community `mcp-go` |
|---|---|---|
| **Import** | `modelcontextprotocol/go-sdk/mcp` | `mark3labs/mcp-go/{mcp,server,client}` |
| **Backing / maturity** | Google + Anthropic; **v1, frozen until v2** (v1.6.1) | Ed Zynda; **still v0**, very active (v0.55.1) |
| **Tool definition** | generic `AddTool` + struct-tag schema inference | builder `mcp.NewTool` + `WithString/WithNumber/Enum` |
| **Feel** | stdlib-like substrate; explicit sessions, typed contracts | app framework; hooks, filters, middleware, tracing, tasks |
| **Extras** | `auth`/`oauthex` OAuth, `jsonrpc`, `google/jsonschema-go` | per-session tools, prompt filtering, `mcptest`, framework-agnostic `Handle` |
| **Choose when** | spec fidelity, typed contracts, libraries others depend on | shipping a server fast; rich middleware/framework embedding |

The two are **not API-compatible**: code for one won't compile against the other, and migration (imports + handler signatures) is manual, no automated tool. Parts of the ecosystem (e.g. GitHub's MCP server) have migrated to the official SDK. **Both need Go 1.25+** (the official SDK uses `net/http.CrossOriginProtection`); fine under Go 1.26.

---

## MCP server with the official SDK {#official-sdk}

Schemas come from struct tags; the handler takes a **typed input** and returns a **typed output** plus an optional `*CallToolResult`:

```go
package main

import (
	"context"
	"log"
	"os"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type Input struct {
	Path string `json:"path" jsonschema:"absolute path of the file to read"`
}
type Output struct {
	Content string `json:"content" jsonschema:"the file's contents"`
}

// Handler shape: (ctx, *CallToolRequest, In) -> (*CallToolResult, Out, error).
// Return Out for the structured result; the SDK also marshals it into Content.
func ReadFile(ctx context.Context, req *mcp.CallToolRequest, in Input) (*mcp.CallToolResult, Output, error) {
	data, err := os.ReadFile(in.Path) // validate/sandbox in.Path first — see Security
	if err != nil {
		// Tool-level failure → return it as a RESULT, not a Go error (see below).
		return &mcp.CallToolResult{IsError: true,
			Content: []mcp.Content{&mcp.TextContent{Text: "read failed: " + err.Error()}}}, Output{}, nil
	}
	return nil, Output{Content: string(data)}, nil
}

func main() {
	s := mcp.NewServer(&mcp.Implementation{Name: "file-reader", Version: "v1.0.0"}, nil)
	mcp.AddTool(s, &mcp.Tool{Name: "read_file", Description: "Read a file's contents"}, ReadFile)
	if err := s.Run(context.Background(), &mcp.StdioTransport{}); err != nil { // blocks until client disconnects
		log.Fatal(err)
	}
}
```

```go
// STALE pre-v1.0 prototype — WILL NOT COMPILE against v1.x:
func SayHi(ctx context.Context, ss *mcp.ServerSession, p *mcp.CallToolParamsFor[HiParams]) (*mcp.CallToolResultFor[any], error)
server := mcp.NewServer("greeter", "v1.0.0", nil)            // wrong: takes *mcp.Implementation
server.AddTools(mcp.NewServerTool("greet", "say hi", SayHi)) // wrong: use top-level generic mcp.AddTool
server.Run(ctx, mcp.NewStdioTransport())                     // wrong: use &mcp.StdioTransport{}
// Also wrong: importing golang.org/x/tools/internal/mcp (the internal prototype — not externally importable).
```

**Resources & templates** (a static URI vs a URI template; distinct APIs; both require an **absolute** URI/scheme and panic on schemeless input):

```go
read := func(ctx context.Context, req *mcp.ReadResourceRequest) (*mcp.ReadResourceResult, error) {
	return &mcp.ReadResourceResult{Contents: []*mcp.ResourceContents{
		{URI: req.Params.URI, MIMEType: "application/json", Text: `{"env":"prod"}`},
	}}, nil
}
s.AddResource(&mcp.Resource{URI: "config://app", MIMEType: "application/json"}, read)
s.AddResourceTemplate(&mcp.ResourceTemplate{URITemplate: "users://{id}/profile"}, read)
// missing resource: return mcp.ResourceNotFoundError(uri)   // [verify] helper name across patch versions
```

Prompts:

```go
p := &mcp.Prompt{Name: "code_review", Description: "Review a PR",
	Arguments: []*mcp.PromptArgument{{Name: "lang", Required: true}}}
s.AddPrompt(p, func(ctx context.Context, req *mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
	return &mcp.GetPromptResult{Messages: []*mcp.PromptMessage{
		{Role: "user", Content: &mcp.TextContent{Text: "Review this " + req.Params.Arguments["lang"] + " code."}},
	}}, nil
})
```

Packages: `mcp` (primary), `jsonrpc` (custom transports), `auth`+`oauthex` (OAuth); schema by the separate `google/jsonschema-go` module. `AddXXX` on a connected server fires `.../list_changed`. Middleware: `AddReceivingMiddleware`/`AddSendingMiddleware` (right-to-left). An `AddTool` with output type `any` skips output-schema generation.

---

## Typed tools, structured results & errors {#tool-results}

`AddTool` gives you three things hand-rolled handlers throw away: **input JSON Schema** (from `json:`/`jsonschema:` tags), **auto input validation**, and **typed output** (emitted as `structuredContent` + an `outputSchema`). Drop to raw `Server.AddTool(&mcp.Tool{...}, rawHandler)` only for manual control.

```go
// WRONG — stringly-typed decode + schema drift; loses validation and structured output:
s.AddTool(&mcp.Tool{Name: "greet"}, func(ctx context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	name, _ := req.Params.Arguments.(map[string]any)["name"].(string)
	return &mcp.CallToolResult{}, nil
})
```

The error-vs-result distinction is the #1 trap. Two failure channels exist, and they mean different things:

- **Return a Go `error`** → a JSON-RPC **protocol error** (transport/server malfunction; the model can't act on it).
- **Return `*CallToolResult{IsError: true}`** → a **tool execution failure** surfaced to the model so it can **self-correct** (retry with fixed args, choose another tool).

```go
// RIGHT — business/validation failure visible to the model:
return &mcp.CallToolResult{IsError: true,
	Content: []mcp.Content{&mcp.TextContent{Text: "city not found; try a different name"}}}, Output{}, nil

// WRONG — a bad argument as a Go error becomes an opaque protocol error the model can't recover from:
return nil, Output{}, fmt.Errorf("city %q not found", in.City)
```

Since official SDK **v1.5.0**, *input-validation* failures are returned as `CallToolResult` (not JSON-RPC errors); keep that; don't convert bad input into `jsonrpc.Error`. The client reads `res.IsError` and `res.Content` (`c.(*mcp.TextContent).Text`; image/embedded-resource variants exist).

---

## MCP server with mcp-go {#mcp-go}

Option-builder pattern; schemas come from `WithString`/`WithNumber`/`Enum`/`Required`, **not** struct tags:

```go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	s := server.NewMCPServer("file-reader", "1.0.0",
		server.WithToolCapabilities(true),
		server.WithRecovery(),                 // recover panics in tool handlers
		server.WithInputSchemaValidation(),    // ENFORCE schemas server-side (separate knob)
	)
	tool := mcp.NewTool("read_file",
		mcp.WithDescription("Read a file's contents. Use only for local files; not for URLs."),
		mcp.WithString("path", mcp.Required(), mcp.Description("Absolute file path")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path") // typed accessor; returns error on missing/wrong type
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil // tool-failure result, NOT a Go error
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("read failed: %v", err)), nil
		}
		return mcp.NewToolResultText(string(data)), nil
	})
	if err := server.ServeStdio(s); err != nil {
		fmt.Printf("server error: %v\n", err)
	}
}
```

Strict schemas are two separate switches (a reproducibility trap): `WithStrictInputSchemaDefault()` makes schemas strict (helps schema-aware clients) but does **not** reject unknown args; you also need `WithInputSchemaValidation()` for server-side enforcement (+ `WithOutputSchemaValidation()`). Permissive defaults let unknown args pass silently; usually a bug. Typed handlers: `mcp.NewTypedToolHandler[T]` / `NewStructuredToolHandler[TArgs,TResult]`.

Resources: `mcp.NewResource(...)` + `s.AddResource(...)` returning `[]mcp.ResourceContents`; templates: `mcp.NewResourceTemplate("users://{id}/profile", ...)` + `s.AddResourceTemplate(...)` (server regex-matches; parse `req.Params.URI`). Prompts: `mcp.NewPrompt` + `s.AddPrompt`. mcp-go extras the official SDK models differently: **per-session tools** (`AddSessionTool`/`SessionWithTools`), **tool/prompt filtering** (`WithToolFilter`/`WithPromptFilter`; gate *both* `list` and `get`/`call`), **hooks** (`WithHooks`), **middleware**, and **task-augmented tools** (`AddTaskTool`, async execute-then-poll via `tasks/result`).

---

## Transports & protocol versions {#transports}

| Transport | Spec status | Official `go-sdk` | `mcp-go` | When |
|---|---|---|---|---|
| **stdio** | Standard (local) | `&mcp.StdioTransport{}` (server) / `&mcp.CommandTransport{}` (client subprocess) | `server.ServeStdio(s)` | CLI tools, editor/desktop plugins, subprocesses; spec says prefer stdio when possible |
| **Streamable HTTP** | **Current** (since 2025-03-26) | `mcp.NewStreamableHTTPHandler(getServer, opts)` | `server.NewStreamableHTTPServer(s)` | Remote / multi-client / web-deployed servers |
| **HTTP+SSE** (2-endpoint) | **DEPRECATED** since 2025-03-26 | SSE client/handler retained for compat | legacy SSE server retained | Only legacy peers, or `gopls` attached mode |
| **In-process** | n/a | (use `Client.Connect` over an in-memory transport) | `mcptest` package | Tests; no subprocess, no network |

**Streamable HTTP is single-endpoint.** One URL handles `POST` (client→server JSON-RPC; response is `application/json` or upgrades to `text/event-stream`), `GET` (server→client SSE stream, else 405), `DELETE` (terminate session). Sessions use a server-issued opaque **`Mcp-Session-Id`** header (replayed each request); `Last-Event-ID` resumes a dropped stream. Replaces the old SSE design's two endpoints (hanging-GET channel + separate POST URL).

```go
// Official SDK — Streamable HTTP; getServer may return a per-request *mcp.Server:
handler := mcp.NewStreamableHTTPHandler(func(r *http.Request) *mcp.Server { return s }, nil)
http.ListenAndServe("127.0.0.1:8080", handler) // bind to localhost for local servers (see Security)
```

Protocol-version strings (negotiated during `initialize`): `2024-11-05` (original, HTTP+SSE), `2025-03-26` (Streamable HTTP introduced, SSE deprecated), `2025-06-18`, **`2025-11-25`** (current finalized; tasks, icons, OIDC discovery), **`2026-07-28`** (RC; moves toward a *stateless* core, dropping protocol-level `Mcp-Session-Id`). The **`MCP-Protocol-Version` HTTP header is mandatory from 2025-06-18 on**; advertise `2025-11-25`. Don't hard-depend on RC (stateless) behavior yet.

---

## Client construction & sessions {#client-sessions}

A `Client`/`Server` handles many concurrent connections; each `Connect` yields a session you use for RPCs and per-session state.

```go
client := mcp.NewClient(&mcp.Implementation{Name: "mcp-client", Version: "v1.0.0"}, nil)
transport := &mcp.CommandTransport{Command: exec.Command("./my-server")} // spawn a stdio server
session, err := client.Connect(ctx, transport, nil)                      // performs initialize handshake
if err != nil { log.Fatal(err) }
defer session.Close()

res, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "read_file",
	Arguments: map[string]any{"path": "/etc/hostname"}})
if err != nil { log.Fatal(err) }     // JSON-RPC/transport error
if res.IsError { /* tool-level failure: inspect res.Content */ }
for _, c := range res.Content {
	if t, ok := c.(*mcp.TextContent); ok { log.Print(t.Text) }
}
```

`Run` vs `Connect` (official SDK): `server.Run` is the **blocking** loop over one transport; `server.Connect` returns a `ServerSession` for concurrent/custom serving (one server fronting many HTTP connections). mcp-go uses **one transport per server instance**: run two instances to serve stdio + HTTP. Both SDKs model connections as explicit sessions (`ClientSession`/`ServerSession`); where per-connection state belongs.

---

## Concurrency, context & cancellation {#concurrency}

Tool handlers run **concurrently**: the server may dispatch multiple `tools/call`s on one connection. Treat handlers like HTTP handlers: no shared mutable state without synchronization; protect session/server state with a mutex or confine it to a goroutine.

```go
func (srv *App) handle(ctx context.Context, req *mcp.CallToolRequest, in Q) (*mcp.CallToolResult, R, error) {
	// ctx is cancelled if the client cancels the call OR the connection drops — honor it.
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second) // bound expensive work
	defer cancel()
	row, err := srv.db.QueryRowContext(ctx, q, in.ID) // pass ctx all the way down
	if errors.Is(err, context.Canceled) { return nil, R{}, ctx.Err() }
	...
}
```

Traps: ignoring `ctx` in a long call (cancelled client still pays; goroutine leaks); spawning goroutines in a handler without recovering them; an unrecovered panic in *your* goroutine crashes the server (`WithRecovery()` / the official SDK's handler recovery covers only the handler goroutine); blocking a stdio server's single message loop with slow synchronous work. For long jobs prefer mcp-go **task tools** (return a task id, run async, client polls) over holding the call open. Go **1.26**'s experimental **goroutine-leak profile** (`runtime/pprof`; GA 1.27) helps with streaming transports, SSE listeners, worker pools.

---

## Security: arg validation, origin, sandboxing {#security}

Tool arguments are **untrusted model/attacker input.** Schema validation checks *shape*, not *safety*; you still validate values.

```go
// WRONG — path traversal / SSRF straight from model input:
data, _ := os.ReadFile(in.Path) // in.Path == "../../etc/shadow"
resp, _ := http.Get(in.URL)     // in.URL == "http://169.254.169.254/..."

// RIGHT — confine file access to a root that cannot be traversed out of [Go 1.24+]:
root, err := os.OpenRoot("/srv/data") // *os.Root; rejects ".." escapes
if err != nil { /* ... */ }
f, err := root.Open(in.Path)          // safe even for hostile in.Path
```

**Validate args** (deny path traversal, SSRF to link-local/metadata IPs, shell metacharacters; never `exec` a string built from model input), set **`ToolAnnotations`** (ReadOnly/Idempotent/Destructive/OpenWorld) so clients can gate dangerous tools, return human-readable failures (never raw stack traces), and **set timeouts** on every external call.

**Streamable HTTP origin protection is not a stable default.** The spec requires **Origin validation** and recommends binding local servers to **localhost**, not `0.0.0.0`. Go **1.25** added `net/http.CrossOriginProtection` and the official SDK used it; but **v1.6.0 changed the default**: a `nil` `CrossOriginProtection` no longer means "protected." On Go 1.26, **configure origin protection explicitly** for browser-reachable endpoints. (v1.6.1's `MCPGODEBUG=disablecontenttypecheck=1` is a *compat* escape hatch, not a baseline.)

---

## Agent framework comparison {#agent-frameworks}

> **Volatility warning:** agent frameworks move fast and several are pre-1.0. Verify the current API before adopting. If you only need an MCP *server* (tools/resources/prompts), skip frameworks entirely and use a raw SDK.

| | `tmc/langchaingo` | Google ADK Go | `cloudwego/eino` | `nlpodyssey/openai-agents-go` |
|---|---|---|---|---|
| **Approach** | LangChain port | Google-backed workflow agents | ByteDance component graph | OpenAI Agents SDK port |
| **LLMs** | OpenAI, Gemini, Ollama, + | Gemini-optimized, pluggable | OpenAI, Claude, Gemini, Ark | OpenAI-focused, pluggable |
| **Tool calling** | ReAct, OpenAI functions | function / MCP / agent-as-tool | ReAct via compose graph | function tools, MCP |
| **Multi-agent** | minimal | sequential, parallel, loop | graph decomposition | agent handoffs |
| **MCP built-in** | no | yes (`tool/mcptoolset`) | no | yes (stdio MCP) |

Heuristics: **multi-agent workflows** → ADK Go; **RAG / chains** → langchaingo; **handoff routing** → openai-agents-go; **streaming-first** → eino; **just an MCP server** → no framework. The official `go-sdk` underpins Google's ADK Go, so MCP-native interop is best there.

---

## Multi-agent patterns {#multi-agent}

For simple cases, **plain goroutines + channels** beat a framework; see [concurrency.md](concurrency.md). When you want declared topologies, Google ADK Go has the richest workflow set (sequential / parallel / loop / supervisor):

```go
// import google.golang.org/adk/agent{,/llmagent,/workflowagents/sequentialagent,/parallelagent}

// Supervisor → specialists (router picks a sub-agent):
reviewer, _ := llmagent.New(llmagent.Config{Name: "Reviewer", Model: m, Instruction: "Find bugs.", OutputKey: "review"})
auditor, _ := llmagent.New(llmagent.Config{Name: "Auditor", Model: m, Instruction: "Find security issues.", OutputKey: "audit"})
supervisor, _ := llmagent.New(llmagent.Config{Name: "Supervisor", Model: m,
	Instruction: "Route to Reviewer or Auditor based on the request.",
	SubAgents:   []agent.Agent{reviewer, auditor}})

// Sequential pipeline (each transforms the previous output):
pipeline, _ := sequentialagent.New(sequentialagent.Config{
	AgentConfig: agent.Config{Name: "Pipeline", SubAgents: []agent.Agent{drafter, editor, polisher}}})

// Parallel fan-out → sequential synthesis:
research, _ := parallelagent.New(parallelagent.Config{
	AgentConfig: agent.Config{Name: "Research", SubAgents: []agent.Agent{r1, r2}}})
full, _ := sequentialagent.New(sequentialagent.Config{
	AgentConfig: agent.Config{Name: "Full", SubAgents: []agent.Agent{research, synthesizer}}})
```

Cross-cutting concerns beat topology: bound every step with a `context` deadline, recover panics per worker, watch token/cost blowups in loop agents. (ADK Go is pre-1.0; `[verify]` field names against the current release.) For handoff routing without a workflow tree, openai-agents-go exposes agent handoffs.

---

## gopls MCP integration {#gopls-mcp}

For a Go *coding* agent, **don't reimplement Go intelligence as generic file tools**; `gopls` exposes semantic analysis as MCP tools. Introduced in gopls **v0.20.0** (still **experimental** through v0.22.x; the tool set may change). Two modes with a critical difference:

- Attached: `gopls -mcp.listen=localhost:8092`; rides the live LSP session, shares memory, **sees unsaved editor buffers**. Documented as **HTTP+SSE** at `/sessions/<id>` (intentionally SSE, despite "new remote servers should use Streamable HTTP"; it's editor-integration, not a remote-deploy template).
- Detached: `gopls mcp`; own headless LSP session over stdio; **sees only saved files on disk**. This is the form for CLI agent configs (Gemini CLI, Claude Code).

The trap: claiming `gopls mcp` (detached) can act on unsaved buffers; it can't; use attached mode for that.

Key tools (v0.20.x-v0.21.x): `go_diagnostics`, `go_references`, `go_symbol_references`, `go_rename_symbol` (v0.21.0), `go_search`, `go_package_api`, `go_file_metadata`, `go_workspace`, `go_context`, `go_vulncheck`; largely read-only. Instructions aren't auto-published: `gopls mcp -instructions > context.md`. Setup: `claude mcp add` or an `mcpServers` entry (Gemini CLI). **Security:** gopls only does what it already does (read files, run `go` → may hit `proxy.golang.org`, write its cache); it doesn't edit source. Third-party `hloiseau/mcp-gopls` (on mcp-go) is a *separate, richer* wrapper with edit/test/coverage tools; distinct from the built-in.

---

## Library landscape & status {#libraries}

| Library / artifact | Status [2026-06] | Use when |
|---|---|---|
| `modelcontextprotocol/go-sdk` (v1.6.1) | **Default / official**, v1 frozen until v2 | new MCP code; spec fidelity; needs Go 1.25+ |
| `mark3labs/mcp-go` (v0.55.1) | **Maintained, pre-v1.0** (fast-moving) | fast servers; hooks/filters/tasks; framework embedding |
| `google/jsonschema-go` | Active | schema engine the official SDK depends on |
| `gopls` built-in MCP (v0.20.0→v0.22.x) | **Experimental, useful** | Go coding agents; don't reinvent Go intelligence |
| `golang.org/x/tools/internal/mcp` | **Superseded** | never; prototype, not externally importable |
| `metoro-io/mcp-golang`, `ThinkInAIXYZ/go-mcp` | Legacy community | predate the official SDK |
| MCP spec `2025-11-25` | **Current finalized** | advertise this; tasks, icons, OIDC discovery |
| MCP spec `2026-07-28` (RC) | **Not final** | stateless core; don't hard-depend yet |
| HTTP+SSE transport | **Deprecated** (since 2025-03-26) | only legacy peers / gopls attached mode |

---

## Version & maturity map {#versions}

| Item | Status / what it means here |
|---|---|
| **go-sdk v1.0.0-v1.1.0** | spec 2025-06-18; "no breaking changes until v2" commitment begins |
| **go-sdk v1.2.0-v1.3.1** | partial 2025-11-25 (no client OAuth / sampling-with-tools) |
| **go-sdk v1.4.0-v1.6.1** | full 2025-11-25; client OAuth experimental (v1.4.0) → stabilized (v1.5.0, no more `mcp_go_client_oauth` build tag); **v1.5.0** returns input-validation as `CallToolResult`; **v1.6.0** changes cross-origin default + adds `ClientCredentialsHandler`; **v1.6.1** adds Content-Type escape hatch |
| **go-sdk v1.7.0+** | spec 2026-07-28 (RC); roots/sampling/logging deprecated (SEP-2577, ≥12-mo window). Prerelease as of 2026-06 |
| **mcp-go v0.50→v0.55.1** | production-hardening burst: input/output schema validation, paginated iterators, `CommandTransport`, RFC 9728 protected-resource metadata, `SchemaCache`, framework-agnostic `Handle`, strict-schema defaults, task tools, `_meta` trace propagation |
| **gopls v0.20.0 / v0.21.0** | MCP server introduced / `go_rename_symbol` + `gopls.vulncheck` added; experimental through v0.22.x |
| **Go 1.25** | `net/http.CrossOriginProtection` (SDKs require ≥1.25) |
| **Go 1.26** | experimental goroutine-leak profile (`runtime/pprof`); useful for streaming/SSE/worker leaks |
| **Go 1.27 (RC)** | goroutine-leak profile GA; `httptest.NewTestServer` for `synctest`; `encoding/json/v2` GA (stricter UTF-8/dup-key defaults; watch exact JSON error text). Draft until GA (~Aug 2026) |

---

## What models get wrong {#stale}

1. Pre-v1.0 official-SDK API; `mcp.NewServerTool`, `server.AddTools`, `CallToolParamsFor[T]`, `CallToolResultFor[any]`, `mcp.NewStdioTransport()`, `mcp.NewServer("name","v1",nil)`. Current: top-level generic `mcp.AddTool` + `&mcp.StdioTransport{}` + `mcp.NewServer(&mcp.Implementation{...}, nil)`.
2. Importing the internal prototype `golang.org/x/tools/internal/mcp` (not importable) instead of `github.com/modelcontextprotocol/go-sdk/mcp`.
3. Mixing the two SDKs' APIs; they don't interoperate and there's no auto-migrator.
4. Hand-writing JSON Schema; the official SDK infers it from struct tags; mcp-go uses option-builders. Manual schema maps are for edge cases only.
5. Returning bad-input as a Go `error` (→ protocol error) instead of `CallToolResult{IsError:true}` (→ model can self-correct). v1.5.0 formalized result-style input-validation errors.
6. Deprecated HTTP+SSE two-endpoint servers instead of single-endpoint Streamable HTTP; *and* the inverse error, "SSE is gone everywhere" (gopls attached mode + mcp-go still use it).
7. Stale/missing protocol version; advertising `2024-11-05` as current, or omitting the mandatory `MCP-Protocol-Version` header. Current is `2025-11-25`.
8. "The official SDK is immature/pre-1.0"; it's v1, frozen until v2. Conversely, **"mcp-go is dead"**: it's at v0.55.1, very active (but still v0).
9. Assuming origin protection is on by default in the official SDK; not since v1.6.0 (`nil` ≠ protected). Configure it explicitly.
10. Trusting tool args; schema validation isn't value validation; guard path traversal/SSRF/shell injection; prefer `os.OpenRoot` for file tools.
11. `gopls mcp` detached can see unsaved buffers; it can't; that's attached mode. And reinventing Go intelligence instead of using gopls at all.
12. Collapsing resources/prompts into tools; they differ by who drives them; design permissions/UI accordingly.
13. Ignoring `ctx` in long tool calls / spawning unrecovered goroutines (crashes the server) / blocking the stdio loop instead of using task tools.
14. `WithStrictInputSchemaDefault()` alone enforces nothing; pair it with `WithInputSchemaValidation()` (mcp-go).
15. "Client OAuth needs `-tags mcp_go_client_oauth`"; stale since go-sdk v1.5.0.

---

## See Also {#see-also}
- [concurrency.md](concurrency.md); goroutines/channels for simple multi-agent, leak detection, recovery
- [http-and-apis.md](http-and-apis.md#http-client); HTTP client timeouts behind Streamable HTTP/SSE
- [security.md](security.md); input validation, SSRF, sandboxing primitives (`os.OpenRoot`)
- [advanced-patterns.md](advanced-patterns.md#ai-llm); raw LLM SDK clients (OpenAI/Anthropic/Ollama)
- [observability.md](observability.md); tracing tool calls, slog with trace correlation

## Sources {#sources}
- modelcontextprotocol/go-sdk: repo README & `docs/` (Version Compatibility table, `AddTool`/`NewServer`/`Connect` shapes), GitHub releases (v1.0.0-v1.7.0-pre), pkg.go.dev/github.com/modelcontextprotocol/go-sdk/mcp
- mark3labs/mcp-go: README (spec 2025-11-25, transports, task tools, sessions, filters), GitHub releases (→ v0.55.1)
- MCP spec: modelcontextprotocol.io/specification (2025-11-25; 2026-07-28 RC; transports; SEP-2577)
- gopls: go.dev/blog/gopls-mcp; gopls v0.20.0/v0.21.0 release notes
- go.dev/doc/go1.25-go1.27 release notes (`CrossOriginProtection`, goroutine-leak profile, `encoding/json/v2`)
