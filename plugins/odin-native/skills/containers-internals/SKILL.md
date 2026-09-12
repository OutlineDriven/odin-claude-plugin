---
name: containers-internals
description: 'Use when explaining or building on Linux container primitives: namespaces, cgroups v2, overlayfs, runc and the OCI spec, seccomp-bpf, capabilities, or escapes. Not for VM isolation: use qemu-kvm.'
---

# Containers internals

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A container's isolation or resource limit needs explaining or debugging, a seccomp profile needs writing, a minimal container is being built without a daemon, or an escape vector needs assessing. |
| Authority | Reversible local. The write set is namespaces and cgroups created for the session under `/sys/fs/cgroup`, overlay mounts on user-named directories, an OCI bundle directory, and seccomp filters applied to processes the skill starts. Rollback is stopping those processes, unmounting, and removing the cgroup directory. Most steps need root or a user namespace. No remote mutation. |
| Side effect | Kernel namespaces, cgroups, and mounts exist while the experiment runs. |
| Done | The isolation or limit in question is reproduced with the raw primitive, the observed behavior matches the explanation, and every created object has its teardown recorded. |

## Inputs

- Question or symptom (required): an OOM kill, CPU throttling, a permission denial inside the container, a mount failure, or a concept.
- Target (optional): a running container's PID, or a rootfs directory for a manual container.
- Privilege (required to know): root, or an unprivileged user relying on user namespaces. Several steps differ.

## Procedure

1. Read and enter namespaces. Each namespace type isolates one resource. Done when: the target process's namespace inodes are listed and, when needed, a shell runs inside them.

```bash
ls -la /proc/self/ns/            # one link per namespace type
readlink /proc/1234/ns/net       # compare inodes to see who shares a namespace
nsenter -t <pid> -m -u -i -n -p bash
unshare --fork --mount-proc --pid --net --uts --ipc bash   # a manual container shell
```

| Flag | Isolates |
|---|---|
| `CLONE_NEWNS` | Mount table |
| `CLONE_NEWPID` | Process ids |
| `CLONE_NEWNET` | Network stack |
| `CLONE_NEWUTS` | Hostname and domain name |
| `CLONE_NEWIPC` | System V IPC and POSIX message queues |
| `CLONE_NEWUSER` | Uid and gid mappings |
| `CLONE_NEWCGROUP` | The cgroup root the process sees |
| `CLONE_NEWTIME` | Boot-time and monotonic clock offsets |

```c
#define _GNU_SOURCE
#include <sched.h>
#include <sys/mount.h>
#include <unistd.h>

static int container_init(void *arg)
{
    sethostname("container", 9);
    mount("proc", "/proc", "proc", 0, NULL);
    execv("/bin/sh", (char *[]){"/bin/sh", NULL});
    return 1;
}

static char stack[1024 * 1024];
/* The child stack grows down, so pass the top of the buffer. */
clone(container_init, stack + sizeof stack,
      CLONE_NEWPID | CLONE_NEWNS | CLONE_NEWNET | SIGCHLD, NULL);
```

2. Apply a cgroups v2 limit. The unified hierarchy at `/sys/fs/cgroup` exposes one directory per group; a process joins by writing its pid to `cgroup.procs`. Done when: the limit file holds the value and `memory.events` or `cpu.stat` shows the effect under load.

```bash
mkdir /sys/fs/cgroup/mycontainer
echo $$ > /sys/fs/cgroup/mycontainer/cgroup.procs
echo 256M > /sys/fs/cgroup/mycontainer/memory.max     # hard memory limit
echo 50 > /sys/fs/cgroup/mycontainer/cpu.weight        # share relative to siblings; default 100
echo "50000 100000" > /sys/fs/cgroup/mycontainer/cpu.max   # quota and period in microseconds
echo "default 100" > /sys/fs/cgroup/mycontainer/io.weight
cat /proc/self/cgroup
cat /sys/fs/cgroup/mycontainer/memory.events           # oom and oom_kill counters
```

3. Build the filesystem with overlayfs. Reads fall through to the lower layers; writes land in the upper directory; `workdir` is overlayfs bookkeeping and must be empty and on the same filesystem as `upperdir`. Done when: the merged mount shows the union and a write appears only in `upperdir`.

