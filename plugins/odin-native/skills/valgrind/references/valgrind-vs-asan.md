# Valgrind Memcheck and AddressSanitizer

Both find heap misuse. They differ in what they need from the build and in what they cannot see.

| Property | Valgrind Memcheck | AddressSanitizer |
|---|---|---|
| Slowdown | 10 to 50 times (Valgrind manual) | About 2 times (sanitizer documentation) |
| Recompile needed | No | Yes, `-fsanitize=address` on every object you want checked |
| Root needed | No | No |
| Heap out-of-bounds | Yes | Yes |
| Stack out-of-bounds | Limited (no redzones on stack objects) | Yes |
| Global out-of-bounds | No | Yes |
| Use after free | Yes | Yes |
| Use after return | No | Yes, with `detect_stack_use_after_return=1` |
| Uninitialised reads | Yes, with origin tracking | No; MemorySanitizer covers this on Clang |
| Leak detection | Yes | Yes, through LeakSanitizer |
| Works on unmodified third-party binaries | Yes | No |

Pick AddressSanitizer when the build is under your control and the suite runs often: the speed lets it gate every commit, and it sees stack and global overflows Memcheck misses. Use `address-sanitizer` for that setup.

Pick Memcheck when the binary cannot be rebuilt, when the bug is a read of uninitialised memory, when the question is cache or call-graph or heap-growth profiling (Cachegrind, Callgrind, Massif have no sanitizer equivalent), or when the toolchain predates sanitizer support.

Do not run a sanitizer-instrumented binary under Valgrind. Both replace `malloc` and `free`, and the combination is unsupported. A workable split is AddressSanitizer in the per-commit suite and a nightly Memcheck pass on the uninstrumented release build for uninitialised-value coverage.

Related sanitizer builds, each its own run:

```bash
clang -fsanitize=address,undefined -g -O1 -o prog main.c   # heap, stack, globals, UB
clang -fsanitize=memory -g -O1 -o prog main.c             # uninitialised reads; Clang only, whole program instrumented
clang -fsanitize=thread -g -O1 -o prog main.c             # data races
```
