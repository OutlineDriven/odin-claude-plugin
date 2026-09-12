---
name: ebpf
description: 'Use when writing eBPF programs with libbpf, bpftrace, or Rust with aya-ebpf and aya-log, attaching kprobes, tracepoints, or XDP hooks, declaring maps, sharing data with a Tokio loader, triaging verifier or Aya load errors, or porting with CO-RE. Not for full kernel bypass: use dpdk.'
---

# eBPF with libbpf, bpftrace, and Aya

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A kernel event needs tracing, a C/libbpf or Rust/Aya program needs writing or loading, the verifier rejects a program, kernel and user space need to share data, or an XDP filter needs attaching. |
| Authority | Reversible local. The write set is the user's C, Rust, or script source and object files, programs and maps loaded into the running kernel, pins under `/sys/fs/bpf`, and XDP attachments on a named interface. Rollback is detaching the program, unpinning, and `ip link set dev <if> xdp off`. Loading needs `CAP_BPF` or root. No remote mutation. |
| Side effect | Kernel state changes while a program or loader is loaded. Every load in this skill is paired with its detach; an Aya loader exits cleanly on Ctrl-C. |
| Done | The chosen program loads, attaches, and produces output for the traced event, the Aya loader exits cleanly on Ctrl-C, or the verifier/Aya load error is mapped to its cause and the fix is applied. |

## Inputs

- Goal (required): a one-off trace, a production program with a user-space side, an inspection of loaded objects, or packet processing.
- Implementation (required for a production program): C with libbpf or Rust with Aya; use bpftrace for a one-off trace.
- Program type and attach point (required for a program): tracepoint, kprobe, uprobe, XDP, TC, LSM, or another type from the mode table in step 4.
- Kernel (required): the running kernel must expose BTF at `/sys/kernel/btf/vmlinux` for C/libbpf CO-RE and Aya's target-BTF binding generation. The grounded floor is Linux 7.2 mainline or the 6.18 LTS line; every kernel feature named below exists in both.
- Toolchain (required for libbpf work): `clang` with the `bpf` target, `bpftool`, and libbpf 1.x with its headers. For Aya work: stable Rust plus a nightly with `rust-src`, `bpf-linker`, `cargo-generate`, `bpftool`, and a log backend such as `env_logger`, using Rust edition 2024.

## Procedure

1. Pick the tool and implementation mode by goal. A one-line trace or script is `bpftrace`. A production program with a loader is libbpf in C or Aya in Rust. Inspecting loaded programs and maps is `bpftool`. High-rate packet processing is XDP with libbpf or Aya. Done when: one tool and, for a production program, one language mode are chosen.
2. For a quick trace, write the `bpftrace` one-liner and confirm the probe exists. Done when: the probe prints for a live event.

```bash
bpftrace -l 'tracepoint:syscalls:*'                 # list probes
bpftrace -l 'kprobe:tcp_*'
bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%s %s\n", comm, str(args->filename)); }'
bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'
bpftrace -e '
  tracepoint:syscalls:sys_enter_read { @start[tid] = nsecs; }
  tracepoint:syscalls:sys_exit_read  { @us = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'
```

3. For a production program, select C/libbpf or Rust/Aya. In C/libbpf mode, write the kernel side, generate the skeleton, and write the loader. Done when: the loader attaches and the map fills.

```c
/* counter.bpf.c: count read() calls per process. */
#include <vmlinux.h>
#include <bpf/bpf_helpers.h>

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 1024);
} call_count SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_read")
int trace_read(struct trace_event_raw_sys_enter *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    u64 *cnt = bpf_map_lookup_elem(&call_count, &pid);
    if (cnt) {
        __sync_fetch_and_add(cnt, 1);
    } else {
        u64 one = 1;
        bpf_map_update_elem(&call_count, &pid, &one, BPF_ANY);
    }
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

```c
/* counter.c: open, load, attach, observe, destroy. */
#include "counter.skel.h"
#include <bpf/bpf.h>
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

