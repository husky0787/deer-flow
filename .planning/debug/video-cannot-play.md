---
status: resolved
trigger: "视频文件在预览面板中播放器出现但完全无法播放"
created: 2026-03-06T00:00:00Z
updated: 2026-03-06T06:35:00Z
---

## Current Focus

resolved

## Symptoms

expected: 点击视频文件后，右侧预览面板显示视频播放器，用户可以正常播放视频
actual: 视频播放器UI出现了，但无法播放（video src 为空，readyState=0）
errors: 控制台无视频相关错误
reproduction: 在工作区选择一个 mp4 视频文件，右侧面板显示播放器但无法交互
started: 首次尝试

## Eliminated

- hypothesis: CSS overlay/z-index from sibling components in preview directory
  evidence: preview 目录中没有任何 absolute/fixed 定位的元素。PreviewHeader 是正常流。isTruncated 对视频文件为 false 所以 sticky div 不渲染。
  timestamp: 2026-03-06T00:00:10Z

- hypothesis: pointer-events: none on video or ancestors
  evidence: 全局搜索 pointer-events，没有在视频相关组件或其祖先上找到 pointer-events:none
  timestamp: 2026-03-06T00:00:15Z

- hypothesis: react-resizable-panels 事件拦截 (preventDefault)
  evidence: 库的 Ce (pointerdown) 函数只在点击命中 separator hit region 时才 preventDefault；对面板内部的点击不做任何阻止。
  timestamp: 2026-03-06T00:00:20Z

- hypothesis: 中间面板的 absolute 元素溢出覆盖右面板
  evidence: 中间面板的 absolute 元素相对于带 relative 的父 div 定位。ResizablePanelGroup 和 Panel 都有 overflow:hidden，阻止溢出。
  timestamp: 2026-03-06T00:00:25Z

- hypothesis: 文件类型分类错误（mp4 被误判为 code file）
  evidence: mp4 不在 extensionMap 中，checkCodeFile 返回 isCodeFile:false。isVideo 正确为 true。
  timestamp: 2026-03-06T00:00:30Z

- hypothesis: 三层嵌套 overflow 容器阻断 video shadow DOM controls pointer events
  evidence: Playwright elementFromPoint 检查证实 pointer events 正确命中 VIDEO 元素（center 和 controls 位置均为 VIDEO）。overflow 嵌套不是根因。
  timestamp: 2026-03-06T06:30:00Z

## Evidence

- timestamp: 2026-03-06T06:30:00Z
  checked: Playwright 自动化检查 video 元素状态
  found: video.src 为空字符串，readyState=0 (HAVE_NOTHING)，networkState=0 (NETWORK_EMPTY)。elementFromPoint 证实 pointer events 正确到达 VIDEO 元素。
  implication: 视频无法播放不是因为 CSS/pointer events，而是因为 src 属性被清空

- timestamp: 2026-03-06T06:31:00Z
  checked: VideoPreview useEffect cleanup 在 React Strict Mode 下的行为
  found: useEffect cleanup 中 video.removeAttribute("src") 直接操作 DOM。React Strict Mode 下 effect 执行顺序为 mount→cleanup→mount，cleanup 在首次 mount 后立即执行，removeAttribute 清空了 src，但 React 不知道 DOM 被直接修改，不会重新设置 src prop。
  implication: 这是根因——React Strict Mode 双重执行导致 video src 永久为空

## Resolution

root_cause: VideoPreview 组件的 useEffect cleanup 使用 video.removeAttribute("src") 直接操作 DOM 来释放视频资源。React Strict Mode（开发模式）下 useEffect 双重执行（mount→cleanup→mount），cleanup 中的 removeAttribute 清空了 src 属性，但 React 的 reconciler 不感知这个 DOM 变更，不会重新设置 src prop，导致视频 src 永久为空。
fix: 移除 useEffect + useRef 手动 cleanup，改用 key={filepath} 让 React 在文件切换时自动重建 video 元素（浏览器自动释放旧元素资源）
verification: Playwright 验证修复后 video.src 有正确 URL，readyState=4 (HAVE_ENOUGH_DATA)，duration=8s，error=null
files_changed:
  - frontend/src/components/workspace/preview/file-preview.tsx (移除 VideoPreview 的 useRef/useEffect，添加 key={filepath}；移除未使用的 useRef import)
  - backend/src/gateway/routers/artifacts.py (Response→FileResponse 支持 Range 请求，附带修复)
