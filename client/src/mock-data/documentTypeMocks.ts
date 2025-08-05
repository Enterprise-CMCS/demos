import { MockedResponse } from "@apollo/client/testing";
import { DocumentTypeOption } from "hooks/useDocumentType";
import { GET_ALL_DOCUMENT_TYPES } from "queries/document/documentTypeQueries";

export const documentTypeMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DOCUMENT_TYPES,
    },
    result: {
      data: {
        documentTypes: [
          { name: "Pre-Submission Concept" },
          { name: "General File" },
          { name: "Budget Neutrality Workbook" },
          { name: "Annual Report" },
          { name: "Other" },
        ] satisfies DocumentTypeOption[],
      },
    },
  },
];
