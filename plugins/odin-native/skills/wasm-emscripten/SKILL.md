---
name: wasm-emscripten
description: 'Use when compiling C or C++ to WebAssembly with emcc, exporting functions to JavaScript, sizing WASM memory, using Asyncify, or debugging .wasm. Not for server-side runtimes: use wasm-wasmtime.'
---

# WebAssembly with Emscripten

## Contract

| Field | Bound contract |
|---|---|
| Trigger | C or C++ to WebAssembly through Emscripten: emcc flag selection, JavaScript exports, memory sizing, Asyncify, wasm-opt, browser debugging, or a standalone `.wasm` output. |
| Authority | Reversible local. Writes are limited to build outputs under the project tree; rollback is deleting the build directory. No remote mutation. |
| Side effect | Generated `.js`, `.wasm`, and `.html` build artifacts and a build recipe. |
| Done | The code compiles for a named Emscripten version and target environment, exports are callable from JavaScript, and the memory and optimization settings match the workload. |

## Inputs

1. Source (required): the C or C++ to compile.
2. Host (required): browser, worker, or Node; `ENVIRONMENT` follows from it.
3. Emscripten version (required): `emcc --version`. Grounded current stable: 6.0.9, installed through emsdk.
4. Size or latency budget (optional): drives the optimization level in step 6.

## Procedure

1. Install and smoke-test the toolchain through emsdk:

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk                 # run each emsdk command with its own path, or use absolute paths
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
emcc --version
```

WASM files need HTTP to load in a browser; serve the output with `python3 -m http.server` rather than `file://`. Done when: `emcc --version` reports the pinned release.
2. Export exactly the functions JavaScript needs. `EMSCRIPTEN_KEEPALIVE` marks live code; `EXPORTED_FUNCTIONS` takes C names with a leading underscore:

```c
// math.c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int add(int a, int b) { return a + b; }
```

```bash
emcc math.c -o math.js \
  -sEXPORTED_FUNCTIONS='["_add"]' \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -sMODULARIZE=1 -sEXPORT_NAME=MathModule
```

```javascript
const Module = await MathModule();
Module._add(3, 4);                                        // direct
const add = Module.cwrap('add', 'number', ['number', 'number']);
add(3, 4);                                                // wrapped
```

Done when: each exported symbol is reachable from JavaScript without dead-code elimination removing it.
3. Size the linear memory for the workload, not generously:

```bash
emcc prog.c -o prog.js \
  -sINITIAL_MEMORY=16mb -sMAXIMUM_MEMORY=256mb -sALLOW_MEMORY_GROWTH=1 \
  -sSTACK_SIZE=1mb
```

Defaults worth knowing: initial 16 MB, growth ceiling 2 GB, stack 64 KB. Growth costs some performance; a fixed budget measured from the real allocation profile avoids it. Threads need `-sUSE_PTHREADS=1` plus a pool (`-sPTHREAD_POOL_SIZE`) and cross-origin isolation headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) on the server. Done when: initial and maximum memory are derived from a measured footprint.
4. Cross the JavaScript boundary through the heap views and string helpers:

```javascript
const ptr = Module._malloc(1024);
Module.HEAPU8.set([1, 2, 3], ptr);
Module._free(ptr);

const strPtr = Module.ccall('get_message', 'number', [], []);
const str = Module.UTF8ToString(strPtr);

const cStr = Module.stringToNewUTF8("hello");  // mallocs; caller frees
Module._process_string(cStr);
Module._free(cStr);
```

`UTF8ToString` and `stringToNewUTF8` must appear in `EXPORTED_RUNTIME_METHODS`. Done when: every pointer crossing the boundary has an owner for its `free`.
5. Make synchronous C code wait on asynchronous JavaScript with Asyncify:

```c
#include <emscripten.h>

EM_JS(void, do_fetch, (const char *url), {
    Asyncify.handleAsync(async () => {
        const resp = await fetch(UTF8ToString(url));
        console.log(await resp.text());
    });
});

void process_url(const char *url) {
    do_fetch(url);      // suspends here until the promise settles
    printf("fetch complete\n");
}
```

```bash
emcc async.c -o async.js -sASYNCIFY -sASYNCIFY_STACK_SIZE=16384 -O2
```

Done when: the async path returns to the event loop and resumes without corrupting C state.
6. Optimize for the budget. `-O3` for speed, `-Os` and `-Oz` for size, then post-process with Binaryen:

```bash
emcc prog.c -O3 -o prog.js
wasm-opt -Oz -o prog.opt.wasm prog.wasm    # size
wasm-opt -O4 -o prog.opt.wasm prog.wasm    # speed
ls -lh prog.wasm prog.opt.wasm             # measure the win
```

Done when: the shipped artifact is measured against the stated budget, not assumed.
7. Debug with assertions and source maps. Keep `-g` in development builds so the browser's DevTools show C sources from the DWARF sections:

```bash
emcc prog.c -g -O0 -o prog.html -sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=1
```

`SAFE_HEAP` catches misaligned and use-after-free heap accesses at runtime; `ASSERTIONS=2` adds extensive runtime checks. Strip all of it from release builds. Done when: the failing access reports a C source line.
8. Produce WASI-targeted output with the right tool. A `.wasm` output name puts emcc in standalone mode (`emcc prog.c -o prog.wasm`), which suits simple modules; strict WASI compliance, especially around filesystem and syscalls, belongs to wasi-sdk's Clang with its sysroot. Emscripten's POSIX emulation depends on its JavaScript runtime, so an Emscripten build that touches the virtual filesystem will not run under wasmtime. Done when: the toolchain matches the runtime the module must run on.

The full settings table lives in references/emscripten-linker-flags.md.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Exported function undefined in JS | Dead-code elimination removed it. Add `EMSCRIPTEN_KEEPALIVE` or the `EXPORTED_FUNCTIONS` entry. |
| `file://` load fails | Browsers require HTTP for WASM. Serve over localhost. |
| Out of memory at runtime | Raise `MAXIMUM_MEMORY` or enable growth; re-measure the footprint. |
| Asyncify misbehaves or bloats the binary | Keep `-O2` or higher, raise `ASYNCIFY_STACK_SIZE`, or list direct-only calls. |
| Threads never schedule | Missing cross-origin isolation headers or a zero pool. Set COOP/COEP and `PTHREAD_POOL_SIZE`. |
| Standalone `.wasm` fails under wasmtime | The module calls Emscripten runtime shims. Rebuild with wasi-sdk for strict WASI. |

## Output

A build recipe: the emcc command with settings traced to the workload, the JavaScript side of every export, memory measurements, and the debug or release variants. Artifacts stay under the project's build directory; each claim names the Emscripten release it assumes.
