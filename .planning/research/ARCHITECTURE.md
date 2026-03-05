# Architecture Patterns: 三栏工作区布局

**Domain:** Three-panel workspace layout for existing AI chat application
**Researched:** 2026-03-05
**Confidence:** HIGH — based entirely on direct codebase reading, not inferred

---

## Recommended Architecture

### Overview

The three-panel layout is implemented as a new layout shell inserted directly inside the existing `ChatBox` component boundary. The current two-panel system (`ChatBox`) is extended — not replaced — into a three-panel system. State is lifted from `ArtifactsContext` into a new `WorkspaceContext` that governs file selection across all three panels.

```
app/workspace/chats/[thread_id]/page.tsx   [MODIFY — minimal changes]
  ThreadContext.Provider
    ChatBox                                 [MODIFY — convert to 3-panel]
      ThreeColumnLayout (new)              [CREATE]
        LeftPanel: FileListPanel (new)     [CREATE — wraps existing ArtifactFileList]
        CenterPanel: (existing children)   [REUSE — no change to MessageList/InputBox]
        RightPanel: FilePreviewPanel (new) [CREATE — wraps existing ArtifactFileDetail]
      WorkspaceContext.Provider (new)      [CREATE — lifted state]
```

---

## Component Tree (Detailed)

### Existing Component Ownership

```
[KEEP AS-IS]
frontend/src/components/workspace/messages/
  message-list.tsx         — renders chat messages, no changes needed
  context.ts               — ThreadContext, no changes needed

[KEEP AS-IS]
frontend/src/components/workspace/input-box.tsx
frontend/src/components/workspace/thread-title.tsx
frontend/src/components/workspace/todo-list.tsx

[MODIFY]
frontend/src/components/workspace/chats/chat-box.tsx
  — currently: 2-panel ResizablePanelGroup (chat | artifacts)
  — becomes: thin wrapper that renders <ThreeColumnLayout>
  — remove: CLOSE_MODE/OPEN_MODE logic, artifactPanelOpen toggle
  — keep: setArtifacts(thread.values.artifacts) sync effect

[REMOVE from use]
frontend/src/components/workspace/artifacts/artifact-trigger.tsx
  — ArtifactTrigger button in page.tsx header triggers the old artifact panel
  — remove from header in page.tsx (panel is always visible now)
```

### New Components to Create

```
frontend/src/components/workspace/three-column-layout/
  index.ts
  three-column-layout.tsx      — 1:2:2 flex container using Tailwind or CSS grid
  left-panel.tsx               — File list panel (scrollable)
  right-panel.tsx              — File preview panel
  workspace-context.tsx        — WorkspaceContext definition and hook
```

---

## State Management

### The Core Problem

The current `ArtifactsContext` (in `frontend/src/components/workspace/artifacts/context.tsx`) tracks:
- `artifacts: string[]` — AI-generated file paths
- `selectedArtifact: string | null` — currently displayed artifact
- `open: boolean` — whether the panel is visible (not relevant in fixed 3-panel)

The three-panel layout adds a new concern: **the selected file can be either an artifact (AI-generated) or an uploaded file (user upload)**. These are currently separate data sources with different schemas.

### Recommended Solution: New `WorkspaceContext`

Create `frontend/src/components/workspace/three-column-layout/workspace-context.tsx` as the single source of truth for panel-level state. Do NOT extend `ArtifactsContext` — it has panel-open semantics that are irrelevant in a fixed layout.

```typescript
// Unified file item type — merges artifacts and uploaded_files
export interface WorkspaceFile {
  id: string;                // unique key for React
  name: string;              // display filename
  filepath: string;          // path to pass to existing urlOfArtifact()
  source: "artifact" | "upload";
  extension: string;
}

export interface WorkspaceContextType {
  files: WorkspaceFile[];            // unified list (artifacts + uploads)
  selectedFile: WorkspaceFile | null;
  selectFile: (file: WorkspaceFile) => void;
  clearSelection: () => void;
}
```

