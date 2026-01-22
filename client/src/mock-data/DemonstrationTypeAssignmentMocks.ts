import { Tag } from "demos-server";

// TODO: replace this with server type with updated DemonstrationTypeName field when available
export type MockDemonstrationTypeAssignment = {
  demonstrationTypeName: Tag;
  effectiveDate: Date;
  expirationDate: Date;
};

export const MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS: MockDemonstrationTypeAssignment[] = [
  {
    demonstrationTypeName: "Aggregate Cap",
    effectiveDate: new Date("2025-01-01"),
    expirationDate: new Date("2025-12-31"),
  },
  {
    demonstrationTypeName: "Annual Limits",
    effectiveDate: new Date("2025-02-01"),
    expirationDate: new Date("2025-11-30"),
  },
  {
    demonstrationTypeName: "Basic Health Plan (BHP)",
    effectiveDate: new Date("2025-03-01"),
    expirationDate: new Date("2025-10-31"),
  },
];
