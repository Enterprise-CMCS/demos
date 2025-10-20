import { Document, DocumentType } from "demos-server";
import { MockUser, mockUsers } from "./userMocks";

export type MockDocument = Pick<
  Document,
  "id" | "name" | "description" | "createdAt" | "phaseName"
> & {
  documentType: DocumentType;
  owner: MockUser;
};

export const mockDocuments = [
  {
    id: "1",
    name: "Project Plan",
    description: "Initial project planning document.",
    documentType: "Pre-Submission",
    owner: mockUsers[5],
    createdAt: new Date(2025, 0, 1),
    phaseName: "SDG Preparation",
  },
  {
    id: "2",
    name: "Final Report",
    description: "Comprehensive final report.",
    documentType: "Signed Decision Memo",
    owner: mockUsers[4],
    createdAt: new Date(2025, 0, 2),
    phaseName: "Application Intake",
  },
  {
    id: "3",
    name: "Budget Summary",
    description: "Q2 budget breakdown.",
    documentType: "Payment Ratio Analysis",
    owner: mockUsers[8],
    createdAt: new Date(2025, 0, 3),
    phaseName: "Federal Comment",
  },
  {
    id: "4",
    name: "Meeting Minutes",
    description: "Minutes from the July stakeholder meeting.",
    documentType: "General File",
    owner: mockUsers[7],
    createdAt: new Date(2025, 0, 4),
    phaseName: "Federal Comment",
  },
] as const satisfies MockDocument[];
