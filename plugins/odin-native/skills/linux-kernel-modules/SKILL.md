---
name: linux-kernel-modules
description: 'Use when writing loadable kernel modules: Kbuild, module parameters, proc and sysfs entries, char devices, or ftrace debugging. Not for driver architecture: use writing-char-drivers.'
---

# Linux kernel modules

A loadable module runs in kernel space with no safety net. The build system, the userspace interfaces, and the debugging paths are all prescribed; follow them and the module stays debuggable.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task writes or builds an out-of-tree `.ko`, adds module parameters, creates proc or sysfs entries, registers a char device, debugs with KDB or ftrace, or signs modules for Secure Boot. |
| Authority | Reversible local: writes only the module source, Kbuild files, built artifacts, and local signing keys, plus load and unload of the module on this machine; rollback is `rmmod` for the loaded module and version control for the files. No remote mutation. |
| Side effect | Local build outputs, module insertion and removal, entries under `/proc` and `/sys` while loaded, and generated key material when signing is set up. |
| Done | The module builds against the running kernel's build tree, loads, exposes its interfaces, and unloads without leaving state behind. |

## Inputs

- The running kernel version and its `build` directory: required. `uname -r` and `/lib/modules/$(uname -r)/build`.
- Root access: required for `insmod`, `rmmod`, and signing enrollment.
- The module's userspace interface: required before writing code. Proc entry, sysfs attributes, or a char device.
- For Secure Boot: the platform's key enrollment path.

## Procedure

1. Write the minimal module and build it through Kbuild. The Makefile is one line plus the invocation; Kbuild supplies every kernel flag. Done when: `modinfo hello.ko` prints the metadata and `insmod` plus `rmmod` round-trip cleanly.

```c
#include <linux/module.h>
#include <linux/init.h>

static int __init hello_init(void) {
    pr_info("hello: loaded\n");
    return 0;                 // nonzero return aborts the load
}

static void __exit hello_exit(void) {
    pr_info("hello: unloaded\n");
}

module_init(hello_init);
module_exit(hello_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Name");
MODULE_DESCRIPTION("Minimal loadable module");
```

```makefile
obj-m := hello.o
KDIR := /lib/modules/$(shell uname -r)/build
PWD  := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules
clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
```

```bash
make
sudo insmod hello.ko
lsmod | grep hello
sudo rmmod hello
dmesg | tail
```

2. Add parameters for values that must change without a rebuild. The permission argument controls the sysfs visibility of each parameter. Done when: `sudo insmod hello.ko count=3` applies the value and `/sys/module/hello/parameters/count` exists.

```c
#include <linux/moduleparam.h>

static char *name = "world";
static int count = 1;
module_param(name, charp, S_IRUGO);
module_param(count, int, S_IRUGO | S_IWUSR);
MODULE_PARM_DESC(name, "Name to greet");
MODULE_PARM_DESC(count, "Number of times to greet");
```

3. Create a proc entry when a reader needs formatted state. The seq_file callbacks fill one buffer per read; the file mode controls access. Done when: `cat /proc/mymod` prints the state.

```c
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

static int mymod_show(struct seq_file *m, void *v) {
    seq_printf(m, "state: %d\n", my_state);
    return 0;
}

static int mymod_open(struct inode *inode, struct file *file) {
    return single_open(file, mymod_show, NULL);
}

static const struct proc_ops mymod_pops = {
    .proc_open    = mymod_open,
    .proc_read    = seq_read,
    .proc_lseek   = seq_lseek,
    .proc_release = single_release,
};

proc_create("mymod", 0444, NULL, &mymod_pops);
// remove_proc_entry("mymod", NULL); in module_exit
```

4. Expose sysfs attributes for values that userspace reads and may write. `sysfs_create_group` attaches them under `/sys/kernel/mymod/`. Done when: read and write through the attribute round-trip the value.

```c
#include <linux/kobject.h>
#include <linux/sysfs.h>

static struct kobject *mymod_kobj;
static int mymod_value;

static ssize_t value_show(struct kobject *kobj, struct kobj_attribute *attr, char *buf) {
    return sysfs_emit(buf, "%d\n", mymod_value);
}
static ssize_t value_store(struct kobject *kobj, struct kobj_attribute *attr,
                           const char *buf, size_t count) {
    sscanf(buf, "%d", &mymod_value);
    return count;
}
static struct kobj_attribute value_attr = __ATTR(value, 0664, value_show, value_store);

mymod_kobj = kobject_create_and_add("mymod", kernel_kobj);
sysfs_create_group(mymod_kobj, &attr_group);   // check the return value
```

