---
phase: 02-preview-panel-cleanup
plan: 03
subsystem: ui
tags: [react, preview, download, pdf, iframe]

# Dependency graph
requires:
  - phase: 02-preview-panel-cleanup
    provides: FilePreview 渲染分支架构（代码/图片/视频/纯文本）
provides:
  - 下载按钮触发浏览器文件保存而非打开新窗口
  - PDF 文件通过 iframe 在预览面板内渲染
  - 未知二进制格式友好提示兜底
affects: [02-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "iframe 渲染 PDF（与 HTML preview 模式一致）"
    - "download 属性触发浏览器保存对话框"

key-files:
  created: []
  modified:
    - frontend/src/components/workspace/preview/preview-header.tsx
    - frontend/src/components/workspace/preview/file-preview.tsx

key-decisions:
  - "使用 HTML download 属性而非 JavaScript blob 方式实现下载，简洁且依赖浏览器原生行为"
  - "PDF 渲染复用 iframe 模式（与 HTML preview 一致），委托给浏览器内置 PDF viewer"
  - "添加兜底分支显示'不支持预览此文件格式'，防御未知二进制格式"

patterns-established:
  - "download 属性 + 移除 target='_blank' 模式：任何触发下载的链接"
  - "文件类型分支优先级顺序：isCodeFile > isImage > isVideo > isPdf > isPlainText > fallback"

requirements-completed: [PREV-04, PREV-05]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 02 Plan 03: 下载按钮修复 + PDF 渲染分支 Summary

**修复下载按钮使用 HTML download 属性触发浏览器保存，新增 PDF iframe 渲染分支和未知格式兜底提示**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T05:21:46Z
- **Completed:** 2026-03-06T05:24:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 修复下载按钮：移除 `target="_blank"`，添加 `download` 属性，点击直接触发浏览器文件保存对话框
- 新增 PDF 渲染分支：`PDF_EXTENSIONS` 集合 + `isPdfFile` 辅助函数 + `<iframe>` 渲染
- 添加未知二进制格式兜底提示："不支持预览此文件格式"

## Task Commits

Each task was committed atomically:

1. **Task 1: 修复 preview-header.tsx 下载按钮** - `ec04f63` (fix)
2. **Task 2: 为 file-preview.tsx 添加 PDF 渲染分支** - `d776d2c` (feat)

## Files Created/Modified
- `frontend/src/components/workspace/preview/preview-header.tsx` - 下载按钮 `<a>` 标签：移除 `target="_blank"`，添加 `download` 和 `rel="noreferrer"` 属性
- `frontend/src/components/workspace/preview/file-preview.tsx` - 新增 `PDF_EXTENSIONS` 集合、`isPdfFile` 函数、`isPdf` 渲染分支（iframe）、未知格式兜底 div

## Decisions Made
- 使用 HTML `download` 属性而非 JavaScript blob 方式实现下载，简洁且依赖浏览器原生行为
- PDF 渲染复用 iframe 模式（与 HTML preview 一致），委托给浏览器内置 PDF viewer
- 添加兜底分支显示"不支持预览此文件格式"，防御未知二进制格式

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 下载按钮和 PDF 预览修复完成，UAT 报告的两个 gap 已关闭
- 可继续执行 02-04-PLAN（下一个 UAT gap closure 计划）

## Self-Check: PASSED

- FOUND: preview-header.tsx
- FOUND: file-preview.tsx
- FOUND: 02-03-SUMMARY.md
- FOUND: ec04f63 (Task 1 commit)
- FOUND: d776d2c (Task 2 commit)

---
*Phase: 02-preview-panel-cleanup*
*Completed: 2026-03-06*
