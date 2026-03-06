---
status: resolved
trigger: "PDF 发送到聊天时产生 2 个文件 - 同时发送 PDF 和 markdown"
created: 2026-03-06T00:00:00Z
updated: 2026-03-06T04:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - 后端上传 PDF 时自动转换为 markdown 并存入同目录，UploadsMiddleware 遍历目录时把 .md 文件也当作新上传文件注入到消息中
test: 阅读完整代码链路确认
expecting: N/A - 已确认
next_action: 报告根因

## Symptoms

expected: 用户将 PDF 发送到聊天时，只发送 PDF 文件
actual: 系统同时发送了一个 PDF 和一个 markdown 文件
errors: 无错误消息，功能行为不符合预期
reproduction: 将 PDF 文件发送到聊天
started: 未知

## Eliminated

## Evidence

- timestamp: 2026-03-06T00:00:30Z
  checked: backend/src/gateway/routers/uploads.py - 上传路由
  found: |
    CONVERTIBLE_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".xls", ".xlsx", ".doc", ".docx"}
    上传 PDF 时调用 convert_file_to_markdown(file_path) 使用 markitdown 库将 PDF 转为 .md 文件
    .md 文件保存到与原始文件相同的 uploads 目录
    file_info 中添加 markdown_file, markdown_path, markdown_virtual_path, markdown_artifact_url 字段
  implication: 后端设计上就会在 uploads 目录中产生两个文件（原始PDF + 转换后的.md）

- timestamp: 2026-03-06T00:00:40Z
  checked: backend/src/agents/middlewares/uploads_middleware.py - 上传中间件
  found: |
    _list_newly_uploaded_files() 遍历 uploads_dir 中所有文件
    过滤条件只检查 file_path.name not in last_message_files (即之前消息中已展示过的文件)
    没有任何逻辑来排除 .md 转换文件 -- 它把目录中所有文件都当作用户上传的文件
  implication: .md 转换文件被视为独立的"新上传文件"注入到消息中

- timestamp: 2026-03-06T00:00:50Z
  checked: frontend/src/core/messages/utils.ts - parseUploadedFiles()
  found: |
    前端解析 <uploaded_files> 标签中的文件列表
    格式为 "- filename (size)\n  Path: /path/to/file"
    每个解析到的文件都会在 UI 中显示为一个文件卡片
  implication: 前端忠实渲染后端注入的所有文件，包括 .md 转换文件

- timestamp: 2026-03-06T00:00:55Z
  checked: frontend/src/components/workspace/messages/message-list-item.tsx - UploadedFilesList
  found: |
    每个 UploadedFile 渲染为一个卡片 (UploadedFileCard)
    FILE_TYPE_MAP 中同时包含 "pdf": "PDF" 和 "md": "Markdown"
    两个文件都会各自渲染一个卡片
  implication: 用户看到 2 个文件卡片: 一个 PDF 卡片 + 一个 Markdown 卡片

## Resolution

root_cause: |
  后端上传 API (uploads.py) 在上传 PDF 时会自动调用 markitdown 将 PDF 转换为 .md 文件，
  并将两个文件都保存在 uploads 目录中。随后 UploadsMiddleware._list_newly_uploaded_files()
  遍历 uploads 目录时，不区分"用户原始上传的文件"和"系统自动转换生成的文件"，
  导致 .md 转换文件也被当作新上传文件注入到消息的 <uploaded_files> 标签中。
  前端忠实渲染 <uploaded_files> 中的所有文件，因此用户看到 2 个文件。

fix:
verification:
files_changed: []
