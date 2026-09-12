---
name: device-drivers
description: 'Use when writing or debugging Linux drivers: platform, I2C/SPI, device-tree, char-device, IRQ, DMA, regmap, PM, sysfs, udev, NACK, -EREMOTEIO, or probe failures.'
disable-model-invocation: true
---

# Linux device drivers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or debugging a Linux device driver in platform, I2C, or SPI form, including its device-tree description, char-device interface, threaded IRQ, DMA, regmap, runtime PM, sysfs, deferred-probe, or udev path. |
| Authority | Reversible local: writes only driver source, Kconfig and Makefile entries, DTS/DTSI, binding and overlay files, and udev rule files inside the project tree; rollback is version control. No remote mutation. |
| Side effect | Local edits to driver, build, device-tree, binding, overlay, and udev files; guidance and debug commands in chat. |
| Done | The device description matches its hardware and driver table, the driver probes and unbinds cleanly, char, IRQ, DMA, bus, and PM paths use the correct APIs, and every observed symptom maps to one checked cause. |

## Inputs

1. Driver code or symptom (required): source under review, a probe failure, an IRQ storm, a missing `/dev` node, NACK or `-EREMOTEIO`, or DMA corruption.
2. Bus and device origin (optional): `platform`, `i2c`, or `spi`; the device-tree `compatible` string, ACPI id, or legacy board-file entry; and the adapter address or SPI chip-select.
3. Hardware facts (optional): MMIO base and length, IRQ and trigger, clocks, regulators, bus placement, and the register map or datasheet. Supply these when creating a device-tree node or a regmap.
4. Device-tree context (conditional): the SoC `.dtsi`, board `.dts`, binding document, phandles, overlay and boot chain, or a failure report such as a driver that never probes or an IRQ that never fires.
5. Interface contract (conditional): requested `read`, `write`, `ioctl`, `mmap`, or `poll` operations, plus the userspace ioctl header and struct layout.
6. Transfer shape (conditional): register and value widths, repeated-start requirements, SPI mode and word size, and buffer lifetime or DMA constraints.
7. Kernel version (optional): mainline 7.2 or LTS 6.18 is assumed when it is not stated.
8. Mode (optional): `device-tree`, `platform-device-model`, `bus-drivers-i2c-spi`, or `writing-char-drivers`; choose one branch or combine branches when one driver spans them. Done when: the selected mode and its required inputs are recorded.

## Procedure

1. **Name the bus, the device origin, and the kernel.** Confirm whether the device comes from device tree, ACPI, or a legacy board file, and read `uname -r` on the target. State the driver-model hierarchy: a `bus_type` such as platform, AMBA, PCI, I2C, or SPI carries `struct device` instances, each binds to at most one `struct device_driver`, and the core calls `probe` on a match and `remove` at unbind. Done when: the bus, origin, kernel version, and matching model are recorded.

