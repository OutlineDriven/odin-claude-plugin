# Networking Patterns in Go

The `net` package is unforgiving by design: there is **no default timeout** on a `net.Conn`, so a missing deadline is the #1 cause of goroutine + socket leaks in production. Modern Go shifts the defaults you should reach for: **`net/netip` over `net.IP`** (value type, comparable, zero-alloc), **`KeepAliveConfig` over a bare `KeepAlive` duration** [1.23], and **`ListenConfig`/`Dialer` with `Control` + context** over the package-level `Listen`/`Dial`. This file is the net-layer delta; HTTP lives in [http-and-apis.md](http-and-apis.md), TLS config in [security.md](security.md#tls).

> Verified against Go **1.26.3** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. APIs checked against pkg.go.dev/{net,net/netip} and the go1.26.3 source.

## TL;DR: the modern deltas (read first)

- `netip.Addr` [1.18] replaces `net.IP` for storage/comparison: it's a 24-byte *value* (no heap alloc, no aliasing bugs from a shared `[]byte`), it's **comparable** (`==`, map key), and it's immutable. `net.IP` is a `[]byte` you must `bytes.Equal`/`Equal` and that allocates. Convert at the syscall edge with `TCPAddrFromAddrPort` / `(*net.TCPAddr).AddrPort()`.
- `KeepAliveConfig{Enable, Idle, Interval, Count}` [1.23] is the real knob. The old single `Dialer.KeepAlive time.Duration` only set the idle period; it's now **ignored when `KeepAliveConfig.Enable` is true**. Keep-alive detects a *dead peer*; it is **not** an application read deadline.
- An idle/closed socket does not unblock `Read` on its own: set a read deadline. A `Close` from another goroutine makes the in-flight op return an error wrapping **`net.ErrClosed`** (test with `errors.Is`, not string match).
- **`io.Copy(dst, src)` between two `*net.TCPConn` uses `splice(2)` automatically** (and `*os.File`→conn uses `sendfile(2)`), because `*TCPConn` implements `io.ReaderFrom`/`io.WriterTo`. Don't hand-roll a copy buffer for proxies; you'd defeat the zero-copy path.
- `DNSError` wraps `context.DeadlineExceeded`/`Canceled` [1.23]: `errors.Is(err, context.DeadlineExceeded)` now works on resolver timeouts.
- Half-close is `CloseWrite()` (sends FIN, keeps reading), the right shutdown for request/response-then-drain protocols. A plain `Close()` on both sides loses in-flight bytes.

