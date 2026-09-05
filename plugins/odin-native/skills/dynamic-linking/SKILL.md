---
name: dynamic-linking
description: 'Use when debugging shared library load failures, setting RPATH or RUNPATH, applying soname versioning, writing dlopen plugins, or intercepting with LD_PRELOAD. Not for static archives: use binutils.'
---

# Dynamic linking

Linux loads shared libraries at startup or on demand through `ld.so`. This skill builds versioned shared objects, places them where the loader finds them, and diagnoses the failures in between.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A build or run fails with `cannot open shared object file` or `symbol lookup error`, the task sets RPATH or RUNPATH, versions a library with a soname, writes a `dlopen` plugin, or interposes a function with `LD_PRELOAD`. |
| Authority | Reversible local: writes only built `.so` files, symlinks, source, and the loader cache entries the procedure names (`ldconfig` needs root); rollback is version control, removing created symlinks, and re-running `ldconfig`. No remote mutation. |
| Side effect | Local writes to build outputs, symlinks, and `/etc/ld.so.cache` when `ldconfig` runs. Environment variables and loader flags stay inside the session. |
| Done | The binary runs against the intended library, proven by `ldd` resolving every dependency to the intended path and by a clean `LD_DEBUG=libs` trace or the plugin loading end to end. |

## Inputs

- The failing binary or the library to build: required.
- The intended library location: required for search-path work.
- Whether deployment must be relocatable: required before choosing `$ORIGIN`, RPATH, or RUNPATH.
- Root access: required only when registering a library system-wide with `ldconfig`.

## Procedure

1. Build the shared library with a soname. The soname is what executables record and what `ldconfig` maintains. Done when: `readelf -d libmylib.so.1.2.3` prints the intended `SONAME`.

```bash
gcc -fPIC -c src/mylib.c -o mylib.o
gcc -shared -Wl,-soname,libmylib.so.1 mylib.o -o libmylib.so.1.2.3
ln -s libmylib.so.1.2.3 libmylib.so.1   # loader name
ln -s libmylib.so.1     libmylib.so     # linker name for -lmylib
```

2. Bump versions by ABI change, not by habit. Done when: the bump class matches the change.

| Bump | When |
|------|------|
| PATCH | Bug fix, ABI unchanged |
| MINOR | Symbols added, backwards compatible: keep the soname, refresh the `.so.1` symlink |
| MAJOR | ABI breaks: new soname, old `.so.1` files stay installed for existing binaries |

3. Embed the runtime search path. RPATH is searched before `LD_LIBRARY_PATH`; RUNPATH after it. Prefer RUNPATH for deployed binaries because environment variables then keep control. `-Wl,--enable-new-dtags` selects RUNPATH and is the modern linker default. `$ORIGIN` expands to the directory holding the binary, which makes an install tree relocatable. Done when: `readelf -d myapp` shows the intended tag and value.

```bash
gcc main.c -L./lib -lmylib \
    -Wl,-rpath,'$ORIGIN/../lib' -Wl,--enable-new-dtags -o myapp
readelf -d myapp | grep -E 'RPATH|RUNPATH'
chrpath -l myapp                 # show
chrpath -r '/new/path' myapp     # rewrite on an existing binary
```

4. Know the search order to predict a failure. `ld.so` searches, in order: `DT_RPATH` when no `DT_RUNPATH` exists, then `LD_LIBRARY_PATH` (ignored for setuid binaries), then `DT_RUNPATH`, then the `/etc/ld.so.cache` built by `ldconfig`, then `/lib` and `/usr/lib`. Done when: the failing library is placed at a search step that the deployment controls.

```bash
LD_DEBUG=libs ./myapp   # trace each resolution decision
ldd -v ./myapp          # resolved paths plus version requirements
```

