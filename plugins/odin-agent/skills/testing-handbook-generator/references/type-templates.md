# Testing handbook generator — type templates

Branch detail for the 4 skill type section structures and Hugo shortcode
conversion rules referenced by SKILL.md step 9 (Pass 1) and step 10 (Pass 2).

## Type-specific section structures

### tool

When to Use, Quick Reference, Installation, Core Workflow, Configuration,
Advanced Usage, CI/CD Integration, Common Mistakes, Limitations, Resources

### fuzzer

When to Use, Quick Start, Installation, Writing a Harness, Compilation, Corpus
Management, Running Campaigns, Coverage Analysis, Sanitizer Integration,
Advanced Usage, Troubleshooting, Resources

### technique

When to Apply, Quick Reference, Step-by-Step, Common Patterns, Tool-Specific
Guidance, Anti-Patterns, Troubleshooting, Resources

### domain

Background, When to Use, Quick Reference, Testing Workflow, Tools and
Approaches, Key Techniques, Implementation Guide, Common Vulnerabilities,
Resources

## Hugo shortcode conversion

Convert Hugo shortcodes to plain markdown:

- `{{< hint info >}}X{{< /hint >}}` becomes `> **Note:** X`
- `{{< hint warning >}}X{{< /hint >}}` becomes `> **Warning:** X`
- `{{% relref "path" %}}` becomes `See: path`
- Omit mermaid blocks
- Convert tabs to headings
- Convert details and expand blocks to `<details>` elements

Preserve code blocks exactly (language specifier, indentation, content).

## Line limit

If content exceeds 450 lines, extract large sections (Installation, Advanced
Usage, CI/CD) into sibling files and add a decision tree to SKILL.md. Hard
limit: 500 lines per file.

## Related Skills placeholder

Leave a Related Skills placeholder in Pass 1:
`<!-- PASS2: populate after all skills exist -->`

Pass 2 replaces each placeholder with a Related Skills table. Determine related
skills from: the discovery `related_sections` mapping, skill type relationships
(fuzzers link to techniques; tools link to alternative tools), and explicit
mentions in content. Validate that every referenced skill directory exists.
