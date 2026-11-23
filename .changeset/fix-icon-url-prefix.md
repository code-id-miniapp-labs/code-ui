---
"@code-id-labs/components": patch
---

Fix `c-icon` prepending the icon class prefix (`i-`) to hosted image URLs and data URIs (`https://...`, `http://...`, `data:image/...`, `cloud://...`, `wxfile://...`) by skipping Iconify `collection:name` parsing for URLs and paths in `getIcon()`.
