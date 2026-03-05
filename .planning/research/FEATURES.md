# Feature Landscape: 三栏工作区布局

**Domain:** IDE-like AI chat workspace with three-panel file management
**Researched:** 2026-03-05
**Milestone context:** Adding three-panel layout (file list + chat + preview) to an existing Next.js 16 + React 19 + Tailwind CSS 4 AI chat app (DeerFlow)

---

## Executive Summary

Modern AI coding tools (bolt.new, Cursor, Windsurf, v0.dev, Claude Artifacts) have converged on a predictable three-panel idiom: file explorer left, primary work area center, output/preview right. Users in 2025 expect this layout instinctively. The key insight from surveying the space is that panel *coordination* — not individual panel features — is the hardest problem. Getting the auto-select, scroll anchoring, and empty-state behavior right is what separates a polished product from a frustrating one.

DeerFlow already has strong primitives: file icons via Lucide, extension detection, a TanStack Query artifact cache, and an `ArtifactsContext` with `autoSelect`/`autoOpen` flags. The migration from the modal popup to a persistent panel is mostly a layout restructuring problem with a handful of coordination behaviors to nail.

---

## Codebase Baseline (What Already Exists)

Understanding the existing code prevents reinventing what's there.

| Existing piece | File | Relevance to three-panel |
|----------------|------|--------------------------|
| `ArtifactFileList` | `workspace/artifacts/artifact-file-list.tsx` | Direct reuse as left panel; renders card-per-file with icon, name, extension label, download |
| `ArtifactFileDetail` | `workspace/artifacts/artifact-file-detail.tsx` | Direct reuse as right panel; code/preview toggle, CodeMirror readonly, Streamdown markdown, iframe for HTML/binary |
| `ArtifactsContext` | `workspace/artifacts/context.tsx` | Already has `selectedArtifact`, `autoSelect`, `autoOpen`, `select()`, `deselect()` — the coordination state machine exists |
| `getFileIcon()` | `core/utils/files.tsx` | Already differentiates image/audio/video/code/text/skill with Lucide icons |
| `checkCodeFile()` | `core/utils/files.tsx` | Extension → language map for 60+ types |
| `useArtifactContent()` | `core/artifacts/hooks.ts` | TanStack Query with 5-min stale time; handles write-file: protocol |
| `AgentThreadState.artifacts` | `core/threads/types.ts` | AI-generated files only; `string[]` of filepaths |
| Uploaded files | via `uploadFiles()` in hooks | Uploaded through a separate API call; NOT currently in `artifacts[]` — **gap** |

**Critical gap identified:** Uploaded files (`uploaded_files`) are not present in `AgentThreadState.artifacts`. The three-panel file list needs to unify AI-generated artifacts AND user-uploaded files into a single list. This requires either extending `AgentThreadState` or fetching uploaded files separately.

---

## Table Stakes

Features users will expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| Persistent left file panel | bolt.new, Cursor, v0.dev all show files always-visible; users don't want to hunt for a button | Low | Reuse `ArtifactFileList`; remove `ArtifactTrigger` button |
| File name + type icon per row | Universal IDE convention; Lucide icons already mapped | Low | Already implemented in `getFileIcon()` |
| Click file → right panel shows content | Core interaction; the only selection mechanism | Low | `select()` in context already does this |
| Active/selected file highlight | Users need to see which file is being previewed | Low | Add `selectedArtifact === filepath` conditional class to list items |
| Right panel: empty state when no file selected | Blank space is confusing; "Select a file to preview" is the standard | Low | Instructional text + icon, no CTA needed since files are in left panel |
| Right panel: skeleton while content loads | `isLoading` from `useArtifactContent` is already returned; just needs a UI | Low | Match the shape of expected content (lines for code, paragraphs for markdown) |
| Code syntax highlight in preview | Users expect readable code; already works via CodeMirror in existing popup | Low | Zero new work — `ArtifactFileDetail` reuse |
| Markdown rendered (not raw) in preview | Users expect rendered output for `.md` files; already works via Streamdown | Low | Zero new work — `ArtifactFileDetail` reuse |
| Image preview (.png, .jpg, .gif, etc.) | File upload supports images; previewing them is baseline expectation | Low | iframe currently used for non-code files — works but not ideal; `<img>` tag is cleaner for images |
| Auto-select newest AI-generated file | bolt.new and Claude Artifacts both auto-open the last-generated file; users expect it | Medium | `autoSelect` flag exists in context; needs wiring to `useEffect` on `artifacts[]` changes |
| "No files yet" empty state for left panel | First-time / empty thread must not show a blank panel | Low | Show placeholder text + upload hint |