static volatile sig_atomic_t stop;

static void stop_handler(int signum)
{
    (void)signum;
    stop = 1;
}

int main(void)
{
    struct counter_bpf *skel = counter_bpf__open();
    int status = 1;
    if (!skel)
        return status;
    if (counter_bpf__load(skel))
        goto cleanup;
    if (counter_bpf__attach(skel))
        goto cleanup;
    if (signal(SIGINT, stop_handler) == SIG_ERR ||
        signal(SIGTERM, stop_handler) == SIG_ERR)
        goto cleanup;

    int map_fd = bpf_map__fd(skel->maps.call_count);
    while (!stop) {
        __u32 pid;
        __u64 count;
        if (bpf_map_get_next_key(map_fd, NULL, &pid) == 0 &&
            bpf_map_lookup_elem(map_fd, &pid, &count) == 0) {
            printf("pid %u: %llu reads\n", pid, (unsigned long long)count);
            status = 0;
            break;
        }
        sleep(1);
    }
    if (stop)
        status = 0;
cleanup:
    counter_bpf__destroy(skel);
    return status;
}
```

```bash
bpftool btf dump file /sys/kernel/btf/vmlinux format c > vmlinux.h
clang -g -O2 -target bpf -D__TARGET_ARCH_x86 -c counter.bpf.c -o counter.bpf.o
bpftool gen skeleton counter.bpf.o > counter.skel.h
gcc -o counter counter.c -lbpf -lelf -lz
```

The skeleton's `open`, `load`, `attach`, and `destroy` functions replace the older `bpf_object__open_file` and `bpf_object__load` split, which still exist for loading an object by path.

**Rust/Aya mode for a production program.** Install the toolchain and generate the project from the Aya template. Done when: `cargo build` succeeds on the fresh template.

```bash
rustup toolchain install stable
rustup toolchain install nightly --component rust-src
cargo install bpf-linker
cargo install cargo-generate
cargo generate https://github.com/aya-rs/aya-template   # prompts for name and program type
```

The template lays out `<name>/` (user-space crate), `<name>-ebpf/` (kernel-side crate), and `<name>-common/` (shared types). A build script compiles the eBPF crate and embeds the object, so ordinary `cargo build`, `cargo check`, and `cargo run --release` drive both sides; there is no separate build step.

Write the kernel side with `aya-ebpf` and `aya-log-ebpf`. Done when: the crate compiles for the BPF target.

```rust
// <name>-ebpf/src/main.rs
#![no_std]
#![no_main]

use aya_ebpf::{
    helpers::bpf_get_current_pid_tgid,
    macros::{map, tracepoint},
    maps::PerCpuHashMap,
    programs::TracePointContext,
};
use aya_log_ebpf::info;

#[map]
static CALL_COUNT: PerCpuHashMap<u32, u64> = PerCpuHashMap::with_max_entries(1024, 0);

