# Project Research Summary

**Project:** DeerFlow 三栏工作区 — 聊天页三栏重构
**Domain:** IDE-like AI chat workspace with three-panel file management
**Researched:** 2026-03-05
**Confidence:** HIGH

---

## Executive Summary

- 本次改造属于**布局重构**，而非功能新建。所需的每一项核心能力（面板库、文件列表、代码/Markdown/HTML 预览、文件类型检测、状态协调）在现有代码库中均已就绪，**不需要引入任何新 npm 依赖**。
- 行业已收敛到"左文件树 + 中聊天 + 右预览"的三栏 IDE 惯例（bolt.new、Cursor、v0.dev、Claude Artifacts 均如此），用户对这套交互有明确预期。核心挑战不是单个面板的功能，而是**面板协调行为**：自动选中、空状态、滚动锁定、Context 迁移。
- 最大技术风险来自两处：一是将现有 `ArtifactsContext`（为弹出式面板设计）迁移到固定三栏布局时的状态逻辑残留；二是 flex 布局中 `min-h-0` 缺失导致的整页滚动问题。两者在研究阶段均已定位并有明确预防方案，不构成实质障碍。
- 上传文件（`uploaded_files`）与 AI 生成文件（`artifacts`）的数据来源不同、路径格式不同，需要通过新建 `WorkspaceContext` + `useWorkspaceFiles` hook 统一处理。这是本次改造的唯一真正的**新业务逻辑**，其余均为现有组件的重组。

---

## Consensus Findings

以下结论在全部 4 份研究文件中高度一致，无矛盾：

| 结论 | 来源 |
|------|------|
| 零新 npm 依赖，全部复用现有库 | STACK + ARCHITECTURE |
| 用 `WorkspaceContext` 取代 `ArtifactsContext` 作为面板状态核心 | ARCHITECTURE + PITFALLS |
| 必须移除 `ArtifactTrigger` 按钮，停用 `open`/`autoOpen` 逻辑 | ARCHITECTURE + PITFALLS |
| 三栏使用 `react-resizable-panels`（已有 `ResizablePanelGroup`），比例 20/40/40 | STACK + ARCHITECTURE + FEATURES |
| 图片 → `<img>`，视频 → `<video controls muted>`，不引入 react-player | STACK + FEATURES + PITFALLS |
| 移动端 < 1024px 回退到现有弹出式行为，不在本次 scope 内 | FEATURES |
| `ArtifactFileDetail` 的内容渲染逻辑直接复用，不重写 | STACK + ARCHITECTURE |
| 上传文件通过 `GET /api/threads/{id}/uploads/list` + TanStack Query 获取，不改 ThreadState 类型 | ARCHITECTURE + PITFALLS |
| `ResizablePanel` 必须始终渲染（不条件性 null），切换内容而非切换 Panel | PITFALLS |

---

## Key Technical Decisions

### 1. 状态管理：创建 WorkspaceContext，不扩展 ArtifactsContext

**推荐：** 新建 `workspace-context.tsx`，定义 `WorkspaceFile` 统一类型（覆盖 artifact 和 upload），提供 `files`、`selectedFile`、`selectFile()`、`clearSelection()` 接口。

`ArtifactsContext` 保留但降级为只提供 `setArtifacts()`（保持向后兼容），其 `open`/`autoOpen`/`autoSelect` 语义在三栏布局中无意义，不再使用。

**理由：** `ArtifactsContext.select()` 硬编码调用 `setSidebarOpen(false)`，这是弹出式面板专用行为。在新布局中继续使用会导致用户点击文件时导航侧边栏意外收起（PITFALLS Pitfall 4）。

### 2. 布局：ResizablePanelGroup 而非纯 CSS Grid

**推荐：** 使用已有的 `ResizablePanelGroup`（`react-resizable-panels` v4.6.2），defaultSize 20/40/40，**不传 `autoSaveId`**（避免 SSR hydration 闪烁）。

**理由：** FEATURES.md 指出固定比例是 v1 目标，但 ARCHITECTURE.md 也指出 `ResizablePanelGroup` 已在 `chat-box.tsx` 中使用，复用比切换到纯 CSS Grid 成本更低，且为未来可调整尺寸留有余地。

