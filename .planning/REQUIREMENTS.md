# Requirements: DeerFlow 三栏工作区

**Defined:** 2026-03-05
**Core Value:** 用户在一个视图中同时看到文件列表、聊天对话和文件内容，无需弹窗切换，提升工作效率。

## v1 Requirements

### 布局 (Layout)

- [ ] **LAYOUT-01**: 聊天页显示固定三栏布局：左文件面板、中聊天区、右预览区，默认比例 1:2:2
- [ ] **LAYOUT-02**: 三栏使用 `ResizablePanelGroup`（已有），用户可拖拽调整宽度
- [ ] **LAYOUT-03**: 每栏独立滚动，无页面级滚动条（flex 容器正确设置 `min-h-0`）
- [ ] **LAYOUT-04**: 右侧面板始终渲染（不条件 null），通过切换内容实现空状态/预览切换
- [ ] **LAYOUT-05**: 不使用 `autoSaveId`，避免 SSR hydration 闪烁

### 文件面板 (FilePanel)

- [ ] **FILE-01**: 左侧面板显示 AI 生成文件（artifacts）和用户上传文件的统一列表
- [ ] **FILE-02**: 文件行显示文件类型图标 + 文件名
- [ ] **FILE-03**: 点击文件后该行高亮，右侧面板显示对应文件内容
- [ ] **FILE-04**: AI 生成新文件时自动选中最新文件（autoSelect）
- [ ] **FILE-05**: 无文件时显示"暂无文件"空状态
- [ ] **FILE-06**: 文件列表独立滚动，新文件自动 scrollIntoView

### 预览面板 (Preview)

- [ ] **PREV-01**: 代码文件以语法高亮只读模式展示（复用 CodeMirror/Shiki）
- [ ] **PREV-02**: Markdown 文件渲染后展示（复用 Streamdown/rehype）
- [ ] **PREV-03**: 图片文件以 `<img>` 展示，`object-contain` 适配面板
- [ ] **PREV-04**: 视频文件以 `<video>` 展示，带 `controls` + `muted` + `playsInline`
- [ ] **PREV-05**: 纯文本文件以等宽字体展示
- [ ] **PREV-06**: 未选中文件时显示"选择文件预览"空状态
- [ ] **PREV-07**: 文件加载中显示骨架屏
- [ ] **PREV-08**: 大文件（>500KB 文本）显示截断提示而非加载全部内容
- [ ] **PREV-09**: 视频组件卸载时正确释放资源（防内存泄漏）

### 状态管理 (State)

- [ ] **STATE-01**: 新建 `WorkspaceContext` 管理选中文件和统一文件列表
- [ ] **STATE-02**: `useWorkspaceFiles` hook 合并 artifacts（SSE 流）和 uploaded_files（TanStack Query）
- [ ] **STATE-03**: 上传文件和 artifact 的路径格式在 hook 内统一转换
- [ ] **STATE-04**: 移除 `ArtifactTrigger` 弹出按钮，停用 `ArtifactsContext` 的 `open`/`autoOpen` 弹出逻辑
- [ ] **STATE-05**: 点击文件不触发导航侧边栏收起（修复 `setSidebarOpen(false)` 副作用）

## v2 Requirements

### 增强功能

- **ENH-01**: 上传文件与 AI 生成文件分组显示（"AI 生成" / "已上传"两段）
- **ENH-02**: 新生成文件在列表中显示"NEW"标记
- **ENH-03**: 面板尺寸 cookie 持久化（SSR 友好）
- **ENH-04**: 从预览面板跳转到产生该文件的聊天消息
- **ENH-05**: 图片预览支持缩放/平移
- **ENH-06**: `lg` 断点以下响应式回退到弹出式行为

## Out of Scope

| Feature | Reason |
|---------|--------|
| 文件编辑 | v1 只做只读预览，降低复杂度 |
| 多标签页切换 | 单文件预览更简单直观 |
| 着陆页/Agent 页改动 | 只改聊天页 |
| 后端 API 重构 | 复用现有接口 |
| 移动端适配 | 三栏布局面向桌面端 |
| 文件删除/重命名 | 超出预览范围 |
| 文件搜索/过滤 | v1 文件量有限，不需要 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | — | Pending |
| LAYOUT-02 | — | Pending |
| LAYOUT-03 | — | Pending |
| LAYOUT-04 | — | Pending |
| LAYOUT-05 | — | Pending |
| FILE-01 | — | Pending |
| FILE-02 | — | Pending |
| FILE-03 | — | Pending |
| FILE-04 | — | Pending |
| FILE-05 | — | Pending |
| FILE-06 | — | Pending |
| PREV-01 | — | Pending |
| PREV-02 | — | Pending |
| PREV-03 | — | Pending |
| PREV-04 | — | Pending |
| PREV-05 | — | Pending |
| PREV-06 | — | Pending |
| PREV-07 | — | Pending |
| PREV-08 | — | Pending |
| PREV-09 | — | Pending |
| STATE-01 | — | Pending |
| STATE-02 | — | Pending |
| STATE-03 | — | Pending |
| STATE-04 | — | Pending |
| STATE-05 | — | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25 (will be mapped during roadmap creation)

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after initial definition*
