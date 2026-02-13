import { DateType, DocumentType, ExpectedTimestamp, PhaseNameWithTrackedStatus } from "./types.js";

export const CLEARANCE_LEVELS = ["COMMs", "CMS (OSORA)"] as const;

export const APPLICATION_STATUS = [
  "Pre-Submission",
  "Under Review",
  "Approved",
  "Denied",
  "Withdrawn",
  "On-hold",
] as const;

export const DEMONSTRATION_TYPE_STATUSES = ["Expired", "Pending", "Active"] as const;

export const ROLES = [
  "Project Officer",
  "State Point of Contact",
  "DDME Analyst",
  "Policy Technical Director",
  "Monitoring & Evaluation Technical Director",
  "All Users",
] as const;

export const CONTACT_TYPES = ["DDME Analyst", "Project Officer", "State Point of Contact"] as const;

export const ADMIN_DEMONSTRATION_ROLES = ROLES;

export const CMS_USER_DEMONSTRATION_ROLES = [
  "Project Officer",
  "DDME Analyst",
  "Policy Technical Director",
  "Monitoring & Evaluation Technical Director",
] as const;

export const STATE_USER_DEMONSTRATION_ROLES = ["State Point of Contact"] as const;

export const PERSON_TYPES = [
  "demos-admin",
  "demos-cms-user",
  "demos-state-user",
  "non-user-contact",
] as const;

export const GRANT_LEVELS = ["System", "Demonstration"] as const;

export const APPLICATION_TYPES = ["Demonstration", "Amendment", "Extension"] as const;

export const SIGNATURE_LEVEL = ["OA", "OCD", "OGD"] as const;

export const SDG_DIVISIONS = [
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
  "Special Terms & Conditions",
  "State Application",
] as const;

export const PHASE_NAMES_WITH_TRACKED_STATUS = [
  "Concept",
  "Application Intake",
  "Completeness",
  "Federal Comment",
  "SDG Preparation",
  "Review",
  "Approval Package",
  "Approval Summary",
] as const;

export const PHASE_NAME = ["None", ...PHASE_NAMES_WITH_TRACKED_STATUS] as const;

export const PHASE_STATUS = [
  "Not Started",
  "Started",
  "Completed",
  "Incomplete",
  "Skipped",
] as const;

export const CMS_OSORA_CLEARANCE_DATE_TYPES = [
  "Submit Approval Package to OSORA",
  "OSORA R1 Comments Due",
  "OSORA R2 Comments Due",
  "CMS (OSORA) Clearance End",
] as const;

export const COMMS_CLEARANCE_DATE_TYPES = [
  "Package Sent for COMMs Clearance",
  "COMMs Clearance Received",
] as const;

export const REVIEW_PHASE_DATE_TYPES = [
  "OGD Approval to Share with SMEs",
  "Draft Approval Package to Prep",
  "DDME Approval Received",
  "State Concurrence",
  "BN PMT Approval to Send to OMB",
  "Draft Approval Package Shared",
  "Receive OMB Concurrence",
  "Receive OGC Legal Clearance",
  ...CMS_OSORA_CLEARANCE_DATE_TYPES,
  ...COMMS_CLEARANCE_DATE_TYPES,
] as const;

export const DATE_TYPES = [
  "Concept Start Date",
  "Pre-Submission Submitted Date",
  "Concept Completion Date",
  "Concept Skipped Date",
  "Application Intake Start Date",
  "State Application Submitted Date",
  "Completeness Review Due Date",
  "Application Intake Completion Date",
  "Completeness Start Date",
  "State Application Deemed Complete",
  "Federal Comment Period Start Date",
  "Federal Comment Period End Date",
  "Completeness Completion Date",
  "SDG Preparation Start Date",
  "Expected Approval Date",
  "SME Review Date",
  "FRT Initial Meeting Date",
  "BNPMT Initial Meeting Date",
  "SDG Preparation Completion Date",
  "Review Start Date",
  "Review Completion Date",
  "Approval Package Start Date",
  "Approval Package Completion Date",
  ...REVIEW_PHASE_DATE_TYPES,
  "Application Details Marked Complete Date",
  "Application Demonstration Types Marked Complete Date",
  "Approval Summary Start Date",
  "Approval Summary Completion Date",
] as const;