---

## Differentiators

Features that go beyond baseline and add real value. Not expected, but noticed.

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| Source grouping in file list (AI Generated / Uploaded) | Cursor/bolt.new separate project files from outputs; users benefit from understanding provenance | Medium | Requires solving the uploaded-files data gap first; adds a section header between groups |
| File type badge (e.g., "Python", "Markdown") | `getFileExtensionDisplayName()` already returns this; currently shown as CardDescription | Low | Already present — just ensure it's visible in the new panel layout |
| Auto-scroll chat to the message that produced the selected file | v0.dev allows clicking a preview element to jump to the relevant chat message; the reverse is also valuable | High | Requires correlating artifact filepath back to the LangGraph message that produced it — non-trivial |
| "New" badge on files generated in the current response | Windsurf shows diffs pre-approval; bolt.new highlights newly generated code; reduces cognitive load | Medium | Track which artifacts appeared in the most recent `onFinish` event vs. prior state |
| Download button visible on hover in file list | Current implementation has download in card actions — keep it accessible | Low | Already in `ArtifactFileList` |
| Drag handle to resize panels | `react-resizable-panels` (bvaughn) is the community standard for React; allows power users to customize | Medium | Not in initial scope per PROJECT.md (1:2:2 fixed ratio), but the library can be added later without breaking changes |
| Copy-to-clipboard in preview header | Already implemented in `ArtifactFileDetail` | Low | Zero new work — carry it into the persistent panel |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| File editing in the preview panel | Scope explicitly excluded in PROJECT.md; CodeMirror is already `readonly` | Keep `readonly` prop on CodeMirror; show a "view only" label if users attempt to type |
| Multi-tab file switching | Out of scope per PROJECT.md; adds tab management complexity | Single file selection; clicking a different file replaces the preview |
| Mobile layout | Three panels require ~1200px minimum width; mobile users get a degraded experience any way | Add a breakpoint guard (`lg:` prefix on the three-panel grid) that falls back to the existing single-column + modal pattern below 1024px |
| Custom panel resize by dragging | Out of scope for v1 | Fixed 1:2:2 ratio; CSS `grid-cols-[1fr_2fr_2fr]` |
| File delete from the panel | Not in scope; files are server-managed artifacts | No delete button; download only |
| File rename | Not in scope | Display names are final |
| Full-text search across files | Would require indexing artifact content | Out of scope; file list is short enough to scan visually |

---

## Feature Dependencies

```
Display unified file list (left panel)
  → Resolve uploaded_files data gap (must fetch or extend ThreadState)
  → Source grouping (AI Generated / Uploaded) depends on this

File preview (right panel)
  → Selected file state from ArtifactsContext (already exists)
  → Empty state: no dependency (renders when selectedArtifact === null)
  → Skeleton state: isLoading from useArtifactContent (already returned)

Auto-select newest artifact
  → artifacts[] array from ThreadState (already available)
  → autoSelect flag in context (already exists)
  → Needs useEffect watching artifacts.length

Active row highlight in file list
  → selectedArtifact from context (already available)

Three-panel CSS layout
  → No dependencies; pure layout change to the chat page wrapper
```

---

## Panel Coordination Rules (UX Behavior Matrix)

This is the most important section for implementation. These rules define how the panels interact.

### When the Chat Produces a New File (AI Generates Artifact)

