import { MockedResponse } from "@apollo/client/testing";
import { DocumentTypeOption } from "hooks/useDocumentType";
import { DOCUMENT_TYPE_OPTIONS_QUERY } from "queries/documentTypeQueries";

export const documentTypeMocks: MockedResponse[] = [
  {
    request: {
      query: DOCUMENT_TYPE_OPTIONS_QUERY,
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