#[tracepoint]
pub fn trace_read(ctx: TracePointContext) -> u32 {
    let pid = (bpf_get_current_pid_tgid() >> 32) as u32;
    if let Some(count) = CALL_COUNT.get_ptr_mut(&pid) {
        unsafe { *count += 1; }
    } else {
        let one = 1;
        let _ = CALL_COUNT.insert(&pid, &one, 0);
    }
    info!(&ctx, "read() called by pid {}", pid);
    0
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    // The verifier never lets a panic path run; this satisfies no_std.
    loop {}
}
```

Write the user-space loader on Tokio. Done when: the loader attaches, prints log lines, and exits on Ctrl-C.

```rust
// <name>/src/main.rs
use aya::{include_bytes_aligned, maps::PerCpuHashMap, programs::TracePoint, Ebpf};
use aya_log::EbpfLogger;
use tokio::{
    io::{unix::AsyncFd, Interest},
    signal,
    task,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut bpf = Ebpf::load(include_bytes_aligned!(concat!(env!("OUT_DIR"), "/<name>")))?;
    env_logger::init();
    let logger = EbpfLogger::init(&mut bpf)?;
    let mut logger = AsyncFd::with_interest(logger, Interest::READABLE)?;
    let logger_task = task::spawn(async move {
        loop {
            let mut guard = logger.readable_mut().await.expect("logger fd wait");
            guard.get_inner_mut().flush();
            guard.clear_ready();
        }
    });

    let program: &mut TracePoint = bpf.program_mut("trace_read").unwrap().try_into()?;
    program.load()?;
    program.attach("syscalls", "sys_enter_read")?;

    let counts: PerCpuHashMap<_, u32, u64> =
        PerCpuHashMap::try_from(bpf.map("CALL_COUNT").unwrap())?;

    signal::ctrl_c().await?;
    logger_task.abort();
    let _ = logger_task.await;
    for entry in counts.iter().filter_map(Result::ok) {
        let (pid, per_cpu) = entry;
        let count: u64 = per_cpu.iter().copied().sum();
        println!("pid {pid}: {count} reads");
    }
    Ok(())
}
```

The template's build script sets the object path; take it from the generated `main.rs` rather than hard-coding one.

4. Choose the program type, attach target, and map. In C/libbpf, use a hash map for per-key state, an array for fixed-index config, a per-CPU map for a hot counter that must not lock, an LRU hash for bounded connection tracking, a program array for tail calls, and a ring buffer for kernel-to-user events. In Rust/Aya, select the program macro from the table below and the corresponding map. Prefer `BPF_MAP_TYPE_RINGBUF` over `BPF_MAP_TYPE_PERF_EVENT_ARRAY` (or `RingBuf` over `PerfEventArray`) for new code: one shared buffer, ordering across CPUs, variable-size records, and a reserve that fails instead of dropping. The full C type table, operations, and pinning live in `references/ebpf-map-types.md`. Done when: the program type, attach target, map type, and its capacity (`max_entries` or ring-buffer byte size) are chosen.

| Macro | Program type | Attach target |
|---|---|---|
| `#[tracepoint]` | Tracepoint | category and name, such as `"syscalls"`, `"sys_enter_read"` |
| `#[kprobe]`, `#[kretprobe]` | Kernel probe | kernel function name |
| `#[uprobe]`, `#[uretprobe]` | User probe | binary path and symbol or offset |
| `#[xdp]` | XDP | network interface |
| `#[classifier]` | TC | interface and direction |
| `#[socket_filter]` | Socket filter | socket fd |
| `#[perf_event]` | Perf event | perf event fd |
| `#[lsm]` | LSM hook | hook name |
| `#[sk_msg]` | Sockmap | socket map |

Kernel-side Aya maps live in `aya_ebpf::maps`: `HashMap`, `LruHashMap`, `PerCpuHashMap`, `Array`, `PerCpuArray`, `RingBuf`, `PerfEventArray`, `LpmTrie`, `ProgramArray`, `XskMap`, and others. `RingBuf::reserve` returns an `Option`, so the kernel side must handle a full buffer.

```rust
use aya_ebpf::maps::RingBuf;

#[map]
static EVENTS: RingBuf = RingBuf::with_byte_size(256 * 1024, 0);

if let Some(mut entry) = EVENTS.reserve::<MyEvent>(0) {
    entry.write(MyEvent { pid, ts });
    entry.submit(0);
}
```

```rust
// User space: poll the ring buffer through tokio's AsyncFd.
use aya::maps::RingBuf;
use tokio::io::unix::AsyncFd;

let ring = RingBuf::try_from(bpf.take_map("EVENTS").unwrap())?;
let mut ring = AsyncFd::new(ring)?;
loop {
    let mut guard = ring.readable_mut().await?;
    let rb = guard.get_inner_mut();
    while let Some(item) = rb.next() {
        let event: &MyEvent = unsafe { &*(item.as_ptr() as *const MyEvent) };
        println!("event from pid {}", event.pid);
    }
    guard.clear_ready();
}
```

