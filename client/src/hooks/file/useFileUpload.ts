import { useState } from "react";

export const useFileUpload = ({
  allowedMimeTypes,
  maxFileSizeBytes,
  onSuccess,
  onError,
}: {
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  onSuccess?: (file: File) => void;
  onError?: (error: string) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) return;

    if (!allowedMimeTypes.includes(selected.type)) {
      setError("File type not allowed.");
      setFile(null);
      onError?.("File type not allowed.");
      return;
    }

    if (selected.size > maxFileSizeBytes) {
      setError("File is too large.");
      setFile(null);
      onError?.("File is too large.");
      return;
    }

    setError("");
    e.target.value = ""; // Allow same file to be reselected
    setFile(selected);
    setUploadStatus("uploading");
    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onloadend = () => {
      setUploadProgress(100);
      setUploadStatus("success");
      onSuccess?.(selected);
    };

    reader.onerror = () => {
      setUploadStatus("error");
      setError("Error reading file.");
      onError?.("Error reading file.");
    };

    reader.readAsArrayBuffer(selected);
  };

  return {
    file,
    setFile,
    error,
    setError,
    uploadProgress,
    uploadStatus,
    setUploadProgress,
    setUploadStatus,
    handleFileChange,
  };
};
