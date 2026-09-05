---
name: rdma-verbs
description: 'Use when programming InfiniBand or RoCE with libibverbs: device setup, memory registration, queue pairs, send/recv or RDMA write, completion polling, or perftest benchmarks. Not for MPI: use mpi.'
---

# RDMA verbs

libibverbs (rdma-core) exposes the network adapter's queues to user space. A program registers memory once, posts work requests to a queue pair, and reads completions from a completion queue; the kernel is out of the data path. Two-sided operations (`IBV_WR_SEND` with a posted receive) involve both CPUs; one-sided operations (`IBV_WR_RDMA_WRITE`, `IBV_WR_RDMA_READ`) touch remote memory without the remote CPU. The same API runs over InfiniBand fabrics and over RoCE on Ethernet.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user builds low-latency networking or storage on RDMA, needs a queue pair brought to a connected state, debugs a completion error, or wants fabric bandwidth and latency numbers from perftest. |
| Authority | Reversible local: writes only C or Rust source files and their build outputs in the working directory; rollback is deleting them. Kernel module loads, `rdma link add`, switch configuration, and `ulimit` changes are proposed to the user, never applied. No remote mutation. |
| Side effect | Source and binaries on disk. perftest runs traffic between two hosts the user names. |
| Done | The program registers memory, creates a queue pair, moves it through `INIT`, `RTR`, and `RTS`, exchanges data, and every completion is checked against `IBV_WC_SUCCESS`; or the benchmark numbers are recorded with device, GID index, and message size. |

## Inputs

- A host with an RDMA device: `ibv_devices` lists them, `ibv_devinfo` prints ports, link layer, and GIDs. Without hardware, soft-RoCE works for development: `rdma link add rxe0 type rxe netdev eth0` (iproute2), after the `rdma_rxe` module is available.
- Transport choice: `IBV_QPT_RC` (reliable, connected, one queue pair per peer; the default), `IBV_QPT_UC` (unreliable, connected), `IBV_QPT_UD` (unreliable datagram, many peers per queue pair; MPI and discovery use it).
- Headers and libraries: `infiniband/verbs.h` with `-libverbs`; `rdma/rdma_cma.h` with `-lrdmacm` for connection management (`pkg-config --libs libibverbs librdmacm`).
- An out-of-band channel (a TCP socket, or librdmacm) to exchange queue pair number, packet sequence number, LID or GID, and for one-sided operations the remote address and `rkey`.
- `ulimit -l`: libibverbs warns at startup when `RLIMIT_MEMLOCK` is 32 KiB or less, because registered memory is pinned.

## Procedure

1. Open the device and allocate resources. This sequence compiles and runs with `gcc -o rdma_setup rdma_setup.c -libverbs`:

   ```c
   #include <infiniband/verbs.h>
   #include <stdio.h>

   int main(void) {
       int n;
       struct ibv_device **list = ibv_get_device_list(&n);
       if (!list || n == 0) { fprintf(stderr, "No RDMA devices\n"); return 1; }
       struct ibv_context *ctx = ibv_open_device(list[0]);
       struct ibv_pd *pd = ibv_alloc_pd(ctx);

       static char buf[4096];
       struct ibv_mr *mr = ibv_reg_mr(pd, buf, sizeof buf,
                                      IBV_ACCESS_LOCAL_WRITE | IBV_ACCESS_REMOTE_WRITE);
       struct ibv_cq *cq = ibv_create_cq(ctx, 16, NULL, NULL, 0);
       struct ibv_qp_init_attr attr = {
           .send_cq = cq, .recv_cq = cq,
           .cap = { .max_send_wr = 16, .max_recv_wr = 16, .max_send_sge = 1, .max_recv_sge = 1 },
           .qp_type = IBV_QPT_RC,
       };
       struct ibv_qp *qp = ibv_create_qp(pd, &attr);
       printf("qp_num %u lkey %u rkey %u\n", qp->qp_num, mr->lkey, mr->rkey);

       ibv_destroy_qp(qp); ibv_dereg_mr(mr); ibv_destroy_cq(cq);
       ibv_dealloc_pd(pd); ibv_close_device(ctx); ibv_free_device_list(list);
       return 0;
   }
   ```

   `ibv_reg_mr` access flags gate what the remote side may do: add `IBV_ACCESS_REMOTE_READ` for RDMA reads into this buffer. Done when: the program prints the queue pair number and keys.
