import { MockedResponse } from "@apollo/client/testing";
import { DOCUMENT_TABLE_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import documentData from "faker_data/documents.json";
export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: DOCUMENT_TABLE_QUERY,
    },
    result: {
      data: {
        documents: documentData,
      },
    },
  },
];
