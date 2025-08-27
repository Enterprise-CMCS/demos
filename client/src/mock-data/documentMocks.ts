import { DOCUMENT_TABLE_QUERY } from "queries/documentQueries";

import { MockedResponse } from "@apollo/client/testing";
import { Document, DocumentType } from "demos-server";
import { MockUser, mockUsers } from "./userMocks";

export type MockDocument = Pick<Document, "id" | "title" | "description" | "createdAt"> & {
  documentType: DocumentType;
  owner: MockUser;
};

export const mockDocuments: MockDocument[] = [
  {
    id: "1",
    title: "Project Plan",
    description: "Initial project planning document.",
    documentType: "generalFile",
    owner: mockUsers[5],
    createdAt: new Date("2025-07-01"),
  },
  {
    id: "2",
    title: "Final Report",
    description: "Comprehensive final report.",
    documentType: "preSubmissionConcept",
    owner: mockUsers[4],
    createdAt: new Date("2025-07-10"),
  },
  {
    id: "3",
    title: "Budget Summary",
    description: "Q2 budget breakdown.",
    documentType: "generalFile",
    owner: mockUsers[8],
    createdAt: new Date("2025-07-05"),
  },
  {
    id: "4",
    title: "Meeting Minutes",
    description: "Minutes from the July stakeholder meeting.",
    documentType: "preSubmissionConcept",
    owner: mockUsers[7],
    createdAt: new Date("2025-07-15"),
  },
];

export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: DOCUMENT_TABLE_QUERY,
    },
    result: {
      data: {
        documents: mockDocuments,
      },
    },
  },
];
