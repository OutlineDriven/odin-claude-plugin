# Emscripten settings reference

The `-s` settings that matter in practice. Grounded channel: Emscripten 6.0.9. `emcc -sSETTING=1` sets; the settings reference at emscripten.org is the authority for the full list.

| Setting | Type | Default | Effect |
|---|---|---|---|
| `EXPORTED_FUNCTIONS` | list | `["_main"]` | C symbols exported to JS, each with a leading underscore |
| `EXPORTED_RUNTIME_METHODS` | list | `[]` | Runtime helpers exposed: `ccall`, `cwrap`, `UTF8ToString`, `stringToNewUTF8` |
| `MODULARIZE` | bool | 0 | Wrap output in a factory function |
| `EXPORT_NAME` | string | `Module` | Name of the exported factory |
| `INITIAL_MEMORY` | bytes | 16 MB | Initial linear memory |
| `MAXIMUM_MEMORY` | bytes | 2 GB | Growth ceiling with `ALLOW_MEMORY_GROWTH` |
| `ALLOW_MEMORY_GROWTH` | bool | 0 | Let the heap grow at runtime; small perf cost |
| `STACK_SIZE` | bytes | 64 KB | C stack |
| `ASSERTIONS` | 0/1/2 | 1 in debug | Runtime consistency checks; 2 is extensive |
| `SAFE_HEAP` | bool | 0 | Trap misaligned and freed heap accesses |
| `STACK_OVERFLOW_CHECK` | 0/1/2 | off | Stack guard checks |
| `ASYNCIFY` | bool | 0 | Suspend and resume C across async JS |
| `ASYNCIFY_STACK_SIZE` | bytes | 16384 | Asyncify unwind stack |
| `USE_PTHREADS` | bool | 0 | pthreads through SharedArrayBuffer; needs cross-origin isolation |
| `PTHREAD_POOL_SIZE` | count | 0 | Pre-spawned worker pool |
| `SINGLE_FILE` | bool | 0 | Embed the WASM in the JS as base64 |
| `ENVIRONMENT` | list | `web,webview,worker,node` | Allowed host environments |
| `FILESYSTEM` | bool | 1 | Include the virtual filesystem; drop for pure compute |
| `EXIT_RUNTIME` | bool | 0 | Run `atexit` and tear down when `main` returns |
| `INVOKE_RUN` | bool | 1 | Call `main` automatically on load |

## Common configurations

### Minimal library (no main, no filesystem)

```bash
emcc lib.c -o lib.js \
  -sEXPORTED_FUNCTIONS='["_my_func"]' \
  -sEXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -sFILESYSTEM=0 -sMODULARIZE=1 -sEXPORT_NAME=MyLib \
  -sENVIRONMENT=web -Os
```

### Node module

```bash
emcc prog.c -o prog.js -sENVIRONMENT=node -sMODULARIZE=1 -sEXPORT_NAME=MyModule -O2
```

```javascript
const M = await require('./prog.js')();
```

### Threaded application

```bash
emcc prog.c -o prog.js -sUSE_PTHREADS=1 -sPTHREAD_POOL_SIZE=4 \
  -sINITIAL_MEMORY=64mb -O2
```

The server must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, or SharedArrayBuffer stays unavailable.

### Standalone WASM output

```bash
emcc prog.c -o prog.wasm -Os
```

A `.wasm` output name enables standalone mode. Simple modules run under wasi runtimes; anything that touches the Emscripten virtual filesystem or JS shims will not. Strict WASI builds belong to wasi-sdk.
