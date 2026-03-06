---
phase: 02-preview-panel-cleanup
verified: 2026-03-06T06:10:00Z
status: passed
score: 15/15 must-haves verified
re_verification: true
  previous_status: passed
  previous_score: 12/12
  gaps_closed:
    - "点击下载按钮直接触发浏览器文件保存对话框，不打开新窗口"
    - "PDF 文件通过 iframe 在预览面板内渲染，不显示原始二进制数据"
    - "PDF 发送到聊天时 agent 上下文中只出现 PDF 文件本身，不出现系统自动生成的 .md 转换文件"
  gaps_remaining: []
  regressions: []
gaps: []
human_verification:
  - test: "打开聊天页，生成一个 .md 文件，点击左侧面板该文件"
    expected: "右侧面板默认以渲染视图展示 Markdown，点击 Code 图标切换到 Shiki 语法高亮代码视图，再点击 Eye 图标切换回渲染视图"
    why_human: "ToggleGroup 视图切换和 Streamdown 渲染效果需要真实浏览器验证"
  - test: "生成一个 .html 文件，点击右侧预览切换为 iframe 视图"
    expected: "HTML 文件以 iframe 渲染，URL 指向 artifact endpoint；切换到 Code 视图显示 Shiki 高亮的 HTML 源码"
    why_human: "iframe 跨域和 artifact URL 有效性需要真实运行环境"
  - test: "切换两个视频文件"
    expected: "切换后前一个视频停止播放，内存不泄漏"
    why_human: "内存泄漏只能通过浏览器 DevTools Memory 面板观察，无法静态分析"
  - test: "加载超过 500KB 的代码文件"
    expected: "底部出现粘性提示条\"文件过大，仅显示前 50,000 字符\""
    why_human: "需要真实大文件触发截断路径"
  - test: "点击 PDF 文件下载按钮"
    expected: "浏览器弹出文件保存对话框，不打开新标签页"
    why_human: "HTML download 属性行为依赖浏览器环境，无法静态验证"
  - test: "上传 PDF 文件后发送到聊天"
    expected: "聊天消息中只显示 PDF 文件卡片，不额外出现同名 .md 文件"
    why_human: "需要真实后端运行和文件上传流程才能验证 _list_newly_uploaded_files 过滤效果"
---

# Phase 2: Preview Panel Cleanup 验证报告（重验证）

**阶段目标:** 用户点击任意类型文件后右侧面板正确渲染文件内容，包含加载骨架屏、大文件截断提示、视频资源正确释放，旧弹出式面板逻辑完全清除
**验证时间:** 2026-03-06T06:10:00Z
**状态:** PASSED — 所有自动验证项通过；附 6 项人工验证建议
**是否重验证:** 是 — UAT gap closure 后（Plan 03 + Plan 04）

---

## 重验证背景

首次验证（2026-03-06T03:12:08Z）标记 PASSED，但随后进行的 UAT 发现 3 个新 gap：

| UAT Gap | 严重程度 | 修复 Plan |
|---------|---------|---------|
| 下载按钮打开新窗口而非触发保存 | minor | 02-03-PLAN |
| PDF 文件显示原始二进制数据 | major | 02-03-PLAN |
| 发送 PDF 到聊天时同时注入系统生成 .md 文件 | major | 02-04-PLAN |

Plan 03（提交 `ec04f63`、`d776d2c`）和 Plan 04（提交 `f22e313`）声称已全部修复。本报告对这 3 个 gap 进行全量三级验证，对原始 12 条真相进行快速回归检查。

---

## 目标达成分析

### 可观测真相验证（15 条）

