"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import type { BundledLanguage } from "shiki";

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

  const displayContent = content ?? "";

  // For non-code, non-image, non-video files: plain text fallback
  const ext = getFileExtension(filepath);
  const isImage = !isCodeFile && isImageFile(ext);
  const isVideo = !isCodeFile && isVideoFile(ext);
  const isPlainText = !isCodeFile && !isImage && !isVideo;

  const artifactUrl = urlOfArtifact({ filepath, threadId, isMock });

  const { data: plainText, isLoading: isPlainTextLoading } =
    usePlainTextContent(artifactUrl, isPlainText);

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

      <div className="min-h-0 flex-1 overflow-auto">
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artifactUrl}
              alt={filepath}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : isVideo ? (
          <div className="flex size-full items-center justify-center p-4">
            <video
              src={artifactUrl}
              controls
              muted
              playsInline
              className="max-h-full max-w-full"
            />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap p-4 font-mono text-sm">
            {plainText ?? ""}
          </pre>
        )}
      </div>
    </div>
  );
}
