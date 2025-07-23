import { MockedResponse } from "@apollo/client/testing";
import { GET_ALL_DOCUMENT_TYPES_QUERY } from "hooks/useDocumentType";

export const documentTypeMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DOCUMENT_TYPES_QUERY,
    },
    result: {
      data: {
        documentTypes: [
          { name: "Pre-Submission Concept" },
          { name: "General File" },
        ],
      },
    },
  },
];