| # | 真相 | 来源 | 状态 | 证据 |
|---|------|------|------|------|
| 1 | 未选中文件时右侧面板显示"选择文件预览"空状态 | Plan 01 | VERIFIED（回归） | `right-panel.tsx:12-21` — `selectedFile === null` 时渲染 `FileTextIcon + "选择文件预览"` |
| 2 | 文件加载中显示骨架屏动画 | Plan 01 | VERIFIED（回归） | `file-preview.tsx:174-175` — `showSkeleton` 条件渲染 `<PreviewSkeleton />` |
| 3 | 代码文件以 Shiki 语法高亮只读模式渲染 | Plan 01 | VERIFIED（回归） | `file-preview.tsx:209-213` — `<CodeBlock code={displayContent} language={language} showLineNumbers />` |
| 4 | Markdown 文件默认渲染视图，可切换 code/preview | Plan 01 | VERIFIED（回归） | `file-preview.tsx:125-135` — `isSupportPreview` 时 viewMode 默认 "preview"；`preview-header.tsx:77-97` ToggleGroup；`file-preview.tsx:193-201` `<Streamdown>` |
| 5 | HTML 文件默认 iframe 预览，可切换 code/preview | Plan 01 | VERIFIED（回归） | `file-preview.tsx:202-207` — `language === "html"` 时 `<iframe src={artifactUrl} />` |
| 6 | 图片文件以 object-contain 自适应面板展示 | Plan 01 | VERIFIED（回归） | `file-preview.tsx:215-222` — `isImage` 分支；`object-contain max-h-full max-w-full` |
| 7 | 视频文件显示带 controls + muted + playsInline 的播放器 | Plan 01 | VERIFIED（回归） | `file-preview.tsx:91-98` — `<video controls muted playsInline>` 三属性均存在 |
| 8 | 纯文本文件以等宽字体展示 | Plan 01 | VERIFIED（回归） | `file-preview.tsx:231-233` — `<pre className="whitespace-pre-wrap p-4 font-mono text-sm">` |
| 9 | 预览头部显示文件名 + 图标 + 操作栏 | Plan 01 | VERIFIED（回归） | `preview-header.tsx:65-154` — `getFileIcon + getFileName + ToggleGroup + 复制/下载/.skill 按钮` |
| 10 | 超过 500KB 的文本文件只显示前 50000 字符并展示截断提示 | Plan 02 | VERIFIED（回归） | `file-preview.tsx:24-26,145-171,241-245` — `MAX_TEXT_SIZE = 500 * 1024`；代码/纯文本双路径 `slice(0, 50_000)`；粘性底栏 |
| 11 | 切换视频文件时前一个视频资源正确释放 | Plan 02 | VERIFIED（回归） | `file-preview.tsx:76-87` — `useRef + useEffect(cleanup, [filepath])` — `pause() + removeAttribute("src") + load()` |
| 12 | 整个改造不破坏现有聊天功能 | Plan 02 | VERIFIED（回归） | 提交历史完整，最新提交 `767e5bc` 通过 lint/typecheck（SUMMARY 记录 `pnpm check` 通过） |
| 13 | 点击下载按钮直接触发浏览器文件保存对话框，不打开新窗口 | Plan 03 (gap) | VERIFIED（新） | `preview-header.tsx:141-151` — `<a>` 标签含 `download={getFileName(filepath)}`，无 `target="_blank"` |
| 14 | PDF 文件通过 iframe 在预览面板内渲染，不显示原始二进制数据 | Plan 03 (gap) | VERIFIED（新） | `file-preview.tsx:46-50,156,225-230` — `PDF_EXTENSIONS`、`isPdf` 变量、`isPdf ? <iframe ...>` 分支 |
| 15 | PDF 发送到聊天时 agent 上下文只出现 PDF 文件本身，不出现系统自动生成的 .md 转换文件 | Plan 04 (gap) | VERIFIED（新） | `uploads_middleware.py:31-33,76-97` — `_CONVERTIBLE_EXTENSIONS` 类属性；两阶段扫描构建 `converted_md_names`；过滤循环 |

**得分:** 15/15 真相验证通过

---

### 必要产物验证（三级检查）

#### 原始产物（快速回归）

| 产物 | 存在 | 实质内容 | 接线状态 | 状态 |
|------|------|---------|---------|------|
| `frontend/src/components/workspace/preview/file-preview.tsx` | 存在 | 250 行（含 PDF 新增分支） | 被 `right-panel.tsx:7` import，`:23` 使用 | VERIFIED |
| `frontend/src/components/workspace/preview/preview-header.tsx` | 存在 | 155 行 | 被 `file-preview.tsx:18` import，`:179` 使用 | VERIFIED |
| `frontend/src/components/workspace/preview/preview-skeleton.tsx` | 存在 | 15 行 | 被 `file-preview.tsx:19` import，`showSkeleton` 时渲染 | VERIFIED |
| `frontend/src/components/workspace/right-panel.tsx` | 存在 | 24 行 | 被 `page.tsx:19,170` import 并传入 `threadId` | VERIFIED |

#### Gap Closure 产物（全量三级验证）

**产物 A：preview-header.tsx — 下载按钮修复**

- Level 1 (存在): 文件存在，155 行
- Level 2 (实质): 第 141-151 行含完整下载 `<a>` 标签；含 `download={getFileName(filepath)}`；无 `target="_blank"`
- Level 3 (接线): 下载链接指向 `urlOfArtifact({ filepath, threadId, download: true })`，与文件内容获取逻辑接通
- 状态: VERIFIED

**产物 B：file-preview.tsx — PDF 渲染分支**

