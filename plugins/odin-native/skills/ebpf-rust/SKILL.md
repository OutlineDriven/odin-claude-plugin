---
name: ebpf-rust
description: 'Use when writing eBPF programs in Rust with aya-ebpf and aya-log, declaring maps, sharing them with a tokio user-space loader, or debugging an Aya load failure. Not for C and libbpf: use ebpf.'
---

# eBPF in Rust with Aya

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An eBPF program is being written in Rust, a kernel-side map must be read from user space, log lines must come out of a BPF program, or an Aya program fails to load. |
| Authority | Reversible local. The write set is the project's source tree, the built objects, and programs and maps loaded into the running kernel while the loader runs. Rollback is stopping the loader, which detaches and unloads; pinned objects are removed with `rm` under `/sys/fs/bpf`. Loading needs `CAP_BPF` or root. No remote mutation. |
| Side effect | Kernel state changes while the loader runs. |
| Done | `cargo run --release` loads and attaches the program, log lines or map entries appear for a live event, and the loader exits cleanly on Ctrl-C. |

## Inputs

- Program type and attach point (required): tracepoint, kprobe, uprobe, XDP, TC, LSM, or another type from the table in step 4.
- Kernel (required): BTF at `/sys/kernel/btf/vmlinux` for portability. Grounded floor is Linux 7.2 mainline or 6.18 LTS; every kernel feature named here exists on both.
- Toolchain (required): stable Rust plus a nightly with `rust-src`, `bpf-linker`, `cargo-generate`, and `bpftool`. The grounded Rust edition is 2024.

## Procedure

1. Set up the toolchain and generate the project. Done when: `cargo build` succeeds on the fresh template.

```bash
rustup toolchain install stable
rustup toolchain install nightly --component rust-src
cargo install bpf-linker
cargo install cargo-generate
cargo generate https://github.com/aya-rs/aya-template   # prompts for name and program type
```

The template lays out `<name>/` (user-space crate), `<name>-ebpf/` (kernel-side crate), and `<name>-common/` (shared types). A build script compiles the eBPF crate and embeds the object, so ordinary `cargo build`, `cargo check`, and `cargo run --release` drive both sides; there is no separate build step.

2. Write the kernel side with `aya-ebpf` and `aya-log-ebpf`. Done when: the crate compiles for the BPF target.

```rust
// <name>-ebpf/src/main.rs
#![no_std]
#![no_main]

use aya_ebpf::{
    helpers::bpf_get_current_pid_tgid,
    macros::{map, tracepoint},
    maps::HashMap,
    programs::TracePointContext,
};
use aya_log_ebpf::info;

#[map]
static CALL_COUNT: HashMap<u32, u64> = HashMap::with_max_entries(1024, 0);

#[tracepoint]
pub fn trace_read(ctx: TracePointContext) -> u32 {
    let pid = (bpf_get_current_pid_tgid() >> 32) as u32;
    let next = match unsafe { CALL_COUNT.get(&pid) } {
        Some(count) => *count + 1,
        None => 1,
    };
    let _ = CALL_COUNT.insert(&pid, &next, 0);
    info!(&ctx, "read() called by pid {}", pid);
    0
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    // The verifier never lets a panic path run; this satisfies no_std.
    unsafe { core::hint::unreachable_unchecked() }
}
```

3. Write the user-space loader on tokio. Done when: the loader attaches, prints log lines, and exits on Ctrl-C.

```rust
// <name>/src/main.rs
use aya::{include_bytes_aligned, maps::HashMap, programs::TracePoint, Ebpf};
use aya_log::EbpfLogger;
use tokio::signal;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut bpf = Ebpf::load(include_bytes_aligned!(concat!(env!("OUT_DIR"), "/<name>")))?;
    EbpfLogger::init(&mut bpf)?;

    let program: &mut TracePoint = bpf.program_mut("trace_read").unwrap().try_into()?;
    program.load()?;
    program.attach("syscalls", "sys_enter_read")?;

    let counts: HashMap<_, u32, u64> = HashMap::try_from(bpf.map("CALL_COUNT").unwrap())?;

    signal::ctrl_c().await?;
    for entry in counts.iter().filter_map(Result::ok) {
        let (pid, count) = entry;
        println!("pid {pid}: {count} reads");
    }
    Ok(())
}
```

The template's build script sets the object path; take it from the generated `main.rs` rather than hard-coding one.

4. Pick the program macro and the map type. Done when: both are chosen and the attach target is known.

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

Kernel-side maps live in `aya_ebpf::maps`: `HashMap`, `LruHashMap`, `PerCpuHashMap`, `Array`, `PerCpuArray`, `RingBuf`, `PerfEventArray`, `LpmTrie`, `ProgramArray`, `XskMap`, and others. Prefer `RingBuf` for events. `RingBuf::reserve` returns an `Option`, so the kernel side must handle a full buffer.

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

5. Generate kernel type bindings when the program reads kernel structs. Done when: `vmlinux.rs` exists in the eBPF crate and the field read compiles.

```bash
cargo install bindgen-cli
cargo install --git https://github.com/aya-rs/aya -- aya-tool
aya-tool generate task_struct > <name>-ebpf/src/vmlinux.rs
```

Read fields through `aya_ebpf::helpers::bpf_probe_read_kernel`. The generated types carry BTF relocations, so the loader adjusts field offsets to the running kernel when that kernel has `CONFIG_DEBUG_INFO_BTF`.

6. Debug a load failure. Aya surfaces the verifier log as the error text. Done when: the error is mapped to its cause and the program loads.

```bash
RUST_LOG=debug cargo run --release 2>&1 | grep -A 20 verifier
bpftool btf dump file /sys/kernel/btf/vmlinux | grep task_struct
bpftool prog list
bpftool prog dump xlated name trace_read
```

| Error | Cause | Fix |
|---|---|---|
| `invalid mem access` | Pointer dereferenced without a bound | Check the `Option` or `Result` before reading |
| BTF type not found | Bindings generated against a different kernel | Regenerate `vmlinux.rs` on the target kernel |
| `Permission denied` | No `CAP_BPF` or `CAP_SYS_ADMIN` | Run as root or grant the capability |
| Map already exists | A pinned map from a previous run | Unpin it or rename the map |

For the C and libbpf side, use `ebpf`. For the tokio patterns in the loader, use `rust-async-internals`. For the raw pointer reads on the kernel side, use `rust-unsafe`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `bpf-linker` missing or the wrong LLVM | The eBPF crate fails to link. Install per the `bpf-linker` README for the installed LLVM; do not pin an old nightly to dodge it. |
| No BTF on the target kernel | Bindings do not relocate. Regenerate them against that kernel's BTF, or report that portability is unavailable. |
| Verifier rejection | Map the message with the table in step 6 and fix the program; never shrink a check to pass. |
| Ring buffer full | `reserve` returns `None`. Count the drop, enlarge the buffer, or drain faster. |
| Loader killed without cleanup | Programs detach when their file descriptors close; pinned objects survive under `/sys/fs/bpf` and are removed by hand. |

## Output

The kernel-side and user-space crates, the run command, the attach point, and evidence: log lines or map entries for a live event, or the verifier message mapped to its fix.
