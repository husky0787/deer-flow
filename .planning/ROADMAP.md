# Roadmap: DeerFlow 三栏工作区

## Overview

本次改造将聊天页从单栏 + 弹出式 Artifact 布局，重构为固定三栏布局：左侧文件面板、中间聊天区、右侧文件预览。改造完成后，用户可在同一视图中同时看到文件列表、聊天对话和文件内容，无需弹窗切换。改造分两个阶段：Phase 1 搭建布局骨架、状态层和文件面板，Phase 2 实现预览面板的全文件类型支持并完成收尾清理。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 布局骨架 + 状态层 + 文件面板** - 搭建三栏容器，建立 WorkspaceContext 状态层，实现左侧文件面板的完整交互
- [ ] **Phase 2: 预览面板 + 收尾清理** - 实现右侧所有文件类型的只读预览，清理旧弹出式 Artifact 残留，验证边缘情况

## Phase Details

### Phase 1: 布局骨架 + 状态层 + 文件面板
**Goal**: 用户打开聊天页后看到三栏固定布局，左侧显示文件列表，点击文件后高亮选中行，页面整体不出现页面级滚动条
**Depends on**: Nothing (first phase)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, STATE-01, STATE-02, STATE-03, STATE-04, STATE-05, FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06
**research_needed**: false
**Success Criteria** (what must be TRUE):
  1. 聊天页以 1:2:2 比例显示三栏，左侧文件面板、中间聊天区、右侧预览区同时可见，不出现全页滚动条
  2. 用户拖拽面板分隔线可调整各栏宽度，页面不因此跳变或闪烁
  3. 左侧面板显示 AI 生成文件（artifacts）和用户上传文件的统一列表，每行有文件类型图标和文件名
  4. 点击文件后该行高亮，AI 生成新文件时自动选中最新文件并 scrollIntoView
  5. 无文件时左侧面板显示"暂无文件"空状态，点击文件不触发导航侧边栏收起
**Plans**: TBD

Plans:
- [ ] 01-01: 创建 ThreeColumnLayout 骨架（ResizablePanelGroup 20/40/40，不传 autoSaveId，验证 min-h-0）
- [ ] 01-02: 创建 WorkspaceContext + useWorkspaceFiles hook（合并 artifacts 和 uploaded_files，统一路径格式）
- [ ] 01-03: 实现 LeftPanel 文件列表（高亮、autoSelect、scrollIntoView、空状态），移除 ArtifactTrigger

### Phase 2: 预览面板 + 收尾清理
**Goal**: 用户点击任意类型文件后右侧面板正确渲染文件内容，包含加载骨架屏、大文件截断提示、视频资源正确释放，旧弹出式面板逻辑完全清除
**Depends on**: Phase 1
**Requirements**: PREV-01, PREV-02, PREV-03, PREV-04, PREV-05, PREV-06, PREV-07, PREV-08, PREV-09
**research_needed**: false
**Success Criteria** (what must be TRUE):
  1. 未选中文件时右侧显示"选择文件预览"空状态；文件加载中显示骨架屏；加载完成后正确渲染内容
  2. 代码文件以语法高亮只读模式展示，Markdown 文件渲染后展示，纯文本文件以等宽字体展示
  3. 图片文件以 object-contain 自适应面板展示，视频文件显示带 controls 的播放器，切换视频后上一个视频资源正确释放
  4. 超过 500KB 的文本文件显示截断提示而非加载全部内容
  5. 整个改造不破坏现有聊天功能（消息流式输出、文件上传、模型切换均正常）
**Plans**: TBD

Plans:
- [ ] 02-01: 实现 RightPanel 预览组件（代码 / Markdown / 纯文本 / 图片 / 视频分支，骨架屏，空状态）
- [ ] 02-02: 大文件截断、视频资源 cleanup、旧 ArtifactsContext open 逻辑清理与回归测试

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 布局骨架 + 状态层 + 文件面板 | 0/3 | Not started | - |
| 2. 预览面板 + 收尾清理 | 0/2 | Not started | - |
