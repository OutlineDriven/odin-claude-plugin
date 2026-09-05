# strace and ltrace recipes

Every flag here was exercised against strace 6.19 and ltrace 0.7.91 or read from their man pages.

## Line format

```text
syscall(arg1, arg2, ...) = return_value [ERRNO (message)]
```

```text
openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3
read(3, "root:x:0:0:root:/root:/bin/bash\n"..., 4096) = 1234
mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f1234567000
clone(child_stack=NULL, flags=CLONE_VM|CLONE_FS|...) = 12346
openat(AT_FDCWD, "/missing", O_RDONLY) = -1 ENOENT (No such file or directory)
+++ exited with 0 +++
```

With `-y`, descriptors carry their path: `read(3</etc/passwd>, ...)`. With `-f`, each line is prefixed `[pid 12346]`.

## Binary will not start

```bash
strace -f -e trace=execve ./myapp            # ENOEXEC: wrong architecture or bad #! line
strace -Z -e trace=openat ./myapp            # missing shared libraries appear as ENOENT on .so paths
```

For the loader's own search, `dynamic-linking` covers `LD_DEBUG` and RPATH; `elf-inspection` reads the binary's declared dependencies.

## File not found

```bash
strace -f -Z -e trace=%file ./myapp          # every failing path operation
strace -e trace=openat ./myapp 2>&1 | grep -o '"[^"]*"'   # every path the program tried, in order
```

The order of attempts shows the search path the program walks; the first `ENOENT` in the expected directory is usually the misconfiguration.

## Network

```bash
strace -f -s 256 -e trace=connect ./myapp                       # every connection attempt with its address
strace -f -e trace=%network -s 256 ./myapp                      # sockets, binds, sends, receives
strace -f -e trace=openat,connect,sendto,recvfrom ./myapp 2>&1 | grep -E 'resolv|:53'   # DNS path
```

`ECONNREFUSED` on `connect` means nothing listens at that address; `EADDRINUSE` on `bind` means the port is held; `EINPROGRESS` on a non-blocking `connect` is normal and the result arrives in a later `poll` or `getsockopt`.

## Permissions and policy

```bash
strace -f -Z -e trace=%file,%creds ./myapp    # EACCES and EPERM with the operation that hit them
strace -f -e trace=%creds ./myapp             # setuid, setgid, capget, capset, prctl
strace -f ./myapp 2>&1 | tail -20             # the last calls before a SIGSYS (seccomp) or SIGKILL
```

## Memory

```bash
strace -e trace=%memory ./myapp 2>&1 | grep -E 'ENOMEM'
strace -e trace=mmap,getrlimit,setrlimit,prlimit64 ./myapp
```

## Summary profile

```text
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 62.34    0.012456         124       100        12 read
 18.91    0.003782          37       102           write
 11.23    0.002246        1123         2           futex
```

`% time` shows where kernel time goes, `usecs/call` marks blocking calls, `errors` marks retries. `strace -c -f` includes children. `-w` switches the table to wall-clock time per call instead of system time.

## ltrace filters

The filter grammar is `{[+-][symbol_pattern][@library_pattern]}`; symbols join with `+`, and `-` excludes.

```bash
ltrace -e malloc+calloc+realloc+free ./myapp
ltrace -e 'str*' ./myapp                     # glob over string functions
ltrace -e 'fopen+fclose+fread+fwrite' ./myapp
ltrace -e 'printf+fprintf+sprintf+snprintf' -s 256 ./myapp
ltrace -e 'pthread_*' ./myapp
ltrace -e 'dlopen+dlsym+dlclose' ./myapp
ltrace -e 'malloc+free-@libc.so*' ./myapp    # malloc and free from anywhere except libc itself
ltrace -l 'libssl.so*' ./myapp               # every call into one library
```

## From strace to the code location

`-k` prints a stack per traced syscall, which is often enough:

```bash
strace -k -Z -e trace=openat ./myapp
```

When a breakpoint is needed, `gdb` catches the syscall directly:

```text
(gdb) catch syscall openat
(gdb) run
(gdb) bt
```

## Containers

`ptrace` is not in the default container capability set. Docker: `docker run --cap-add=SYS_PTRACE image strace ./myapp`. Kubernetes: add `SYS_PTRACE` under `securityContext.capabilities.add`. Confirm with `strace -o /dev/null true` inside the container before tracing the real workload.