5. Register a char device when userspace needs `open`, `read`, `write` on a node. A misc device gets a dynamic minor and creates `/dev/mymod` through udev without manual `mknod`. Done when: `cat /dev/mymod` reads data and the buffer bounds hold.

```c
#include <linux/cdev.h>
#include <linux/uaccess.h>

#define BUF_SIZE 1024
static char dev_buf[BUF_SIZE];

static ssize_t mydev_read(struct file *f, char __user *buf, size_t len, loff_t *off) {
    size_t to_copy = min(len, (size_t)BUF_SIZE);
    if (copy_to_user(buf, dev_buf, to_copy))
        return -EFAULT;
    return to_copy;
}

static const struct file_operations mydev_fops = {
    .owner = THIS_MODULE,
    .read  = mydev_read,
};

static struct miscdevice mydev_misc = {
    .minor = MISC_DYNAMIC_MINOR,
    .name  = "mymod",
    .fops  = &mydev_fops,
};
misc_register(&mydev_misc);      // check the return value
misc_deregister(&mydev_misc);    // in module_exit
```

6. Debug with KDB and ftrace. KDB over serial or `kgdboc` gives a kernel debugger; ftrace traces function calls live and answers most timing questions without a debugger. Done when: the misbehaving call path or timing is captured.

```bash
# ftrace: trace the module's functions
echo 'mymod_*' > /sys/kernel/debug/tracing/set_ftrace_filter
echo function > /sys/kernel/debug/tracing/current_tracer
cat /sys/kernel/debug/tracing/trace
# and the quick printk path
echo 'file mymod.c +p' > /sys/kernel/debug/dynamic_debug/control
```

7. Export symbols for other modules deliberately. `EXPORT_SYMBOL` shares with any module; `EXPORT_SYMBOL_GPL` restricts to GPL modules. Loading a module that imports GPL symbols without a GPL license taints the kernel and fails. Done when: `modinfo` shows the intended license and the import list matches it.

```c
EXPORT_SYMBOL_GPL(my_shared_helper);
```

8. Write KUnit tests for the module's pure logic. In-tree kernels build them with `CONFIG_KUNIT`; out-of-tree tests run as a KUnit module on a test kernel. Done when: the suite loads and reports its cases.

```c
#include <kunit/test.h>

static void parse_valid(struct kunit *test) {
    KUNIT_EXPECT_EQ(test, mymod_parse("42"), 42);
}
static struct kunit_case mymod_cases[] = {
    KUNIT_CASE(parse_valid),
    {}
};
static struct kunit_suite mymod_suite = { .name = "mymod", .test_cases = mymod_cases };
kunit_test_suite(mymod_suite);
```

9. Sign the module when Secure Boot is on. The kernel verifies module signatures against enrolled keys when `CONFIG_MODULE_SIG` is set, and a lockdown kernel rejects unsigned modules. Done when: `modinfo hello.ko | grep signer` shows the key and the module loads on the lockdown system.

```bash
openssl req -new -x509 -newkey rsa:4096 -keyout signing_key.pem \
        -out signing_cert.pem -nodes -days 36500 -subj "/CN=Module Signing"
scripts/sign-file sha256 signing_key.pem signing_cert.pem hello.ko
sudo mokutil --import signing_cert.pem    # enroll through MOK on UEFI, reboot to confirm
```

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `Unknown symbol` at insmod | The module imports a symbol nothing exports. Check the import list and the exporting module, and the license match for `EXPORT_SYMBOL_GPL`. |
| `Invalid module format` | The module was built against a different kernel or architecture. Rebuild against `uname -r`'s build tree. |
| Load leaves stale `/proc` or `/sys` state | The exit path skipped cleanup. Make `module_exit` the mirror of `module_init` and reload. |
| Module hangs the box | Reboot, then reproduce under ftrace with a filter narrowed to the module's functions before loading again. |
| Signature rejected on lockdown | The key is not enrolled, or the signature was invalidated by a rebuild. Re-sign after every rebuild and re-enroll once. |
| `make` cannot find the build tree | The kernel headers package is missing. Install the matching headers before building. |

## Output

The built and loadable module, its userspace interface verified by reads through `/proc`, `/sys`, or the device node, and clean unload evidence in `dmesg`. The Kbuild variable table and the out-of-tree versus in-tree comparison are in `references/kbuild-basics.md`. The mainline kernel this tree pins is 7.2 with LTS 6.18.