export const EXPECTED_TIMESTAMPS = ["Start of Day", "End of Day"] as const;

type DateTypeExpectedTimestampRecord = Record<DateType, { expectedTimestamp: ExpectedTimestamp }>;

export const DATE_TYPES_WITH_EXPECTED_TIMESTAMPS: DateTypeExpectedTimestampRecord = {
  "Concept Start Date": { expectedTimestamp: "Start of Day" },
  "Pre-Submission Submitted Date": { expectedTimestamp: "Start of Day" },
  "Concept Completion Date": { expectedTimestamp: "Start of Day" },
  "Concept Skipped Date": { expectedTimestamp: "Start of Day" },
  "Application Intake Start Date": { expectedTimestamp: "Start of Day" },
  "State Application Submitted Date": { expectedTimestamp: "Start of Day" },
  "Completeness Review Due Date": { expectedTimestamp: "End of Day" },
  "Application Intake Completion Date": { expectedTimestamp: "Start of Day" },
  "Completeness Start Date": { expectedTimestamp: "Start of Day" },
  "State Application Deemed Complete": { expectedTimestamp: "Start of Day" },
  "Federal Comment Period Start Date": { expectedTimestamp: "Start of Day" },
  "Federal Comment Period End Date": { expectedTimestamp: "End of Day" },
  "Completeness Completion Date": { expectedTimestamp: "Start of Day" },
  "SDG Preparation Start Date": { expectedTimestamp: "Start of Day" },
  "Expected Approval Date": { expectedTimestamp: "Start of Day" },
  "SME Review Date": { expectedTimestamp: "Start of Day" },
  "FRT Initial Meeting Date": { expectedTimestamp: "Start of Day" },
  "BNPMT Initial Meeting Date": { expectedTimestamp: "Start of Day" },
  "SDG Preparation Completion Date": { expectedTimestamp: "Start of Day" },
  "Review Start Date": { expectedTimestamp: "Start of Day" },
  "Review Completion Date": { expectedTimestamp: "Start of Day" },
  "OGD Approval to Share with SMEs": { expectedTimestamp: "Start of Day" },
  "Draft Approval Package to Prep": { expectedTimestamp: "Start of Day" },
  "DDME Approval Received": { expectedTimestamp: "Start of Day" },
  "State Concurrence": { expectedTimestamp: "Start of Day" },
  "BN PMT Approval to Send to OMB": { expectedTimestamp: "Start of Day" },
  "Draft Approval Package Shared": { expectedTimestamp: "Start of Day" },
  "Receive OMB Concurrence": { expectedTimestamp: "Start of Day" },
  "Receive OGC Legal Clearance": { expectedTimestamp: "Start of Day" },
  "Approval Package Start Date": { expectedTimestamp: "Start of Day" },
  "Approval Package Completion Date": { expectedTimestamp: "Start of Day" },
  "COMMs Clearance Received": { expectedTimestamp: "Start of Day" },
  "Submit Approval Package to OSORA": { expectedTimestamp: "Start of Day" },
  "Package Sent for COMMs Clearance": { expectedTimestamp: "Start of Day" },
  "OSORA R1 Comments Due": { expectedTimestamp: "End of Day" },
  "OSORA R2 Comments Due": { expectedTimestamp: "End of Day" },
  "CMS (OSORA) Clearance End": { expectedTimestamp: "End of Day" },
  "Application Details Marked Complete Date": { expectedTimestamp: "Start of Day" },
  "Application Demonstration Types Marked Complete Date": { expectedTimestamp: "Start of Day" },
  "Approval Summary Start Date": { expectedTimestamp: "Start of Day" },
  "Approval Summary Completion Date": { expectedTimestamp: "Start of Day" },
} as const;