- Level 1 (存在): 文件存在，250 行
- Level 2 (实质): 第 46-50 行含 `PDF_EXTENSIONS` 集合和 `isPdfFile` 函数；第 156 行 `isPdf` 变量定义排在 `isPlainText` 之前；第 225-230 行 `isPdf ? <iframe ...>` 渲染分支；第 231-234 行 `isPlainText` 分支；第 235-239 行兜底 fallback
- Level 3 (接线): `isPdf` → `isPdfFile(ext)` → `PDF_EXTENSIONS.has(ext)`；iframe `src={artifactUrl}` 已定义在第 159 行
- 状态: VERIFIED

**产物 C：uploads_middleware.py — 转换 .md 过滤**

- Level 1 (存在): 文件存在，252 行
- Level 2 (实质): 第 31-33 行含 `_CONVERTIBLE_EXTENSIONS` 类属性（包含 `.pdf`）；第 76-97 行 `_list_newly_uploaded_files()` 实现两阶段扫描逻辑；`converted_md_names` 集合正确构建并在循环中过滤
- Level 3 (接线): `_list_newly_uploaded_files()` 被 `before_agent()` 在第 208 行调用，过滤结果直接决定注入 agent 的文件列表
- 状态: VERIFIED

---

### 关键接线验证（Key Links）

#### Plan 03 关键接线

| From | To | Via | 状态 | 证据 |
|------|----|-----|------|------|
| `preview-header.tsx` 下载 `<a>` 标签 | 浏览器下载行为 | HTML `download` 属性 + 无 `target="_blank"` | WIRED | `preview-header.tsx:144` — `download={getFileName(filepath)}`；grep 确认无 `target="_blank"` |
| `file-preview.tsx isPdf` 分支 | 浏览器内置 PDF viewer | `<iframe src={artifactUrl}>` | WIRED | `file-preview.tsx:225-230` — `isPdf ? (<iframe className="size-full" src={artifactUrl} title={...} />)` |

#### Plan 04 关键接线

| From | To | Via | 状态 | 证据 |
|------|----|-----|------|------|
| `_list_newly_uploaded_files()` | uploads 目录文件列表 | 两阶段扫描过滤 `converted_md_names` | WIRED | `uploads_middleware.py:76-109` — `all_files` 收集 → `original_stems` → `converted_md_names` → 循环跳过 |

#### 原始关键接线（快速回归）

| From | To | Via | 状态 |
|------|----|-----|------|
| `right-panel.tsx` | `WorkspaceContext.selectedFile` | `useWorkspace()` | WIRED（回归通过） |
| `right-panel.tsx` | `file-preview.tsx` | `import FilePreview` | WIRED（回归通过） |
| `file-preview.tsx` | `useArtifactContent` | TanStack Query | WIRED（回归通过） |
| `file-preview.tsx` | `CodeBlock (Shiki)` | 代码文件渲染 | WIRED（回归通过） |
| `file-preview.tsx` | `Streamdown` | Markdown 渲染 | WIRED（回归通过） |
| `file-preview.tsx` | `VideoPreview` useRef cleanup | `[filepath]` 依赖 | WIRED（回归通过） |

---

### 需求覆盖情况

#### PREV-01 ~ PREV-09（Phase 2 全部需求）

| 需求 ID | 描述 | 声明 Plan | 状态 | 证据 |
|---------|------|---------|------|------|
| PREV-01 | 代码文件以语法高亮只读模式展示（Shiki） | Plan 01 | SATISFIED | `<CodeBlock showLineNumbers>` 渲染，无编辑器 |
| PREV-02 | Markdown 文件渲染后展示（Streamdown/rehype） | Plan 01 | SATISFIED | `<Streamdown {...streamdownPlugins}>` 渲染，支持 code/preview 切换 |
| PREV-03 | 图片文件以 `<img>` 展示，`object-contain` 适配面板 | Plan 01 | SATISFIED | `isImageFile()` 检测 10 种扩展名；`object-contain max-h-full max-w-full` 类名 |
| PREV-04 | 视频文件以 `<video>` 展示，带 `controls + muted + playsInline` | Plan 01/03 | SATISFIED | `<video controls muted playsInline>`；Plan 03 声明此需求复用但无回归破坏 |
| PREV-05 | 纯文本文件以等宽字体展示 | Plan 01/03 | SATISFIED | `<pre className="whitespace-pre-wrap p-4 font-mono text-sm">`；Plan 03 声明此需求，结构未破坏 |
| PREV-06 | 未选中文件时显示"选择文件预览"空状态 | Plan 01 | SATISFIED | `right-panel.tsx:12-21` |
| PREV-07 | 文件加载中显示骨架屏 | Plan 01 | SATISFIED | `showSkeleton` 逻辑覆盖代码文件和纯文本两路径 |
| PREV-08 | 大文件（>500KB 文本）显示截断提示而非加载全部内容 | Plan 02 | SATISFIED | `MAX_TEXT_SIZE = 500 * 1024`；双路径 `slice(0, 50_000)`；粘性底栏"文件过大" |
| PREV-09 | 视频组件卸载时正确释放资源（防内存泄漏） | Plan 02/04 | SATISFIED | `VideoPreview` useEffect cleanup：`pause() + removeAttribute("src") + load()`；Plan 04 声明此需求（后端修复不影响前端视频逻辑） |

