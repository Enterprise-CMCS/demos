import { Demonstration } from "demos-server";

export const summaryDemonstration: Demonstration = {
  id: "demo-1",
  name: "Sample Demonstration",
  state: { id: "CA", name: "California" },
  projectOfficer: { fullName: "Admiral Gial Ackbar" },
  users: [{ id: "1", fullName: "Admiral Gial Ackbar" }],
  demonstrationStatus: { name: "Active" },
  effectiveDate: new Date(),
  expirationDate: new Date(),
  description: "Sample description",
} as Demonstration;
