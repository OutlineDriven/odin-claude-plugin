# Interpreter dispatch benchmark notes

## Relative dispatch cost

The ordering below is consistent across published interpreter work, while the exact multipliers vary by workload and CPU. Treat them as magnitudes, not constants.

| Strategy | Relative throughput | Branch behavior |
|----------|--------------------|-----------------------------|
| `switch` dispatch | 1x baseline | One shared indirect branch, hard to predict for mixed opcode streams |
| Computed goto | roughly 1.5 to 3x | One indirect branch per opcode, per-opcode training |
| Subroutine threading | near 1.5x | Call overhead, benefits from per-call-site BTB entries |
| Direct threading | roughly 2 to 4x | Like computed goto with pointer-sized bytecode |
| Native JIT | an order of magnitude and more | No dispatch on hot paths |

Measure on your own workload with the loop profile before believing any multiplier.

## Measuring dispatch overhead

```bash
perf record -g -F 9999 ./my_interpreter benchmark.bc
perf report --no-children
```

High self time on the indirect jump instruction, not inside handlers, means the shared indirect branch is mispredicting. Computed goto or a tracing JIT addresses exactly that line.

## Tiering

Production runtimes tier their execution. The thresholds below are common shapes, not laws; each runtime tunes them from its own traces.

| Tier | Strategy | Activation shape |
|------|---------|-----------|
| Interpreter | Switch or computed goto | Always on |
| Baseline JIT | Direct codegen, no optimization | After a small call or loop count |
| Optimizing JIT | Speculative, inline caches, SSA | After a larger count with stable types |

LuaJIT records a loop trace once a loop turns hot, after a small fixed number of iterations. V8 tiers function-level from its bytecode interpreter through a mid tier to its optimizing compiler. Copy the shape, then tune the counts on your own workload.

## VM struct layout

Pack hot state first so one line covers the fields touched by every instruction:

```c
typedef struct VM {
    Value   *sp;        // touched every instruction
    uint8_t *ip;        // touched every instruction
    Value   *stack;     // stack base
    Value   *locals;    // current frame
    int     call_depth;
    GC      *gc;
    Table   *globals;   // cold fields below
} VM;
```

The goal is that reading `sp` and `ip` never costs a miss in the dispatch loop.
