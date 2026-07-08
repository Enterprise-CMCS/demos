/**
Suppresses: node:61989 - DeprecationWarning: client.query()
*/
const PG_CONCURRENT_QUERY_DEPRECATION =
  "Calling client.query() when the client is already executing a query is deprecated";
const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = (warning, ...args) => {
  const message = warning instanceof Error ? warning.message : String(warning);

  if (message.includes(PG_CONCURRENT_QUERY_DEPRECATION)) {
    return;
  }

  return originalEmitWarning(warning, ...args);
};

export const SEED_CONFIG = {
  fallbackDatabaseUrl: "postgresql://localhost:5432/demos?schema=demos_app",
  demoNameSuffix: "Generated Approved Demonstration",
  demoDescription: "Approved demonstration created by createApprovedDemoAPI.",
  sdgDivisionId:
    process.env.APPROVED_DEMO_SDG_DIVISION ??
    "Division of System Reform Demonstrations",
  documentPath:
    process.env.APPROVED_DEMO_DOCUMENT_PATH ??
    "/workspaces/demos/junk_drawer/DEMOS DOCS/AAA_nothing_doc.pdf",
  effectiveDateLookbackMonths: 6,
  demoWindowYears: 5,
  processedUploadTimeoutMs: 30_000,
  processedUploadPollMs: 500,
  projectOfficerUserId:
    process.env.APPROVED_DEMO_PROJECT_OFFICER_USER_ID ??
    "MAKE AN .env",
};

export const EXPECTED_FINAL_STATUS_ID = "Approved";
export const COMPLETED_PHASE_STATUS_ID = "Completed";
export const PERSON_TYPE_ID = "demos-cms-user";
export const RANDOMIZED_HEALTH_FOCUS_TYPES = [
  "Health-Related Social Needs (HRSN)",
  "Substance Use Disorder (SUD)",
  "Dental",
  "Serious Mental Illness (SMI)",
  "Special Needs",
];

export const APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE = [
  ["Concept Paper Submitted Date", 100],
  ["State Application Submitted Date", 76],
  ["Completeness Review Due Date", 61],
  ["State Application Deemed Complete", 61],
  ["Federal Comment Period Start Date", 60],
  ["Federal Comment Period End Date", 30],
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
