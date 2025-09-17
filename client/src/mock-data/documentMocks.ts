import { Document, DocumentType } from "demos-server";
import { MockUser, mockUsers } from "./userMocks";

export type MockDocument = Pick<Document, "id" | "title" | "description" | "createdAt"> & {
  documentType: DocumentType;
  owner: MockUser;
  __typename: "Document";
};

export const mockDocuments = [
  {
    __typename: "Document",
    id: "1",
    title: "Project Plan",
    description: "Initial project planning document.",
    documentType: "Pre-Submission",
    owner: mockUsers[5],
    createdAt: new Date(2025, 0, 1),
  },
  {
    __typename: "Document",
    id: "2",
    title: "Final Report",
    description: "Comprehensive final report.",
    documentType: "Signed Decision Memo",
    owner: mockUsers[4],
    createdAt: new Date(2025, 0, 2),
  },
  {
    __typename: "Document",
    id: "3",
    title: "Budget Summary",
    description: "Q2 budget breakdown.",
    documentType: "Payment Ratio Analysis",
    owner: mockUsers[8],
    createdAt: new Date(2025, 0, 3),
  },
  {
    __typename: "Document",
    id: "4",
    title: "Meeting Minutes",
    description: "Minutes from the July stakeholder meeting.",
    documentType: "General File",
    owner: mockUsers[7],
    createdAt: new Date(2025, 0, 4),
  },
] as const satisfies MockDocument[];
