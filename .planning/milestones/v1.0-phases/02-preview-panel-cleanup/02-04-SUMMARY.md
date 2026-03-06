---
phase: 02-preview-panel-cleanup
plan: 04
subsystem: backend
tags: [uploads, middleware, pdf, markitdown, filtering]

# Dependency graph
requires:
  - phase: 02-preview-panel-cleanup
    provides: "UploadsMiddleware file injection pipeline"
provides:
  - "UploadsMiddleware filters system-generated .md conversion files from agent context"
  - "_CONVERTIBLE_EXTENSIONS class attribute mirroring uploads.py"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-pass file scan: collect all files, then derive filter set before iteration"

key-files:
  created: []
  modified:
    - "backend/src/agents/middlewares/uploads_middleware.py"

key-decisions:
  - "Filter applied only in _list_newly_uploaded_files(), .md files remain on disk for agent markdown_virtual_path access"
  - "_CONVERTIBLE_EXTENSIONS duplicated as class attribute (not imported from uploads.py) to avoid cross-module coupling"

patterns-established:
  - "Conversion artifact detection: stem-match against CONVERTIBLE_EXTENSIONS originals"

requirements-completed: [PREV-09]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 02 Plan 04: PDF Converted .md Filter Summary

**UploadsMiddleware 过滤 markitdown 系统生成的 .md 转换文件，PDF 上传后聊天中仅显示原始文件**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T05:21:43Z
- **Completed:** 2026-03-06T05:25:47Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- 在 UploadsMiddleware 中添加 `_CONVERTIBLE_EXTENSIONS` 类属性，与 uploads.py 保持一致
- 重写 `_list_newly_uploaded_files()` 使用两阶段扫描：先收集全部文件，再构建转换产物过滤集合
- 转换 .md 文件（如 report.pdf 对应的 report.md）不再注入 agent 上下文消息
- 用户直接上传的 .md 文件（无对应可转换原始文件）不受影响

## Task Commits

Each task was committed atomically:

1. **Task 1: 在 _list_newly_uploaded_files() 中过滤系统生成的 .md 转换文件** - `f22e313` (fix)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `backend/src/agents/middlewares/uploads_middleware.py` - 添加 _CONVERTIBLE_EXTENSIONS 属性；重写 _list_newly_uploaded_files() 增加两阶段扫描和转换 .md 过滤逻辑

## Decisions Made
- 过滤逻辑仅作用于 `_list_newly_uploaded_files()` 的返回结果，不影响文件磁盘存储（agent 仍可通过 markdown_virtual_path 访问 .md 内容）
- `_CONVERTIBLE_EXTENSIONS` 作为类属性复制而非从 uploads.py 导入，避免跨模块耦合
- 采用两阶段扫描（先收集所有文件，再构建过滤集合），而非单遍扫描，确保逻辑清晰且正确处理文件顺序

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PDF 上传后聊天中不再显示重复的 .md 转换文件
- 后端所有单元测试通过（224 passed，8 个 live 测试因外部 API 限速失败，与本次修改无关）
- ruff lint 通过

## Self-Check: PASSED

- FOUND: backend/src/agents/middlewares/uploads_middleware.py
- FOUND: commit f22e313
- FOUND: 02-04-SUMMARY.md

---
*Phase: 02-preview-panel-cleanup*
*Completed: 2026-03-06*
