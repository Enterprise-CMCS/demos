import { MockedResponse } from "@apollo/client/testing";
import documentData from "faker_data/documents.json";
import { GET_ALL_DOCUMENTS_QUERY } from "hooks/useDocuments";
export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DOCUMENTS_QUERY,
    },
    result: {
      data: {
        documents: documentData,
      },
    },
  },
];