2. **Device-tree mode applies when the device has a DTS/DTSI, binding, phandle, overlay, or OF probe problem.**

   a. Lay out the node under its bus parent. A board file includes the SoC `.dtsi` and extends or references its nodes by label. Keep `#address-cells` and `#size-cells` from the parent in view.

      ```dts
      /dts-v1/;
      #include "soc.dtsi"

      / {
          model = "My Board";
          compatible = "vendor,my-board", "vendor,soc-family";
      };

      &i2c1 {
          sensor: sensor@48 {
              compatible = "vendor,sensor";
              reg = <0x48>;
          };
      };
      ```

      Done when: the node is under the right bus parent and every `reg` cell count matches the parent's address and size cells.

   b. Set the load-bearing properties from the datasheet or binding: `compatible` strings most-specific first; `reg` address and length; `interrupts` using the interrupt parent's cells; `clocks` and `clock-names`; and `status`, where `"disabled"` keeps the device unprobed. Done when: each property value traces to a hardware fact or binding rule.

   c. Wire phandles for cross-node references. A phandle is the label reference the compiler resolves to a number.

      ```dts
      clk_sensor: clock-sensor {
          compatible = "fixed-clock";
          #clock-cells = <0>;
      };

      &sensor {
          clocks = <&clk_sensor>;
          clock-names = "apb_pclk";
      };
      ```

      Done when: every `&label` reference resolves to a node in the compiled tree.

   d. Match the driver to the node. The OF core parses the DTB at boot; `of_platform_populate()` creates `platform_device` instances for bus nodes, and a driver binds when its `of_match_table` matches `compatible`. For I2C or SPI children, make the child `compatible` match an `of_device_id` entry and make `reg` equal the datasheet address.

      ```c
      static const struct of_device_id my_of_match[] = {
          { .compatible = "vendor,sensor" },
          { }
      };
      MODULE_DEVICE_TABLE(of, my_of_match);
      ```

      Done when: the driver's match table names the node's exact `compatible` string and the child address is correct.

   e. Compile and inspect the tree with `dtc` or `make dtbs`, and name the binding document under `Documentation/devicetree/bindings/` or its YAML `dt-schema` path when a binding changes.

      ```bash
      dtc -I dts -O dtb -o board.dtb board.dts
      dtc -I fs -O dts /proc/device-tree | less
      ls /sys/firmware/devicetree/base/
      ```

      Done when: the compiled DTB matches the running tree, or the delta explains the failure.

   f. Apply overlays only through a supported boot chain. `CONFIG_OF_OVERLAY` provides kernel overlay support; mainline normally applies overlays through U-Boot's `fdt apply` or merges a `.dtbo` with `fdtoverlay` at build time. The configfs path `/sys/kernel/config/device-tree/overlays/` exists only on kernels carrying the vendor `CONFIG_OF_CONFIGFS` patch. Overlay resolution failures name unresolved `__fixups__`; export target labels as `__symbols__` in the base DTB. Done when: the apply path is named for the actual kernel and boot chain.

   g. Diagnose an OF probe failure bottom-up: confirm the node is in `/proc/device-tree`, confirm `status` is `"okay"`, compare `compatible` character for character, then confirm clocks, regulators, and phys are available or the driver returns `-EPROBE_DEFER`. Done when: the first broken link in the chain is named.

3. **Use platform mode for platform-driver lifecycle, properties, sysfs, and deferred probe.** Build probe and remove around managed resources. Allocate private state with `devm_kzalloc`, look up the resource, map it with `devm_ioremap_resource` or `devm_platform_ioremap_resource`, stash it with `platform_set_drvdata`, and register with `module_platform_driver`. `remove` returns `void` on the supported kernel floor; leave it empty when every resource is `devm_*`-managed.

   ```c
   static int my_probe(struct platform_device *pdev)
   {
       struct my_priv *priv;
       struct resource *res;
       void __iomem *base;

       priv = devm_kzalloc(&pdev->dev, sizeof(*priv), GFP_KERNEL);
       if (!priv)
           return -ENOMEM;
       res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
       base = devm_ioremap_resource(&pdev->dev, res);
       if (IS_ERR(base))
           return PTR_ERR(base);
       platform_set_drvdata(pdev, priv);
       return 0;
   }

   static void my_remove(struct platform_device *pdev)
   {
       /* devm_* resources are freed by the core after this returns */
   }

   static struct platform_driver my_pdrv = {
       .probe = my_probe,
       .remove = my_remove,
       .driver = {
           .name = "my-device",
           .of_match_table = my_of_match,
       },
   };
   module_platform_driver(my_pdrv);
   ```

   Read DT and ACPI properties through the unified property API, using `of_*` only for DT-specific semantics. Expose state through `DEVICE_ATTR_RO` or `DEVICE_ATTR_RW`, format with `sysfs_emit`, and list attributes in `.dev_groups` so the core creates and removes them at bind and unbind. Return `-EPROBE_DEFER` when a required supplier is not ready and inspect `/sys/kernel/debug/devices_deferred` to see who is waiting on whom. Done when: the skeleton has resource lookup, a managed remap, private-data storage, and registration; each property read handles its error; sysfs cannot leak after unbind; and every supplier dependency has a deliberate ordering or deferred return.

   ```c
   static int my_read_properties(struct device *dev)
   {
       u32 speed;
       bool has_feature;
       int ret;

       ret = device_property_read_u32(dev, "clock-speed", &speed);
       if (ret)
           return ret;
       has_feature = device_property_present(dev, "feature-x");
       dev_dbg(dev, "clock speed %u, feature-x %s\n", speed,
               has_feature ? "present" : "absent");
       return 0;
   }
   ```


   Debug platform binding from the running system:

   ```bash
   ls /sys/bus/platform/devices/
   ls /sys/bus/platform/drivers/
   cat /sys/kernel/debug/devices_deferred
   udevadm monitor
   ```

   Done when: the device and driver directories, deferred dependency list, and relevant uevents have been inspected for the reported symptom.

