# Technology Stack: 三栏工作区布局

**Project:** DeerFlow 三栏工作区 — 聊天页三栏重构
**Milestone:** 在已有 Next.js 16 + React 19 + Tailwind CSS 4 基础上叠加
**Researched:** 2026-03-05
**Research Mode:** Ecosystem (subsequent milestone — existing stack not re-researched)

---

## 决策摘要

本次里程碑**不引入新的 npm 依赖**。所有必要技术已在项目中安装：面板布局、代码展示、Markdown 渲染均已就绪。唯一需要处理的是：利用已有库、按正确 API 组合构建三栏布局，并用 React Context 协调面板状态。

---

## 核心技术栈

### 面板布局（Panel Layout）

| 技术 | 已安装版本 | 用途 | 理由 |
|------|-----------|------|------|
| `react-resizable-panels` | 4.6.2（锁文件确认） | 三栏可调整布局 | 已安装；shadcn/ui 官方底层库；v4 支持像素/百分比混合约束；键盘可访问；活跃维护（最新 4.7.0）|
| `src/components/ui/resizable.tsx` | — | shadcn 风格包装组件 | 已存在并已更新到 v4 API（使用 `ResizablePrimitive.Group` / `Separator`）；直接使用即可 |

**推荐：直接使用已有的 `ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle` 包装组件。**

不考虑的备选方案：

| 备选 | 排除原因 |
|------|---------|
| `allotment` | 未安装；基于 VS Code 分屏，风格偏重，缺少 shadcn 集成 |
| CSS Grid / Flexbox（静态） | 不支持用户拖拽调整，违背 IDE 工作区体验目标 |

**v4 API 关键点（重要）：**
- 导出名已改：`PanelGroup` → `Group`，`PanelResizeHandle` → `Separator`，`direction` → `orientation`
- 现有 `resizable.tsx` 包装已正确使用 v4 API（`ResizablePrimitive.Group`，`ResizablePrimitive.Separator`）
- **潜在陷阱：** 现有 `resizable.tsx` 中仍有 `data-[panel-group-direction=vertical]:flex-col` CSS 选择器（v2/v3 遗留）。v4 使用 `aria-[orientation=vertical]` 代替。垂直方向使用时需验证此选择器是否生效，水平布局（本项目）不受影响。

### 文件树组件（File Tree）

| 技术 | 版本 | 用途 | 理由 |
|------|-----|------|------|
| 自定义实现（无新依赖） | — | 左侧文件列表展示 | 项目已有 `ArtifactFileList` 组件（`artifact-file-list.tsx`），已实现文件列表展示、图标分类、点击选择逻辑；现有逻辑无需文件树层级（artifact 路径扁平），自定义即可 |
| `lucide-react` | 0.562.0（已安装） | 文件类型图标 | 已有 `getFileIcon()` 工具函数覆盖所有主要文件类型（代码、图片、视频、文本、Markdown）|

**不推荐引入 `react-complex-tree` 或类似库：** 本次 scope 为扁平文件列表，不需要多级目录树、拖拽重排、多选等功能。`ArtifactFileList` 已满足需求，重构为三栏形态即可。

### 文件预览组件（File Preview）

所有预览类型均**已有实现**，无需新增依赖：

| 文件类型 | 技术 | 状态 | 位置 |
|---------|------|------|------|
| 代码文件（JS/TS/Python 等） | CodeMirror 6 + `@uiw/react-codemirror` 4.25.4（只读） | 已安装 | `CodeEditor` 组件，支持只读模式 |
| Markdown | `streamdown` 1.4.0 + rehype/remark 插件（含 KaTeX、GFM） | 已安装 | `ArtifactFilePreview`（`language === "markdown"` 分支）中的 `<Streamdown>` |
| HTML | `<iframe>` + 后端 artifact URL | 已实现 | `ArtifactFilePreview`（`language === "html"` 分支）|
| 图片（.png/.jpg/.gif/.webp 等） | 原生 `<img>` | 需新增展示逻辑，但无需新库 | `getFileIcon()` 中已识别图片扩展名 |
| 视频（.mp4/.mov/.m4v 等） | 原生 HTML5 `<video>` | 需新增展示逻辑，但无需新库 | `getFileIcon()` 中已识别视频扩展名 |
| 纯文本（.txt/.csv/.log） | CodeMirror 6（`language: "text"`）或原生 `<pre>` | 已有 extensionMap 覆盖 | `checkCodeFile()` 返回 `language: "text"` |

**视频预览方案：使用原生 HTML5 `<video>` 标签，不引入 `react-player` 等重型库。**

理由：本次 scope 是"只读预览"，视频来源为后端 artifact URL（直接文件链接，非流媒体/YouTube），原生 `<video>` 完全够用。`react-player`（支持 YouTube/HLS/DASH）的额外能力在此场景无意义，且增加 bundle 体积。

### 状态管理（Panel State Coordination）

