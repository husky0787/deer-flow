---
phase: 2
slug: preview-panel-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (project has no test framework — CLAUDE.md: "No test framework is configured") |
| **Config file** | none |
| **Quick run command** | `pnpm check` |
| **Full suite command** | `pnpm check` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm check`
- **After every plan wave:** Run `pnpm check` + browser manual regression
- **Before `/gsd:verify-work`:** Full suite must be green + browser full-scenario verification
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PREV-06 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | PREV-07 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | PREV-01 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-04 | 01 | 1 | PREV-02 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-05 | 01 | 1 | PREV-05 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-06 | 01 | 1 | PREV-03 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-01-07 | 01 | 1 | PREV-04 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-02-01 | 02 | 2 | PREV-08 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |
| 02-02-02 | 02 | 2 | PREV-09 | manual + typecheck | `pnpm check` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — project uses `pnpm check` (lint + typecheck) for automated verification and browser manual testing for UI behavior.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 代码文件语法高亮只读展示 | PREV-01 | Visual UI rendering | Open a .ts/.py/.rs file, verify syntax highlighting and read-only mode |
| Markdown 文件渲染展示 | PREV-02 | Visual rendering quality | Open a .md file, verify rendered output matches expected formatting |
| 图片 object-contain 展示 | PREV-03 | Visual layout behavior | Open .png/.jpg files of various sizes, verify object-contain scaling |
| 视频 controls 播放器 | PREV-04 | Media playback behavior | Open .mp4/.webm file, verify controls visible and playback works |
| 纯文本等宽字体展示 | PREV-05 | Visual font rendering | Open a .txt file, verify monospace font |
| 空状态显示 | PREV-06 | Visual UI state | Deselect all files, verify empty state message "选择文件预览" |
| 骨架屏加载态 | PREV-07 | Transient loading state | Throttle network, select file, verify skeleton appears during load |
| 大文件截断提示 | PREV-08 | Large file behavior | Create/open >500KB text file, verify truncation notice |
| 视频资源释放 | PREV-09 | Memory behavior | Switch between videos, check Chrome DevTools Memory panel for leaks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
