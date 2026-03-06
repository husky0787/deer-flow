"use client";

import { FileTextIcon } from "lucide-react";

import { useWorkspace } from "@/core/workspace";

import { FilePreview } from "./preview/file-preview";

export function RightPanel({ threadId }: { threadId: string }) {
  const { selectedFile } = useWorkspace();

  if (selectedFile === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <FileTextIcon className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">选择文件预览</p>
        </div>
      </div>
    );
  }

  return <FilePreview filepath={selectedFile} threadId={threadId} />;
}
