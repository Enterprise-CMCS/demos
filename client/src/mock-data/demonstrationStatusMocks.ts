import { DemonstrationStatus } from "demos-server";

export const activeDemonstrationStatus: DemonstrationStatus = {
  id: "1",
  name: "Active",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Active Demonstration Status",
};

export const demonstrationStatusOptions: Pick<DemonstrationStatus, "name">[] = [
  { name: "Approved" },
  { name: "Pending" },
  { name: "Expired" },
  { name: "Withdrawn" },
  { name: "Rejected" },
  { name: "Active" },
  { name: "Inactive" },
];