4. **Use I2C/SPI mode for client registration, transfers, bus bindings, and NACK diagnosis.** The bus core owns the adapter or controller; the client driver owns the device registers. For I2C, carry both match tables, a `void` `remove`, and `module_i2c_driver`.

   ```c
   static void my_remove(struct i2c_client *client) {}

   static struct i2c_driver my_driver = {
       .probe = my_probe,
       .remove = my_remove,
       .driver = {
           .name = "mysensor",
           .of_match_table = my_of_id,
       },
       .id_table = my_id,
   };
   module_i2c_driver(my_driver);
   ```

   Prefer regmap for ordinary register access. Set `reg_bits`, `val_bits`, and `max_register` from the datasheet, initialize with `devm_regmap_init_i2c` or the SPI equivalent, and use `regmap_read`, `regmap_write`, and `regmap_update_bits`. Use a raw `i2c_transfer` only for a protocol regmap cannot express, such as a write followed by a repeated-start read; check that the return value equals the message count.

   ```c
   static int my_read_reg(struct i2c_client *client)
   {
       u8 reg = 0x0F, val;
       int ret;
       struct i2c_msg msgs[] = {
           { .addr = client->addr, .flags = 0,        .len = 1, .buf = &reg },
           { .addr = client->addr, .flags = I2C_M_RD, .len = 1, .buf = &val },
       };

       ret = i2c_transfer(client->adapter, msgs, ARRAY_SIZE(msgs));
       if (ret != ARRAY_SIZE(msgs))
           return ret < 0 ? ret : -EIO;
       return 0;
   }
   ```


   For SPI, set mode, word size, and transfer settings from the datasheet, call `spi_setup`, build a `spi_message`, call `spi_sync`, check its return, and register with `module_spi_driver`. Keep bulk-transfer buffers DMA-safe and `kmalloc`ed rather than on the stack. The SPI core may bounce small or non-DMA-safe buffers, but that adds a copy.

   ```c
   static int spi_probe(struct spi_device *spi)
   {
       int ret;
       u8 tx[2] = { 0 };
       u8 rx[2];
       struct spi_transfer transfer = {
           .tx_buf = tx,
           .rx_buf = rx,
           .len = ARRAY_SIZE(tx),
       };
       struct spi_message message;

       spi->mode = SPI_MODE_0;
       spi->bits_per_word = 8;
       ret = spi_setup(spi);
       if (ret)
           return ret;
       spi_message_init(&message);
       spi_message_add_tail(&transfer, &message);
       ret = spi_sync(spi, &message);
       if (ret)
           return ret;
       return 0;
   }
   ```


   Debug the real bus without a driver loaded when possible: `i2cdetect -y 1` scans ACKs, `i2cdump -y 1 0x48` dumps registers, and `/sys/bus/i2c/devices/i2c-1/1-0048/name` identifies a bound device. Done when: registration returns are checked, the binding and address match the datasheet, each access uses the right mechanism, and the reported address, wiring, transfer, or binding cause is confirmed.

5. **Use char-device mode for a userspace interface.** Allocate a dynamic major, initialize and add the `cdev`, create the class and device node, and unwind every earlier resource on failure. Check every registration call. Inside a platform driver, prefer the corresponding `devm_*` variants and register from `probe`.

   ```c
   static dev_t devno;
   static struct cdev my_cdev;
   static struct class *my_class;

   static const struct file_operations my_fops = {
       .owner = THIS_MODULE,
       .open = my_open,
       .release = my_release,
       .read = my_read,
       .write = my_write,
       .unlocked_ioctl = my_ioctl,
       /* .llseek stays unset: an unset field means no seek support */
   };

   static int __init my_init(void)
   {
       int ret;
       struct device *my_device;

       ret = alloc_chrdev_region(&devno, 0, 1, "mydev");
       if (ret)
           return ret;
       cdev_init(&my_cdev, &my_fops);
       ret = cdev_add(&my_cdev, devno, 1);
       if (ret)
           goto err_region;
       my_class = class_create("mydev");
       if (IS_ERR(my_class)) {
           ret = PTR_ERR(my_class);
           goto err_cdev;
       }
       my_device = device_create(my_class, NULL, devno, NULL, "mydev");
       if (IS_ERR(my_device)) {
           ret = PTR_ERR(my_device);
           goto err_class;
       }
       return 0;

   err_class:
       class_destroy(my_class);
   err_cdev:
       cdev_del(&my_cdev);
   err_region:
       unregister_chrdev_region(devno, 1);
       return ret;
   }
   static void __exit my_exit(void)
   {
       device_destroy(my_class, devno);
       class_destroy(my_class);
       cdev_del(&my_cdev);
       unregister_chrdev_region(devno, 1);
   }

   module_init(my_init);
   module_exit(my_exit);
   ```

   Copy kernel and user memory only with `copy_to_user` and `copy_from_user`; their nonzero return is the number of bytes not copied and becomes `-EFAULT`. They can sleep, so hold no spinlock around them. Initialize every byte of a stack buffer before copying and advance `*ppos` only after a full copy.

   Define ioctl commands with `_IO`, `_IOR`, `_IOW`, or `_IOWR`, which encode magic, number, direction, and data size. Use a fixed-size struct for `_IOWR`, provide `compat_ioctl` when pointer-carrying commands serve 32-bit callers on a 64-bit kernel, and share one command header between kernel and userspace. Return `-ENOTTY` for an unknown command.

   Validate a requested device-memory window and caller permissions before `remap_pfn_range`; set `pgprot_noncached` for MMIO. For a DMA buffer, validate the size and permissions before mapping. Since kernel 6.12 removed `no_llseek`, leave `.llseek` unset for a non-seekable device. Since kernel 6.4, `class_create` takes only the class name; older kernels expected the module argument.

   Support blocking reads with a wait queue: `.poll` calls `poll_wait`, new data calls `wake_up_interruptible`, and async readers use `fasync_helper` for SIGIO. Done when: the dynamic registration has a checked cleanup ladder, all user copies are fault-safe, ioctl and compat contracts are shared, mmap bounds are checked before mapping, non-seekability uses an unset field, and every blocking site has a wake source.

