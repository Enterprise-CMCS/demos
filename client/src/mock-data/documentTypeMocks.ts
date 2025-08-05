import { MockedResponse } from "@apollo/client/testing";
import { DocumentType } from "demos-server";
import { GET_ALL_DOCUMENT_TYPES } from "queries/document/documentTypeQueries";

const MOCK_DOCUMENT_TYPES: DocumentType[] = [
  { name: "Pre-Submission Concept" },
  { name: "General File" },
  { name: "Budget Neutrality Workbook" },
  { name: "Annual Report" },
  { name: "Other" },
] as DocumentType[];

export const documentTypeMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DOCUMENT_TYPES,
    },
    result: {
      data: {
        documentTypes: MOCK_DOCUMENT_TYPES,
      },
    },
  },
];
