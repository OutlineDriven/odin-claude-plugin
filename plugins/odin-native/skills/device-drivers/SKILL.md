---
name: device-drivers
description: 'Use when writing or fixing a Linux device driver: platform/i2c/spi probe and remove, char device lifecycle, threaded IRQs, DMA mappings, regmap, runtime PM, or udev rules.'
---

# Device drivers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or debugging a Linux device driver: `platform_driver`, `i2c_driver`, or `spi_driver` probe and remove, char device read/write/ioctl, threaded IRQs, coherent or streaming DMA, regmap, runtime power management, or udev node permissions. |
| Authority | Reversible local: writes only driver source, Kconfig and Makefile entries, and udev rule files inside the project tree; rollback is version control. No remote mutation. |
| Side effect | Local edits to driver source, Kconfig and Makefile entries, and udev rules; guidance to chat. |
| Done | The driver probes and unbinds cleanly, IRQ, DMA, and PM paths use the correct APIs, and every observed symptom maps to one checked cause. |

## Inputs

1. Driver code or symptom (required): source under review, a probe failure, an IRQ storm, a missing `/dev` node, or DMA corruption.
2. Bus and device origin (optional): `platform`, `i2c`, or `spi`; the device tree `compatible` string or ACPI id.
3. Kernel version (optional): mainline 7.2 or LTS 6.18 assumed when not stated.
4. Register map or datasheet (optional): needed for the regmap layout and PM sequencing.

## Procedure

1. **Name the bus, the device origin, and the kernel.** Confirm the device comes from device tree, ACPI, or a legacy board file, and read `uname -r` on the target. Done when: the bus, the origin, and the kernel version are recorded.
2. **Build probe and remove around managed resources.** Remap the memory region with `devm_platform_ioremap_resource`, stash state with `platform_set_drvdata`, and register with `module_platform_driver`. Keep `remove` empty when every resource is `devm_*`-managed.

   ```c
   static int my_probe(struct platform_device *pdev)
   {
       void __iomem *base = devm_platform_ioremap_resource(pdev, 0);
       if (IS_ERR(base))
           return PTR_ERR(base);
       platform_set_drvdata(pdev, ctx);
       return 0;
   }
   static struct platform_driver my_driver = {
       .probe = my_probe,
       .remove = my_remove,
       .driver = { .name = "my-device" },
   };
   module_platform_driver(my_driver);
   ```

   Done when: probe holds one managed remap, private-data storage, and the registration macro.
3. **Wire the char device or the bus registration.** For a char device, allocate a device number, register `file_operations` through `cdev_init` and `cdev_add`, then create the class and the node. Copy data with `copy_to_user` and `copy_from_user`, returning `-EFAULT` on failure.

   ```c
   ret = alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME);
   if (ret)
       return ret;
   cdev_init(&my_cdev, &my_fops);
   ret = cdev_add(&my_cdev, dev_num, 1);
   if (ret)
       goto err_region;
   dev_class = class_create(DEVICE_NAME);
   device_create(dev_class, NULL, dev_num, NULL, DEVICE_NAME);
   ```

   `class_create` takes the name only on 6.4 and newer kernels; older kernels want the module as the first argument. For I2C or SPI, fill `struct i2c_device_id` or the `of_match_table`, set `.id_table`, and register with `module_i2c_driver()` or `module_spi_driver()`. Done when: every registration call has a checked return and a labeled cleanup path.
4. **Choose the IRQ pattern from the work the handler does.**

   | Pattern | Use when |
   |---|---|
   | Hard IRQ only | Microsecond work, nothing that sleeps |
   | Threaded IRQ | I2C/SPI reads, mutexes, scheduling work |
   | `IRQF_ONESHOT` | Level-triggered line: mask until the thread returns |

   ```c
   return devm_request_threaded_irq(dev, irq, my_hardirq, my_threaded,
                                    IRQF_ONESHOT, "mydev", dev);
   ```

   The hard IRQ acknowledges and returns `IRQ_WAKE_THREAD`; the thread does the work and returns `IRQ_HANDLED`. Done when: sleeping work never runs in hard context and the acknowledge happens in the hard IRQ.
5. **Map DMA at the right coherency.** Use a coherent mapping when CPU and device share the buffer continuously. Use streaming mappings for buffers that already exist, and sync at every direction change.

   ```c
   cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
   dma = dma_map_single(dev, buf, size, DMA_TO_DEVICE);
   dma_sync_single_for_device(dev, dma, size, DMA_TO_DEVICE);
   /* device reads */
   dma_sync_single_for_cpu(dev, dma, size, DMA_FROM_DEVICE);
   dma_unmap_single(dev, dma, size, DMA_TO_DEVICE);
   ```

   Done when: every streaming mapping has a sync before each ownership transfer and one unmap.
6. **Route register access through regmap.** Declare `regmap_config` with register and value widths and `max_register`; read and write through `regmap_read`, `regmap_write`, and `regmap_update_bits`. Regmap owns locking, caching, and bulk access, so new I2C and SPI drivers use it over raw `i2c_smbus_*` calls. Done when: no driver path bypasses the regmap instance.
7. **Gate clocks through runtime PM.** Fill `runtime_suspend` and `runtime_resume` in `dev_pm_ops`, enable PM with `devm_pm_runtime_enable`, and power up with `pm_runtime_resume_and_get()`. Prefer it over `pm_runtime_get_sync()` because it drops the usage count again when resume fails, which keeps error paths balanced. Done when: every get has a matching put on success and on error.
8. **Add the udev rule for the device node.**

   ```bash
   # /etc/udev/rules.d/99-mydev.rules
   KERNEL=="mydev", MODE="0666", GROUP="plugdev"
   ```

   ```bash
   sudo udevadm control --reload-rules && sudo udevadm trigger
   udevadm info -a -n /dev/mydev
   ```

   Done when: the node carries the intended mode and group after a reload.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| `probe` returns `-EBUSY` | Resource conflict or double probe | Check the device tree `status`, verify one driver per device, use `devm_*` cleanup |
| IRQ storm | Missing acknowledge | ACK in the hard IRQ, use `IRQF_ONESHOT` on level lines |
| Device reads stale DMA data | Missing sync at an ownership change | `dma_sync_single_for_cpu` or `_for_device` at each boundary |
| `/dev` node missing | `class_create` or `device_create` failed | Check `dmesg`, verify `cdev_add` returned 0 |
| `copy_to_user` fault | Invalid user pointer | Validate with `access_ok`, return `-EFAULT` |
| Runtime PM hang | Get/put imbalance | Use `pm_runtime_resume_and_get`, pair every put |

| Failure class | Behavior |
|---|---|
| Probe fails after partial setup | Audit the cleanup ladder: every non-`devm` resource acquired after a jump target is released before returning the error. |
| Sleeping call in hard IRQ | Move the work to the threaded handler; the hard IRQ only acknowledges. |
| DMA corruption persists | Re-check the direction flags; a `DMA_TO_DEVICE` mapping is not readable by the CPU without a sync. |
| Node permissions revert on replug | The rule does not match; print the match chain with `udevadm info -a` and fix the key. |

## Output

1. Driver skeleton for the named bus with checked returns and a cleanup ladder.
2. IRQ, DMA, and PM wiring matched to the hardware behavior.
3. udev rule and reload commands when a node permission is wanted.
4. Symptom table entries with the causes actually checked on the target.
