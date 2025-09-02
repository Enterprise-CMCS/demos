import { DemonstrationStatus } from "demos-server";

export type MockDemonstrationStatus = Pick<DemonstrationStatus, "id" | "name">;

export const mockDemonstrationStatuses: MockDemonstrationStatus[] = [
  { id: "1", name: "Pending" },
  { id: "2", name: "Approved" },
  { id: "3", name: "Active" },
  { id: "4", name: "Rejected" },
  { id: "5", name: "Inactive" },
  { id: "6", name: "Expired" },
  { id: "7", name: "Withdrawn" },
];
