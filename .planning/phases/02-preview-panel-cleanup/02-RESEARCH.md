# Phase 2: 预览面板 + 收尾清理 - Research

**Researched:** 2026-03-05
**Domain:** React 文件预览面板（代码高亮、Markdown 渲染、媒体展示、大文件截断、资源释放）
**Confidence:** HIGH

## Summary

Phase 2 在 Phase 1 已完成的三栏布局基础上，将右侧空状态占位 `RightPanel` 扩展为完整的文件预览面板。核心工作是：根据文件类型分支渲染（代码/Markdown/HTML/纯文本/图片/视频），添加骨架屏加载态，实现大文件截断提示，确保视频资源正确释放，并清理旧的 ArtifactsContext `open`/`autoOpen` 弹出逻辑。

项目已具备所有必需的库和组件基础：Shiki（`code-block.tsx`）用于代码高亮、Streamdown 用于 Markdown 渲染、`useArtifactContent` hook 用于文件内容加载（TanStack Query 5 分钟缓存）、Skeleton 骨架屏组件、Artifact 布局容器组件。现有 `ArtifactFileDetail` 组件已有完整的多类型预览分支逻辑，是直接参考模板，但需要适配到面板式布局（无弹出、无关闭按钮、头部操作栏精简）。

**Primary recommendation:** 复用现有 CodeBlock + Streamdown + useArtifactContent 实现预览，在 `files.tsx` 新增 `checkImageFile` / `checkVideoFile` 分类函数，RightPanel 内部按文件类型条件渲染，不引入任何新依赖。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 代码渲染器使用 Shiki（现有 CodeBlock 组件）而非 CodeMirror，Phase 2 只做只读预览
- 复用现有 CodeBlock 的亮色/暗色双主题切换
- 预览面板头部显示文件名 + 文件类型图标 + 操作栏（下载、复制内容、.skill 安装）
- 复用现有 getFileName / getFileIcon 工具函数
- 大文件截断：超过 500KB 的文本文件加载并显示前 N 字符内容，底部显示截断提示
- Markdown 文件提供 code/preview 切换（Shiki 高亮 + Streamdown 渲染），默认 preview
- HTML 文件提供 code/preview 切换（Shiki 高亮 + iframe 预览），默认 preview
- 其他代码文件只有 code 视图，不需要切换

### Claude's Discretion
- 骨架屏的具体设计和动画
- 截断字符数的具体阈值（在 500KB 范围内合理选择）
- 空状态的具体文案和图标样式
- 视频资源释放的具体实现方式
- code/preview 切换按钮的具体 UI 样式

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREV-01 | 代码文件以语法高亮只读模式展示 | 使用现有 CodeBlock (Shiki) 组件，传入 code + language，复用 checkCodeFile 检测语言 |
| PREV-02 | Markdown 文件渲染后展示 | 使用 Streamdown + streamdownPlugins，参考 ArtifactFilePreview 的 markdown 分支 |
| PREV-03 | 图片文件以 object-contain 适配面板 | 新增 checkImageFile 函数，使用 `<img>` + urlOfArtifact 构建 src |
| PREV-04 | 视频文件以 video 展示 + controls | 新增 checkVideoFile 函数，使用 `<video>` + urlOfArtifact |
| PREV-05 | 纯文本文件以等宽字体展示 | 未匹配代码/图片/视频的文本内容用 `<pre className="font-mono">` 展示 |
| PREV-06 | 未选中文件时显示空状态 | RightPanel 已有空状态占位，保留并优化样式 |
| PREV-07 | 文件加载中显示骨架屏 | useArtifactContent 的 isLoading 状态驱动 Skeleton 组件 |
| PREV-08 | 大文件 >500KB 截断提示 | 在内容加载后检测 content.length，截断显示 + 底部提示 |
| PREV-09 | 视频组件卸载时释放资源 | useEffect cleanup 中 pause + removeAttribute("src") + load() |
</phase_requirements>

