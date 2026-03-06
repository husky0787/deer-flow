"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BundledLanguage } from "shiki";
import { Streamdown } from "streamdown";

import { CodeBlock } from "@/components/ai-elements/code-block";
import { useThread } from "@/components/workspace/messages/context";
import { useArtifactContent } from "@/core/artifacts/hooks";
import { urlOfArtifact } from "@/core/artifacts/utils";
import { streamdownPlugins } from "@/core/streamdown";
import {
  checkCodeFile,
  getFileExtension,
} from "@/core/utils/files";

import { PreviewHeader } from "./preview-header";
import { PreviewSkeleton } from "./preview-skeleton";

// ---------- constants ----------

/** 超过 500KB 的文本内容触发截断 */
const MAX_TEXT_SIZE = 500 * 1024;
/** 截断后显示的字符数 */
const TRUNCATE_DISPLAY_CHARS = 50_000;

// ---------- helpers ----------

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "heic",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4", "mov", "m4v",
]);

function isImageFile(ext: string) {
  return IMAGE_EXTENSIONS.has(ext);
}

function isVideoFile(ext: string) {
  return VIDEO_EXTENSIONS.has(ext);
}

const PDF_EXTENSIONS = new Set(["pdf"]);

function isPdfFile(ext: string) {
  return PDF_EXTENSIONS.has(ext);
}

// ---------- plain-text hook ----------

function usePlainTextContent(url: string, enabled: boolean) {
  return useQuery({
    queryKey: ["plain-text", url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      return res.text();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------- VideoPreview ----------

function VideoPreview({
  src,
  filepath,
}: {
  src: string;
  filepath: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load(); // 释放已缓冲的数据
      }
    };
  }, [filepath]);

  return (
    <div className="flex size-full items-center justify-center p-4">
      <video
        ref={videoRef}
        src={src}
        controls
        muted
        playsInline
        className="max-h-full max-w-full"
      />
    </div>
  );
}

// ---------- component ----------

export function FilePreview({
  filepath,
  threadId,
}: {
  filepath: string;
  threadId: string;
}) {
  const { isMock } = useThread();

  // Determine file type
  const isSkillFile = filepath.endsWith(".skill");
  const { isCodeFile, language: rawLanguage } = useMemo(() => {
    if (isSkillFile) {
      return { isCodeFile: true, language: "markdown" };
    }
    return checkCodeFile(filepath);
  }, [filepath, isSkillFile]);

  const language = rawLanguage ?? "text";

  const isSupportPreview = useMemo(() => {
    return language === "markdown" || language === "html";
  }, [language]);

  // View mode
  const [viewMode, setViewMode] = useState<"code" | "preview">(
    isSupportPreview ? "preview" : "code",
  );

  useEffect(() => {
    setViewMode(isSupportPreview ? "preview" : "code");
  }, [isSupportPreview]);

  // Load text content for code files
  const { content, isLoading } = useArtifactContent({
    threadId,
    filepath,
    enabled: isCodeFile,
  });

  // 大文件截断（代码文件）
  const isCodeTruncated =
    content != null && content.length > MAX_TEXT_SIZE;
  const displayContent = isCodeTruncated
    ? content.slice(0, TRUNCATE_DISPLAY_CHARS)
    : (content ?? "");

  // For non-code, non-image, non-video files: plain text fallback
  const ext = getFileExtension(filepath);
  const isImage = !isCodeFile && isImageFile(ext);
  const isVideo = !isCodeFile && !isImage && isVideoFile(ext);
  const isPdf = !isCodeFile && !isImage && !isVideo && isPdfFile(ext);
  const isPlainText = !isCodeFile && !isImage && !isVideo && !isPdf;

  const artifactUrl = urlOfArtifact({ filepath, threadId, isMock });

  const { data: plainText, isLoading: isPlainTextLoading } =
    usePlainTextContent(artifactUrl, isPlainText);

  // 大文件截断（纯文本）
  const isPlainTruncated =
    plainText != null && plainText.length > MAX_TEXT_SIZE;
  const displayPlainText = isPlainTruncated
    ? plainText.slice(0, TRUNCATE_DISPLAY_CHARS)
    : (plainText ?? "");

  const isTruncated = isCodeTruncated || isPlainTruncated;

  // Determine overall loading state
  const showSkeleton =
    (isCodeFile && isLoading) || (isPlainText && isPlainTextLoading);

  return (
    <div className="flex h-full flex-col">
      <PreviewHeader
        filepath={filepath}
        threadId={threadId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSupportPreview={isSupportPreview}
        content={isCodeFile ? (displayContent as string | null) : null}
      />

      <div className="relative min-h-0 flex-1 overflow-auto">
        {showSkeleton ? (
          <PreviewSkeleton />
        ) : isCodeFile ? (
          isSupportPreview && viewMode === "preview" ? (
            language === "markdown" ? (
              <div className="size-full px-4">
                <Streamdown
                  className="size-full"
                  {...streamdownPlugins}
                >
                  {displayContent as string}
                </Streamdown>
              </div>
            ) : language === "html" ? (
              <iframe
                className="size-full"
                src={artifactUrl}
              />
            ) : null
          ) : (
            <CodeBlock
              code={displayContent as string}
              language={language as BundledLanguage}
              showLineNumbers
            />
          )
        ) : isImage ? (
          <div className="flex size-full items-center justify-center p-4">
            <img
              src={artifactUrl}
              alt={filepath}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : isVideo ? (
          <VideoPreview src={artifactUrl} filepath={filepath} />
        ) : isPdf ? (
          <iframe
            className="size-full"
            src={artifactUrl}
            title={getFileExtension(filepath).toUpperCase() + " preview"}
          />
        ) : isPlainText ? (
          <pre className="whitespace-pre-wrap p-4 font-mono text-sm">
            {displayPlainText}
          </pre>
        ) : (
          <div className="flex size-full items-center justify-center p-4 text-sm text-muted-foreground">
            不支持预览此文件格式
          </div>
        )}

        {isTruncated && (
          <div className="sticky bottom-0 flex items-center justify-center border-t bg-muted/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            文件过大，仅显示前 {TRUNCATE_DISPLAY_CHARS.toLocaleString()} 字符
          </div>
        )}
      </div>
    </div>
  );
}
