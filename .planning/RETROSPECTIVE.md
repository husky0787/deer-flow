# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — 三栏工作区

**Shipped:** 2026-03-06
**Phases:** 2 | **Plans:** 6 | **Sessions:** ~3

### What Was Built
- WorkspaceContext 状态层替代 ArtifactsContext 弹出逻辑
- 固定三栏 ResizablePanelGroup 布局（20/40/40）
- LeftPanel 文件列表（高亮、scrollIntoView、空状态、下载）
- FilePreview 七种文件类型渲染（代码/Markdown/HTML/图片/视频/纯文本/PDF）
- 大文件截断保护和视频资源释放
- 后端 markitdown .md 转换产物过滤

### What Worked
- 两阶段划分清晰：Phase 1 搭骨架+状态层，Phase 2 填充预览逻辑，依赖关系干净
- 6 个 plan 平均 4.5 分钟完成，总执行时间约 27 分钟，效率极高
- UAT 驱动的 gap closure（02-03、02-04）精确定位了遗漏功能
- 审计通过率 100%（25/25 需求、12/12 集成、3/3 E2E 流）

### What Was Inefficient
- Phase 2 ROADMAP 中 02-03/02-04 的 checkbox 未及时勾选（显示 2/4 而非 4/4），造成视觉混乱
- PREV-09 SUMMARY 文档描述了旧方案（useRef cleanup），最终代码用了 key remount，文档未更新

### Patterns Established
- WorkspaceContext pattern: createContext + Provider + useWorkspace guard hook
- Preview component pattern: PreviewHeader + type-based rendering branches
- 大文件截断 pattern: MAX_TEXT_SIZE + TRUNCATE_DISPLAY_CHARS + sticky banner
- Video cleanup via key={filepath} remount（比手动 ref cleanup 更 React-idiomatic）

### Key Lessons
1. UI 重构项目中 UAT（浏览器人工测试）是不可替代的验证手段，lint/typecheck 无法覆盖视觉行为
2. gap closure plan 应在 UAT 发现问题后立即创建并执行，避免问题积累
3. 文档与代码实现可能在迭代中出现偏差，milestone 审计是最后一道检查

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: ~3
- Notable: 6 plans 总执行约 27 分钟，平均每 plan 4.5 分钟，前端 UI 重构效率极高

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~3 | 2 | Initial milestone — established workspace context pattern and UAT-driven gap closure |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 (lint+typecheck only) | N/A | 0 |

### Top Lessons (Verified Across Milestones)

1. UAT 驱动的 gap closure 比预防式测试更适合 UI 重构项目
2. 两阶段划分（骨架+填充）是前端重构的有效模式
