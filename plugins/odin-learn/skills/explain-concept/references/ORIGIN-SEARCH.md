# Origin search format

## Template

```md
## Origin

{Concept} was introduced by {author} in {year} ({venue}), displacing {what it replaced}. For the source: {URL}.
```

## Query

Build the query from the concept name and its field: `"{concept}" origin history {field}`. Prefer a venue or author page when one appears in the first results.

## Candidate table

| Title | Author | Year | Venue | URL |
|---|---|---|---|---|
| {title} | {author} | {year} | {venue} | {url} |

At most three rows. Show the table and wait for the user to accept one.

## Rules

- Nothing is written until the user accepts a candidate. An auto-picked citation is not a citation.
- Write the accepted candidate as one paragraph under `## Origin`, with title, author, year, and URL.
- Paraphrase; quote only a coined term or named law where exact phrasing is the idea.
- If the user declines every candidate, the angle ends there and the explanation is unaffected.
