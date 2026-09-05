# eBPF and Go

eBPF runs sandboxed programs inside the Linux kernel (tracing, networking, security) with no kernel module. From Go the path is **`github.com/cilium/ebpf`**: a *pure-Go* loader (no libbpf, no cgo) that compiles C→BPF at build time via **`bpf2go`**, embeds the bytecode with `//go:embed`, and links/attaches at runtime. The kernel **verifier** gates what the C side may do; the Go-side lifecycle (keep every `link.Link` alive, `Close()` it, feature-probe instead of guessing kernel version) is where models go wrong.

> Verified against Go **1.26.4** (stable) + **1.27 RC**, and **cilium/ebpf v0.22.0** (pkg.go.dev, 2026-06-27). The library is pre-1.0: every minor can break: pin it. Version tags `[vX.Y]` mark the ebpf-go release a claim applies to; `[k5.N]` marks a kernel minimum. Deepened from research + primary-source corroboration.

## TL;DR: the modern deltas (read first)

- Latest is `v0.22.0` (published 2026-06-26), succeeding the v0.21.0 feature release. Requires **Go 1.24+**, **LLVM 14+** (LLVM 11 dropped in v0.19). pkg.go.dev breadcrumbs were briefly inconsistent across subpackages during the v0.21→v0.22 transition; confirm the exact tag at upgrade time and re-read release notes (pre-1.0 = breaking minors).
- Global variables use the Variable API, not `RewriteConstants`. `spec.Variables["x"].Set(v)` before load / `obj.X.Get(&out)` / `obj.X.Set(v)` after [v0.17]. **`CollectionSpec.RewriteConstants` and `RewriteMaps` were REMOVED in v0.21** ; code that calls them no longer compiles. This is the single biggest staleness vector in model output.
- Losing the reference to a `link.Link` detaches the program. The GC closing the link unloads it from the kernel, silently. Retain the `Link` *and* `defer l.Close()`. The "fire and forget `link.Kprobe(...)`" snippet is a correctness bug.
- `ringbuf` over `perf` [k5.8], **fentry/fexit over kprobe** where BTF exists [k5.5], **`link.AttachTCX` over legacy netlink tc** [k6.6]. Models reflexively reach for the older mechanism in each pair.
- cilium/ebpf is pure Go: build `CGO_ENABLED=0`. clang/LLVM is needed only at `bpf2go` codegen time, never at runtime. The "you need cgo for eBPF" assumption is wrong.
- `rlimit.RemoveMemlock()` is a no-op on [k5.11]+ (memcg accounting replaced `RLIMIT_MEMLOCK`). Still call it once for portability; never hand-roll `unix.Setrlimit`.
- Loading needs `CAP_BPF` [k5.8] (not blanket root) plus attach-specific caps; `LogSize` is gone and `errors.As` a `*ebpf.VerifierError` then print with `%+v`.

