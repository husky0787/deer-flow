---
status: resolved
trigger: "PDF 预览显示原始二进制数据而非渲染内容"
created: 2026-03-06T00:00:00Z
updated: 2026-03-06T04:00:00Z
---

## Current Focus

hypothesis: PDF 文件扩展名不在 extensionMap（代码文件）也不在 IMAGE/VIDEO_EXTENSIONS 中，导致 isPlainText=true，内容被 fetch().text() 拉取后作为纯文本 <pre> 渲染
test: 追踪 file-preview.tsx 中 PDF 文件的分支路径
expecting: PDF 会走到 isPlainText 分支
next_action: 确认根因并返回诊断

## Symptoms

expected: 打开 PDF 文件时应显示渲染的 PDF 内容或友好的"不支持预览"提示
actual: 显示原始二进制数据（%PDF-1.5 %.... 1 0 obj...）
errors: 无 JS 错误，只是渲染不正确
reproduction: 在文件预览面板中打开任意 .pdf 文件
started: 自预览功能实现以来一直存在（PDF 从未被特殊处理）

## Eliminated

（无需消除假设，根因直接可确认）

## Evidence

- timestamp: 2026-03-06
  checked: frontend/src/core/utils/files.tsx - extensionMap
  found: extensionMap 中没有 "pdf" 条目，因此 checkCodeFile("file.pdf") 返回 { isCodeFile: false, language: null }
  implication: PDF 不会被识别为代码文件

- timestamp: 2026-03-06
  checked: frontend/src/components/workspace/preview/file-preview.tsx - IMAGE_EXTENSIONS 和 VIDEO_EXTENSIONS
  found: 两个集合中均无 "pdf"
  implication: PDF 既非图片也非视频

- timestamp: 2026-03-06
  checked: file-preview.tsx 第 148-150 行分支逻辑
  found: isCodeFile=false, isImage=false, isVideo=false => isPlainText=true
  implication: PDF 进入纯文本 fallback 分支

- timestamp: 2026-03-06
  checked: file-preview.tsx 第 48-59 行 usePlainTextContent hook
  found: 使用 fetch + res.text() 获取内容，将二进制 PDF 当作文本读取
  implication: 二进制 PDF 内容被强制转为文本字符串

- timestamp: 2026-03-06
  checked: file-preview.tsx 第 218-222 行渲染
  found: 纯文本 fallback 使用 <pre> 标签直接渲染文本内容
  implication: 用户看到的是 PDF 二进制内容的文本表示

## Resolution

root_cause: file-preview.tsx 的文件类型分支逻辑中完全缺少 PDF 类型处理。PDF 扩展名既不在 extensionMap（代码文件）中，也不在 IMAGE_EXTENSIONS 或 VIDEO_EXTENSIONS 中。这导致 PDF 文件落入 isPlainText=true 的 fallback 分支，被 fetch().text() 以文本方式读取二进制 PDF 数据，然后在 <pre> 标签中原样显示。
fix: 需要添加 PDF 专用分支
verification:
files_changed: []
