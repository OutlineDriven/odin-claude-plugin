---
name: dma-baremetal
description: 'Use when configuring DMA channels, circular buffer mode, double buffering, memory-to-peripheral transfers, or DMA IRQ completion on bare-metal MCUs. Not for cache theory: use cpu-cache-opt.'
---

# DMA on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A UART, SPI, or ADC transfer must run without the CPU, an audio or sensor stream needs a double buffer, or a DMA transfer does not start or delivers corrupt data. |
| Authority | Read-only: emits stream configuration, interrupt handling, and cache-maintenance sequences to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The stream and channel (or request line) are named from the reference manual request table, the register sequence configures the stream before enabling it, the interrupt handler clears the right flag register, and cache maintenance is stated for cores with a data cache. |

## Inputs

- Target part and DMA controller type (STM32F4 stream and channel matrix, STM32L4 channel and request selection, STM32G0/G4/H7 DMAMUX, or another controller with its request table).
- Direction: peripheral to memory, memory to peripheral, or memory to memory.
- Peripheral data register address and data width.
- Buffer address, length, and whether the buffer is single, circular, or double.
- Whether the core has a data cache (Cortex-M7) and where the buffer lives.

## Procedure

1. Find the request mapping. On STM32F4 each peripheral request is fixed to a stream and channel pair in the DMA chapter's request table; USART2 RX is DMA1 Stream 5, Channel 4, and ADC1 is DMA2 Stream 0 or Stream 4, Channel 0. On DMAMUX parts the request is a number written to the mux channel. Done when: the stream and channel or request number are quoted from the table.
2. Enable the DMA controller clock, make sure the stream is disabled, and configure it: peripheral address, memory address, count, direction, data sizes, memory increment, and interrupt enables. Set `EN` in a separate write after configuration; a stream still enabled ignores configuration writes. Done when: `EN` reads 0 before configuration and 1 after the final write.

   ```c
   RCC->AHB1ENR |= RCC_AHB1ENR_DMA1EN;

   DMA1_Stream5->CR &= ~DMA_SxCR_EN;
   while (DMA1_Stream5->CR & DMA_SxCR_EN) { }

   DMA1_Stream5->PAR  = (uint32_t)&USART2->DR;
   DMA1_Stream5->M0AR = (uint32_t)rx_buf;
   DMA1_Stream5->NDTR = sizeof rx_buf;
   DMA1_Stream5->CR   = DMA_SxCR_CHSEL_2      /* channel 4 */
                      | DMA_SxCR_MINC         /* increment memory address */
                      | DMA_SxCR_TCIE;        /* transfer-complete interrupt */
                      /* DIR = 00: peripheral to memory; PSIZE, MSIZE = 00: byte */
   DMA1_Stream5->CR  |= DMA_SxCR_EN;

   USART2->CR3 |= USART_CR3_DMAR;             /* peripheral side must request DMA */
   ```

3. Enable the request on the peripheral side. The DMA controller only moves data when the peripheral raises its request: `DMAR` or `DMAT` in `USART_CR3`, `RXDMAEN` or `TXDMAEN` in `SPI_CR2`, `DMA` in `ADC_CR2`. Done when: the peripheral's DMA enable bit is set and `NDTR` starts counting down.
4. For continuous streams, set `CIRC` so `NDTR` reloads, and enable both the half-transfer and transfer-complete interrupts. Process the first half of the buffer in the half-transfer interrupt and the second half in the transfer-complete interrupt, so the CPU never reads the half the DMA is writing. For two separate buffers, use double-buffer mode (`DBM` with `M1AR`) where the controller supports it. Done when: the two interrupts alternate and each processes only its own half.

   ```c
   DMA1_Stream5->CR |= DMA_SxCR_CIRC | DMA_SxCR_HTIE | DMA_SxCR_TCIE;
   ```

5. Clear flags in the right register. On STM32F4, streams 0 to 3 report in `LISR` and clear through `LIFCR`; streams 4 to 7 report in `HISR` and clear through `HIFCR`. Write 1 to the flag bit to clear it; an unclear flag re-enters the handler at once. Done when: the handler reads the status register for its stream, clears exactly the flags it handled, and returns.

   ```c
   void DMA1_Stream5_IRQHandler(void)
   {
       if (DMA1->HISR & DMA_HISR_HTIF5) {
           DMA1->HIFCR = DMA_HIFCR_CHTIF5;
           process(rx_buf, sizeof rx_buf / 2);
       }
       if (DMA1->HISR & DMA_HISR_TCIF5) {
           DMA1->HIFCR = DMA_HIFCR_CTCIF5;
           process(rx_buf + sizeof rx_buf / 2, sizeof rx_buf / 2);
       }
   }
   ```

6. On a core with a data cache (Cortex-M7, STM32F7 and H7), keep the DMA buffer coherent. Either place the buffer in a region the MPU marks non-cacheable, or clean the cache before a memory-to-peripheral transfer and invalidate it after a peripheral-to-memory transfer. The CMSIS maintenance calls work on 32-byte lines, so align the buffer and round its size to 32 bytes. Done when: the buffer is in a non-cacheable region, or every transfer is bracketed by the matching maintenance call on an aligned range.

   ```c
   SCB_CleanDCache_by_Addr((uint32_t *)tx_buf, (int32_t)sizeof tx_buf);       /* before TX */
   SCB_InvalidateDCache_by_Addr((uint32_t *)rx_buf, (int32_t)sizeof rx_buf);  /* after RX complete */
   ```

7. Check that the memory the buffer lives in is reachable by the DMA master. On STM32F405 and F407 the 64 KB core-coupled memory at `0x10000000` is not on the DMA path; place buffers in SRAM1. Done when: the buffer address is inside a region the bus matrix figure connects to the DMA controller.
8. Verify with a known pattern: fill the source, run one transfer, compare the destination, then run the circular case and confirm the interrupt sequence with a GPIO toggle or a counter. Done when: the data matches and the interrupt order is as designed.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Transfer never starts | Wrong stream or channel for the peripheral request | Re-read the request table; the pair is fixed per peripheral. |
| `NDTR` stays at its initial value | Peripheral DMA request not enabled | Set `DMAR`, `DMAT`, `RXDMAEN`, `TXDMAEN`, or `DMA` on the peripheral. |
| Configuration writes ignored | Stream was still enabled | Clear `EN`, wait for it to read 0, then configure. |
| Received data stale or partly old | Data cache not invalidated on Cortex-M7 | Invalidate after RX complete, or make the region non-cacheable. |
| Handler re-enters continuously | Flag not cleared or cleared in the wrong register | Write the flag to `LIFCR` for streams 0 to 3 or `HIFCR` for 4 to 7. |
| Transfer error flag set | Buffer in memory the DMA cannot reach, or misaligned for the data size | Move the buffer to SRAM1; align to the data size. |

## Output

A stream configuration sequence for the target part with the request mapping quoted from the reference manual, the peripheral-side enable, the interrupt handler with the correct flag register, and the cache or placement rule for the buffer.