## Standard Stack

### Core (全部已安装，无需新增依赖)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | 3.15.0 | 代码语法高亮 | 已在 code-block.tsx 使用，轻量只读高亮 |
| streamdown | 1.4.0 | Markdown 渲染 | 项目标准 Markdown 渲染方案，多处使用 |
| @tanstack/react-query | ^5.90.17 | 数据加载/缓存 | useArtifactContent 已使用，5 分钟缓存 |
| lucide-react | ^0.562.0 | 图标 | 项目标准图标库 |
| react-resizable-panels | ^4.4.1 | 面板布局 | Phase 1 已集成 |

### Supporting (现有组件复用)

| Component | Path | Purpose | When to Use |
|-----------|------|---------|-------------|
| CodeBlock | `ai-elements/code-block.tsx` | Shiki 高亮渲染 | 代码文件预览 |
| Streamdown | `streamdown` (npm) | Markdown 渲染 | Markdown 预览模式 |
| Skeleton | `ui/skeleton.tsx` | 骨架屏 | 内容加载中 |
| Artifact* | `ai-elements/artifact.tsx` | 面板布局容器 | Header/Title/Actions/Content |
| ArtifactAction | `ai-elements/artifact.tsx` | 操作按钮 with tooltip | 下载/复制/安装 |
| ToggleGroup | `ui/toggle-group.tsx` | code/preview 切换 | Markdown/HTML 视图切换 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shiki (CodeBlock) | CodeMirror (CodeEditor) | 用户已锁定用 Shiki -- CodeMirror 更重，有编辑能力但此阶段不需要 |
| 原生 `<video>` | react-player / video.js | 过度工程，原生 video 完全满足需求 |
| 手动截断 | 虚拟滚动 (react-window) | 500KB 截断更简单直接，虚拟滚动复杂且此阶段无需 |

**Installation:** 无需安装任何新依赖。

## Architecture Patterns

### 推荐 RightPanel 组件结构

```
components/workspace/
├── right-panel.tsx              # 主入口：空状态 / 骨架屏 / 内容分发
├── preview/
│   ├── preview-header.tsx       # 文件名 + 图标 + 操作栏 (download/copy/install)
│   ├── code-preview.tsx         # Shiki 代码高亮预览
│   ├── markdown-preview.tsx     # Streamdown 渲染 + code/preview 切换
│   ├── html-preview.tsx         # iframe 预览 + code/preview 切换
│   ├── image-preview.tsx        # <img> object-contain
│   ├── video-preview.tsx        # <video> + 资源释放
│   ├── text-preview.tsx         # 等宽字体纯文本
│   └── truncation-notice.tsx    # 大文件截断提示条
```

### Pattern 1: 文件类型分支渲染

**What:** RightPanel 根据 selectedFile 路径判断文件类型，分发到对应预览子组件
**When to use:** RightPanel 主入口的内容区域
**Example:**
```typescript
// 基于 core/utils/files.tsx 的 checkCodeFile + 新增的 checkImageFile / checkVideoFile
function FilePreviewContent({ filepath, threadId }: Props) {
  const { isCodeFile, language } = checkCodeFile(filepath);

  if (checkImageFile(filepath)) {
    return <ImagePreview filepath={filepath} threadId={threadId} />;
  }
  if (checkVideoFile(filepath)) {
    return <VideoPreview filepath={filepath} threadId={threadId} />;
  }
  if (isCodeFile && (language === "markdown" || language === "html")) {
    // 支持 code/preview 切换
    return <MarkdownOrHtmlPreview ... />;
  }
  if (isCodeFile) {
    return <CodePreview code={content} language={language} />;
  }
  // 兜底：纯文本
  return <TextPreview content={content} />;
}
```

### Pattern 2: 大文件截断

