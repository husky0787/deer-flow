# Phase 1: 布局骨架 + 状态层 + 文件面板 - Research

**Researched:** 2026-03-05
**Domain:** Next.js / React 19 三栏可调整布局，React Context 状态管理，文件面板交互
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 沿用现有 Card 风格（ArtifactFileList 的 Card 组件样式）
- 每行显示文件类型图标 + 文件名 + 文件扩展名描述
- 保留下载按钮和 .skill 安装按钮
- 点击文件后该 Card 高亮选中
- Phase 1 只显示空状态占位（"选择文件预览"提示），点击文件后右侧面板仍显示空状态
- 面板始终渲染，不条件 null
- 文件列表按文件名字母序排列
- AI 生成文件和用户上传文件统一列表，不分组（v2 做分组）

### Claude's Discretion
- Card 高亮选中的具体样式（边框颜色、背景色等）
- 空状态的具体文案和图标选择
- WorkspaceContext 内部实现细节
- 文件路径统一转换的具体逻辑

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | 聊天页显示固定三栏布局：左文件面板、中聊天区、右预览区，默认比例 1:2:2 | ResizablePanelGroup 默认 defaultSize 20/40/40（和为100） |
| LAYOUT-02 | 三栏使用 ResizablePanelGroup（已有），用户可拖拽调整宽度 | 直接复用现有 ui/resizable.tsx；withHandle 显示拖拽手柄 |
| LAYOUT-03 | 每栏独立滚动，无页面级滚动条（flex 容器正确设置 min-h-0） | 每层 flex 子项必须加 min-h-0；ResizablePanel 内容需 overflow-y-auto |
| LAYOUT-04 | 右侧面板始终渲染（不条件 null），通过切换内容实现空状态/预览切换 | 不用条件渲染移除 Panel，用内容切换 |
| LAYOUT-05 | 不使用 autoSaveId，避免 SSR hydration 闪烁 | v4 已无 autoSaveId；不传 id 即可 |
| STATE-01 | 新建 WorkspaceContext 管理选中文件和统一文件列表 | 参考 ArtifactsContext 模式，在 layout.tsx 中注入 |
| STATE-02 | useWorkspaceFiles hook 合并 artifacts（SSE 流）和 uploaded_files（TanStack Query） | thread.values.artifacts + useUploadedFiles(threadId) |
| STATE-03 | 上传文件和 artifact 的路径格式在 hook 内统一转换 | uploaded_files 用 virtual_path；artifacts 已是绝对路径 |
| STATE-04 | 移除 ArtifactTrigger 弹出按钮，停用 ArtifactsContext 的 open/autoOpen 弹出逻辑 | 从 page.tsx header 删除 ArtifactTrigger；layout.tsx 替换 ArtifactsProvider |
| STATE-05 | 点击文件不触发导航侧边栏收起（修复 setSidebarOpen(false) 副作用） | WorkspaceContext.select 中不调用 setSidebarOpen |
| FILE-01 | 左侧面板显示 AI 生成文件（artifacts）和用户上传文件的统一列表 | useWorkspaceFiles hook 合并两个来源 |
| FILE-02 | 文件行显示文件类型图标 + 文件名 | 复用 getFileIcon / getFileName from core/utils/files.tsx |
| FILE-03 | 点击文件后该行高亮，右侧面板显示对应文件内容 | selectedFile 状态驱动 className 条件；Phase 1 右侧仍为空状态 |
| FILE-04 | AI 生成新文件时自动选中最新文件（autoSelect） | useEffect 监视 artifacts 变化；autoSelect 标志防止用户手动选中后覆盖 |
| FILE-05 | 无文件时显示"暂无文件"空状态 | 文件列表为空时渲染空状态组件 |
| FILE-06 | 文件列表独立滚动，新文件自动 scrollIntoView | 每个 Card 绑定 ref；autoSelect 时调用 ref.current?.scrollIntoView() |
</phase_requirements>

---

## Summary

Phase 1 是纯前端 UI 重构，不涉及后端。核心任务是：将现有单栏弹出式布局改造为持久三栏布局，建立 WorkspaceContext 取代弹出逻辑，并实现左侧文件面板完整交互。

