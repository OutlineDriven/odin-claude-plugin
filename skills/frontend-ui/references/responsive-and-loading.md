# Responsive Design and Loading

## Responsive Design

Build mobile-first, then widen. Express breakpoints with utility classes or plain CSS. Both are framework-neutral:

```html
<!-- Utility CSS (Tailwind) -->
<div class="
  grid grid-cols-1      /* Mobile: single column */
  sm:grid-cols-2        /* Small: 2 columns */
  lg:grid-cols-3        /* Large: 3 columns */
  gap-4
">
```

```css
/* Plain CSS, mobile-first */
.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 768px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

Test at these breakpoints: 320px, 768px, 1024px, 1440px.

## Loading and Transitions

Use skeletons for content, not spinners. The skeleton markup is stack-neutral:

```html
<div class="space-y-3" aria-busy="true" aria-label="Loading tasks">
  <div class="h-12 bg-muted animate-pulse rounded"></div>
  <div class="h-12 bg-muted animate-pulse rounded"></div>
  <div class="h-12 bg-muted animate-pulse rounded"></div>
</div>
```

Apply optimistic updates so the UI responds before the server confirms. Cache mutation is a client-side pattern; the shape is identical in React Query and Vue's TanStack Query. The sequence is snapshot, apply, roll back on error:

```tsx
// React (TanStack Query)
function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      );

      return { previous };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previous);
    },
  });
}
```

```js
// Vue (@tanstack/vue-query) — same snapshot/apply/rollback contract
function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old) =>
        old.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      );
      return { previous };
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(['tasks'], context.previous);
    },
  });
}
```
