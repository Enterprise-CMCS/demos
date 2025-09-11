export const ROLES = [
  "Project Officer",
  "State Point of Contact",
  "DDME Analyst",
  "Policy Technical Director",
  "Monitoring & Evaluation Technical Director",
  "All Users",
] as const;

export const PERSON_TYPES = [
  "demos-admin",
  "demos-cms-user",
  "demos-state-user",
  "non-user-contact",
] as const;

export const GRANT_LEVELS = ["System", "Demonstration"] as const;

export const BUNDLE_TYPE = {
  DEMONSTRATION: "DEMONSTRATION",
  AMENDMENT: "AMENDMENT",
  EXTENSION: "EXTENSION",
} as const;

export const SIGNATURE_LEVEL = ["OA", "OCD", "OGD"] as const;

export const CMCS_DIVISION = [
  "Division of System Reform Demonstrations",
  "Division of Eligibility and Coverage Demonstrations",
] as const;

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

export const PHASE = ["None", "Concept", "State Application", "Completeness"] as const;

export const PHASE_STATUS = ["Not Started", "Started", "Completed", "Skipped"] as const;

export const DATE_TYPES = [
  "Start Date",
  "Completion Date",
  "Pre-Submission Submitted Date",
  "State Application Submitted Date",
  "Completeness Review Due Date",
  "Completeness Due Date",
  "State Application Deemed Complete",
  "Federal Comment Period Start Date",
  "Federal Comment Period End Date",
];
