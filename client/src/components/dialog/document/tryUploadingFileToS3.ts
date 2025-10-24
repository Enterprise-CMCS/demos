export interface S3UploadResponse {
  success: boolean;
  errorMessage: string;
}

/**
 * @internal - Exported for testing only
 */
export const tryUploadingFileToS3 = async (
  presignedURL: string,
  file: File
): Promise<S3UploadResponse> => {
  try {
    const putResponse = await fetch(presignedURL, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (putResponse.ok) {
      return { success: true, errorMessage: "" };
    } else {
      const errorText = await putResponse.text();
      return { success: false, errorMessage: `Failed to upload file: ${errorText}` };
    }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "Network error during upload";
    return { success: false, errorMessage: errorText };
  }
};
