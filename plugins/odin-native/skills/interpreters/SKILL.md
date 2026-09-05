---
name: interpreters
description: 'Use when designing bytecode dispatch loops, choosing stack or register VM shapes, adding inline caches, or building a first JIT with mmap. Not for a language toolchain: use compiler-frontend.'
---

# Interpreters and bytecode VMs

An interpreter's speed is decided by its dispatch loop and its value representation. Pick those two first; everything else is negotiable.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task implements or speeds up a bytecode interpreter, chooses dispatch strategy, designs value tagging, adds inline caches, or writes a small JIT. |
| Authority | Reversible local: writes only the interpreter source, build files, and scratch benchmark files the user names; rollback is version control. No remote mutation. |
| Side effect | Local writes to source and build outputs. JIT pages are created with `mmap` and `mprotect` inside the program under development. |
| Done | The interpreter runs the benchmark workload end to end, and a measured comparison backs every performance claim made about it. |

## Inputs

- The language or bytecode format: required, existing or being designed.
- The compiler toolchain: required. Computed goto needs GCC or Clang.
- A benchmark program: required for every performance decision.
- The target platforms: required when a JIT is in scope, because executable-memory rules differ.

## Procedure

1. Choose stack or register bytecode. Stack bytecode is compact and trivial to generate; register bytecode runs fewer dispatch cycles per expression and pays for it with register allocation in the compiler front end. Done when: the choice is written down with the workload that decides it.

| Style | Trade |
|------|-------|
| Stack based | Compact code, simple compiler, more dispatches per expression. CPython and Wasm sit here. |
| Register based | Fewer dispatches, better for complex expressions, needs register allocation. Lua 5 sits here. |

2. Write the dispatch loop. Start with a `switch`; it is correct and portable. Then compare computed goto, which gives each opcode its own indirect branch so the predictor trains per opcode. Done when: the benchmark runs and the dispatch strategy is chosen from its measurement, not from habit.

```c
// switch form: one indirect branch serves every opcode
while (1) {
    uint8_t op = *ip++;
    switch (op) {
        case OP_ADD: { Value b = pop(); Value a = pop(); push(a + b); } break;
        case OP_HALT: return;
    }
}
```

```c
// computed goto: one indirect branch per opcode, GCC and Clang only
static const void *dispatch_table[] = {
    [OP_ADD]  = &&op_add,
    [OP_HALT] = &&op_halt,
};
#define DISPATCH() goto *dispatch_table[*ip++]

op_add: { Value b = pop(); Value a = pop(); push(a + b); DISPATCH(); }
op_halt: return;
```

Guard the goto form with `#ifdef __GNUC__` and keep the switch as the fallback for other compilers.

3. Represent values without a memory round trip per operation. Tagged pointers keep the tag in the low bits of an aligned word. NaN boxing stores non-double values inside quiet-NaN bit patterns, which is how LuaJIT boxes everything in one double-sized slot. Done when: the hot arithmetic path never allocates.

```c
typedef uintptr_t Value;
#define TAG_MASK 0x3u

#define MAKE_INT(x)  ((((uint64_t)(int64_t)(x)) << 2) | 0x0)
#define IS_INT(v)    (((v) & TAG_MASK) == 0x0)
#define INT_VAL(v)   ((int64_t)(v) >> 2)   // sign-extends through the tag bits
```

4. Bound the value stack. Fixed size with an explicit check beats unbounded growth, and the check belongs in the push path, not the opcode handlers. Done when: a deliberately deep program fails with the VM's own stack overflow error.

```c
#define STACK_SIZE 4096
Value stack[STACK_SIZE];
Value *sp = stack;

#define PUSH(v) do { if (sp >= stack + STACK_SIZE) vm_error("stack overflow"); *sp++ = (v); } while (0)
#define POP()   (*--sp)
```

5. Add an inline cache to every polymorphic site. Cache the last receiver type at the call site; on a hit, call the cached method without lookup. Done when: a hot call site shows a hit rate in the profile.

```c
struct call_site {
    uint32_t cached_type;      // last observed receiver type
    void (*cached_method)(VM *);
    uint32_t miss_count;
};

void invoke(VM *vm, struct call_site *cs, Value receiver) {
    uint32_t t = value_type(receiver);
    if (t == cs->cached_type) {
        cs->cached_method(vm);
        return;
    }
    cs->cached_method = lookup_method(t);
    cs->cached_type = t;
    cs->miss_count++;
    cs->cached_method(vm);
}
```

Extend to a polymorphic cache of a few type and method pairs when profiling shows a site serving several stable types.

6. Add a first JIT by writing machine code into an executable page. Write into `PROT_READ|PROT_WRITE` memory, then switch the page to `PROT_READ|PROT_EXEC` before calling it. On Apple silicon, `MAP_JIT` plus `pthread_jit_write_protect_np` replaces the switch. Done when: the compiled function runs and returns the expected value.

```c
#include <sys/mman.h>
#include <string.h>

typedef int (*jit_fn)(int, int);

jit_fn compile_add(void) {
    // add edi, esi ; mov eax, edi ; ret   in System V argument order
    static const uint8_t code[] = {
        0x01, 0xF7,   // add %esi, %edi
        0x89, 0xF8,   // mov %edi, %eax
        0xC3,         // ret
    };
    void *mem = mmap(NULL, sizeof(code), PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (mem == MAP_FAILED) return NULL;
    memcpy(mem, code, sizeof(code));
    mprotect(mem, sizeof(code), PROT_READ | PROT_EXEC);  // W^X: never write and exec at once
    return (jit_fn)mem;
}
```

7. Profile before optimizing further. High self time on the indirect jump means dispatch mispredicts; high time in `lookup` means the caches are missing. Done when: the next change on the list is justified by a profile line, not by folklore.

```bash
perf record -g ./my_interp bench.bytecode
perf report --no-children
```

8. Keep hot VM state in one or two cache lines. Put `sp` and `ip` first in the VM struct. Keeping `sp` in a fixed register through a global register variable is a GCC and Clang trick that costs an otherwise usable register; measure it before keeping it. Done when: the struct layout matches the access frequency.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Computed goto fails to compile | The compiler is not GCC or Clang, or the guard is missing. Use the switch fallback. |
| JIT page crashes on execute | The page stayed `PROT_WRITE` or the W^X switch ran after the call. Apply `mprotect` before invoking. |
| JIT code corrupts state | The emitted code broke the ABI, usually a missing save of a callee-saved register or bad alignment before `call`. Check the emission against the ABI. |
| Inline cache never hits | The receiver type alternates every call. Widen to a polymorphic cache or fall back to the generic path. |
| Stack overflow reported late | The push macro checked after writing. Reorder the check before the store. |
| Benchmark says the rewrite is slower | Revert. The dispatch strategy interacts with branch predictor state that the microbenchmark may not reproduce. |

## Output

A working interpreter with the chosen dispatch, value representation, and caching, plus a measured before and after for each performance change. The relative dispatch strategy figures and tiering notes are in `references/benchmarks.md`.
