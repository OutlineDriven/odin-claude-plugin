# react.md — React 19.2 + Tailwind v4 + shadcn v4

Surface reference for React applications. Companion to `references/web.md` for the vanilla CSS baseline; reach for vanilla first, React only when state crosses surface boundaries.

**Snapshot date:** April 2026. Library versions and APIs below were verified at that point; verify against react.dev, tailwindcss.com, and ui.shadcn.com before relying on any specific hook or directive in production.

## 1. Posture

React for state crossing surface boundaries; vanilla CSS for everything else (see `references/web.md` §1). RSC is the default; client components are the exception, opted into explicitly with `'use client'`.

The 2020-era assumption that "React + Tailwind + a UI kit" is the default web surface no longer holds — `:has()`, `@container`, `popover`, and View Transitions cover most of what hooks were once needed for. React earns its weight when shared mutable state crosses two or more surfaces; below that bar, vanilla CSS is shorter and faster. See `references/anti-slop.md` for the slop tell of "reaching for React because it is what the model knows."

## 2. React 19-era surface (as of 19.2)

React 19.2 was released October 1 2025; React Compiler 1.0 stable shipped October 7 2025; the current line is 19.2.5 as of April 2026. The six APIs below are the modern surface a designer needs to know — most landed with React 19 GA and are stable through the 19.2.x line.

### RSC default

Server components are the default; client components opt in via `'use client'` at the top of the file. Component code that does not need browser APIs, event handlers, or state stays on the server — zero JS shipped to the client for that subtree.
```tsx
// app/page.tsx — RSC by default, no directive needed
export default async function Page() {
  const items = await db.query.items.findMany();
  return <ItemList items={items} />;
}
```
Anti-pattern: `'use client'` on the root layout or page. Defeats RSC streaming; ships every leaf component to the browser.

### Server Actions

Server-side mutations callable from client components. Pair with `useFormStatus` for pending state and `useActionState` for the action result.
```tsx
// app/actions.ts
'use server';
export async function createItem(formData: FormData) {
  await db.insert(items).values({ name: formData.get('name') as string });
}
```
```tsx
// client form
<form action={createItem}><input name="name" /><Submit /></form>
```
Anti-pattern: a `useEffect` data-fetch with manual loading state. Server Actions handle the round trip and the pending surface natively.

### `useOptimistic`

Client-side optimistic UI; renders the speculative state until the server confirms or the action errors.
```tsx
'use client';
const [items, setItems] = useState(initial);
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, draft) => [...state, draft]);

async function add(formData: FormData) {
  const draft = { id: crypto.randomUUID(), name: formData.get('name') as string };
  addOptimistic(draft);
  await createItem(formData); // server confirms
}
```
Anti-pattern: manual local-state mirrors of server state with rollback logic on error. `useOptimistic` is the rollback.

### `useFormStatus`

Pending and idle state for forms without local state. Read inside a child of the `<form>`.
```tsx
'use client';
function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```
Anti-pattern: passing a `loading` prop down through component layers, or wrapping every submit in a custom hook. The hook reads from form context.

### `useActionState`

Replaces the older `useFormState`; new API surface as of React 19.
```tsx
'use client';
const [state, action, pending] = useActionState(createItem, { error: null });
return <form action={action}>{state.error && <p>{state.error}</p>}<input name="name" /></form>;
```
Anti-pattern: still calling it `useFormState`. The rename is real and the migration is a one-liner; old name is dead.

### React Compiler stable

React Compiler 1.0 stable (October 7 2025) auto-memoizes — manual `useMemo` and `useCallback` are now anti-patterns unless the React DevTools profiler shows the compiler missed a hot path. Per react.dev April 2026 guidance, the default project enables the compiler and removes existing memoization rather than adding more.
```tsx
// Before — manual memoization, now redundant under the compiler.
const sorted = useMemo(() => items.sort(byName), [items]);
const onClick = useCallback(() => doThing(id), [id]);

// After — compiler does it; let it.
const sorted = items.toSorted(byName);
const onClick = () => doThing(id);
```
Anti-pattern: adding `useMemo` defensively. The compiler does the work; manual memoization is dead code that obscures the call graph.

## 3. Tailwind v4

