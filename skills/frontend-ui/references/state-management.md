# State Management

Pick the narrowest scope that holds the state. Categories, narrowest to widest:

```
Local state    → component-specific UI state           React: useState · Vue: ref/reactive
Lifted state   → shared between 2-3 components in the same hierarchy  props + change handlers
Context        → theme, auth, locale (read-heavy,       React: Context · Vue: provide/inject
                 write-rare)
URL state      → filters, pagination, shareable UI      router/searchParams (any stack)
                 state
Server state   → remote data with caching              React Query, SWR; Vue: TanStack Query
Global store   → complex client state shared app-wide   Zustand, Redux; Vue: Pinia
```

Server-rendered stacks map the same categories onto request/session/query-param/database state. The categories hold; only the storage moves to the server.

**Avoid prop drilling deeper than 3 levels.** If you pass props through components that don't use them, introduce context or restructure the component tree.
