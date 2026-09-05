# HTTP Servers, APIs, and Real-Time Communication

Go 1.22 made third-party routers optional for most APIs: `net/http.ServeMux` now does method + `{wildcard}` + `{$}` routing with precedence and `PathValue`. The whole game is **set every server timeout** (zero = infinite = Slowloris), **propagate `ctx`**, **reach for `ResponseController` not type assertions**, and **reuse one `*http.Client`/`Transport`**. Frameworks earn their keep only past the stdlib's feature line.

> Source horizon: verified against Go **1.26.x** (stable) + **1.27** draft release notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 row was checked against the final notes. Version tags `[1.N]` mark the release a claim applies to. Triangulated from two deep-research reports + primary go.dev/pkg.go.dev.

## TL;DR: the modern deltas (read first)

- `ServeMux` does method + `{id}` + `{path...}` + `{$}` routing [1.22]; most REST APIs no longer need a router. `GET` also registers `HEAD`; an unmatched method yields **405 + `Allow`** automatically; overlapping non-nested patterns **panic at registration**, order-independently.
- Server timeout zero value = NO timeout [always]. `ReadHeaderTimeout` is the primary Slowloris defense; `ReadTimeout` covers the *whole* request including body. `http.ListenAndServe(addr, h)` and `&http.Server{}` with bare defaults are production bugs.
- `http.ResponseController` [1.20] replaces `w.(http.Flusher)`; the type assertion silently fails once any middleware wraps `w`. It has exactly five methods (`Flush`/`Hijack`/`SetReadDeadline`/`SetWriteDeadline`/`EnableFullDuplex` [1.21]); there is **no public `FlushError` method**.
- `http.MaxBytesReader` ≠ `io.LimitReader`; only the former is request-body-aware (typed `*MaxBytesError` [1.19], closes the conn past the limit, signals the `ResponseWriter`). `Error()` text is frozen at `"http: request body too large"` (Hyrum's law).
- stdlib `Server.Protocols`/`HTTP2Config` [1.24] supersede `x/net/http2/h2c` for h2c ("prior knowledge", RFC 9113 §3.3, *not* `Upgrade: h2c`).
- `encoding/json/v2` is still `GOEXPERIMENT=jsonv2`-gated and OFF by default through 1.26 (no mention in the 1.26 notes); it becomes the **baseline in 1.27**. `omitzero` [1.24] (uses `IsZero() bool`) is GA *now* and fixes the `time.Time`/`omitempty` trap.
- `http.CrossOriginProtection` [1.25] is token-less CSRF via Fetch metadata, but `AddInsecureBypassPattern` had an over-broad bypass (**CVE-2025-47910 / GO-2025-3955**, fixed **1.25.1**).

## Table of Contents
1. [HTTP Server with Go 1.22+ Enhanced Routing](#http-server)
2. [ServeMux Matching Rules](#servemux-rules)
3. [Server timeouts & hardening](#server-hardening)
4. [Graceful shutdown](#graceful-shutdown)
5. [Middleware Patterns](#middleware)
6. [ResponseController & streaming control](#response-controller)
7. [JSON API Patterns + json/v2](#json-api)
8. [Request Validation](#validation)
9. [HTTP Client Best Practices](#http-client)
10. [Cross-Origin Protection](#cross-origin)
11. [WebSocket Implementation](#websockets)
12. [Server-Sent Events (SSE)](#sse)
13. [gRPC with ConnectRPC](#grpc)
14. [API Versioning and Documentation](#api-versioning)
15. [Library landscape & status](#libraries)
16. [Version map 1.20→1.27](#versions)
17. [What models get wrong](#anti-patterns)

---

## HTTP Server with Go 1.22+ Enhanced Routing {#http-server}

Pattern grammar [1.22]: `[METHOD ][HOST]/[PATH]` (brackets optional). Method routing, path params, subtree/catch-all matching, and automatic 405-with-`Allow` are now stdlib; previously the job of gorilla/mux, httprouter, or chi.

```go
// CORRECT [1.22+]
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")        // untrusted: validate/parse
    // ...
})
mux.HandleFunc("POST /api/v1/users", createUser)
mux.HandleFunc("GET /files/{path...}", serveStatic) // {path...} must be last
mux.HandleFunc("GET /api/v1/{$}", apiRoot)          // exact "/api/v1/" only

// WRONG — pre-1.22 idiom models still emit (throws away method dispatch,
// conflict checking, wildcard capture, and specificity):
mux.HandleFunc("/api/v1/users/", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet { http.Error(w, "", 405); return }
    id := strings.TrimPrefix(r.URL.Path, "/api/v1/users/")
})
```

`r.PathValue("id")` returns `""` if absent; `r.SetPathValue(name, val)` lets third-party routers populate the same stdlib API (so router-agnostic handlers read params one way). **`(*ServeMux).Handler(r)` does NOT populate `PathValue`**. It doesn't mutate `r`; values appear only when the matched handler actually runs.

Stdlib still does NOT provide: per-route middleware, regex/type param constraints, route groups. Routing speed is ~on par with historical `ServeMux` static routes and ~2× slower than the fastest trie routers; rarely the bottleneck.

---

## ServeMux Matching Rules [Go 1.22+] {#servemux-rules}

**Agent needs this to resolve ambiguous routing and avoid registration panics.** Patterns and request paths are matched **after segment-by-segment unescaping**; relevant for `%2F`/`%25`. No routing-grammar changes in 1.23-1.27.

### Precedence (most → least specific), order-independent

| Rule | Example |
|------|---------|
| Literal segment beats wildcard | `/posts/latest` wins over `/posts/{id}` |
| Method-specific beats method-agnostic | `GET /foo` wins over `/foo` |
| Host-specific beats host-agnostic | `example.com/foo` wins over `/foo` |
| Longer literal prefix wins (subtree) | `/images/thumbnails/` wins over `/images/` |
| `{$}` pins trailing-slash to exact path | `GET /api/{$}` matches only `GET /api/`, not `/api/foo` |

### Wildcard types

```go
mux.HandleFunc("GET /users/{id}", getUser)       // single segment: /users/42
mux.HandleFunc("GET /files/{path...}", getFile)   // remainder: /files/a/b/c  (must be last)
mux.HandleFunc("GET /api/{$}", apiRoot)            // exact trailing slash only
```

A trailing-slash subtree (`/tree/`) and a `{x...}` wildcard both match `/tree/` with an **empty remainder** ("an empty remainder counts as a remainder"). You **cannot** read the remainder of a plain trailing-slash subtree via `PathValue`; use `r.URL.Path`.

### Overlap = panic at registration

If two patterns overlap and **neither is a strict subset** of the other, `Handle`/`HandleFunc` **panics** at registration with a message naming both patterns and an example conflicting path:

```go
mux.HandleFunc("/posts/{id}", handleA)
mux.HandleFunc("/{resource}/latest", handleB)
// PANIC: /posts/latest matches both, neither is more specific
```

### Worked resolution

```go
mux.HandleFunc("/api/",                  apiCatchAll)    // (A) subtree
mux.HandleFunc("/api/users/",            usersSubtree)   // (B) narrower subtree
mux.HandleFunc("GET /api/users/{id}",    getUser)        // (C) method + wildcard
mux.HandleFunc("GET /api/users/me",      getCurrentUser) // (D) literal beats {id}
mux.HandleFunc("GET /api/users/{$}",     listUsers)      // (E) exact root
mux.HandleFunc("DELETE /api/users/{id}", deleteUser)     // (F) different method
```

| Request | Winner | Why |
|---------|--------|-----|
| `GET /api/users/me` | (D) | Literal "me" > wildcard `{id}` |
| `GET /api/users/42` | (C) | GET + wildcard |
| `GET /api/users/` | (E) | `{$}` pins exact path |
| `DELETE /api/users/99` | (F) | Method-specific |
| `POST /api/users/99` | (B) | No POST handler → subtree fallback |

Edge cases: `GET` also matches `HEAD`; unmatched methods → **405 + `Allow`** header; `/posts` → 301 to `/posts/` when only the latter is registered. Compat escape hatch: `GODEBUG=httpmuxgo121=1` reverts to 1.21 path-cleaning/escaping behavior.

---

## Server timeouts & hardening {#server-hardening}

Never `http.ListenAndServe(addr, nil)`. The **zero value of every timeout field means no timeout**; the dangerous default that enables Slowloris and connection exhaustion.

```go
srv := &http.Server{
    Addr:              ":8443",
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,   // primary Slowloris defense (headers only)
    ReadTimeout:       10 * time.Second,  // ENTIRE request incl. body
    WriteTimeout:      30 * time.Second,  // response writes; relax per-request for streaming
    IdleTimeout:       120 * time.Second, // keep-alive idle conns
    MaxHeaderBytes:    1 << 20,           // header size cap — NOT the body
}
```

| Field | Covers | Zero value |
|---|---|---|
| `ReadHeaderTimeout` | reading request **headers only** | falls back to `ReadTimeout`; if that's also ≤0, no timeout |
| `ReadTimeout` | reading the **entire request including body** | no timeout |
| `WriteTimeout` | response writes (from end-of-headers read) | no timeout |
| `IdleTimeout` | keep-alive idle time before next request | falls back to `ReadTimeout`; else no timeout |
| `MaxHeaderBytes` | header size; default 1 MB if unset | **does not** limit the body |

Prefer `ReadHeaderTimeout` over `ReadTimeout` when handlers stream or read large bodies on their own schedule; it bounds the slow-header attack without capping legitimate slow bodies. `WriteTimeout` is incompatible with long-lived responses (SSE, large downloads); relax it **per-request** via `ResponseController.SetWriteDeadline(time.Time{})` (see [#response-controller](#response-controller)), not globally.

Body limits (`MaxBytesReader`, not `io.LimitReader`):

```go
r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MiB; closes conn past limit
// detect [1.13+]:
var mbErr *http.MaxBytesError
if errors.As(err, &mbErr) { http.Error(w, "too large", http.StatusRequestEntityTooLarge); return }
// [1.26] generic form:
if _, ok := errors.AsType[*http.MaxBytesError](err); ok { /* 413 */ }
```

`MaxBytesReader` returns the typed `*http.MaxBytesError` [type since 1.19], tells the `ResponseWriter` to close the connection once exceeded, and (unlike `io.LimitReader`) does **not** silently truncate. On a hit the server stops reading further requests on that conn (you want this for oversized uploads). `http.MaxBytesHandler` wraps a handler with the same cap. `Error()` text is frozen.

Read-before-write (HTTP/1): by default the server consumes any unread request body before starting the response, so true interleaved read/write needs `ResponseController.EnableFullDuplex()` [1.21]. Read what you need from `r.Body` **before** writing on HTTP/1; HTTP/2 permits concurrent reads/writes but the docs still recommend read-before-write for compatibility.

```go
// WRONG on HTTP/1 unless you call EnableFullDuplex:
func echo(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200); io.Copy(w, r.Body) }
```

HTTP/2 & h2c [1.24]: configure protocols declaratively instead of hand-wiring `x/net/http2`:

```go
p := new(http.Protocols)
p.SetHTTP1(true)
p.SetUnencryptedHTTP2(true) // h2c via Prior Knowledge (RFC 9113 §3.3); NOT "Upgrade: h2c"
srv := &http.Server{Addr: ":8080", Handler: mux, Protocols: p}
```

`Server.HTTP2`/`Transport.HTTP2` take `*http.HTTP2Config` (`MaxConcurrentStreams`, and `StrictMaxConcurrentRequests` [field new in 1.26], open a new conn when an H2 conn hits its stream limit). `HTTP2Config` the type is [1.24]. `GODEBUG=http2server=0` disables H2; the `omithttp2` build tag removes it.

Body drain on the client side [1.27]: historically you drained `resp.Body` (`io.Copy(io.Discard, resp.Body)`) before `Close()` for HTTP/1 keep-alive reuse; it never helped HTTP/2 (new stream regardless). The server already reads up to 256 KiB of an unread *request* body after a handler returns for reuse. **Go 1.27 makes HTTP/1 `Response.Body.Close()` auto-drain to EOF up to a bounded limit**, so "just close the body" becomes correct best practice on 1.27+; for ≤1.26 manual draining still aids HTTP/1 reuse. `[verify]` exact 1.27 wording until GA.

---

## Graceful shutdown {#graceful-shutdown}

`Server.Shutdown(ctx)` stops accepting, closes idle conns, then **waits** for in-flight requests until `ctx` expires. `Server.Close()` is the abrupt drop. A server cannot be reused after `Shutdown`.

```go
func main() {
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    srv := &http.Server{Addr: ":8080", Handler: mux /* + timeouts above */}

    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            log.Fatalf("listen: %v", err)
        }
    }()

    <-ctx.Done()
    stop() // restore default signal handling — a SECOND signal now force-quits

    shutdownCtx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
    defer cancel()
    if err := srv.Shutdown(shutdownCtx); err != nil {
        log.Printf("shutdown: %v", err)
        _ = srv.Close()
    }
}
```

- `ListenAndServe` returns `http.ErrServerClosed` on graceful stop; **must** be excluded from fatal handling (`errors.Is`).
- **`Shutdown` does NOT interrupt long-lived/hijacked connections** (SSE, WebSocket). It blocks until they finish or `ctx` expires. Cancel them yourself via the request/base context, or fire `Server.RegisterOnShutdown(fn)` callbacks to signal protocol-specific shutdown. (A long-lived SSE stream *is* an in-flight request; see [#sse](#sse).)
- Multiple servers → errgroup: one `g.Go` per server plus a sibling `g.Go(func() error { <-gctx.Done(); return srv.Shutdown(ctx) })`.
- **Kubernetes:** flip `/readyz`→503 **before** `Shutdown`, sleep ~5s for endpoint propagation, then `Shutdown`; keep `/healthz`=200 throughout. Fit the deadline inside `terminationGracePeriodSeconds` (default 30s → use 25-28s) or the kubelet SIGKILLs you.

---

## Middleware Patterns {#middleware}

Idiomatic middleware is `func(http.Handler) http.Handler`. **There is no stdlib chaining helper through 1.27** and no special "1.26 middleware framework"; plain handler composition is the production baseline and composes across `ServeMux`, Connect handlers, and third-party stacks.

```go
type Middleware func(http.Handler) http.Handler

func Chain(h http.Handler, mws ...Middleware) http.Handler {
    for i := len(mws) - 1; i >= 0; i-- { h = mws[i](h) } // outermost listed first
    return h
}

func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        rw := &statusRecorder{ResponseWriter: w, code: http.StatusOK}
        next.ServeHTTP(rw, r)
        slog.InfoContext(r.Context(), "http request",
            "method", r.Method, "path", r.URL.Path,
            "status", rw.code, "dur", time.Since(start))
    })
}

// Capture status; implement Unwrap so ResponseController reaches the real writer.
type statusRecorder struct {
    http.ResponseWriter
    code int
}
func (r *statusRecorder) WriteHeader(c int)            { r.code = c; r.ResponseWriter.WriteHeader(c) }
func (r *statusRecorder) Unwrap() http.ResponseWriter  { return r.ResponseWriter } // [1.20]
```

- `ServeMux` has no per-route middleware [1.22+]. Options: (a) wrap each handler at registration `mux.Handle("GET /x", Chain(h, mw1, mw2))`; (b) wrap the whole mux for global middleware `srv.Handler = Chain(mux, Logging)`; (c) nested sub-muxes wrapped individually.
- `PathValue` × middleware: the route match happens *inside* `mux.ServeHTTP`, so `r.PathValue(...)` is populated for the handler and any middleware wrapping the **inner** handler, but **not** for middleware wrapping the **outer** mux. If middleware needs `PathValue`, wrap the inner handler.
- Request-scoped values: `r = r.WithContext(context.WithValue(r.Context(), key, val))`, then pass `r` down. Use a **private key type** (`type ctxKey struct{}`), never a bare string.
- Always implement `Unwrap() http.ResponseWriter` on any wrapper, so `ResponseController` and HTTP/2 push/flush/hijack still reach the real writer through the chain.

---

## ResponseController & streaming control {#response-controller}

```go
// CORRECT [1.20] — no type assertion, survives wrapping:
rc := http.NewResponseController(w)
if err := rc.Flush(); err != nil { /* unsupported or client gone */ }

// WRONG — fails the moment any middleware wraps w:
flusher, ok := w.(http.Flusher)
if !ok { http.Error(w, "no flush", 500); return }
flusher.Flush()
```

`http.NewResponseController(w)` [1.20] exposes exactly five methods: `Flush() error`, `SetReadDeadline`, `SetWriteDeadline`, `Hijack`, and `EnableFullDuplex()` [1.21]. It walks the `Unwrap() http.ResponseWriter` chain to the real writer and returns an error matching `http.ErrNotSupported` when unsupported. Internally `Flush` prefers an underlying optional `FlushError() error` over `Flush()`, but there is **no public `ResponseController.FlushError` method**; the public surface already returns an error.

Why it beats `w.(http.Flusher)`: the assertion fails as soon as logging/metrics middleware wraps `w`; `ResponseController` unwraps. For long-lived/slow writes, drop the server-wide `WriteTimeout` per-request:

```go
rc.SetWriteDeadline(time.Time{}) // zero value = no deadline (can't extend an already-exceeded one)
```

`EnableFullDuplex()` [1.21] lets an HTTP/1 handler read the request body *concurrently* with writing the response (HTTP/2 already allows this). Method set unchanged through 1.27.

---

## JSON API Patterns + json/v2 {#json-api}

```go
func writeJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status) // set headers + status BEFORE Encode; Encode writes the body
    if err := json.NewEncoder(w).Encode(data); err != nil {
        slog.Error("encode response", "error", err) // header already sent — can't change status
    }
}

func decodeJSON[T any](w http.ResponseWriter, r *http.Request) (T, error) { // [1.18] generics
    var v T
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // body-aware cap, not io.LimitReader
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields() // strict: reject unknown fields
    if err := dec.Decode(&v); err != nil {
        return v, fmt.Errorf("decoding body: %w", err)
    }
    if dec.More() { return v, errors.New("body must contain a single JSON object") }
    return v, nil
}
```

**`omitzero` [1.24]; GA now, use it.** Unlike `omitempty`, it omits zero-valued `time.Time` and any type with `IsZero() bool`, fixing the #1 `omitempty` trap (a zero `time.Time` is non-empty, so `omitempty` leaks `"0001-01-01T..."`). Combine both: with `,omitempty,omitzero` the field drops if empty **or** zero.

```go
type Event struct {
    ID   string    `json:"id"`
    When time.Time `json:"when,omitzero"` // [1.24] drops zero time; omitempty would NOT
}
```

**`encoding/json/v2` status; flag clearly.** Through **1.26** it exists **only** under `GOEXPERIMENT=jsonv2` (off by default); the **1.26 release notes do not mention it at all**. Enabling the experiment also re-backs v1 `encoding/json` with the v2 engine (v1 behavior preserved under the Go 1 promise; error *text* may differ). In **1.27** `encoding/json/v2` + `encoding/json/jsontext` become regular packages, v1 is reimplemented on v2 by default, and the opt-out is `GOEXPERIMENT=nojsonv2` (removal expected in a future release). GA'd 2026-08-19; confirmed against the final release notes.

v2 API shape differs from v1; options are **function arguments**, not `Decoder` methods:
```go
// Requires GOEXPERIMENT=jsonv2 on 1.25/1.26; default on 1.27.
import jsonv2 "encoding/json/v2"
data, err := jsonv2.Marshal(v, jsonv2.Deterministic(true), jsonv2.OmitZeroStructFields(true))
err = jsonv2.Unmarshal(b, &dst, jsonv2.RejectUnknownMembers(true))
// streaming lives in jsontext (Encoder/Decoder); MarshalWrite/UnmarshalRead take io.Writer/io.Reader.
```

Migration hazards (v2 defaults flip behavior): field matching is **case-sensitive** (v1 was insensitive; a documented auth-bypass surface; restore via `MatchCaseInsensitiveNames(true)`); **duplicate object keys are rejected** (v1 took last-wins); **nil slices/maps marshal as `[]`/`{}`** not `null` (restore via `FormatNilSliceAsNull(true)`/`FormatNilMapAsNull(true)`); invalid UTF-8 rejected; errors carry path context. Run `GOEXPERIMENT=jsonv2 go test ./...` on a pre-1.27 toolchain to surface breakage before the 1.27 flip; `jsonv2.DefaultOptionsV1()` reproduces v1 semantics on the v2 engine. Performance: ~parity-to-faster marshal, up to ~10× faster unmarshal; but benchmark your payloads (a marshal-allocation regression was reported for some `map[string]string` workloads).

For struct tags, custom marshalers, and streaming large payloads: [encoding-and-serialization.md](encoding-and-serialization.md#json).

---

## Request Validation {#validation}

Validate **after** decode, **before** the service call; return 422 for semantic failures, 400 for malformed input. Keep validation in the type or a method, not scattered in the handler.

```go
type CreateUserRequest struct {
    Email string `json:"email"`
    Age   int    `json:"age"`
}
func (r CreateUserRequest) Validate() error {
    var errs []error
    if !strings.Contains(r.Email, "@") { errs = append(errs, errors.New("email: invalid")) }
    if r.Age < 0 || r.Age > 150       { errs = append(errs, errors.New("age: out of range")) }
    return errors.Join(errs...) // [1.20] nil if no errors; collects all, not first-fail
}

func createUser(w http.ResponseWriter, r *http.Request) {
    req, err := decodeJSON[CreateUserRequest](w, r)
    if err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
    if err := req.Validate(); err != nil { http.Error(w, err.Error(), http.StatusUnprocessableEntity); return }
    user, err := userService.Create(r.Context(), req)
    if err != nil {
        if errors.Is(err, ErrConflict) { http.Error(w, "exists", http.StatusConflict); return }
        slog.ErrorContext(r.Context(), "create user", "error", err) // log ONCE at the boundary
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
    writeJSON(w, http.StatusCreated, user)
}
```

`errors.Join` collects every field error (vs. fail-fast). For large rule sets, `go-playground/validator` (struct tags) is the standard library, but keep cross-field/business rules in code. Error-mapping detail: [errors-and-resilience.md](errors-and-resilience.md#wrapping-strategy).

---

## HTTP Client Best Practices {#http-client}

`http.DefaultClient` has **no timeout**: a slow/hung server blocks the goroutine forever. Build one client with explicit timeouts and **reuse it** (each `Transport` owns the connection pool; a per-request `Transport`/`Client` defeats keep-alive and leaks file descriptors).

```go
var client = &http.Client{
    Timeout: 30 * time.Second, // whole request: dial + redirects + reading body
    Transport: &http.Transport{
        MaxIdleConns:          100,
        MaxIdleConnsPerHost:   10,   // DEFAULT IS 2 — the #1 throughput trap for one upstream
        MaxConnsPerHost:       0,    // 0 = unlimited active conns per host
        IdleConnTimeout:       90 * time.Second,
        TLSHandshakeTimeout:   10 * time.Second,
        ExpectContinueTimeout: 1 * time.Second,
        ForceAttemptHTTP2:     true,
    },
}

func (c *APIClient) Get(ctx context.Context, path string, out any) error {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil) // propagate ctx
    if err != nil { return fmt.Errorf("new request: %w", err) }
    req.Header.Set("Authorization", "Bearer "+c.apiKey)

    resp, err := c.httpClient.Do(req)
    if err != nil { return fmt.Errorf("do: %w", err) } // ctx cancel/deadline surfaces here
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096)) // cap untrusted error bodies
        return fmt.Errorf("api %d: %s", resp.StatusCode, body)
    }
    return json.NewDecoder(resp.Body).Decode(out)
}
```

- **`Client.Timeout` vs `ctx`:** `Timeout` is a blunt whole-request cap including body read; a per-call `ctx` deadline (`NewRequestWithContext`) is finer-grained and cancellable mid-flight. Use `ctx` for request budgets; keep `Timeout` as a backstop.
- **Always `defer resp.Body.Close()` after the nil-error check**, and read the body to EOF (or `io.Copy(io.Discard, resp.Body)`) for HTTP/1 keep-alive reuse, though on **1.27** `Close()` auto-drains, and HTTP/2 reuses regardless.
- **Default `MaxIdleConnsPerHost` is 2**, for a service hammering one upstream this serializes connections; raise it.
- **One `*http.Client` per process** (or per upstream with distinct config); share it; it's goroutine-safe.

Client retry/backoff/circuit-breaking belong at this boundary: [errors-and-resilience.md](errors-and-resilience.md#retry). Context propagation rules: [concurrency.md](concurrency.md#context).

---

## Cross-Origin Protection [Go 1.25+] {#cross-origin}

**Token-less CSRF for browser-facing unsafe methods.** `http.CrossOriginProtection` [1.25] rejects non-safe cross-origin browser requests using `Sec-Fetch-Site` (falling back to comparing `Origin` against `Host`). No tokens/cookies. Safe methods (GET/HEAD/OPTIONS) always pass; requests lacking those browser headers are allowed. It is **not** an authorization layer.

```go
cop := http.NewCrossOriginProtection() // zero value works
cop.AddTrustedOrigin("https://partner.example.com")
cop.AddInsecureBypassPattern("POST /api/webhooks/stripe") // bypass for non-browser webhooks
srv := &http.Server{Handler: cop.Handler(mux)} // wrap mux; rejected → 403
```

| Method | Purpose |
|--------|---------|
| `Handler(h)` | Wrap; rejected requests get 403 |
| `Check(req)` | Manual check; returns error if cross-origin |
| `SetDenyHandler(h)` | Custom rejection response |
| `AddTrustedOrigin(origin)` | Allowlist an exact origin (no wildcards) |
| `AddInsecureBypassPattern(pat)` | Bypass a `ServeMux` pattern |

Security fix (CVE-2025-47910 / GO-2025-3955): `AddInsecureBypassPattern` bypassed **more** requests than intended (it also exempted requests that would redirect to the pattern, e.g. a missing trailing slash), skipping validation while forwarding the original path to a different handler. **Fixed in Go 1.25.1** (the feature only exists from 1.25.0, so there is no 1.24.x backport). Limitations: no wildcard trusted origins; needs HTTPS in production; older browsers may omit `Sec-Fetch-Site`; pair with `SameSite=Lax/Strict` cookies. Pre-1.25 backport: `filippo.io/csrf`. TLS/headers detail: [security.md](security.md#http-security).

---

## WebSocket Implementation {#websockets}

```go
import (
    "github.com/coder/websocket"      // formerly nhooyr.io/websocket; context-native, std-lib-style
    "github.com/coder/websocket/wsjson"
)

func handleWS(w http.ResponseWriter, r *http.Request) {
    conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
        OriginPatterns: []string{"app.example.com"}, // NOT "*" in production
    })
    if err != nil { slog.Error("ws accept", "error", err); return }
    defer conn.CloseNow()

    ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
    defer cancel()

    for {
        var msg IncomingMessage
        if err := wsjson.Read(ctx, conn, &msg); err != nil {
            if websocket.CloseStatus(err) == websocket.StatusNormalClosure { return }
            slog.Error("ws read", "error", err)
            return
        }
        if err := wsjson.Write(ctx, conn, process(msg)); err != nil { return }
    }
}
```

WebSocket hijacks the connection, so **`Server.Shutdown` won't wait for or close it**. Cancel via the request context (above) or `RegisterOnShutdown`. `OriginPatterns` is the CSRF defense for the upgrade; `"*"` disables it. Library note: `nhooyr.io/websocket` moved to `github.com/coder/websocket`; `gorilla/websocket` is back under active maintenance (use it when you need its mature gorilla ecosystem / per-message deflate tuning). Hub/broadcast pattern with an `RWMutex`-guarded client set is unchanged.

---

## Server-Sent Events (SSE) {#sse}

```go
func handleSSE(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream") // required
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("X-Accel-Buffering", "no")            // defeat nginx proxy buffering
    rc := http.NewResponseController(w)
    rc.SetWriteDeadline(time.Time{})                     // [1.20] cancel server-wide WriteTimeout

    events := subscribe(r.Context()) // <-chan Event
    ticker := time.NewTicker(15 * time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-r.Context().Done(): // client disconnect
            return
        case <-ticker.C:
            fmt.Fprint(w, ": heartbeat\n\n")             // keep idle proxies open
            if err := rc.Flush(); err != nil { return }
        case ev, ok := <-events:
            if !ok { return }
            fmt.Fprintf(w, "event: %s\ndata: %s\n\n", ev.Type, ev.Data) // blank line ends event
            if err := rc.Flush(); err != nil { return }  // flush EVERY event
        }
    }
}
```

The two invariants: **flush after every event** (via `ResponseController`, not `w.(http.Flusher)`) and **stop on `r.Context().Done()`**. Framing: each event is `data: <payload>\n\n`; optional `event:`/`id:`/`retry:`, one per line. **Do NOT wrap SSE in `http.TimeoutHandler`**; it explicitly does not support `Flusher`. A live SSE stream is an in-flight request, so `Server.Shutdown` waits for it; cancel via context.

---

## gRPC with ConnectRPC {#grpc}

ConnectRPC generates one Go service surface that is **plain `net/http`** and speaks Connect + gRPC + gRPC-Web; browser-friendly, debuggable with curl, composes with normal middleware. Generated constructors return `(path string, http.Handler)` registered on a stdlib mux.

```go
import (
    "connectrpc.com/connect" // NOT github.com/bufbuild/connect-go (frozen since 2023)
    userv1 "example/gen/user/v1"
    "example/gen/user/v1/userv1connect"
)

func (s *UserServer) GetUser(ctx context.Context, req *connect.Request[userv1.GetUserRequest],
) (*connect.Response[userv1.GetUserResponse], error) {
    user, err := findUser(ctx, req.Msg.Id)
    if err != nil { return nil, connect.NewError(connect.CodeNotFound, err) }
    return connect.NewResponse(&userv1.GetUserResponse{User: user}), nil
}

mux := http.NewServeMux()
path, handler := userv1connect.NewUserServiceHandler(&UserServer{})
mux.Handle(path, handler) // serve over http.Protocols (1.24) for h2c — no x/net/http2
```

connect-go on **1.24+** uses `http.Protocols` for h2c, dropping the `x/net/http2` dependency. OTel helper: `connectrpc.com/otelconnect` (old `bufbuild/connect-opentelemetry-go` is stale). Validation: `connectrpc.com/validate` (Protovalidate).

grpc-go [v1.63+] (stale patterns models still emit):
```go
// CORRECT
conn, err := grpc.NewClient("dns:///api.internal:443",
    grpc.WithTransportCredentials(insecure.NewCredentials()))
// WRONG — all deprecated:
conn, err := grpc.Dial("api.internal:443", grpc.WithInsecure(), grpc.WithBlock())
```
`grpc.NewClient` is current; `grpc.Dial`/`DialContext` are **deprecated**, do **no I/O at construction**, and `NewClient` defaults to the **`dns`** resolver (Dial used `passthrough`, matters for custom dialers). `WithBlock`/`WithTimeout`/`WithReturnConnectionError`/`FailOnNonTempDialError` are deprecated and **ignored by `NewClient`** (validate via RPC errors, not at dial). `WithInsecure()` → `insecure.NewCredentials()`. Telemetry: the OTel **`StatsHandler`** (`otelgrpc.NewClientHandler`/`NewServerHandler`) is current; the old `*Interceptor` helpers are deprecated.

Decision: browser/gRPC-Web/pure-net/http → **connect-go**; deep gRPC ecosystem (xDS, channelz, advanced LB/resolvers) → **grpc-go**; REST/JSON façade from proto annotations → **grpc-gateway** (different problem; not superseded by `ServeMux`); REST↔RPC transcoding over either → `connectrpc.com/vanguard`.

---

## API Versioning and Documentation {#api-versioning}

- URL-path versioning (`/api/v1/...`) is the dominant Go convention, explicit, cache-friendly, trivial with `ServeMux` subtrees; register `v1`/`v2` as sibling prefixes and mount per-version sub-muxes. Header/`Accept`-based versioning is harder to route and debug.
- OpenAPI: generate the spec from code (annotations) or generate code from the spec; pick one direction. `oapi-codegen` (spec→Go types + `ServeMux`/chi server stubs, `net/http`-native) is the common choice; `swaggo/swag` reads handler comments. ConnectRPC/gRPC users get the proto as the contract for free.
- Breaking-change discipline: add fields (never remove/retype) within a version; new required fields or changed semantics → new version. Validate request/response against the spec in contract tests: [testing-advanced.md](testing-advanced.md#contract-testing).

---

## Library landscape & status {#libraries}

| Area | Current [2026] | Deprecated / superseded |
|---|---|---|
| Routing | stdlib `net/http.ServeMux` [1.22+] | gorilla/mux (v1.8.1, legacy), httprouter for typical REST |
| Richer router | `go-chi/chi/v5` (route groups, middleware ecosystem, regex) | `go-chi/chi` (pre-v5) |
| Streaming control | `http.ResponseController` [1.20] | `w.(http.Flusher)` assertion |
| h2c / HTTP/2 tuning | `Server.Protocols` + `http.HTTP2Config` [1.24] | `golang.org/x/net/http2/h2c`, manual `http2.ConfigureServer` |
| gRPC client ctor | `grpc.NewClient` [v1.63+] | `grpc.Dial`/`DialContext`, `WithBlock`/`WithTimeout` |
| gRPC insecure creds | `insecure.NewCredentials()` | `grpc.WithInsecure()` |
| gRPC telemetry | `otelgrpc.New{Client,Server}Handler` (StatsHandler) | `otelgrpc.*Interceptor`, OpenCensus `ocgrpc` |
| Connect | `connectrpc.com/connect` | `github.com/bufbuild/connect-go` |
| Connect OTel | `connectrpc.com/otelconnect` | `bufbuild/connect-opentelemetry-go` |
| REST↔gRPC | `grpc-ecosystem/grpc-gateway/v2`, `connectrpc.com/vanguard` | dummy `tools.go` install (use `go.mod` `tool` directive [1.24]) |
| CSRF | `http.CrossOriginProtection` [1.25, patch ≥1.25.1] | gorilla/csrf, hand-rolled tokens; `filippo.io/csrf` for <1.25 |
| WebSocket | `github.com/coder/websocket`; `gorilla/websocket` (re-maintained) | `nhooyr.io/websocket` import path (moved to coder) |
| JSON | `encoding/json` v1 (stable) + `omitzero` [1.24]; v2 experiment [1.25/1.26], baseline [1.27] | `DisallowUnknownFields`-only mental model for v2 |
| Rate limiting | `golang.org/x/time/rate` | - |

Frameworks (Gin/Echo/Fiber) remain valid; choose for ecosystem/team familiarity, not for routing the stdlib now covers. Reach past `ServeMux` for: route groups with shared middleware, regex/typed param constraints, or trie-level perf → **chi** (idiomatic, `net/http`-compatible).

---

## Version map 1.20→1.27 {#versions}

| Ver | HTTP/API-relevant |
|---|---|
| **1.20** | `http.ResponseController` (`Flush`/`Hijack`/deadlines); `errors.Join` (multi-error validation) |
| **1.21** | `ResponseController.EnableFullDuplex` (HTTP/1 concurrent read+write); `log/slog` |
| **1.22** | **Enhanced `ServeMux`**: method routing, `{id}`/`{path...}`/`{$}`, `PathValue`/`SetPathValue`, auto-405+`Allow`, registration-panic on overlap, `GODEBUG=httpmuxgo121=1` |
| **1.23** | Timer/ticker GC + synchronous timer channels (SSE/heartbeat loops no longer leak via `time.After`) |
| **1.24** | `Server/Transport.Protocols` + `http.HTTP2Config` (h2c without x/net); `encoding/json` **`omitzero`**; `Transport.MaxResponseHeaderBytes` bounds 1xx; `go.mod` `tool` directive |
| **1.25** | `http.CrossOriginProtection` (token-less CSRF); `encoding/json/v2` lands behind `GOEXPERIMENT=jsonv2` |
| **1.26** | `errors.AsType[*http.MaxBytesError]`; `HTTP2Config.StrictMaxConcurrentRequests`; json/v2 still experiment-gated (no release-note mention) |
| **1.27** | json/v2 + jsontext GA, v1 re-backed by v2 (opt-out `GOEXPERIMENT=nojsonv2`); HTTP/1 `Response.Body.Close()` auto-drain; `Server.DisableClientPriority` (RFC 9218); ALPN on user conns. GA 2026-08-19 (row from 2026-06 draft notes; confirmed against the final release notes). |

CVE note: `CrossOriginProtection` bypass **CVE-2025-47910 / GO-2025-3955** fixed in **1.25.1**.

---

## What models get wrong {#anti-patterns}

1. Pre-1.22 routing: manual `r.Method` checks + `strings.TrimPrefix` instead of `"GET /posts/{id}"` + `r.PathValue`; throws away 405/conflict-detection/specificity. [stale <1.22]
2. No server timeouts: `http.ListenAndServe(addr, h)` or `&http.Server{}` with zero fields (= no timeout); missing `ReadHeaderTimeout` (the Slowloris defense). Confusing `ReadTimeout` (whole request incl. body) with `ReadHeaderTimeout` (headers only).
3. `w.(http.Flusher)` assertion for SSE/streaming, silently fails behind wrappers; use `http.NewResponseController(w).Flush()` [1.20]. Inventing a `ResponseController.FlushError` method (doesn't exist; `Flush` already returns an error).
4. `io.LimitReader` for request bodies instead of `http.MaxBytesReader`; misses the typed `*MaxBytesError` and connection-close-past-limit semantics. Forgetting `errors.AsType[*http.MaxBytesError]` [1.26].
5. Shutdown misconceptions: believing `Shutdown` interrupts SSE/WebSocket (it WAITS); forgetting to exclude `http.ErrServerClosed`; reaching for `Close` when `Shutdown` is meant; not propagating cancellation to hijacked conns.
6. Body draining cargo-culted for HTTP/2 (pointless) or never closing bodies (leaks conns). On 1.27 `Close()` auto-drains HTTP/1.
7. `http.DefaultClient` (no timeout) or a fresh `Client`/`Transport` per request (kills keep-alive). Leaving `MaxIdleConnsPerHost` at the default **2** for a single hot upstream.
8. `TimeoutHandler` around SSE/streaming: it doesn't support `Flusher`.
9. Writing the response before reading the request body on HTTP/1 without `EnableFullDuplex()` [1.21]; the server consumes the unread body first.
10. JSON v2 staleness both ways: claiming it's GA/default in 1.25/1.26 (it is NOT; `GOEXPERIMENT=jsonv2`, off, no 1.26 note; baseline only in 1.27 draft), OR being unaware of it and of the case-sensitivity / nil-slice→`[]` / duplicate-key-rejection flips. Also unaware that v2 options are function args, not `Decoder` methods.
11. `omitempty` on `time.Time` expecting omission: use `omitzero` [1.24] (`IsZero()`); a zero time is non-empty.
12. CSRF: recommending gorilla/csrf or hand-rolled tokens when `http.CrossOriginProtection` [1.25] exists; unaware of the 1.25.1 bypass fix (CVE-2025-47910).
13. h2c via `x/net/http2/h2c` as the first answer: use `Server.Protocols.SetUnencryptedHTTP2(true)` [1.24]. The `Upgrade: h2c` path is unsupported (prior-knowledge only).
14. `grpc.Dial` + `WithInsecure()` + `WithBlock()`: all deprecated; `grpc.NewClient` + `insecure.NewCredentials()`, no `WithBlock` (ignored). Missing that `NewClient` defaults to `dns`, not `passthrough`.
15. connect-go old import `github.com/bufbuild/connect-go` (→ `connectrpc.com/connect`); otelgrpc `*Interceptor` instead of the `StatsHandler`.
16. String context keys instead of a private key type; assuming `PathValue` is populated in **outer** middleware (it isn't; wrap the inner handler).
17. `Access-Control-Allow-Origin: *` in production / WebSocket `OriginPatterns: ["*"]`; allows any site to drive authenticated/cross-origin requests.
18. Logging AND returning errors in handlers: duplicate log lines as the error bubbles; log once at the boundary (see errors-and-resilience).
19. `net/http/pprof` imported globally: registers on `DefaultServeMux`, exposing profiling publicly; mount on a separate auth-protected mux.

---

## Production Checklist {#production-checklist}

- [ ] All four server timeouts set (`ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`) + `MaxHeaderBytes`
- [ ] `http.MaxBytesReader`/`MaxBytesHandler` on every body-reading route → 413 on `*MaxBytesError`
- [ ] Graceful shutdown (`signal.NotifyContext` + `srv.Shutdown(ctx)`, exclude `ErrServerClosed`, double-signal force-quit)
- [ ] Long-lived handlers (SSE/WebSocket) cancel via context on shutdown; not behind `TimeoutHandler`
- [ ] One reused `*http.Client` with `Timeout` + tuned `Transport` (`MaxIdleConnsPerHost`); per-request `ctx` deadlines
- [ ] Structured logging + request ID per request; errors logged once
- [ ] `http.CrossOriginProtection` [1.25.1+] for browser-facing unsafe methods; explicit CORS allowlist (not `*`)
- [ ] Input validation on all endpoints (422 semantic / 400 malformed; fail closed)
- [ ] Rate limiting (`golang.org/x/time/rate`, per-IP/user); health endpoints (`/healthz` liveness, `/readyz` readiness)
- [ ] OpenTelemetry middleware (tracing): [observability.md](observability.md#metrics)

---

## See Also {#see-also}

- [errors-and-resilience.md](errors-and-resilience.md#retry): client retry/backoff, circuit breakers, timeout/deadline propagation
- [security.md](security.md#http-security): TLS, CSRF defense-in-depth, security headers, input validation
- [observability.md](observability.md#metrics): request tracing, OTel middleware, slog with trace correlation
- [encoding-and-serialization.md](encoding-and-serialization.md#json): JSON tags, custom marshalers, json/v2 deep dive, streaming
- [concurrency.md](concurrency.md#context): context propagation, cancellation, errgroup for multi-server shutdown
- [testing.md](testing.md#http-testing): `httptest.NewRecorder`/`NewServer`, handler testing

---

## Sources {#sources}

- pkg.go.dev/net/http (`Server`, `ServeMux`, `ResponseController`, `MaxBytesError`, `HTTP2Config`, `CrossOriginProtection`, `Transport`); pkg.go.dev/encoding/json, encoding/json/v2, jsontext
- go.dev/doc/go1.20-go1.27 release notes
- go.dev/blog/routing-enhancements (1.22 ServeMux); go.dev/doc/godebug (httpmuxgo121, http2server)
- pkg.go.dev/vuln/GO-2025-3955 (CVE-2025-47910, `AddInsecureBypassPattern` bypass, fixed 1.25.1)
- connectrpc.com/docs/go; google.golang.org/grpc (`NewClient`, deprecation history v1.63/1.64); github.com/coder/websocket, go-chi/chi/v5, grpc-ecosystem/grpc-gateway
