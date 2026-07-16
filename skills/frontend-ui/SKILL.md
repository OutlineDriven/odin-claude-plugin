---
name: frontend-ui
description: Build production-quality user-facing interfaces. Use when creating or modifying components, implementing layouts, managing state, or when the output must look hand-crafted rather than AI-generated.
---

# Frontend UI Engineering

## Overview

Build UIs that read as hand-crafted production work, not machine output. The failure mode is the generic "AI aesthetic": default palettes, oversized cards, template layouts with no tie to the content. Conform to the project's real design system, meet WCAG 2.1 AA, and handle every interaction state.

## When to Use

- Building new UI components or pages
- Modifying existing user-facing interfaces
- Implementing responsive layouts
- Adding interactivity or state management
- Fixing visual or UX issues

## State Management

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

## Design System Adherence

Take the spacing scale, type hierarchy, and semantic color tokens from `references/design-system.md`. Never invent values the project's system does not define.

### Avoid the AI Aesthetic

Machine-generated UI has recognizable tells. Reject each:

| AI Default | Why It Is a Problem | Production Quality |
|---|---|---|
| Purple/indigo everything | Models default to visually "safe" palettes, making every app look identical | Use the project's actual color palette |
| Excessive gradients | Gradients add visual noise and clash with most design systems | Flat or subtle gradients matching the design system |
| Rounded everything (rounded-2xl) | Maximum rounding signals "friendly" but ignores the hierarchy of corner radii in real designs | Consistent border-radius from the design system |
| Generic hero sections | Template-driven layout with no connection to the actual content or user need | Content-first layouts |
| Lorem ipsum-style copy | Placeholder text hides layout problems that real content reveals (length, wrapping, overflow) | Realistic placeholder content |
| Oversized padding everywhere | Equal generous padding destroys visual hierarchy and wastes screen space | Consistent spacing scale |
| Stock card grids | Uniform grids are a layout shortcut that ignores information priority and scanning patterns | Purpose-driven layouts |
| Shadow-heavy design | Layered shadows add depth that competes with content and slows rendering on low-end devices | Subtle or no shadows unless the design system specifies |

## Accessibility (WCAG 2.1 AA)

Every component meets these standards. Use the native element first; reach for ARIA only when no native element fits. Detailed WCAG checks and testing tools are in `references/accessibility-checklist.md`; working code for keyboard navigation, ARIA labels, focus management, and empty/error states is in `references/accessibility-patterns.md`.

## Reference materials

Where these references show component code, they pair a JavaScript component framework (React) with a server-rendered template stack (Django/Python); CSS and HTML examples are framework-neutral. The patterns hold across frameworks. Apply the equivalent in whatever stack the project uses.

- `references/component-architecture.md`: file colocation, composition over configuration, and separating data from presentation.
- `references/design-system.md`: the spacing scale, type hierarchy, and semantic color tokens.
- `references/accessibility-patterns.md`: keyboard navigation, ARIA labels, focus management, and empty/error states.
- `references/accessibility-checklist.md`: WCAG 2.1 AA checks and the tools that verify them.
- `references/responsive-and-loading.md`: mobile-first breakpoints, skeletons, and optimistic updates with rollback.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Accessibility is a nice-to-have" | It's a legal requirement in many jurisdictions and an engineering quality standard. |
| "We'll make it responsive later" | Retrofitting responsive design is 3x harder than building it from the start. |
| "The design isn't final, so I'll skip styling" | Use the design system defaults. Unstyled UI creates a broken first impression for reviewers. |
| "This is just a prototype" | Prototypes become production code. Build the foundation right. |
| "The AI aesthetic is fine for now" | It signals low quality. Use the project's actual design system from the start. |

## Red Flags

- Components with more than 200 lines (split them)
- Color as the sole indicator of state (red/green without text or icons)

## Verification

After building UI:

- [ ] Component renders without console errors
- [ ] All interactive elements are keyboard accessible (Tab through the page)
- [ ] Screen reader can convey the page's content and structure
- [ ] Responsive: works at 320px, 768px, 1024px, 1440px
- [ ] Loading, error, and empty states all handled
- [ ] Follows the project's design system (spacing, colors, typography)
- [ ] No accessibility warnings in dev tools or axe-core
