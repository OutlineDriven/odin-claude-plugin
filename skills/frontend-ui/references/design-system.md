# Design System Adherence

## Spacing and Layout

Use the project's spacing scale. Do not invent off-scale values:

```css
/* Use the scale: 0.25rem increments (or whatever the project uses) */
/* Good */  padding: 1rem;      /* 16px */
/* Good */  gap: 0.75rem;       /* 12px */
/* Bad */   padding: 13px;      /* Not on any scale */
/* Bad */   margin-top: 2.3rem; /* Not on any scale */
```

## Typography

Keep the heading hierarchy:

```
h1 → Page title (one per page)
h2 → Section title
h3 → Subsection title
body → Default text
small → Secondary/helper text
```

Do not skip heading levels. Do not borrow heading styles for non-heading content.

## Color

- Use semantic color tokens: `text-primary`, `bg-surface`, `border-default` (not raw hex values)
- Ensure sufficient contrast (4.5:1 for normal text, 3:1 for large text)
- Do not rely solely on color to convey information (use icons, text, or patterns too)
