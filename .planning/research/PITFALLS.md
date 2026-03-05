# 三栏工作区布局 — 领域陷阱

**Domain:** Three-panel workspace layout (AI chat application)
**Project:** DeerFlow 三栏工作区
**Researched:** 2026-03-05
**Confidence:** HIGH — grounded in existing codebase + verified external sources

---

## 关键说明

本文档针对将 DeerFlow 聊天页从当前的两栏弹出式 Artifact 布局迁移至固定三栏布局的具体场景。每个陷阱包含：问题描述、根本原因、后果、预防措施和检测信号。

---

## Critical Pitfalls（致命陷阱）

会导致重写或严重功能损坏的问题。

---

### Pitfall 1: flex 子项 `min-height: auto` 导致面板无法收缩滚动

**优先级:** CRITICAL

**What goes wrong:**
在 Tailwind CSS 4 + flex 布局中，flex 子项的默认 `min-height` 是 `auto`（而不是 `0`）。当三栏布局是 flex column 容器的子项，而内部聊天面板又包含长消息列表时，整个页面会被内容撑高，出现页面级滚动条而不是面板内滚动。

**Why it happens:**
CSS 规范规定 flex 子项的 `min-height` 默认为 `auto`（内容高度），而不是 `0`。这导致 flex 子项无法收缩到小于其内容的尺寸，破坏 `h-screen` → 固定高度 → 内部滚动的整个链路。

**Consequences:**
- 聊天面板不能独立滚动；整个页面向下滚动
- 输入框 `absolute bottom-0` 定位失效
- 右侧预览面板超出视口

**Prevention:**
```tsx
// 三栏容器每层都必须加 min-h-0：
<div className="flex h-screen flex-col">        // 根容器显式高度
  <WorkspaceHeader />                           // shrink-0
  <div className="flex min-h-0 flex-1">        // min-h-0 关键！
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel className="min-h-0">     // 每个 Panel 也要加
        <div className="flex h-full flex-col overflow-hidden"> // overflow-hidden
          ...
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</div>
```

**Detection:** 打开一个消息很多的对话，检查 `html` 和 `body` 是否出现滚动条。或在 DevTools 中搜索 `min-height: auto` 覆盖情况。

---

### Pitfall 2: react-resizable-panels SSR hydration 布局闪烁

**优先级:** CRITICAL

**What goes wrong:**
`react-resizable-panels` 默认将面板尺寸持久化到 `localStorage`。Next.js App Router 服务端渲染时 `localStorage` 不可用，导致服务端用 `defaultSize` 渲染，客户端 hydration 后读取 `localStorage` 中的旧尺寸，触发布局跳动（layout shift）。

**Why it happens:**
`localStorage` 是浏览器 API，SSR 阶段不存在。`react-resizable-panels` 的 `autoSaveId` 功能会在客户端 hydration 时覆盖服务端初始尺寸。

**Consequences:**
- 页面加载时有明显的布局闪烁
- 对三栏布局尤其明显，因为三个面板同时调整
- 可能导致 React hydration mismatch 警告

**Prevention:**
方案 A（推荐）：不使用 `autoSaveId`，不让库自动持久化：
```tsx
<ResizablePanelGroup direction="horizontal">
  // 不传 autoSaveId，避免 SSR/localStorage 冲突
```
方案 B：用 cookie 持久化，服务端可读：
```tsx
// Server Component 读取 cookie
const layout = cookies().get("panel-layout")?.value;
const defaultLayout = layout ? JSON.parse(layout) : [20, 40, 40];

// Client Component
<PanelGroup
  storage={cookieStorage}  // 自定义 storage 实现
  defaultLayout={defaultLayout}
/>
```

**Detection:** 在 Chrome DevTools 中打开 Network 节流为 Slow 3G，观察页面加载时三个面板是否有明显宽度跳变。

