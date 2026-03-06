# Phase 1: 布局骨架 + 状态层 + 文件面板 - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

搭建聊天页三栏固定布局容器（左文件面板 / 中聊天区 / 右预览区），建立 WorkspaceContext 状态层取代 ArtifactsContext，实现左侧文件面板的完整交互（文件列表、选中高亮、autoSelect、scrollIntoView、空状态）。右侧面板占位渲染但不实现预览功能（Phase 2 做）。

</domain>

<decisions>
## Implementation Decisions

### 文件行样式
- 沿用现有 Card 风格（ArtifactFileList 的 Card 组件样式）
- 每行显示文件类型图标 + 文件名 + 文件扩展名描述
- 保留下载按钮和 .skill 安装按钮
- 点击文件后该 Card 高亮选中

### 右侧面板 Phase 1 内容
- Phase 1 只显示空状态占位（"选择文件预览"提示）
- 点击文件后右侧面板仍显示空状态（预览功能 Phase 2 实现）
- 面板始终渲染，不条件 null

### 文件列表排序
- 按文件名字母序排列
- AI 生成文件和用户上传文件统一列表，不分组（v2 做分组）

### Claude's Discretion
- Card 高亮选中的具体样式（边框颜色、背景色等）
- 空状态的具体文案和图标选择
- WorkspaceContext 内部实现细节
- 文件路径统一转换的具体逻辑

</decisions>

<specifics>
## Specific Ideas

- 文件列表 Card 风格延续现有 ArtifactFileList 的设计语言，保持视觉一致性
- 下载和 skill 安装交互保持不变，用户不会因为布局改造丢失已有功能

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResizablePanelGroup / ResizablePanel / ResizableHandle` (`ui/resizable.tsx`): 直接用于三栏布局
- `ArtifactFileList` (`workspace/artifacts/artifact-file-list.tsx`): Card 风格文件列表，可迁移复用
- `getFileIcon / getFileName / getFileExtension` (`core/utils/files.tsx`): 文件图标和名称工具函数，直接复用
- `ArtifactsContext` (`workspace/artifacts/context.tsx`): 选中逻辑可参考，迁移到 WorkspaceContext

### Established Patterns
- `WorkspaceContainer` 已使用 `flex h-screen w-full flex-col`，三栏布局嵌入 WorkspaceBody 内
- Thread 数据通过 `useThreadStream` 获取，artifacts 在 `thread.values.artifacts` 中
- 上传文件通过 `parseUploadedFiles` 从消息内容解析

### Integration Points
- 聊天页入口 `app/workspace/chats/[thread_id]/page.tsx` — 需要包裹 ResizablePanelGroup
- `ArtifactTrigger` 在 header 中 — 需移除
- `ArtifactsContext` 的 `setSidebarOpen(false)` 副作用 — 需在新 Context 中修复

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-layout-skeleton-state-file-panel*
*Context gathered: 2026-03-05*
