import gql from "graphql-tag";

export const LOCAL_UPLOAD_PREFIX = "LocalS3Adapter";

export const DOCUMENT_EXISTS_QUERY = gql`
  query DocumentExists($documentId: ID!) {
    documentExists(documentId: $documentId)
  }
`;

export const tryUploadingFileToS3 = async (
  presignedURL: string,
  file: File
): Promise<{ success: boolean; errorMessage: string }> => {
  if (presignedURL.startsWith(LOCAL_UPLOAD_PREFIX)) {
    return { success: true, errorMessage: "" };
  }
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