**Source:** [react-resizable-panels SSR Issue #144](https://github.com/bvaughn/react-resizable-panels/issues/144)

---

### Pitfall 3: 视频 autoplay 被浏览器策略阻断

**优先级:** CRITICAL

**What goes wrong:**
当右侧预览面板切换到视频文件时，如果使用 `<video autoplay>`，现代浏览器（Chrome、Firefox、Safari）会静默阻断有声自动播放。用户会看到视频元素但无法播放，也没有任何提示。

**Why it happens:**
所有主流浏览器自 2018 年后强制执行 Autoplay Policy：有声视频必须经过用户手势交互才能播放。即使用户刚刚点击了左侧文件列表（算作交互），浏览器也可能不认为"点击文件列表"是对视频元素的直接交互。

**Consequences:**
- 视频显示为暂停状态，用户困惑
- `video.play()` 抛出 `NotAllowedError`（DOMException）
- 静态演示模式下更严重（`NEXT_PUBLIC_STATIC_WEBSITE_ONLY`）

**Prevention:**
```tsx
// 始终使用 muted autoplay + controls：
<video
  src={urlOfArtifact({ filepath, threadId })}
  controls          // 必须有控件
  muted             // muted 才允许 autoplay
  playsInline       // Safari iOS 必须
  className="size-full object-contain"
/>
// 不要依赖 autoplay 属性，让用户手动点击播放
```

用 Promise 检测 autoplay 失败：
```tsx
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  video.play().catch(() => {
    // autoplay 被阻断，什么都不做——controls 允许用户手动播放
  });
}, [src]);
```

**Detection:** 在 Chrome 隐私模式（MEI 分数为零）中打开视频文件，观察是否能自动播放。

**Source:** [Autoplay guide for media and Web Audio APIs — MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

---

### Pitfall 4: 迁移时 ArtifactsContext 的 `open` 状态逻辑残留

**优先级:** CRITICAL

**What goes wrong:**
当前 `ChatBox` 通过 `ArtifactsContext` 的 `open` 状态控制面板可见性。三栏布局中面板始终可见，但如果 `ArtifactsContext` 的 `open: boolean` 逻辑不被清理，会出现以下问题：
1. `ArtifactTrigger` 按钮残留在 header 中（虽然不再需要）
2. `autoOpen`/`autoSelect` 机制在面板始终可见的情况下仍触发无意义的状态变更
3. `setSidebarOpen(false)` 在选择文件时仍会被调用，意外收起导航侧边栏

**Why it happens:**
`ArtifactsContext.select()` 硬编码调用了 `setSidebarOpen(false)`（关闭导航侧边栏），这是为弹出式面板设计的行为，在三栏布局中是不需要的。

**Consequences:**
- 用户点击左侧文件列表时，导航侧边栏自动收起
- 后续在 `ArtifactsContext` 中保留冗余逻辑增加维护负担
- 测试旧的弹出式 Artifact 面板路径可能意外通过

**Prevention:**
迁移时明确处理：
1. 从 `page.tsx` 的 header 中移除 `<ArtifactTrigger />`
2. 在 `ChatBox` 中停止使用 `open`/`setOpen`/`autoOpen`/`autoSelect`
3. 新 `WorkspaceContext` 的 `selectFile()` 不调用 `setSidebarOpen(false)`
4. `ArtifactsContext` 保留但标记为待废弃（仅保留 `setArtifacts` 的调用）

**Detection:** 在三栏布局中点击左侧文件，检查导航侧边栏是否意外收起。

---

## Moderate Pitfalls（中等陷阱）

影响功能或用户体验，但不会导致整体失败。

---

### Pitfall 5: CodeMirror 加载大文件时冻结 UI

**优先级:** MODERATE

**What goes wrong:**
当预览文件（通过 `useArtifactContent` 获取全文）内容超过约 50,000 行时，CodeMirror 的语法高亮解析器会占用大量主线程时间，导致 UI 短暂冻结（卡顿 1-5 秒）。对于超长行的文件（如 minified JS、data URI、大型 JSON），CodeMirror 会自动禁用语法高亮但仍会尝试渲染全部内容。

**Why it happens:**
现有 `CodeEditor` 组件一次性将完整内容字符串传给 CodeMirror（`value={displayContent}`）。CodeMirror v6 有内置的 viewport 渲染系统（只渲染可见行），但解析/tokenization 仍需要处理整个文档。

**Consequences:**
- 右侧预览面板打开大文件时浏览器卡顿
- 语法高亮在大文档中途停止（CodeMirror 的内置保护机制）
- 在流式更新期间更为明显（`CodeEditor` 在 `isLoading` 时降级为 `Textarea`，这实际上有帮助）

**Prevention:**
```tsx
// 对大文件设置内容截断限制：
const MAX_PREVIEW_CHARS = 500_000; // ~500KB 文本
const displayContent = content
  ? content.length > MAX_PREVIEW_CHARS
    ? content.slice(0, MAX_PREVIEW_CHARS) + "\n\n[文件过大，仅显示前 500KB]"
    : content
  : "";

// 或在 right-panel.tsx 中检测文件大小并显示降级提示：
if (content && content.length > MAX_PREVIEW_CHARS) {
  return <LargeFileWarning filepath={filepath} />;
}
```

**Detection:** 生成一个包含 10,000 行代码的大文件，在右侧面板中预览，用 Chrome Performance tab 检测主线程卡顿。

**Source:** [syntax highlighting not working on large documents — CodeMirror Discuss](https://discuss.codemirror.net/t/syntax-highlighting-not-working-on-large-documents/7579)

---

### Pitfall 6: 流式更新期间切换文件产生竞态条件

**优先级:** MODERATE

**What goes wrong:**
AI 正在流式生成 Artifact 内容时，用户可能在左侧文件列表中点击另一个文件。此时有两个异步操作并发：
1. 旧文件的 `useArtifactContent` 查询仍在进行
2. 新文件的 `useArtifactContent` 查询开始
如果旧查询比新查询先完成，预览会短暂显示旧文件内容。

**Why it happens:**
`useArtifactContent` 使用 TanStack Query，`queryKey` 是 `["artifact", filepath, threadId, isMock]`。切换文件改变了 `filepath`，但旧查询的 Promise 仍在飞行中，TanStack Query 的 key 变更会取消旧的但不能保证时序。

**Consequences:**
- 预览面板短暂闪烁显示错误内容
- 在慢网络或大文件下更明显
- 用户感知到不稳定

**Prevention:**
TanStack Query 本身在 key 变更时会处理竞态（只保留当前 key 的结果），但显式添加 loading 状态可以避免视觉抖动：
```tsx
// right-panel.tsx
const { content, isLoading } = useArtifactContent({ filepath, threadId, enabled });

if (isLoading) {
  return <LoadingPlaceholder />;
}
```
另外，对于 `write-file:` 类型（从 `thread.messages` 中直接读取），切换时不存在异步竞态，这部分是安全的。

**Detection:** 在流式生成过程中快速连续点击两个不同文件，观察预览面板是否有内容混乱。

---

### Pitfall 7: 视频内存泄漏——切换文件未释放 video 元素资源

**优先级:** MODERATE

**What goes wrong:**
当右侧预览面板从视频文件切换到其他文件时，如果 `<video>` 元素只是从 DOM 中移除而没有主动释放，浏览器会在垃圾回收之前继续持有视频的解码缓冲区。在一次会话中频繁切换视频文件后，内存使用会持续增加。

**Why it happens:**
根据 HTML5 规范，释放 video 资源的推荐方式是移除 `src` 属性并调用 `load()`，而不是仅仅卸载组件。React 的组件卸载不会自动触发这一过程。

**Consequences:**
- 在长时间会话中内存使用持续增加
- 在内存受限的环境（低配笔记本）中可能导致浏览器标签崩溃
- 对只有一两个视频文件的典型使用场景影响微小，但仍是良好实践

**Prevention:**
```tsx
// FilePreviewPanel 中视频组件的 cleanup：
function VideoPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load(); // 释放解码器资源
      }
    };
  }, []);  // 仅在组件卸载时执行

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted
      playsInline
      className="size-full object-contain"
    />
  );
}
```

**Detection:** 在 Chrome DevTools Memory 标签中，切换视频文件 10 次后拍摄堆快照，检查 `HTMLVideoElement` 的内存占用趋势。

**Source:** [HTML video element consumes memory — Mozilla Bugzilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1054170)

---

### Pitfall 8: `100vh` 在移动端浏览器地址栏导致布局错误

**优先级:** MODERATE（本项目桌面端优先，但值得知晓）

**What goes wrong:**
`h-screen`（即 `height: 100vh`）在移动端浏览器中是不可靠的。iOS Safari 和 Android Chrome 的地址栏高度可变——隐藏时视口更高，显示时视口更短。`100vh` 通常指地址栏隐藏时的较大视口，导致三栏布局溢出屏幕。

**Why it happens:**
`100vh` 是静态值，不跟随地址栏的动态变化。CSS 标准引入了 `dvh`（dynamic viewport height）来解决这个问题。

**Consequences:**
- 三栏布局的底部被地址栏遮挡
- 输入框（absolute positioned）不可见
- 平板竖屏使用时尤其明显

**Prevention:**
由于本项目将移动端列为 Out of Scope，当前使用 `h-screen` 可以接受。但如果将来需要适配：
```css
/* Tailwind v4 支持 dvh */
.workspace { height: 100dvh; }
/* 或降级方案 */
.workspace { height: 100vh; height: 100dvh; }
```

**Detection:** 用 Chrome DevTools 模拟 iPhone 12 设备，滚动页面使地址栏隐藏/显示，观察布局变化。

---

### Pitfall 9: `ResizablePanelGroup` 中条件渲染 Panel 导致布局错乱

**优先级:** MODERATE

**What goes wrong:**
如果右侧预览面板根据 `selectedFile === null` 条件性地返回 `null`（而不是返回一个空状态的 Panel），`react-resizable-panels` 的 Panel 注册会失去同步，导致剩余两个面板的尺寸重新分配，产生布局跳变。

**Why it happens:**
`react-resizable-panels` 通过 Panel 的注册/注销来管理尺寸分配。当一个 Panel 组件从 DOM 中移除时，库会重新计算其余 Panel 的比例。

**Consequences:**
- 切换文件时聊天面板突然变宽/变窄
- 控制台出现警告：conditionally-rendered Panel without `id` and `order` props

**Prevention:**
右侧 Panel 始终渲染，仅切换内部内容：
```tsx
<ResizablePanel defaultSize={40} id="preview" order={3}>
  {selectedFile ? (
    <FilePreviewPanel file={selectedFile} threadId={threadId} />
  ) : (
    <EmptyPreviewState />  // 始终渲染，不是 null
  )}
</ResizablePanel>
```

**Detection:** 在无文件选中时，观察切换到有文件选中时聊天面板是否有宽度跳变。

**Source:** [react-resizable-panels — conditional panel warning](https://github.com/bvaughn/react-resizable-panels/issues/29)

---

## Minor Pitfalls（次要陷阱）

对功能影响小，但影响代码质量或用户体验细节。

---

### Pitfall 10: `onLayout` 回调触发频率过高影响性能

**优先级:** MINOR

**What goes wrong:**
如果在 `ResizablePanelGroup` 上使用 `onLayout` 回调（如用于保存用户调整的面板尺寸），该回调在用户拖动 resize handle 期间会**每次鼠标移动**都触发，在慢速渲染的情况下产生大量开销。

**Prevention:**
使用 `onLayoutChange`（仅在拖动释放时触发），或对 `onLayout` 进行 debounce：
```tsx
const handleLayoutChange = useCallback(
  debounce((layout: number[]) => {
    localStorage.setItem("panel-layout", JSON.stringify(layout));
  }, 300),
  []
);
```

**Source:** [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels)

---

### Pitfall 11: 文件列表中 artifacts 与 uploads 路径格式不一致导致 URL 构建失败

**优先级:** MINOR

**What goes wrong:**
`thread.values.artifacts` 包含的是后端虚拟路径（如 `/mnt/user-data/outputs/report.md`），而 `listUploadedFiles()` 返回的 `artifact_url` 是完整 HTTP 路径（如 `/api/threads/{id}/artifacts/mnt/user-data/uploads/file.txt`）。如果在 `useWorkspaceFiles` 中不统一格式，传给 `urlOfArtifact()` 的 `filepath` 会是错误格式。

**Prevention:**
在 `useWorkspaceFiles` 中明确做路径格式转换：
```typescript
// 上传文件：从 artifact_url 提取 filepath
const artifactPrefix = `/api/threads/${threadId}/artifacts`;
const filepath = uploadedFile.artifact_url.startsWith(artifactPrefix)
  ? uploadedFile.artifact_url.slice(artifactPrefix.length)
  : uploadedFile.artifact_url;
```
在 `ARCHITECTURE.md` 中已有详细说明，但实现时容易忽略。

**Detection:** 点击上传的文件，检查预览是否加载或 Network 面板中是否出现 404 错误。

---

### Pitfall 12: 聊天面板输入框 absolute 定位在三栏布局中的 stacking context 问题

**优先级:** MINOR

**What goes wrong:**
现有聊天面板中的 `InputBox` 使用 `absolute right-0 bottom-0 left-0 z-30` 定位。当包裹在 `ResizablePanel` 内时，`ResizablePanel` 会创建新的定位上下文（containing block），`absolute` 定位相对于 Panel 边界而不是整个视口。这在当前两栏布局中也是如此，迁移后行为不变，但需要确认 Panel 没有添加意外的 `transform` 或 `filter` 属性（这会创建新的 stacking context 并破坏 `z-30` 层叠）。

**Prevention:**
检查 `ResizablePanel` 的实际渲染 DOM，确保没有添加 `transform` 样式。当前 `resizable.tsx` 实现是干净的（无 transform），但 `chat-box.tsx` 中曾有 `translate-x-full` 过渡动画——三栏布局迁移后这段代码应被移除。

**Detection:** 检查输入框在面板内是否正确显示在底部。如果出现输入框贴着父 Panel 顶部的情况，说明 containing block 不正确。

---

### Pitfall 13: 图片预览缺少 `object-fit` 导致宽高比失真

**优先级:** MINOR

**What goes wrong:**
右侧预览面板高度固定（填满 Panel 区域），如果图片使用 `width: 100%; height: 100%` 而没有设置 `object-fit: contain`，高分辨率图片或非标准比例图片会被拉伸变形。

**Prevention:**
```tsx
<img
  src={urlOfArtifact({ filepath, threadId })}
  alt={filename}
  className="size-full object-contain"  // object-contain 保持宽高比
/>
```

**Detection:** 上传一张竖版高清图片（如 1000x3000 px），在预览面板检查是否有变形。

---

## Phase-Specific Warnings（分阶段警告）

| 实施阶段 | 最可能遇到的陷阱 | 缓解措施 |
|----------|-----------------|---------|
| **布局骨架搭建** | Pitfall 1（flex min-h-0）、Pitfall 8（100vh） | 最先验证滚动隔离；每个 flex 层加 min-h-0 |
| **react-resizable-panels 集成** | Pitfall 2（SSR 闪烁）、Pitfall 9（条件渲染）、Pitfall 10（onLayout 频率） | 不用 autoSaveId；保持所有 Panel 始终渲染 |
| **ArtifactsContext 迁移** | Pitfall 4（open 状态残留）、Pitfall 11（路径格式） | 显式停用 open/autoOpen；统一路径格式 |
| **文件预览实现** | Pitfall 5（大文件 CodeMirror）、Pitfall 6（竞态条件）、Pitfall 13（图片变形） | 加内容大小限制；用 isLoading 状态防止闪烁 |
| **视频预览实现** | Pitfall 3（autoplay 阻断）、Pitfall 7（内存泄漏）、Pitfall 12（stacking context） | 始终加 controls + muted；组件卸载时释放 video 资源 |

---

## Sources

- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) — Panel re-render behavior, SSR issues, conditional rendering warnings
- [react-resizable-panels Issue #144 — SSR Layout Flicker](https://github.com/bvaughn/react-resizable-panels/issues/144)
- [Autoplay guide for media and Web Audio APIs — MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Autoplay policy in Chrome — Chrome for Developers Blog](https://developer.chrome.com/blog/autoplay)
- [CodeMirror — syntax highlighting not working on large documents](https://discuss.codemirror.net/t/syntax-highlighting-not-working-on-large-documents/7579)
- [CodeMirror Huge Doc Demo](https://codemirror.net/examples/million/)
- [HTML video element memory — Mozilla Bugzilla #1054170](https://bugzilla.mozilla.org/show_bug.cgi?id=1054170)
- [min-height Tailwind CSS docs](https://tailwindcss.com/docs/min-height)
- [overflow — CSS Tricks](https://css-tricks.com/almanac/properties/o/overflow/)
- [Handling state update race conditions in React — Medium/CyberArk](https://medium.com/cyberark-engineering/handling-state-update-race-conditions-in-react-8e6c95b74c17)
- [React useEffectEvent — LogRocket](https://blog.logrocket.com/react-useeffectevent)
- Direct codebase analysis:
  - `frontend/src/components/workspace/chats/chat-box.tsx` — existing layout logic
  - `frontend/src/components/workspace/artifacts/context.tsx` — open/autoOpen state machine
  - `frontend/src/components/workspace/code-editor.tsx` — CodeMirror integration
  - `frontend/src/core/artifacts/hooks.ts` — TanStack Query artifact loading
  - `frontend/src/core/artifacts/loader.ts` — fetch pattern
  - `frontend/src/components/ui/resizable.tsx` — Panel wrapper implementation
