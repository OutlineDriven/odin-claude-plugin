---
name: numa-programming
description: 'Use when detecting NUMA topology, binding processes with numactl, using the libnuma API, building NUMA-aware data structures, or measuring remote memory access penalties.'
---

# NUMA programming

## Contract

| Field | Bound contract |
|---|---|
| Trigger | NUMA-aware programming or debugging on multi-socket Linux systems. |
| Authority | Read-only. No source or remote mutation. Chat output only. |
| Side effect | Emits a structured guidance report to chat. |
| Done | The report shows the NUMA topology, the right `numactl` binding, libnuma API usage, a per-node data structure pattern, remote access diagnosis, and a decision tree. |

## Inputs

1. **Target system** (required): a multi-socket Linux host or VM with NUMA exposed.
2. **Workload symptom** (optional): poor scaling, memory bandwidth saturation, remote access, or unexpected page migration.
3. **Tools available** (optional): `numactl`, `numactl-dev`, `libnuma-dev`, `perf`, `lstopo`.

## Procedure

1. **Detect the NUMA topology.** Run `numactl --hardware`, `lstopo --of console`, and read `/sys/devices/system/node/node*/meminfo` and `node*/cpulist`. A distance value of 10 usually means local access; larger values indicate remote access. Done when: the node count, CPU lists, memory sizes, and distance matrix are reported.

   Typical output from `numactl --hardware`:

   ```
   available: 2 nodes (0-1)
   node 0 cpus: 0-15
   node 0 size: 65536 MB
   node 1 cpus: 16-31
   node 1 size: 65536 MB
   node distances:
   node   0   1
     0:  10  21
     1:  21  10
   ```

2. **Bind a process with `numactl`.** Use `--cpunodebind` and `--membind` for strict local placement, `--interleave=all` to spread memory, `--preferred` for a preferred node with fallback, and `--show` to inspect the current policy. Done when: the binding command and policy are selected.

   ```bash
   numactl --cpunodebind=0 --membind=0 ./myapp
   numactl --interleave=all ./myapp
   numactl --preferred=0 ./myapp
   numactl --show
   ```

3. **Use the libnuma API.** Call `numa_available`, `numa_node_of_cpu`, `numa_alloc_onnode`, `numa_alloc_local`, `mbind`, `set_mempolicy`, and `move_pages`. Compile with `-lnuma`. Done when: the C example and API table are shown.

   ```c
   #include <numa.h>
   #include <numaif.h>
   #include <stdio.h>

   int main(void) {
       if (numa_available() < 0) {
           fprintf(stderr, "NUMA not available\n");
           return 1;
       }
       int node = numa_node_of_cpu(0);
       printf("CPU 0 on node %d\n", node);

       size_t size = 1024 * 1024 * 1024;
       void *mem = numa_alloc_onnode(size, 0);
       if (!mem) return 1;

       unsigned long nodemask = 1UL << 0;
       mbind(mem, size, MPOL_BIND, &nodemask, sizeof(nodemask) * 8, 0);

       numa_free(mem, size);
       return 0;
   }
   ```

   ```bash
   gcc -o numa_test numa_test.c -lnuma
   ```

   | API | Purpose |
   |---|---|
   | `numa_alloc_onnode` | Allocate on a specific node |
   | `numa_alloc_local` | Allocate on the current CPU node |
   | `mbind` | Set policy on an existing mapping |
   | `set_mempolicy` | Default policy for later allocations |
   | `move_pages` | Migrate pages to a target node |

4. **Build NUMA-aware data structures.** Create a per-node pool and allocate from the node of the current CPU. Pin threads to cores on the same node. Done when: the per-node allocation pattern is shown.

   ```c
   #include <numa.h>
   #include <sched.h>

   #define BLOCK_SIZE 64
   #define MAX_NODES 8

   struct per_node_pool {
       void *free_list[MAX_NODES];
       int node_count;
   };

   void *pool_alloc_numa(struct per_node_pool *p) {
       int node = numa_node_of_cpu(sched_getcpu());
       void *blk = p->free_list[node];
       if (blk) {
           p->free_list[node] = *(void **)blk;
           return blk;
       }
       return numa_alloc_onnode(BLOCK_SIZE, node);
   }
   ```

5. **Align thread affinity.** Bind threads to CPUs on a node with `pthread_setaffinity_np` or `numactl --cpunodebind`. Match memory allocation to the same node. Done when: the affinity and memory binding match.

   ```c
   #include <pthread.h>
   #include <sched.h>

   cpu_set_t cpuset;
   CPU_ZERO(&cpuset);
   CPU_SET(target_cpu, &cpuset);
   pthread_setaffinity_np(pthread_self(), sizeof(cpuset), &cpuset);
   ```

6. **Diagnose remote access.** Run `perf stat -e cache-misses,cache-references,node-load-misses` with CPU and memory bindings on different nodes. Compare against local-local binding. Use `node-loads` and `node-load-misses` if the kernel exposes them. Done when: the remote access signature is identified.

   ```bash
   perf stat -e cache-misses,cache-references,node-load-misses \
       numactl --cpunodebind=0 --membind=1 ./myapp

   perf stat numactl --cpunodebind=0 --membind=0 ./myapp
   perf stat -e node-loads,node-load-misses,node-stores ./myapp
   ```

7. **Measure the remote access penalty.** Touch a large buffer on the local node and then on a remote node. Time the loops. Remote access can be 1.5x to 3x slower than local access on recent multi-socket x86/AMD64 systems with QPI/UPI/Infinity Fabric, depending on the workload and interconnect. Done when: the measurement method is given.

   ```c
   clock_t start = clock();
   for (size_t i = 0; i < size; i += 4096)
       sum += ((char *)mem)[i];
   ```

8. **Visualize with `lstopo`.** Run `lstopo` for a graphical view, `lstopo --of ascii` for text, or `lstopo file.png` for an image. Done when: the visualization command is selected.

   ```bash
   lstopo
   lstopo --of ascii
   lstopo file.png
   ```

9. **Walk the decision tree.** Check topology, verify CPU and memory are on the same node, measure `node-load-misses`, then choose `numactl --membind=local`, per-node partitioning, or memory bandwidth reduction. Done when: the next action is named.

   ```
   Poor scaling on multi-socket?
   ├── Check numactl --hardware
   ├── Verify thread and memory on the same node
   ├── perf stat node-load-misses
   ├── Remote misses high?
   │   ├── numactl --membind=local
   │   └── Per-node data partitioning
   └── Still slow: memory bandwidth bound; reduce sharing
   ```

## Failure and recovery

| Failure class | Behavior |
|---|---|
| OOM on one node despite free RAM elsewhere | `MPOL_BIND` is too strict. Use `--preferred` or `--interleave`. |
| 2x slower after scaling threads | Threads access remote memory. Bind memory to the same node as the CPU. |
| Inconsistent benchmark results | The OS migrated pages. Use `mbind` with `MPOL_BIND` or lock pages with `mlock` if needed. |
| DPDK NIC on the wrong socket | The PCI device is far from the CPU. Use `lstopo` and bind EAL to the local socket. |
| libnuma not found | The `libnuma-dev` package is missing. Install it with the system package manager. |
| First-touch policy surprise | Allocation happened on node 0 but the thread ran on node 1. Allocate from a bound thread. |

## Output

1. The NUMA topology and distance matrix.
2. A `numactl` binding command.
3. libnuma API calls for the use case.
4. A per-node data structure and affinity pattern.
5. A remote access measurement and a decision tree.
