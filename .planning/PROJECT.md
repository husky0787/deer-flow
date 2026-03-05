# DeerFlow 三栏工作区

## What This Is

DeerFlow 是一个基于 LangGraph 的 AI Agent 聊天应用。本次改造将聊天页面从当前的单栏+弹出式 Artifact 布局，重构为固定三栏布局：左侧文件面板、中间聊天对话、右侧文件预览，打造类似 IDE 的工作体验。

## Core Value

用户在一个视图中同时看到文件列表、聊天对话和文件内容，无需弹窗切换，提升工作效率。

## Requirements

### Validated

<!-- 已有功能，从现有代码推断 -->

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

### Active

<!-- 本次要做的 -->

- [ ] 聊天页固定三栏布局（1:2:2 比例）
- [ ] 左侧文件面板：显示用户上传和 AI 生成的文件列表
- [ ] 中间聊天面板：保留现有聊天功能
- [ ] 右侧文件预览面板：点击左侧文件后只读预览
- [ ] 预览支持代码文件（语法高亮）
- [ ] 预览支持 Markdown（渲染后展示）
- [ ] 预览支持图片（.png, .jpg 等）
- [ ] 预览支持纯文本（.txt, .csv 等）
- [ ] 预览支持视频文件
- [ ] 替换现有弹出式 Artifact 面板

### Out of Scope

- 文件编辑功能 — 本次只做只读预览
- 多标签页文件切换 — 只支持单文件预览
- 着陆页和 Agent 页面改动 — 只改聊天页
- 后端 API 重构 — 尽量复用现有接口
- 移动端适配 — 三栏布局面向桌面端

## Context

- 前端基于 Next.js 16 + React 19 + TypeScript 5.8 + Tailwind CSS 4
- 现有 Artifact 组件在 `frontend/src/components/workspace/artifacts/`
- 聊天页入口 `frontend/src/app/workspace/chats/[thread_id]/page.tsx`
- 文件数据来源：ThreadState 中的 artifacts（AI 生成）和 uploaded_files（用户上传）
- 已有 CodeMirror 和 Shiki 用于代码展示
- 已有 rehype/remark 用于 Markdown 渲染

## Constraints

- **Tech stack**: 必须使用现有的 Next.js + React + Tailwind 技术栈
- **Compatibility**: 不破坏现有聊天功能和后端 API
- **Scope**: 只改造 `/workspace/chats/[thread_id]` 聊天页面

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 固定三栏而非弹出式 | 用户希望同时看到文件列表、聊天和预览 | — Pending |
| 1:2:2 宽度比例 | 文件列表较窄，聊天和预览等宽 | — Pending |
| 只读预览不可编辑 | 简化 v1 scope，降低复杂度 | — Pending |
| 单文件预览 | 比多标签页更简单直观 | — Pending |

---
*Last updated: 2026-03-05 after initialization*
