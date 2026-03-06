# Milestones

## v1.0 三栏工作区 (Shipped: 2026-03-06)

**Delivered:** 聊天页面从单栏+弹出式 Artifact 布局重构为固定三栏 IDE 风格工作区，支持文件列表、聊天对话和文件预览同屏展示。

**Stats:**
- Phases: 2 (Phase 1-2)
- Plans: 6 total
- Tasks: 12 total
- Files modified: 12
- Lines changed: +855 / -84
- Timeline: 2 days (2026-03-05 → 2026-03-06)
- Git range: `e913451` → `540878b`

**Key accomplishments:**
1. 新建 WorkspaceContext 状态层，替代 ArtifactsContext 弹出逻辑
2. 聊天页重构为固定三栏 ResizablePanelGroup 布局（20/40/40）
3. LeftPanel 完整文件列表交互（选中高亮、scrollIntoView、空状态、下载按钮）
4. FilePreview 支持七种文件类型渲染（代码/Markdown/HTML/图片/视频/纯文本/PDF）
5. 大文件截断保护（>500KB）和视频资源正确释放
6. 后端过滤 markitdown 系统生成的 .md 转换文件

**Audit:** PASSED (25/25 requirements | 12/12 integration | 3/3 E2E flows)

**Tech Debt:**
- PREV-09 SUMMARY 文档未更新以反映最终 key={filepath} remount 方案
- 下载按钮实现方式不一致（LeftPanel 用 target="_blank"，PreviewHeader 用 download 属性）

**Archives:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`, `milestones/v1.0-MILESTONE-AUDIT.md`

---