## Table of Contents
1. [netip.Addr vs net.IP](#netip)
2. [Dialer: context, timeouts, keep-alive](#tcp-client)
3. [TCP Server with Graceful Shutdown](#tcp-server)
4. [net.Conn Deadlines: The #1 Mistake](#deadlines)
5. [ListenConfig, Control & SO_REUSEPORT](#listenconfig)
6. [Half-Close and io.Copy / splice](#half-close)
7. [UDP Server and Client](#udp)
8. [Unix Domain Sockets](#unix-sockets)
9. [TLS over raw TCP / mTLS](#tls)
10. [DNS: Custom Resolvers](#dns)
11. [Custom Binary Protocol (Framing)](#custom-protocol)
12. [High-Performance Networking (gnet)](#high-perf)
13. [Library landscape & status](#libraries)
14. [Version map 1.18→1.27](#versions)
15. [Anti-Patterns / What models get wrong](#anti-patterns)

---

## netip.Addr vs net.IP {#netip}

`net.IP` is `[]byte` : a pointer, length, and cap on the heap. That makes it non-comparable (`==` compares slice headers, not contents), mutable (a copy aliases the same backing array), and an allocation per parse. `netip.Addr` [1.18] is a small **value type**: comparable, immutable, allocation-free, and usable as a map key.

```go
// RIGHT — value type: comparable, no alloc, safe map key
addr, err := netip.ParseAddr("2001:db8::1")   // also MustParseAddr in tests
if err != nil { return err }
allow := map[netip.Addr]bool{addr: true}      // Addr is a valid key
ap, _ := netip.ParseAddrPort("10.0.0.1:443")  // AddrPort = Addr + uint16 port

// WRONG — net.IP can't be compared or keyed; == checks slice headers, not bytes
var ip net.IP = net.ParseIP("2001:db8::1")
if ip == net.ParseIP("2001:db8::1") { /* always false — compares headers */ }
_ = map[string]bool{ip.String(): true}        // forced to stringify → alloc + parse churn
```

Semantic traps `netip` fixes: the zero `Addr` is *invalid* (`IsValid()` false) and distinct from `0.0.0.0` and `::` ; unlike `net.IP(nil)` which silently behaves like the wildcard. IPv4 and IPv4-in-IPv6 are now distinct under `==`/`Compare` [1.23 fixed the old `reflect.DeepEqual` bug]; use `Unmap()` to normalize `::ffff:a.b.c.d` to 4-byte form, and `Is4()`/`Is4In6()` to disambiguate. `Compare`/`Less` give a total order for sorting; `As4()`/`As16()`/`AsSlice()` get the bytes.

**CIDR membership is `Prefix`, not manual masking:**

```go
pfx := netip.MustParsePrefix("10.0.0.0/8")
pfx.Contains(netip.MustParseAddr("10.1.2.3")) // true — no net.IPNet, no big.Int
// Note: ParsePrefix does NOT zero host bits; call pfx.Masked() for canonical form.
```

Interop at the edge: the kernel-facing `net` APIs still take `*net.TCPAddr`/`*net.UDPAddr`. Convert only there: `net.TCPAddrFromAddrPort(ap)` and `(*net.TCPAddr).AddrPort()` (and the UDP equivalents). Store `netip.Addr` in your structs; materialize a `*net.UDPAddr` only for the `WriteToUDPAddrPort`/`Dial` call. `Resolver.LookupNetIP` [1.18] returns `[]netip.Addr` directly: prefer it over `LookupIPAddr`.

---

## Dialer: context, timeouts, keep-alive {#tcp-client}

Always dial through a `net.Dialer` with `DialContext` : the package-level `net.Dial` can't be cancelled and has no timeout. `Timeout` bounds **connection establishment** (DNS + handshake); it is *not* a deadline on the resulting connection.

```go
// RIGHT [1.23] — context-cancellable dial; structured keep-alive
d := &net.Dialer{
    Timeout: 5 * time.Second,                 // bounds connect only (DNS+TCP handshake)
    KeepAliveConfig: net.KeepAliveConfig{     // [1.23] supersedes the bare KeepAlive field
        Enable:   true,
        Idle:     30 * time.Second,           // idle before first probe (0 ⇒ 15s default)
        Interval: 15 * time.Second,           // between probes        (0 ⇒ 15s default)
        Count:    4,                          // unanswered probes before drop (0 ⇒ 9)
    },
}
conn, err := d.DialContext(ctx, "tcp", "example.com:9000")
if err != nil { return fmt.Errorf("dial: %w", err) }
defer conn.Close()
// Now set I/O deadlines per operation — KeepAlive is NOT a read timeout (see #deadlines).
```

```go
// WRONG — no context (uncancellable), and KeepAlive misused as an app-level timeout
conn, _ := net.Dial("tcp", "example.com:9000") // no Timeout, no ctx, can hang on DNS
d := &net.Dialer{KeepAlive: 30 * time.Second}  // detects dead peer only; not a read deadline
```

Points models miss: `Dialer.Timeout` and `ctx` deadline both apply; whichever fires first wins. For dual-stack hosts, Go runs **Happy Eyeballs** (RFC 6555): `FallbackDelay` (default 300ms) is the head start IPv6 gets before IPv4 is also tried; set it negative to disable. `KeepAlive` (the old field) is **ignored when `KeepAliveConfig.Enable` is true**. The `ctx` passed to `DialContext` governs only the dial; it does **not** propagate to the connection's later `Read`/`Write` (those need deadlines).

Pooling: for HTTP, `http.Transport` already pools: see [http-and-apis.md](http-and-apis.md#http-client); for SQL, `database/sql` pools. Roll your own (`chan *Conn` as a bounded pool) **only** for a custom long-lived TCP protocol, and validate before reuse: a `SetReadDeadline(time.Now())` + zero-byte read probe catches a peer that closed while idle (you'll get `net.ErrClosed`/EOF or a non-timeout error → discard).

---

## TCP Server with Graceful Shutdown {#tcp-server}

`net.Listen` → accept loop → per-connection goroutine → close the listener to unblock `Accept`, then drain in-flight conns with a `WaitGroup`.

```go
func runTCPServer(ctx context.Context, ln net.Listener, handle func(context.Context, net.Conn)) error {
    var wg sync.WaitGroup
    context.AfterFunc(ctx, func() { ln.Close() }) // [1.21] closing the listener unblocks Accept

    for {
        conn, err := ln.Accept()
        if err != nil {
            if errors.Is(err, net.ErrClosed) { break } // intentional shutdown — not an error
            // transient accept errors (e.g. EMFILE) — back off briefly, don't spin
            slog.Error("accept", slog.Any("err", err))
            time.Sleep(5 * time.Millisecond)
            continue
        }
        wg.Add(1)
        go func() {
            defer wg.Done()
            defer conn.Close()
            handle(ctx, conn) // handler sets its own per-op deadlines (see #deadlines)
        }()
    }
    // Optional: bound the drain so a stuck conn can't block shutdown forever.
    done := make(chan struct{})
    go func() { wg.Wait(); close(done) }()
    select {
    case <-done:
    case <-time.After(10 * time.Second): // force-close laggards
    }
    return nil
}
```

Why `errors.Is(err, net.ErrClosed)` and not `ctx.Err() != nil`: `Accept` returns the wrapped `net.ErrClosed` the instant the listener closes; checking the listener's own error is precise and avoids a race where `ctx` is done but `Accept` hasn't returned. The pre-1.16 idiom of string-matching `"use of closed network connection"` is obsolete. Take the `net.Listener` as a parameter (created via `ListenConfig`, below) so tests can pass `:0` and read back `ln.Addr()`.

---

## net.Conn Deadlines: The #1 Mistake {#deadlines}

There is no default I/O timeout. Without a deadline, `Read`/`Write` block forever when the peer vanishes (partition, crash, NAT timeout, pulled cable). Keep-alive helps detect this *eventually* (minutes), but per-operation deadlines are the real guard.

| Method | Affects | Use when |
|--------|---------|----------|
| `SetDeadline(t)` | both Read and Write | one absolute cutoff for the whole exchange |
| `SetReadDeadline(t)` | Read only | waiting for the next request/frame |
| `SetWriteDeadline(t)` | Write only | bounding a slow/blocked send |

Rules: deadlines are **absolute times** (`time.Now().Add(d)`), not durations; re-arm before *every* blocking op, they don't auto-reset. `time.Time{}` clears them. A timed-out op returns a `net.Error` with `Timeout() == true`, and **the connection stays usable** after you reset the deadline.

```go
// RIGHT — idle-deadline loop: re-arm per op; a read timeout is "still idle", keep going
const idle = 60 * time.Second
for {
    conn.SetReadDeadline(time.Now().Add(idle))
    frame, err := readFrame(conn)
    if err != nil {
        var ne net.Error
        if errors.As(err, &ne) && ne.Timeout() { return nil } // idle too long → close cleanly
        if errors.Is(err, net.ErrClosed) || errors.Is(err, io.EOF) { return nil }
        return fmt.Errorf("read: %w", err)
    }
    conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
    if _, err := conn.Write(respond(frame)); err != nil {
        return fmt.Errorf("write: %w", err)
    }
}
```

```go
// WRONG — classifies a benign timeout as fatal, and uses a fragile string check
if err != nil {
    if strings.Contains(err.Error(), "timeout") { /* brittle */ }
    return err // a read timeout here kills a perfectly healthy idle connection
}
```

To cancel a blocked `Read` from elsewhere (e.g. on `ctx` cancel), call `conn.SetReadDeadline(time.Now())` ; it returns immediately with a timeout error. `context.AfterFunc(ctx, func(){ conn.SetDeadline(time.Now()) })` [1.21] wires a context into a connection that has no `DialContext`-style hook.

---

## ListenConfig, Control & SO_REUSEPORT {#listenconfig}

`net.Listen` gives no access to socket options. `ListenConfig` does: its `Control func(network, address string, c syscall.RawConn) error` runs **after** the socket is created but **before** `bind`/`listen` : the only place to set `SO_REUSEPORT`, `SO_REUSEADDR`, buffer sizes, etc. (`Dialer` has the same hook, plus `ControlContext` [1.20] when you need the `ctx`.)

```go
import "golang.org/x/sys/unix"

lc := net.ListenConfig{
    KeepAliveConfig: net.KeepAliveConfig{Enable: true, Idle: 30 * time.Second}, // applied to accepted conns
    Control: func(network, address string, c syscall.RawConn) error {
        var serr error
        if err := c.Control(func(fd uintptr) {
            // SO_REUSEPORT: multiple listeners on the SAME addr:port, kernel load-balances accepts
            serr = unix.SetsockoptInt(int(fd), unix.SOL_SOCKET, unix.SO_REUSEPORT, 1)
        }); err != nil {
            return err
        }
        return serr
    },
}
ln, err := lc.Listen(ctx, "tcp", ":8080") // start N of these across goroutines/processes
```

Why this matters: `SO_REUSEPORT` lets you run one listener per CPU (or do zero-downtime restarts: new process binds the same port, old drains) with the **kernel** distributing connections: no userspace accept-mutex contention. Use the `golang.org/x/sys/unix` constants, not raw integers (portability). `SO_REUSEPORT` is Linux/BSD; on Windows the semantics differ (`SO_REUSEADDR` lets a new socket steal the port), gate the syscall by GOOS. `ListenConfig.KeepAliveConfig` [1.23] is applied to every accepted connection, so you don't set keep-alive per-conn.

---

## Half-Close and io.Copy / splice {#half-close}

A TCP connection is two independent byte streams. **`CloseWrite()` sends a FIN on the write side while you keep reading** : the correct way to signal "I'm done sending, drain your reply." A plain `Close()` tears down both directions and can discard in-flight data.

```go
// RIGHT — send request, half-close to signal EOF, then read the full response
conn.Write(request)
conn.(*net.TCPConn).CloseWrite()       // peer sees io.EOF on its Read → it can finish & reply
resp, _ := io.ReadAll(conn)            // read until peer closes its write side
conn.Close()
```

Zero-copy proxying: let the runtime do it. `*net.TCPConn` implements `io.ReaderFrom`/`io.WriterTo`, so `io.Copy` between two TCP conns transparently uses **`splice(2)`** (kernel-to-kernel, no userspace buffer); `*os.File` → `*net.TCPConn` uses **`sendfile(2)`**. Hand-rolling a `make([]byte, 32<<10)` copy loop *defeats* this fast path.

```go
// RIGHT — kernel splice on Linux; half-close each direction as it finishes (clean TCP teardown)
func proxy(a, b *net.TCPConn) error {
    var wg sync.WaitGroup
    wg.Add(2)
    cp := func(dst, src *net.TCPConn) {
        defer wg.Done()
        io.Copy(dst, src) // uses splice(2) — both args are *TCPConn
        dst.CloseWrite()  // propagate EOF instead of yanking the whole conn
    }
    go cp(a, b)
    go cp(b, a)
    wg.Wait()
    return nil
}
```

```go
// WRONG — manual buffer bypasses splice; full Close() races the other direction's data
buf := make([]byte, 32*1024)
io.CopyBuffer(struct{ io.Writer }{dst}, src, buf) // wrapping in a plain io.Writer hides ReaderFrom!
```

Wrapping a `*TCPConn` in a struct that exposes only `io.Writer`/`io.Reader` (a common middleware mistake) **hides** the `ReaderFrom`/`WriterTo` methods and silently disables splice/sendfile. Pass the concrete `*net.TCPConn` to `io.Copy` when you want the fast path.

---

## UDP Server and Client {#udp}

UDP is connectionless: no accept loop, no per-connection goroutines. One (or a few) goroutines read every datagram. Prefer the `netip` API: `ReadFromUDPAddrPort`/`WriteToUDPAddrPort` [1.18] avoid a `*net.UDPAddr` allocation per packet.

```go
pc, err := net.ListenUDP("udp", &net.UDPAddr{Port: 9000})
if err != nil { return err }
defer pc.Close()
context.AfterFunc(ctx, func() { pc.Close() }) // [1.21]

buf := make([]byte, 1500) // one MTU; reuse the buffer — UDP reads are whole datagrams
for {
    pc.SetReadDeadline(time.Now().Add(5 * time.Second))
    n, addr, err := pc.ReadFromUDPAddrPort(buf) // [1.18] addr is netip.AddrPort (no alloc)
    if err != nil {
        if errors.Is(err, net.ErrClosed) { return nil }
        var ne net.Error
        if errors.As(err, &ne) && ne.Timeout() { continue }
        return err
    }
    pc.WriteToUDPAddrPort(buf[:n], addr)
}
```

Caveats: no delivery/ordering guarantees. Keep payloads ≤ ~1400 bytes (path MTU minus headers) to avoid IP fragmentation. A single `Read` returns exactly one datagram: a too-small buffer **silently truncates** it (the rest is discarded), so size the buffer to your max datagram. For per-peer "connections," `net.DialUDP` (or `Dialer` with `"udp"`) gives a `*UDPConn` bound to one remote, which also surfaces ICMP port-unreachable as an error on the next op.

### HTTP/3 and QUIC

For reliability/ordering/multiplexing over UDP, use **`quic-go`** (`github.com/quic-go/quic-go`), the mature Go QUIC stack, with HTTP/3 via its `http3` subpackage. Reach for it when you need 0-RTT resumption, stream multiplexing without head-of-line blocking, or connection migration (mobile clients changing networks). For most APIs, HTTP/2 over TLS remains the practical default. QUIC TLS state lives in `crypto/tls`'s `QUICConn` [1.21+], see [security.md](security.md#tls).

---

## Unix Domain Sockets {#unix-sockets}

Faster than TCP loopback for same-host IPC (no TCP/IP stack, no port). `"unix"` = stream (like TCP), `"unixgram"` = datagram, `"unixpacket"` = seqpacket. The accept loop is identical to TCP.

```go
const sock = "/run/myapp.sock"
_ = os.Remove(sock)                       // a stale socket file blocks bind with EADDRINUSE
lc := net.ListenConfig{}
ln, err := lc.Listen(ctx, "unix", sock)   // ListenConfig also unlinks on Close for "unix"
if err != nil { return fmt.Errorf("listen unix: %w", err) }
defer ln.Close()
if err := os.Chmod(sock, 0o660); err != nil { return err } // restrict; the FS is your ACL
// Client: net.Dial("unix", sock) — or carry creds/FDs over it (see below).
```

Beyond TCP: Unix sockets can pass OS **credentials** (`SO_PEERCRED` via `syscall`, for authn) and **file descriptors** between processes (`unix.ParseSocketControlMessage` / `UnixRights` over `(*net.UnixConn).WriteMsgUnix`), the basis of systemd socket activation and privilege separation. Permissions on the socket *file* gate access; an abstract socket (Linux, leading `@`/NUL in the name) has no filesystem entry. `(*net.UnixConn).CloseWrite()` half-closes just like TCP.

---

## TLS over raw TCP / mTLS {#tls}

Full TLS config (versions, cipher suites, cert loading, `autocert`) lives in [security.md](security.md#tls). The net-layer points:

```go
// Wrap any net.Listener — tlsLn.Accept() returns a *tls.Conn
ln, _ := lc.Listen(ctx, "tcp", ":9443")
tlsLn := tls.NewListener(ln, tlsConfig)

// Client side: tls.Dialer respects context (prefer it over tls.Dial, which can't be cancelled)
td := &tls.Dialer{NetDialer: &net.Dialer{Timeout: 5 * time.Second}, Config: tlsConfig}
conn, err := td.DialContext(ctx, "tcp", "example.com:9443") // [1.15+]
```

For mTLS set `ClientAuth: tls.RequireAndVerifyClientCert` with a `ClientCAs` pool (server) and present `Certificates` + a `RootCAs` pool (client). Public-key pinning goes through `VerifyPeerCertificate` (compare `sha256.Sum256(cert.RawSubjectPublicKeyInfo)`), which survives cert rotation. **Deadline note:** a `*tls.Conn`'s `SetDeadline` covers the *handshake* too: a slow handshake without a deadline hangs exactly like a raw read. Details and config: [security.md](security.md#tls).

---

## DNS: Custom Resolvers {#dns}

```go
r := &net.Resolver{
    PreferGo: true, // pure-Go resolver: no cgo, deterministic, cross-compile-safe
    Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
        d := net.Dialer{Timeout: 2 * time.Second}
        return d.DialContext(ctx, network, "1.1.1.1:53") // force a specific DNS server
    },
}
addrs, err := r.LookupNetIP(ctx, "ip", "example.com") // [1.18] → []netip.Addr (no alloc churn)
```

Points models miss: `PreferGo: true` selects the pure-Go resolver; required for static binaries and reproducible behavior (the cgo resolver calls libc/`nsswitch`). All `Lookup*` take a `context.Context`; since [1.23] a `DNSError` **wraps** `context.DeadlineExceeded`/`Canceled`, so `errors.Is(err, context.DeadlineExceeded)` reports a resolver timeout. `DNSError.IsTemporary`/`IsTimeout`/`IsNotFound` classify failures. The stdlib does **no caching** ; front high-QPS lookups with a caching resolver (systemd-resolved, CoreDNS, dnsmasq) or an in-process TTL cache. For SRV/MX/TXT use the typed `LookupSRV`/`LookupMX`/`LookupTXT`; for DNSSEC, zone transfers, or arbitrary record types, use `github.com/miekg/dns`.

---

## Custom Binary Protocol (Framing) {#custom-protocol}

TCP is a byte stream with **no message boundaries** ; you must frame. Length-prefix is the standard; `bufio` + `Scanner` handles line/delimiter framing.

```go
// 4-byte big-endian length prefix. Always io.ReadFull — a single Read may return short.
func writeMessage(w io.Writer, data []byte) error {
    var hdr [4]byte
    binary.BigEndian.PutUint32(hdr[:], uint32(len(data)))
    if _, err := w.Write(hdr[:]); err != nil { return err } // Write returns short only on error
    _, err := w.Write(data)
    return err
}

func readMessage(r io.Reader, maxSize uint32) ([]byte, error) {
    var hdr [4]byte
    if _, err := io.ReadFull(r, hdr[:]); err != nil { return nil, err } // EOF/partial handled
    size := binary.BigEndian.Uint32(hdr[:])
    if size > maxSize { return nil, fmt.Errorf("frame too large: %d > %d", size, maxSize) } // guard OOM
    msg := make([]byte, size)
    _, err := io.ReadFull(r, msg)
    return msg, err
}
```

Keys: `io.ReadFull` (or `io.ReadAtLeast`), never a bare `conn.Read`, which is permitted to return fewer bytes than requested. **Always bound `size`** before allocating: an unchecked length prefix is a trivial OOM DoS. Wrap the conn in a `bufio.Reader` if you read many small headers (one syscall amortized over many frames). For length-delimited protobuf, `google.golang.org/protobuf` + a varint prefix; see [encoding-and-serialization.md](encoding-and-serialization.md#binary).

---

## High-Performance Networking (gnet) {#high-perf}

Stdlib `net` is goroutine-per-connection. At 100K+ idle connections, per-goroutine stacks and scheduler overhead start to matter. **`gnet`** (`github.com/panjf2000/gnet/v2`) is an epoll/kqueue event-loop with callbacks (`OnTraffic`, `OnOpen`, `OnClose`) and a fixed goroutine pool.

| Criteria | stdlib `net` | `gnet` |
|----------|-------------|--------|
| Concurrency | <~10K conns comfortably | 100K+ conns |
| Model | 1 goroutine/conn (blocking, linear code) | event loop (callbacks, fixed goroutines) |
| Protocols | anything (HTTP, gRPC, custom) | custom byte protocols |
| Cost | simple, idiomatic, debuggable | callback inversion, manual buffering |

Rule: start with stdlib; it scales to tens of thousands of connections and the code is linear and debuggable. Move to `gnet` only when a profile proves goroutine scheduling (not your handler) is the bottleneck. Most "too slow" servers are fixed by buffer reuse, `SetNoDelay`, and avoiding per-request allocations, not by abandoning the stdlib model.

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| stdlib `net` / `net/netip` | **Default** | Almost always; `netip` for any IP storage/compare |
| `golang.org/x/sys/unix` | **Default** for sockopts | `SO_REUSEPORT`, FD passing, raw `setsockopt` constants |
| `golang.org/x/net` | Maintained, official | `netutil.LimitListener`, `ipv4`/`ipv6` (TTL, multicast), `proxy`, `webdav` |
| `github.com/quic-go/quic-go` | Active, standard | QUIC / HTTP/3 (the only mature Go impl) |
| `github.com/miekg/dns` | Active, standard | Custom records, DNSSEC, zone transfers, a DNS server |
| `github.com/panjf2000/gnet/v2` | Active | Event-loop server at 100K+ conns (custom protocol) |
| `github.com/libp2p/go-libp2p` | Active | P2P transport, NAT traversal, multiplexed streams |
| `github.com/google/gopacket` | Maintained | Packet capture/decoding (libpcap), raw-packet crafting |

For kernel-level packet filtering (XDP/eBPF) see [ebpf.md](ebpf.md).

---

## Version map 1.18→1.27 {#versions}

| Ver | Networking-relevant |
|---|---|
| **1.18** | `net/netip` (`Addr`/`AddrPort`/`Prefix`); `Resolver.LookupNetIP`; `*UDPConn.ReadFromUDPAddrPort`/`WriteToUDPAddrPort`; `TCPAddrFromAddrPort`/`(*TCPAddr).AddrPort` |
| **1.20** | `Dialer.ControlContext` / `ListenConfig` control with context; `netip` link-local sentinels |
| **1.21** | `context.AfterFunc` (wire ctx → conn/listener close); `crypto/tls` `QUICConn` |
| **1.22** | `netip.AddrPort.Compare`; `math/rand/v2` (jittered backoff for reconnect loops) |
| **1.23** | **`net.KeepAliveConfig`** + `TCPConn.SetKeepAliveConfig`, `Dialer`/`ListenConfig` fields; `DNSError` wraps `context` errors (`errors.Is` works); `netip` IPv4-vs-IPv4-mapped `DeepEqual` bug fixed; timer/ticker GC + synchronous channels (reconnect-loop timer-leak advice now stale) |
| **1.24** | `testing/synctest` (experiment), deterministic time for deadline/reconnect tests; `netip` `Append*` marshalers |
| **1.25** | `sync.WaitGroup.Go` (handy for accept/drain fan-out; `f` must not panic) |
| **1.26** | `netip.Prefix.Compare`; `errors.AsType[E]` (cleaner `net.Error` extraction); `go fix` modernizers |
| **1.27 (RC)** | Generic methods; `asynctimerchan` GODEBUG removed (timer channels always synchronous). Treat as draft until GA (~Aug 2026). |

---

## Anti-Patterns / What models get wrong {#anti-patterns}

| Anti-pattern | What goes wrong | Fix |
|---|---|---|
| No deadline on `net.Conn` | Blocks forever if peer vanishes → goroutine + socket leak | `SetReadDeadline`/`SetWriteDeadline` before **every** blocking op (re-arm; they're absolute) |
| `net.IP` for storage/compare | Non-comparable, mutable aliasing, alloc per parse | `netip.Addr`: value, comparable, immutable, zero-alloc |
| `string` for IP addresses | IPv6 brackets, IPv4-mapped, broken `==` | `netip.Addr`/`AddrPort`; `Prefix.Contains` for CIDR |
| `net.Dial` / `tls.Dial` (no ctx) | Uncancellable, can hang on DNS | `Dialer.DialContext` / `tls.Dialer.DialContext` with `Timeout` |
| Bare `Dialer.KeepAlive` as a read timeout | Detects dead peer in minutes, not your idle SLA | `KeepAliveConfig` [1.23] for liveness **plus** read deadlines for SLA |
| `conn.Read` for fixed frames | Short reads → truncated messages | `io.ReadFull` / `io.ReadAtLeast`; `bufio.Scanner` for lines |
| Unbounded length prefix | `make([]byte, hugeN)` → OOM DoS | Validate `size <= max` before allocating |
| Manual copy loop for proxy | Defeats `splice`/`sendfile` zero-copy | `io.Copy` between concrete `*net.TCPConn` |
| Wrapping conn as plain `io.Writer` | Hides `ReaderFrom`/`WriterTo` → no splice | Pass the concrete `*TCPConn` to `io.Copy` |
| `Close()` when you mean half-close | Drops in-flight reply bytes | `CloseWrite()` (FIN one direction, keep reading) |
| String-matching `"use of closed..."` | Brittle; broke across versions | `errors.Is(err, net.ErrClosed)` |
| String-matching `"timeout"` | Misclassifies; misses wrapped errors | `var ne net.Error; errors.As(err,&ne) && ne.Timeout()` |
| Treating an accept error as fatal | Transient `EMFILE`/`ECONNABORTED` kills the server | Continue + brief backoff; only `net.ErrClosed` means stop |
| Goroutine per UDP datagram | Spawn cost dominates; no per-conn state | Process in the read loop or a fixed worker pool |
| Too-small UDP read buffer | Datagram silently truncated | Size buffer to max datagram (one MTU) |
| Unbounded accept loop | SYN/conn flood exhausts FDs | `golang.org/x/net/netutil.LimitListener` |
| Hardcoded port in tests/CI | Port conflicts, flaky tests | Listen `:0`, read back `ln.Addr()` |
| Raw `setsockopt` ints | Non-portable, magic numbers | `golang.org/x/sys/unix` constants via `RawConn.Control` |
| Reaching for `gnet` first | Premature complexity; callbacks everywhere | stdlib until a profile proves scheduler is the bottleneck |

---

## See Also {#see-also}

- [http-and-apis.md](http-and-apis.md), HTTP server/client, `Transport` pooling, WebSockets, SSE
- [security.md](security.md#tls), TLS 1.3 config, cipher suites, mTLS, cert loading, autocert
- [encoding-and-serialization.md](encoding-and-serialization.md#binary), byte order, varint, length-delimited protobuf
- [concurrency.md](concurrency.md), goroutine lifecycle, `WaitGroup.Go`, worker pools for connection handling
- [errors-and-resilience.md](errors-and-resilience.md#retry), reconnect backoff+jitter, circuit breakers, deadlines
- [ebpf.md](ebpf.md), kernel-level packet filtering with XDP

---

## Sources {#sources}

- [pkg.go.dev/net](https://pkg.go.dev/net) (go1.26.3), `Dialer`, `ListenConfig`, `KeepAliveConfig`, `TCPConn`, `ErrClosed`, `Resolver`
- [pkg.go.dev/net/netip](https://pkg.go.dev/net/netip) (go1.26.3), `Addr`/`AddrPort`/`Prefix` semantics, comparability, IPv4-mapped behavior
- [go.dev/doc/go1.23](https://go.dev/doc/go1.23), `KeepAliveConfig`, `DNSError` wrapping `context`, timer GC, netip `DeepEqual` fix
- go1.26.3 source `src/net/tcpsock.go`: `KeepAliveConfig{Enable,Idle,Interval,Count}` defaults; `CloseWrite`; `ReadFrom`/`io.ReaderFrom`
- [quic-go](https://github.com/quic-go/quic-go), [miekg/dns](https://github.com/miekg/dns), [panjf2000/gnet](https://github.com/panjf2000/gnet)
