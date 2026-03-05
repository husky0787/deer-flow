"use client";

import { useEffect, useMemo } from "react";

import { useUploadedFiles } from "@/core/uploads";

import { useWorkspace, type WorkspaceFile } from "./context";

export function useWorkspaceFiles(threadId: string, artifacts: string[]) {
  const { setFiles, selectedFile, autoSelect, selectFile } = useWorkspace();
  const { data: uploadsData } = useUploadedFiles(threadId);

  const mergedFiles = useMemo<WorkspaceFile[]>(() => {
    const artifactFiles: WorkspaceFile[] = (artifacts ?? []).map((path) => ({
      path,
      source: "artifact" as const,
    }));
    const uploadFiles: WorkspaceFile[] = (uploadsData?.files ?? []).map(
      (f) => ({
        path: f.virtual_path,
        source: "upload" as const,
      }),
    );

    const seen = new Set<string>();
    return [...artifactFiles, ...uploadFiles]
      .filter((f) => {
        if (seen.has(f.path)) return false;
        seen.add(f.path);
        return true;
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [artifacts, uploadsData?.files]);

  useEffect(() => {
    setFiles(mergedFiles);
  }, [mergedFiles, setFiles]);

  useEffect(() => {
    if (!autoSelect || artifacts.length === 0) return;
    const latest = artifacts.at(-1);
    if (latest && latest !== selectedFile) {
      selectFile(latest, true);
    }
  }, [artifacts, autoSelect, selectedFile, selectFile]);

  return mergedFiles;
}