export const STATES_AND_TERRITORIES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
  { id: "AS", name: "American Samoa" },
  { id: "DC", name: "District of Columbia" },
  { id: "GU", name: "Guam" },
  { id: "MP", name: "Northern Mariana Islands" },
  { id: "PR", name: "Puerto Rico" },
  { id: "VI", name: "Virgin Islands" },
] as const;

export const LOG_LEVELS = [
  "emerg",
  "alert",
  "crit",
  "err",
  "warning",
  "notice",
  "info",
  "debug",
] as const;

export const EVENT_TYPES = [
  "Login Succeeded",
  "Login Failed",
  "Logout Succeeded",
  "Logout Failed",
  "Create Demonstration Succeeded",
  "Create Demonstration Failed",
  "Create Extension Succeeded",
  "Create Extension Failed",
  "Create Amendment Succeeded",
  "Create Amendment Failed",
  "Edit Demonstration Succeeded",
  "Edit Demonstration Failed",
  "Delete Demonstration Succeeded",
  "Delete Demonstration Failed",
  "Delete Document Succeeded",
  "Delete Document Failed",
] as const;

export const NONE_PHASE_DOCUMENTS: DocumentType[] = [
  "Application Completeness Letter",
  "Approval Letter",
  "Final BN Worksheet",
  "Final Budget Neutrality Formulation Workbook",
  "Formal OMB Policy Concurrence Email",
  "Internal Completeness Review Form",
  "Payment Ratio Analysis",
  "Pre-Submission",
  "Q&A",
  "Signed Decision Memo",
  "State Application",
  "General File",
] as const;

export const CONCEPT_PHASE_DOCUMENTS: DocumentType[] = ["General File", "Pre-Submission"] as const;

export const APPLICATION_INTAKE_PHASE_DOCUMENTS: DocumentType[] = [
  "General File",
  "State Application",
] as const;

export const REVIEW_PHASE_NOTE_TYPES = [
  "PO and OGD",
  "OGC and OMB",
  "COMMs Clearance",
  "CMS (OSORA) Clearance",
] as const;

export const NOTE_TYPES = [...REVIEW_PHASE_NOTE_TYPES] as const;

export const COMPLETENESS_PHASE_DOCUMENTS: DocumentType[] = [
  "General File",
  "Internal Completeness Review Form",
  "Application Completeness Letter",
] as const;
export const FEDERAL_COMMENT_PHASE_DOCUMENTS: DocumentType[] = ["General File"] as const;

export const SDG_PREPARATION_PHASE_DOCUMENTS: DocumentType[] = ["General File"] as const;

export const REVIEW_PHASE_DOCUMENTS: DocumentType[] = ["General File"] as const;

export const APPROVAL_PACKAGE_PHASE_DOCUMENTS: DocumentType[] = [
  "General File",
  "Approval Letter",
  "Final BN Worksheet",
  "Final Budget Neutrality Formulation Workbook",
  "Formal OMB Policy Concurrence Email",
  "Payment Ratio Analysis",
  "Q&A",
  "Signed Decision Memo",
] as const;

export const APPROVAL_SUMMARY_PHASE_DOCUMENTS: DocumentType[] = ["General File"] as const;

export const PHASE_DOCUMENT_TYPE_MAP = {
  None: NONE_PHASE_DOCUMENTS,
  Concept: CONCEPT_PHASE_DOCUMENTS,
  "Application Intake": APPLICATION_INTAKE_PHASE_DOCUMENTS,
  Completeness: COMPLETENESS_PHASE_DOCUMENTS,
  "Federal Comment": FEDERAL_COMMENT_PHASE_DOCUMENTS,
  "SDG Preparation": SDG_PREPARATION_PHASE_DOCUMENTS,
  Review: REVIEW_PHASE_DOCUMENTS,
  "Approval Package": APPROVAL_PACKAGE_PHASE_DOCUMENTS,
  "Approval Summary": APPROVAL_SUMMARY_PHASE_DOCUMENTS,
};

