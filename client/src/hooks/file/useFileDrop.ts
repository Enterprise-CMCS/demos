import { useCallback } from "react";

/**
 * useFileDrop - drag-and-drop hook for files only.
 * Returns drag-over and drop handlers.
 * Pass a callback to receive FileList.
 */
export function useFileDrop(onFiles: (files: FileList) => void) {
  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  return { handleDragOver, handleDrop };
}
