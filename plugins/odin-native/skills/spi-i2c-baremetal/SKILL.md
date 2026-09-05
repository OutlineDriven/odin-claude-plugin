---
name: spi-i2c-baremetal
description: 'Use when implementing SPI/I2C master transfers, register read/write protocols, I2C START/STOP, clock phase/polarity, or bus stalls on bare-metal MCUs. Not for Linux drivers: use bus-drivers-i2c-spi.'
---

# SPI and I2C on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A sensor, flash, or display must be driven over SPI or I2C without a HAL, a device NACKs or the bus sticks, or a HAL transfer is being replaced with register-level code. |
| Authority | Read-only: emits configuration, transaction sequences, and recovery procedures to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The bus clock, mode (SPI phase and polarity or I2C speed), and pin configuration match the slave datasheet, one register read transaction is written flag by flag from the MCU reference manual, and the bus-stuck recovery is stated. |

## Inputs

- Target MCU and its SPI or I2C peripheral version (STM32 I2C v1 on F1 and F4 with `SR1`/`SR2`; I2C v2 on F0, F3, L4, G0, G4 with `CR2` and `ISR`).
- Slave datasheet: 7-bit address, SPI mode (CPOL, CPHA), maximum clock, register read and write protocol.
- Pins for SCK, MOSI, MISO, CS, or SCL, SDA, configured as alternate function through `gpio-baremetal`; SDA and SCL as open-drain with pull-ups.
- Bus clock frequency feeding the peripheral.

## Procedure

1. Configure the SPI master. Choose the mode from the slave datasheet: mode 0 is CPOL=0, CPHA=0. Set master, software slave management with the internal select high, and a baud divider that stays under the slave's maximum clock. Enable last. Done when: the clock on the wire matches the slave's mode and speed limit.

   ```c
   SPI1->CR1  = SPI_CR1_MSTR | SPI_CR1_SSM | SPI_CR1_SSI
              | (3U << SPI_CR1_BR_Pos);          /* fPCLK / 16 */
   SPI1->CR1 |= SPI_CR1_SPE;
   ```

2. Write the full-duplex byte transfer: wait for `TXE`, write one byte, wait for `RXNE`, read one byte. On peripherals with a 16-bit data register and data packing (STM32F0, F3, L4), access `DR` as a byte or the peripheral sends two; on STM32F4 a 16-bit `DR` write with `DFF` clear sends one byte either way. Done when: a loopback (MOSI tied to MISO) returns each byte sent.

   ```c
   uint8_t spi_xfer(SPI_TypeDef *spi, uint8_t tx)
   {
       while (!(spi->SR & SPI_SR_TXE)) { }
       *(volatile uint8_t *)&spi->DR = tx;
       while (!(spi->SR & SPI_SR_RXNE)) { }
       return *(volatile uint8_t *)&spi->DR;
   }
   ```

3. Drive chip select from a GPIO around the whole transaction. Assert before the first clock edge and release after the last. Many sensors set bit 7 of the register address for a read. Done when: the scope shows CS low across the full frame.

   ```c
   cs_low();
   spi_xfer(SPI1, reg | 0x80U);        /* read bit per the slave datasheet */
   uint8_t val = spi_xfer(SPI1, 0xFFU);
   cs_high();
   ```

4. Write the I2C register read as the sequence START, address with write bit, register, repeated START, address with read bit, data with NACK on the last byte, STOP. On STM32 I2C v1, poll `SB` after START, then write the address; poll `ADDR` and clear it by reading `SR1` then `SR2`; poll `TXE` before each data byte and `BTF` before the repeated START; set `ACK` low before the final byte and poll `RXNE`. On I2C v2, program `SADD`, `NBYTES`, `RD_WRN`, and `START` in `CR2`, then follow `TXIS`, `RXNE`, and `TC` in `ISR`, with `AUTOEND` or a manual `STOP`. Done when: the transaction reads a known register (`WHO_AM_I`) and returns the datasheet value.

   ```c
   bool i2c_read_reg(I2C_TypeDef *i2c, uint8_t addr7, uint8_t reg, uint8_t *out)
   {
       if (!i2c_start(i2c))                        return false;
       if (!i2c_tx_addr(i2c, (addr7 << 1) | 0U))   return false;   /* ADDR: read SR1 then SR2 */
       if (!i2c_tx_byte(i2c, reg))                 return false;   /* wait TXE, then BTF */
       if (!i2c_start(i2c))                        return false;   /* repeated START */
       if (!i2c_tx_addr(i2c, (addr7 << 1) | 1U))   return false;
       *out = i2c_rx_last(i2c);                                    /* ACK=0 before, then RXNE */
       i2c_stop(i2c);
       return true;
   }
   ```

   Each helper is one flag wait plus one register access, with a timeout, as `peripherals-from-datasheet` prescribes.

5. Check the address width. Datasheets give the address as 7 bits or as an 8-bit value with the R/W bit included; passing an 8-bit value to a 7-bit shift produces a NACK. Done when: the address on the wire matches the datasheet's 7-bit value shifted left by one.
6. Recover a stuck bus. When a slave holds SDA low after an interrupted transaction, reconfigure SCL as a GPIO and pulse it up to nine times until SDA releases, then generate a STOP, then reinitialize the peripheral. A slave that stretches the clock is not stuck; wait for it. Done when: SDA reads high with the bus idle.
7. Match the transaction shape to the device class. Done when: the pattern below that applies is followed.

   | Pattern | Bus | Typical device |
   |---|---|---|
   | Register address then data bytes | I2C and SPI | Sensors |
   | Register address with bit 7 set for read | SPI | Sensors with combined R/W and address byte |
   | Command byte then 24-bit address then data | SPI | NOR flash |

8. Verify with a logic analyzer or scope on the first transaction: check the clock idle level and sampling edge against the slave's mode table, and confirm the ACK bit after the address. Done when: the capture matches the datasheet timing diagram.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| I2C NACK on address | 8-bit address used as 7-bit, or wrong R/W bit | Use the 7-bit address shifted left; set bit 0 for read. |
| SPI returns garbage | CPOL or CPHA differs from the slave mode | Match the slave's mode table. |
| SCL stuck low | Slave clock stretch, or slave mid-transaction after a reset | Wait for stretch; otherwise pulse SCL up to nine times and STOP. |
| First byte wrong | CS asserted after the first clock edge, or stale byte in `DR` | Assert CS before the transfer; read `DR` to flush before starting. |
| Two bytes sent for one write | 16-bit `DR` access on a data-packing peripheral | Access `DR` through a byte pointer. |

## Output

A bus configuration and one complete register-read transaction for the target peripheral version, written flag by flag with the reference manual's names, plus the chip-select rule, address-width check, and stuck-bus recovery.
