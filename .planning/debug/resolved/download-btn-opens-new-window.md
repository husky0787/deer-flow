---
status: resolved
trigger: "PreviewHeader 下载按钮点击后打开新窗口而非触发文件下载"
created: 2026-03-06T00:00:00Z
updated: 2026-03-06T04:00:00Z
---

## Current Focus

hypothesis: 下载链接使用了 target="_blank"，导致浏览器在新标签页打开 URL 而非触发下载；同时缺少 download 属性
test: 审查 preview-header.tsx 第 142-149 行的 <a> 标签实现
expecting: 发现 target="_blank" 和缺少 download 属性
next_action: 确认根因并记录

## Symptoms

expected: 点击下载按钮时，浏览器弹出"保存文件"对话框，直接下载文件
actual: 点击下载按钮时，浏览器打开了一个新窗口/标签页来展示文件内容
errors: 无错误信息
reproduction: 在 Preview Panel 中点击 PreviewHeader 右侧的下载图标按钮
started: 自实现以来一直如此

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-06T00:01:00Z
  checked: preview-header.tsx 第 141-150 行
  found: |
    下载按钮实现为：
    ```tsx
    <a href={urlOfArtifact({ filepath, threadId, download: true })} target="_blank">
      <Button variant="ghost" size="icon">
        <DownloadIcon className="size-4" />
      </Button>
    </a>
    ```
    存在两个问题：
    1. `target="_blank"` 强制在新标签页打开链接
    2. <a> 标签没有 `download` 属性，浏览器不知道应该下载而非导航
  implication: 这就是根因 — target="_blank" + 缺少 download 属性

- timestamp: 2026-03-06T00:02:00Z
  checked: core/artifacts/utils.ts — urlOfArtifact 函数
  found: |
    URL 构建正确，传入 download: true 时会附加 ?download=true 查询参数。
    但这个查询参数只对后端有意义（后端可能设置 Content-Disposition: attachment），
    前端的 <a> 标签行为仍由 target 和 download 属性决定。
    即使后端正确返回了 Content-Disposition: attachment 头，
    target="_blank" 也会先打开新窗口再触发下载行为。
  implication: 前端实现有误，不应使用 target="_blank"

## Resolution

root_cause: |
  preview-header.tsx 第 142-145 行，下载按钮的 <a> 标签同时存在两个问题：
  1. **使用了 `target="_blank"`**：强制浏览器在新标签页/窗口中打开链接，而非在当前页面触发下载
  2. **缺少 HTML `download` 属性**：没有 download 属性时，浏览器会尝试导航到该 URL 而非触发下载对话框

  这两个问题共同导致了用户看到的行为：点击下载按钮 -> 打开新窗口显示文件内容。

fix: (待修复)
verification: (待验证)
files_changed: []
