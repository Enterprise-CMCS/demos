import { uipathGetRequest } from "./uipathClient";

export interface ExtractionStatus {
  status: string;
  [key: string]: unknown;
}

export async function fetchExtractionResult(token: string, resultUrl: string): Promise<ExtractionStatus> {
  const response = await uipathGetRequest<ExtractionStatus>(resultUrl, token);
  return response.data;
}