**注意：** PROJECT.md 描述"1:2:2 固定比例"，ARCHITECTURE.md 和 STACK.md 均实际推荐 `ResizablePanelGroup`（可调），FEATURES.md 则将"自定义拖拽调整"列为 v2。建议按 ARCHITECTURE 方案实施：使用 `ResizablePanelGroup` 但设置 `defaultSize`，用户可拖拽但不强制（比纯固定 Grid 多一份灵活性，代价为零）。

### 3. 文件列表：统一两个数据源

**推荐：** 新建 `useWorkspaceFiles(thread, threadId)` hook，合并：
- `thread.values.artifacts: string[]`（实时 SSE 流）
- `listUploadedFiles()` → TanStack Query（`queryKey: ["uploads", threadId]`，`staleTime: 30_000`）

路径格式必须在 hook 内统一转换：从 `artifact_url` 中剥离 `/api/threads/{id}/artifacts` 前缀得到 `filepath`。

**理由：** ARCHITECTURE.md 确认 `uploaded_files` 不在 `AgentThreadState` 前端类型中，直接读取会引入错误假设。PITFALLS Pitfall 11 专门指出路径格式不一致是实现时的高频失误。

### 4. 预览渲染：复用 ArtifactFileDetail，按 mode 区分

**推荐：** 创建 `right-panel.tsx`，提取 `ArtifactFileDetail` 的内容渲染逻辑（CodeEditor/Streamdown/iframe 分支），新增 `<img>` 和 `<video>` 分支。头部操作栏去掉关闭按钮和文件选择下拉框，保留 copy/download/open-in-new-tab。

两个可行方案：
- 方案 A（推荐）：抽取共享渲染子组件，`ArtifactFileDetail` 和 `FilePreviewPanel` 共用
- 方案 B（快速）：给 `ArtifactFileDetail` 加 `mode: "popup" | "panel"` prop，条件隐藏 header 控件

ARCHITECTURE.md 推荐方案 A 以防止逻辑分叉，但方案 B 实现更快。根据开发资源酌情选择。

---

## Key Findings

### 推荐技术栈（来自 STACK.md）

本次里程碑零新依赖。核心技术全部已安装：

| 技术 | 用途 | 状态 |
|------|------|------|
| `react-resizable-panels` 4.6.2 | 三栏可调整布局 | 已安装，已有 shadcn 包装 |
| `@uiw/react-codemirror` 4.25.4 | 代码文件只读预览 | 已安装 |
| `streamdown` 1.4.0 | Markdown 渲染 | 已安装 |
| `lucide-react` 0.562.0 | 文件类型图标 | 已安装，`getFileIcon()` 已覆盖所有类型 |
| React Context (原生) | 面板状态协调 | 无需新库 |
| 原生 `<img>` / `<video>` | 图片/视频预览 | 无需 react-player |

### 功能范围（来自 FEATURES.md）

**必须实现（表格内容为 MVP）：**
- 持久化左侧文件面板（替换弹出触发按钮）
- 文件行：图标 + 文件名 + 类型标签 + hover 下载按钮
- 点击文件 → 右侧面板预览，激活行高亮
- 右侧面板：无选中时显示空状态，加载时显示骨架屏
- 代码/Markdown/HTML/图片/视频预览（均已有基础）
- 新 artifact 生成时自动选中（`autoSelect` 机制已有，需接线）
- 左侧无文件时显示"暂无文件"空状态
- lg 断点以下回退到现有弹出式行为

**延后到下一里程碑：**
- 上传文件与 AI 生成文件分组显示（需先解决数据整合问题）
- 文件列表中"新生成"标记
- 可调整面板尺寸（用户拖拽）
- 从预览跳转到产生该文件的聊天消息

**明确不做：**
- 文件编辑（CodeMirror 保持 readonly）
- 多标签页
- 移动端适配
- 文件删除/重命名

### 架构方案（来自 ARCHITECTURE.md）

在现有 `ChatBox` 边界内插入新的三栏 Layout shell，扩展而非替换现有两栏系统。

