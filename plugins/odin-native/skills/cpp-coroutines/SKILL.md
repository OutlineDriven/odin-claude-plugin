---
name: cpp-coroutines
description: 'Use when working with C++20 co_await, co_yield, and co_return, implementing promise_type, sizing coroutine frames, or debugging suspended coroutines in GDB. Not for Rust async: use idiomatic-rust.'
---

# C++20 coroutines

A coroutine is a function whose execution suspends and resumes while its frame survives on the heap. The language provides the keywords; the library author provides `promise_type`, which decides what suspension and return mean.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task writes or reviews `co_await`, `co_yield`, or `co_return` code, implements a `promise_type`, explains the coroutine frame, or debugs a suspended coroutine. |
| Authority | Read-only. The skill explains mechanics and drafts coroutine types; edits land through the normal coding path. No remote mutation. |
| Side effect | None. |
| Done | The drafted coroutine type compiles against the project standard, or the coroutine under debug is located and its promise state read. |

## Inputs

- The coroutine code or the behavior wanted: required.
- The toolchain and standard level: required. C++20 keywords with a C++23 library where `<generator>` is wanted; current GCC and Clang ship both.
- A debugger session: required only for the debugging path.

## Procedure

1. Recognize the three keywords and what they demand. A function containing any of them is a coroutine, and its return type must carry a `promise_type`. Done when: every coroutine in the source has a coroutine-shaped return type.

```cpp
co_return value;               // return and finish
co_yield value;                // produce a value, suspend
auto r = co_await awaitable;   // suspend until awaitable completes
```

2. Draft a lazy `Task` when only the final result matters. `initial_suspend` returns `suspend_always` so the body runs only on `resume()`, and `final_suspend` is `noexcept` by rule. The owner destroys the handle exactly once. Done when: the type owns its handle, destroys it in the destructor, and propagates the exception.

```cpp
#include <coroutine>
#include <exception>
#include <optional>
#include <utility>

template <typename T>
struct Task {
    struct promise_type {
        std::optional<T> value;
        std::exception_ptr exception;

        Task get_return_object() {
            return Task{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() { return {}; }            // lazy start
        std::suspend_always final_suspend() noexcept { return {}; }     // must be noexcept
        void return_value(T v) { value = std::move(v); }
        void unhandled_exception() { exception = std::current_exception(); }
    };

    std::coroutine_handle<promise_type> handle;

    explicit Task(std::coroutine_handle<promise_type> h) : handle(h) {}
    Task(Task&&) = default;
    Task& operator=(Task&&) = default;
    ~Task() { if (handle) handle.destroy(); }

    T get() {
        handle.resume();
        if (handle.promise().exception)
            std::rethrow_exception(handle.promise().exception);
        return std::move(*handle.promise().value);
    }
};
```

3. Draft a `Generator` when values stream out. `yield_value` stores and suspends; the iterator resumes to advance. Done when: the range-for loop produces the sequence and destroys the coroutine at scope exit.

```cpp
template <typename T>
struct Generator {
    struct promise_type {
        T current_value;
        Generator get_return_object() {
            return Generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }   // keep it simple, fail loud
        std::suspend_always yield_value(T v) {
            current_value = v;
            return {};
        }
    };

    std::coroutine_handle<promise_type> handle;
    explicit Generator(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    bool advance() {                 // false when exhausted
        handle.resume();
        return !handle.done();
    }
    T current() const { return handle.promise().current_value; }
};
```

For a standard type instead of a hand-written one, C++23 ships `std::generator<T>` in `<generator>`; current GCC and Clang standard libraries provide it.

4. Write an awaitable by filling three members. `await_ready` returns true to skip suspension. `await_suspend` receives the handle and schedules its resumption. `await_resume` supplies the value of the `co_await` expression. Done when: the awaitable suspends once, resumes once, and never resumes a finished coroutine.

