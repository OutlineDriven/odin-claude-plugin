---
name: kernel-testing
description: 'Use when writing KUnit tests, adding kselftest cases, fuzzing syscalls with syzkaller and kcov, running LTP, or wiring CI for a kernel patch.'
---

# Kernel testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Unit-testing kernel library or driver helper code, adding a regression test under `tools/testing/selftests/`, fuzzing syscall or ioctl surfaces, measuring kernel coverage, or standing up CI for patches. |
| Authority | Reversible local: writes only test files, Kconfig fragments, and fuzzing configs inside the tree; rollback is version control. No remote mutation. |
| Side effect | Test sources, a Kconfig fragment, a syzkaller config, and run transcripts. |
| Done | The chosen layer has a test that runs green, or a minimized crash reproduction, and the run transcript shows the counts. |

## Inputs

1. Code under test (required): a kernel function, driver helper, syscall surface, or a patch.
2. Kernel tree and build (required): the checkout the tests run against; mainline 7.2 or LTS 6.18 assumed.
3. Coverage or fuzzing target (optional): syzkaller VM budget, LTP subset.

## Procedure

1. **Choose the layer before writing anything.**

   ```
   Pure kernel function logic            -> KUnit
   Userspace-visible behavior (syscall)  -> kselftest
   Crash and security hunting            -> syzkaller + KASAN
   Regression across distros             -> LTP
   Upstream patch CI                     -> build, boot, kselftest ladder
   ```

   Done when: the surface under test names its layer.
2. **Write the KUnit suite for kernel-context logic.**

   ```c
   #include <kunit/test.h>

   static void example_test(struct kunit *test)
   {
       KUNIT_EXPECT_EQ(test, 1 + 1, 2);
   }

   static struct kunit_case cases[] = {
       KUNIT_CASE(example_test),
       {}
   };
   static struct kunit_suite suite = {
       .name = "example",
       .test_cases = cases,
   };
   kunit_test_suite(suite);
   MODULE_LICENSE("GPL");
   ```

   Allocate test memory with `kunit_kmalloc` so the test core frees it. Build with `obj-$(CONFIG_KUNIT) += test_example.o` and run:

   ```bash
   ./tools/testing/kunit/kunit.py run
   ./tools/testing/kunit/kunit.py run --filter=example_test
   ./tools/testing/kunit/kunit.py run --arch arm64 --cross_compile aarch64-linux-gnu-
   ```

   KUnit executes in kernel context, under UML by default or on a real target with `--arch`. Done when: `kunit.py run` reports the suite green.
3. **Add the kselftest case for userspace-visible behavior.** A new test lives in `tools/testing/selftests/<name>/` with a Makefile, the sources, and a `config` file naming required Kconfig symbols.

   ```makefile
   # tools/testing/selftests/mytest/Makefile
   CFLAGS += -Wall
   TEST_GEN_FILES := mytest
   TEST_PROGS := mytest
   include ../lib.mk
   ```

   ```bash
   cd tools/testing/selftests && make -j$(nproc)   # build
   make run_tests                                  # run all
   ./memfd/memfd_test                              # run one
   ```

   A `SKIP` result means a kernel feature is missing, not that the test passed. Done when: the test builds, runs, and skips only for the documented reason.
4. **Fuzz the syscall surface with syzkaller.** The kernel needs `CONFIG_KCOV`, `CONFIG_DEBUG_FS`, and ideally `CONFIG_KASAN`. Build syzkaller from source, point a manager config at the kernel build and image, then run.

   ```json
   {
     "target": "linux/amd64",
     "http": "127.0.0.1:56741",
     "workdir": "/tmp/syzkaller",
     "kernel_obj": "/path/to/kernel/build",
     "syzkaller": "/path/to/syzkaller",
     "procs": 8,
     "type": "qemu",
     "vm": {"count": 4, "kernel": "/path/to/bzImage", "cpu": 2, "mem": 2048}
   }
   ```

   ```bash
   ./bin/syz-manager -config manager.cfg
   ./bin/syz-repro -config manager.cfg crash-report.txt   # minimize a crash
   ```

   Done when: the manager runs VMs and every found crash has a minimized reproducer.
5. **Read coverage through kcov.** `CONFIG_KCOV` exposes a debugfs character device that programs open, size with `KCOV_INIT_TRACE`, map, and enable with `KCOV_ENABLE`; syzkaller drives it automatically for every executed program. Zero coverage means the kernel was built without `CONFIG_KCOV`. Done when: coverage data flows for at least one program.
6. **Run LTP for syscall regression across environments.**

   ```bash
   git clone https://github.com/linux-test-project/ltp && cd ltp
   make autotools && ./configure && make -j$(nproc) && make install
   /opt/ltp/runltp -f syscalls          # full syscall set
   /opt/ltp/testcases/bin/pipe01        # one test, run directly
   ```

   LTP covers syscalls, filesystems, network, IPC, controllers, and security. Mass failure usually means the environment, not the kernel: run as root and check the documented prerequisites. Done when: the selected set reports a clean pass count.
7. **Shape CI on the build, boot, test ladder.** A kernel patch pipeline is: build with a chosen config or `allmodconfig`, boot under QEMU, kselftest, then an LTP subset. KernelCI runs this shape against many boards and defconfigs upstream; a private CI mirrors it on the configs the patch touches. Done when: the pipeline runs the ladder on every patch.
8. **Start from a debug-friendly config.**

   ```
   CONFIG_KUNIT=y
   CONFIG_KCOV=y
   CONFIG_KASAN=y
   CONFIG_DEBUG_INFO_DWARF5=y
   CONFIG_FRAME_POINTER=y
   CONFIG_FTRACE=y
   ```

   ```bash
   make kvm_guest.config        # reasonable test base on x86-64
   scripts/config -e KUNIT -e KCOV -e KASAN
   make olddefconfig
   ```

   Done when: the fragment applies cleanly and the build boots under QEMU.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| KUnit tests not found | `CONFIG_KUNIT` disabled | Enable, rebuild, rerun |
| kselftest SKIP | Missing kernel feature | Check the test's `config` file |
| syzkaller finds nothing | VM or kernel cmdline wrong | Verify QEMU boots the image first |
| kcov zero coverage | `CONFIG_KCOV` off | Rebuild with kcov enabled |
| LTP mass failures | Environment mismatch | Run as root, check prerequisites |
| kunit.py hangs | Architecture mismatch | Pass `--arch` and `--cross_compile` |

| Failure class | Behavior |
|---|---|
| Flaky test | Fix the determinism or quarantine with a reason; never retry-to-green. |
| Fuzzer crash | Minimize with `syz-repro` before reading code; a raw report hides the trigger. |
| Test passes everywhere but ships the bug | Move the assertion to the layer that sees the behavior: out of KUnit into kselftest. |
| CI red from infrastructure | Separate boot failures from test failures before blaming the patch. |

## Output

1. Test sources at the chosen layer.
2. Kconfig fragment and config commands.
3. Run transcript with pass, fail, and skip counts, plus minimized reproducers from fuzzing.
