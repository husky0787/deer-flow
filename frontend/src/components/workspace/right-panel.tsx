"use client";

import { FileTextIcon } from "lucide-react";

export function RightPanel() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <FileTextIcon className="size-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">选择文件预览</p>
      </div>
    </div>
  );
}