```cpp
struct TimerAwaitable {
    int delay_ms;
    bool await_ready() const noexcept { return delay_ms <= 0; }
    void await_suspend(std::coroutine_handle<> h);   // schedule h.resume() after the delay
    void await_resume() const noexcept {}
};
```

`std::suspend_always` and `std::suspend_never` are the built-in trivial awaitables.

5. Keep the frame small. The compiler heap-allocates one frame holding the promise, the resume state, and every local that crosses a suspension point. Check the generated code on Compiler Explorer with `-std=c++20 -O2 -S`, or `-emit-llvm` and the `coro.size` marker on Clang. Done when: no large object outlives a suspension without need.

```cpp
// large object alive across co_await: it lives in the frame
auto buf = get_data();
auto sz = buf.size();     // capture what is needed
buf.clear();              // release the rest before suspending
co_await next_event;
```

At `-O2` the compiler may apply heap allocation elision (HALO) and move the frame to the caller's stack, but elision is not guaranteed; treat the allocation as real.

6. Debug a suspended coroutine. The coroutine lives on the heap, not on the stack, until resumed. Break inside the coroutine body, then reach the promise through the handle variable in scope; the member layout is implementation specific, so print through the promise type you wrote. Done when: the promise fields are readable in the debugger.

```bash
g++ -std=c++20 -g -O0 -o app app.cpp
gdb ./app
(gdb) break my_coro
(gdb) run
(gdb) info locals          # the handle and promise live in this frame
(gdb) p my_task.handle.promise()   # toolchain exposes the promise through the handle
```

GDB carries no built-in `info coroutines` command in common builds, so trace suspended coroutines through the `coroutine_handle` objects your code stores.

7. Use a composed library for concurrency. Boost.Asio's `co_spawn` runs an `awaitable<>` on an executor, and every `co_await` chains a completion without callback nesting. Done when: the session runs to completion on one `io_context`.

```cpp
#include <boost/asio.hpp>
#include <boost/asio/awaitable.hpp>
#include <boost/asio/co_spawn.hpp>

boost::asio::awaitable<void> echo_session(boost::asio::ip::tcp::socket s) {
    char buf[1024];
    for (;;) {
        std::size_t n = co_await s.async_read_some(boost::asio::buffer(buf));
        co_await boost::asio::async_write(s, boost::asio::buffer(buf, n));
    }
}
```

Boost 1.92.0 is the current release this tree pins.

8. Audit the recurring defects. Done when: each defect class is checked in the code under review.

| Defect | Cause | Fix |
|-------|-------|-----|
| `co_await` rejected in this function | The return type is not a coroutine type | Return `Task` or `Generator`, or move the code into one |
| Handle used after finish | `resume()` on a done coroutine | Check `handle.done()` before every resume |
| Double resume | Two owners resumed one coroutine | One owner; the rest hold weak references |
| Frame leaked | No `destroy()` ever ran | Own the handle with a destructor, as in steps 2 and 3 |
| Frame too large | Big locals across suspension | Move data out before `co_await`, per step 5 |
| Deep recursive `co_await` chains | Each link allocates a frame | Bound the chain depth, or loop instead of recursing |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Compile error inside `promise_type` | One required member is missing or wrongly signed. Check `get_return_object`, both suspend hooks, `return_value` or `return_void` exactly one of them, and `unhandled_exception`. |
| `final_suspend` not `noexcept` | The rule requires it. Make it `noexcept` and recompile. |
| Crash on second `get()` | The coroutine finished and the first `get()` destroyed it. Make the type move-only and single-use. |
| Exception swallowed | `unhandled_exception` stored it but nobody rethrows. Route it through the consumer, as in step 2. |
| Header parse time explosion | Asio-level coroutine headers are heavy. Isolate them in `.cpp` files and measure with `-ftime-report` or `-ftime-trace`. |

## Output

A working coroutine type or a located suspension point, with the promise contract stated and the ownership rule for the handle written next to the type. The frame layout and GDB mechanics above are the complete procedure; nothing further is deferred.
