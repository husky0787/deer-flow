# Phase 2: 预览面板 + 收尾清理 - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

实现右侧预览面板的全文件类型只读预览（代码、Markdown、纯文本、图片、视频），包含加载骨架屏、大文件截断提示、视频资源释放。清理旧弹出式 Artifact 残留逻辑，验证边缘情况。不涉及文件编辑、多标签页、移动端适配。

</domain>

<decisions>
## Implementation Decisions

### 代码渲染器
- 使用 Shiki（现有 CodeBlock 组件）而非 CodeMirror
- Phase 2 只做只读预览，Shiki 更轻量，无需 CodeMirror 的编辑能力
- 复用现有 CodeBlock 的亮色/暗色双主题切换

### 预览面板头部
- 显示文件名 + 文件类型图标 + 操作栏
- 操作栏按钮：下载、复制内容、.skill 安装（仅 .skill 文件显示）
- 复用现有 getFileName / getFileIcon 工具函数

### 大文件截断
- 超过 500KB 的文本文件：加载并显示前 N 字符内容
- 底部显示截断提示（如"文件过大，仅显示前 XX 字符"）
- 不是完全不加载——用户能看到部分内容

### Markdown / HTML 渲染模式
- Markdown 文件提供 code / preview 切换：源码视图（Shiki 高亮）和渲染视图（Streamdown）
- HTML 文件提供 code / preview 切换：源码视图（Shiki 高亮）和 iframe 预览
- 其他代码文件只有 code 视图，不需要切换
- 默认展示 preview 模式

### Claude's Discretion
- 骨架屏的具体设计和动画
- 截断字符数的具体阈值（在 500KB 范围内合理选择）
- 空状态的具体文案和图标样式
- 视频资源释放的具体实现方式
- code/preview 切换按钮的具体 UI 样式

</decisions>

<specifics>
## Specific Ideas

- 参考现有 ArtifactFileDetail 的多类型预览分支逻辑，但适配到 RightPanel 的面板布局中
- .skill 文件预览时加载 SKILL.md 内容（现有 loader 已支持）
- 操作栏风格与左侧文件列表的按钮保持一致

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CodeBlock` (`ai-elements/code-block.tsx`): Shiki 语法高亮，支持亮/暗双主题，直接用于代码预览
- `Streamdown` + `streamdownPlugins` (`core/streamdown/plugins.ts`): Markdown 渲染，支持 GFM / KaTeX / raw HTML
- `useArtifactContent` (`core/artifacts/hooks.ts`): TanStack Query 加载文件内容，5 分钟缓存
- `loadArtifactContent` (`core/artifacts/loader.ts`): 文件内容加载，.skill 自动加载 SKILL.md
- `urlOfArtifact` (`core/artifacts/utils.ts`): 构建文件 URL
- `checkCodeFile` / `getFileIcon` / `getFileName` (`core/utils/files.tsx`): 文件类型检测和图标
- `Skeleton` (`ui/skeleton.tsx`): 基础骨架屏组件
- `Image` (`ai-elements/image.tsx`): 图片展示（base64）
- `Artifact*` 容器组件 (`ai-elements/artifact.tsx`): Header / Title / Actions / Content 布局

### Established Patterns
- ArtifactFileDetail 已有完整的多类型文件预览分支（code → CodeEditor, markdown → Streamdown, html → iframe, 其他 → iframe）
- 文件内容通过 `useArtifactContent` hook 加载，使用 TanStack Query 管理缓存
- 主题切换通过 `next-themes` 的 `useTheme` 获取当前主题

### Integration Points
- RightPanel (`workspace/right-panel.tsx`): 当前是空状态占位，需要扩展为完整预览
- WorkspaceContext: `selectedFile` 提供当前选中文件路径
- LeftPanel: 已有下载和 .skill 安装按钮逻辑，可参考复用

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-preview-panel-cleanup*
*Context gathered: 2026-03-05*
