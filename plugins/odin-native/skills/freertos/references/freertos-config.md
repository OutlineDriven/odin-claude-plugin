# FreeRTOSConfig.h reference

Macro names checked against `include/FreeRTOS.h`, `examples/template_configuration/FreeRTOSConfig.h`, and `portable/GCC/ARM_CM4F/port.c` in the FreeRTOS-Kernel repository on 2026-09-05 (current release V11.3.1). Start from the shipped template and change the values; do not write the file from memory.

## Core configuration

```c
/* Scheduler */
#define configUSE_PREEMPTION                    1   /* 0 = cooperative */
#define configUSE_TIME_SLICING                  1   /* round-robin among equal priorities */
#define configUSE_PORT_OPTIMISED_TASK_SELECTION 0   /* 1 = CLZ-based selection on Cortex-M3 and later */
#define configUSE_TICKLESS_IDLE                 0   /* 1 = stop the tick in idle for low power */

/* Tick and clock */
#define configCPU_CLOCK_HZ                      (SystemCoreClock)
#define configTICK_RATE_HZ                      1000
#define configSYSTICK_CLOCK_HZ                  (configCPU_CLOCK_HZ / 8)  /* only if SysTick runs off a divided clock */

/* Task limits */
#define configMAX_PRIORITIES                    8
#define configMINIMAL_STACK_SIZE                128   /* words */
#define configMAX_TASK_NAME_LEN                 16
#define configIDLE_SHOULD_YIELD                 1

/* Heap */
#define configTOTAL_HEAP_SIZE                   ((size_t)(32 * 1024))  /* bytes */
```

## Heap implementations

The kernel ships five allocators in `portable/MemMang/`; link exactly one.

| File | Free supported | Behavior |
|---|---|---|
| `heap_1.c` | No | Allocate only; deterministic; for systems that create everything at start |
| `heap_2.c` | Yes | Best fit without coalescing; fragments under mixed sizes; kept for old projects |
| `heap_3.c` | Yes | Wraps the C library `malloc` and `free` in a critical section |
| `heap_4.c` | Yes | First fit with coalescing; the usual choice |
| `heap_5.c` | Yes | `heap_4` behavior across several non-contiguous regions |

`heap_5` takes its regions before the scheduler starts:

```c
const HeapRegion_t xHeapRegions[] = {
    { (uint8_t *)0x20000000, 0x8000 },   /* SRAM1, 32 KiB */
    { (uint8_t *)0x10000000, 0x4000 },   /* CCM, 16 KiB */
    { NULL, 0 }
};
vPortDefineHeapRegions(xHeapRegions);
```

`configENABLE_HEAP_PROTECTOR 1` (V11.0.0 and later) adds bounds checks and pointer obfuscation to `heap_4` and `heap_5` block headers.

## Hook functions

```c
/* required when configUSE_MALLOC_FAILED_HOOK == 1 */
void vApplicationMallocFailedHook(void) {
    taskDISABLE_INTERRUPTS();
    for (;;);
}

/* required when configCHECK_FOR_STACK_OVERFLOW > 0 */
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName) {
    (void)xTask; (void)pcTaskName;
    taskDISABLE_INTERRUPTS();
    for (;;);
}

/* configUSE_IDLE_HOOK == 1: a place to enter a sleep mode */
void vApplicationIdleHook(void) {
    __WFI();
}

/* configUSE_TICK_HOOK == 1: runs inside the tick interrupt, so keep it short */
void vApplicationTickHook(void) {
}
```

## Software timers

```c
#define configUSE_TIMERS                        1
#define configTIMER_TASK_PRIORITY               (configMAX_PRIORITIES - 1)
#define configTIMER_QUEUE_LENGTH                10
#define configTIMER_TASK_STACK_DEPTH            (configMINIMAL_STACK_SIZE * 2)
```

```c
TimerHandle_t xTimer = xTimerCreate("wdog", pdMS_TO_TICKS(5000),
                                    pdFALSE,          /* pdTRUE = auto-reload */
                                    (void *)0, vTimerCallback);
xTimerStart(xTimer, 0);

void vTimerCallback(TimerHandle_t xTimer) {
    /* runs in the timer service task, not in an ISR */
}
```

## Interrupt priorities on Cortex-M

The Cortex-M ports read `configKERNEL_INTERRUPT_PRIORITY` and `configMAX_SYSCALL_INTERRUPT_PRIORITY` as 8-bit NVIC values, so the priority bits sit in the top bits. The `configLIBRARY_*` names are the convention the kernel demos use to write the values as small numbers first.

```c
#define configPRIO_BITS                              4    /* __NVIC_PRIO_BITS from the device header */
#define configLIBRARY_LOWEST_INTERRUPT_PRIORITY      15
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY 5

#define configKERNEL_INTERRUPT_PRIORITY \
    (configLIBRARY_LOWEST_INTERRUPT_PRIORITY << (8 - configPRIO_BITS))
#define configMAX_SYSCALL_INTERRUPT_PRIORITY \
    (configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY << (8 - configPRIO_BITS))
```

Rule: an ISR that calls any `FromISR` API must have a numeric NVIC priority equal to or greater than `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` (lower urgency). An ISR with a smaller number (higher urgency) must not call the kernel at all. With `configASSERT` on, the port checks this on every `FromISR` call.

```c
NVIC_SetPriority(USART1_IRQn, 6);   /* 6 >= 5: may call FromISR APIs */
NVIC_SetPriority(DMA1_IRQn, 2);     /* 2 <  5: must not touch the kernel */
```
