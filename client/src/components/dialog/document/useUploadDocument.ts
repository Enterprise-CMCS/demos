import { TypedDocumentNode, useMutation } from "@apollo/client";


export const useUploadDocument = <UploadDocumentResult, UploadDocumentInput>(
  uploadDocumentMutation: TypedDocumentNode<UploadDocumentResult, { input: UploadDocumentInput }>
) => {
  const [uploadDocumentTrigger] = useMutation(uploadDocumentMutation);

  const uploadDocument = async (uploadDocumentInput: UploadDocumentInput) => {
    // Get presigned URL from the server
    const uploadResult = await uploadDocumentTrigger({
      variables: { input: uploadDocumentInput },
    });

    if (uploadResult.errors?.length) {
      throw new Error(uploadResult.errors[0].message);
    }

    if (!uploadResult.data) {
      throw new Error("Upload response from the server was empty");
    }
    return uploadResult.data;
  };

  return { uploadDocument };
};