| 技术 | 版本 | 用途 | 理由 |
|------|-----|------|------|
| React Context（原生） | React 19（已安装） | 协调三栏面板状态（选中文件、面板可见性） | 已有 `ArtifactsContext`（`context.tsx`）管理 `selectedArtifact`、`open`、`artifacts` 列表；直接扩展而非引入新库 |
| `useState` / `useCallback` | React 19 | 面板内部交互状态 | 标准模式，无需外部库 |

**不引入 Zustand：**
- 更新频率低（用户点击文件才触发，不是高频状态）
- 现有 Context 模式已在项目中统一使用
- Zustand 适合高频更新或跨多个组件树的全局状态，三栏协调不符合这个门槛

**不引入 TanStack Query 新 store：** 文件内容获取已有 `useArtifactContent` hook（基于现有 artifact API），无需重新设计。

---

## 已有库使用方式汇总

```
三栏布局:
  ResizablePanelGroup (orientation="horizontal")
  ├── ResizablePanel (minSize="15%" defaultSize="20%")  — 左侧文件列表
  ├── ResizableHandle (withHandle)
  ├── ResizablePanel (defaultSize="40%")               — 中间聊天
  ├── ResizableHandle (withHandle)
  └── ResizablePanel (defaultSize="40%")               — 右侧预览

左侧面板:
  ArtifactFileList (重构自弹出式场景，直接嵌入左栏)
  lucide-react 图标（已有 getFileIcon）

右侧预览:
  isCodeFile    → <CodeEditor readonly />
  markdown      → <Streamdown {...streamdownPlugins} />
  html          → <iframe src={artifactUrl} />
  image/*       → <img src={artifactUrl} />
  video/*       → <video src={artifactUrl} controls />
  其他          → <iframe /> 或 <pre /> 降级处理

状态协调:
  扩展 ArtifactsContext:
    - selectedArtifact（已有）
    - open（已有，语义改为"右侧预览是否有内容"）
    - artifacts（已有）
```

---

## 不需要的内容（明确排除）

| 排除项 | 原因 |
|--------|------|
| 引入任何新 npm 包 | 所有能力已覆盖 |
| `react-complex-tree` | 扁平列表不需要树形结构 |
| `react-player` / `next-video` | 视频仅需只读预览，原生 `<video>` 足够 |
| `allotment` | 已有 `react-resizable-panels` |
| Zustand / Jotai | 状态复杂度不触发引入门槛 |
| shadcn Resizable 重新生成 | 已有 `src/components/ui/resizable.tsx` 且已是 v4 兼容 |

---

## 版本确认

| 库 | package.json 声明 | lockfile 实际版本 | 置信度 |
|----|------------------|-----------------|--------|
| `react-resizable-panels` | `^4.4.1` | `4.6.2` | HIGH（lockfile 直接读取） |
| `@uiw/react-codemirror` | `^4.25.4` | — | HIGH（package.json） |
| `streamdown` | `1.4.0` | — | HIGH（package.json 精确版本） |
| `shiki` | `3.15.0` | — | HIGH（package.json 精确版本） |
| `lucide-react` | `^0.562.0` | — | HIGH（package.json） |
| `react` | `^19.0.0` | `19.2.4`（lockfile） | HIGH |

---

## 关键风险

| 风险 | 严重程度 | 说明 |
|------|---------|------|
| `resizable.tsx` 中 `data-[panel-group-direction]` 选择器在 v4 可能失效 | 低（水平布局不受影响） | v4 将方向属性改为 aria，垂直分割场景需验证；本项目三栏为水平方向可绕过 |
| `ArtifactsContext` 中 `open` 语义需调整 | 中 | 现有 `open` 控制弹出式面板展开/收起；重构为三栏后语义变为"右侧预览是否显示内容"，需小心改造避免破坏现有逻辑 |
| 图片/视频文件无现有预览逻辑 | 低 | 当前 `ArtifactFileDetail` 对非代码/非 Markdown/非 HTML 文件降级为 `<iframe>`；图片/视频需新增分支，但逻辑简单 |

---

## 参考来源

- react-resizable-panels 官方 CHANGELOG（HIGH confidence）: https://github.com/bvaughn/react-resizable-panels/blob/main/CHANGELOG.md
- react-resizable-panels npm（确认 latest 4.7.0）: https://www.npmjs.com/package/react-resizable-panels
- shadcn/ui Resizable 文档（已更新至 v4）: https://ui.shadcn.com/docs/components/radix/resizable
- shadcn/ui v4 兼容 bug 讨论: https://github.com/shadcn-ui/ui/issues/9136
- Next.js 官方视频指南: https://nextjs.org/docs/app/guides/videos
- 项目 lockfile: `/home/user_demo/Husky/deer-flow-1/frontend/pnpm-lock.yaml`（直接读取，HIGH confidence）
- 项目 `package.json`: `/home/user_demo/Husky/deer-flow-1/frontend/package.json`（直接读取，HIGH confidence）
