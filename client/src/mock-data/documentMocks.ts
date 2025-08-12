import { DocumentTableRow } from "hooks/useDocument";
import { DOCUMENT_TABLE_QUERY } from "queries/documentQueries";

import { MockedResponse } from "@apollo/client/testing";

export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: DOCUMENT_TABLE_QUERY,
    },
    result: {
      data: {
        documents: [
          {
            id: "1",
            title: "Project Plan",
            description: "Initial project planning document.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Alice",
            },
            createdAt: new Date("2025-07-01"),
          },
          {
            id: "2",
            title: "Final Report",
            description: "Comprehensive final report.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Bob",
            },
            createdAt: new Date("2025-07-10"),
          },
          {
            id: "3",
            title: "Budget Summary",
            description: "Q2 budget breakdown.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Cara",
            },
            createdAt: new Date("2025-07-05"),
          },
          {
            id: "4",
            title: "Technical Specification",
            description: "System specs and integration notes.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "David",
            },
            createdAt: new Date("2025-07-07"),
          },
          {
            id: "5",
            title: "Policy Brief",
            description: "Summary of proposed policy changes.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Ella",
            },
            createdAt: new Date("2025-07-03"),
          },
          {
            id: "6",
            title: "Design Document",
            description: "Wireframes and layout sketches.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Frank",
            },
            createdAt: new Date("2025-07-02"),
          },
          {
            id: "7",
            title: "User Guide",
            description: "Instructions for system users.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Grace",
            },
            createdAt: new Date("2025-07-08"),
          },
          {
            id: "8",
            title: "Meeting Notes",
            description: "Summary of July planning meeting.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Henry",
            },
            createdAt: new Date("2025-07-04"),
          },
          {
            id: "9",
            title: "Test Plan",
            description: "Outline of QA strategy and schedule.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Ivy",
            },
            createdAt: new Date("2025-07-06"),
          },
          {
            id: "10",
            title: "Risk Assessment",
            description: "Identified risks and mitigation steps.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Jack",
            },
            createdAt: new Date("2025-07-09"),
          },
          {
            id: "11",
            title: "Timeline Overview",
            description: "Project timeline and milestones.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Karen",
            },
            createdAt: new Date("2025-07-11"),
          },
          {
            id: "12",
            title: "Contract Draft",
            description: "Initial draft for vendor agreement.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Leo",
            },
            createdAt: new Date("2025-07-12"),
          },
          {
            id: "13",
            title: "Legal Review",
            description: "Legal team's review comments.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Maya",
            },
            createdAt: new Date("2025-07-13"),
          },
          {
            id: "14",
            title: "Presentation Slides",
            description: "Slide deck for stakeholder meeting.",
            documentType: {
              name: "Pre-Submission Concept",
            },
            owner: {
              fullName: "Nina",
            },
            createdAt: new Date("2025-07-14"),
          },
          {
            id: "15",
            title: "Feedback Summary",
            description: "Stakeholder feedback collected in July.",
            documentType: {
              name: "General File",
            },
            owner: {
              fullName: "Owen",
            },
            createdAt: new Date("2025-07-15"),
          },
        ] satisfies DocumentTableRow[],
      },
    },
  },
];