```c
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} rb SEC(".maps");

SEC("kprobe/do_sys_openat2")
int handle_open(struct pt_regs *ctx)
{
    struct event *e = bpf_ringbuf_reserve(&rb, sizeof(*e), 0);
    if (!e)
        return 0;
    e->pid = bpf_get_current_pid_tgid() >> 32;
    bpf_ringbuf_submit(e, 0);   /* bpf_ringbuf_discard(e, 0) on an error path */
    return 0;
}
```

User space consumes with `ring_buffer__poll`; the perf buffer equivalent is `perf_buffer__poll` over `bpf_perf_event_output`.

5. Triage a verifier rejection or Aya load failure. Load with `bpftool` to see the full log, then map the message; Aya surfaces the verifier log as error text. Done when: the message has a cause and the program passes or loads.

```bash
bpftool prog load prog.bpf.o /sys/fs/bpf/prog type kprobe 2>&1 | head -100
bpftool prog list
bpftool prog dump xlated id 42
```

| Verifier message | Cause | Fix |
|---|---|---|
| `invalid mem access 'scalar'` | Dereference of a pointer the verifier could not bound | Null-check the pointer before use |
| `R0 !read_ok` | A path returns without setting `R0` | Return a value on every path |
| `jump out of range` | Branch target beyond the program | Restructure the conditional |
| `back-edge detected` | A loop the verifier cannot bound | Bound the loop with a constant, or use `bpf_loop()` (kernel 5.17 and later; present on the grounded floor) |
| `unreachable insn` | Dead code after a return | Remove the dead branch |
| `invalid indirect read` | Stack bytes read before being written | Zero-initialize the struct: `struct foo x = {};` |
| `misaligned stack access` | Pointer arithmetic off alignment | Align reads to `__u64` |

In Rust/Aya mode, inspect the load and verifier output with:

```bash
RUST_LOG=debug cargo run --release 2>&1 | grep -A 20 verifier
bpftool btf dump file /sys/kernel/btf/vmlinux | grep task_struct
bpftool prog list
bpftool prog dump xlated name trace_read
```

| Aya error | Cause | Fix |
|---|---|---|
| `invalid mem access` | Pointer dereferenced without a bound | Check the `Option` or `Result` before reading |
| BTF type not found | Bindings generated against a different kernel | Regenerate `vmlinux.rs` on the target kernel |
| `Permission denied` | No `CAP_BPF` or `CAP_SYS_ADMIN` | Run as root or grant the capability |
| Map already exists | A pinned map from a previous run | Unpin it or rename the map |

For Tokio patterns in the loader, use `rust-async-internals`. For raw pointer reads on the kernel side, use `rust-unsafe`.

6. For packet filtering, write an XDP program and attach it in driver mode where the NIC supports it. Done when: the program is attached and the interface shows it, and the detach command is recorded.

```c
#include <vmlinux.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

SEC("xdp")
int xdp_filter(struct xdp_md *ctx)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    struct ethhdr *eth = data;

    if ((void *)(eth + 1) > data_end)
        return XDP_PASS;
    if (bpf_ntohs(eth->h_proto) != ETH_P_IP)
        return XDP_PASS;

    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_PASS;
    if (ip->protocol == IPPROTO_ICMP)
        return XDP_DROP;
    return XDP_PASS;
}
char LICENSE[] SEC("license") = "GPL";
```

```bash
ip link set dev eth0 xdpdrv object xdp_drop_icmp.bpf.o section xdp   # driver mode
ip link set dev eth0 xdpgeneric object prog.bpf.o section xdp        # fallback when the driver lacks XDP
ip link set dev eth0 xdp off                                          # detach
```

