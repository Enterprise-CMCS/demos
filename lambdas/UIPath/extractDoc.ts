import { uipathPostRequest } from "./uipathClient";
import { getExtractorUrl } from "./getExtractorUrl";

export interface ExtractionStartResponse {
  resultUrl: string;
}

export async function extractDoc(token: string, docId: string, projectIdOverride?: string): Promise<string> {
  const asyncUrl = await getExtractorUrl(token, projectIdOverride);
  const extract = await uipathPostRequest<ExtractionStartResponse>(asyncUrl, token, {
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