```bash
mount -t overlay overlay -o lowerdir=lower1:lower2,upperdir=upper,workdir=work merged
```

Docker's `overlay2` driver keeps its layers under `/var/lib/docker/overlay2`.

4. Run the bundle with `runc`. `runc spec` writes a `config.json` whose `ociVersion` matches the installed runtime (runc 1.5.1 writes `1.3.0`); do not hand-edit that field. Edit `process.args`, `linux.namespaces`, `linux.resources`, `process.capabilities`, and `linux.seccomp`. Done when: `runc run` starts the container and `runc list` shows it.

```bash
mkdir -p mycontainer/rootfs        # populate rootfs first
runc spec -b mycontainer           # add --rootless when not root
runc run -b mycontainer mycontainer
runc list
```

5. Filter syscalls with seccomp-bpf. Done when: the filter loads and the blocked syscall returns the chosen action.

```c
#include <seccomp.h>
#include <errno.h>

scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(mount), 0);
seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(pivot_root), 0);
seccomp_load(ctx);
```

| Action | Effect |
|---|---|
| `SCMP_ACT_KILL_PROCESS` | Kill the whole process (`SCMP_ACT_KILL` kills only the calling thread) |
| `SCMP_ACT_ERRNO(n)` | Fail the call with `errno` `n` |
| `SCMP_ACT_TRAP` | Deliver `SIGSYS` |
| `SCMP_ACT_TRACE` | Notify a ptrace tracer |
| `SCMP_ACT_LOG` | Allow and write an audit record |
| `SCMP_ACT_NOTIFY` | Hand the call to a user-space supervisor |
| `SCMP_ACT_ALLOW` | Permit |

Docker's default profile ships in the moby repository under `profiles/seccomp/default.json`. To find the syscall a profile is missing, run the workload under `strace -f` first.

6. Drop capabilities. A container process should run as non-root with the smallest bounding set that still works. Done when: `capsh --print` or `getcap` shows only the intended capabilities.

```bash
capsh --drop=all --caps="cap_net_bind_service+eip" -- -c '/app/server'
setcap cap_net_bind_service+ep /usr/bin/myserver
getcap /usr/bin/myserver
```

7. Explain rootless mode. A user namespace maps container uid 0 to an unprivileged host uid, so root inside is an ordinary user outside. Rootless containers cannot mount most filesystems and hold no `CAP_SYS_ADMIN` on the host. Done when: `/proc/<pid>/uid_map` for the container shows the mapping.

```bash
cat /proc/self/uid_map      # "0 1000 1" maps container uid 0 to host uid 1000
```

8. Stack the escape mitigations: user namespace, seccomp, a mandatory access control profile (AppArmor or SELinux), a dropped capability set, a read-only root, `no-new-privileges`, and Landlock for filesystem scope. Known escape vectors are a mounted container-engine socket, privileged mode, kernel CVEs, and `/proc` leaks. Done when: each layer in use is named and the missing ones are listed.

```bash
docker run --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  --security-opt seccomp=default.json myimage
```

For policy depth (SELinux, AppArmor, seccomp) use `kernel-security`. To trace what a container does at the syscall level, use `ebpf`. For the kernel side of cgroups and namespaces, use `kernel-internals`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Container OOM-killed | `memory.max` was exceeded; `memory.events` shows `oom_kill`. Raise the limit or fix the leak. |
| CPU throttled | `cpu.max` quota is low; `cpu.stat` shows `nr_throttled`. Raise the quota or use `cpu.weight` for a soft share. |
| Permission denied inside the container | A needed capability was dropped. Add that one capability, not `CAP_SYS_ADMIN`. |
| Killed by seccomp at start | The profile lacks a syscall the runtime needs. Find it with `strace -f` and allow that syscall only. |
| Overlay mount fails | `workdir` is not empty or sits on a different filesystem than `upperdir`. Clean it and retry. |
| Rootless mount fails | The user namespace forbids it. Bind-mount from the host instead. |

## Output

The primitive used for each isolation or limit, the commands run, the observed effect, and the teardown list: cgroup directories to remove, mounts to unmount, and processes to stop.