Return codes are `XDP_PASS`, `XDP_DROP`, `XDP_TX` (send back out the same port), and `XDP_REDIRECT`. For redirecting into AF_XDP sockets, use `af-xdp`; for a full kernel bypass, use `dpdk`.

7. Make the program portable with CO-RE. In C/libbpf, include `vmlinux.h` generated from the build host's BTF and read kernel struct fields through `BPF_CORE_READ`, which libbpf relocates to the running kernel's field offsets at load time. In Rust/Aya, generate `vmlinux.rs` with `aya-tool` when the program reads kernel structs and read fields through `aya_ebpf::helpers::bpf_probe_read_kernel`; aya-tool's generated structures are portable across Linux kernel versions via BPF CO-RE, provided the target kernel has `CONFIG_DEBUG_INFO_BTF`. Done when: the same C object loads on a second kernel version, and an Aya program has compiling generated bindings on a BTF-enabled target.

```c
#include <vmlinux.h>
#include <bpf/bpf_core_read.h>

SEC("kprobe/tcp_connect")
int trace_connect(struct pt_regs *ctx)
{
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    u16 dport = BPF_CORE_READ(sk, __sk_common.skc_dport);
    bpf_printk("connect to port %d\n", bpf_ntohs(dport));
    return 0;
}
```

In Rust/Aya mode, generate the bindings with:

```bash
cargo install bindgen-cli
cargo install --git https://github.com/aya-rs/aya -- aya-tool
aya-tool generate task_struct > <name>-ebpf/src/vmlinux.rs
```

Aya's loader relocates generated accesses against the running kernel's BTF; the target kernel must have `CONFIG_DEBUG_INFO_BTF`.

8. Reach for iterators and atomics when the simple form is too slow. An `SEC("iter/task")` program walks every task once through `bpf_seq_printf` without a probe firing per element; read its output with `bpftool prog tracelog` or the seq file the loader creates. For a counter updated by concurrent probes, use a per-CPU array and sum in user space; when a single shared value is required, increment it with `__sync_fetch_and_add`. The full BPF atomic set (fetch-and-add with a returned value, and, or, xor, exchange, compare-exchange) is available from kernel 5.12; plain add-without-return predates it. Both are on the grounded floor. Done when: the hot path uses per-CPU storage or an atomic, not a plain read-modify-write.

For seccomp filtering, use `kernel-security`. For module development that a probe targets, use `linux-kernel-modules`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `/sys/kernel/btf/vmlinux` missing | The kernel lacks `CONFIG_DEBUG_INFO_BTF`. CO-RE cannot work and Aya cannot generate target-BTF bindings; report it and fall back to a kernel with BTF. |
| `Permission denied` on load | The process lacks `CAP_BPF` (or `CAP_SYS_ADMIN` for some program types). Run as root or grant the capability; do not weaken `kernel.unprivileged_bpf_disabled`. |
| Verifier rejects the program | Map the message with the table in step 5. Fix the program; do not shrink `max_entries` or remove checks to make it pass. |
| XDP attach fails in driver mode | The driver lacks native XDP. Attach with `xdpgeneric` and note the throughput cost. |
| Ring buffer reserve returns null or `None` | The buffer is full. Enlarge `max_entries` or drain faster in user space; count the drops. |
| Map already pinned | A previous run left a pin under `/sys/fs/bpf`. Reuse it or unpin it before reloading. |
| `bpf-linker` missing or the wrong LLVM | The Aya eBPF crate fails to link. Install the version required by the `bpf-linker` README for the installed LLVM; do not pin an old nightly to dodge it. |
| Loader killed without cleanup | Programs detach when their file descriptors close; pinned objects survive under `/sys/fs/bpf` and are removed by hand. |

## Output

The selected program source (including kernel-side and user-space crates for Aya), the build and load commands, the attach and detach pair, and evidence: traced output, log lines, or map entries for a live event, or the verifier message mapped to its fix. Every kernel-side object the run leaves behind is listed with its removal command.
