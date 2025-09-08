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

export const PHASE = [
  "None",
  "Concept",
  "State Application",
  "Completeness",
] as const;

export const PHASE_STATUS = [
  "Not Started",
  "Started",
  "Completed",
  "Skipped",
] as const;
