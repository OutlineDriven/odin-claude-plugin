---
name: wasm-wasmtime
description: 'Use when running WASM with the wasmtime CLI, embedding wasmtime in Rust, limiting execution with fuel, or building WASI preview2 components. Not for browser targets: use wasm-emscripten.'
---

# wasmtime

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Server-side WebAssembly with wasmtime: CLI execution and AOT compilation, WASI capabilities, component model with WIT, Rust embedding, fuel metering, or DWARF-based diagnosis. |
| Authority | Reversible local. Writes are limited to compiled artifacts, serialized modules, and project build outputs; rollback is deleting those files. No remote mutation. |
| Side effect | `.cwasm` artifacts, Rust build outputs, and host binaries that embed wasmtime. |
| Done | The module or component runs under wasmtime with named capabilities, or the embedding builds and enforces its execution limits. |

## Inputs

1. Module or component (required): the `.wasm` to run, or the WIT world to build.
2. Capabilities (required for WASI): directories, environment, sockets, and HTTP the guest may use.
3. wasmtime version (required): `wasmtime --version`. Grounded: 48.0.0 (current, LTS); releases monthly; Wasm GC and exceptions are on by default since 47.
4. Trust level (optional): untrusted guest code drives fuel or epoch decisions in step 5.

## Procedure

1. Run and inspect from the CLI. Wasmtime flags go before the module path; everything after the module is a guest argument:

```bash
wasmtime hello.wasm
wasmtime prog.wasm -- arg1 arg2
wasmtime --dir . prog.wasm                     # preopen the current directory
wasmtime --dir /tmp::/ prog.wasm               # host /tmp mapped to guest /
wasmtime --env HOME=/home/user prog.wasm
wasmtime run --invoke add math.wasm 3 4        # call one core export
wasmtime explore math.wasm                     # emit an HTML code explorer
```

`--dir` grants read-write access to the mapped host directory; treat every preopen as a capability grant. Done when: the module runs with exactly the capabilities it asked for.
2. Compile ahead of time for fixed deployments, and inspect the output with the built-in disassembler:

```bash
wasmtime compile prog.wasm -o prog.cwasm
wasmtime prog.cwasm
wasmtime objdump prog.cwasm                    # native code, annotated
```

A `.cwasm` file only loads on hosts matching the compile target. Done when: the deployment artifact loads and the startup compilation cost is gone.
3. Serve HTTP components with the `serve` subcommand, which runs the `wasi:http/proxy` world:

```bash
wasmtime serve --addr=0.0.0.0:8081 component.wasm
```

The CLI server is for development; put a real reverse proxy with limits in front of production traffic. Done when: the component answers a request through wasi:http or the constraint is recorded.
4. Embed wasmtime in Rust. Current API lines (48.x), including the `FsPerms` argument on preopens:

```toml
[dependencies]
wasmtime = "48"
wasmtime-wasi = "48"
```

```rust
use wasmtime::*;

fn main() -> anyhow::Result<()> {
    let engine = Engine::default();
    let module = Module::from_file(&engine, "prog.wasm")?;
    let mut store = Store::new(&engine, ());
    let instance = Instance::new(&mut store, &module, &[])?;
    let add = instance.get_typed_func::<(i32, i32), i32>(&mut store, "add")?;
    println!("{}", add.call(&mut store, (3, 4))?);
    Ok(())
}
```

For WASI guests, build a `WasiCtxBuilder` context and grant capabilities explicitly; `preopened_dir` takes host path, guest path, then `FsPerms::ReadOnly` or `FsPerms::ReadWrite`, and `build_p1()` produces the context for legacy WASIp1 modules:

```rust
use wasmtime_wasi::{WasiCtxBuilder, FsPerms};

let wasi = WasiCtxBuilder::new()
    .inherit_stdio()
    .inherit_env()
    .preopened_dir("/tmp", "/", FsPerms::ReadWrite)?
    .build();
```

Done when: the embedding builds against the pinned versions and grants only the listed capabilities.
5. Limit untrusted execution deterministically with fuel, or by wall clock with epochs. Fuel counts instructions; epochs suit pure timeout enforcement:

