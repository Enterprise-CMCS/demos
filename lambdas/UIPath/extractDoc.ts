import { documentUnderstandingPost } from "./uipathClient";
import { getExtractorUrl } from "./getExtractorUrl";

export interface ExtractionStartResponse {
  resultUrl: string;
}

export async function extractDoc(token: string, docId: string): Promise<string> {
  const asyncUrl = await getExtractorUrl(token);
  const extract = await documentUnderstandingPost<ExtractionStartResponse>(asyncUrl, token, {
    documentId: docId,
    pageRange: null,
    configuration: null,
  });

  const resultUrl = extract.data.resultUrl;
  if (!resultUrl) {
    throw new Error("UiPath extraction did not return a resultUrl.");
  }
  return resultUrl;
}
