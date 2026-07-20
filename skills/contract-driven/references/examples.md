# Contract Patterns by Language

Brief contract annotation patterns. Precondition + postcondition + invariant per language.

## Python

```python
@deal.inv(lambda self: self.balance >= 0)
class Account:
    @deal.pre(lambda self, amount: amount > 0)
    @deal.pre(lambda self, amount: amount <= self.balance)
    @deal.ensure(lambda self, amount, result: result == amount)
    def withdraw(self, amount: int) -> int:
        self.balance -= amount
        return amount
```

## Rust

```rust
pub fn withdraw(&mut self, amount: u64) -> Result<u64, Error> {
    assert!(amount > 0, "PRE: amount must be positive");
    assert!(amount <= self.balance, "PRE: insufficient funds");
    let old_balance = self.balance;
    self.balance -= amount;
    debug_assert!(self.balance == old_balance - amount, "POST: balance delta");
    debug_assert!(self.balance >= 0, "INV: non-negative balance");
    Ok(amount)
}
```

## TypeScript

```typescript
const WithdrawInput = z.object({
  amount: z.number().positive().max(MAX_BALANCE),
});

function withdraw(account: Account, input: z.infer<typeof WithdrawInput>): number {
  invariant(input.amount <= account.balance, 'PRE: insufficient funds');
  const oldBalance = account.balance;
  account.balance -= input.amount;
  invariant(account.balance === oldBalance - input.amount, 'POST: balance delta');
  return input.amount;
}
```

## Kotlin

```kotlin
fun withdraw(amount: Int): Int {
    require(amount > 0) { "PRE: amount must be positive" }
    require(amount <= balance) { "PRE: insufficient funds" }
    val oldBalance = balance
    balance -= amount
    check(balance == oldBalance - amount) { "POST: balance delta" }
    check(balance >= 0) { "INV: non-negative balance" }
    return amount
}
```

## Java

```java
public int withdraw(int amount) {
    Preconditions.checkArgument(amount > 0, "PRE: positive amount");
    Preconditions.checkArgument(amount <= balance, "PRE: insufficient funds");
    int oldBalance = balance;
    balance -= amount;
    Verify.verify(balance == oldBalance - amount, "POST: balance delta");
    return amount;
}
```

## C#

```csharp
public int Withdraw(int amount) {
    Guard.Against.NegativeOrZero(amount, nameof(amount));
    Guard.Against.OutOfRange(amount, nameof(amount), 0, Balance);
    var oldBalance = Balance;
    Balance -= amount;
    Debug.Assert(Balance == oldBalance - amount, "POST: balance delta");
    return amount;
}
```

## Go

```go
func (a *Account) Withdraw(amount int) (int, error) {
    if amount <= 0 { return 0, fmt.Errorf("PRE: amount must be positive") }
    if amount > a.balance { return 0, fmt.Errorf("PRE: insufficient funds") }
    oldBalance := a.balance
    a.balance -= amount
    if a.balance != oldBalance-amount { panic("POST: balance delta violated") }
    return amount, nil
}
```

## C++

```cpp
int Account::withdraw(int amount) {
    Expects(amount > 0);           // GSL precondition
    Expects(amount <= balance_);
    auto old = balance_;
    balance_ -= amount;
    Ensures(balance_ == old - amount);  // GSL postcondition
    return amount;
}
```

## Swift

```swift
func withdraw(_ amount: Int) -> Int {
    precondition(amount > 0, "PRE: positive amount")
    precondition(amount <= balance, "PRE: insufficient funds")
    let oldBalance = balance
    balance -= amount
    assert(balance == oldBalance - amount, "POST: balance delta")
    return amount
}
```

## Scala

```scala
def withdraw(amount: Int): Int = {
  require(amount > 0, "PRE: positive amount")
  require(amount <= balance, "PRE: insufficient funds")
  val oldBalance = balance
  balance -= amount
  assert(balance == oldBalance - amount, "POST: balance delta")
  assert(balance >= 0, "INV: non-negative balance")
  amount
}
```
