"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface WorkspaceFile {
  path: string;
  source: "artifact" | "upload";
}

export interface WorkspaceContextType {
  files: WorkspaceFile[];
  setFiles: (files: WorkspaceFile[]) => void;
  selectedFile: string | null;
  autoSelect: boolean;
  selectFile: (path: string, isAutoSelect?: boolean) => void;
  deselectFile: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [files, _setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState(true);

  const setFiles = useCallback((newFiles: WorkspaceFile[]) => {
    _setFiles(newFiles);
  }, []);

  const selectFile = useCallback((path: string, isAutoSelect = false) => {
    setSelectedFile(path);
    if (!isAutoSelect) {
      setAutoSelect(false);
    }
  }, []);

  const deselectFile = useCallback(() => {
    setSelectedFile(null);
    setAutoSelect(true);
  }, []);

  const value = useMemo<WorkspaceContextType>(
    () => ({
      files,
      setFiles,
      selectedFile,
      autoSelect,
      selectFile,
      deselectFile,
    }),
    [files, setFiles, selectedFile, autoSelect, selectFile, deselectFile],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
