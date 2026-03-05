"use client";

import { DownloadIcon, LoaderIcon, PackageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlOfArtifact } from "@/core/artifacts/utils";
import { useI18n } from "@/core/i18n/hooks";
import { installSkill } from "@/core/skills/api";
import {
  getFileExtensionDisplayName,
  getFileIcon,
  getFileName,
} from "@/core/utils/files";
import { useWorkspace } from "@/core/workspace";
import { cn } from "@/lib/utils";

export function LeftPanel({ threadId }: { threadId: string }) {
  const { t } = useI18n();
  const { files, selectedFile, selectFile } = useWorkspace();
  const [installingFile, setInstallingFile] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const handleInstallSkill = useCallback(
    async (e: React.MouseEvent, filepath: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (installingFile) return;

      setInstallingFile(filepath);
      try {
        const result = await installSkill({
          thread_id: threadId,
          path: filepath,
        });
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message || "Failed to install skill");
        }
      } catch (error) {
        console.error("Failed to install skill:", error);
        toast.error("Failed to install skill");
      } finally {
        setInstallingFile(null);
      }
    },
    [threadId, installingFile],
  );

  useEffect(() => {
    if (selectedFile) {
      itemRefs.current
        .get(selectedFile)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedFile]);

  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        暂无文件
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2 p-2">
      {files.map((file) => (
        <Card
          key={file.path}
          className={cn(
            "relative cursor-pointer p-3 transition-colors",
            selectedFile === file.path
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "hover:bg-muted/50",
          )}
          ref={(el) => {
            if (el) itemRefs.current.set(file.path, el);
            else itemRefs.current.delete(file.path);
          }}
          onClick={() => selectFile(file.path)}
        >
          <CardHeader className="pr-2 pl-1">
            <CardTitle className="relative pl-8 text-sm">
              <div>{getFileName(file.path)}</div>
              <div className="absolute top-2 -left-0.5">
                {getFileIcon(file.path, "size-5")}
              </div>
            </CardTitle>
            <CardDescription className="pl-8 text-xs">
              {getFileExtensionDisplayName(file.path)} file
            </CardDescription>
            <CardAction>
              {file.path.endsWith(".skill") && (
                <Button
                  variant="ghost"
                  disabled={installingFile === file.path}
                  onClick={(e) => handleInstallSkill(e, file.path)}
                >
                  {installingFile === file.path ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <PackageIcon className="size-4" />
                  )}
                  {t.common.install}
                </Button>
              )}
              <a
                href={urlOfArtifact({
                  filepath: file.path,
                  threadId: threadId,
                  download: true,
                })}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost">
                  <DownloadIcon className="size-4" />
                  {t.common.download}
                </Button>
              </a>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </ul>
  );
}
