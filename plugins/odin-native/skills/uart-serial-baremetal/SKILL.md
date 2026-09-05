---
name: uart-serial-baremetal
description: 'Use when configuring UART baud rate/BRR, polling or IRQ-driven TX/RX, serial printf retargeting, USART interrupts, or UART with DMA on bare-metal MCUs. Not for the DMA stream: use dma-baremetal.'
---

# UART serial on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The first log output on new hardware is needed, a serial protocol to a module must be implemented, a blocking HAL UART is being replaced, or characters arrive garbled or go missing. |
| Authority | Read-only: emits baud arithmetic, register sequences, ISR and retarget code to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The baud register value is computed from the actual peripheral clock with the reference manual formula, the pins are muxed, TX and RX work polled, the interrupt path clears overrun the way the manual states, and `printf` reaches the port when requested. |

## Inputs

- Target part and USART instance, with the bus it sits on and that bus's clock after prescaling.
- Baud rate, frame (8N1 unless stated), and whether oversampling by 8 is needed for high rates.
- TX and RX pins with their alternate-function numbers, configured per `gpio-baremetal`.
- I/O model: polled, interrupt-driven with a ring buffer, or DMA.
- C library in use (newlib, newlib-nano) when `printf` retargeting is requested.

## Procedure

1. Compute the baud register from the actual peripheral clock. On STM32 with oversampling by 16, `USARTDIV = f_CK / (16 * baud)`, and `BRR` stores the mantissa in bits 15 to 4 and the 4-bit fraction in bits 3 to 0, which is why `BRR = f_CK / baud` (rounded) gives the same encoding. For 115200 baud at 84 MHz, `BRR` = 729 (`0x2D9`), an actual rate of 115226 baud and an error of 0.02 %. `f_CK` is the APB clock for that USART, not the system clock. Done when: the computed rate is within 2 % of the target, or oversampling by 8 is selected for a closer match.

   ```c
   void usart2_init(uint32_t pclk, uint32_t baud)
   {
       RCC->APB1ENR |= RCC_APB1ENR_USART2EN;
       (void)RCC->APB1ENR;
       /* PA2 and PA3 as AF7 per gpio-baremetal */
       USART2->BRR = (pclk + baud / 2U) / baud;   /* OVER8 = 0: mantissa[15:4] fraction[3:0] */
       USART2->CR1 = USART_CR1_TE | USART_CR1_RE | USART_CR1_UE;
   }
   ```

2. Write polled transmit and receive: wait for `TXE` before writing the data register, wait for `RXNE` before reading it. Done when: a terminal at the configured baud echoes typed characters.

   ```c
   void uart_putc(USART_TypeDef *u, char c)
   {
       while (!(u->SR & USART_SR_TXE)) { }
       u->DR = (uint8_t)c;
   }

   char uart_getc(USART_TypeDef *u)
   {
       while (!(u->SR & USART_SR_RXNE)) { }
       return (char)(uint8_t)u->DR;
   }
   ```

3. Move reception into an interrupt with a ring buffer for anything beyond a console. Enable `RXNEIE`, enable the NVIC entry, and in the handler push each byte. Handle overrun: on STM32F1 and F4 `ORE` clears only by reading `SR` then `DR`, and a set `ORE` with `RXNEIE` enabled re-enters the handler forever if left uncleared. On the newer USART (F0, F3, L4, G0, G4) write `ORECF` to `ICR`. Done when: a burst longer than the ring buffer is received without the handler spinning.

   ```c
   void USART2_IRQHandler(void)
   {
       uint32_t sr = USART2->SR;
       if (sr & USART_SR_RXNE) {
           rb_push(&rx_rb, (uint8_t)USART2->DR);
       }
       if (sr & USART_SR_ORE) {
           (void)USART2->DR;   /* SR read above plus this DR read clears ORE */
       }
   }
   ```

4. Retarget `printf` when newlib is linked. Provide `_write` and route it to the polled transmit; link with `--specs=nosys.specs` so the other syscalls have stubs, or supply them. Done when: `printf("%d\n", 42)` appears on the terminal.

   ```c
   int _write(int fd, char *ptr, int len)
   {
       (void)fd;
       for (int i = 0; i < len; i++) uart_putc(USART2, ptr[i]);
       return len;
   }
   ```

5. Use DMA for bulk transfers: set `DMAR` or `DMAT` in `CR3` and configure the stream per `dma-baremetal`. The USART side is only the request enable. Done when: the DMA stream counts down as bytes arrive or leave.
6. Verify the timing on the wire, not by eye: measure one bit period on a scope or logic analyzer and compare with `1 / baud`. A garbled console with a plausible-looking baud is almost always a wrong `f_CK` assumption. Done when: the measured bit period matches the configured baud within 2 %.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Garbage characters | `BRR` computed from the wrong clock | Use the APB clock for that USART after its prescaler. |
| Lost bytes, then silence | `ORE` set and never cleared | Read `SR` then `DR` (or write `ORECF`) in the handler. |
| No output | TX pin not in alternate-function mode, or `UE`/`TE` clear | Configure the pin; set `TE` and `UE`. |
| `printf` blocks or prints nothing | `_write` missing or newlib buffering | Provide `_write`; use `\n` or `setvbuf` to flush. |
| Works at 9600, fails at 921600 | Baud error too large at oversampling 16 | Set `OVER8` and recompute `BRR` with the oversampling-by-8 encoding. |

## Output

For the target USART: the baud arithmetic and `BRR` value with its error, the init sequence, polled TX and RX, the interrupt handler with the correct overrun clearing, the `printf` retarget when requested, and the wire measurement that confirms the baud.