6. **Choose the IRQ pattern from the work the handler does.**

   | Pattern | Use when |
   |---|---|
   | Hard IRQ only | Microsecond work, nothing that sleeps |
   | Threaded IRQ | I2C/SPI reads, mutexes, scheduling work |
   | `IRQF_ONESHOT` | Level-triggered line: mask until the thread returns |

   ```c
   return devm_request_threaded_irq(dev, irq, my_hardirq, my_threaded,
                                    IRQF_ONESHOT, "mydev", dev);
   ```

   The hard IRQ acknowledges and returns `IRQ_WAKE_THREAD`; the thread does the sleeping work and returns `IRQ_HANDLED`. Done when: sleeping work never runs in hard context and the acknowledge occurs in the hard IRQ.

7. **Map DMA at the right coherency.** Use a coherent mapping when CPU and device share a buffer continuously. Use streaming mappings for existing buffers and sync at every direction change.

   ```c
   cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
   dma = dma_map_single(dev, buf, size, DMA_FROM_DEVICE);
   dma_sync_single_for_device(dev, dma, size, DMA_FROM_DEVICE);
   /* device writes */
   dma_sync_single_for_cpu(dev, dma, size, DMA_FROM_DEVICE);
   dma_unmap_single(dev, dma, size, DMA_FROM_DEVICE);
   ```

   Done when: every streaming mapping has a sync before each ownership transfer and exactly one unmap.

8. **Route register access through regmap.** Declare register and value widths and `max_register`; read and write through `regmap_read`, `regmap_write`, and `regmap_update_bits`. Regmap owns locking, caching, and bulk access, so ordinary I2C and SPI drivers do not bypass it with raw `i2c_smbus_*` calls. Done when: no ordinary driver path bypasses its regmap instance.

9. **Gate clocks through runtime PM.** Fill `runtime_suspend` and `runtime_resume` in `dev_pm_ops`, enable PM with `devm_pm_runtime_enable`, and power up with `pm_runtime_resume_and_get()` rather than `pm_runtime_get_sync()`, because the former drops the usage count again when resume fails. Done when: every get has a matching put on both success and error paths.

10. **Add the udev rule for the device node.**

   ```bash
   # /etc/udev/rules.d/99-mydev.rules
   KERNEL=="mydev", MODE="0666", GROUP="plugdev"

   sudo udevadm control --reload-rules && sudo udevadm trigger
   udevadm info -a -n /dev/mydev
   ```

   Done when: after a reload, the node carries the intended mode and group.