type PhaseStartEndDateRecord = Record<
  PhaseNameWithTrackedStatus,
  { startDate?: DateType; endDate?: DateType }
>;
export const PHASE_START_END_DATES: PhaseStartEndDateRecord = {
  Concept: { startDate: "Concept Start Date", endDate: "Concept Completion Date" },
  "Application Intake": {
    startDate: "Application Intake Start Date",
    endDate: "Application Intake Completion Date",
  },
  Completeness: { startDate: "Completeness Start Date", endDate: "Completeness Completion Date" },
  "Federal Comment": {
    startDate: "Federal Comment Period Start Date",
    endDate: "Federal Comment Period End Date",
  },
  "SDG Preparation": {
    startDate: "SDG Preparation Start Date",
    endDate: "SDG Preparation Completion Date",
  },
  Review: { startDate: "Review Start Date", endDate: "Review Completion Date" },
  "Approval Package": {
    startDate: "Approval Package Start Date",
    endDate: "Approval Package Completion Date",
  },
  "Approval Summary": {},
};

export const TAG_CONFIGURATION_STATUSES = ["Unreviewed", "Approved"] as const;

export const TAG_CONFIGURATION_SOURCES = ["User", "System"] as const;

export const TAG_TYPES = ["Application", "Demonstration Type"] as const;

export const DEMONSTRATION_TYPE_TAGS: string[] = [
  "Aggregate Cap",
  "Annual Limits",
  "Basic Health Plan (BHP)",
  "Behavioral Health",
  "Beneficiary Engagement",
  "Children's Health Insurance Program (CHIP)",
  "CMMI - AHEAD",
  "CMMI - Integrated Care for Kids (IncK)",
  "CMMI - Maternal Opioid Misuse (MOM)",
  "Community Engagement",
  "Contingency Management",
  "Continuous Eligibility",
  "Delivery System Reform Incentive Payment (DSRIP)",
  "Dental",
  "Designated State Health Programs (DSHP)",
  "Employment Supports",
  "Enrollment Cap",
  "End-Stage Renal Disease (ESRD)",
  "Expenditure Cap",
  "Former Foster Care Youth (FFCY)",
  "Global Payment Program (GPP)",
  "Health Equity",
  "Health-Related Social Needs (HRSN)",
  "Healthy Behavior Incentives",
  "HIV",
  "Home Community Based Services (HCBS)",
  "Lead Exposure",
  "Lifetime Limits",
  "Long-Term Services and Supports (LTSS)",
  "Managed Care",
  "Marketplace Coverage/Premium Assistance Wrap",
  "New Adult Group Expansion",
  "Non-Eligibility Period",
  "Non-Emergency Medical Transportation (NEMT)",
  "Partial Expansion of the New Adult Group",
  "Pharmacy",
  "PHE-Appendix K",
  "PHE-COVID-19",
  "PHE-Reasonable Opportunity Period (ROP)",
  "PHE-Risk Mitigation",
  "PHE-Vaccine Coverage",
  "Premium Assistance/Employer-Sponsored Health Insurance (ESI)/Qualified Health Plan (QHP)",
  "Premiums/Cost-Sharing",
  "Provider Cap",
  "Provider Restriction",
  "ReEntry",
  "Reproductive Health: Family Planning",
  "Reproductive Health: Fertility",
  "Reproductive Health: Hyde",
  "Reproductive Health: Maternal Health",
  "Reproductive Health: Post-Partum Extension",
  "Reproductive Health: RAD",
  "Retroactive Eligibility",
  "Serious Mental Illness (SMI)",
  "Special Needs",
  "Substance Use Disorder (SUD)",
  "Targeted Population Expansion",
  "Tribal",
  "Uncompensated Care",
  "Value Based Care (VBC)",
  "Vision",
] as const;

export const UIPATH_PROJECT_NAME = "demosOCR";
