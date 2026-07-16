# State Machine Patterns by Language

Brief enum + match/transition patterns per language.

## Rust

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OrderState { Draft, Pending, Shipped, Delivered }

impl Order {
    fn submit(&mut self) -> Result<(), Error> {
        match self.state {
            OrderState::Draft => { self.state = OrderState::Pending; Ok(()) }
            _ => Err(Error::InvalidTransition),
        }
    }
}
```

## TypeScript

```typescript
type Order =
  | { state: 'draft' }
  | { state: 'pending'; id: string }
  | { state: 'shipped'; id: string; tracking: string };

function submit(order: Order & { state: 'draft' }): Order & { state: 'pending' } {
  return { state: 'pending', id: crypto.randomUUID() };
}
```

## Python

```python
class OrderState(Enum):
    DRAFT = auto()
    PENDING = auto()
    SHIPPED = auto()

@dataclass
class Order:
    state: OrderState = OrderState.DRAFT

    def submit(self) -> None:
        assert self.state == OrderState.DRAFT, "Invalid transition"
        self.state = OrderState.PENDING
```

## Kotlin

```kotlin
sealed interface OrderState {
    data object Draft : OrderState
    data class Pending(val id: String) : OrderState
    data class Shipped(val id: String, val tracking: String) : OrderState
}

fun OrderState.submit(): OrderState = when (this) {
    is OrderState.Draft -> OrderState.Pending(id = UUID.randomUUID().toString())
    else -> error("Invalid transition from $this")
}
```

## Go

```go
type OrderState int
const (
    Draft OrderState = iota
    Pending
    Shipped
)

func (o *Order) Submit() error {
    if o.State != Draft { return fmt.Errorf("invalid transition from %d", o.State) }
    o.State = Pending
    return nil
}
```

## Java

```java
sealed interface OrderState permits Draft, Pending, Shipped {}
record Draft() implements OrderState {}
record Pending(String id) implements OrderState {}

OrderState submit(OrderState state) {
    return switch (state) {
        case Draft d -> new Pending(UUID.randomUUID().toString());
        default -> throw new IllegalStateException("Invalid transition");
    };
}
```

## C++

```cpp
using OrderState = std::variant<Draft, Pending, Shipped>;

OrderState submit(const OrderState& state) {
    return std::visit(overloaded{
        [](const Draft&) -> OrderState { return Pending{generate_id()}; },
        [](const auto&) -> OrderState { throw std::logic_error("Invalid"); },
    }, state);
}
```

## C#

```csharp
abstract record OrderState {
    public sealed record Draft : OrderState;
    public sealed record Pending(string Id) : OrderState;
}

OrderState Submit(OrderState state) => state switch {
    OrderState.Draft => new OrderState.Pending(Guid.NewGuid().ToString()),
    _ => throw new InvalidOperationException("Invalid transition"),
};
```

## Swift

```swift
enum OrderState {
    case draft, pending(id: String), shipped(id: String, tracking: String)
}

func submit(_ state: OrderState) throws -> OrderState {
    guard case .draft = state else { throw TransitionError.invalid }
    return .pending(id: UUID().uuidString)
}
```

## Elixir

```elixir
defmodule Order do
  defstruct state: :draft

  def submit(%Order{state: :draft} = order) do
    {:ok, %{order | state: :pending}}
  end
  def submit(_order), do: {:error, :invalid_transition}
end
```