11. **Review the finished driver against the failure table.** For each reported symptom, run the relevant DT, platform, bus, char, IRQ, DMA, PM, or udev check and record the evidence. Done when: every finding names one failure-table row and every requested operation has reviewed code or a named reason it is not applicable.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `probe` returns `-EBUSY` | Resource conflict, duplicate node, or double probe | Check the device-tree `status`, verify one driver per device and one owner per region, and use `devm_*` cleanup. |
| IRQ storm | Missing acknowledge | ACK in the hard IRQ and use `IRQF_ONESHOT` on level lines. |
| Device reads stale DMA data | Missing sync at an ownership change | Call `dma_sync_single_for_cpu` or `_for_device` at each boundary. |
| `/dev` node missing | `cdev_add`, `class_create`, or `device_create` failed | Check each return, unwind in reverse, and inspect `dmesg`. |
| `copy_to_user` or `copy_from_user` returns a fault | Invalid or faulting user pointer | Rely on the copy function's return value, optionally use `access_ok` as an early filter, and return `-EFAULT`. |
| Runtime PM hang | Get/put imbalance | Use `pm_runtime_resume_and_get` and pair every successful get with a put. |
| `-EREMOTEIO` on transfer | NACK from a wrong address or missing pull-ups | Run `i2cdetect`, check the DT `reg`, and inspect the wiring. |
| Garbled SPI data | CPOL/CPHA mismatch | Set `spi->mode` from the datasheet timing diagram. |
| Probe never runs or driver never binds | `compatible` typo, missing child node, or wrong match table | Match the exact string, confirm the node sits under the right bus, and inspect the running tree. |
| Regmap returns `-EIO` | `reg_bits` or `val_bits` disagrees with the chip | Fix the widths in `regmap_config`. |
| Probe deferred forever | Clock, regulator, PHY, or other supplier is absent or not ready | Return `-EPROBE_DEFER`, inspect `devices_deferred`, and repair or enable the supplier chain. |
| Slow bulk SPI | Transfer buffers are not DMA-safe | Allocate transfer buffers with `kmalloc`, not on the stack. |
| Wrong MMIO decoded | Parent `#address-cells` or `#size-cells` mismatch | Follow the SoC `.dtsi` parent conventions. |
| IRQ never fires | Wrong interrupt parent or cell shape | Copy the specifier shape from a working node on the same controller. |
| Overlay fails to apply | Unresolved symbols | Export target labels as `__symbols__` in the base DTB and inspect `__fixups__`. |
| Major number collision | Fixed major already taken | Register with `alloc_chrdev_region`. |
| `-ENOTTY` in userspace | Ioctl magic or number mismatch | Build both sides from one shared command header and return `-ENOTTY` only for unknown commands. |
| SIGSEGV in an `mmap` region | Cached mapping over device memory or an unchecked window | Set `pgprot_noncached` and reject a length or permission outside the device window before `remap_pfn_range`. |
| `scheduling while atomic` | Sleeping call under a spinlock in an operation | Release the lock before any call that can sleep, including user-copy functions. |
| Late init failure | `class_create` or `device_create` failed | Unwind in reverse: `cdev_del`, `device_destroy`, `class_destroy`, and `unregister_chrdev_region`. |
| `no_llseek` undeclared | Kernel 6.12 removed the symbol | Delete the `.llseek` assignment; an unset field means no seeking. |
| `class_create` argument error | Kernel 6.4 dropped the module argument | Pass the class name as the single argument. |
| Node permissions revert on replug | The udev rule does not match | Print the match chain with `udevadm info -a` and fix the key. |

| Failure class | Behavior |
|---|---|
| Probe fails after partial setup | Audit the cleanup ladder: every non-`devm` resource acquired after a jump target is released before returning the error. |
| Sleeping call in hard IRQ | Move the work to the threaded handler; the hard IRQ only acknowledges. |
| DMA corruption persists | Re-check direction flags and ownership transitions; a `DMA_FROM_DEVICE` mapping is synchronized for device before the device writes and for CPU after it completes. |
| Node permissions revert on replug | The rule does not match; print the match chain with `udevadm info -a` and fix the key. |

## Output

1. Device-tree node or board fragment, property table with cell arithmetic, phandle wiring, binding path, match snippet, compile and inspect transcript, and overlay path when the DT mode applies.
2. Device origin, driver-model relationship, managed probe/remove skeleton, unified property reads, sysfs attribute, deferred-probe evidence, and platform debug transcript when the platform mode applies.
3. I2C or SPI client skeleton, child node and match table, regmap configuration or checked raw transfer, SPI settings with DMA-safe buffers, and real-bus debug transcript when the bus mode applies.
4. Char-device registration and cleanup ladder, user-copy, ioctl and compat, mmap, and poll implementation when the char mode applies.
5. IRQ, DMA, runtime-PM, and udev wiring matched to hardware behavior.
6. Symptom findings tied to the failure table, with causes actually checked on the target.