## Table of Contents
1. [What eBPF is, and when not to reach for it](#what-is-ebpf)
2. [cilium/ebpf library map](#cilium-ebpf)
3. [bpf2go code generation](#bpf2go)
4. [The BPF C side (brief)](#bpf-c)
5. [Loading: CollectionSpec → objects](#loading)
6. [Global variables: the Variable API](#variables)
7. [Attaching to kernel hooks](#attaching)
8. [Maps, ring buffer vs perf](#maps)
9. [The verifier and how it shapes Go-side code](#verifier)
10. [Pinning and persistence](#pinning)
11. [Build, permissions & runtime traps](#build-perms)
12. [Library landscape & status](#libraries)
13. [Version & maturity map](#versions)
14. [What models get wrong](#stale)

---

## What eBPF is, and when not to reach for it {#what-is-ebpf}

Sandboxed programs attached to kernel hooks (syscall entry/exit, network paths, function entry, LSM hooks) running in-kernel and talking to userspace through **maps**. The **verifier** statically proves safety (bounded loops, no out-of-bounds, finite stack) before the program runs. Go's role is the **userspace loader**: parse the ELF, create maps, load programs, attach links, read events.

Reach for eBPF only for kernel-level visibility or enforcement: system-wide syscall auditing, packet processing below the stack (XDP), low-overhead continuous profiling, LSM policy. When Go's own tooling suffices, use it: `runtime/pprof` profiles your process, OpenTelemetry instruments your app, `net` handles ordinary networking. eBPF buys cross-process, zero-instrumentation, kernel-resident observation; it costs Linux-only deployment, kernel-version sensitivity, and elevated capabilities.

---

## cilium/ebpf library map {#cilium-ebpf}

Import: `github.com/cilium/ebpf` · **Docs:** [ebpf-go.dev](https://ebpf-go.dev/) · pure Go, no cgo, no libbpf.

| Package | Purpose |
|---|---|
| `ebpf` | Core: `CollectionSpec`, `Collection`, `Program`, `Map`, `Variable`, `VerifierError` |
| `ebpf/link` | Attach to hooks (kprobe, uprobe, tracepoint, XDP, TCX, tracing, cgroup, LSM…) |
| `ebpf/ringbuf` | Read `BPF_MAP_TYPE_RINGBUF` [k5.8] |
| `ebpf/perf` | Read `PERF_EVENT_ARRAY` (legacy / per-CPU) |
| `ebpf/rlimit` | Lift `RLIMIT_MEMLOCK` on pre-[k5.11] kernels (no-op after) |
| `ebpf/features` | Runtime capability probes (`HaveProgramType`, `HaveMapType`, …) |
| `ebpf/btf` | BPF Type Format, CO-RE relocations, `LoadKernelSpec` |
| `ebpf/pin` | Root-level pinning helpers [v0.17] |
| `cmd/bpf2go` | C→Go codegen (a `tool` dependency) |

`features.HaveProgramType` **replaced** the removed top-level `HaveProgType` [v0.21]. Platform: Linux (amd64/arm64 primarily); initial Windows runtime support landed [v0.18] but is immature.

---

## bpf2go code generation {#bpf2go}

`bpf2go` compiles C to eBPF bytecode and generates Go scaffolding that embeds the `.o` ; yielding a **single self-contained binary**. The modern invocation uses Go's tool-dependency model.

```go
// gen.go — a tiny Go file holding the directive
package main

//go:generate go tool bpf2go -tags linux counter counter.c -- -I../headers   // [Go 1.24+]
```

```bash
go get -tool github.com/cilium/ebpf/cmd/bpf2go   # adds a `tool` directive to go.mod, pinning the version
go generate ./...
```

Generated identifiers (stem `counter`): `loadCounter()`, `loadCounterObjects(*counterObjects, *ebpf.CollectionOptions)`, and the struct trio populated by `ebpf:"name"` tags, plus a Go struct for **every** C map key/value type (auto-generated since recent versions):

```go
type counterObjects struct {
    counterPrograms
    counterMaps
}
type counterPrograms struct {
    CountPackets *ebpf.Program `ebpf:"count_packets"`
}
type counterMaps struct {
    PktCount *ebpf.Map `ebpf:"pkt_count"`
}
```

Outputs: `counter_bpfel.go`+`counter_bpfel.o` (little-endian) and `counter_bpfeb.go`+`counter_bpfeb.o` (big-endian), each carrying endianness build tags; the `.o` is embedded via `//go:embed`. `-target amd64` produces a single arch-specific file instead of the el/eb pair.

```go
// WRONG — pre-1.24 form; -cc/-cflags are superseded by BPF2GO_CC / BPF2GO_CFLAGS env vars,
// and -type is usually unnecessary now (types are generated for all map keys/values by default).
//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -cc $BPF_CLANG -cflags $BPF_CFLAGS -type event bpf foo.c

// RIGHT — tool dependency + env for flags:
//go:generate go tool bpf2go -tags linux foo foo.c -- -I../headers
//   BPF2GO_CFLAGS="-O2 -g -Wall -Werror" go generate ./...
```

The `go run github.com/...` form still works but is legacy. **Key flags:** `-type Name` (export a C type that isn't a map key/value, repeatable), `-no-global-types`, `-target`, `-output-dir`, `-go-package`, `-output-stem`, `-tags`, `-makebase`. **Build-time prereqs:** clang (LLVM 14+), `llvm-strip`, libbpf headers, kernel headers; *codegen only*, never at runtime.

---

## The BPF C side (brief) {#bpf-c}

This is a Go reference; the C side is what the kernel runs. Note the Go-relevant pieces: the `SEC()` annotation picks the program type, maps are declared with BTF-style structs in `.maps`, and `//go:build ignore` keeps the C file out of `go build`.

```c
//go:build ignore

#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

char __license[] SEC("license") = "Dual MIT/GPL";   // GPL-only helpers need a GPL-compatible license

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __type(key, __u32);
    __type(value, __u64);
    __uint(max_entries, 1);
} pkt_count SEC(".maps");

SEC("xdp")
int count_packets(struct xdp_md *ctx) {
    __u32 key = 0;
    __u64 *count = bpf_map_lookup_elem(&pkt_count, &key);
    if (count)                       // the verifier REQUIRES this nil check
        __sync_fetch_and_add(count, 1);
    return XDP_PASS;
}
```

SEC → program type: `xdp`, `kprobe/func`, `kretprobe/func`, `tracepoint/group/name`, `fentry/func` & `fexit/func` (BTF trampoline), `tp_btf/...`, `lsm/hook`, `socket`, `cgroup_skb/...`, `struct_ops/...`. **Map types:** `HASH`, `ARRAY`, `RINGBUF` [k5.8], `PERF_EVENT_ARRAY`, `LRU_HASH`, `PERCPU_HASH`/`PERCPU_ARRAY` (lock-free per-CPU counters), `LPM_TRIE`, `ARRAY_OF_MAPS`/`HASH_OF_MAPS`.

CO-RE (Compile Once, Run Everywhere) makes one binary portable across kernels via BTF. Generate `vmlinux.h` once, read fields through relocatable accessors:

```c
#include "vmlinux.h"          // bpftool btf dump file /sys/kernel/btf/vmlinux format c > vmlinux.h
#include <bpf/bpf_core_read.h>
__u16 family = BPF_CORE_READ(sk, __sk_common.skc_family);   // offset relocated at load time
```

cilium/ebpf performs CO-RE relocations **in pure Go at load time** ; reading the ELF's `.BTF` section (from `clang -g`), loading kernel BTF from `/sys/kernel/btf/vmlinux`, and rewriting offsets/type IDs. On kernels without BTF, supply external BTF (e.g. BTFHub) via `CollectionOptions.Programs.KernelTypes`, or CO-RE programs fail to load.

---

## Loading: CollectionSpec → objects {#loading}

Two-stage model: **`CollectionSpec`** is the parsed, not-yet-loaded ELF (`Maps`, `Programs`, `Variables`, `Types`); **`Collection`** is live kernel objects. bpf2go's `loadXxxObjects` wraps `CollectionSpec.LoadAndAssign`, which fills your struct by `ebpf:"name"` tag and transfers `Close()` ownership to it.

```go
import (
    "github.com/cilium/ebpf/link"
    "github.com/cilium/ebpf/rlimit"
)

func run() error {
    if err := rlimit.RemoveMemlock(); err != nil {   // no-op on k5.11+, still call for portability
        return fmt.Errorf("remove memlock: %w", err)
    }

    var objs counterObjects
    if err := loadCounterObjects(&objs, nil); err != nil {
        var ve *ebpf.VerifierError
        if errors.As(err, &ve) {
            return fmt.Errorf("verifier rejected program:\n%+v", ve) // %+v = full log; %v truncates
        }
        return fmt.Errorf("load objects: %w", err)
    }
    defer objs.Close()                                 // closes every program & map in the struct

    l, err := link.Tracepoint("syscalls", "sys_enter_openat", objs.CountPackets, nil)
    if err != nil {
        return fmt.Errorf("attach: %w", err)
    }
    defer l.Close()                                    // and KEEP l alive — see #attaching
    // ... read maps / events ...
    return nil
}
```

`LoadCollectionSpec(path)` reads an ELF from disk; bpf2go's `loadXxx()` reads the embedded bytes (preferred: no deploy-time file). Use `NewCollection`/`NewCollectionWithOptions` for dynamic map renaming or `MapReplacements` (which **replaced** the removed `RewriteMaps`).

---

## Global variables: the Variable API {#variables}

The canonical way to read/write `.rodata` / `.bss` / `.data` globals [v0.17]. Set **before** load (host endianness, rewrites initial map contents) or get/set **after** load (live map; [k5.5] for direct access). bpf2go exposes each global on the objects struct.

```go
// BEFORE load — configure a const the verifier can fold:
spec, err := loadCounterSpec()
if err != nil { return err }
if err := spec.Variables["target_port"].Set(uint16(443)); err != nil { return err }

var objs counterObjects
if err := spec.LoadAndAssign(&objs, nil); err != nil { return err }
defer objs.Close()

// AFTER load — read/update a live global:
var dropped uint64
if err := objs.DroppedCount.Get(&dropped); err != nil { return err }
_ = objs.Enabled.Set(uint32(1))
```

```go
// WRONG — removed in v0.21; does not compile:
spec.RewriteConstants(map[string]any{"target_port": uint16(443)})

// WRONG — the pre-0.17 hack: looking up the ".rodata" map and Update'ing index 0.
```

`Variable` methods (verified v0.22): `Get(out any) error`, `Set(in any) error`, `Size() uint32`, `ReadOnly() bool`, `Type() *btf.Var`. The generic `ebpf.VariablePointer[T comparable](*Variable) (*T, error)` [v0.19] returns a Go pointer into the mmap-shared map memory, but is gated behind `-tags ebpf_unsafe_memory_experiment` and requires `T` to embed `structs.HostLayout` with only fixed-size fields; experimental.

---

## Attaching to kernel hooks {#attaching}

Everything goes through `github.com/cilium/ebpf/link`. **Every `Link` must be retained AND `Close()`d.** Verbatim from the godoc: *"Losing the reference to the resulting Link (kp) will close the Kprobe and prevent further execution of prog. The Link must be Closed during program shutdown."* The GC finalizing a dropped `Link` detaches the program from the kernel.

```go
// RIGHT — retain + defer Close:
l, err := link.Kprobe("sys_execve", objs.KprobeExecve, nil)
if err != nil { return err }
defer l.Close()

// WRONG — return value discarded; the program detaches when the Link is GC'd:
link.Kprobe("sys_execve", objs.KprobeExecve, nil)
```

kprobe / kretprobe: dynamic hook on kernel function entry/return. `link.Kprobe` auto-retries with the platform syscall prefix (e.g. `__x64_`) for portability. Caveat: probing *internal* functions breaks across kernel versions.

tracepoint: static, stable kernel ABI; preferred over kprobe for production stability.
```go
tp, err := link.Tracepoint("syscalls", "sys_enter_openat", objs.TraceOpenat, nil)
```

fentry / fexit (BTF tracing) [k5.5], prefer over kprobe when BTF is available: a BPF trampoline (no trap/exception), and **fexit** sees both args and return value. C side: `SEC("fentry/tcp_connect")` / `SEC("fexit/...")` with `BPF_PROG`/`BPF_PROG2`.
```go
l, err := link.AttachTracing(link.TracingOptions{Program: objs.FentryTcpConnect})
```

kprobe.multi / uprobe.multi [k5.18], attach one program to many symbols in a single syscall (fprobe-based), *"significantly faster than attaching many probes one at a time."*
```go
l, err := link.KprobeMulti(objs.Prog, link.KprobeMultiOptions{Symbols: []string{"vfs_read", "vfs_write"}})
```
`KprobeMultiOptions` takes `Symbols` *or* `Addresses` (mutually exclusive), per-symbol `Cookies`, and `Session: true` (entry+return in one program) [verify exact field on your tag].

XDP: packet processing at the driver, before the network stack.
```go
iface, _ := net.InterfaceByName("eth0")
l, err := link.AttachXDP(link.XDPOptions{Program: objs.XdpProg, Interface: iface.Index})
```
Actions: `XDP_PASS`, `XDP_DROP`, `XDP_TX` (bounce), `XDP_REDIRECT`, `XDP_ABORTED`. **Breaking [v0.21]:** XDP `ProgramSpec.AttachType` is now `AttachXDP` (was `AttachNone`), prompted by Linux 6.18 disallowing mixed attach types in one PROG_ARRAY; when sharing a pinned PROG_ARRAY with libbpf or updating an older XDP link, reset to `AttachNone` before load or you get `EINVAL`.

TCX (modern tc) [k6.6], link-based, ordered, race-free; no qdisc setup.
```go
l, err := link.AttachTCX(link.TCXOptions{
    Interface: iface.Index,
    Program:   objs.Ingress,
    Attach:    ebpf.AttachTCXIngress,   // or AttachTCXEgress
})
```
`TCXOptions` also supports `Anchor` (before/after another program), `ExpectedRevision`, `Flags`. Legacy clsact/netlink tc is **not** in cilium/ebpf (needs an external netlink library), only drop to it for kernels < 6.6.

uprobe / uretprobe: hook userspace functions; two context switches per call, so cold paths only.
```go
ex, err := link.OpenExecutable("/usr/local/bin/myservice")
up, err := ex.Uprobe("main.handleRequest", objs.UprobeHandler, nil)
```

Other attach points: `AttachCgroup`, `AttachLSM` [k5.7 BTF], `AttachNetfilter`, `AttachNetkit`, `AttachFreplace`, `AttachStructOps` [v0.21]. The newer mechanisms (`KprobeMulti`, `AttachXDP`, `AttachTCX`, `AttachTracing`) use the **`bpf_link`** API [k5.7], more robust (kernel auto-detaches on close, pinnable); classic `Kprobe`/`Tracepoint` attach via perf event. Link methods: `Close()`, `Pin(path)`/`Unpin()`, `Update(prog)`, `Info()`; some return `ErrNotSupported` on older kernels.

---

## Maps, ring buffer vs perf {#maps}

CRUD on `*ebpf.Map`: `Lookup`, `LookupAndDelete`, `Update(k, v, flags)`, `Delete`, `NextKey`, `Iterate()`. `Put` = `Update(..., UpdateAny)`. Flags: `UpdateAny`, `UpdateNoExist`, `UpdateExist`.

```go
var value uint64
err := objs.PktCount.Lookup(uint32(0), &value)
err = objs.PktCount.Update(uint32(0), uint64(42), ebpf.UpdateAny)
err = objs.PktCount.Delete(uint32(0))

iter := objs.PktCount.Iterate()
for iter.Next(&key, &value) { /* ... */ }
if err := iter.Err(); err != nil { return err }
```

Per-CPU maps take/return a *slice* (one entry per CPU); `ebpf.PossibleCPU()` gives the length. **Batch ops** (`BatchLookup`, `BatchUpdate`, `BatchDelete`) [k5.6] take a `*MapBatchCursor` (renamed from `BatchCursor` in v0.13 to fix an unsafe signature).

### Ring buffer: the default for events [k5.8]

Single shared buffer across CPUs, preserves ordering, lower memory. C side: `bpf_ringbuf_reserve`/`bpf_ringbuf_submit`.

```go
rd, err := ringbuf.NewReader(objs.Events)
if err != nil { return err }
defer rd.Close()

go func() { <-ctx.Done(); rd.Close() }()   // Close() unblocks a blocked Read() with ErrClosed

var event bpfEvent                          // bpf2go-generated struct
for {
    rec, err := rd.Read()
    if errors.Is(err, ringbuf.ErrClosed) { return nil }   // graceful shutdown
    if err != nil { log.Printf("read: %s", err); continue }

    if err := binary.Read(bytes.NewReader(rec.RawSample), binary.LittleEndian, &event); err != nil {
        log.Printf("decode: %s", err); continue
    }
    log.Printf("pid=%d comm=%s", event.Pid, event.Comm)
}
```

`Close()` interrupts `Read` with `ringbuf.ErrClosed` (`os.ErrClosed`), the shutdown idiom. `Flush()` returns pending samples then `ringbuf.ErrFlushed`. **`ReadInto(*Record)` reuses the `Record` and its `RawSample` buffer: use it in hot paths to avoid per-event allocations.** Also: `SetDeadline`, `AvailableBytes`, `BufferSize`; `Record` exposes `RawSample` and `Remaining`.

### Perf event array: legacy / per-CPU

```go
rd, err := perf.NewReader(objs.Events, os.Getpagesize()*8)   // per-CPU buffer size
defer rd.Close()
// same Read() loop; perf.Record adds LostSamples and CPU
```

Use perf only for kernels < 5.8, per-CPU semantics, or overwritable "flight recorder" buffers. **Gotcha:** the per-CPU buffer must exceed your largest sample, or `bpf_perf_event_output` drops it.

| Mechanism | Map type | Best for |
|---|---|---|
| Map polling | Array / Hash / PerCPU | Counters, config, aggregates read on a timer |
| **Ring buffer** | RingBuf | Event streams [k5.8], ordered, shared, `ReadInto` zero-alloc |
| Perf buffer | PerfEventArray | Event streams < 5.8, or per-CPU / overwritable |

---

## The verifier and how it shapes Go-side code {#verifier}

The verifier statically proves the C program safe before load, and its constraints leak into how you design **both** sides. Key limits: a **512-byte stack** (large state lives in maps, not on-stack); **bounded loops only** (must provably terminate; historically `#pragma unroll`, [k5.3]+ allows bounded loops, probe `features.HaveBoundedLoops`); an instruction-count ceiling; **mandatory nil-checks** after every `bpf_map_lookup_elem` (the C `if (count)` above is not optional; omit it and the program is rejected).

Rejection surfaces as a **`*ebpf.VerifierError`** from `NewProgram`/`LoadAndAssign`:

```go
var ve *ebpf.VerifierError
if errors.As(err, &ve) {
    fmt.Printf("%+v\n", ve)   // %+v prints the FULL verifier log; %v truncates
}
```

The library **auto-sizes the verifier log** now (`ProgramOptions.LogSize` was removed); set verbosity with `ProgramOptions.LogLevel` (typed constants `ebpf.LogLevelInstruction`/`LogLevelBranch`/`LogLevelStats`), not the old `LogLevel: 1` int:

```go
opts := &ebpf.CollectionOptions{Programs: ebpf.ProgramOptions{LogLevel: ebpf.LogLevelInstruction}}
err := loadCounterObjects(&objs, opts)
```

Go-side consequence: keep per-event payloads small and fixed-size (the C side can't iterate unboundedly or stack large buffers), aggregate **in-kernel** with per-CPU maps, ship only summaries; which also keeps the ring buffer from overflowing.

---

## Pinning and persistence {#pinning}

A `Program`/`Map`/`Link` lives only as long as something references its fd; process exit detaches everything. **Pin to bpffs** (`/sys/fs/bpf`, must be mounted) to persist across restarts or share between processes.

```go
if err := l.Pin("/sys/fs/bpf/my_link"); err != nil { return err }     // survives process exit
// later / another process:
l, err := link.LoadPinnedLink("/sys/fs/bpf/my_link", nil)

m, err := ebpf.LoadPinnedMap("/sys/fs/bpf/my_map", nil)
```

Maps can auto-pin via `MapSpec.Pinning = ebpf.PinByName` + `CollectionOptions.Maps.PinPath`. **Gotcha:** a `PROG_ARRAY` (tail-call map) is erased by the kernel *"when the last userspace or bpffs reference disappears, regardless of the map being in active use"*: keep a live reference or pin it. `m.Pin`/`m.Unpin`/`m.IsPinned` and the `ebpf/pin` package [v0.17] cover the rest.

---

## Build, permissions & runtime traps {#build-perms}

- Pure Go loader → `CGO_ENABLED=0`. clang/LLVM is *codegen-time* only. The final binary embeds the `.o` and is self-contained; cross-compile by setting `GOARCH` (the `_bpfel`/`_bpfeb` files carry endianness tags).
- `//go:build ignore` on the C source keeps it out of `go build`.
- Capabilities, not blanket root: loading needs **`CAP_BPF`** [k5.8]; attach adds **`CAP_PERFMON`** (tracing/perf), **`CAP_NET_ADMIN`** (XDP/tc). Older kernels: `CAP_SYS_ADMIN`. Tests need root or these caps.
- Containers: grant the caps, mount a writable bpffs, expose `/sys/kernel/btf` for CO-RE.
- `rlimit.RemoveMemlock()` once at startup: [k5.11]+ uses memcg accounting (`memory.max`), so it's a no-op there; older kernels get `RLIMIT_MEMLOCK` raised to infinity. Never hand-roll `unix.Setrlimit`. (Importing the package has an `init()` side effect: it creates a probe map.)
- Feature-probe, don't version-sniff: distros backport and disable features, so a version check is unreliable.

```go
if err := features.HaveMapType(ebpf.RingBuf); errors.Is(err, ebpf.ErrNotSupported) {
    // fall back to perf
} else if err != nil {
    return fmt.Errorf("probing ringbuf: %w", err)   // inconclusive — surface it
}
```

`features` semantics: `nil` = available, `errors.Is(err, ebpf.ErrNotSupported)` = unavailable, any other error = inconclusive (don't treat as "unavailable"). Results are cached.

---

## Library landscape & status {#libraries}

| Component | Status [2026] | Notes |
|---|---|---|
| **`cilium/ebpf`** (ebpf-go) | **Default**, `v0.22.0` | Pure Go, no cgo. Pre-1.0 → pin it; minors break. Go 1.24+, LLVM 14+. |
| `cmd/bpf2go` | Ships with library | Use `go tool bpf2go` + a `tool` directive [Go 1.24]. `-cc`/`-cflags` → `BPF2GO_*` env. |
| `aquasecurity/libbpfgo` | Maintained alternative | cgo wrapper of libbpf: use only if you need libbpf semantics/features; loses the static-binary benefit. |
| `iovisor/gobpf` | **Unmaintained** | Avoid in new code. |
| Go | 1.26.4 stable; 1.27 RC (GA ~Aug 2026) | Library min is 1.24; nothing in 1.27 changes eBPF usage materially. |
| LLVM/clang | 14 / 17 / 20 | Codegen only. LLVM 11 dropped [v0.19]. |
| `bpftool` | For `vmlinux.h` + inspection | `bpftool btf dump file /sys/kernel/btf/vmlinux format c`. |

---

## Version & maturity map {#versions}

ebpf-go releases (high-signal deltas) and kernel minimums:

| ebpf-go | Delta |
|---|---|
| **v0.17** | **Variable API** (`VariableSpec`/`Variable`); root `pin` package; BTF decl tags. *"Static globals can no longer be rewritten via `RewriteConstants()`."* Go 1.22 required. |
| **v0.18** | Initial Windows runtime support; names auto-sanitized. Go 1.23. |
| **v0.19** | Lazy BTF decoding; CO-RE against all kernel modules; `VariablePointer[T]`. **LLVM 11 dropped** (→ 14/17/20). Go 1.23. |
| **v0.20** | Arena maps; `StructOpsMap`; `link.Detach()`; `btf.LoadSplitSpec`. Removed `ProgramOptions.KernelModuleTypes` (→ `ExtraRelocationTargets`). Go 1.24. |
| **v0.21** | Struct ops + `AttachStructOps`; weak symbols/ELF linking; BTF dedup. **Removed `RewriteConstants`, `RewriteMaps`, `NewLinkFromFD`, `HaveProgType`.** XDP attach-type change (`AttachXDP`). |
| **v0.22** | **Current** (2026-06-26). Confirm the changelog on adoption; pre-1.0 = breaking minors. |

| Kernel | Enables |
|---|---|
| **5.5** | fentry/fexit/BTF tracing; direct Variable map access |
| **5.6** | Map batch ops |
| **5.7** | `bpf_link` API (TCX/tracing/multi backbone); LSM |
| **5.8** | `CAP_BPF` split; **ring buffer** (`BPF_MAP_TYPE_RINGBUF`) |
| **5.11** | memcg accounting → `RemoveMemlock` becomes a no-op |
| **5.18** | kprobe.multi / uprobe.multi |
| **6.6** | **TCX** (`AttachTCX`) |
| **6.12** | sched_ext (struct ops example) |
| **6.18** | Disallows mixed attach types in one PROG_ARRAY (drove the v0.21 XDP change) |

Quick decision rules: ringbuf unless < 5.8 or per-CPU needed · fentry/fexit on 5.5+ with BTF, else kprobe · kprobe.multi on 5.18+ for many symbols · TCX on 6.6+, else netlink tc · supply external BTF (`KernelTypes`) when `/sys/kernel/btf/vmlinux` is missing.

---

## What models get wrong {#stale}

1. `CollectionSpec.RewriteConstants()` / `RewriteMaps()`: **removed [v0.21]**, won't compile. Use the **Variable API** (`spec.Variables["x"].Set` / `obj.X.Get/Set`) and `CollectionOptions.MapReplacements`.
2. Manual `.rodata`/`.bss` map lookup to read globals: the pre-0.17 hack; use the Variable API.
3. Discarding the `link.Link` (fire-and-forget `link.Kprobe(...)`), the GC closing it **detaches the program**. Retain it *and* `defer l.Close()`.
4. Hand-rolled `unix.Setrlimit(RLIMIT_MEMLOCK, RLIM_INFINITY)`: unnecessary on [k5.11]+; call `rlimit.RemoveMemlock()` (no-op there, correct on older kernels).
5. `perf` by default: use **`ringbuf`** [k5.8] unless you need < 5.8 or per-CPU.
6. kprobe where fentry/fexit fits: on [k5.5]+ with BTF, `link.AttachTracing` is faster (trampoline, no trap) and fexit gets args+return.
7. Legacy netlink/clsact tc: use `link.AttachTCX` [k6.6]; cilium/ebpf doesn't ship netlink tc.
8. `ProgramOptions.LogSize` / `LogLevel: 1` (int): `LogSize` removed (log auto-sized); `LogLevel` takes typed constants; print `*ebpf.VerifierError` with `%+v` (not `%v`).
9. Stale `bpf2go`: `go run github.com/...` + `-cc`/`-cflags` + needless `-type`. Modern: `go tool bpf2go` with a `tool` directive [Go 1.24], `BPF2GO_*` env, types auto-generated.
10. `HaveProgType` / `NewLinkFromFD`: removed [v0.21]; use `features.HaveProgramType` / `link.NewFromFD`.
11. Assuming kernel version ⇒ feature: distros backport/disable; use the `features` probes (and treat non-`ErrNotSupported` errors as inconclusive, not "unavailable").
12. `PROG_ARRAY` lifetime: the kernel erases it when the last reference drops; keep a live ref or pin to bpffs. Same for persisting programs/maps/links across restarts.
13. XDP attach type [v0.21]: XDP now loads with `AttachXDP`; mixing with `AttachNone` in a shared pinned PROG_ARRAY on Linux 6.18+ gives `EINVAL`.
14. Assuming cgo is needed: cilium/ebpf is pure Go; build `CGO_ENABLED=0`. clang is build-time only.
15. Blanket `root`: loading needs `CAP_BPF` [k5.8] plus attach-specific caps (`CAP_PERFMON`/`CAP_NET_ADMIN`), not necessarily full root.
16. eBPF when `pprof` suffices: reach for it only for *kernel-level* visibility; profile your own process with `runtime/pprof` first.

---

## See Also {#see-also}
- [observability.md](observability.md), OpenTelemetry, production tracing, zero-code instrumentation
- [performance.md](performance.md), `runtime/pprof` (try before eBPF)
- [networking.md](networking.md), TCP/UDP patterns, packet handling
- [platform-and-build.md](platform-and-build.md#build-tags), `//go:build`, `//go:embed`, cross-compilation
- [errors-and-resilience.md](errors-and-resilience.md#astype), `errors.As`/`AsType` for `*VerifierError`

## Sources {#sources}
- pkg.go.dev/github.com/cilium/ebpf (+ `/link`, `/ringbuf`, `/perf`, `/features`, `/btf`, `/rlimit`), verified at v0.22.0/v0.21.0, 2026-06-27
- ebpf-go.dev (official docs & examples); cilium/ebpf GitHub releases (v0.17-v0.22 notes)
- docs.cilium.io/en/stable/bpf/ (BPF & XDP reference); docs.kernel.org/bpf/ (kernel BPF, verifier, CO-RE)
- datadoghq.com/blog/datadog-runtime-security/ (in-kernel discarders / filtering at scale)