**新建组件（均在 `three-column-layout/` 目录）：**
1. `workspace-context.tsx` — `WorkspaceContext`、`WorkspaceFile` 类型、`useWorkspaceFiles` hook
2. `three-column-layout.tsx` — 1:2:2 比例的 `ResizablePanelGroup` 外壳
3. `left-panel.tsx` — 文件列表面板（复用 `ArtifactFileList`）
4. `right-panel.tsx` — 文件预览面板（复用 `ArtifactFileDetail` 渲染逻辑）
5. `index.ts` — barrel export

**修改现有文件：**
- `page.tsx` — 移除 `<ArtifactTrigger />`，包裹 `WorkspaceContext.Provider`
- `chat-box.tsx` — 用 `<ThreeColumnLayout>` 替换当前的 2-Panel `ResizablePanelGroup`，保留 `setArtifacts` 同步 effect
- `artifact-file-list.tsx` — 添加可选 `onFileClick` prop（向后兼容）

### 关键陷阱（来自 PITFALLS.md）

**致命（必须在实现前知晓）：**

1. **flex `min-h-0` 缺失** — 三栏容器每一层 flex 子项必须加 `min-h-0`，否则整页滚动、输入框定位失效。这是布局阶段最容易遇到的问题。
2. **react-resizable-panels SSR hydration 闪烁** — 不传 `autoSaveId`，禁止库自动向 localStorage 持久化，避免 SSR/CSR 尺寸不一致导致布局跳变。
3. **视频 autoplay 被浏览器阻断** — 不用 `autoplay`，始终加 `controls` + `muted` + `playsInline`，用 `.play().catch()` 处理被阻断的情况。
4. **ArtifactsContext `open` 状态逻辑残留** — 迁移时必须显式停用 `open`/`autoOpen`/`autoSelect` 及 `setSidebarOpen(false)` 调用，否则用户点击文件时导航侧边栏意外收起。
5. **ResizablePanel 条件渲染导致布局错乱** — 右侧 Panel 必须始终挂载，切换的是 Panel 内部内容（空状态 vs 预览内容），而不是整个 Panel 组件。

**中等（实现时注意）：**
- 大文件 CodeMirror 冻结 UI（设置 500KB 截断上限）
- 流式生成时切换文件竞态（用 `isLoading` 骨架屏遮挡）
- 视频元素切换时内存泄漏（组件卸载时 `removeAttribute('src')` + `load()`）
- 上传文件与 artifact 路径格式不一致（在 `useWorkspaceFiles` 中统一转换）

---

## Open Questions（需决策的开放问题）

以下问题研究阶段未能最终确定，需要团队在实现前做出选择：

| 问题 | 选项 | 推荐 | 影响范围 |
|------|------|------|---------|
| ArtifactFileDetail 复用方式 | A: 抽取共享渲染子组件 vs B: 加 `mode` prop | A（防止逻辑分叉） | right-panel 实现工作量 |
| 文件列表排序 | 最新在顶 vs 最新在底 | 最新在顶（与聊天时间顺序一致） | left-panel UX |
| 上传文件与 AI 文件是否分组 | v1 一起展示 vs 分"AI 生成/已上传"两组 | v1 先一起，分组延后 | useWorkspaceFiles 复杂度 |
| 面板尺寸持久化 | 不持久化（简单）vs cookie 持久化（SSR 友好）| 不持久化（v1 足够）| SSR 闪烁风险 |
| 右侧预览的"选择文件"空状态文案 | 中文 vs 英文（取决于 i18n 方案） | 走现有 i18n key | 国际化一致性 |

---

## Risk Summary

