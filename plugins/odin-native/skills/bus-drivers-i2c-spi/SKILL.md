---
name: bus-drivers-i2c-spi
description: 'Use when writing a Linux i2c_driver or spi_driver, doing bus register access, DMA-safe SPI transfers, or debugging -EREMOTEIO. Not for MMIO platform drivers: use platform-device-model.'
---

# Bus drivers (I2C and SPI)

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing a Linux I2C or SPI client driver: bus registration, `i2c_transfer` or `spi_sync`, regmap over the bus, DMA-safe SPI buffers, device tree binding on bus children, or NACK and `-EREMOTEIO` debugging. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns driver skeletons and debug commands. No source files are modified. |
| Done | The client driver skeleton, the transfer or regmap access pattern, the DT child node, and a debug path for the reported symptom are delivered. |

## Inputs

1. Device and bus (required): the chip address on I2C or chip-select on SPI, the adapter or controller, and the datasheet register map.
2. Transfer shape (optional): register width and value width, which set `regmap_config`.
3. Failure report (optional): the symptom, such as `-EREMOTEIO`, a stuck bus, or a probe that never runs.

## Procedure

1. Write the I2C client driver skeleton. The bus core owns the adapter; the driver owns registers only.

   ```c
   #include <linux/i2c.h>
   #include <linux/mod_devicetable.h>

   static void my_remove(struct i2c_client *client) {}

   static struct i2c_driver my_driver = {
       .probe  = my_probe,
       .remove = my_remove,
       .driver = {
           .name = "mysensor",
           .of_match_table = my_of_id,
       },
       .id_table = my_id,
   };
   module_i2c_driver(my_driver);
   ```

   `remove` returns `void`; the int-returning form was removed from the bus driver structs in kernel 6.11, and the kernel floor here (LTS 6.18, mainline 7.2) is past it. Done when: the driver struct carries probe, remove, both match tables, and the module registration macro.
2. Bind from the device tree child node. The `reg` property is the bus address.

   ```dts
   &i2c1 {
       sensor@48 {
           compatible = "vendor,sensor";
           reg = <0x48>;
       };
   };
   ```

   ```c
   static const struct of_device_id my_of_id[] = {
       { .compatible = "vendor,sensor" },
       { }
   };
   MODULE_DEVICE_TABLE(of, my_of_id);
   ```

   Done when: the DT `compatible` matches one `of_device_id` entry and the address matches the datasheet.
3. Use regmap for register access. It centralizes endianness, caching, and retries; hand-rolled `i2c_transfer` pairs are for unusual protocols only.

   ```c
   static const struct regmap_config my_regmap_config = {
       .reg_bits = 8,       /* register address width */
       .val_bits = 8,       /* register value width */
       .max_register = 0x7F,
   };

   map = devm_regmap_init_i2c(client, &my_regmap_config);
   if (IS_ERR(map))
       return PTR_ERR(map);

   regmap_read(map, REG_STATUS, &val);
   regmap_write(map, REG_CTRL, CTRL_ENABLE);
   regmap_update_bits(map, REG_CTRL, MASK, ENABLE);
   ```

   `-EIO` from regmap usually means `reg_bits` or `val_bits` disagrees with the chip. Done when: every register access goes through regmap and the config matches the datasheet widths.
4. Write a raw `i2c_transfer` only when regmap does not fit, for example a write-then-read with a repeated start.

   ```c
   u8 reg = 0x0F, val;
   struct i2c_msg msgs[] = {
       { .addr = client->addr, .flags = 0,        .len = 1, .buf = &reg },
       { .addr = client->addr, .flags = I2C_M_RD, .len = 1, .buf = &val },
   };
   ret = i2c_transfer(client->adapter, msgs, 2);
   ```

   Done when: the message pair encodes the write-then-read and the return value is checked.
5. Write the SPI driver with explicit transfer settings from the datasheet.

   ```c
   static int spi_probe(struct spi_device *spi)
   {
       spi->mode = SPI_MODE_0;      /* CPOL/CPHA from the datasheet */
       spi->bits_per_word = 8;
       spi_setup(spi);

       struct spi_transfer t = {
           .tx_buf = tx,
           .rx_buf = rx,
           .len    = len,
       };
       struct spi_message m;
       spi_message_init(&m);
       spi_message_add_tail(&t, &m);
       return spi_sync(spi, &m);
   }
   ```

   Register with `module_spi_driver`. For bulk transfers, keep buffers DMA-safe: `kmalloc`ed, not stack. The SPI core can bounce small or non-DMA-safe buffers, but the copy costs throughput. Done when: mode, word size, and buffer lifetime match the controller's DMA needs.
6. Debug the reported symptom on the real bus. `i2c-tools` runs from user space with no driver loaded.

   ```bash
   i2cdetect -y 1                        # scan addresses for an ACK
   i2cdump -y 1 0x48                     # dump registers
   cat /sys/bus/i2c/devices/i2c-1/1-0048/name
   ```

   Route deeper work: `spi-i2c-baremetal` for register-level protocol mechanics, `device-tree` for node and binding work, `platform-device-model` for driver-model context, `writing-char-drivers` for a userspace char interface over the sensor. Done when: the symptom maps to a confirmed address, wiring, or binding cause.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `-EREMOTEIO` on transfer | NACK: wrong address or no pull-ups | `i2cdetect` to scan; check `reg` in the DT node and the wiring. |
| Garbled SPI data | CPOL/CPHA mismatch | Set `spi->mode` from the datasheet timing diagram. |
| Probe never runs | DT `compatible` typo or missing child node | Match `of_match_table` exactly; confirm the node sits under the right bus. |
| regmap returns `-EIO` | Register or value width mismatch | Fix `reg_bits`/`val_bits` in `regmap_config`. |
| Probe deferred | Clock or regulator supplier not ready | Return `-EPROBE_DEFER`; fix the supplier in DT. |
| Slow bulk SPI | Buffers not DMA-safe | Allocate with `kmalloc` for transfer buffers. |

## Output

The client driver skeleton for the requested bus; the DT child node and match table; the regmap config and access pattern, or the raw transfer; the SPI transfer settings with DMA-safety rules; the debug command run against the reported symptom; the routing to related skills.