2. Exchange connection data out of band. For a reliable connected queue pair each side needs the peer's `qp_num`, an initial packet sequence number, and either the LID (InfiniBand) or the GID with its index (RoCE), plus `remote_addr` and `rkey` for one-sided operations. Send them over a TCP socket before any verbs traffic, or let librdmacm do it: `rdma_create_event_channel`, `rdma_create_id`, `rdma_resolve_addr`, `rdma_resolve_route`, `rdma_connect` on the client and `rdma_listen`, `rdma_accept` on the server, which also creates and transitions the queue pair. Done when: both sides hold the peer's parameters.
3. Transition the queue pair with `ibv_modify_qp` through three states. `IBV_QPS_INIT` sets `pkey_index`, `port_num`, and `qp_access_flags`. `IBV_QPS_RTR` (ready to receive) sets `path_mtu`, `dest_qp_num`, `rq_psn`, `max_dest_rd_atomic`, `min_rnr_timer`, and `ah_attr` (with `is_global` and `grh` filled for RoCE). `IBV_QPS_RTS` (ready to send) sets `sq_psn`, `timeout`, `retry_cnt`, `rnr_retry`, and `max_rd_atomic`. Each call passes the mask of attributes it sets (`IBV_QP_STATE | IBV_QP_PKEY_INDEX | ...`). Post receives before the peer reaches `RTS`, or the first send arrives with no buffer. Done when: `ibv_modify_qp` returns 0 for all three transitions on both sides.
4. Two-sided transfer. Post a receive, then a send, then poll:

   ```c
   struct ibv_sge rsge = { .addr = (uintptr_t)recv_buf, .length = 4096, .lkey = mr->lkey };
   struct ibv_recv_wr rwr = { .wr_id = 1, .sg_list = &rsge, .num_sge = 1 }, *bad_rwr;
   ibv_post_recv(qp, &rwr, &bad_rwr);

   struct ibv_sge ssge = { .addr = (uintptr_t)send_buf, .length = msg_len, .lkey = mr->lkey };
   struct ibv_send_wr swr = { .wr_id = 2, .opcode = IBV_WR_SEND, .send_flags = IBV_SEND_SIGNALED,
                              .sg_list = &ssge, .num_sge = 1 }, *bad_swr;
   ibv_post_send(qp, &swr, &bad_swr);

   struct ibv_wc wc;
   while (ibv_poll_cq(cq, 1, &wc) == 0) { }
   if (wc.status != IBV_WC_SUCCESS)
       fprintf(stderr, "wr %llu: %s\n", (unsigned long long)wc.wr_id, ibv_wc_status_str(wc.status));
   ```

   `IBV_SEND_SIGNALED` requests a completion for the send; without it the send queue fills silently. Busy polling burns a core; `ibv_req_notify_cq` with a completion channel blocks instead. Done when: a completion with `IBV_WC_SUCCESS` arrives for each posted request.
5. One-sided write. No receive is posted on the remote side; the data lands at `remote_addr`:

   ```c
   struct ibv_sge sge = { .addr = (uintptr_t)local_buf, .length = len, .lkey = local_mr->lkey };
   struct ibv_send_wr wr = { .wr_id = 3, .opcode = IBV_WR_RDMA_WRITE, .send_flags = IBV_SEND_SIGNALED,
                             .sg_list = &sge, .num_sge = 1 }, *bad;
   wr.wr.rdma.remote_addr = remote_addr;
   wr.wr.rdma.rkey = remote_rkey;
   ibv_post_send(qp, &wr, &bad);
   ```

   The remote CPU learns of the write only by polling its memory or by a following send. `IBV_WR_RDMA_READ` pulls data the same way with `IBV_ACCESS_REMOTE_READ` on the remote registration. Done when: the remote buffer holds the bytes and the local completion is `IBV_WC_SUCCESS`.
6. Pick the fabric settings. InfiniBand addresses by LID assigned by the subnet manager; RoCE addresses by GID (RoCEv2 GIDs encode the IP address) and needs a lossless Ethernet configuration (PFC, ECN, and a congestion control such as DCQCN) on the switches. Read a port's GIDs from `/sys/class/infiniband/<dev>/ports/1/gids/<index>` and their type from `/sys/class/infiniband/<dev>/ports/1/gid_attrs/types/<index>`; pass the index as `-x` to perftest and as `ah_attr.grh.sgid_index` in `RTR`. Done when: the GID index and link layer are recorded.
7. Benchmark with perftest before optimizing code. Server: `ib_send_bw -d mlx5_0 -x 3`. Client: `ib_send_bw -d mlx5_0 -x 3 <server_ip>`. `ib_send_lat` measures latency, `ib_write_bw` one-sided write bandwidth, `-R` connects through librdmacm, `-F` keeps running when the CPU governor is not at maximum frequency. `ibstat` from infiniband-diags and perftest's multicast path need the `ib_umad` module. Done when: bandwidth and latency are recorded with device, GID index, and message size, and the application's numbers are compared against them.
8. Rust. The `rdma-sys` crate (0.3.0, datenlord) binds libibverbs and librdmacm one to one; `async-rdma` (0.5.0, GPL-3.0) layers a Tokio API on it and has had no release since 2023-02. Wrap the raw bindings in owning types whose `Drop` runs `ibv_destroy_qp`, `ibv_dereg_mr`, `ibv_destroy_cq`, `ibv_dealloc_pd`, and `ibv_close_device` in that order. Done when: every verbs resource has one owner and the teardown order is encoded.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| `ibv_get_device_list` returns none | Driver not loaded or no device | Propose `modprobe mlx5_ib` (or the vendor module); check `ibv_devices`; use soft-RoCE for development |
| `ibv_reg_mr` fails | `RLIMIT_MEMLOCK` too low, or access flags mismatch | Propose raising `ulimit -l` (unlimited for RDMA hosts); check the flag set |
| Completion status `remote invalid request error` (`IBV_WC_REM_INV_REQ_ERR`) | Stale `rkey` or `remote_addr` after a reconnect | Re-exchange registration data on every connection |
| `ibv_modify_qp` to `RTS` fails | Wrong PSN, LID, GID index, or MTU mismatch | Compare both sides' exchanged values; check `ibv_devinfo` for the active MTU and link layer |
| Sender completion `RNR retry counter exceeded` (`IBV_WC_RNR_RETRY_EXC_ERR`) | Receive posted after the send arrived, so the receiver was not ready | Post receives before the peer's `RTS` transition |
| Low bandwidth on RoCE | Packet loss without PFC | Enable lossless Ethernet on the switch path; confirm with `ib_send_bw` before blaming code |
| Low bandwidth with small messages | Per-request overhead dominates | Batch into larger work requests; raise MTU; use inline data for small sends |
| Polling loop pins a core | Busy `ibv_poll_cq` | `ibv_req_notify_cq` with a completion channel, or poll from the thread that already owns the core |

## Output

Working verbs code with resource setup, out-of-band exchange, the three queue pair transitions, data transfer, and completion checking, plus the recorded device, link layer, GID index, MTU, and the perftest bandwidth and latency numbers the application is measured against.
