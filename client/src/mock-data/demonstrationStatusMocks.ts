import { DemonstrationStatus } from "demos-server";

import { MockedResponse } from "@apollo/client/testing";

export const activeDemonstrationStatus: DemonstrationStatus = {
  id: "1",
  name: "Active",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  description: "Active Demonstration Status",
  demonstrations: [],
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
