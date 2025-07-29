import { MockedResponse } from "@apollo/client/testing";
import { DocumentTableRow } from "hooks/useDocument";
import { DOCUMENT_TABLE_QUERY } from "queries/documentQueries";

export const documentMocks: MockedResponse[] = [
  {
    request: {
      query: DOCUMENT_TABLE_QUERY,
    },
    result: {
      data: [
        {
          id: "1",
          title: "Project Plan",
          description: "Initial project planning document.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Alice",
          },
          uploadDate: new Date("2025-07-01"),
        },
        {
          id: "2",
          title: "Final Report",
          description: "Comprehensive final report.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Bob",
          },
          uploadDate: new Date("2025-07-10"),
        },
        {
          id: "3",
          title: "Budget Summary",
          description: "Q2 budget breakdown.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Cara",
          },
          uploadDate: new Date("2025-07-05"),
        },
        {
          id: "4",
          title: "Technical Specification",
          description: "System specs and integration notes.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "David",
          },
          uploadDate: new Date("2025-07-07"),
        },
        {
          id: "5",
          title: "Policy Brief",
          description: "Summary of proposed policy changes.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Ella",
          },
          uploadDate: new Date("2025-07-03"),
        },
        {
          id: "6",
          title: "Design Document",
          description: "Wireframes and layout sketches.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Frank",
          },
          uploadDate: new Date("2025-07-02"),
        },
        {
          id: "7",
          title: "User Guide",
          description: "Instructions for system users.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Grace",
          },
          uploadDate: new Date("2025-07-08"),
        },
        {
          id: "8",
          title: "Meeting Notes",
          description: "Summary of July planning meeting.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Henry",
          },
          uploadDate: new Date("2025-07-04"),
        },
        {
          id: "9",
          title: "Test Plan",
          description: "Outline of QA strategy and schedule.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Ivy",
          },
          uploadDate: new Date("2025-07-06"),
        },
        {
          id: "10",
          title: "Risk Assessment",
          description: "Identified risks and mitigation steps.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Jack",
          },
          uploadDate: new Date("2025-07-09"),
        },
        {
          id: "11",
          title: "Timeline Overview",
          description: "Project timeline and milestones.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Karen",
          },
          uploadDate: new Date("2025-07-11"),
        },
        {
          id: "12",
          title: "Contract Draft",
          description: "Initial draft for vendor agreement.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Leo",
          },
          uploadDate: new Date("2025-07-12"),
        },
        {
          id: "13",
          title: "Legal Review",
          description: "Legal team's review comments.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Maya",
          },
          uploadDate: new Date("2025-07-13"),
        },
        {
          id: "14",
          title: "Presentation Slides",
          description: "Slide deck for stakeholder meeting.",
          documentType: {
            name: "Pre-Submission Concept",
          },
          uploadedBy: {
            fullName: "Nina",
          },
          uploadDate: new Date("2025-07-14"),
        },
        {
          id: "15",
          title: "Feedback Summary",
          description: "Stakeholder feedback collected in July.",
          documentType: {
            name: "General File",
          },
          uploadedBy: {
            fullName: "Owen",
          },
          uploadDate: new Date("2025-07-15"),
        },
      ] satisfies DocumentTableRow[],
    },
  },
];
