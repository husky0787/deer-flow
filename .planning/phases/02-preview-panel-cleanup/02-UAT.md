---
status: complete
phase: 02-preview-panel-cleanup
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-06T03:10:00Z
updated: 2026-03-06T03:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. 代码文件预览（Shiki 语法高亮）
expected: 在左侧文件列表选择一个代码文件（如 .tsx/.ts/.js），右侧面板应显示使用 Shiki 语法高亮的只读代码预览，带有行号和颜色高亮。
result: pass

### 2. Markdown 文件 code/preview 切换
expected: 选择一个 .md 文件，默认显示渲染后的 Markdown 预览。点击 PreviewHeader 中的切换按钮，应在源代码视图和渲染预览之间切换。
result: pass

### 3. 图片文件预览
expected: 选择一个图片文件（.png/.jpg/.gif 等），右侧面板应直接显示该图片的渲染预览。
result: pass

### 4. PreviewHeader 操作栏
expected: 预览任意文件时，顶部应显示文件名和文件图标。提供复制和下载按钮，点击复制应将文件内容复制到剪贴板，点击下载应触发文件下载。
result: issue
reported: "when download, it open a new window of browser"
severity: minor

### 5. 空状态显示
expected: 未选择任何文件时（或取消选择），右侧面板应显示空状态提示，而非空白区域。
result: pass

### 6. 大文件截断提示
expected: 打开一个超过 500KB 的文本文件，应只显示前部分内容，底部出现粘性截断提示横条，告知用户文件已被截断。
result: skipped
reason: 用户暂时无法测试

### 7. 纯文本 fallback 渲染
expected: 选择一个无法被识别为代码/Markdown/HTML/图片/视频的文件（如 .log/.csv/.txt），右侧面板应以纯文本形式显示文件内容。
result: pass

### 8. PDF 文件预览
expected: 选择一个 PDF 文件，右侧面板应以合理方式展示 PDF 内容（如渲染预览或提示不支持），而非显示原始二进制数据。
result: issue
reported: "when open pdf, it shows raw PDF binary content like %PDF-1.5 %���� 1 0 obj..."
severity: major

### 9. PDF 发送到聊天
expected: 将 PDF 文件发送到聊天时，应只发送 PDF 文件本身。
result: issue
reported: "when send pdf to chat, it also sends a markdown so there are 2 files being sent"
severity: major

## Summary

total: 9
passed: 4
issues: 3
pending: 0
skipped: 1

## Gaps

- truth: "点击下载按钮应直接触发浏览器文件保存，而非打开新窗口"
  status: failed
  reason: "User reported: when download, it open a new window of browser"
  severity: minor
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "PDF 文件应以合理方式预览（渲染或提示不支持），不应显示原始二进制数据"
  status: failed
  reason: "User reported: when open pdf, it shows raw PDF binary content like %PDF-1.5"
  severity: major
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "PDF 文件发送到聊天时应只发送 PDF 文件本身，不应额外生成 markdown 文件"
  status: failed
  reason: "User reported: when send pdf to chat, it also sends a markdown so there are 2 files being sent"
  severity: major
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