技术上，项目已安装 `react-resizable-panels@4.6.2`（v4 版本），且 `ui/resizable.tsx` 已完成 v4 迁移（使用 `Group`、`Separator`）。但 `ChatBox` 中遗留有 v4 `groupRef`、`setLayout` 等 **命名布局（named layout，object 格式）**的 API 用法——这是旧的 ChatBox 动态展开/收起逻辑，Phase 1 的三栏布局不需要这种动态切换，可以直接用数组格式 `defaultSize` 替代。

状态层的核心挑战是：`ArtifactsContext.select()` 中有 `setSidebarOpen(false)` 副作用（导航侧边栏收起），新的 `WorkspaceContext` 必须显式不包含此副作用。文件列表合并需要同时消费 SSE 流中的 `thread.values.artifacts`（路径格式：绝对路径 `/mnt/...`）和 TanStack Query 的 `useUploadedFiles`（返回 `UploadedFileInfo.virtual_path`），两者格式不同，需在 hook 内统一。

**Primary recommendation:** 在 `app/workspace/chats/[thread_id]/layout.tsx` 替换 `ArtifactsProvider` 为 `WorkspaceProvider`，在 `page.tsx` 中将聊天内容包裹入 `ResizablePanelGroup` 三栏结构，并创建 `LeftPanel` 组件实现文件列表逻辑。

---

## Standard Stack

### Core（已在项目中）
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-resizable-panels | 4.6.2 | 三栏可调整宽度布局 | 已集成，有 shadcn 包装组件 |
| @tanstack/react-query | 5.90.17 | 上传文件列表（TanStack Query） | 项目标准服务端状态库 |
| React Context | 19.0.0 | WorkspaceContext 状态共享 | 项目已有 ArtifactsContext、ThreadContext 模式 |
| lucide-react | 0.562.0 | 文件类型图标 | 项目图标库 |
| tailwind-merge / clsx | 已有 | 条件样式 cn() | 项目 cn() 工具标准用法 |

### Supporting（已在项目中）
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | 已有 | 文件行 Card 风格 | 沿用 ArtifactFileList 的 Card 组件 |
| shadcn/ui Button | 已有 | 下载/安装按钮 | 文件行操作按钮 |
| sonner | 2.0.7 | 错误 toast | 安装 skill 失败时 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context (WorkspaceContext) | Zustand/Jotai | 项目已有 ArtifactsContext 模式，Context 足够，无需引入新状态库 |
| 手动 scrollIntoView | 第三方虚拟滚动 | 文件数量有限，原生 API 足够 |

**Installation:** 无需安装新依赖，全部复用现有库。

---

## Architecture Patterns

### Recommended Project Structure

新增文件位置：

```
frontend/src/
├── components/workspace/
│   ├── workspace-layout.tsx          # ThreeColumnLayout（ResizablePanelGroup 三栏）
│   ├── left-panel.tsx                # 文件面板（列表、高亮、空状态）
│   ├── right-panel.tsx               # 预览面板占位（Phase 1 空状态）
│   └── artifacts/                    # 保留现有，但 ArtifactTrigger 停用
├── core/workspace/                   # 新建目录
│   ├── context.tsx                   # WorkspaceContext + WorkspaceProvider
│   ├── hooks.ts                      # useWorkspaceFiles（合并两个来源）
│   └── index.ts                      # re-exports
└── app/workspace/chats/[thread_id]/
    ├── layout.tsx                    # 替换 ArtifactsProvider → WorkspaceProvider
    └── page.tsx                      # 嵌入 ThreeColumnLayout，移除 ArtifactTrigger
```

### Pattern 1: ThreeColumnLayout 骨架

**What:** 用 `ResizablePanelGroup` 实现 20/40/40 三栏水平布局，每栏独立滚动。

**When to use:** 聊天页唯一布局容器，不动态切换。

**关键点：**
- `defaultSize` 传数组 `[20, 40, 40]` 对应三个 Panel
- 不传 `id`（不需要持久化），满足 LAYOUT-05
- 每个 `ResizablePanel` 内容区域设置 `overflow-y-auto min-h-0`
- `ResizableHandle withHandle` 显示拖拽手柄

