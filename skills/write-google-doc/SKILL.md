---
name: write-google-doc
description: 'Use when the user asks to create a Google Doc, write Markdown into a document tab, or generate a document from content. Don''t use for reading or exporting Google Docs, for Google Sheets or Slides, or for edits outside Google Docs.'
disable-model-invocation: true
---

# Write Google Doc

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create a Google Doc, write to a tab, or generate a document from content. |
| Authority | Human-only. External remote mutation on Google Drive; irreversible once confirmed. |
| Side effect | Creates a new Google Doc, optionally with a named tab and Drive folder, or writes to an existing tab; returns the link. |
| Done | Doc or tab is populated with Markdown-converted content and the link is returned. |

## Inputs

1. **content** (required): Markdown string to populate the doc or tab.
2. **title** (optional): Document title. Defaults to `Untitled`.
3. **folder_id** (optional): Google Drive folder ID to place the new doc in. Ignored when `document_id` is supplied.
4. **document_id** (optional): Existing Google Doc ID to write into. When omitted, a new doc is created.
5. **tab_name** (optional): Name of the tab to create or write to within the target doc. When omitted, content writes to the default body.

## Procedure

1. **Authenticate.** Obtain a valid Google OAuth2 access token with scope `https://www.googleapis.com/auth/documents` and `https://www.googleapis.com/auth/drive.file`. If no valid token exists, report the missing credential and stop. Do not attempt to create tokens, open browsers, or fall back to service accounts. Done when: a valid OAuth2 access token is in hand.
2. **Resolve target document.**
   - If `document_id` is supplied, fetch the document via `GET https://docs.googleapis.com/v1/documents/{document_id}`. On 404, report document not found and stop. On 403, report permission denied and stop.
   - If `document_id` is omitted, create a new document via `POST https://docs.googleapis.com/v1/documents` with body `{"title": "<title>"}`. If `folder_id` is also supplied, move the newly created doc into that folder via `PATCH https://www.googleapis.com/drive/v3/files/{new_doc_id}?addParents=<folder_id>&removeParents=<previous_parent>`. On failure at either step, report the error and stop.
   Done when: the target document ID is resolved and accessible.
3. **Convert Markdown to Google Docs structural requests.** Parse the Markdown content and produce a list of `batchUpdate` insert-text and formatting requests:
   - Headings (`#` through `######`): insert the heading text, then apply `updateParagraphStyle` with the matching `NamedStyleType` (`HEADING_1` through `HEADING_6`).
   - Paragraphs: insert text followed by a newline.
   - Bold (`**text**`): insert text, then apply `updateTextStyle` with `{"bold": true}` over the character range.
   - Italic (`*text*`): insert text, then apply `updateTextStyle` with `{"italic": true}` over the character range.
   - Inline code (`` `text` ``): insert text, then apply `updateTextStyle` with `{"weightedFontFamily": {"fontFamily": "Courier New"}}` over the character range.
   - Code blocks (triple-backtick): insert text verbatim, then apply `updateTextStyle` with `{"weightedFontFamily": {"fontFamily": "Courier New"}}` and `updateParagraphStyle` with `{"namedStyleType": "NORMAL_TEXT"}` over the block range.
   - Bullet lists (`- ` or `* `): insert text, then apply `createParagraphBullets` with `{"bulletPreset": "BULLET_DISC_CIRCLE_SQUARE"}`.
   - Numbered lists (`1. `, `2. `, etc.): insert text, then apply `createParagraphBullets` with `{"bulletPreset": "NUMBERED_DECIMAL_ALPHA_ROMAN"}`.
   - Links (`[text](url)`): insert text, then apply `updateTextStyle` with `{"link": {"uri": "<url>"}}` over the character range.
   - Horizontal rules (`---`): insert a paragraph with `─` characters.
   - Track cumulative character indices as content is inserted so that formatting requests reference correct ranges.
   Done when: the full request list is assembled with correct character indices.
4. **Write to tab or body.**
   - If `tab_name` is supplied:
     - Fetch the document structure. Search `tabs` for a tab whose `tabProperties.title` matches `tab_name`.
     - If found, note its `tabId`. All `batchUpdate` requests target this tab via the `target` field: `{"tabId": "<tab_id>"}`.
     - If not found, create a new tab via a `createTab` request in the `batchUpdate` call, capture the returned `tabId`, and target subsequent requests to it.
   - If `tab_name` is omitted, requests target the document body (default, no explicit target field needed).
   Done when: all requests are targeted to the correct tab or body.
5. **Execute batch update.** Send `POST https://docs.googleapis.com/v1/documents/{document_id}:batchUpdate` with the assembled requests. The Google Docs API limits each call to 50 requests. If the converted request list exceeds 50, split it into sequential batches of up to 50 requests, sending each batch and waiting for confirmation before sending the next. On an API error, report the status code and message, then stop. Do not retry automatically. Done when: all batches are sent and confirmed.
6. **Return link.** Build the shareable URL `https://docs.google.com/document/d/{document_id}/edit`. If a `tab_name` was used, append `?tab=<tab_id>`. Return the URL to the user. Done when: the shareable URL is returned.

## Failure and recovery
- **Missing OAuth2 token**: report authentication required. Stop. No file or remote state is changed.
- **Document not found (404)**: report the document ID not found. Stop.
- **Permission denied (403)**: report insufficient permission on the target document or folder. Stop.
- **Folder not found or move failed**: report the folder ID invalid or move failed. The doc was created but is in the default location. Return the doc link with a warning.
- **Tab creation failed**: report could not create or locate the named tab. Stop. Partial writes to the doc body are possible; report the doc link and the error.
- **batchUpdate API error**: report the HTTP status and error message. Stop mid-batch. Content written in earlier batches is retained; report the doc link and the partial-write state.
- **Markdown parse failure**: report content could not be converted. Stop. No remote state is changed.

Partial-result rule: if any batch succeeded before a failure, the doc link is still returned with a warning describing what was not written.

## Output
Shareable Google Docs URL (with `?tab=<tab_id>` when a tab was used); on failure, an error report naming the failure class and partial state.