**所有 9 个 PREV 需求全部 SATISFIED。无孤立需求。**

> 注：REQUIREMENTS.md 中 PREV-04 和 PREV-05 同时出现在 Plan 01 和 Plan 03 的 `requirements` 字段中。Plan 03 的修改（下载按钮修复、PDF 分支新增）对 PREV-04（视频）和 PREV-05（纯文本）的实现无影响，该声明是计划文档的轻微重复，无实质问题。

---

### 反模式扫描

扫描全部 5 个修改文件：

| 文件 | TODO/FIXME | return null/stub | 空实现 | 结果 |
|------|-----------|-----------------|--------|------|
| `file-preview.tsx` | 无 | 无（`return null` 仅在 HTML 分支非 preview 时，逻辑正确） | 无 | 无问题 |
| `preview-header.tsx` | 无 | 无 | 无 | 无问题 |
| `preview-skeleton.tsx` | 无 | 无 | 无 | 无问题 |
| `right-panel.tsx` | 无 | 无 | 无 | 无问题 |
| `uploads_middleware.py` | 无 | 无 | 无 | 无问题 |

**反模式扫描结果：无任何反模式。**

---

### 人工验证建议

以下功能依赖浏览器环境或动态运行时行为，需要人工测试：

#### 1. Markdown/HTML code-preview 切换

**操作:** 打开聊天页，生成 `.md` 文件并点击，观察右侧面板
**预期:** 默认渲染视图（Streamdown），点击 Code 图标切换到 Shiki 高亮源码，再点击 Eye 图标恢复渲染
**原因:** ToggleGroup 切换和 Streamdown 渲染效果需要真实浏览器

#### 2. HTML iframe 预览

**操作:** 生成 `.html` 文件，右侧面板选择 iframe 视图
**预期:** iframe 正确加载 artifact URL 渲染 HTML 页面，切换 Code 视图显示高亮 HTML 源码
**原因:** iframe 跨域策略和 artifact endpoint 可用性需运行时验证

#### 3. 视频资源释放

**操作:** 依次点击两个不同的视频文件，打开 Chrome DevTools Memory，观察内存变化
**预期:** 切换后前一个视频内存被释放，不持续增长
**原因:** 内存泄漏只能通过 DevTools Memory 面板观察

#### 4. 大文件截断横条

**操作:** 准备超过 500KB 的代码文件在右侧面板预览
**预期:** 内容被截断，底部出现粘性提示条"文件过大，仅显示前 50,000 字符"
**原因:** 需要真实大文件才能触发截断路径

#### 5. 下载按钮触发文件保存（UAT Gap 修复验证）

**操作:** 点击任意文件预览中的下载按钮
**预期:** 浏览器弹出文件保存对话框（或直接下载到 Downloads 文件夹），不打开新标签页
**原因:** HTML `download` 属性行为依赖浏览器安全策略，静态分析已确认属性存在，行为需运行时确认

#### 6. PDF 文件上传后发送到聊天（UAT Gap 修复验证）

**操作:** 上传 PDF 文件，点击"发送到聊天"
**预期:** 聊天消息中只显示 PDF 文件卡片，不出现同名 `.md` 文件
**原因:** `_list_newly_uploaded_files()` 过滤逻辑需要真实后端文件系统和 markitdown 转换流程才能端到端验证

---

## 差距汇总

**无差距。**

Phase 2 UAT 发现的 3 个 gap 已全部通过代码验证为已修复：

1. **下载按钮** — `preview-header.tsx` 下载 `<a>` 标签已移除 `target="_blank"`，已添加 `download={getFileName(filepath)}`（提交 `ec04f63`）
2. **PDF 预览** — `file-preview.tsx` 新增 `PDF_EXTENSIONS`、`isPdf` 分支和 iframe 渲染（提交 `d776d2c`）；同时新增未知格式兜底 fallback
3. **PDF 双文件注入** — `uploads_middleware.py` 新增 `_CONVERTIBLE_EXTENSIONS` 类属性和 `converted_md_names` 两阶段过滤（提交 `f22e313`）

原始 12 条真相快速回归检查全部通过，无退步。

Phase 2 目标"用户点击任意类型文件后右侧面板正确渲染文件内容"在 UAT gap closure 后已全面达成。

---

_验证时间: 2026-03-06T06:10:00Z_
_验证者: Claude (gsd-verifier)_
_验证类型: 重验证（UAT gap closure 后）_
