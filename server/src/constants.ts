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

export const DOCUMENT_TYPES = ["preSubmissionConcept", "generalFile", "other"] as const;