**What:** 加载完文件内容后检测长度，超过阈值截断显示并添加提示
**When to use:** 所有文本类内容（代码/Markdown/纯文本）
**Example:**
```typescript
const MAX_TEXT_SIZE = 500 * 1024; // 500KB
const TRUNCATE_CHARS = 100_000;   // ~100K 字符，约 100-200KB UTF-8

function useTruncatedContent(content: string | undefined) {
  return useMemo(() => {
    if (!content) return { text: "", isTruncated: false };
    if (content.length > TRUNCATE_CHARS) {
      return { text: content.slice(0, TRUNCATE_CHARS), isTruncated: true };
    }
    return { text: content, isTruncated: false };
  }, [content]);
}
```

### Pattern 3: 视频资源释放

**What:** 视频组件卸载或 src 切换时释放媒体资源
**When to use:** VideoPreview 组件
**Example:**
```typescript
function VideoPreview({ filepath, threadId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = urlOfArtifact({ filepath, threadId });

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load(); // 释放网络资源和内存缓冲
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted
      playsInline
      className="max-h-full max-w-full object-contain"
    />
  );
}
```

### Pattern 4: 骨架屏加载态

**What:** useArtifactContent isLoading 时显示骨架屏
**When to use:** RightPanel 内容区
**Example:**
```typescript
function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **在 RightPanel 条件渲染 null:** LAYOUT-04 要求右侧面板始终渲染，不能 `if (!selectedFile) return null`，应该渲染空状态
- **为每种文件类型单独调用 fetch:** 统一使用 `useArtifactContent` hook，它已封装 TanStack Query 缓存
- **在 CodeBlock 中使用 CodeMirror:** 用户已锁定使用 Shiki，不要引入 CodeEditor 组件
- **直接修改 ArtifactsContext 状态:** Phase 2 使用 WorkspaceContext，不应新增对 ArtifactsContext 的依赖
- **视频 autoplay:** 不要自动播放，只提供 controls 让用户主动播放

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 代码语法高亮 | 手写正则高亮 | CodeBlock (Shiki) | 150+ 语言支持，主题切换，边缘情况多 |
| Markdown 渲染 | 手写 markdown-to-html | Streamdown + plugins | GFM/KaTeX/raw HTML 已配置好 |
| 文件内容加载 | 手写 fetch + state | useArtifactContent | TanStack Query 缓存 + .skill 特殊处理 |
| 文件类型检测 | 手写 MIME type 解析 | checkCodeFile + 新增 helpers | 扩展名映射已覆盖 100+ 类型 |
| 文件 URL 构建 | 手写 URL 拼接 | urlOfArtifact | 处理 mock 模式、下载参数等 |
| 面板布局容器 | 手写 header/content 布局 | Artifact* 组件 | 一致的头部/内容/操作栏布局 |

**Key insight:** 项目已有完整的文件预览基础设施（ArtifactFileDetail），Phase 2 的核心工作是将其适配到面板布局中，而非从零开始构建。

## Common Pitfalls

### Pitfall 1: CodeBlock 的 mounted ref 导致内容不更新

**What goes wrong:** CodeBlock 内部使用 `mounted.current` 标记防止重复设置 HTML，但如果 code 或 language 变化时 mounted 没有重置，新内容不会渲染
**Why it happens:** CodeBlock 的 useEffect 在 `[code, language, showLineNumbers]` 变化时重新运行，但 cleanup 函数设置 `mounted.current = false` 是异步的
**How to avoid:** 查看当前 code-block.tsx 实现 -- cleanup 确实会重置 `mounted.current = false`，所以切换文件时会正确重新高亮。但如果直接传入相同 code + 不同组件实例，注意 key prop 确保重新挂载
**Warning signs:** 切换文件后代码内容没变化

### Pitfall 2: useArtifactContent 的 enabled 参数未正确设置

**What goes wrong:** 对于图片/视频文件，不需要用 useArtifactContent 加载文本内容（它们通过 URL 直接展示），但 hook 仍然被调用导致无意义的 fetch
**Why it happens:** 图片/视频文件应该通过 `urlOfArtifact` 直接构建 `<img src>` / `<video src>`，而非通过 hook 加载文本内容
**How to avoid:** 对图片/视频设置 `enabled: false`，只对文本类文件（代码、Markdown、纯文本）启用内容加载
**Warning signs:** 图片文件加载时出现 404 或返回二进制乱码

### Pitfall 3: 视频资源泄漏

**What goes wrong:** 切换文件或离开页面时，video 元素仍在缓冲/播放，占用内存和网络
**Why it happens:** React 卸载组件时只移除 DOM，不会自动释放 video 的媒体资源
**How to avoid:** useEffect cleanup 中执行 `video.pause()` + `video.removeAttribute("src")` + `video.load()`
**Warning signs:** 切换多个视频后内存持续增长，Network 面板显示悬挂的视频请求

### Pitfall 4: Streamdown 在非流式场景下的使用

**What goes wrong:** Streamdown 设计为流式渲染（名字就叫 stream-down），在静态内容场景下可能有不必要的开销
**Why it happens:** 项目已广泛使用 Streamdown 渲染静态 Markdown，实际上它处理静态内容也没问题
**How to avoid:** 直接用 `<Streamdown>{content}</Streamdown>`，和 ArtifactFilePreview 中一样的用法即可
**Warning signs:** 无，这是非问题但值得了解

### Pitfall 5: 大文件截断阈值的字节 vs 字符混淆

**What goes wrong:** `content.length` 返回 JavaScript 字符数而非字节数，UTF-8 多字节字符会导致实际字节数与字符数不一致
**Why it happens:** `loadArtifactContent` 返回 `response.text()`，是 JavaScript string，`.length` 是字符数
**How to avoid:** 使用字符数阈值（如 100K 字符约等于 200KB+），或使用 `new Blob([content]).size` 精确检测字节数。推荐简单方案：直接用字符数阈值，文档注释说明是"约 500KB"
**Warning signs:** 中文文件内容在远小于预期大小时被截断

### Pitfall 6: write-file: 协议的 filepath 处理

**What goes wrong:** 某些文件路径以 `write-file:` 前缀开头（实时写入的文件），需要特殊解析提取实际路径
**Why it happens:** ArtifactFileDetail 中已有 `isWriteFile` 判断和路径解析逻辑
**How to avoid:** 在 RightPanel 中也需要处理 write-file 协议。但注意：WorkspaceContext 的 selectedFile 是由 LeftPanel 的 selectFile 设置的，LeftPanel 使用的是 `file.path`（已统一格式），不包含 write-file 前缀。需要确认 selectedFile 的值格式
**Warning signs:** 选中文件后预览内容为空

## Code Examples

### Example 1: RightPanel 主入口（推荐结构）

```typescript
// Source: 基于现有 right-panel.tsx + ArtifactFileDetail 逻辑
"use client";

