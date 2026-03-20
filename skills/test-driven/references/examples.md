# TDD Cycle Patterns by Language

Brief RED-GREEN-REFACTOR patterns. One example test + one property test per language.

## Rust

```rust
#[test]
fn withdraw_reduces_balance() {
    let mut account = Account::new(100);
    assert_eq!(account.withdraw(30), Ok(30));
    assert_eq!(account.balance(), 70);
}

proptest! {
    #[test]
    fn withdraw_preserves_balance_invariant(balance in 0u64..1000, amount in 0u64..1000) {
        let mut acc = Account::new(balance);
        if amount <= balance {
            let old = acc.balance();
            prop_assert_eq!(acc.withdraw(amount), Ok(amount));
            prop_assert_eq!(acc.balance(), old - amount);
        } else {
            prop_assert!(acc.withdraw(amount).is_err());
            prop_assert_eq!(acc.balance(), balance);
        }
    }
}
```

## Python

```python
def test_withdraw_reduces_balance():
    account = Account(balance=100)
    assert account.withdraw(30) == 30
    assert account.balance == 70

@given(st.integers(min_value=0, max_value=1000), st.integers(min_value=0, max_value=1000))
def test_withdraw_preserves_invariant(balance, amount):
    account = Account(balance=balance)
    if amount <= balance:
        old = account.balance
        assert account.withdraw(amount) == amount
        assert account.balance == old - amount
    else:
        with pytest.raises(ValueError):
            account.withdraw(amount)
```

## TypeScript

```typescript
test('withdraw reduces balance', () => {
  const account = new Account(100);
  expect(account.withdraw(30)).toBe(30);
  expect(account.balance).toBe(70);
});

fc.assert(fc.property(fc.nat(1000), fc.nat(1000), (balance, amount) => {
  const account = new Account(balance);
  if (amount <= balance) {
    expect(account.withdraw(amount)).toBe(amount);
    expect(account.balance).toBe(balance - amount);
  } else {
    expect(() => account.withdraw(amount)).toThrow();
    expect(account.balance).toBe(balance);
  }
}));
```

## Go

```go
func TestWithdrawReducesBalance(t *testing.T) {
    acc := NewAccount(100)
    got, err := acc.Withdraw(30)
    assert.NoError(t, err)
    assert.Equal(t, 30, got)
    assert.Equal(t, 70, acc.Balance())
}

func TestWithdrawPreservesInvariant(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        balance := rapid.IntRange(0, 1000).Draw(t, "balance")
        amount := rapid.IntRange(0, 1000).Draw(t, "amount")
        acc := NewAccount(balance)
        if amount <= balance {
            got, err := acc.Withdraw(amount)
            assert.NoError(t, err)
            assert.Equal(t, amount, got)
            assert.Equal(t, balance-amount, acc.Balance())
        } else {
            _, err := acc.Withdraw(amount)
            assert.Error(t, err)
            assert.Equal(t, balance, acc.Balance())
        }
    })
}
```

## Java

```java
@Test
void withdrawReducesBalance() {
    var account = new Account(100);
    assertEquals(30, account.withdraw(30));
    assertEquals(70, account.balance());
}

@Property
void withdrawPreservesBalanceInvariant(@ForAll @IntRange(min = 0, max = 1000) int balance,
                                       @ForAll @IntRange(min = 0, max = 1000) int amount) {
    var account = new Account(balance);
    if (amount <= balance) {
        int old = account.balance();
        assertThat(account.withdraw(amount)).isEqualTo(amount);
        assertThat(account.balance()).isEqualTo(old - amount);
    } else {
        assertThatThrownBy(() -> account.withdraw(amount)).isInstanceOf(IllegalArgumentException.class);
        assertThat(account.balance()).isEqualTo(balance);
    }
    assertThat(account.balance()).isGreaterThanOrEqualTo(0);
}
```

## Kotlin

```kotlin
@Test
fun `withdraw reduces balance`() {
    val account = Account(100)
    assertEquals(30, account.withdraw(30))
    assertEquals(70, account.balance)
}

forAll(Arb.int(0..1000), Arb.int(0..1000)) { balance, amount ->
    val account = Account(balance)
    if (amount <= balance) {
        val old = account.balance
        account.withdraw(amount) shouldBe amount
        account.balance shouldBe old - amount
    } else {
        shouldThrow<IllegalArgumentException> { account.withdraw(amount) }
        account.balance shouldBe balance
    }
}
```

## C++

```cpp
TEST(AccountTest, WithdrawReducesBalance) {
    Account account(100);
    EXPECT_EQ(account.withdraw(30), 30);
    EXPECT_EQ(account.balance(), 70);
}

rc::prop("withdraw preserves invariant", []() {
    auto balance = *rc::gen::inRange(0, 1000);
    auto amount = *rc::gen::inRange(0, 1000);
    Account acc(balance);
    if (amount <= balance) {
        auto old = acc.balance();
        RC_ASSERT(acc.withdraw(amount) == amount);
        RC_ASSERT(acc.balance() == old - amount);
    } else {
        RC_ASSERT_THROWS(acc.withdraw(amount));
        RC_ASSERT(acc.balance() == balance);
    }
});
```

## C#

```csharp
[Fact]
public void Withdraw_ReducesBalance() {
    var account = new Account(100);
    Assert.Equal(30, account.Withdraw(30));
    Assert.Equal(70, account.Balance);
}

[Property]
public Property Withdraw_PreservesInvariant() =>
    Prop.ForAll(Gen.Choose(0, 1000), Gen.Choose(0, 1000), (balance, amount) => {
        var account = new Account(balance);
        if (amount <= balance) {
            var old = account.Balance;
            Assert.Equal(amount, account.Withdraw(amount));
            Assert.Equal(old - amount, account.Balance);
        } else {
            Assert.Throws<ArgumentException>(() => account.Withdraw(amount));
            Assert.Equal(balance, account.Balance);
        }
        return true;
    });
```

## Swift

```swift
@Test func withdrawReducesBalance() {
    var account = Account(balance: 100)
    #expect(account.withdraw(30) == 30)
    #expect(account.balance == 70)
}
```

## Elixir

```elixir
test "withdraw reduces balance" do
  account = Account.new(100)
  {result, account} = Account.withdraw(account, 30)
  assert result == 30
  assert account.balance == 70
end

property "withdraw preserves invariant" do
  check all balance <- integer(0..1000), amount <- integer(0..1000) do
    account = Account.new(balance)
    if amount <= balance do
      old = account.balance
      {result, account} = Account.withdraw(account, amount)
      assert result == amount
      assert account.balance == old - amount
    else
      assert {:error, :insufficient_funds} = Account.withdraw(account, amount)
    end
  end
end
```
