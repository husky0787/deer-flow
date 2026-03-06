# DeerFlow 三栏工作区

## What This Is

DeerFlow 是一个基于 LangGraph 的 AI Agent 聊天应用。v1.0 已将聊天页面重构为固定三栏 IDE 风格工作区：左侧文件面板、中间聊天对话、右侧文件预览，用户可在同一视图中同时查看文件列表、对话和文件内容。

## Core Value

用户在一个视图中同时看到文件列表、聊天对话和文件内容，无需弹窗切换，提升工作效率。

## Requirements

### Validated

- ✓ 线程式聊天对话与流式消息 — existing
- ✓ Artifact 文件展示与下载 — existing
- ✓ 聊天中文件上传 — existing
- ✓ 多模型切换选择 — existing
- ✓ Markdown 渲染与代码高亮 — existing
- ✓ Agent 管理页面 — existing
- ✓ 着陆页 — existing
- ✓ 主题切换（暗/亮模式） — existing
- ✓ 国际化（中/英） — existing
- ✓ CodeMirror 代码编辑器 — existing
- ✓ 聊天页固定三栏布局（1:2:2 比例） — v1.0
- ✓ 左侧文件面板：显示用户上传和 AI 生成的文件列表 — v1.0
- ✓ 中间聊天面板：保留现有聊天功能 — v1.0
- ✓ 右侧文件预览面板：点击左侧文件后只读预览 — v1.0
- ✓ 预览支持代码文件（语法高亮） — v1.0
- ✓ 预览支持 Markdown（渲染后展示） — v1.0
- ✓ 预览支持图片（.png, .jpg 等） — v1.0
- ✓ 预览支持纯文本（.txt, .csv 等） — v1.0
- ✓ 预览支持视频文件 — v1.0
- ✓ 替换现有弹出式 Artifact 面板 — v1.0

### Active

(None — define via `/gsd:new-milestone`)

### Out of Scope

- 文件编辑功能 — v1 只做只读预览，未来可考虑
- 多标签页文件切换 — 单文件预览更简单直观
- 着陆页和 Agent 页面改动 — 只改聊天页
- 后端 API 重构 — 复用现有接口
- 移动端适配 — 三栏布局面向桌面端，PWA 可作为替代方案
- 文件删除/重命名 — 超出预览范围
- 文件搜索/过滤 — v1 文件量有限

## Context

Shipped v1.0 三栏工作区，855 行代码变更（12 文件）。
Tech stack: Next.js 16 + React 19 + TypeScript 5.8 + Tailwind CSS 4。
前端新增组件：WorkspaceContext、LeftPanel、RightPanel、FilePreview（含 PreviewHeader、PreviewSkeleton）。
后端修改：UploadsMiddleware 过滤 markitdown 转换产物。
已知 tech debt：下载按钮实现方式不一致、SUMMARY 文档与最终实现有偏差。

## Constraints

- **Tech stack**: 必须使用现有的 Next.js + React + Tailwind 技术栈
- **Compatibility**: 不破坏现有聊天功能和后端 API
- **Scope**: 只改造 `/workspace/chats/[thread_id]` 聊天页面

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 固定三栏而非弹出式 | 用户希望同时看到文件列表、聊天和预览 | ✓ Good |
| 1:2:2 宽度比例 | 文件列表较窄，聊天和预览等宽 | ✓ Good |
| 只读预览不可编辑 | 简化 v1 scope，降低复杂度 | ✓ Good |
| 单文件预览 | 比多标签页更简单直观 | ✓ Good |
| WorkspaceContext 替代 ArtifactsContext | 无弹出逻辑，面板状态管理更清晰 | ✓ Good |
| Shiki CodeBlock 做只读预览 | 用户锁定决策，不用 CodeMirror | ✓ Good |
| 不传 autoSaveId | 避免 SSR hydration 闪烁 | ✓ Good |
| key={filepath} 视频 remount | React unmount 等价释放资源，比手动 cleanup 更简洁 | ✓ Good |
| PDF 用 iframe 渲染 | 委托浏览器内置 PDF viewer，零依赖 | ✓ Good |
| 后端过滤 .md 转换产物 | 仅在 _list_newly_uploaded_files() 过滤，不影响 agent 访问 | ✓ Good |

---
*Last updated: 2026-03-06 after v1.0 milestone*
