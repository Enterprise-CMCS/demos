import { Demonstration } from "demos-server";

export const summaryDemonstration: Demonstration = {
  id: "demo-1",
  name: "Sample Demonstration",
  state: { id: "CA", name: "California" },
  projectOfficer: { fullName: "Admiral Gial Ackbar" },
  users: [{ id: "1", fullName: "Admiral Gial Ackbar" }],
  demonstrationStatus: { name: "Active" },
  effectiveDate: new Date("2024-01-15"),
  expirationDate: new Date("2025-12-31"),
  description: "Sample description",
} as Demonstration;
