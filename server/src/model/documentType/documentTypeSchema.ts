import gql from "graphql-tag";

export const DOCUMENT_TYPES = [
  "Application Completeness Letter",
  "Approval Letter",
  "Final BN Worksheet",
  "Final Budget Neutrality Formulation Workbook",
  "Formal OMB Policy Concurrence Email",
  "General File",
  "Internal Completeness Review Form",
  "Payment Ratio Analysis",
  "Pre-Submission",
  "Q&A",
  "Signed Decision Memo",
  "State Application",
] as const;

export const documentTypeSchema = gql`
  """
  A string representing a document type. Expected values are:
  - Application Completeness Letter
  - Approval Letter
  - Final BN Worksheet
  - Final Budget Neutrality Formulation Workbook
  - Formal OMB Policy Concurrence Email
  - General File
  - Internal Completeness Review Form
  - Payment Ratio Analysis
  - Pre-Submission
  - Q&A
  - Signed Decision Memo
  - State Application
  """
  scalar DocumentType
`;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