import { FileTextIcon } from "lucide-react";
import { useWorkspace } from "@/core/workspace";
import { useThread } from "@/components/workspace/messages/context";
import { useArtifactContent } from "@/core/artifacts/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { PreviewHeader } from "./preview/preview-header";
import { FilePreviewContent } from "./preview/file-preview-content";

export function RightPanel() {
  const { selectedFile } = useWorkspace();
  const { thread: { threadId } } = useThread(); // 需要确认如何获取 threadId

  if (!selectedFile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <FileTextIcon className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">选择文件预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PreviewHeader filepath={selectedFile} threadId={threadId} />
      <div className="min-h-0 flex-1 overflow-auto">
        <FilePreviewContent filepath={selectedFile} threadId={threadId} />
      </div>
    </div>
  );
}
```

### Example 2: 文件类型分类函数

```typescript
// Source: 扩展 core/utils/files.tsx
const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "bmp", "tiff",
  "ico", "webp", "svg", "heic",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm"]);

export function checkImageFile(filepath: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(filepath));
}

export function checkVideoFile(filepath: string): boolean {
  return VIDEO_EXTENSIONS.has(getFileExtension(filepath));
}
```

### Example 3: PreviewHeader 操作栏

```typescript
// Source: 参考 ArtifactFileDetail header + LeftPanel 按钮逻辑
import {
  ArtifactHeader, ArtifactTitle, ArtifactActions, ArtifactAction,
} from "@/components/ai-elements/artifact";
import { CopyIcon, DownloadIcon, PackageIcon } from "lucide-react";
import { getFileName, getFileIcon } from "@/core/utils/files";
import { urlOfArtifact } from "@/core/artifacts/utils";

