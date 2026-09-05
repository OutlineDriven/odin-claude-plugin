---
name: protocol-analysis
description: 'Use when decoding I2C, SPI, or UART captures with sigrok or PulseView, checking bus traffic against a datasheet, or post-processing captures in Python. Not for bus drivers: use spi-i2c-baremetal.'
---

# Protocol analysis (I2C / SPI / UART)

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A serial bus capture needs decoding, a device does not answer on I2C/SPI/UART, or a logic-analyzer capture needs correlation with the firmware driver. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the capture setup; no file writes, no rollback needed. No remote mutation. |
| Side effect | Capture and decode commands plus a verdict in chat. Nothing is written. |
| Done | The bus fault is named (wrong address, wrong mode, missing pull-up, baud drift) or the capture is confirmed clean against the datasheet. |

## Inputs

1. Capture or symptom (required): a sigrok/PulseView capture, a CSV export, or a description of the failing transaction.
2. Datasheet or reference manual (required): the expected transaction format for the device.
3. Firmware driver source (optional): for correlating the capture with register writes.

## Procedure

1. Set up the capture stack.

   ```text
   Physical probe -> logic analyzer hardware (or GPIO bit-bang)
   |-- sigrok-cli / PulseView GUI
   |-- protocol decoder (i2c, spi, uart)
   +-- export VCD/CSV for scripts
   ```

   sigrok drives the common open-source path, including cheap FX2-based boards. Done when: the analyzer records edges on the probed lines.
2. Capture with sigrok-cli or PulseView.

   ```bash
   pulseview                                    # GUI: pick device, channels, decoder

   sigrok-cli --driver fx2lafw --config samplerate=1MHz \
     --channels 0=SDA,1=SCL \
     --samples 1m \
     -P i2c                                     # -P attaches the protocol decoder
   ```

   Done when: the decoder emits transactions, not raw edges.
3. Check I2C against the expected phases.

   | Phase | Lines |
   |---|---|
   | START | SDA falls while SCL is high |
   | Address plus R/W | 7 bits, then ACK |
   | Data bytes | ACK per byte |
   | STOP | SDA rises while SCL is high |

   A NACK at the address phase means the address is wrong or the device is held in reset. Done when: each phase matches, or the failing phase is named.
4. Check SPI. Confirm the mode (CPOL/CPHA), bit order (MSB first is typical), CS polarity, and word size against the device datasheet and the driver's `spi_setup()`. Done when: mode and framing match on both ends.
5. Check UART. Set the baud rate (9600 or 115200 are common), the frame (8N1 is typical), and signal polarity. UART is asynchronous: sample at least 4x the baud rate, higher for marginal signals. Done when: decoded bytes match the expected output.
6. Post-process a CSV export in Python.

   ```python
   import csv

   with open("capture.csv") as f:
       for ts, ch0, ch1 in csv.reader(f):
           # edge-detect, then reconstruct bits
           pass
   ```

   Done when: the script extracts the transactions of interest.
7. Correlate the capture with the firmware.

   ```text
   Logic capture timestamp
   |-- match the driver's register write sequence
   |-- compare inter-byte delay against the datasheet maximum
   +-- flag extra clock pulses (mode fault)
   ```

   Done when: every bus anomaly maps to a driver line or a datasheet violation.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Garbage decode | Sample rate too low | Sample at least 4x the bus speed |
| Floating lines | Missing pull-ups | Enable internal pulls or fit external resistors |
| SPI bits shifted | Mode mismatch | Take the CPOL/CPHA pair from the reference manual |
| UART framing errors | Baud drift | Measure the actual bit time, do not trust the nominal rate |
| No decoder output | Decoder not attached | Pass `-P i2c` (or `spi`, `uart`) to sigrok-cli, or add the decoder in PulseView |

## Output

A verdict naming the bus fault and its phase, or a confirmation that the capture matches the datasheet, with the decode settings used.
