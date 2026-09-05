# RPATH, RUNPATH, and soname reference

## ld.so search path configuration

System-wide, through `/etc/ld.so.conf`:

```text
# /etc/ld.so.conf.d/mylib.conf
/usr/local/lib/myapp
/opt/myapp/lib
```

```bash
sudo ldconfig            # rebuild /etc/ld.so.cache
ldconfig -p | grep libmylib
```

Per-user, through the environment:

```bash
export LD_LIBRARY_PATH=/home/user/mylibs:$LD_LIBRARY_PATH
./myapp
```

`LD_LIBRARY_PATH` is ignored for setuid binaries. Prefer RUNPATH inside the binary for deployment.

## RPATH and RUNPATH details

### $ORIGIN expansion patterns

| Pattern | Resolves to |
|---------|------------|
| `$ORIGIN` | Directory containing the binary |
| `$ORIGIN/../lib` | `lib/` beside `bin/` |
| `$ORIGIN/../../lib` | Two levels up, then `lib` |
| `$LIB` | Architecture lib dir, for example `lib/x86_64-linux-gnu` |
| `$PLATFORM` | Platform string, for example `x86_64` |

Relocatable package layout:

```text
myapp/
  bin/myapp        # RUNPATH = $ORIGIN/../lib
  lib/libfoo.so.1
  lib/libbar.so.2
```

### Modifying an existing binary

```bash
patchelf --print-rpath ./myapp
chrpath -l ./myapp
patchelf --set-rpath '$ORIGIN/../lib' ./myapp
chrpath -r '$ORIGIN/../lib' ./myapp
patchelf --remove-rpath ./myapp
chrpath -d ./myapp
```

`chrpath` can only replace a path with one of the same length or shorter, because it edits the string in place. `patchelf` has no such limit.

### CMake

```cmake
set(CMAKE_INSTALL_RPATH "$ORIGIN/../lib")
set(CMAKE_BUILD_WITH_INSTALL_RPATH FALSE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--enable-new-dtags")
```

## Soname versioning lifecycle

```bash
# first release
gcc -fPIC -c libfoo.c -o libfoo.o
gcc -shared -Wl,-soname,libfoo.so.1 libfoo.o -o libfoo.so.1.0.0
ln -sf libfoo.so.1.0.0 libfoo.so.1   # loader name, maintained by ldconfig
ln -sf libfoo.so.1     libfoo.so     # linker name, used by -lfoo
```

Minor bump, ABI compatible:

```bash
gcc -shared -Wl,-soname,libfoo.so.1 libfoo.o -o libfoo.so.1.1.0
ln -sf libfoo.so.1.1.0 libfoo.so.1
sudo ldconfig
# libfoo.so.1.0.0 stays installed for binaries already linked to it
```

Major bump, ABI breaks:

```bash
gcc -shared -Wl,-soname,libfoo.so.2 libfoo.o -o libfoo.so.2.0.0
ln -sf libfoo.so.2.0.0 libfoo.so.2
ln -sf libfoo.so.2     libfoo.so
sudo ldconfig
# libfoo.so.1* stays installed for binaries linked against it
```

## Version scripts

```text
# libfoo.map
LIBFOO_1.0 {
    global:
        foo_init;
        foo_process;
        foo_cleanup;
    local:
        *;
};

LIBFOO_1.1 {
    global:
        foo_process_ex;   # new in 1.1
} LIBFOO_1.0;             # inherits the 1.0 symbols
```

```bash
gcc -shared -Wl,--version-script=libfoo.map -o libfoo.so.1 libfoo.o
readelf -s --wide libfoo.so.1 | grep LIBFOO
```

## Debugging loader decisions

```bash
LD_DEBUG=libs ./myapp    # library search
LD_DEBUG=symbols ./myapp # symbol lookup
LD_DEBUG=bindings ./myapp
LD_DEBUG=files ./myapp
LD_DEBUG=help ./myapp    # list every value
ldd -v ./myapp           # resolved paths and version needs
ldd ./myapp | grep "not found"
LD_PRELOAD=/path/to/alternate/libfoo.so.1 ./myapp   # substitute a version
```
