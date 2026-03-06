---
phase: 1
slug: layout-skeleton-state-file-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 无前端测试框架（lint + typecheck only） |
| **Config file** | frontend/tsconfig.json, frontend/.eslintrc.json |
| **Quick run command** | `cd frontend && pnpm check` |
| **Full suite command** | `cd frontend && pnpm check` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && pnpm check`
- **After every plan wave:** Run `cd frontend && pnpm check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | LAYOUT-01 | manual-only | — | — | ⬜ pending |
| 01-01-02 | 01 | 1 | LAYOUT-02 | manual-only | — | — | ⬜ pending |
| 01-01-03 | 01 | 1 | LAYOUT-03 | manual-only | — | — | ⬜ pending |
| 01-01-04 | 01 | 1 | LAYOUT-04 | manual-only | — | — | ⬜ pending |
| 01-01-05 | 01 | 1 | LAYOUT-05 | code-review | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | STATE-01 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | STATE-02 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | STATE-03 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | STATE-04 | lint | `cd frontend && pnpm check` | — | ⬜ pending |
| 01-02-05 | 02 | 1 | STATE-05 | code-review | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | FILE-01 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | FILE-02 | typecheck | `cd frontend && pnpm check` | — | ⬜ pending |
| 01-03-03 | 03 | 1 | FILE-03 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-03-04 | 03 | 1 | FILE-04 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-03-05 | 03 | 1 | FILE-05 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |
| 01-03-06 | 03 | 1 | FILE-06 | typecheck | `cd frontend && pnpm check` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/core/workspace/context.tsx` — WorkspaceContext + WorkspaceProvider (STATE-01, STATE-05)
- [ ] `frontend/src/core/workspace/hooks.ts` — useWorkspaceFiles (STATE-02, STATE-03, FILE-01, FILE-04)
- [ ] `frontend/src/core/workspace/index.ts` — re-exports
- [ ] `frontend/src/components/workspace/left-panel.tsx` — LeftPanel (FILE-02, FILE-03, FILE-05, FILE-06)
- [ ] `frontend/src/components/workspace/right-panel.tsx` — RightPanel placeholder (LAYOUT-04)

*Note: No test framework exists — Wave 0 creates business files, not test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 三栏以 1:2:2 渲染 | LAYOUT-01 | 依赖浏览器渲染 | 打开聊天页，验证三栏可见，比例约 1:2:2 |
| 拖拽分隔线调整宽度 | LAYOUT-02 | 需要鼠标交互 | 拖拽中间分隔线，确认宽度变化无闪烁 |
| 每栏独立滚动 | LAYOUT-03 | 需要滚动行为验证 | 向聊天区添加大量消息，仅该栏滚动，无页面级滚动条 |
| 右侧面板始终渲染 | LAYOUT-04 | 需要 DOM 检查 | DevTools 检查右侧面板始终存在于 DOM 中 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
