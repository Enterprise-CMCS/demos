import axios from "axios";

export interface ExtractionStatus {
  status: string;
  [key: string]: unknown;
}

export async function fetchExtractionResult(token: string, resultUrl: string): Promise<ExtractionStatus> {
  const response = await axios.get<ExtractionStatus>(resultUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