function PreviewHeader({ filepath, threadId }: { filepath: string; threadId: string }) {
  return (
    <ArtifactHeader>
      <div className="flex items-center gap-2">
        {getFileIcon(filepath, "size-4")}
        <ArtifactTitle>{getFileName(filepath)}</ArtifactTitle>
      </div>
      <ArtifactActions>
        {/* 复制、下载、.skill 安装 */}
      </ArtifactActions>
    </ArtifactHeader>
  );
}
```

### Example 4: code/preview 切换 (Markdown/HTML)

```typescript
// Source: 参考 ArtifactFileDetail 中 ToggleGroup 用法
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Code2Icon, EyeIcon } from "lucide-react";

const [viewMode, setViewMode] = useState<"code" | "preview">("preview");

<ToggleGroup
  type="single"
  variant="outline"
  size="sm"
  value={viewMode}
  onValueChange={(value) => { if (value) setViewMode(value as "code" | "preview"); }}
>
  <ToggleGroupItem value="code"><Code2Icon className="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="preview"><EyeIcon className="size-4" /></ToggleGroupItem>
</ToggleGroup>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ArtifactsContext `open`/`setOpen` 弹出式面板 | WorkspaceContext + 三栏固定布局 | Phase 1 | RightPanel 始终渲染，无需弹出逻辑 |
| ChatBox 内 ResizablePanel 60/40 分割 artifacts | 三栏 20/40/40 布局 | Phase 1 | 预览面板独立于聊天区 |
| CodeEditor (CodeMirror) 用于只读预览 | CodeBlock (Shiki) | Phase 2 决定 | 更轻量，无编辑功能开销 |

**旧代码清理目标:**
- `ArtifactsContext` 的 `open`/`autoOpen`/`setOpen` 逻辑：Phase 1 STATE.md 记录"保留 ArtifactsProvider 在 layout.tsx 中用于向后兼容"，Phase 2 需评估是否可以完全移除
- `ArtifactTrigger`：弹出按钮，三栏布局下不再需要
- `ChatBox` 中的 artifacts ResizablePanel：已被外层三栏替代
- `message-group.tsx` 中的 `setOpen(true)` / `autoOpen` 逻辑：write-file 工具调用自动打开面板的行为需要改为自动选中文件到 WorkspaceContext

**清理风险评估:**
- `ArtifactsProvider` 被 3 个 layout.tsx 引用（chats、agents/chats、agents/new）
- `useArtifacts()` 被 5 个组件引用（artifact-file-detail、artifact-file-list、artifact-trigger、message-group、chat-box）
- 清理需要逐个评估每个引用点，确保不破坏非三栏布局的页面（agents/new）

## Open Questions

1. **threadId 如何在 RightPanel 中获取**
   - What we know: RightPanel 当前不接收 props。ChatPage 中有 threadId，通过 ThreadContext 传递
   - What's unclear: RightPanel 是否能从 ThreadContext 或其他 context 获取 threadId，还是需要通过 props 传入
   - Recommendation: 查看 useThread hook -- `useThread()` 返回 `{ thread, isMock }`，thread 对象含 threadId。或者直接将 threadId 作为 props 传入 RightPanel（更显式）