| 排名 | 风险 | 严重性 | 预防措施 |
|------|------|--------|---------|
| 1 | flex `min-h-0` 导致布局整体崩坏 | CRITICAL | 搭骨架时第一步验证；三栏容器每层加 `min-h-0` + `overflow-hidden` |
| 2 | ArtifactsContext `open` 残留逻辑污染新布局 | CRITICAL | 迁移时创建 checklist：移除 ArtifactTrigger、停用 open/autoOpen、新 Context 不调用 setSidebarOpen |
| 3 | ResizablePanel 条件渲染引发布局跳变 | CRITICAL | 右侧 Panel 始终渲染，用 `EmptyPreviewState` 而非 null |
| 4 | SSR hydration 闪烁（autoSaveId） | CRITICAL | 不传 `autoSaveId`；v1 不持久化面板尺寸 |
| 5 | 上传文件路径格式不一致导致 URL 404 | MINOR-MODERATE | `useWorkspaceFiles` 内统一剥离 API 前缀；集成时用 Network 面板验证 |

---

## Implementation Order

基于依赖关系和陷阱分布，推荐以下实现顺序：

### Phase 1：布局骨架（最优先）

**理由：** 所有其他工作都在布局容器内进行。先把骨架搭对，可以立即暴露 CSS 问题。

1. 在 `chat-box.tsx` 中用 `<ThreeColumnLayout>` 替换现有 2-Panel 布局
2. 创建 `three-column-layout.tsx`（`ResizablePanelGroup` 20/40/40，不传 autoSaveId）
3. 创建占位 `left-panel.tsx`（空 div，验证布局比例）
4. 创建占位 `right-panel.tsx`（空 div + 空状态文字）
5. 验证：`min-h-0` 在每层 flex 容器正确添加；多消息对话下无整页滚动

**避免陷阱：** Pitfall 1（min-h-0）、Pitfall 2（autoSaveId）、Pitfall 9（始终渲染）

### Phase 2：状态层

**理由：** 状态层是左右面板通信的基础，必须在接入真实数据前建立。

1. 创建 `workspace-context.tsx`（`WorkspaceFile` 类型、Provider、`useWorkspaceFiles` hook）
2. 实现 `useWorkspaceFiles`：合并 `thread.values.artifacts` 和 `listUploadedFiles()` TanStack Query
3. 路径格式统一转换逻辑（Pitfall 11 预防）
4. 从 `page.tsx` 移除 `<ArtifactTrigger />`，停用 `ArtifactsContext` 的 `open` 相关调用
5. 验证：点击文件不触发 `setSidebarOpen(false)`

**避免陷阱：** Pitfall 4（Context 残留）、Pitfall 11（路径格式）

### Phase 3：左侧文件面板

**理由：** 状态层就绪后，接入文件列表是最简单的步骤（复用现有组件）。

1. `left-panel.tsx` 接入 `WorkspaceContext.files`，渲染文件列表
2. 适配 `ArtifactFileList` 的 `onFileClick` prop 调用 `selectFile()`
3. 激活行高亮（`selectedFile.filepath === item.filepath`）
4. 添加"暂无文件"空状态（左侧）
5. 新 artifact 自动选中的 `useEffect`（`autoSelect` 逻辑）
6. 文件列表独立滚动 + 新文件 `scrollIntoView`

### Phase 4：右侧预览面板

**理由：** 右侧面板依赖左侧选中状态，自然排在 Phase 3 之后。

1. `right-panel.tsx` 读取 `WorkspaceContext.selectedFile`，空时显示空状态
2. 接入 `useArtifactContent`，实现骨架屏加载状态
3. 复用 `ArtifactFileDetail` 的代码/Markdown/HTML 渲染分支
4. 新增图片预览（`<img className="size-full object-contain">`）
5. 新增视频预览（`VideoPreview` 组件，含 `muted` + `controls` + 卸载 cleanup）
6. 错误状态（加载失败 + 重试按钮）

**避免陷阱：** Pitfall 3（视频 autoplay）、Pitfall 5（大文件截断）、Pitfall 6（isLoading 骨架屏）、Pitfall 7（视频内存 cleanup）、Pitfall 13（图片 object-contain）

### Phase 5：响应式回退与清理

**理由：** 功能完整后再处理边缘情况和清理，避免提前增加复杂度。

1. `lg:` 断点以下回退到现有弹出式行为（隐藏左右面板，恢复 trigger 按钮或 modal）
2. 验证 `chat-box.tsx` 中 `translate-x-full` 过渡动画相关代码已清除（Pitfall 12）
3. 测试长消息对话：三栏均独立滚动，无页面级滚动条
4. 测试大文件：500KB 截断显示正确
5. 标记 `ArtifactsContext` 中 `open`/`autoOpen` 字段为 `@deprecated`