```rust
use wasmtime::*;

let mut config = Config::default();
config.consume_fuel(true);
let engine = Engine::new(&config)?;
let mut store = Store::new(&engine, ());
store.set_fuel(1_000_000)?;

match run.call(&mut store, ()) {
    Ok(_) => println!("done, fuel left: {}", store.get_fuel()?),
    Err(e) if e.downcast_ref::<Trap>() == Some(&Trap::OutOfFuel) => {
        eprintln!("fuel exhausted");
    }
    Err(e) => eprintln!("error: {e}"),
}
```

A store starts with zero fuel; forgetting `set_fuel` traps immediately. Done when: the limit fires on the chosen budget and the error path is exercised.
6. Define and build components with WIT. The interface file is the contract; `cargo component` wraps it in a Rust crate, and the `bindgen!` macro generates the host side:

```wit
package example:math@1.0.0;

interface calculator {
    add: func(a: s32, b: s32) -> s32;
}

world math-world {
    export calculator;
}
```

```bash
cargo install wasm-tools cargo-component
cargo component new --lib math-component
cargo component build --release
wasmtime run math-component.wasm
```

```rust
wasmtime::component::bindgen!({ world: "math-world", path: "math.wit" });
```

Migrate a legacy WASIp1 module by regenerating bindings from WIT with `cargo component` or `wit-bindgen`; the raw `wasi_snapshot_preview1` imports are the marker of what needs migrating. Done when: the component instantiates through the typed interface on both sides.
7. Debug with the debug info the module carries. Build with debug info retained, then ask wasmtime for detailed backtraces; disassemble and validate with wasm-tools:

```bash
WASMTIME_BACKTRACE_DETAILS=1 wasmtime prog.wasm
wasm-tools print prog.wasm | head -50    # WAT disassembly
wasm-tools validate prog.wasm
```

Backtraces name wasm functions when the module keeps its name section. Done when: the fault maps to a function and offset in the module.
8. Use the post-47 defaults for GC, exceptions, and threads; no feature flags are needed on current releases. GC adds struct and array types (`struct.new`, `array.get`) for managed objects. Exceptions give WASM native `try`/`catch`/`throw`. Threads need the `wasm32-wasi-threads` target at build time:

```bash
clang --target=wasm32-wasi-threads -pthread -o prog.wasm prog.c
wasmtime run prog.wasm
```

Older runtimes may need `-W threads` and `-W exceptions`; check `wasmtime -W help` when the host version is below 47. Done when: the feature set is confirmed on the recorded wasmtime version, not assumed from the default.
9. Tune host-side performance. Cache compiled modules on disk, parallelize compilation, and serialize for deployment:

```rust
let mut config = Config::default();
config.cranelift_opt_level(OptLevel::SpeedAndSize);
config.parallel_compilation(true);
config.cache_config_load_default()?;

let serialized = module.serialize()?;                       // build pipeline
std::fs::write("prog.cwasm", &serialized)?;
let module = unsafe { Module::deserialize_file(&engine, "prog.cwasm")? };  // runtime
```

`deserialize_file` is unsafe because it trusts the file byte for byte; only load artifacts your own pipeline produced. Done when: startup time is measured before and after.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Instantiation fails on unknown import | A capability was not granted. Match each import to a `WasiCtxBuilder` setting or a linker entry. |
| `.cwasm` refuses to load | Host or CPU mismatch with the compile target. Recompile on the deployment host. |
| Traps immediately with zero fuel | `set_fuel` was never called. Set the budget before the first call. |
| Fuel check misses the error | The trap type is `Trap::OutOfFuel`; match by downcast, not by message text. |
| Component type mismatch | WIT worlds differ between sides. Regenerate bindings from one canonical WIT file. |
| Backtrace shows raw addresses | Name section stripped. Rebuild the module with names retained. |

## Output

The run or serve command with its capability list, the AOT artifact, or the embedding that builds and enforces its limits. Serialized modules carry a note about the trust their loading assumes. Every claim names the wasmtime release it assumes.