| State | Behavior | Rationale |
|-------|---------|-----------|
| `autoSelect === true` (user hasn't manually picked a file yet) | Auto-select the newest artifact; show it in the right panel | Matches bolt.new and Claude Artifacts behavior — user gets immediate feedback |
| `autoSelect === false` (user has manually selected a specific file) | Do NOT switch the preview; add the new file to the left panel list only | Respects user intent; don't yank focus away |
| Right panel is showing the newly generated file | Update content in place when fetch completes; show skeleton during fetch | `useArtifactContent` with `staleTime: 0` for new files |

**Implementation note:** The existing `autoSelect` flag in `ArtifactsContext` already encodes this rule. The `select()` function sets `autoSelect = false` when a user manually clicks. This just needs a `useEffect` that calls `select(artifacts[artifacts.length - 1], true)` when `artifacts.length` grows and `autoSelect === true`.

### When No File Is Selected (Empty State)

Right panel shows:
- A large neutral icon (e.g., `FileIcon` from Lucide, muted color)
- One line: "Select a file to preview it here" (or i18n equivalent)
- No CTA button (files are already visible in the left panel; no further guidance needed)

### When the Left Panel Has No Files

Left panel shows:
- Icon + "No files yet" message
- Optional: "Files created by the AI will appear here" subtitle
- Do NOT show an upload CTA — file upload lives in the input box, not the file panel

### When a File Is Deleted / Removed from the Thread

Not a use case for this milestone (files are permanent artifacts). However, if `artifacts[]` shrinks:
- Deselect if the currently selected file was removed
- Clear the right panel → show empty state

### Responsive Behavior

| Viewport | Behavior |
|----------|---------|
| `>= 1024px` (lg breakpoint) | Full three-panel layout, CSS grid `grid-cols-[1fr_2fr_2fr]` |
| `< 1024px` | Fall back to existing single-column + ArtifactTrigger button behavior |

**Rationale:** PROJECT.md explicitly says "移动端适配不在本次 scope 内 — 三栏布局面向桌面端". The `lg:` breakpoint (1024px) is the conventional IDE threshold. Below it, the existing modal popup remains functional. This avoids breaking changes for tablet/mobile users.

---

## File List UX Patterns (Industry Conventions)

### Grouping

**Recommended:** Two sections, separated by a subtle section header:
1. **AI 生成** (AI Generated) — files from `AgentThreadState.artifacts[]`
2. **已上传** (Uploaded) — files from the user upload flow

This matches the Context.ai pattern (Artifacts vs. Computer Files) and makes provenance clear. Each section should be independently empty-stateable.

If the uploaded-files data gap is not resolved in this milestone, render only the AI Generated section and document the gap.

### File Row Layout

```
[icon]  [filename.ext]         [download-button on hover]
        [type badge: "Python"]
```

- Icon: 20px, muted foreground color, from `getFileIcon()`
- Filename: truncated with `text-ellipsis overflow-hidden` if long
- Type badge: `getFileExtensionDisplayName()` in muted text, 11px
- Download: ghost icon button, visible on `group-hover`
- Selected state: `bg-accent` or `border-l-2 border-primary` left accent bar

### Status Indicators

For this milestone, no async status is needed per file (no generation-in-progress per-file indicator). The only status needed is:
- **Selected:** highlighted row
- **New (nice-to-have):** a small colored dot or "NEW" badge for files generated in the most recent agent response

### Scroll Behavior

If the file list grows long, the left panel scrolls independently (overflow-y-auto). When a new file is auto-selected, scroll the left panel to bring the new file into view (`scrollIntoView({ behavior: 'smooth', block: 'nearest' })`).

---

## Preview Panel UX Patterns (Industry Conventions)

### Header Bar (always visible)

```
[filename]   [Code | Preview toggle if applicable]   [copy] [open-in-new-tab] [download]
```

- Toggle appears only for HTML and Markdown (already implemented in `ArtifactFileDetail`)
- No close button — the panel is always visible; deselecting is done by clicking elsewhere or hitting Escape

### Content Area States

| State | UI |
|-------|----|
| No file selected | Centered icon + "Select a file to preview it here" text |
| Loading content | Skeleton: 3-4 horizontal bars of varying width, subtle shimmer via `animate-pulse` in Tailwind |
| Code file | CodeMirror readonly, language already detected |
| Markdown file (default view: Preview) | Streamdown renderer, already implemented |
| HTML file | Sandboxed iframe, already implemented |
| Image file | `<img>` tag with `object-contain`, centered; for large images add `max-h-full` |
| Video file | `<video>` tag with controls, `src` pointing to artifact URL |
| Binary/unknown | "Preview not available" message with download button |
| Load error | Error icon + "Failed to load file" + retry button |

### File Type Detection Logic (Extend Existing)

The existing `checkCodeFile()` function handles 60+ text/code extensions. The preview panel needs an additional layer:

```
filepath → extension →
  image extensions (jpg, png, gif, webp, svg, heic) → <img>
  video extensions (mp4, mov, webm, m4v)             → <video>
  audio extensions (mp3, wav, ogg, aac)              → <audio>
  code/text extensions (via checkCodeFile())         → CodeMirror
  html extension                                     → iframe OR code/preview toggle
  markdown extension                                 → Streamdown OR raw code toggle
  unknown                                            → "Preview not available"
```

`getFileIcon()` already maps image/audio/video extensions — this same map can drive the preview type detection.

---

## Edge Cases That Need Handling

| Edge Case | Scenario | Correct Behavior |
|-----------|---------|-----------------|
| Thread loads with existing artifacts | User navigates back to a previous thread | Auto-select the last artifact; show it immediately without waiting for new generation |
| Artifact content fetch fails | Network error or backend timeout | Show error state in right panel with retry button; keep file in left panel list |
| Very long filename | AI generates `analysis_results_final_v3_corrected.json` | Truncate with `text-ellipsis`; show full name in tooltip |
| No extension in filename | AI generates `Makefile`, `Dockerfile` | `checkCodeFile()` returns `isCodeFile: false`; fall through to "Preview not available" with download fallback |
| `.skill` files (custom type) | Already handled specially in existing code | Render as Markdown (existing behavior); show Install button in preview header (existing behavior) |
| `write-file:` protocol URLs | AI write-file tool calls produce these | Already handled in `ArtifactFileDetail`; the `isWriteFile` path uses in-memory content instead of fetching |
| File list reorders | New artifacts always append; list order should be stable (newest at bottom or newest at top) | Choose one convention — recommend newest-first (top) to match chat's chronological order; top = most recent |
| Concurrent file updates | AI generates multiple files in one response (batch artifacts) | All appear in left panel; auto-select only the last one |
| Panel takes full viewport height | Content taller than viewport | Each panel independently scrollable; left and right panels use `overflow-y-auto`, center chat already handles this |
| User manually selects a file, then sends a new message | Auto-select for new artifacts should be suppressed | `autoSelect` flag (already implemented) handles this correctly |

---

## MVP Recommendation

Build in this order:

**Must-have for the milestone (in implementation order):**
1. Three-column CSS grid layout in the chat page wrapper — replaces the existing `<main>` single-column structure
2. Left panel: `ArtifactFileList` in a fixed-width column with active-row highlight and independent scroll
3. Right panel: `ArtifactFileDetail` always mounted (not modal), with empty state when `selectedArtifact === null`
4. Right panel: skeleton loading state using `animate-pulse` for `isLoading === true`
5. Auto-select newest artifact on `artifacts[]` growth when `autoSelect === true`
6. "No files yet" empty state for left panel when `artifacts.length === 0`
7. Right panel: image preview with `<img>` tag (currently falls through to iframe — works but inferior)
8. Right panel: video preview with `<video controls>` tag
9. Responsive fallback: below `lg` breakpoint, show the existing modal/trigger behavior

**Defer to follow-on milestone:**
- Uploaded files in the file list (requires solving the data gap)
- Source grouping (AI Generated / Uploaded sections) — depends on above
- "New" badge on recently generated files
- Resizable panels
- Scroll chat to the message that produced a file

---

## Sources

- [Bolt.new interface description — Codrops 2025](https://tympanus.net/codrops/2025/05/22/bolt-new-web-creation-at-the-speed-of-thought/)
- [bolt.new GitHub repo — StackBlitz](https://github.com/stackblitz/bolt.new)
- [Cursor flexible panel layout community discussion](https://forum.cursor.com/t/flexible-panel-layout/127935)
- [Cursor layout and UI feedback megathread](https://forum.cursor.com/t/megathread-cursor-layout-and-ui-feedback/146790)
- [Windsurf chat overview docs](https://docs.windsurf.com/chat/overview)
- [Windsurf vs Cursor comparison — builder.io](https://www.builder.io/blog/windsurf-vs-cursor)
- [v0.dev Docs — What is v0](https://v0.app/docs)
- [Context AI artifact panel docs](https://docs.context.ai/artifact-panel)
- [Claude Artifacts UX analysis — altar.io](https://altar.io/next-gen-of-human-ai-collaboration/)
- [Empty state UX best practices — Mobbin](https://mobbin.com/glossary/empty-state)
- [Empty state design — eleken.co](https://www.eleken.co/blog-posts/empty-state-ux)
- [Skeleton loading UX — clay.global](https://clay.global/blog/skeleton-screen)
- [react-resizable-panels — bvaughn/GitHub](https://github.com/bvaughn/react-resizable-panels)
- [Loading state UX patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback)
- [Chat auto-scroll UX — hashnode](https://tuffstuff9.hashnode.dev/intuitive-scrolling-for-chatbot-message-streaming)
- [Design patterns for AI interfaces — Smashing Magazine 2025](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [Responsive breakpoints 2025 — BrowserStack](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [AI artifacts comparison ChatGPT vs Claude vs Copilot — DEV Community](https://dev.to/chepy/the-hidden-war-of-ai-artifacts-chatgpt-vs-github-copilot-vs-claude-vs-manus-45eo)

**Confidence levels:**
- File list UX patterns: MEDIUM (bolt.new description via WebSearch + codebase inspection confirms existing conventions)
- Panel coordination rules: HIGH (derived directly from existing `ArtifactsContext` codebase analysis + industry patterns)
- Responsive breakpoints: HIGH (standard CSS conventions, multiple sources agree)
- Auto-select behavior: HIGH (documented in existing `context.tsx` code)
- Edge cases: MEDIUM (derived from codebase analysis + common UX failure modes)
