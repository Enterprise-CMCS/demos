import { Document } from "demos-server";
import { developmentMockUser } from "./userMocks";
import { mockDemonstration } from "./demonstrationMocks";

const mockDocument: Document = {
  id: "1",
  name: "Project Plan",
  description: "Initial project planning document.",
  documentType: "Pre-Submission",
  owner: developmentMockUser,
  createdAt: new Date(2025, 0, 1),
  updatedAt: new Date(2025, 0, 1),
  phaseName: "SDG Preparation",
  s3Path: "s3://mock-bucket/project-plan.pdf",
  presignedDownloadUrl: "https://mock-s3-url.com/project-plan.pdf",
  downloadFileName: "project-plan.pdf",
  hasPendingUIPathResult: false,
  application: mockDemonstration,
};

export const mockDocuments: Document[] = [
  {
    ...mockDocument,
  },
  // {
  //   id: "2",
  //   name: "Final Report",
  //   description: "Comprehensive final report.",
  //   documentType: "Signed Decision Memo",
  //   owner: mockUsers[4],
  //   createdAt: new Date(2025, 0, 2),
  //   phaseName: "Application Intake",
  // },
  // {
  //   id: "3",
  //   name: "Budget Summary",
  //   description: "Q2 budget breakdown.",
  //   documentType: "Payment Ratio Analysis",
  //   owner: mockUsers[8],
  //   createdAt: new Date(2025, 0, 3),
  //   phaseName: "Federal Comment",
  // },
  // {
  //   id: "4",
  //   name: "Meeting Minutes",
  //   description: "Minutes from the July stakeholder meeting.",
  //   documentType: "General File",
  //   owner: mockUsers[7],
  //   createdAt: new Date(2025, 0, 4),
  //   phaseName: "Federal Comment",
  // },
];
