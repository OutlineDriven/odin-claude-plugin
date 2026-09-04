---
name: summarize-document-set
description: 'Use when the user asks to summarize a set of documents, identify themes and conflicts across multiple files, or synthesize internal docs. Not for single-document summaries or non-text sources.'
---

# Summarize document set

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to summarize a set of documents, identify themes and conflicts across multiple files, or synthesize internal docs. |
| Authority | Reversible local: writes only one report file to the working directory; rollback is version control or undo. No remote mutation. |
| Side effect | Writes one Markdown report file to `reports/document_summaries/<timestamp>.md`. No other files are written. |
| Done | A report file exists containing identified themes, identified conflicts with citing document names, and citations for each claim. |

## Inputs

| Input | Required | Description |
|---|---|---|
| Document set | Required | A set of documents to analyze. Supplied as file paths, a directory, or pasted text. The user must provide or point to the documents. |
| Document scope | Optional | A filter to restrict which documents to include (by name pattern, date, or type). If omitted, all provided documents are included. |
| Output filename | Optional | A filename for the summary report. If omitted, the filename is `<timestamp>.md`. |

## Refusal

- No documents provided or found: no file written. State that no documents matched the scope.
- Document unreadable: discard already-fetched content. Stop. Report which document could not be read.
- Directory creation failure: no file written. Stop. Report the filesystem error.
- Analysis failure: no file written. Stop. Report the analysis failure without claiming the done predicate holds.
- Write failure: no file written. Stop. Report the write error.

## Procedure

1. Confirm the document set. Ask the user to confirm the scope: which documents, directory, or pasted text to analyze. Do not proceed until the documents are identified. Done when: the document set is confirmed.

2. Read each document. For file paths and directories, read the files directly. For pasted text, use the provided content. Record the document name and source path for each. Done when: every document is read, or a read failure is reported.

3. Create the output directory. Create `reports/document_summaries/` if it does not exist. Done when: the directory exists, or creation failure is reported.

4. Analyze the documents. Extract:
   - Themes: recurring topics, decisions, or concerns that appear across the documents.
   - Conflicts: statements, decisions, or data that contradict each other across documents. For each conflict, cite the two conflicting documents by name and quote or paraphrase the conflicting passages.
   - Citations: document name and source path for each claim.
   Done when: themes, conflicts, and citations are extracted.

5. Write the summary report. Write a Markdown file to `reports/document_summaries/<timestamp>.md` (or the user-specified filename) containing:
   - A header with the generation timestamp and summarized document names with paths.
   - A Themes section: each theme with the documents that exhibit it.
   - A Conflicts section: each conflict citing the two conflicting documents and the conflicting passages.
   - A Recommendations section: any non-conflicting synthesis the analysis supports.
   Done when: the report file is written.

6. Report the done predicate. State the path of the saved report. Done when: the path is reported.

## Output

A Markdown file at `reports/document_summaries/<timestamp>.md` with a header, Themes section, Conflicts section with per-conflict document citations, and a Recommendations section. No other files are written. No external calls are made.
