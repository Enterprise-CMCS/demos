import { gql, TypedDocumentNode, useLazyQuery } from "@apollo/client";
import { useTriggerDownload } from "hooks/useTriggerDownload";

// TODO: server support for this query does not exist yet, implemented to
// demonstrate the intended flow between the server and s3. This is likely
// not the intended query
export const DOWNLOAD_FAQ_QUERY: TypedDocumentNode<{
  downloadFAQ: {
    presignedDownloadUrl: string;
  };
}> = gql`
  query DownloadFAQ {
    downloadFAQ {
      presignedDownloadUrl
    }
  }
`;

export const useDownloadFaq = () => {
  const [fetchFaqDownloadUrl] = useLazyQuery(DOWNLOAD_FAQ_QUERY, {
    fetchPolicy: "network-only",
  });
  const { triggerDownload } = useTriggerDownload();

  const downloadFaq = async (): Promise<string> => {
    try {
      const { data: downloadData } = await fetchFaqDownloadUrl();
      const presignedDownloadUrl = downloadData?.downloadFAQ.presignedDownloadUrl;

      if (!presignedDownloadUrl) {
        throw new Error("Missing FAQ download URL.");
      }

      triggerDownload(presignedDownloadUrl);
      return presignedDownloadUrl;
    } catch {
      throw new Error("Unable to download FAQ.");
    }
  };

  return { downloadFaq };
};