2. **agents/new 和 agents/[agent_name] 页面是否受影响**
   - What we know: 这些页面也使用 ArtifactsProvider，但不使用三栏布局
   - What's unclear: 清理 ArtifactsContext 弹出逻辑是否会破坏这些页面
   - Recommendation: Phase 2 只清理 chats/ 路径下的 ArtifactsContext 依赖，保留 agents/ 路径下的现有行为不变

3. **write-file: 协议文件的预览**
   - What we know: message-group.tsx 中 write_file 工具调用会生成 `write-file:path?message_id=X&tool_call_id=Y` 格式的路径并调用 `select(url, true)` + `setOpen(true)`
   - What's unclear: WorkspaceContext 的 selectedFile 中是否会出现 write-file 协议路径
   - Recommendation: WorkspaceContext 的 files 来自 `useWorkspaceFiles`，使用的是 `thread.values.artifacts`（纯路径）和 `uploadedFiles`（virtual_path），不含 write-file 前缀。但 message-group 中的逻辑需要迁移为调用 WorkspaceContext 的 selectFile

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 无（项目 CLAUDE.md 明确记录 "No test framework is configured"） |
| Config file | none -- see Wave 0 |
| Quick run command | `pnpm check`（lint + typecheck） |
| Full suite command | `pnpm check` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREV-01 | 代码文件语法高亮只读展示 | manual | 浏览器手动验证 | N/A |
| PREV-02 | Markdown 文件渲染展示 | manual | 浏览器手动验证 | N/A |
| PREV-03 | 图片 object-contain 展示 | manual | 浏览器手动验证 | N/A |
| PREV-04 | 视频 controls 播放器 | manual | 浏览器手动验证 | N/A |
| PREV-05 | 纯文本等宽字体展示 | manual | 浏览器手动验证 | N/A |
| PREV-06 | 空状态显示 | manual | 浏览器手动验证 | N/A |
| PREV-07 | 骨架屏加载态 | manual | 浏览器手动验证 | N/A |
| PREV-08 | 大文件截断提示 | manual + typecheck | `pnpm typecheck` 验证类型正确 | N/A |
| PREV-09 | 视频资源释放 | manual | Chrome DevTools Memory 面板验证 | N/A |

### Sampling Rate
- **Per task commit:** `pnpm check`（确保 lint + typecheck 通过）
- **Per wave merge:** `pnpm check` + 浏览器手动回归
- **Phase gate:** `pnpm check` green + 浏览器全场景验证

### Wave 0 Gaps
None -- 项目未配置测试框架，所有验证通过 `pnpm check`（lint + typecheck）和浏览器手动测试完成。这与项目现状一致，不需要在 Phase 2 引入测试框架。

## Sources

### Primary (HIGH confidence)
- 项目源码直接阅读 -- `code-block.tsx`、`artifact-file-detail.tsx`、`workspace/context.tsx`、`files.tsx`、`loader.ts`、`hooks.ts`、`utils.ts`
- `package.json` -- shiki 3.15.0、streamdown 1.4.0、@tanstack/react-query ^5.90.17
- `frontend/CLAUDE.md` -- Next.js 16、React 19、TypeScript 5.8、Tailwind CSS 4、pnpm 10.26.2

### Secondary (MEDIUM confidence)
- MDN Web Docs: HTMLVideoElement 资源释放最佳实践（pause + removeAttribute + load）
- Shiki 官方文档: codeToHtml API 用法（与项目代码一致）

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- 全部库已在项目中使用，版本号从 package.json 获取
- Architecture: HIGH -- 基于现有 ArtifactFileDetail 组件的直接适配，模式清晰
- Pitfalls: HIGH -- 基于对现有代码的详细阅读，所有 pitfall 都有代码证据支撑

**Research date:** 2026-03-05
**Valid until:** 2026-04-05（项目依赖稳定，30 天有效）
