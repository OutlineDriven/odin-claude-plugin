# Stack-specific examples for source-driven

These worked illustrations provide one set of examples per step. They show one shape rather than dividing stacks into fixed categories. Read the closest match and generalize; stacks without their own block are expected.

**Grounded: 2026-08-26**

## Step 1: stack-detection report shape

```
STACK DETECTED:
- React 19.2.8 (package.json)
- Vite 8.2.2
→ Fetch official docs for the patterns in scope.
```

```
STACK DETECTED:
- Django 5.2 (pyproject.toml)
- Python 3.14
→ Fetch official docs for the patterns in scope.
```

## Step 2: fetch precisely

```
BAD:  Fetch the React homepage
GOOD: Fetch react.dev/reference/react/useActionState

BAD:  Search "django authentication best practices"
GOOD: Fetch docs.djangoproject.com/en/5.2/topics/auth/
```

## Step 3: conflict-detected dialogue

**When the docs conflict with existing project code:**

```
CONFLICT DETECTED:
The existing codebase uses useState for form loading state,
but React 19 docs recommend useActionState for this pattern.
(Source: react.dev/reference/react/useActionState)

Options:
A) Use the modern pattern (useActionState): matches current docs
B) Match existing code (useState): matches the codebase
→ Which do you prefer?
```

The same conflict shape applies in any stack:

```
CONFLICT DETECTED:
The codebase wraps ORM calls in sync_to_async, but Django 5.2
documents native async ORM methods (aget, acreate) for this path.
(Source: docs.djangoproject.com/en/5.2/topics/db/queries/#async-queries)

Options:
A) Use the documented pattern (native async ORM): matches current docs
B) Match existing code (sync_to_async wrappers): matches the codebase
→ Which do you prefer?
```

## Step 4: citation formats

```typescript
// React 19 form state via useActionState (replaces manual isPending/setIsPending)
// Source: https://react.dev/reference/react/useActionState#usage
const [state, formAction, isPending] = useActionState(submitOrder, initialState);
```

```go
// Go 1.22+ method-aware routing patterns in net/http ServeMux
// Source: https://pkg.go.dev/net/http#hdr-Patterns
mux.HandleFunc("GET /orders/{id}", getOrder)
```

**In conversation:**

```
I'm using useActionState instead of manual useState for the form
submission state. React 19 replaced the manual isPending/setIsPending
pattern with this hook.

Source: https://react.dev/blog/2024/12/05/react-19#actions
"useTransition now supports async functions [...] to handle
pending states automatically"
```
