"use client";

import {
  Code2Icon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  LoaderIcon,
  PackageIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/workspace/tooltip";
import { urlOfArtifact } from "@/core/artifacts/utils";
import { useI18n } from "@/core/i18n/hooks";
import { installSkill } from "@/core/skills/api";
import { checkCodeFile, getFileIcon, getFileName } from "@/core/utils/files";
import { env } from "@/env";

export function PreviewHeader({
  filepath,
  threadId,
  viewMode,
  onViewModeChange,
  isSupportPreview,
  content,
}: {
  filepath: string;
  threadId: string;
  viewMode: "code" | "preview";
  onViewModeChange: (mode: "code" | "preview") => void;
  isSupportPreview: boolean;
  content: string | null;
}) {
  const { t } = useI18n();
  const { isCodeFile } = checkCodeFile(filepath);
  const isSkillFile = filepath.endsWith(".skill");
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallSkill = useCallback(async () => {
    if (isInstalling) return;

    setIsInstalling(true);
    try {
      const result = await installSkill({
        thread_id: threadId,
        path: filepath,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message ?? "Failed to install skill");
      }
    } catch (error) {
      console.error("Failed to install skill:", error);
      toast.error("Failed to install skill");
    } finally {
      setIsInstalling(false);
    }
  }, [threadId, filepath, isInstalling]);

  return (
    <div className="flex h-12 shrink-0 items-center border-b px-3">
      {/* Left: file icon + name */}
      <div className="flex min-w-0 items-center gap-2">
        {getFileIcon(filepath, "size-4 shrink-0")}
        <span className="truncate text-sm font-medium">
          {getFileName(filepath)}
        </span>
      </div>

      {/* Center: code/preview toggle */}
      <div className="flex min-w-0 grow items-center justify-center">
        {isSupportPreview && (
          <ToggleGroup
            className="mx-auto"
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={(value) => {
              if (value) {
                onViewModeChange(value as "code" | "preview");
              }
            }}
          >
            <ToggleGroupItem value="code">
              <Code2Icon />
            </ToggleGroupItem>
            <ToggleGroupItem value="preview">
              <EyeIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        {isSkillFile && (
          <Tooltip content={t.toolCalls.skillInstallTooltip}>
            <Button
              variant="ghost"
              size="icon"
              disabled={
                isInstalling ||
                env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"
              }
              onClick={handleInstallSkill}
            >
              {isInstalling ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <PackageIcon className="size-4" />
              )}
            </Button>
          </Tooltip>
        )}
        {isCodeFile && (
          <Tooltip content={t.clipboard.copyToClipboard}>
            <Button
              variant="ghost"
              size="icon"
              disabled={!content}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(content ?? "");
                  toast.success(t.clipboard.copiedToClipboard);
                } catch (error) {
                  toast.error(t.clipboard.failedToCopyToClipboard);
                  console.error(error);
                }
              }}
            >
              <CopyIcon className="size-4" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={t.common.download}>
          <a
            href={urlOfArtifact({ filepath, threadId, download: true })}
            download={getFileName(filepath)}
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon">
              <DownloadIcon className="size-4" />
            </Button>
          </a>
        </Tooltip>
      </div>
    </div>
  );
}