5. Load a plugin with `dlopen` and `dlsym`. Clear `dlerror()` before each call; `dlsym` reports success through a null return from it, not from the pointer. Link with `-ldl` on glibc before 2.34; glibc 2.34 and later fold `dlfcn` into libc. Done when: the plugin loads, its entry point runs, and `dlclose` releases it.

```c
#include <dlfcn.h>

typedef int (*plugin_fn_t)(const char *input);

void load_plugin(const char *path) {
    void *handle = dlopen(path, RTLD_NOW | RTLD_LOCAL);
    if (!handle) {
        fprintf(stderr, "dlopen: %s\n", dlerror());
        return;
    }
    dlerror();  // clear any error state before dlsym
    plugin_fn_t fn = (plugin_fn_t)dlsym(handle, "plugin_run");
    const char *err = dlerror();
    if (err) {
        fprintf(stderr, "dlsym: %s\n", err);
        dlclose(handle);
        return;
    }
    fn("hello");
    dlclose(handle);
}
```

6. Interpose a function with `LD_PRELOAD`. The preloaded library is searched first, so its symbols win. `RTLD_NEXT` finds the next definition in the chain. Done when: running with `LD_PRELOAD=...` shows the interception and the real call still works.

```c
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>

void *malloc(size_t size) {
    static void *(*real_malloc)(size_t) = NULL;
    if (!real_malloc)
        real_malloc = (void *(*)(size_t))dlsym(RTLD_NEXT, "malloc");
    void *ptr = real_malloc(size);
    fprintf(stderr, "malloc(%zu) = %p\n", size, ptr);
    return ptr;
}
```

```bash
gcc -shared -fPIC -o myinterpose.so myinterpose.c -ldl
LD_PRELOAD=./myinterpose.so ./myapp
```

7. Export only the intended symbols. Build with `-fvisibility=hidden` and mark the public API `visibility("default")`, or restrict exports with a version script. Done when: `nm -D --defined-only libmylib.so` lists the public API and nothing else.

```c
__attribute__((visibility("default"))) int public_api(void) { return 42; }
```

```text
# mylib.map
MYLIB_1.0 {
    global:
        mylib_init;
        mylib_process;
    local:
        *;
};
```

```bash
gcc -shared -fPIC -fvisibility=hidden -Wl,--version-script=mylib.map \
    mylib.c -o libmylib.so
```

8. Diagnose the common failures. Done when: each reported error maps to its row and the fix is applied.

| Error | Cause | Fix |
|-------|-------|-----|
| `cannot open shared object file` | Library outside the search path | Set RUNPATH, extend `LD_LIBRARY_PATH`, or run `ldconfig` |
| `symbol lookup error: undefined symbol` | Missing library or version mismatch | Check `ldd`, fix link order, or add the missing `-l` |
| `relocation R_X86_64_32 against .rodata` | Non-PIC code in a shared object | Compile that object with `-fPIC` |
| `version 'GLIBC_2.xx' not found` | Built on a newer glibc than the runtime | Build on the older host or link statically |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `ldd` shows `not found` after a correct RUNPATH | The dependency of a dependency needs its own RUNPATH. Trace with `LD_DEBUG=libs` and fix the library that records the path. |
| `chrpath` refuses a longer path | `chrpath` cannot grow an existing string. Rebuild with the correct `-Wl,-rpath`, or use `patchelf --set-rpath`. |
| Interposition breaks a setuid binary | The loader ignores `LD_PRELOAD` and `LD_LIBRARY_PATH` for setuid executables. This is loader policy, not a bug. |
| Plugin symbols clash across libraries | Reopen the plugin with `RTLD_LOCAL`, or hide symbols per step 7. |
| `ldconfig` not runnable | Root is required. Ship the RUNPATH inside the binary instead, and skip the system-wide registration. |

## Output

The running binary or loaded plugin, plus the resolving evidence: `ldd` output, the `SONAME` and RUNPATH lines from `readelf -d`, or the interposition trace. Deep details on search paths, `$ORIGIN`, and version scripts are in `references/ld-rpath-soname.md`.
