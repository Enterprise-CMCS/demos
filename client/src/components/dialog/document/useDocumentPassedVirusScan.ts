import { useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";

export const VIRUS_SCAN_MAX_ATTEMPTS = 10;
export const DOCUMENT_POLL_INTERVAL_MS = 2_000;

export const DOCUMENT_EXISTS_QUERY = gql`
  query DocumentExists($documentId: ID!) {
    documentExists(documentId: $documentId)
  }
`;

export const APPLY_DOCUMENT_TITLE_METADATA_MUTATION = gql`
  mutation ApplyDocumentTitleMetadata($documentId: ID!) {
    applyDocumentTitleMetadata(documentId: $documentId)
  }
`;

export const useDocumentPassedVirusScan = () => {
  const [checkDocumentExists] = useLazyQuery(DOCUMENT_EXISTS_QUERY, {
    fetchPolicy: "network-only",
  });
  const [applyDocumentTitleMetadata] = useMutation(APPLY_DOCUMENT_TITLE_METADATA_MUTATION);

  const documentPassedVirusScan = async (documentId: string): Promise<boolean> => {
    for (let attempt = 0; attempt < VIRUS_SCAN_MAX_ATTEMPTS; attempt++) {
      // Check if the document exists in the documents table
      const { data } = await checkDocumentExists({
        variables: { documentId },
      });
      if (data?.documentExists === true) {
        // First point the file exists in the clean bucket, so stamp its PDF title here.
        try {
          await applyDocumentTitleMetadata({ variables: { documentId } });
        } catch {
          // Cosmetic only — never block the upload on this.
        }
        return true;
      }

      // Wait before the next attempt
      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_INTERVAL_MS));
    }

    // Not appearing in the document for this much time is signal of failing the virus scan
    return false;
  };

  return { documentPassedVirusScan };
};