```typescript
// 来源：ui/resizable.tsx 包装，直接使用即可
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function ThreeColumnLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full w-full"
    >
      <ResizablePanel defaultSize={20} minSize={15}>
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          {/* LeftPanel */}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={20}>
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          {/* ChatArea（原有内容） */}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={15}>
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          {/* RightPanel 占位 */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### Pattern 2: WorkspaceContext 设计

**What:** 管理 `selectedFile`、`autoSelect` 标志，提供 `selectFile()`、`deselectFile()` 操作。

**When to use:** 在 `layout.tsx` 包裹整个聊天页，供 `LeftPanel` 和 `RightPanel` 订阅。

```typescript
// frontend/src/core/workspace/context.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface WorkspaceFile {
  path: string;       // 统一路径（绝对路径）
  source: "artifact" | "upload";
}

export interface WorkspaceContextType {
  files: WorkspaceFile[];
  setFiles: (files: WorkspaceFile[]) => void;
  selectedFile: string | null;
  autoSelect: boolean;
  selectFile: (path: string, autoSelect?: boolean) => void;
  deselectFile: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);

  const selectFile = (path: string, isAutoSelect = false) => {
    setSelectedFile(path);
    // 注意：不调用 setSidebarOpen(false) — 修复 STATE-05
    if (!isAutoSelect) {
      setAutoSelect(false);
    }
  };

  const deselectFile = () => {
    setSelectedFile(null);
    setAutoSelect(true);
  };

  return (
    <WorkspaceContext.Provider
      value={{ files, setFiles, selectedFile, autoSelect, selectFile, deselectFile }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
```

### Pattern 3: useWorkspaceFiles hook（合并两个来源）

**What:** 合并 `thread.values.artifacts`（SSE 实时）和 `useUploadedFiles(threadId)` （TanStack Query），统一为 `WorkspaceFile[]`。

**路径格式差异：**
- `artifacts`: 绝对路径，如 `/mnt/user-data/outputs/report.md`
- `uploaded_files.virtual_path`: 虚拟路径，如 `/mnt/user-data/uploads/file.pdf`
- 两者都可以直接作为 `urlOfArtifact({ filepath, threadId })` 的参数

```typescript
// frontend/src/core/workspace/hooks.ts
import { useMemo, useEffect } from "react";
import { useUploadedFiles } from "@/core/uploads";
import { useWorkspace } from "./context";

export function useWorkspaceFiles(
  threadId: string,
  artifacts: string[],
) {
  const { setFiles, selectedFile, autoSelect, selectFile } = useWorkspace();
  const { data: uploadsData } = useUploadedFiles(threadId);

  const mergedFiles = useMemo(() => {
    const artifactFiles = (artifacts ?? []).map((path) => ({
      path,
      source: "artifact" as const,
    }));
    const uploadFiles = (uploadsData?.files ?? []).map((f) => ({
      path: f.virtual_path,
      source: "upload" as const,
    }));
    // 合并去重（路径相同则取 artifact 优先）
    const seen = new Set<string>();
    return [...artifactFiles, ...uploadFiles].filter((f) => {
      if (seen.has(f.path)) return false;
      seen.add(f.path);
      return true;
    }).sort((a, b) => a.path.localeCompare(b.path)); // 字母序
  }, [artifacts, uploadsData?.files]);

  // 同步到 Context
  useEffect(() => {
    setFiles(mergedFiles);
  }, [mergedFiles, setFiles]);

  // autoSelect：新 artifact 加入时自动选最后一个 artifact
  useEffect(() => {
    if (!autoSelect || artifacts.length === 0) return;
    const latest = artifacts.at(-1);
    if (latest && latest !== selectedFile) {
      selectFile(latest, true); // autoSelect=true
    }
  }, [artifacts, autoSelect, selectedFile, selectFile]);

  return mergedFiles;
}
```

### Pattern 4: LeftPanel 文件列表 + scrollIntoView

**What:** 渲染文件 Card 列表，支持高亮、空状态、autoSelect 时 scrollIntoView。

```typescript
// frontend/src/components/workspace/left-panel.tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { getFileIcon, getFileName, getFileExtensionDisplayName } from "@/core/utils/files";
import { useWorkspace } from "@/core/workspace";

export function LeftPanel({ threadId }: { threadId: string }) {
  const { files, selectedFile, selectFile } = useWorkspace();
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // scrollIntoView 当 autoSelect 触发时
  useEffect(() => {
    if (selectedFile) {
      itemRefs.current.get(selectedFile)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedFile]);

  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        暂无文件
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2 p-2">
      {files.map((file) => (
        <Card
          key={file.path}
          ref={(el) => {
            if (el) itemRefs.current.set(file.path, el);
            else itemRefs.current.delete(file.path);
          }}
          className={cn(
            "relative cursor-pointer p-3 transition-colors",
            selectedFile === file.path
              ? "border-primary bg-primary/5"   // 高亮样式（Claude's Discretion）
              : "hover:bg-muted/50",
          )}
          onClick={() => selectFile(file.path)}
        >
          <CardHeader className="pr-2 pl-1">
            <CardTitle className="relative pl-8 text-sm">
              <div>{getFileName(file.path)}</div>
              <div className="absolute top-1 -left-0.5">
                {getFileIcon(file.path, "size-5")}
              </div>
            </CardTitle>
            <CardDescription className="pl-8 text-xs">
              {getFileExtensionDisplayName(file.path)} file
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </ul>
  );
}
```

### Anti-Patterns to Avoid

- **在 WorkspaceContext.select 中调用 setSidebarOpen(false)：** 这是现有 ArtifactsContext 的 bug，新 Context 不重复，满足 STATE-05。
- **ResizablePanel 条件渲染（null）：** 违反 LAYOUT-04，始终渲染但切换内容。
- **defaultLayout 使用对象格式 `{ chat: 100, artifacts: 0 }`：** 这是 ChatBox 旧逻辑的命名布局写法，三栏布局用 `defaultSize` 数字即可。
- **flex 容器缺少 min-h-0：** 导致全页滚动，违反 LAYOUT-03。每一层 flex 子项都需要 `min-h-0`。
- **autoSelect 覆盖用户手动选择：** 用 `autoSelect` boolean 标志，用户手动点击后设为 false，停止自动覆盖。
- **ArtifactsProvider 残留：** layout.tsx 替换后，page.tsx 中的 `useArtifacts()` 调用必须一并清理。

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 可调整宽度的面板 | 自定义 drag resize 逻辑 | ui/resizable.tsx (react-resizable-panels) | 处理鼠标/触摸/键盘；已有包装组件 |
| 文件图标映射 | 自建 extension→icon map | getFileIcon from core/utils/files.tsx | 已有 30+ 格式映射，完整 |
| 服务端文件列表获取 | fetch + useState + useEffect | useUploadedFiles (TanStack Query) | 缓存、重试、invalidation 已处理 |
| Toast 通知 | 自建 toast | sonner（项目已有） | 安装 skill 错误反馈 |
| 条件 CSS 类 | 字符串拼接 | cn() from @/lib/utils | tailwind-merge 处理冲突类 |

**Key insight:** 本 Phase 几乎不需要引入任何新技术，所有能力都通过复用已有代码实现。核心工作是重组（reorganize）而非重建（rebuild）。

---

## Common Pitfalls

### Pitfall 1: flex min-h-0 链断裂导致全页滚动

**What goes wrong:** 三栏布局中某一层 flex 子项未设置 `min-h-0`，浏览器以内容高度计算，导致出现页面级滚动条，违反 LAYOUT-03。

**Why it happens:** CSS flex 默认 `min-height: auto`，子项不约束自身高度时会撑开父容器。

**How to avoid:** 每层 flex 子项都加 `min-h-0`。链条：
```
WorkspaceContainer: flex h-screen w-full flex-col       ← 已有
  WorkspaceBody: flex min-h-0 w-full flex-1 flex-col    ← 已有
    ThreeColumnLayout: h-full w-full                     ← ResizablePanelGroup 自带 h-full
      ResizablePanel: 内容 div 需加 flex flex-col min-h-0 h-full
        面板内容区: overflow-y-auto                      ← 使内容可滚动
```

**Warning signs:** 出现页面右侧滚动条；body 元素高度超过 100vh。

### Pitfall 2: ArtifactsContext 残留引用

**What goes wrong:** 替换 `ArtifactsProvider` 后，`ChatBox`、`ArtifactTrigger`、`ArtifactFileList` 内仍有 `useArtifacts()` 调用，抛出 "must be used within ArtifactsProvider" 错误。

**Why it happens:** ChatBox 和 ArtifactFileDetail 深度使用 `useArtifacts`。

**How to avoid:**
- 删除 `ArtifactTrigger` 引用（page.tsx header）
- `ChatBox` 组件直接废弃（不再需要动态展开/收起逻辑）
- `ArtifactFileList` 重构为 `LeftPanel`（不依赖 useArtifacts）
- `ArtifactFileDetail` Phase 1 不渲染，Phase 2 重用时再处理

### Pitfall 3: autoSelect 与用户手动选择竞争

**What goes wrong:** AI 不断生成新文件，每次都自动覆盖用户手动选中的文件，用户体验差。

**Why it happens:** `useEffect` 监听 artifacts 变化，每次都触发 selectFile。

**How to avoid:** 用 `autoSelect` boolean 标志：
- 初始为 `true`（自动选最新）
- 用户手动点击 `selectFile(path)` 时设为 `false`
- `deselectFile()` 重置为 `true`
- autoSelect effect 中检查 `if (!autoSelect) return`

### Pitfall 4: 上传文件路径格式与 urlOfArtifact 不兼容

**What goes wrong:** `UploadedFileInfo.virtual_path` 与 `urlOfArtifact({ filepath })` 期望的格式不一致，导致下载链接失效。

**Why it happens:** `virtual_path` 格式为 `/mnt/user-data/uploads/filename.pdf`，而 `urlOfArtifact` 直接拼接 `filepath` 到 URL 中——但这个格式已经正确了（后端 artifact 路由接受 virtual path）。

**How to avoid:** 验证：`urlOfArtifact({ filepath: file.virtual_path, threadId })` 是否能正确访问上传文件。参考现有 `urlOfArtifact` 实现：`/api/threads/${threadId}/artifacts${filepath}`，其中 `filepath` 以 `/` 开头。确保 `virtual_path` 以 `/mnt/...` 开头，与 artifact 路径格式一致。

### Pitfall 5: ResizablePanelGroup orientation vs direction

**What goes wrong:** `ChatBox` 中用 `orientation="horizontal"`（v4 API），但旧文档或代码中用 `direction="horizontal"`（v3 API）。

**Why it happens:** v4 将 `direction` 改名为 `orientation`（对齐 ARIA 规范）。

**How to avoid:** 始终用 `orientation="horizontal"` 或 `orientation="vertical"`，项目现有 `ui/resizable.tsx` 已支持 v4。

### Pitfall 6: SSR 与 "use client" 边界

**What goes wrong:** `WorkspaceContext` 或 `WorkspaceProvider` 忘记加 `"use client"` 指令，在 Next.js 16 App Router 中导致服务端组件错误。

**Why it happens:** App Router 默认服务端组件，Context 需要在客户端运行。

**How to avoid:** `context.tsx`、`hooks.ts`（如果用 useState/useEffect）都加 `"use client"` 头。参考 `ArtifactsContext`、`ThreadContext` 的模式。

---

## Code Examples

### 三栏布局集成到 page.tsx

```typescript
// app/workspace/chats/[thread_id]/page.tsx（示意性重组）
// Source: 基于现有 page.tsx + resizable.tsx 模式
"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { LeftPanel } from "@/components/workspace/left-panel";
import { RightPanel } from "@/components/workspace/right-panel";
import { useWorkspaceFiles } from "@/core/workspace";

export default function ChatPage() {
  // ... 现有 hooks ...
  const threadId = /* ... */;
  const thread = /* useThreadStream ... */;

  useWorkspaceFiles(threadId, thread.values.artifacts ?? []);

  return (
    <ThreadContext.Provider value={{ thread, isMock }}>
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="flex h-full min-h-0 flex-col">
            <LeftPanel threadId={threadId} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="relative flex h-full min-h-0 flex-col">
            {/* 现有聊天内容（header + MessageList + InputBox） */}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={15}>
          <div className="flex h-full min-h-0 flex-col">
            <RightPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ThreadContext.Provider>
  );
}
```

### layout.tsx 替换 ArtifactsProvider

```typescript
// app/workspace/chats/[thread_id]/layout.tsx
"use client";

import { PromptInputProvider } from "@/components/ai-elements/prompt-input";
import { WorkspaceProvider } from "@/core/workspace";
import { SubtasksProvider } from "@/core/tasks/context";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubtasksProvider>
      <WorkspaceProvider>
        <PromptInputProvider>{children}</PromptInputProvider>
      </WorkspaceProvider>
    </SubtasksProvider>
  );
}
```

### Card 高亮样式（Claude's Discretion 参考实现）

```typescript
// 高亮状态：primary 色边框 + 淡背景
className={cn(
  "relative cursor-pointer p-3 transition-colors",
  selectedFile === file.path
    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
    : "hover:bg-muted/50",
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PanelGroup + direction + ref（v3） | Group + orientation + groupRef + useGroupRef（v4） | react-resizable-panels v4.0 | 项目 ui/resizable.tsx 已完成迁移，直接用包装组件即可 |
| autoSaveId（v3 持久化） | useDefaultLayout hook（v4） | react-resizable-panels v4.0 | Phase 1 不需要持久化，无影响 |
| ArtifactsContext（弹出式） | WorkspaceContext（内联三栏） | 本 Phase 实现 | 移除 setSidebarOpen 副作用 |

**Deprecated/outdated:**
- `ArtifactsProvider` / `useArtifacts`：Phase 1 后应只在需要保留旧弹出逻辑的地方保留（agents 页等），聊天页替换为 WorkspaceContext
- `ChatBox` 组件：动态展开/收起逻辑被三栏固定布局取代，Phase 1 后聊天页不再需要
- `ArtifactTrigger`：从 header 移除（STATE-04）

---

## Open Questions

1. **ChatBox 替换范围**
   - What we know: `ChatBox` 封装了 `ResizablePanelGroup`（两栏：聊天+弹出 artifacts）和 autoSelect 第一个 artifact 的逻辑
   - What's unclear: agents 页（`/workspace/agents/[agent_name]`）是否也使用 `ChatBox`？如果是，需要确认 Phase 1 只改聊天页，不影响 agents 页
   - Recommendation: 检查 `app/workspace/agents/` 页面是否 import `ChatBox`；如果是，Plan 中需明确只改 `app/workspace/chats/[thread_id]/page.tsx`，agents 页不动

2. **上传文件的 urlOfArtifact 兼容性**
   - What we know: `UploadedFileInfo.virtual_path` = `/mnt/user-data/uploads/xxx`；`urlOfArtifact` 拼接为 `/api/threads/{id}/artifacts/mnt/user-data/uploads/xxx`
   - What's unclear: 后端 artifacts 路由是否能正确处理 `/mnt/user-data/uploads/` 前缀的路径（artifacts 路由通常处理 outputs 目录）
   - Recommendation: 检查 `backend/src/gateway/routers/artifacts.py` 路径处理逻辑；或者用 `UploadedFileInfo.artifact_url` 字段（已是完整 URL）直接作为下载链接

3. **ArtifactFileDetail 在 Phase 1 的处理**
   - What we know: Phase 1 右侧面板只显示空状态占位，不渲染 ArtifactFileDetail
   - What's unclear: `ArtifactFileDetail` 依赖 `useArtifacts()`，如果 ArtifactsProvider 被移除，Phase 2 使用时需要重构
   - Recommendation: Plan 中记录：Phase 1 右侧面板仅渲染空状态；Phase 2 重构 ArtifactFileDetail 使其依赖 WorkspaceContext 而非 ArtifactsContext

---

## Validation Architecture

nyquist_validation 已启用（config.json 中 `workflow.nyquist_validation: true`）。

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 无前端测试框架（CLAUDE.md 明确："No test framework is configured"） |
| Config file | 不适用 |
| Quick run command | `pnpm check`（lint + typecheck，在 frontend/ 目录） |
| Full suite command | `pnpm check`（lint + typecheck） |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | 三栏布局以 1:2:2 比例渲染，不出现全页滚动条 | manual-only | — | — |
| LAYOUT-02 | 拖拽分隔线可调整宽度 | manual-only | — | — |
| LAYOUT-03 | 每栏独立滚动，无页面级滚动条 | manual-only | — | — |
| LAYOUT-04 | 右侧面板始终渲染（检查 DOM） | manual-only | — | — |
| LAYOUT-05 | 不传 autoSaveId（代码审查） | lint/typecheck | `pnpm check` | ❌ Wave 0 |
| STATE-01 | WorkspaceContext 导出正确类型 | typecheck | `pnpm check` | ❌ Wave 0 |
| STATE-02 | useWorkspaceFiles 合并两个来源 | typecheck | `pnpm check` | ❌ Wave 0 |
| STATE-03 | 路径格式统一（类型正确） | typecheck | `pnpm check` | ❌ Wave 0 |
| STATE-04 | ArtifactTrigger 移除（代码审查） | lint | `pnpm lint` | — |
| STATE-05 | selectFile 不调用 setSidebarOpen（代码审查） | lint/typecheck | `pnpm check` | ❌ Wave 0 |
| FILE-01 | files 合并结果包含两种来源 | typecheck | `pnpm check` | ❌ Wave 0 |
| FILE-02 | getFileIcon/getFileName 调用正确 | typecheck | `pnpm check` | — |
| FILE-03 | 高亮 className 条件正确 | typecheck | `pnpm check` | ❌ Wave 0 |
| FILE-04 | autoSelect useEffect 依赖正确 | typecheck | `pnpm check` | ❌ Wave 0 |
| FILE-05 | 空状态条件渲染 | typecheck | `pnpm check` | ❌ Wave 0 |
| FILE-06 | scrollIntoView 调用（类型安全） | typecheck | `pnpm check` | ❌ Wave 0 |

**manual-only 说明：** 布局类需求（LAYOUT-01/02/03/04）依赖浏览器渲染行为，无法通过单元测试验证；需人工在浏览器中检查。

### Sampling Rate

- **Per task commit:** `cd /home/user_demo/Husky/deer-flow-1/frontend && pnpm check`
- **Per wave merge:** `cd /home/user_demo/Husky/deer-flow-1/frontend && pnpm check`
- **Phase gate:** `pnpm check` 全绿 + 浏览器人工验证布局正确

### Wave 0 Gaps

前端无测试框架，Wave 0 需要创建的是**新业务文件**，而非测试文件：

- [ ] `frontend/src/core/workspace/context.tsx` — WorkspaceContext + WorkspaceProvider（covers STATE-01, STATE-05）
- [ ] `frontend/src/core/workspace/hooks.ts` — useWorkspaceFiles（covers STATE-02, STATE-03, FILE-01, FILE-04）
- [ ] `frontend/src/core/workspace/index.ts` — re-exports
- [ ] `frontend/src/components/workspace/left-panel.tsx` — LeftPanel（covers FILE-02, FILE-03, FILE-05, FILE-06）
- [ ] `frontend/src/components/workspace/right-panel.tsx` — RightPanel 占位（covers LAYOUT-04）

---

## Sources

### Primary (HIGH confidence)
- 直接读取代码文件：`ui/resizable.tsx`、`artifacts/context.tsx`、`artifacts/artifact-file-list.tsx`、`chats/chat-box.tsx`、`app/workspace/chats/[thread_id]/page.tsx`、`app/workspace/chats/[thread_id]/layout.tsx`
- 直接读取：`core/threads/types.ts`（AgentThreadState.artifacts 类型）、`core/uploads/api.ts`（UploadedFileInfo 类型）、`core/uploads/hooks.ts`（useUploadedFiles）
- 直接读取：`core/utils/files.tsx`（getFileIcon, getFileName, getFileExtensionDisplayName）
- pnpm-lock.yaml：确认 react-resizable-panels@4.6.2 已安装
- .planning/codebase/STACK.md、ARCHITECTURE.md、CONVENTIONS.md：项目技术栈和约定
- frontend/CLAUDE.md：明确"No test framework is configured"

### Secondary (MEDIUM confidence)
- WebSearch 结果（react-resizable-panels v4 API 变化）：确认 v4 使用 `Group`/`Separator`/`orientation`/`groupRef`；项目 `ui/resizable.tsx` 代码审计确认已迁移
- shadcn/ui GitHub Issue #9197：v4 兼容性变更（data-attr → aria-attr）；`ui/resizable.tsx` 使用 shadcn 包装，隔离了底层 API 差异

### Tertiary (LOW confidence)
- 无

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 全部从代码审计直接确认，无需假设
- Architecture: HIGH — 基于现有 ArtifactsContext 模式推导，有完整代码参考
- Pitfalls: HIGH（min-h-0、autoSelect、setSidebarOpen 副作用）/MEDIUM（上传文件路径兼容性，需验证）

**Research date:** 2026-03-05
**Valid until:** 2026-04-05（库版本稳定；30天内代码结构不太会大改）
