import { DemonstrationTypeAssignment as ServerDemonstrationTypeAssignment } from "demos-server";

export type MockDemonstrationTypeAssignment = Pick<
  ServerDemonstrationTypeAssignment,
  "demonstrationType" | "effectiveDate" | "expirationDate"
>;

export const MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS: MockDemonstrationTypeAssignment[] = [
  {
    demonstrationType: "Aggregate Cap",
    effectiveDate: new Date("2025-01-01"),
    expirationDate: new Date("2025-12-31"),
  },
  {
    demonstrationType: "Annual Limits",
    effectiveDate: new Date("2025-02-01"),
    expirationDate: new Date("2025-11-30"),
  },
  {
    demonstrationType: "Basic Health Plan (BHP)",
    effectiveDate: new Date("2025-03-01"),
    expirationDate: new Date("2025-10-31"),
  },
];
