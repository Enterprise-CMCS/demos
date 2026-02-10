import { Button } from "components/button";
import { fileTypeFromBlob } from "file-type";
import React from "react";

export const DocumentPreview = ({
  presignedDownloadUrl,
  filename,
}: {
  presignedDownloadUrl: string;
  filename: string;
}) => {
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [fileType, setFileType] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const downloadAndAnalyzeFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(presignedDownloadUrl);

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileBlob = await response.blob();
        setBlob(fileBlob);

        const detectedType = await fileTypeFromBlob(fileBlob);
        setFileType(detectedType?.mime ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to download file");
      } finally {
        setLoading(false);
      }
    };

    downloadAndAnalyzeFile();
  }, [presignedDownloadUrl]);

  if (loading) return <div>Loading file...</div>;
  if (error) return <div>Error loading file: {error}</div>;
  if (!blob) return <div>No file available</div>;

  const file = new File([blob], filename, { type: blob.type });
  const blobUrl = URL.createObjectURL(file);

  return fileType == "application/pdf" ? (
    <embed src={blobUrl} className="w-full h-full" />
  ) : (
    <a href={blobUrl} download={filename} rel="noopener noreferrer">
      <Button size="large" name="button-download-file">
        Download File
      </Button>
    </a>
  );
};
