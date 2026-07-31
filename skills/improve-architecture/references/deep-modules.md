# Deep Modules

From "A Philosophy of Software Design" (Ousterhout):

**Deep module** = small interface + lots of implementation.

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation. Avoid.

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Pass-through, no hidden work
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can the number of methods be reduced?
- Can the parameters be simplified?
- Can more complexity be hidden inside?

Depth matters more than line count: a single method that handles a hard problem well is deeper than ten methods that each forward to another layer.
