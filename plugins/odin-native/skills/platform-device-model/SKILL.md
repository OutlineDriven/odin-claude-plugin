---
name: platform-device-model
description: 'Use when implementing or debugging platform_driver probe/remove, sysfs attributes, device properties, or deferred probe on Linux. Not for device tree syntax: use device-tree.'
---

# Platform device model

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing or debugging a `platform_driver`: the probe/remove lifecycle, resource acquisition, DT or ACPI property reads, `sysfs` attributes, deferred probe, or uevent and `/dev` node creation. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns guidance, driver skeletons, and debug commands. No source files are modified. |
| Done | The object model, a probe/remove skeleton, the property and sysfs patterns, the deferred-probe rule, and a debug checklist are delivered. |

## Inputs

1. Driver code or question (required).
2. Bus (optional): `platform` by default; the same model covers `amba` and others.
3. Device origin (optional): the `compatible` value, ACPI id, or board file entry that instantiates the device.
4. Symptom (optional): `-EBUSY`, a probe that defers forever, a missing `/dev` node, or a `remove` crash.

## Procedure

1. Name the device origin before writing code. Platform devices come from device tree via `of_platform_populate()`, from ACPI tables, or from legacy board files. The origin decides which match table binds the driver. Done when: the origin is named and the match table that fits it is chosen.
2. State the driver-model hierarchy for the bus: a `bus_type` (platform, amba, pci, i2c, spi) carries `struct device` instances, each bound to at most one `struct device_driver`, and the core calls the driver's `probe` when a match appears and `remove` at unbind. Done when: the caller can restate the bus-device-driver-probe relationship.
3. Write the probe/remove skeleton. Use `devm_*` managed resources so the core unwinds them after `remove` returns; `remove` returns `void` because the int-returning form was removed from `platform_driver` in kernel 6.11, and this tree's floor (LTS 6.18, mainline 7.2) is past it.

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
       .probe  = my_probe,
       .remove = my_remove,
       .driver = {
           .name = "my-dev",
           .of_match_table = my_of_match,
       },
   };
   module_platform_driver(my_pdrv);
   ```

   Done when: the skeleton has the resource lookup, a managed remap, private-data storage, and the registration macro, and every manually freed resource corresponds to no `devm_*` allocation.
4. Read device properties through the unified property API, which resolves DT and ACPI behind one call; reach for `of_*` accessors only for DT-specific semantics.

   ```c
   u32 speed;
   device_property_read_u32(&pdev->dev, "clock-speed", &speed);
   bool has_feature = device_property_present(&pdev->dev, "feature-x");
   ```

   Done when: each property read names its type helper and handles the error return.
5. Expose driver state through a `sysfs` attribute. Define it with `DEVICE_ATTR_RO` or `DEVICE_ATTR_RW`, format with `sysfs_emit`, and create it in `probe`; list it in the driver's `.dev_groups` to have the core create and remove it at bind and unbind.

   ```c
   static ssize_t status_show(struct device *dev,
                              struct device_attribute *attr, char *buf)
   {
       return sysfs_emit(buf, "ok\n");
   }
   static DEVICE_ATTR_RO(status);

   /* in probe */
   device_create_file(&pdev->dev, &dev_attr_status);
   ```

   Done when: the attribute is visible under `/sys/bus/platform/devices/<device>/` and cannot leak after unbind.
6. Apply the deferred-probe rule: return `-EPROBE_DEFER` from `probe` when a required clock, regulator, or other supplier is not ready, and let the core retry when suppliers appear. Check `/sys/kernel/debug/devices_deferred` to see who is waiting on whom. Done when: every optional-ordering dependency is either satisfied by DT ordering or handled with the return code.
7. Debug the binding from the running system.

   ```bash
   ls /sys/bus/platform/devices/
   ls /sys/bus/platform/drivers/
   cat /sys/kernel/debug/devices_deferred   # debugfs mounted
   udevadm monitor                          # watch uevents for /dev nodes
   ```

   Route deeper work: `device-tree` for the hardware description, `bus-drivers-i2c-spi` for I2C/SPI children, `writing-char-drivers` for a userspace char interface. Done when: the reported symptom maps to one cause and one fix.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `-EBUSY` on probe | Resource claimed twice | Check for duplicate nodes or an already-bound driver on the same region. |
| No `/dev` node | No char device registered | Register one; see `writing-char-drivers`. |
| Deferred forever | Supplier driver missing or never probes | Fix the DT dependency chain or enable the supplier driver. |
| Crash in `remove` | Manual free racing a `devm_*` allocation | Remove the manual free or the `devm_*` call; keep one owner per resource. |
| Driver never binds | `.name` versus `compatible` confusion | For DT devices the core matches `of_match_table`; `.name` matters only for board-file devices. |

## Output

The device origin and match table; the driver-model relationship statement; the probe/remove skeleton; the property reads; the sysfs attribute with its creation path; the deferred-probe rule with the deferred list; the debug transcript; the routing to related skills.
