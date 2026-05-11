import { TypedDocumentNode, useMutation } from "@apollo/client";

export const useUploadDocument = <UploadDocumentInput>(
  uploadDocumentMutation: TypedDocumentNode
) => {
  const [uploadDocumentTrigger] = useMutation(uploadDocumentMutation);

  const uploadDocument = async (uploadDocumentInput: UploadDocumentInput) => {
    // Get presigned URL from the server
    const uploadDocumentResponse = await uploadDocumentTrigger({
      variables: { input: uploadDocumentInput },
    });

    if (uploadDocumentResponse.errors?.length) {
      throw new Error(uploadDocumentResponse.errors[0].message);
    }

    const uploadResult = uploadDocumentResponse.data?.uploadDocument;
    if (!uploadResult) {
      throw new Error("Upload response from the server was empty");
    }
    return uploadResult;
  };

  return { uploadDocument };
};