Tailwind v4 stable shipped January 22 2025; v4.2 introduced the CSS-first `@theme` directive with ~5× faster builds versus v3. CSS-first config replaces `tailwind.config.js`; tokens are defined as CSS custom properties under an `@theme` block, which means the same OKLCH custom palette feeds both Tailwind utilities and any vanilla CSS in the same file.
```css
/* app.css */
@import 'tailwindcss';

@theme {
  --color-bg-default:   oklch(0.99 0 0);
  --color-text-default: oklch(0.18 0 0);
  --color-accent:       oklch(0.62 0.18 256);
  --color-accent-hover: oklch(0.52 0.18 256);

  --spacing-4: 0.25rem;
  --spacing-8: 0.5rem;
  --spacing-16: 1rem;

  --font-display: 'Geist Sans', sans-serif;
  --font-text:    'Geist Sans Text', sans-serif;
}
```
Anti-pattern: keeping `tailwind.config.js` on a v4 install. The JS config is a v3 surface; the v4 surface is the `@theme` block. Pick one; do not bridge.

## 4. shadcn/ui v4

shadcn/ui v4 with full Tailwind v4 + React 19 support reached stable February 2026. shadcn is a starting point, not a finish line — every component is yours to mold to the picked direction. Use the CLI to install, then derive token-driven variants per the picked paradigm (`references/paradigms.md`).
```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button dialog
```
Once a component is added, treat it as project source. Edit it. Replace its hardcoded colors with `var(--color-accent)` and friends. Re-tier its radius and shadow tokens per the direction. Cite the v4 release notes at https://ui.shadcn.com/docs/changelog when documenting which version is installed.

Anti-pattern: leaving the default shadcn `bg-primary` and `rounded-md` on every primitive. The result is the shadcn-landing-page silhouette listed in `references/anti-slop.md` — readable as preset before the eye finishes scanning.

## 5. State management

- **Zustand** (module-first) — preferred for cross-component shared state. Selectors are scoped, re-renders are surgical. The default for non-trivial client state.
- **Jotai** (atom-first) — preferred when state is granular and read-mostly. One atom per cell of state; consumers subscribe atom-by-atom.
- **TanStack Query** — server-state cache; the default for any fetched data. Pair with Server Actions for mutations.
- **Avoid Redux** unless team-size and complexity demand it. The boilerplate-to-value ratio is wrong for most surfaces under a Zustand store.
- **Avoid Context for high-frequency updates.** Context re-renders all consumers on every value change; Zustand selectors and Jotai atoms scope the re-render to the actual reader.

```tsx
// Zustand store — module-first, selector-scoped.
import { create } from 'zustand';
const useStore = create<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
const count = useStore((s) => s.count); // re-renders only when count changes
```

## 6. Forbidden patterns

- **Redux for simple state.** Over-engineering by default; the action-reducer-thunk surface costs more than it earns under a single store. Reach for Zustand or Jotai first.
- **Manual `useMemo` / `useCallback` with React Compiler enabled.** The compiler does this. Manual memoization is dead code that obscures the actual call graph and adds noise to diffs.
- **`useEffect` data-fetch in RSC apps.** Use Server Actions or RSC fetch. `useEffect` for fetching is a 2020-era pattern and shows up as a slop tell on every "AI-built React app" anti-pattern catalogue.
- **`'use client'` on the root layout or page.** Defeats RSC streaming; ships every leaf to the browser. The directive is leaf-level — push it as deep as possible.
- **Hardcoded hex / RGB values in component code.** Tokens only. A `git grep '#[0-9a-f]\{3,8\}' src/components/` should return zero matches.
- **Default Tailwind palette utilities (`bg-blue-500`, `text-gray-700`).** The default ramp is the slop tell. Reference the `@theme` tokens by name (`bg-accent`, `text-default`) so a direction change rolls through the whole surface.
- **Mixing Tailwind v3 JS config with v4 CSS-first config.** Pick one; the bridge is more confusing than either pure path.

## 7. Cite-and-defer

Citations: react.dev (19.2), tailwindcss.com (v4), ui.shadcn.com (v4). This is starter density — defer to react.dev/learn for the current API surface, tailwindcss.com/docs for v4 directives, and ui.shadcn.com/docs/changelog for component versions before relying on any hook, directive, or component in production.
