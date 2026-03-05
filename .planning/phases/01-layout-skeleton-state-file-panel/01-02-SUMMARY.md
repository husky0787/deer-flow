---
phase: 01-layout-skeleton-state-file-panel
plan: 02
subsystem: ui
tags: [react, resizable-panels, three-column-layout, file-panel, workspace]

# Dependency graph
requires:
  - phase: 01-01
    provides: WorkspaceContext, WorkspaceProvider, useWorkspace, useWorkspaceFiles, WorkspaceFile type
provides:
  - Three-column resizable layout (20/40/40) replacing ChatBox + ArtifactTrigger
  - LeftPanel component with file list, highlight, scrollIntoView, empty state, download, skill install
  - RightPanel placeholder component for file preview (Phase 2)
  - WorkspaceProvider injected in layout.tsx provider tree
  - useWorkspaceFiles connected in page.tsx to sync artifacts into WorkspaceContext
affects: [phase-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [ResizablePanelGroup three-column layout, ref-map scrollIntoView, Card highlight pattern]

key-files:
  created:
    - frontend/src/components/workspace/left-panel.tsx
    - frontend/src/components/workspace/right-panel.tsx
  modified:
    - frontend/src/app/workspace/chats/[thread_id]/layout.tsx
    - frontend/src/app/workspace/chats/[thread_id]/page.tsx

key-decisions:
  - "Keep ArtifactsProvider in layout.tsx for backward compat (ToolCallMessage still uses useArtifacts)"
  - "No id/autoSaveId on ResizablePanelGroup to avoid SSR hydration flash (LAYOUT-05)"
  - "LeftPanel uses useRef<Map> for per-item DOM refs to enable scrollIntoView"
  - "selectFile called without isAutoSelect=true on user click, stopping autoSelect"

patterns-established:
  - "Three-column layout: ResizablePanelGroup with min-h-0 on each panel content div"
  - "File list Card highlight: border-primary + bg-primary/5 + ring-1 pattern"
  - "scrollIntoView via ref Map + useEffect on selectedFile change"

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, STATE-04, FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 1 Plan 02: Three-Column Layout + File Panel Summary

**三栏可调整布局（20/40/40）替代 ChatBox 弹出面板，LeftPanel 完整文件列表交互，RightPanel 预览占位**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T13:44:13Z
- **Completed:** 2026-03-05T13:48:49Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 2

## Accomplishments
- 聊天页从单栏 + 弹出式 Artifact 面板重构为固定三栏 ResizablePanelGroup 布局（20/40/40）
- LeftPanel 实现完整文件列表交互：Card 高亮、scrollIntoView、空状态、下载按钮、.skill 安装按钮
- RightPanel 渲染空状态占位（Phase 2 实现文件预览）
- ArtifactTrigger 从 header 移除，ChatBox 不再包裹聊天内容
- WorkspaceProvider 注入 layout.tsx 提供文件状态，useWorkspaceFiles 在 page.tsx 连接 artifacts 数据

## Task Commits

Each task was committed atomically:

1. **Task 1: 修改 layout.tsx 注入 WorkspaceProvider + 创建 right-panel.tsx 空状态占位** - `7dd38da` (feat)
2. **Task 2: 创建 LeftPanel 文件列表组件** - `33c816e` (feat)
3. **Task 3: 重写 page.tsx 为三栏布局** - `c3f2a7d` (feat)

## Files Created/Modified
- `frontend/src/components/workspace/left-panel.tsx` - LeftPanel 文件列表组件（Card 高亮、scrollIntoView、空状态、下载/安装按钮）
- `frontend/src/components/workspace/right-panel.tsx` - RightPanel 空状态占位组件
- `frontend/src/app/workspace/chats/[thread_id]/layout.tsx` - 添加 WorkspaceProvider 到 provider 树
- `frontend/src/app/workspace/chats/[thread_id]/page.tsx` - 三栏 ResizablePanelGroup 布局，移除 ChatBox 和 ArtifactTrigger

## Decisions Made
- 保留 ArtifactsProvider 在 layout.tsx 中，因为 message-group.tsx 的 ToolCallMessage 仍调用 useArtifacts()，移除会导致运行时错误
- 不传 id/autoSaveId 给 ResizablePanelGroup，避免 SSR hydration 闪烁（LAYOUT-05）
- LeftPanel 使用 useRef<Map<string, HTMLElement>> 存储每个 Card 的 DOM 引用，实现精准 scrollIntoView
- 用户手动点击文件时 selectFile 不传 isAutoSelect，自动停止 autoSelect 行为

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 三栏布局完成，Phase 2 可在 RightPanel 中实现文件预览逻辑
- WorkspaceContext 的 selectedFile 可供 RightPanel 消费
- LeftPanel 的 Card 选中交互已就绪，Phase 2 只需在 RightPanel 根据 selectedFile 渲染内容

## Self-Check: PASSED

- All 4 files (2 created, 2 modified) verified on disk
- All 3 task commits (7dd38da, 33c816e, c3f2a7d) verified in git log

---
*Phase: 01-layout-skeleton-state-file-panel*
*Completed: 2026-03-05*
