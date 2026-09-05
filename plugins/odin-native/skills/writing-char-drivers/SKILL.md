---
name: writing-char-drivers
description: 'Use when writing a Linux char driver: file_operations, cdev, copy_to_user, ioctl commands, device memory mmap, or poll. Not for probe and remove lifecycle: use platform-device-model.'
---

# Writing char drivers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or reviewing a Linux char driver: `struct file_operations`, `cdev` registration, kernel-user copies, `ioctl` command design, device memory `mmap`, or blocking reads with `poll`. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns proposed driver code and review findings. No source files are modified. |
| Done | Every requested operation has driver code, and every finding names one failure-table row. |

## Inputs

1. Target tree and kernel (required): where the driver builds. The examples assume 6.12 or later, which covers this tree's floor (LTS 6.18, mainline 7.2).
2. Operations to write (required): registration, `read`, `write`, `ioctl`, `mmap`, or `poll`.
3. Device window (conditional): physical base, allowed length, and permissions; needed for `mmap`.
4. Userspace contract (optional): the `ioctl` command set and struct layout the user side already speaks.

## Procedure

1. Register the char device with a dynamic major number; a fixed major collides with another driver.

   ```c
   #include <linux/fs.h>
   #include <linux/cdev.h>
   #include <linux/uaccess.h>

   static dev_t devno;
   static struct cdev my_cdev;
   static struct class *my_class;

   static const struct file_operations my_fops = {
       .owner          = THIS_MODULE,
       .open           = my_open,
       .release        = my_release,
       .read           = my_read,
       .write          = my_write,
       .unlocked_ioctl = my_ioctl,
       /* .llseek stays unset: an unset field means no seek support */
   };

   static int __init my_init(void)
   {
       int ret = alloc_chrdev_region(&devno, 0, 1, "mydev");
       if (ret)
           return ret;

       cdev_init(&my_cdev, &my_fops);
       ret = cdev_add(&my_cdev, devno, 1);
       if (ret)
           goto err_cdev;

       /* class_create takes the name as its only argument since 6.4 */
       my_class = class_create("mydev");
       if (IS_ERR(my_class)) {
           ret = PTR_ERR(my_class);
           goto err_class;
       }
       device_create(my_class, NULL, devno, NULL, "mydev");
       return 0;

   err_class:
       cdev_del(&my_cdev);
   err_cdev:
       unregister_chrdev_region(devno, 1);
       return ret;
   }
   ```

   Since kernel 6.12 removed the `no_llseek` symbol, leave `.llseek` unset for a non-seekable device; an unset field already means no seek support. Inside a platform driver, use the `devm_*` variants and register from `probe`. Done when: the error path releases every resource acquired before the failure, and the caller sees the `cdev_add` error code.
2. Copy between kernel and user memory only through `copy_to_user` and `copy_from_user`. Never dereference a `__user` pointer. Both return the number of bytes not copied, so nonzero means `-EFAULT`. They can sleep, so the handler holds no spinlock.

   ```c
   static ssize_t my_read(struct file *filp, char __user *buf,
                          size_t count, loff_t *ppos)
   {
       char kbuf[128];
       size_t len;

       if (*ppos < 0 || (size_t)*ppos >= sizeof(kbuf))
           return 0;
       len = min(count, sizeof(kbuf) - (size_t)*ppos);
       /* fill every byte first; an unfilled byte leaks kernel stack */
       memset(kbuf, 0, sizeof(kbuf));
       memcpy(kbuf, "data", 4);
       if (copy_to_user(buf, kbuf + *ppos, len))
           return -EFAULT;
       *ppos += len;
       return len;
   }
   ```

   Done when: the handler copies only through the copy functions, initializes every byte of a stack buffer before it, and advances `*ppos` after a full copy.
3. Define `ioctl` commands with the `_IO` macro family; each macro encodes magic, number, direction, and data size.

   ```c
   #include <linux/ioctl.h>

   #define MY_IOC_MAGIC 'k'
   #define MY_IOC_RESET  _IO(MY_IOC_MAGIC, 0)
   #define MY_IOC_SET    _IOW(MY_IOC_MAGIC, 1, int)

   static long my_ioctl(struct file *filp, unsigned int cmd, unsigned long arg)
   {
       switch (cmd) {
       case MY_IOC_RESET:
           return 0;
       case MY_IOC_SET: {
           int val;
           if (copy_from_user(&val, (void __user *)arg, sizeof(val)))
               return -EFAULT;
           return 0;
       }
       default:
           return -ENOTTY;
       }
   }
   ```

   Use `_IOWR` with a fixed-size struct when a command both reads and writes. Serve 32-bit callers on a 64-bit kernel through `compat_ioctl` when the command carries a pointer. Share one command header between kernel and userspace so magic and numbers cannot drift. Done when: every command macro encodes all four fields and the default case returns `-ENOTTY`.
4. Map device memory with `mmap` only after validating the request against the device window.

   ```c
   static int my_mmap(struct file *filp, struct vm_area_struct *vma)
   {
       unsigned long size = vma->vm_end - vma->vm_start;
       phys_addr_t phys = device_phys_base; /* from the platform data */

       if (size > DEVICE_WINDOW_SIZE)
           return -EINVAL;
       vma->vm_page_prot = pgprot_noncached(vma->vm_page_prot);
       return remap_pfn_range(vma, vma->vm_start, phys >> PAGE_SHIFT,
                              size, vma->vm_page_prot);
   }
   ```

   `pgprot_noncached` marks MMIO regions uncached. For a DMA buffer, check the size and caller permissions before the mapping. Done when: a length outside the device window is rejected before `remap_pfn_range` runs.
5. Support blocking reads with `.poll` and a wait queue. Implement `.poll` with `poll_wait` on the queue, call `wake_up_interruptible` wherever new data arrives, and register SIGIO delivery through `fasync_helper` for async readers. Done when: every blocking site has one wake source and the fops carries `.poll`.
6. Review the finished code against the failure table. Return the driver code and a findings list where each finding names one row. Route deeper work: `platform-device-model` for the probe context that owns the device, `kernel-concurrency` for locking inside file operations, `kernel-debugging-advanced` for tracing the ioctl path. Done when: every finding names one row and every requested operation has reviewed code.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `-EFAULT` on copy | Bad user pointer or faulting page | Rely on the copy functions' return values; `access_ok` is an optional early filter. |
| `-ENOTTY` in userspace | Magic or number mismatch | Build both sides from one shared command header. |
| Major number collision | Fixed major already taken | Register with `alloc_chrdev_region`. |
| SIGSEGV in an `mmap` region | Cached mapping over device memory | Set `pgprot_noncached` before `remap_pfn_range`. |
| `scheduling while atomic` | Sleeping call under a spinlock in an op | Release the lock before any call that can sleep. |
| Late init failure | `class_create` or `device_create` failed | Unwind in reverse: `cdev_del`, `device_destroy`, `class_destroy`, `unregister_chrdev_region`. |
| `no_llseek` undeclared | Kernel 6.12 removed the symbol | Delete the `.llseek` assignment; unset means no seeking. |
| `class_create` argument error | Kernel 6.4 dropped the module argument | Pass the class name as the single argument. |

## Output

Driver code for each requested operation: registration, user copies, `ioctl`, `mmap`, or `poll`; the findings list from the final review, each finding tied to one failure-table row.
