# eBPF map types

Source: https://docs.kernel.org/bpf/maps.html. Kernel version notes are the version that introduced the type; every type below exists on the grounded floor (Linux 7.2 mainline, 6.18 LTS).

## Types

| Type | Key | Value | Notes |
|---|---|---|---|
| `BPF_MAP_TYPE_HASH` | up to 512 bytes | up to 65536 bytes | General hash map |
| `BPF_MAP_TYPE_ARRAY` | `u32` | up to 65536 bytes | Fixed size, preallocated, zero-initialized |
| `BPF_MAP_TYPE_PROG_ARRAY` | `u32` | program fd | Tail-call table |
| `BPF_MAP_TYPE_PERF_EVENT_ARRAY` | `u32` | fd | Per-CPU perf ring, kernel 4.3 |
| `BPF_MAP_TYPE_PERCPU_HASH` | up to 512 bytes | up to 65536 bytes | Per-CPU values, no locking |
| `BPF_MAP_TYPE_PERCPU_ARRAY` | `u32` | up to 65536 bytes | Per-CPU array |
| `BPF_MAP_TYPE_STACK_TRACE` | `u32` | stack ids | Stack trace storage |
| `BPF_MAP_TYPE_CGROUP_ARRAY` | `u32` | cgroup fd | cgroup membership tests |
| `BPF_MAP_TYPE_LRU_HASH` | up to 512 bytes | up to 65536 bytes | Least-recently-used eviction, kernel 4.10 |
| `BPF_MAP_TYPE_LRU_PERCPU_HASH` | up to 512 bytes | up to 65536 bytes | Per-CPU LRU hash |
| `BPF_MAP_TYPE_LPM_TRIE` | variable | up to 65536 bytes | Longest-prefix match for addresses |
| `BPF_MAP_TYPE_ARRAY_OF_MAPS` | `u32` | map fd | Map in map |
| `BPF_MAP_TYPE_HASH_OF_MAPS` | up to 512 bytes | map fd | Map in map |
| `BPF_MAP_TYPE_DEVMAP` | `u32` | ifindex | XDP device redirect |
| `BPF_MAP_TYPE_SOCKMAP` | `u32` | socket fd | Socket redirect for `sk_msg` and `sk_skb` |
| `BPF_MAP_TYPE_CPUMAP` | `u32` | queue size | XDP redirect to a CPU |
| `BPF_MAP_TYPE_XSKMAP` | `u32` | socket fd | AF_XDP socket redirect |
| `BPF_MAP_TYPE_SOCKHASH` | variable | socket fd | Socket redirect by hash |
| `BPF_MAP_TYPE_CGROUP_STORAGE` | cgroup id | up to 65536 bytes | Per-cgroup storage |
| `BPF_MAP_TYPE_RINGBUF` | none | none | Shared ring buffer, kernel 5.8 |
| `BPF_MAP_TYPE_INODE_STORAGE` | inode | up to 65536 bytes | Per-inode local storage |
| `BPF_MAP_TYPE_TASK_STORAGE` | task | up to 65536 bytes | Per-task local storage |
| `BPF_MAP_TYPE_BLOOM_FILTER` | none | element | Probabilistic membership |

## Operations

Kernel side:

```c
void *bpf_map_lookup_elem(void *map, const void *key);
int bpf_map_update_elem(void *map, const void *key, const void *value, u64 flags); /* BPF_ANY, BPF_NOEXIST, BPF_EXIST */
int bpf_map_delete_elem(void *map, const void *key);
/* Increment a value in place with __sync_fetch_and_add(ptr, 1). */
```

User side with libbpf:

```c
#include <bpf/libbpf.h>

struct bpf_map *map = bpf_object__find_map_by_name(obj, "my_map");
int map_fd = bpf_map__fd(map);

bpf_map_lookup_elem(map_fd, &key, &value);
bpf_map_update_elem(map_fd, &key, &value, BPF_ANY);
bpf_map_delete_elem(map_fd, &key);

/* Walk every key. */
void *prev_key = NULL;
while (bpf_map_get_next_key(map_fd, prev_key, &key) == 0) {
    bpf_map_lookup_elem(map_fd, &key, &value);
    prev_key = &key;
}
```

## Ring buffer versus perf event array

| Property | `BPF_MAP_TYPE_RINGBUF` | `BPF_MAP_TYPE_PERF_EVENT_ARRAY` |
|---|---|---|
| Introduced | Kernel 5.8 | Kernel 4.3 |
| Memory | One shared buffer | One buffer per CPU |
| Variable-size records | Yes | Yes, with padding |
| Ordering | Preserved across CPUs | Not preserved |
| Backpressure | Reserve fails when full | Events drop |
| Kernel API | `bpf_ringbuf_reserve`, `bpf_ringbuf_submit`, `bpf_ringbuf_discard` | `bpf_perf_event_output` |
| User API | `ring_buffer__poll` | `perf_buffer__poll` |

```c
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_read")
int trace(void *ctx)
{
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;
    e->pid = bpf_get_current_pid_tgid() >> 32;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    bpf_ringbuf_submit(e, 0);
    return 0;
}
```

## Pinning

Pin a map to the BPF filesystem so a second program or a later run can reuse it.

```bash
mount -t bpf bpf /sys/fs/bpf          # once, if not mounted
bpftool map pin id 42 /sys/fs/bpf/my_map
```

```c
int map_fd = bpf_obj_get("/sys/fs/bpf/my_map");   /* reopen a pinned map */
```

Declare the pin in the program and the libbpf skeleton pins it by name at load:

```c
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, u32);
    __type(value, u64);
    __uint(pinning, LIBBPF_PIN_BY_NAME);   /* /sys/fs/bpf/<map name> */
} my_map SEC(".maps");
```
