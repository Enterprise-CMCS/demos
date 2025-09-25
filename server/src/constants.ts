export const BUNDLE_STATUS = [
  "Pre-Submission",
  "Under Review",
  "Approved",
  "Denied",
  "Withdrawn",
  "On-hold",
] as const;

export const ROLES = [
  "Project Officer",
  "State Point of Contact",
  "DDME Analyst",
  "Policy Technical Director",
  "Monitoring & Evaluation Technical Director",
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

export const PHASE = [
  "None",
  "Concept",
  "State Application",
  "Completeness",
  "Federal Comment",
  "SME/FRT",
  "OGC & OMB",
  "Approval Package",
  "Post Approval",
] as const;

export const PHASE_STATUS = ["Not Started", "Started", "Completed", "Skipped"] as const;

export const DATE_TYPES = [
  "Start Date",
  "Pre-Submission Submitted Date",
  "State Application Submitted Date",
  "State Application Deemed Complete",
  "Completeness Review Due Date",
  "Completeness Due Date",
  "Federal Comment Period Start Date",
  "Federal Comment Period End Date",
  "Completion Date",
] as const;

// US States and Territories
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
  { id: "FM", name: "Federated States of Micronesia" },
  { id: "GU", name: "Guam" },
  { id: "MH", name: "Marshall Islands" },
  { id: "MP", name: "Northern Mariana Islands" },
  { id: "PW", name: "Palau" },
  { id: "PR", name: "Puerto Rico" },
  { id: "VI", name: "Virgin Islands" },
] as const;
