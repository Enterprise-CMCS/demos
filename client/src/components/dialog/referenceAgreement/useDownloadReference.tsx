import { gql, TypedDocumentNode, useLazyQuery } from "@apollo/client";
import { useToast } from "components/toast";

const triggerReferenceDownload = (url: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DOWNLOAD_REFERENCE_QUERY: TypedDocumentNode<
  {
    referenceDownloadUrl: string;
  },
  {
    id: string;
    acceptedAgreementId?: string;
  }
> = gql`
  query DownloadReference($id: ID!, $acceptedAgreementId: ID!) {
    referenceDownloadUrl(id: $id, acceptedAgreementId: $acceptedAgreementId)
  }
`;

const DOWNLOAD_REFERENCE_AGREEMENT_QUERY: TypedDocumentNode<
  {
    referenceAgreementDownloadUrl: string;
  },
  {
    id: string;
  }
> = gql`
  query DownloadReferenceAgreement($id: ID!) {
    referenceAgreementDownloadUrl(id: $id)
  }
`;

export const useDownloadReference = () => {
  const { showError } = useToast();
  const [fetchReferenceDownloadUrl] = useLazyQuery(DOWNLOAD_REFERENCE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [fetchReferenceAgreementDownloadUrl] = useLazyQuery(DOWNLOAD_REFERENCE_AGREEMENT_QUERY, {
    fetchPolicy: "network-only",
  });

  const downloadReference = async ({
    id,
    acceptedAgreementId,
  }: {
    id: string;
    acceptedAgreementId?: string;
  }): Promise<string> => {
    try {
      const { data, error } = await fetchReferenceDownloadUrl({
        variables: { id, acceptedAgreementId },
      });
      const presignedDownloadUrl = data?.referenceDownloadUrl;

      if (error || !presignedDownloadUrl) {
        throw new Error("Missing Reference download URL.");
      }

      triggerReferenceDownload(presignedDownloadUrl);
      return presignedDownloadUrl;
    } catch {
      showError("Unable to download Reference.");
      throw new Error("Unable to download Reference.");
    }
  };

  const downloadReferenceAgreement = async ({ id }: { id: string }): Promise<string> => {
    try {
      const { data, error } = await fetchReferenceAgreementDownloadUrl({
        variables: { id },
      });
      const presignedDownloadUrl = data?.referenceAgreementDownloadUrl;

      if (error || !presignedDownloadUrl) {
        throw new Error("Missing Reference download URL.");
      }

      triggerReferenceDownload(presignedDownloadUrl);
      return presignedDownloadUrl;
    } catch {
      showError("Unable to download Reference.");
      throw new Error("Unable to download Reference.");
    }
  };

  return { downloadReference, downloadReferenceAgreement };
};
