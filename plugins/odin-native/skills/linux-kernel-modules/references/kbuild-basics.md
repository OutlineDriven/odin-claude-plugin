# Kbuild system reference

Source: the kernel build documentation at docs.kernel.org/kbuild/modules.html.

## Makefile patterns

```makefile
# single-file module
obj-m := hello.o

# multi-file module
obj-m := mydriver.o
mydriver-objs := core.o ops.o irq.o

# several modules from one Makefile
obj-m := module_a.o module_b.o

# module from a subdirectory
obj-m := mydriver/

KDIR := /lib/modules/$(shell uname -r)/build
PWD  := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules
clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
install:
	$(MAKE) -C $(KDIR) M=$(PWD) modules_install
	depmod -a
```

In a multi-file module, one translation unit carries the `MODULE_LICENSE` metadata and the rest just participate through `mydriver-objs`.

## Out-of-tree versus in-tree

| Property | Out-of-tree | In-tree |
|-|------------|---------|
| Location | Separate directory | Under `drivers/` in the kernel source |
| Build | `make -C KDIR M=PWD` | `make modules` with the tree |
| Kconfig | Not integrated | Needs a Kconfig entry |
| Signing | Manual | Done by the kernel build |
| Tainting | Taints when non-GPL | Does not taint |

## Kbuild variables

| Variable | Description |
|----------|-------------|
| `obj-m` | Module objects to build |
| `obj-y` | Objects built into the kernel, in-tree |
| `ccflags-y` | Extra compiler flags for this directory |
| `ldflags-y` | Extra linker flags |
| `subdir-y` | Subdirectories to descend into |
| `EXTRA_CFLAGS` | Legacy, use `ccflags-y` instead |
| `KBUILD_MODNAME` | Module name, set automatically |
| `KBUILD_EXTMOD` | External module path, set by `M=` |

```makefile
ccflags-y := -DDEBUG -I$(src)/include
ldflags-y := -T$(src)/mymodule.ld
```

## Kernel API quick table

```c
/* logging */
pr_err("error: %d\n", err);        /* also pr_info, pr_warn, pr_debug */
dev_err(dev, "error: %d\n", err);  /* device-attached */

/* memory */
void *p  = kmalloc(size, GFP_KERNEL);  /* may sleep */
void *pa = kmalloc(size, GFP_ATOMIC);  /* interrupt context, never sleeps */
void *z  = kzalloc(size, GFP_KERNEL);  /* zeroed */
void *v  = vmalloc(size);              /* virtually contiguous */
kfree(p);

/* synchronization */
DEFINE_MUTEX(m);
mutex_lock(&m);   mutex_unlock(&m);

DEFINE_SPINLOCK(l);
unsigned long flags;
spin_lock_irqsave(&l, flags);
spin_unlock_irqrestore(&l, flags);

/* userspace transfers; both return the count NOT copied */
copy_to_user(user_ptr, kernel_ptr, size);
copy_from_user(kernel_ptr, user_ptr, size);
```

Return the partial-copy count from a failed transfer; zero means full success.