`WorkspaceContext.Provider` is placed inside `ChatBox` (same scope as today's `ArtifactsContext.Provider`), wrapping `ThreeColumnLayout`.

### Data Flow for Unified File List

The unification happens in a custom hook `useWorkspaceFiles`:

```typescript
// Location: frontend/src/components/workspace/three-column-layout/workspace-context.tsx
// or: frontend/src/core/workspace/hooks.ts

function useWorkspaceFiles(thread: AgentThread, threadId: string): WorkspaceFile[] {
  // Source 1: AI-generated artifacts — from thread.values.artifacts
  // Already available in real-time via useThreadStream
  // Type: string[] (absolute virtual paths like /mnt/user-data/outputs/report.md)

  // Source 2: User uploads — fetched from GET /api/threads/{threadId}/uploads/list
  // Uses existing listUploadedFiles() from frontend/src/core/uploads/api.ts
  // Type: UploadedFileInfo[] with artifact_url field
  // Cache with TanStack Query, refetch when thread sends new message

  // Merge strategy:
  // - artifacts: filepath = path as-is (used by urlOfArtifact directly)
  // - uploaded_files: filepath = "/mnt/user-data/uploads/{filename}"
  //   (artifact_url format: /api/threads/{id}/artifacts/mnt/user-data/uploads/{file})
  // - Uploaded files appear first (or sorted by name), artifacts after
  // - Deduplication: skip upload if same filename already in artifacts
}
```

**Key insight on URL construction:** Both artifact paths and upload paths are served by the same backend endpoint `GET /api/threads/{thread_id}/artifacts/{path}`. The `artifact_url` field from the uploads API already tells us the correct path. Strip the `/api/threads/{threadId}/artifacts` prefix to get the `filepath` for `urlOfArtifact()`.

### Why NOT Extend `AgentThreadState` for Uploads

`AgentThreadState` (`frontend/src/core/threads/types.ts`) does NOT currently expose `uploaded_files` to the frontend. The backend `ThreadState` has `uploaded_files: NotRequired[list[dict] | None]`, but this is used only for middleware coordination (UploadsMiddleware), not for frontend consumption. The canonical frontend API for listing user uploads is `GET /api/threads/{threadId}/uploads/list`, which returns structured `UploadedFileInfo` objects with `artifact_url`. Use this API directly via TanStack Query rather than trying to read from thread state.

---

## Integration Points with Existing Code

### Existing Code to Reuse (Unchanged)

| Existing File | How Reused | Notes |
|---------------|------------|-------|
| `core/artifacts/utils.ts` → `urlOfArtifact()` | FilePreviewPanel calls it to build iframe/fetch URLs | Already handles mock mode |
| `core/artifacts/hooks.ts` → `useArtifactContent()` | FilePreviewPanel reuses directly for text/code content loading | Takes `filepath` + `threadId` |
| `core/artifacts/loader.ts` → `loadArtifactContent()` | Called internally by `useArtifactContent` | No change |
| `components/workspace/artifacts/artifact-file-detail.tsx` | FilePreviewPanel wraps or copies the rendering logic | See below |
| `components/workspace/artifacts/artifact-file-list.tsx` | FileListPanel wraps with adapted onClick | Only needs to call `selectFile()` from WorkspaceContext instead of `useArtifacts()` |
| `core/utils/files.tsx` → `getFileName()`, `getFileIcon()`, `checkCodeFile()` | Used by both FileListPanel and FilePreviewPanel | No change |
| `core/uploads/api.ts` → `listUploadedFiles()` | Used by `useWorkspaceFiles` hook | Already exists, just needs TanStack Query wrapper |
| `components/workspace/code-editor.tsx` | FilePreviewPanel uses for code display | No change |

### `ArtifactFileDetail` Reuse Strategy

`artifact-file-detail.tsx` currently reads from `useArtifacts()` context (specifically `artifacts` list for the select dropdown and `setOpen` for the close button). In the three-panel layout:

- The **close button** is not needed (panel is always visible).
- The **file select dropdown** in the header is replaced by clicking in the left panel.
- The **content rendering** (CodeEditor, iframe, Streamdown markdown, image) is exactly what we need.

**Recommended approach:** Create `FilePreviewPanel` as a new component that contains the content-rendering logic extracted from `ArtifactFileDetail`. Specifically reuse:
- The `isCodeFile` / `language` detection logic (using `checkCodeFile`)
- The `viewMode` toggle (code vs preview for markdown/html)
- The `useArtifactContent` hook call
- The `CodeEditor` + `Streamdown` + `iframe` rendering branches

The header actions (download link, copy button, open-in-new-window) can be adapted — replace the close button with nothing, remove the artifact select dropdown.

**Alternative:** Pass `filepath` prop to `ArtifactFileDetail` and conditionally hide the close button and select dropdown via props. Lower code reuse benefit but faster to implement.

### `ArtifactsContext` Migration

`ArtifactsContext` continues to exist for backward compatibility but is no longer the source of truth for panel visibility. In `ChatBox`:

```
// Before:
const { open, setArtifacts } = useArtifacts();

// After three-panel:
// setArtifacts() still called to keep ArtifactsContext populated
// but open/setOpen are no longer used to control layout
// ArtifactsContext can be deprecated in a follow-up
```

---

## Data Flow Diagram

```
useThreadStream (core/threads/hooks.ts)
  → thread.values.artifacts: string[]       [real-time, SSE stream]
  → thread.values.messages                  [real-time, SSE stream]

listUploadedFiles (core/uploads/api.ts)
  → GET /api/threads/{id}/uploads/list      [TanStack Query, refetch on message finish]
  → files: UploadedFileInfo[]

useWorkspaceFiles (new hook)
  → merge artifacts + uploaded files
  → returns WorkspaceFile[]
  → WorkspaceContext.Provider receives files

WorkspaceContext
  → files: WorkspaceFile[]
  → selectedFile: WorkspaceFile | null

FileListPanel
  reads: WorkspaceContext.files
  writes: WorkspaceContext.selectFile()
  renders: per-file row with icon + name (reuse getFileIcon, getFileName)

FilePreviewPanel
  reads: WorkspaceContext.selectedFile
  calls: useArtifactContent({ filepath, threadId })
  renders: CodeEditor | Streamdown | iframe | <img> | <video>
```

---

## Layout Structure

### Three-Column Container

Replace `ResizablePanelGroup` in `chat-box.tsx` with a fixed 1:2:2 proportional layout. The current `react-resizable-panels` library (already in the project) can express this:

```tsx
// frontend/src/components/workspace/three-column-layout/three-column-layout.tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={20} minSize={15} maxSize={30} id="files">
    <LeftPanel threadId={threadId} />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40} id="chat">
    {children}   {/* existing chat content from page.tsx */}
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40} id="preview">
    <RightPanel threadId={threadId} />
  </ResizablePanel>
</ResizablePanelGroup>
```

The 1:2:2 proportions become `defaultSize` of 20/40/40. Users can resize within bounds. This reuses the `ResizablePanelGroup` infrastructure already present in `chat-box.tsx`.

### Empty State for Right Panel

When `selectedFile === null`:
- Show an empty state using the existing `ConversationEmptyState` component from `@/components/ai-elements/conversation` (already used in `chat-box.tsx`).
- Message: "选择左侧文件进行预览" (select a file to preview).

---

## File Preview Rendering Matrix

Based on existing code in `artifact-file-detail.tsx` plus new file types needed per PROJECT.md:

| File Type | Detection | Renderer | Source |
|-----------|-----------|----------|--------|
| Markdown (.md) | `language === "markdown"` | `Streamdown` (existing) | `useArtifactContent` |
| HTML | `language === "html"`, not write-file | `<iframe src={urlOfArtifact(...)} />` | URL |
| Code files | `checkCodeFile()` returns isCodeFile | `CodeEditor readonly` (existing) | `useArtifactContent` |
| Image (.png, .jpg, etc.) | extension check | `<img src={urlOfArtifact(...)} />` | URL |
| Video (.mp4, .mov, .m4v) | extension check | `<video src={urlOfArtifact(...)} />` | URL |
| Other / binary | fallback | `<iframe src={urlOfArtifact(...)} />` | URL |

Image and video renderers are the only net-new rendering branches. Code/markdown/html/other are already implemented in `ArtifactFileDetail`.

The extension check for images and video already exists in `getFileIcon()` in `core/utils/files.tsx` (lines 203-228). Mirror the same extension list for renderer selection.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling `selectedFile` Through Chat Hierarchy
**What:** Passing `selectedFile` down from `page.tsx` through `ChatBox` → `MessageList` → individual messages.
**Why bad:** Requires modifying many components with no benefit; `selectedFile` is only consumed by `FileListPanel` and `FilePreviewPanel`.
**Instead:** Put `WorkspaceContext.Provider` at the `ChatBox` level. Only `FileListPanel` and `FilePreviewPanel` call `useWorkspaceContext()`.

### Anti-Pattern 2: Storing Uploads in `AgentThreadState` Frontend Type
**What:** Adding `uploaded_files` to `AgentThreadState` in `frontend/src/core/threads/types.ts`.
**Why bad:** The backend only exposes `uploaded_files` for middleware coordination, not as a user-facing data field. The canonical list comes from `GET /api/threads/{id}/uploads/list`.
**Instead:** Fetch uploads via `listUploadedFiles()` wrapped in TanStack Query (`queryKey: ["uploads", threadId]`).

### Anti-Pattern 3: Forking `ArtifactFileDetail` Entirely
**What:** Copy-pasting the entire rendering logic instead of reusing it.
**Why bad:** Bug fixes to `ArtifactFileDetail` (markdown plugins, code highlighting) would need to be applied in two places.
**Instead:** Extract the content-rendering logic into a shared sub-component or pass a `mode: "panel" | "popup"` prop to conditionally hide the header controls.

### Anti-Pattern 4: Re-fetching Uploads on Every Render
**What:** Calling `listUploadedFiles()` in a `useEffect` without caching.
**Why bad:** Unnecessary network requests, race conditions with streaming.
**Instead:** Use TanStack Query with `queryKey: ["uploads", threadId]` and `staleTime: 30_000`. Invalidate after message send completes (`onFinish` callback already exists in `useThreadStream`).

---

## Specific Files to Modify vs Create

### Files to Modify

| File | Change |
|------|--------|
| `frontend/src/app/workspace/chats/[thread_id]/page.tsx` | Remove `<ArtifactTrigger />` from header. Wrap `ChatBox` in `WorkspaceContext.Provider`. |
| `frontend/src/components/workspace/chats/chat-box.tsx` | Replace 2-panel `ResizablePanelGroup` with `<ThreeColumnLayout>`. Keep `setArtifacts` sync effect. Remove `open`/`setOpen` usage. |
| `frontend/src/components/workspace/artifacts/artifact-file-list.tsx` | Add optional `onFileClick` prop; if provided, call it instead of `selectArtifact` + `setOpen`. (Backward-compatible.) |
| `frontend/src/core/threads/types.ts` | No change required. |

### Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/workspace/three-column-layout/workspace-context.tsx` | `WorkspaceContext`, `WorkspaceFile` type, `useWorkspaceContext` hook, `useWorkspaceFiles` hook |
| `frontend/src/components/workspace/three-column-layout/three-column-layout.tsx` | Outer 1:2:2 ResizablePanelGroup shell |
| `frontend/src/components/workspace/three-column-layout/left-panel.tsx` | File list panel; shows unified `files` from `WorkspaceContext` |
| `frontend/src/components/workspace/three-column-layout/right-panel.tsx` | Preview panel; reads `selectedFile` from `WorkspaceContext`, renders by type |
| `frontend/src/components/workspace/three-column-layout/index.ts` | Barrel export |

---

## Scalability Considerations

| Concern | Current Approach | Notes |
|---------|-----------------|-------|
| Large artifact lists | `string[]` — no pagination | Unlikely to be a real problem for single-thread; artifacts are manually added by agent |
| Large upload lists | `UploadedFileInfo[]` from API | Backend `GET /uploads/list` lists all files; no pagination. Acceptable for v1. |
| Preview of large files | `loadArtifactContent()` fetches full file text | CodeEditor loads entire file. For v1 (read-only), acceptable. No streaming needed. |
| Left panel overflow | Scrollable column | Use `overflow-y: auto` on left panel; file list already renders in `<ul>`. |

---

## Sources

All findings are HIGH confidence — derived from direct file reading of the following source files:

- `frontend/src/app/workspace/chats/[thread_id]/page.tsx` — page entry point
- `frontend/src/components/workspace/chats/chat-box.tsx` — current 2-panel layout
- `frontend/src/components/workspace/artifacts/context.tsx` — current artifact state
- `frontend/src/components/workspace/artifacts/artifact-file-list.tsx` — file list rendering
- `frontend/src/components/workspace/artifacts/artifact-file-detail.tsx` — file detail/preview
- `frontend/src/core/artifacts/hooks.ts` — content loading hook
- `frontend/src/core/artifacts/utils.ts` — URL construction
- `frontend/src/core/artifacts/loader.ts` — fetch logic
- `frontend/src/core/threads/types.ts` — `AgentThreadState` type
- `frontend/src/core/threads/hooks.ts` — `useThreadStream`
- `frontend/src/core/uploads/api.ts` — upload API functions
- `frontend/src/core/utils/files.tsx` — file type detection and icons
- `backend/src/agents/thread_state.py` — backend `ThreadState` schema
- `backend/src/gateway/routers/uploads.py` — uploads API including `/list` endpoint
