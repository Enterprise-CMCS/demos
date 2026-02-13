import axios from "axios";
import { UIPATH_API_VERSION } from "./uipathClient";

export interface ExtractionStatus {
  status: string;
  [key: string]: unknown;
}

export async function fetchExtractionResult(token: string, resultUrl: string): Promise<ExtractionStatus> {
  const response = await axios.get<ExtractionStatus>(resultUrl, {
     headers: {
          Authorization: `Bearer ${token}`,
      },
      params: {
        "api-version": UIPATH_API_VERSION,
      },
  });
  return response.data;
}
