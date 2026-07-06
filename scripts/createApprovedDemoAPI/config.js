/* global process */

export const SEED_CONFIG = {
  fallbackDatabaseUrl: "postgresql://localhost:5432/demos?schema=demos_app",
  demoNameSuffix: "Generated Approved Demonstration",
  demoDescription: "Approved demonstration created by createApprovedDemoAPI.",
  stateId: process.env.APPROVED_DEMO_STATE_ID ?? "MD",
  sdgDivisionId:
    process.env.APPROVED_DEMO_SDG_DIVISION ??
    "Division of System Reform Demonstrations",
  demonstrationType:
    process.env.APPROVED_DEMO_TYPE ?? "Serious Mental Illness (SMI)",
  documentPath:
    process.env.APPROVED_DEMO_DOCUMENT_PATH ??
    "/workspaces/demos/junk_drawer/DEMOS DOCS/AAA_nothing_doc.pdf",
  effectiveDateLookbackMonths: 6,
  demoWindowYears: 5,
  processedUploadTimeoutMs: 30_000,
  processedUploadPollMs: 500,
  fallbackProjectOfficerUsername: "approved_demo_project_officer",
  fallbackProjectOfficerEmail: "approved_demo_project_officer@example.com",
  fallbackProjectOfficerFirstName: "Approved Demo",
  fallbackProjectOfficerLastName: "Project Officer",
};

export const APPLICATION_TYPE_ID = "Demonstration";
export const CLEARANCE_LEVEL_ID = "CMS (OSORA)";
export const COMPLETED_PHASE_STATUS_ID = "Completed";
export const DEMONSTRATION_GRANT_LEVEL_ID = "Demonstration";
export const EXPECTED_FINAL_STATUS_ID = "Approved";
export const PERSON_TYPE_ID = "demos-cms-user";
export const PROJECT_OFFICER_ROLE_ID = "Project Officer";
export const SYSTEM_GRANT_LEVEL_ID = "System";
export const SYSTEM_ROLE_ID = "CMS User";

export const PHASES = [
  "Concept",
  "Application Intake",
  "Completeness",
  "Federal Comment",
  "SDG Preparation",
  "Review",
  "Approval Package",
  "Approval Summary",
];

export const PHASE_DOCUMENTS = [
  { phaseName: "Concept", documentTypes: ["Pre-Submission"] },
  { phaseName: "Application Intake", documentTypes: ["State Application"] },
  {
    phaseName: "Completeness",
    documentTypes: ["Application Completeness Letter", "Internal Completeness Review Form"],
  },
];

export const APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE = [
  ["Concept Paper Submitted Date", 100],
  ["State Application Submitted Date", 96],
  ["Completeness Review Due Date", 81],
  ["State Application Deemed Complete", 86],
  ["Federal Comment Period Start Date", 85],
  ["Federal Comment Period End Date", 55],
  ["Expected Approval Date", 80],
  ["SME Initial Review Date", 79],
  ["FRT Initial Meeting Date", 78],
  ["BNPMT Initial Meeting Date", 77],
  ["OGD Approval to Share with SMEs", 75],
  ["Draft Approval Package to Prep", 74],
  ["DDME Approval Received", 73],
  ["State Concurrence", 72],
  ["BN PMT Approval to Send to OMB", 71],
  ["Draft Approval Package Shared", 70],
  ["Receive OMB Concurrence", 69],
  ["Receive OGC Legal Clearance", 68],
  ["Submit Approval Package to OSORA", 67],
  ["OSORA R1 Comments Due", 66],
  ["OSORA R2 Comments Due", 65],
  ["CMS (OSORA) Clearance End", 64],
  ["Application Details Marked Complete Date", 61],
  ["Application Demonstration Types Marked Complete Date", 61],
  ["Application Approval Date", 60],
];