### Research Flags（各阶段研究需求）

- **Phase 1-4：** 所有模式均有明确文档和现有代码参考，无需额外 `/gsd:research-phase`
- **上传文件分组（延后功能）：** 实现时需确认 `GET /uploads/list` API 返回数据结构是否稳定，建议届时补充 API contract 核查
- **i18n 文案：** 右侧空状态文案需确认现有 i18n key 的使用规范（`messages.json` / `t()` 函数）

---

## Confidence Assessment

| 方面 | 置信度 | 说明 |
|------|--------|------|
| 技术栈 | HIGH | 直接读取 `pnpm-lock.yaml` 和 `package.json` 确认，无推断 |
| 功能范围 | HIGH | 基于 codebase 分析 + 行业对标（bolt.new、Cursor 等）双重确认 |
| 架构方案 | HIGH | 完全基于直接代码阅读（所有相关源文件逐行分析），非推断 |
| 陷阱识别 | HIGH | 结合 codebase 分析 + 有据可查的外部问题（GitHub issues、MDN、Bugzilla） |

**总体置信度：HIGH**

### Gaps to Address（待解决的空白）

- **上传文件分组 UI 的 v1 决策：** 研究确认技术可行，但 v1 是否展示分组（"AI 生成 / 已上传"两段）还是统一列表，需产品侧确认。当前推荐统一列表。
- **响应式回退的具体 UX：** PROJECT.md 说移动端不在 scope，但 `< 1024px` 时是"透明降级到现有行为"还是"显示提示引导用户使用桌面端"，需设计侧确认。
- **图片/视频 MIME type 检测：** 当前 `getFileIcon()` 基于扩展名检测，对无扩展名的视频/图片文件会降级到 unknown。本次 scope 内可接受，后续若需更精确检测需读取文件头。

---

## Sources

### Primary（HIGH 置信度，直接代码读取）

- `frontend/src/components/workspace/chats/chat-box.tsx` — 现有布局结构
- `frontend/src/components/workspace/artifacts/context.tsx` — ArtifactsContext 状态机
- `frontend/src/components/workspace/artifacts/artifact-file-list.tsx` — 文件列表渲染
- `frontend/src/components/workspace/artifacts/artifact-file-detail.tsx` — 文件详情/预览
- `frontend/src/core/artifacts/hooks.ts` — useArtifactContent TanStack Query hook
- `frontend/src/core/uploads/api.ts` — 上传文件 API
- `frontend/src/core/utils/files.tsx` — 文件类型检测与图标
- `frontend/pnpm-lock.yaml` — 实际安装库版本确认
- `frontend/package.json` — 依赖声明

### Secondary（HIGH 置信度，官方文档与已验证 GitHub Issues）

- [react-resizable-panels CHANGELOG](https://github.com/bvaughn/react-resizable-panels/blob/main/CHANGELOG.md) — v4 API 变更
- [react-resizable-panels Issue #144](https://github.com/bvaughn/react-resizable-panels/issues/144) — SSR hydration 闪烁
- [react-resizable-panels Issue #29](https://github.com/bvaughn/react-resizable-panels/issues/29) — 条件渲染警告
- [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — 视频自动播放策略
- [Mozilla Bugzilla #1054170](https://bugzilla.mozilla.org/show_bug.cgi?id=1054170) — video 元素内存释放
- [CodeMirror Discuss — large documents](https://discuss.codemirror.net/t/syntax-highlighting-not-working-on-large-documents/7579) — 大文件性能限制

### Tertiary（MEDIUM 置信度，行业观察）

- bolt.new、Cursor、v0.dev、Windsurf、Claude Artifacts 产品观察 — 三栏 IDE 布局惯例确认
- shadcn/ui Resizable 文档 — resizable.tsx 包装组件 v4 兼容性确认

---

*Research completed: 2026-03-05*
*Ready for roadmap: yes*
