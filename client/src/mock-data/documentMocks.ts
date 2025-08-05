import dayjs from "dayjs";
import { DocumentTableRow } from "hooks/useDocument";
import { GET_ALL_DOCUMENTS_QUERY } from "queries/document/documentQueries";

import { MockedResponse } from "@apollo/client/testing";

export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DOCUMENTS_QUERY,
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
            createdAt: dayjs("2025-07-01").toISOString(),
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
            createdAt: dayjs("2025-07-10").toISOString(),
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
            createdAt: dayjs("2025-07-05").toISOString(),
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
            createdAt: dayjs("2025-07-07").toISOString(),
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
            createdAt: dayjs("2025-07-03").toISOString(),
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
            createdAt: dayjs("2025-07-02").toISOString(),
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
            createdAt: dayjs("2025-07-08").toISOString(),
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
            createdAt: dayjs("2025-07-04").toISOString(),
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
            createdAt: dayjs("2025-07-06").toISOString(),
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
            createdAt: dayjs("2025-07-09").toISOString(),
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
            createdAt: dayjs("2025-07-11").toISOString(),
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
            createdAt: dayjs("2025-07-12").toISOString(),
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
            createdAt: dayjs("2025-07-13").toISOString(),
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
            createdAt: dayjs("2025-07-14").toISOString(),
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
            createdAt: dayjs("2025-07-15").toISOString(),
          },
        ] satisfies DocumentTableRow[],
      },
    },
  },
];
